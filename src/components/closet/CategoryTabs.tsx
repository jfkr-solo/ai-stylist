"use client";

import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/types/database";

export function CategoryTabs({ value, onChange, counts }: { value: Category | "all"; onChange: (v: Category | "all") => void; counts: Record<string, number> }) {
  const tabs: { id: Category | "all"; label: string; icon: string }[] = [{ id: "all", label: "すべて", icon: "✦" }, ...CATEGORIES];
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`${value === t.id ? "chip-on" : "chip-off"} shrink-0 !px-4 !py-2 !text-sm`}>
          <span>{t.icon}</span>
          {t.label}
          <span className={`ml-1 text-[10px] ${value === t.id ? "text-white/60" : "text-ink/35"}`}>{counts[t.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
