"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { PageState, PageTitle } from "@/components/ui/PageState";
import { TryOnCanvas } from "@/components/fitting/TryOnCanvas";
import { ItemRail } from "@/components/fitting/ItemRail";
import { ConditionPanel } from "@/components/fitting/ConditionPanel";
import { SuggestionCard } from "@/components/fitting/SuggestionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { getOverlay } from "@/lib/overlay";
import type { StylistConditions, Suggestion } from "@/lib/stylist";
import { OUTFIT_COLUMN, type Category, type Item, type Outfit, type Overlay, type Selection } from "@/types/database";

export default function FittingRoomPage() {
  return (
    <PageState>
      <FittingRoom />
    </PageState>
  );
}

/** 必ず何か着るカテゴリ（「なし」を選べない） */
const REQUIRED: Category[] = ["tops", "bottoms"];
const LEFT: Category[] = ["headwear", "tops", "outer"];
const RIGHT: Category[] = ["bottoms", "shoes", "accessory"];

function FittingRoom() {
  const { profile, items, outfits, addOutfit, deleteOutfit, updateItem, importSamples } = useStore();
  const toast = useToast();
  const avatarUrl = profile?.avatar_full_body_url ?? null;

  const byCat = useMemo(() => {
    const m = Object.fromEntries(CATEGORIES.map((c) => [c.id, [] as Item[]])) as Record<Category, Item[]>;
    items.forEach((i) => m[i.category].push(i));
    return m;
  }, [items]);

  // 初期選択：保存済みコーデの最新 → なければ各カテゴリ先頭
  const [selection, setSelection] = useState<Selection>(() => {
    const latest = outfits[0];
    if (latest) return outfitToSelection(latest);
    return { tops: byCat.tops[0]?.id, bottoms: byCat.bottoms[0]?.id, shoes: byCat.shoes[0]?.id };
  });
  const [activeCat, setActiveCat] = useState<Category>("tops");
  const [fromSuggestion, setFromSuggestion] = useState<Suggestion | null>(null);

  const [conditions, setConditions] = useState<StylistConditions>({
    generation: profile?.generation ?? "50代",
    trendLevel: "balanced",
    weather: "sunny",
    temperature: 18,
    scene: "休日",
    colorBase: null,
    style: profile?.base_style ?? "きれいめカジュアル",
  });
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // 位置調整
  const [adjustCat, setAdjustCat] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Overlay | null>(null);

  // AI合成
  const [tryOn, setTryOn] = useState<{ status: "loading" | "done"; message?: string; imageUrl?: string | null } | null>(null);

  const selectedItems = CATEGORIES.map((c) => selection[c.id])
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as Item[];

  const adjustItem = adjustCat ? items.find((i) => i.id === selection[adjustCat]) ?? null : null;

  useEffect(() => {
    setDraft(adjustItem ? getOverlay(adjustItem) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustItem?.id]);

  function select(cat: Category, id: string | null) {
    setSelection((s) => ({ ...s, [cat]: id }));
    setActiveCat(cat);
    setFromSuggestion(null);
  }

  function cycle(cat: Category, dir: 1 | -1) {
    // 上半身ゾーンは、アウター/小物を選択中ならそちらを切り替える
    const target = cat === "tops" && (activeCat === "outer" || activeCat === "accessory") ? activeCat : cat;
    const list: (string | null)[] = [...(REQUIRED.includes(target) ? [] : [null]), ...byCat[target].map((i) => i.id)];
    if (list.length === 0) return;
    const idx = list.indexOf(selection[target] ?? null);
    const next = list[(idx + dir + list.length) % list.length];
    select(target, next);
  }

  async function suggest() {
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, conditions }),
      });
      const data = (await res.json()) as { suggestions: Suggestion[] };
      await new Promise((r) => setTimeout(r, 500)); // 「考えている」演出
      setSuggestions(data.suggestions);
      if (data.suggestions[0]) applySuggestion(data.suggestions[0], false);
    } catch {
      toast.show("提案の取得に失敗しました");
    } finally {
      setSuggesting(false);
    }
  }

  function applySuggestion(s: Suggestion, scroll = true) {
    setSelection(s.selection);
    setFromSuggestion(s);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    const cols = Object.fromEntries(CATEGORIES.map((c) => [OUTFIT_COLUMN[c.id], selection[c.id] ?? null]));
    await addOutfit({
      ...(cols as Pick<Outfit, "top_item_id" | "bottom_item_id" | "outer_item_id" | "shoes_item_id" | "headwear_item_id" | "accessory_item_id">),
      date: new Date().toISOString().slice(0, 10),
      title: fromSuggestion?.title ?? `${conditions.scene}のコーデ`,
      weather: conditions.weather,
      temperature: conditions.temperature,
      scene: conditions.scene,
      style: conditions.style,
      color_base: conditions.colorBase,
      trend_level: conditions.trendLevel,
      source: fromSuggestion ? "ai" : "manual",
      ai_comment: fromSuggestion?.comment ?? null,
      tryon_image_url: null,
    });
    toast.show("コーデを保存しました");
  }

  async function runAiTryOn() {
    setTryOn({ status: "loading" });
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_image_url: avatarUrl,
          garments: selectedItems.map((i) => ({ category: i.category, image_url: i.image_url })),
        }),
      });
      const data = (await res.json()) as { status: string; message: string; image_url: string | null };
      await new Promise((r) => setTimeout(r, 1400));
      setTryOn({ status: "done", message: data.message, imageUrl: data.image_url });
    } catch {
      setTryOn({ status: "done", message: "AI試着APIに接続できませんでした。" });
    }
  }

  async function saveAdjust() {
    if (!adjustItem || !draft) return;
    await updateItem(adjustItem.id, { overlay: draft });
    toast.show("位置を保存しました（次回から反映）");
    setAdjustCat(null);
  }

  const sideRail = (cat: Category) => (
    <div key={cat} className={`rounded-2xl p-3 transition ${activeCat === cat ? "bg-white shadow-sm" : ""}`} onClick={() => setActiveCat(cat)}>
      <p className="mb-2 flex items-center justify-between text-xs font-bold text-ink/60">
        <span>
          {CATEGORIES.find((c) => c.id === cat)?.icon} {CATEGORY_LABEL[cat]}
        </span>
        <span className="text-[10px] font-normal text-ink/35">{byCat[cat].length}点</span>
      </p>
      <ItemRail items={byCat[cat]} selectedId={selection[cat]} onSelect={(id) => select(cat, id)} allowNone={!REQUIRED.includes(cat)} size="sm" />
    </div>
  );

  return (
    <>
      <PageTitle en="VIRTUAL FITTING ROOM" ja="バーチャル試着室">
        <button className="btn-ghost !hidden md:!inline-flex" onClick={() => aiRef.current?.scrollIntoView({ behavior: "smooth" })}>
          ✦ AIに提案してもらう
        </button>
      </PageTitle>

      {items.length === 0 && (
        <div className="card mb-6 p-5 text-sm">
          まだアイテムがありません。<Link href="/closet" className="font-bold text-navy underline">クローゼット</Link>から写真を登録するか、
          <button className="ml-1 font-bold text-navy underline" onClick={async () => toast.show(`サンプルを${await importSamples()}点追加しました`)}>
            サンプルアイテムで試す
          </button>
          こともできます。
        </div>
      )}

      <section className="grid items-start gap-4 lg:grid-cols-[1fr_minmax(300px,380px)_1fr]">
        <div className="hidden space-y-2 lg:block">{LEFT.map(sideRail)}</div>

        {/* 中央：全身写真＋レイヤー */}
        <div className="mx-auto w-full max-w-[380px]">
          <div className="relative mx-auto" style={{ maxWidth: "max(220px, calc((100dvh - 230px) / 2))" }}>
            <TryOnCanvas
              avatarUrl={avatarUrl}
              items={selectedItems}
              overrides={adjustItem && draft ? { [adjustItem.id]: draft } : undefined}
              onSwipe={cycle}
              onTapZone={(z) => setActiveCat(z)}
              adjustItemId={adjustItem?.id ?? null}
              onDragAdjust={(dx, dy) => setDraft((d) => (d ? { ...d, left: d.left + dx, top: d.top + dy } : d))}
            />
            {fromSuggestion && (
              <div className="animate-pop absolute left-3 top-3 z-[70] max-w-[75%] rounded-2xl bg-white/90 px-3 py-2 text-[11px] font-semibold shadow backdrop-blur">
                <span className="text-gold">✦ AI提案</span> {fromSuggestion.title}
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink/45">写真の上をスワイプ（上下・左右）でアイテム切り替え</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button className="btn-gold col-span-3 !py-3" onClick={runAiTryOn} disabled={!avatarUrl || selectedItems.length === 0}>
              ✦ AIで自然に合成（β）
            </button>
            <button className="btn-ghost !px-2 !text-xs" onClick={save}>
              ♡ 保存
            </button>
            <button className={`${adjustCat ? "btn-primary" : "btn-ghost"} !px-2 !text-xs`} onClick={() => setAdjustCat(adjustCat ? null : activeCat)}>
              ⤧ 位置調整
            </button>
            <button
              className="btn-ghost !px-2 !text-xs"
              onClick={() => {
                setSelection({ tops: byCat.tops[0]?.id, bottoms: byCat.bottoms[0]?.id, shoes: byCat.shoes[0]?.id });
                setFromSuggestion(null);
              }}
            >
              ↺ リセット
            </button>
          </div>

          {adjustCat && (
            <div className="card animate-pop mt-3 space-y-3 p-4">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => selection[c.id]).map((c) => (
                  <button key={c.id} className={adjustCat === c.id ? "chip-on" : "chip-off"} onClick={() => setAdjustCat(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              {adjustItem && draft ? (
                <>
                  <p className="text-[11px] text-ink/50">写真の上をドラッグして移動、スライダーでサイズ調整できます。</p>
                  <Slider label="サイズ" min={0.05} max={1} step={0.005} value={draft.width} onChange={(v) => setDraft({ ...draft, left: draft.left - (v - draft.width) / 2, width: v })} />
                  <Slider label="左右" min={-0.3} max={1} step={0.005} value={draft.left} onChange={(v) => setDraft({ ...draft, left: v })} />
                  <Slider label="上下" min={-0.1} max={1} step={0.005} value={draft.top} onChange={(v) => setDraft({ ...draft, top: v })} />
                  <Slider label="回転" min={-30} max={30} step={1} value={draft.rotate ?? 0} onChange={(v) => setDraft({ ...draft, rotate: v })} />
                  <div className="flex justify-between">
                    <button className="text-xs text-ink/50 underline" onClick={() => setDraft(getOverlay({ ...adjustItem, overlay: null }))}>
                      既定位置に戻す
                    </button>
                    <button className="btn-primary !px-4 !py-2 !text-xs" onClick={saveAdjust}>
                      この位置で保存
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink/50">このカテゴリは選択されていません。</p>
              )}
            </div>
          )}
        </div>

        <div className="hidden space-y-2 lg:block">{RIGHT.map(sideRail)}</div>
      </section>

      {/* スマホ・タブレット：カテゴリタブ＋アイテムレール */}
      <section className="card mt-5 p-3 lg:hidden">
        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`${activeCat === c.id ? "chip-on" : "chip-off"} shrink-0`} onClick={() => setActiveCat(c.id)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <ItemRail items={byCat[activeCat]} selectedId={selection[activeCat]} onSelect={(id) => select(activeCat, id)} allowNone={!REQUIRED.includes(activeCat)} />
      </section>

      {/* AIスタイリスト */}
      <section ref={aiRef} className="mt-10 scroll-mt-20">
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-[.3em] text-gold">AI STYLIST</p>
          <h2 className="text-xl font-bold md:text-2xl">今日のコーデ、AIに相談する</h2>
          <p className="mt-1 text-sm text-ink/55">条件を選ぶと、あなたのクローゼットから組み合わせを考えて、全身写真に着せて見せます。</p>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[420px_1fr]">
          <div className="card p-5">
            <ConditionPanel value={conditions} onChange={setConditions} onSubmit={suggest} loading={suggesting} />
          </div>
          <div className="space-y-3">
            {suggesting && <SkeletonCards />}
            {!suggesting && suggestions?.length === 0 && (
              <div className="card p-8 text-center text-sm text-ink/50">トップスとボトムスを1点ずつ以上登録すると提案できます。</div>
            )}
            {!suggesting &&
              suggestions?.map((s, i) => (
                <SuggestionCard key={s.id} index={i} suggestion={s} items={items} avatarUrl={avatarUrl} onApply={() => applySuggestion(s)} />
              ))}
            {!suggesting && !suggestions && (
              <div className="grid min-h-[240px] place-items-center rounded-3xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-ink/45">
                <div>
                  <div className="mb-2 text-4xl">🧑‍🎨</div>
                  条件を選んで「提案してもらう」を押してください
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 保存したコーデ */}
      {outfits.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">保存したコーデ</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {outfits.map((o) => {
              const sel = outfitToSelection(o);
              const its = Object.values(sel).map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[];
              return (
                <div key={o.id} className="card w-36 shrink-0 p-2">
                  <button className="block w-full" onClick={() => { setSelection(sel); setFromSuggestion(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <TryOnCanvas avatarUrl={avatarUrl} items={its} compact />
                  </button>
                  <div className="mt-2 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-bold">{o.source === "ai" && <span className="text-gold">✦ </span>}{o.title ?? "コーデ"}</p>
                      <p className="text-[10px] text-ink/45">{o.date}{o.temperature != null && ` ・ ${o.temperature}℃`}</p>
                    </div>
                    <button className="text-[10px] text-ink/35 hover:text-red-600" onClick={() => deleteOutfit(o.id)} aria-label="削除">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal open={!!tryOn} onClose={() => setTryOn(null)} title="AI試着プレビュー（β）">
        <div className="mx-auto w-full max-w-[280px]">
          <div className="relative">
            {tryOn?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tryOn.imageUrl} alt="AI合成結果" className="w-full rounded-2xl" />
            ) : (
              <TryOnCanvas avatarUrl={avatarUrl} items={selectedItems} compact />
            )}
            {tryOn?.status === "loading" && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
                <div className="text-center text-xs font-semibold text-navy">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
                  服のシワや影を合成しています…
                </div>
              </div>
            )}
          </div>
        </div>
        {tryOn?.status === "done" && <p className="mt-4 rounded-2xl bg-mist p-3 text-xs leading-relaxed text-ink/70">{tryOn.message}</p>}
      </Modal>

      {toast.node}
    </>
  );
}

function outfitToSelection(o: Outfit): Selection {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, o[OUTFIT_COLUMN[c.id]] as string | null])) as Selection;
}

function Slider({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-10 shrink-0 font-semibold text-ink/60">{label}</span>
      <input type="range" className="flex-1 accent-navy" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function SkeletonCards() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card flex animate-pulse gap-4 p-4">
          <div className="aspect-[1/2] w-28 rounded-2xl bg-mist sm:w-36" />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-3 w-16 rounded bg-mist" />
            <div className="h-4 w-40 rounded bg-mist" />
            <div className="h-16 rounded-2xl bg-mist" />
          </div>
        </div>
      ))}
    </>
  );
}
