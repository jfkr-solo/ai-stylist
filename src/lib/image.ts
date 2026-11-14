"use client";

/** 画像ファイルを読み込み、最大辺を maxSize に縮小した data URL を返す */
export async function loadAndResize(file: File, maxSize = 900): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("画像を読み込めませんでした"));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 簡易背景除去：四隅の色を背景色とみなし、外周から連続する近い色の画素を透過する（フラッドフィル）。
 * 無地の床・壁の上で撮った写真向け。本格的な切り抜きは外部API（remove.bg / Pixelcut 等）に置き換える想定。
 */
export function removeBackground(canvas: HTMLCanvasElement, tolerance = 42): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1];
  const bg = corners
    .map((i) => [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]])
    .reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const i = stack.pop()!;
    if (visited[i]) continue;
    visited[i] = 1;
    const o = i * 4;
    const dr = px[o] - bg[0], dg = px[o + 1] - bg[1], db = px[o + 2] - bg[2];
    if (dr * dr + dg * dg + db * db > tol2) continue;
    px[o + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  ctx.putImageData(data, 0, 0);
  return trimTransparent(canvas);
}

/** 透明な余白を切り詰める */
function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const px = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX < 0) return canvas;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** キャンバスを複製する（removeBackground は元のキャンバスを書き換えるため） */
export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, transparent: boolean): string {
  if (transparent) {
    const webp = canvas.toDataURL("image/webp", 0.86);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

/**
 * data URL の画像を最大辺 maxSize に縮小して返す（AI試着APIへ送るサイズを抑えるため）。
 * data URL 以外（/mock/... や Supabase の URL）はサーバー側で読むのでそのまま返す。
 */
export async function shrinkDataUrl(url: string, maxSize = 1024): Promise<string> {
  if (!url.startsWith("data:")) return url;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("画像を読み込めませんでした"));
    i.src = url;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  if (scale === 1 && url.length < 1_500_000) return url;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  // WebP 非対応のブラウザ（古い Safari）は PNG になる。どちらも透過を保てる
  return canvas.toDataURL("image/webp", 0.9);
}
