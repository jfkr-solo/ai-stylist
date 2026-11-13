import type { Category, Season, TrendLevel, Weather } from "@/types/database";

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "headwear", label: "帽子", icon: "🧢" },
  { id: "tops", label: "トップス", icon: "👕" },
  { id: "outer", label: "アウター", icon: "🧥" },
  { id: "bottoms", label: "ボトムス", icon: "👖" },
  { id: "shoes", label: "靴", icon: "👟" },
  { id: "accessory", label: "小物", icon: "⌚" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Category, string>;

export const SUB_CATEGORIES: Partial<Record<Category, { id: string; label: string }[]>> = {
  headwear: [
    { id: "cap", label: "キャップ" },
    { id: "knit_hat", label: "ニット帽" },
    { id: "hat", label: "ハット" },
  ],
  accessory: [
    { id: "bag", label: "バッグ" },
    { id: "watch", label: "腕時計" },
    { id: "glasses", label: "メガネ・サングラス" },
    { id: "other", label: "その他" },
  ],
};

export const GENERATIONS = ["20代", "30代", "40代", "50代", "60代", "70代以上"];

export const STYLES = ["きれいめカジュアル", "ベーシック", "トラッド", "アメカジ", "ミニマル", "スポーティ", "リラックス", "モード"];

export const STYLE_TAGS = ["ベーシック", "きれいめ", "カジュアル", "トラッド", "アメカジ", "ミニマル", "スポーティ", "リラックス", "モード"];

export const SCENES = ["休日", "街歩き", "オフィスカジュアル", "会食", "旅行", "アウトドア", "ジム帰り"];

export const COLORS: { id: string; label: string; hex: string; neutral: boolean }[] = [
  { id: "navy", label: "ネイビー", hex: "#1f2a44", neutral: true },
  { id: "black", label: "ブラック", hex: "#151515", neutral: true },
  { id: "charcoal", label: "チャコール", hex: "#3d4046", neutral: true },
  { id: "gray", label: "グレー", hex: "#8b9097", neutral: true },
  { id: "white", label: "ホワイト", hex: "#f4f4f2", neutral: true },
  { id: "beige", label: "ベージュ", hex: "#cdb79a", neutral: true },
  { id: "indigo", label: "インディゴ", hex: "#25334f", neutral: true },
  { id: "silver", label: "シルバー", hex: "#b6bcc4", neutral: true },
  { id: "brown", label: "ブラウン", hex: "#6e4a32", neutral: false },
  { id: "olive", label: "オリーブ", hex: "#5d6339", neutral: false },
  { id: "blue", label: "ブルー", hex: "#3d6fb6", neutral: false },
  { id: "red", label: "レッド", hex: "#b23a3a", neutral: false },
];

export const COLOR_MAP = Object.fromEntries(COLORS.map((c) => [c.id, c]));

export const SEASONS: { id: Season; label: string }[] = [
  { id: "spring", label: "春" },
  { id: "summer", label: "夏" },
  { id: "autumn", label: "秋" },
  { id: "winter", label: "冬" },
];

export const WEATHERS: { id: Weather; label: string; icon: string }[] = [
  { id: "sunny", label: "晴れ", icon: "☀️" },
  { id: "cloudy", label: "くもり", icon: "☁️" },
  { id: "rainy", label: "雨", icon: "🌧️" },
  { id: "snowy", label: "雪", icon: "❄️" },
];

export const TREND_LEVELS: { id: TrendLevel; label: string; hint: string }[] = [
  { id: "classic", label: "定番", hint: "長く愛せる王道" },
  { id: "balanced", label: "ほどよく", hint: "今っぽさを少し" },
  { id: "trendy", label: "トレンド", hint: "旬のバランス重視" },
];
