import type { Category, Item, Season, Selection, TrendLevel, Weather } from "@/types/database";
import { COLOR_MAP } from "./constants";

export interface StylistConditions {
  generation: string;
  trendLevel: TrendLevel;
  weather: Weather;
  temperature: number;
  scene: string;
  colorBase: string | null; // null = おまかせ
  style: string;
}

export interface Suggestion {
  id: string;
  title: string;
  selection: Selection;
  score: number;
  comment: string;
  points: string[];
}

export function seasonOf(temp: number): Season[] {
  if (temp >= 25) return ["summer"];
  if (temp >= 18) return ["spring", "autumn"];
  if (temp >= 10) return ["autumn", "spring", "winter"];
  return ["winter"];
}

/** スタイル名とアイテムのスタイルタグの対応 */
const STYLE_KEYWORDS: Record<string, string[]> = {
  きれいめカジュアル: ["きれいめ", "ベーシック", "ミニマル"],
  ベーシック: ["ベーシック", "ミニマル"],
  トラッド: ["トラッド", "きれいめ"],
  アメカジ: ["アメカジ", "カジュアル"],
  ミニマル: ["ミニマル", "ベーシック"],
  スポーティ: ["スポーティ", "カジュアル"],
  リラックス: ["リラックス", "カジュアル"],
  モード: ["モード", "ミニマル"],
};

function itemScore(item: Item, c: StylistConditions): number {
  let s = 0;
  const seasons = seasonOf(c.temperature);
  if (item.season_tags.length === 0 || item.season_tags.some((t) => seasons.includes(t))) s += 3;
  else s -= 4;
  if (item.scene_tags.includes(c.scene)) s += 3;
  const keys = STYLE_KEYWORDS[c.style] ?? [c.style];
  s += item.style_tags.filter((t) => keys.includes(t)).length * 2;
  if (c.colorBase && item.color === c.colorBase) s += 2;
  return s;
}

function colorHarmony(items: Item[], c: StylistConditions): number {
  const colors = [...new Set(items.map((i) => i.color).filter(Boolean))] as string[];
  let s = 0;
  if (colors.length <= 3) s += 2; // 3色以内でまとまり
  if (colors.length > 4) s -= 3;
  const accents = colors.filter((col) => COLOR_MAP[col] && !COLOR_MAP[col].neutral);
  if (c.trendLevel === "classic" && accents.length === 0) s += 2;
  if (c.trendLevel === "trendy" && accents.length === 1) s += 2;
  if (c.colorBase) s += items.filter((i) => i.color === c.colorBase).length >= 2 ? 2 : 0;
  return s;
}

const pick = (items: Item[], cat: Category) => items.filter((i) => i.category === cat);

/**
 * ルールベースのコーデ提案。
 * TODO: /api/suggest 側で LLM（例: Claude）にアイテム一覧と条件を渡す実装に差し替え可能。
 */
export function suggestOutfits(items: Item[], c: StylistConditions, limit = 3): Suggestion[] {
  const tops = pick(items, "tops");
  const bottoms = pick(items, "bottoms");
  if (tops.length === 0 || bottoms.length === 0) return [];

  const needOuter = c.temperature < 20 || c.weather === "rainy" || c.weather === "snowy";
  const outers: (Item | null)[] = needOuter && pick(items, "outer").length ? pick(items, "outer") : [null];
  const shoes: (Item | null)[] = pick(items, "shoes").length ? pick(items, "shoes") : [null];
  const hats: (Item | null)[] = [null, ...pick(items, "headwear")];
  const accs: (Item | null)[] = [null, ...pick(items, "accessory")];

  const candidates: { sel: Item[]; score: number }[] = [];
  for (const t of tops)
    for (const b of bottoms)
      for (const o of outers)
        for (const sh of shoes)
          for (const h of hats)
            for (const a of accs) {
              const sel = [t, b, o, sh, h, a].filter(Boolean) as Item[];
              let score = sel.reduce((acc, i) => acc + itemScore(i, c), 0) + colorHarmony(sel, c);
              if (h) {
                if (h.sub_category === "knit_hat" && c.temperature >= 15) score -= 6;
                if (h.sub_category === "cap" && (c.scene === "会食" || c.scene === "オフィスカジュアル")) score -= 8;
                if (h.sub_category === "cap" && c.weather === "sunny") score += 2;
              }
              if (a?.sub_category === "watch" && (c.scene === "会食" || c.scene === "オフィスカジュアル")) score += 2;
              if (a?.sub_category === "bag" && (c.scene === "旅行" || c.scene === "街歩き")) score += 2;
              candidates.push({ sel, score });
            }

  candidates.sort((x, y) => y.score - x.score);

  // 多様性：トップス×ボトムスの組み合わせが重複しないように選ぶ
  const result: Suggestion[] = [];
  const seen = new Set<string>();
  for (const cand of candidates) {
    const key = cand.sel.filter((i) => i.category === "tops" || i.category === "bottoms").map((i) => i.id).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const selection: Selection = {};
    cand.sel.forEach((i) => (selection[i.category] = i.id));
    result.push({
      id: `s-${result.length}-${key}`,
      title: titleFor(c, result.length),
      selection,
      score: cand.score,
      ...describe(cand.sel, c),
    });
    if (result.length >= limit) break;
  }
  return result;
}

function titleFor(c: StylistConditions, idx: number): string {
  const base = ["王道", "こなれ", "ひと工夫"][idx] ?? "おすすめ";
  return `${c.scene}の${base}コーデ`;
}

function colorLabel(id: string | null) {
  return (id && COLOR_MAP[id]?.label) || "";
}

function describe(sel: Item[], c: StylistConditions): { comment: string; points: string[] } {
  const by = (cat: Category) => sel.find((i) => i.category === cat);
  const top = by("tops"), bottom = by("bottoms"), outer = by("outer"), shoes = by("shoes"), hat = by("headwear"), acc = by("accessory");
  const points: string[] = [];
  const colors = [...new Set(sel.map((i) => i.color).filter(Boolean))] as string[];

  if (colors.length <= 3) points.push(`${colors.map(colorLabel).join("・")}の${colors.length}色でまとめて統一感を`);
  if (outer) points.push(`${c.temperature}℃なので${outer.name}を羽織って温度調整`);
  if (hat?.sub_category === "cap") points.push("キャップで休日らしい軽さをプラス");
  if (hat?.sub_category === "knit_hat") points.push("ニット帽で季節感と顔まわりのアクセントを");
  if (acc?.sub_category === "watch") points.push("腕時計で手元に上品さを");
  if (acc?.sub_category === "bag") points.push("ショルダーバッグで両手が空いて快適");
  if (c.weather === "rainy" && shoes) points.push(`雨の日は${shoes.name}のような汚れが目立ちにくい足元が◎`);

  const gen = c.generation ? `${c.generation}の大人` : "大人";
  const trend =
    c.trendLevel === "trendy" ? "サイズ感をややゆったりめに見せると今っぽさが出ます。" :
    c.trendLevel === "classic" ? "流行に左右されない、長く使える組み合わせです。" :
    "定番をベースに、小物で少しだけ今の空気感を足しました。";
  const comment = `${top?.name ?? ""}に${bottom?.name ?? ""}を合わせて、${gen}らしい落ち着いた${c.style}に。${trend}こういう合わせ方はどうでしょう？`;
  return { comment, points: points.slice(0, 4) };
}
