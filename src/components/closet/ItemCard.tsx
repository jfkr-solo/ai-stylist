"use client";

import { CATEGORY_LABEL, COLOR_MAP } from "@/lib/constants";
import type { Item } from "@/types/database";

export function ItemCard({ item, onClick }: { item: Item; onClick?: () => void }) {
  const color = item.color ? COLOR_MAP[item.color] : null;
  return (
    <button onClick={onClick} className="card group overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="checker relative grid aspect-square place-items-center p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain drop-shadow-md transition group-hover:scale-105" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink/60">{CATEGORY_LABEL[item.category]}</span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
        <div className="flex items-center gap-1.5">
          {color && <span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ background: color.hex }} title={color.label} />}
          <p className="line-clamp-1 text-[11px] text-ink/45">{[...item.style_tags, ...item.scene_tags].slice(0, 3).join(" / ")}</p>
        </div>
      </div>
    </button>
  );
}
