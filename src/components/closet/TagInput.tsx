"use client";

import { useState } from "react";

/** 候補チップ＋自由入力で複数タグを選ぶ */
export function TagInput({ options, value, onChange, placeholder = "タグを追加" }: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((v) => v !== t) : [...value, t]);

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((t) => (
        <button type="button" key={t} className={value.includes(t) ? "chip-on" : "chip-off"} onClick={() => toggle(t)}>
          {t}
        </button>
      ))}
      <input
        className="w-28 rounded-full border border-dashed border-black/15 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-navy"
        placeholder={`＋ ${placeholder}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && text.trim()) {
            e.preventDefault();
            if (!value.includes(text.trim())) onChange([...value, text.trim()]);
            setText("");
          }
        }}
      />
    </div>
  );
}
