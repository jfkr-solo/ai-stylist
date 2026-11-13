"use client";

import type { Item } from "@/types/database";

/** カテゴリ内のアイテムを横スクロールで並べ、タップで試着を切り替える */
export function ItemRail({ items, selectedId, onSelect, allowNone, size = "md" }: { items: Item[]; selectedId: string | null | undefined; onSelect: (id: string | null) => void; allowNone: boolean; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-16 w-16" : "h-20 w-20";
  return (
    <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
      {allowNone && (
        <button onClick={() => onSelect(null)} className={`${box} shrink-0 snap-start rounded-2xl border-2 text-[11px] font-semibold transition ${!selectedId ? "border-navy bg-navy/5 text-navy" : "border-black/5 bg-white text-ink/40"}`}>
          なし
        </button>
      )}
      {items.map((i) => {
        const on = i.id === selectedId;
        return (
          <button
            key={i.id}
            onClick={() => onSelect(on && allowNone ? null : i.id)}
            title={i.name}
            className={`${box} checker relative shrink-0 snap-start overflow-hidden rounded-2xl border-2 p-1.5 transition ${on ? "border-navy shadow-md" : "border-transparent hover:border-black/15"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image_url} alt={i.name} className="h-full w-full object-contain" />
            {on && <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-navy text-[9px] text-white">✓</span>}
          </button>
        );
      })}
      {items.length === 0 && <p className="self-center px-2 text-xs text-ink/40">未登録</p>}
    </div>
  );
}
