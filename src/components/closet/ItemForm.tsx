"use client";

import { useRef, useState } from "react";
import { CATEGORIES, COLORS, SCENES, SEASONS, STYLE_TAGS, SUB_CATEGORIES } from "@/lib/constants";
import { canvasToDataUrl, loadAndResize, removeBackground } from "@/lib/image";
import type { Category, Item, NewItem, Season } from "@/types/database";
import { TagInput } from "./TagInput";

const EMPTY: NewItem = {
  name: "",
  image_url: "",
  category: "tops",
  sub_category: null,
  scene_tags: [],
  color: null,
  style_tags: [],
  season_tags: [],
  overlay: null,
};

/** アイテムの登録・編集フォーム（写真アップロード＋カテゴリ＋属性タグ） */
export function ItemForm({
  initial,
  onSubmit,
  onDelete,
  uploadImage,
}: {
  initial?: Item;
  onSubmit: (item: NewItem) => Promise<void>;
  onDelete?: () => Promise<void>;
  uploadImage: (dataUrl: string) => Promise<string>;
}) {
  const [form, setForm] = useState<NewItem>(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null);
  const [pending, setPending] = useState<string | null>(null); // 未アップロードの data URL
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [cutout, setCutout] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof NewItem>(k: K, v: NewItem[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function process(file: File, doCutout: boolean) {
    setBusy(true);
    setError(null);
    try {
      let canvas = await loadAndResize(file, 800);
      if (doCutout) canvas = removeBackground(canvas);
      const url = canvasToDataUrl(canvas, true);
      setPreview(url);
      setPending(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!preview) return setError("写真を追加してください");
    if (!form.name.trim()) return setError("アイテム名を入力してください");
    setBusy(true);
    setError(null);
    try {
      const image_url = pending ? await uploadImage(pending) : form.image_url;
      // 画像を差し替えた場合は位置調整をリセット
      await onSubmit({ ...form, image_url, overlay: pending ? null : form.overlay });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const subs = SUB_CATEGORIES[form.category];

  return (
    <div className="space-y-5">
      {/* 写真 */}
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="checker relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-black/10 p-3"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="max-h-full max-w-full object-contain drop-shadow" />
          ) : (
            <span className="text-xs text-ink/50">
              <span className="mb-1 block text-3xl">📷</span>撮影 / 写真を選択
            </span>
          )}
          {busy && <span className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-semibold">処理中…</span>}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setRawFile(f);
              process(f, cutout);
            }
          }}
        />
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 accent-navy"
              checked={cutout}
              onChange={(e) => {
                setCutout(e.target.checked);
                if (rawFile) process(rawFile, e.target.checked);
              }}
            />
            <span>
              <b className="block text-sm">背景を自動で透過（簡易）</b>
              無地の床や壁の上で撮った写真なら、背景を取り除いて試着用の切り抜き画像にします。
            </span>
          </label>
          <div>
            <label className="label">アイテム名</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例：ネイビーの無地Tシャツ" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">カテゴリ</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setForm((f) => ({ ...f, category: c.id as Category, sub_category: null }))}
              className={`flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                form.category === c.id ? "border-navy bg-navy text-white" : "border-black/10 bg-white hover:border-black/25"
              }`}
            >
              <span className="text-lg">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
        {subs && (
          <div className="mt-2 flex flex-wrap gap-2">
            {subs.map((s) => (
              <button type="button" key={s.id} className={form.sub_category === s.id ? "chip-on" : "chip-off"} onClick={() => set("sub_category", s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">メインカラー</label>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.id}
              title={c.label}
              onClick={() => set("color", c.id)}
              className={`h-8 w-8 rounded-full border border-black/10 transition ${form.color === c.id ? "ring-2 ring-navy ring-offset-2" : "hover:scale-110"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label">利用シーン</label>
        <TagInput options={SCENES} value={form.scene_tags} onChange={(v) => set("scene_tags", v)} placeholder="シーン" />
      </div>
      <div>
        <label className="label">スタイルテイスト</label>
        <TagInput options={STYLE_TAGS} value={form.style_tags} onChange={(v) => set("style_tags", v)} placeholder="テイスト" />
      </div>
      <div>
        <label className="label">着用シーズン</label>
        <div className="flex gap-2">
          {SEASONS.map((s) => {
            const on = form.season_tags.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                className={`${on ? "chip-on" : "chip-off"} !px-4`}
                onClick={() => set("season_tags", on ? form.season_tags.filter((x) => x !== s.id) : ([...form.season_tags, s.id] as Season[]))}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-4">
        {onDelete ? (
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:underline"
            onClick={async () => {
              if (confirm("このアイテムを削除しますか？")) await onDelete();
            }}
          >
            削除する
          </button>
        ) : (
          <span />
        )}
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "保存中…" : initial ? "変更を保存" : "クローゼットに追加"}
        </button>
      </div>
    </div>
  );
}
