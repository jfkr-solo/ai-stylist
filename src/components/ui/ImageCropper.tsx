"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type CropAspect = { id: string; label: string; ratio: number | null }; // ratio = 幅/高さ。null は元画像の比率

const MAX_ZOOM = 5;

type View = { s: number; tx: number; ty: number }; // s: 枠いっぱい(cover)を1とした倍率、tx/ty: 枠中心からの画像中心のずれ(px)

/**
 * 写真の大きさ・位置を調整して切り抜くフルスクリーンのエディタ。
 * ドラッグで移動、ピンチ / スライダー / ホイールで拡大縮小。iPhone Safari のタッチ操作に対応。
 */
export function ImageCropper({
  file,
  aspects,
  initialAspect,
  maxSize,
  guide,
  title = "サイズと位置を調整",
  onCancel,
  onConfirm,
}: {
  file: File;
  aspects: CropAspect[];
  initialAspect?: string;
  /** 出力画像の最大辺(px) */
  maxSize: number;
  /** 全身写真用の撮影ガイド（頭・足の位置）を表示 */
  guide?: "body";
  title?: string;
  onCancel: () => void;
  onConfirm: (canvas: HTMLCanvasElement) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectId, setAspectId] = useState(initialAspect ?? aspects[0].id);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ s: 1, tx: 0, ty: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ view: View; mid: { x: number; y: number }; dist: number } | null>(null);

  // 画像読み込み
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setError("画像を読み込めませんでした");
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 背面のスクロール・iOS のページ拡大を抑止
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
    };
  }, []);

  const aspect = aspects.find((a) => a.id === aspectId) ?? aspects[0];
  const ratio = aspect.ratio ?? (img ? img.naturalWidth / img.naturalHeight : 1);

  // 枠のサイズを表示領域に収まるよう計算
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const fit = () => {
      const aw = area.clientWidth;
      const ah = area.clientHeight;
      if (!aw || !ah) return;
      const w = Math.min(aw, ah * ratio);
      setFrame({ w, h: w / ratio });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(area);
    return () => ro.disconnect();
  }, [ratio]);

  // 枠の比率が変わったら初期表示に戻す
  useEffect(() => setView({ s: 1, tx: 0, ty: 0 }), [ratio]);

  const base = img && frame.w ? Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight) : 0;

  /** 画像が常に枠を覆うように倍率・位置を制限 */
  const clamp = useCallback(
    (v: View): View => {
      if (!img || !base) return v;
      const s = Math.min(MAX_ZOOM, Math.max(1, v.s));
      const dw = img.naturalWidth * base * s;
      const dh = img.naturalHeight * base * s;
      const mx = Math.max(0, (dw - frame.w) / 2);
      const my = Math.max(0, (dh - frame.h) / 2);
      return { s, tx: Math.min(mx, Math.max(-mx, v.tx)), ty: Math.min(my, Math.max(-my, v.ty)) };
    },
    [img, base, frame.w, frame.h],
  );

  /** 枠内の点 (px, py) を中心に倍率を変える */
  const zoomAt = useCallback(
    (from: View, s: number, px: number, py: number, dx = 0, dy = 0): View => {
      const cx = px - frame.w / 2;
      const cy = py - frame.h / 2;
      const k = Math.min(MAX_ZOOM, Math.max(1, s)) / from.s;
      return clamp({ s, tx: cx + dx - (cx - from.tx) * k, ty: cy + dy - (cy - from.ty) * k });
    },
    [clamp, frame.w, frame.h],
  );

  function localPoint(e: { clientX: number; clientY: number }) {
    const r = frameRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startGesture() {
    const pts = [...pointers.current.values()];
    if (pts.length === 0) return (gesture.current = null);
    const mid = pts.length > 1 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { view, mid, dist };
  }

  function onPointerDown(e: React.PointerEvent) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    pointers.current.set(e.pointerId, localPoint(e));
    startGesture();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, localPoint(e));
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length > 1 && g.dist > 0) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setView(zoomAt(g.view, g.view.s * (dist / g.dist), g.mid.x, g.mid.y, mid.x - g.mid.x, mid.y - g.mid.y));
    } else {
      setView(clamp({ ...g.view, tx: g.view.tx + pts[0].x - g.mid.x, ty: g.view.ty + pts[0].y - g.mid.y }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    startGesture();
  }

  // ホイール（PC）。passive: false にするため addEventListener で登録
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = localPoint(e);
      setView((v) => zoomAt(v, v.s * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function confirm() {
    if (!img || !base) return;
    const scale = base * view.s; // 元画像px → 表示px
    const cw = frame.w / scale;
    const ch = frame.h / scale;
    const sx = img.naturalWidth / 2 - view.tx / scale - cw / 2;
    const sy = img.naturalHeight / 2 - view.ty / scale - ch / 2;
    const out = Math.min(1, maxSize / Math.max(cw, ch));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cw * out));
    canvas.height = Math.max(1, Math.round(ch * out));
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
    onConfirm(canvas);
  }

  const pct = Math.round(view.s * 100);

  // モーダル（transform あり）の中でも画面全体を覆うよう body 直下に描画
  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink text-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <button type="button" className="min-h-11 rounded-full px-4 text-sm font-semibold text-white/80 active:bg-white/10" onClick={onCancel}>
          キャンセル
        </button>
        <h2 className="text-sm font-bold">{title}</h2>
        <button
          type="button"
          className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-ink active:scale-[.97] disabled:opacity-40"
          onClick={confirm}
          disabled={!img}
        >
          決定
        </button>
      </div>

      <div ref={areaRef} className="relative mx-4 min-h-0 flex-1">
        <div className="absolute inset-0 grid place-items-center">
          <div
            ref={frameRef}
            className="relative touch-none select-none overflow-hidden rounded-xl bg-black/40 outline outline-2 outline-white/90"
            style={{ width: frame.w, height: frame.h, WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={() => setView({ s: 1, tx: 0, ty: 0 })}
          >
            {img && base > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                style={{
                  width: img.naturalWidth * base,
                  height: img.naturalHeight * base,
                  transform: `translate(-50%, -50%) translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
                }}
              />
            )}
            {/* 三分割線 */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/3 border-l border-white/25" />
              <div className="absolute inset-y-0 left-2/3 border-l border-white/25" />
              <div className="absolute inset-x-0 top-1/3 border-t border-white/25" />
              <div className="absolute inset-x-0 top-2/3 border-t border-white/25" />
            </div>
            {guide === "body" && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-[30%] top-[4%] h-[11%] rounded-full border-2 border-dashed border-gold/90" />
                <div className="absolute inset-x-0 top-[3%] border-t-2 border-dashed border-gold/80" />
                <div className="absolute inset-x-0 bottom-[3%] border-t-2 border-dashed border-gold/80" />
                <span className="absolute left-2 top-[3%] mt-1 rounded bg-black/50 px-1.5 text-[10px]">頭のてっぺん</span>
                <span className="absolute bottom-[3%] left-2 mb-1 rounded bg-black/50 px-1.5 text-[10px]">足先</span>
              </div>
            )}
            {!img && !error && <div className="absolute inset-0 grid place-items-center text-xs text-white/70">読み込み中…</div>}
            {error && <div className="absolute inset-0 grid place-items-center text-xs text-red-300">{error}</div>}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-center text-[11px] text-white/60">
          {guide === "body" ? "頭と足先がガイド線に合うように、" : ""}ドラッグで移動・2本指で拡大縮小
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="縮小"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-xl active:bg-white/20"
            onClick={() => setView((v) => zoomAt(v, v.s / 1.2, frame.w / 2, frame.h / 2))}
          >
            −
          </button>
          <input
            type="range"
            aria-label="大きさ"
            min={100}
            max={MAX_ZOOM * 100}
            step={1}
            value={pct}
            onChange={(e) => {
              const s = Number(e.target.value) / 100;
              setView((v) => zoomAt(v, s, frame.w / 2, frame.h / 2));
            }}
            className="h-11 min-w-0 flex-1 accent-white"
          />
          <button
            type="button"
            aria-label="拡大"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-xl active:bg-white/20"
            onClick={() => setView((v) => zoomAt(v, v.s * 1.2, frame.w / 2, frame.h / 2))}
          >
            ＋
          </button>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-white/70">{pct}%</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {aspects.length > 1 &&
            aspects.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => setAspectId(a.id)}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold transition ${
                  a.id === aspectId ? "bg-white text-ink" : "bg-white/10 text-white/80 active:bg-white/20"
                }`}
              >
                {a.label}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setView({ s: 1, tx: 0, ty: 0 })}
            className="min-h-9 rounded-full px-4 text-xs font-semibold text-white/70 active:bg-white/10"
          >
            リセット
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
