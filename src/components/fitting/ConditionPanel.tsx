"use client";

import { COLORS, GENERATIONS, SCENES, STYLES, TREND_LEVELS, WEATHERS } from "@/lib/constants";
import type { StylistConditions } from "@/lib/stylist";

/** AIスタイリストへのコーデ条件指定パネル */
export function ConditionPanel({ value, onChange, onSubmit, loading }: { value: StylistConditions; onChange: (v: StylistConditions) => void; onSubmit: () => void; loading: boolean }) {
  const set = <K extends keyof StylistConditions>(k: K, v: StylistConditions[K]) => onChange({ ...value, [k]: v });
  const tempColor = value.temperature >= 25 ? "text-orange-500" : value.temperature >= 15 ? "text-emerald-600" : "text-sky-600";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">天気</label>
          <div className="grid grid-cols-4 gap-1.5">
            {WEATHERS.map((w) => (
              <button
                key={w.id}
                onClick={() => set("weather", w.id)}
                className={`flex flex-col items-center rounded-xl border py-2 text-[11px] font-semibold transition ${value.weather === w.id ? "border-navy bg-navy text-white" : "border-black/10 bg-white"}`}
              >
                <span className="text-lg">{w.icon}</span>
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">
            気温 <span className={`ml-1 text-base ${tempColor}`}>{value.temperature}℃</span>
          </label>
          <input type="range" min={-5} max={35} value={value.temperature} onChange={(e) => set("temperature", Number(e.target.value))} className="mt-3 w-full accent-navy" />
          <div className="flex justify-between text-[10px] text-ink/40">
            <span>-5℃</span>
            <span>15℃</span>
            <span>35℃</span>
          </div>
        </div>
      </div>

      <div>
        <label className="label">シーン</label>
        <div className="flex flex-wrap gap-2">
          {SCENES.map((s) => (
            <button key={s} className={value.scene === s ? "chip-on" : "chip-off"} onClick={() => set("scene", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">スタイル</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button key={s} className={value.style === s ? "chip-on" : "chip-off"} onClick={() => set("style", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">カラーベース</label>
          <div className="flex flex-wrap items-center gap-2">
            <button className={value.colorBase === null ? "chip-on" : "chip-off"} onClick={() => set("colorBase", null)}>
              おまかせ
            </button>
            {COLORS.filter((c) => c.neutral).map((c) => (
              <button
                key={c.id}
                title={c.label}
                onClick={() => set("colorBase", c.id)}
                className={`h-7 w-7 rounded-full border border-black/10 ${value.colorBase === c.id ? "ring-2 ring-navy ring-offset-2" : ""}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="label">世代</label>
          <select className="input !py-2" value={value.generation} onChange={(e) => set("generation", e.target.value)}>
            {GENERATIONS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">最新トレンド感</label>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-mist p-1">
          {TREND_LEVELS.map((t) => (
            <button
              key={t.id}
              onClick={() => set("trendLevel", t.id)}
              className={`rounded-xl px-2 py-2 text-center transition ${value.trendLevel === t.id ? "bg-white shadow-sm" : "text-ink/50"}`}
            >
              <span className="block text-xs font-bold">{t.label}</span>
              <span className="block text-[10px] text-ink/45">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn-gold w-full !py-3.5 !text-base" onClick={onSubmit} disabled={loading}>
        {loading ? "コーディネートを考えています…" : "✦ この条件でコーデを提案"}
      </button>
    </div>
  );
}
