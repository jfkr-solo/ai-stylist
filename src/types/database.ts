export type Category = "tops" | "bottoms" | "outer" | "shoes" | "headwear" | "accessory";
export type TrendLevel = "classic" | "balanced" | "trendy";
export type Weather = "sunny" | "cloudy" | "rainy" | "snowy";
export type Season = "spring" | "summer" | "autumn" | "winter";

/** 全身写真の枠（縦横比 1:2）に対する相対位置。0〜1 の割合 */
export interface Overlay {
  left: number;
  top: number;
  width: number;
  rotate?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  generation: string | null;
  base_style: string | null;
  gender_preference: "mens" | "womens" | "unisex" | null;
  avatar_full_body_url: string | null;
  height_cm: number | null;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  category: Category;
  sub_category: string | null;
  scene_tags: string[];
  color: string | null;
  style_tags: string[];
  season_tags: Season[];
  overlay: Overlay | null;
  created_at: string;
}

export type NewItem = Omit<Item, "id" | "user_id" | "created_at">;

export interface Outfit {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  top_item_id: string | null;
  bottom_item_id: string | null;
  outer_item_id: string | null;
  shoes_item_id: string | null;
  headwear_item_id: string | null;
  accessory_item_id: string | null;
  weather: Weather | null;
  temperature: number | null;
  scene: string | null;
  style: string | null;
  color_base: string | null;
  trend_level: TrendLevel | null;
  source: "manual" | "ai";
  ai_comment: string | null;
  tryon_image_url: string | null;
  created_at: string;
}

export type NewOutfit = Omit<Outfit, "id" | "user_id" | "created_at">;

/** 試着室で選択中のアイテム（カテゴリ → item id） */
export type Selection = Partial<Record<Category, string | null>>;

export const OUTFIT_COLUMN: Record<Category, keyof Outfit> = {
  tops: "top_item_id",
  bottoms: "bottom_item_id",
  outer: "outer_item_id",
  shoes: "shoes_item_id",
  headwear: "headwear_item_id",
  accessory: "accessory_item_id",
};
