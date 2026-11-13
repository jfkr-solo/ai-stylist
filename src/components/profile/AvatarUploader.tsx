"use client";

import { useRef, useState } from "react";
import { canvasToDataUrl, loadAndResize } from "@/lib/image";

/** 全身写真のアップロード（縦長 1:2 の枠でプレビュー） */
export function AvatarUploader({ value, onChange }: { value: string | null; onChange: (dataUrl: string) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = await loadAndResize(file, 1200);
      await onChange(canvasToDataUrl(canvas, false));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className="group relative mx-auto aspect-[1/2] w-full max-w-[260px] cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-black/10 bg-mist"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="全身写真" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-ink/50">
            <div>
              <div className="mb-2 text-4xl">🧍</div>
              全身写真をタップして追加
            </div>
          </div>
        )}
        {/* 撮影ガイド */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute inset-x-[30%] top-[4%] h-[11%] rounded-full border border-dashed border-white/80" />
          <div className="absolute inset-x-0 top-[13%] border-t border-dashed border-white/70" />
          <div className="absolute inset-x-0 bottom-[3%] border-t border-dashed border-white/70" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 text-center text-xs font-semibold text-white">
          {busy ? "読み込み中…" : value ? "写真を変更" : "アップロード"}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {error && <p className="mt-2 text-center text-xs text-red-700">{error}</p>}
      <ul className="mx-auto mt-4 max-w-[300px] space-y-1 text-xs text-ink/55">
        <li>・正面を向いて、頭からつま先まで入る縦長の写真</li>
        <li>・腕は体から少し離して、無地の壁の前がおすすめ</li>
        <li>・体にフィットした服で撮ると重ね合わせが自然に</li>
      </ul>
    </div>
  );
}
