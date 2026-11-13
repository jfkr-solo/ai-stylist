"use client";

import type { Item } from "@/types/database";
import type { Suggestion } from "@/lib/stylist";
import { TryOnCanvas } from "./TryOnCanvas";

/** AI提案：自分の全身写真に仮想試着させた状態で見せるカード */
export function SuggestionCard({ suggestion, items, avatarUrl, onApply, index }: { suggestion: Suggestion; items: Item[]; avatarUrl: string | null; onApply: () => void; index: number }) {
  const selected = Object.values(suggestion.selection)
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as Item[];

  return (
    <article className="card animate-pop flex gap-4 overflow-hidden p-4" style={{ animationDelay: `${index * 90}ms` }}>
      <div className="w-28 shrink-0 sm:w-36">
        <TryOnCanvas avatarUrl={avatarUrl} items={selected} compact />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[10px] font-bold tracking-[.25em] text-gold">PLAN {index + 1}</p>
        <h3 className="mb-1.5 font-bold">{suggestion.title}</h3>
        <p className="mb-2 rounded-2xl rounded-tl-sm bg-mist/70 p-3 text-xs leading-relaxed text-ink/75">💬 {suggestion.comment}</p>
        <ul className="mb-3 space-y-0.5 text-[11px] text-ink/55">
          {suggestion.points.map((p) => (
            <li key={p}>✓ {p}</li>
          ))}
        </ul>
        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
          {selected.map((i) => (
            <span key={i.id} className="checker grid h-10 w-10 shrink-0 place-items-center rounded-lg p-1" title={i.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image_url} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          ))}
        </div>
        <button className="btn-primary mt-auto self-start !px-4 !py-2 !text-xs" onClick={onApply}>
          このコーデを試着する
        </button>
      </div>
    </article>
  );
}
