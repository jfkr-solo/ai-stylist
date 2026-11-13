import type { Item, Outfit, Profile } from "@/types/database";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const now = new Date().toISOString();
const today = now.slice(0, 10);

export const MOCK_PROFILE: Profile = {
  id: "p-demo",
  user_id: DEMO_USER_ID,
  display_name: "デモ",
  generation: "50代",
  base_style: "きれいめカジュアル",
  gender_preference: "mens",
  avatar_full_body_url: "/mock/avatar/full-body-man.svg",
  height_cm: 172,
  created_at: now,
};

type Seed = Omit<Item, "user_id" | "created_at">;

const seeds: Seed[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "ネイビー無地Tシャツ（上質コットン）", image_url: "/mock/items/tee-navy.svg", category: "tops", sub_category: "tshirt", scene_tags: ["休日", "街歩き", "オフィスカジュアル"], color: "navy", style_tags: ["ベーシック", "きれいめ"], season_tags: ["spring", "summer", "autumn"], overlay: { left: 0.215, top: 0.1575, width: 0.57 } },
  { id: "10000000-0000-0000-0000-000000000002", name: "グレー無地Tシャツ", image_url: "/mock/items/tee-gray.svg", category: "tops", sub_category: "tshirt", scene_tags: ["休日", "旅行"], color: "gray", style_tags: ["ベーシック", "リラックス"], season_tags: ["spring", "summer", "autumn"], overlay: { left: 0.215, top: 0.1575, width: 0.57 } },
  { id: "10000000-0000-0000-0000-000000000003", name: "ネイビースウェット", image_url: "/mock/items/sweat-navy.svg", category: "tops", sub_category: "sweatshirt", scene_tags: ["休日", "ジム帰り", "街歩き"], color: "navy", style_tags: ["カジュアル", "ベーシック"], season_tags: ["autumn", "winter", "spring"], overlay: { left: 0.21, top: 0.155, width: 0.58 } },
  { id: "10000000-0000-0000-0000-000000000004", name: "ダークデニム（ストレート）", image_url: "/mock/items/denim-dark.svg", category: "bottoms", sub_category: "denim", scene_tags: ["休日", "街歩き", "旅行"], color: "indigo", style_tags: ["ベーシック", "アメカジ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: { left: 0.335, top: 0.42875, width: 0.33 } },
  { id: "10000000-0000-0000-0000-000000000005", name: "チャコールグレーのスラックス", image_url: "/mock/items/slacks-charcoal.svg", category: "bottoms", sub_category: "slacks", scene_tags: ["オフィスカジュアル", "会食"], color: "charcoal", style_tags: ["きれいめ"], season_tags: ["spring", "autumn", "winter"], overlay: { left: 0.335, top: 0.42875, width: 0.33 } },
  { id: "10000000-0000-0000-0000-000000000006", name: "ネイビーのテーラードジャケット", image_url: "/mock/items/jacket-navy.svg", category: "outer", sub_category: "jacket", scene_tags: ["オフィスカジュアル", "会食"], color: "navy", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "autumn"], overlay: { left: 0.2, top: 0.15, width: 0.6 } },
  { id: "10000000-0000-0000-0000-000000000007", name: "黒のレザースニーカー", image_url: "/mock/items/sneakers-black.svg", category: "shoes", sub_category: "sneakers", scene_tags: ["休日", "街歩き", "オフィスカジュアル"], color: "black", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: { left: 0.32, top: 0.91, width: 0.36 } },
  { id: "10000000-0000-0000-0000-000000000008", name: "ネイビーのキャップ", image_url: "/mock/items/cap-navy.svg", category: "headwear", sub_category: "cap", scene_tags: ["休日", "旅行", "アウトドア"], color: "navy", style_tags: ["カジュアル", "スポーティ"], season_tags: ["spring", "summer", "autumn"], overlay: { left: 0.365, top: 0.03, width: 0.27 } },
  { id: "10000000-0000-0000-0000-000000000009", name: "ベーシックなニット帽（チャコール）", image_url: "/mock/items/beanie-charcoal.svg", category: "headwear", sub_category: "knit_hat", scene_tags: ["休日", "街歩き"], color: "charcoal", style_tags: ["カジュアル", "ベーシック"], season_tags: ["autumn", "winter"], overlay: { left: 0.38, top: 0.0275, width: 0.24 } },
  { id: "10000000-0000-0000-0000-000000000010", name: "シルバーの腕時計", image_url: "/mock/items/watch-silver.svg", category: "accessory", sub_category: "watch", scene_tags: ["オフィスカジュアル", "会食", "休日"], color: "silver", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: { left: 0.695, top: 0.4525, width: 0.09 } },
  { id: "10000000-0000-0000-0000-000000000011", name: "黒のショルダーバッグ", image_url: "/mock/items/shoulder-bag-black.svg", category: "accessory", sub_category: "bag", scene_tags: ["休日", "旅行", "街歩き"], color: "black", style_tags: ["ミニマル", "カジュアル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: { left: 0.355, top: 0.165, width: 0.455 } },
];

export const MOCK_ITEMS: Item[] = seeds.map((s) => ({ ...s, user_id: DEMO_USER_ID, created_at: now }));

export const MOCK_OUTFITS: Outfit[] = [
  {
    id: "o-demo-1", user_id: DEMO_USER_ID, date: today, title: "週末の街歩き",
    top_item_id: seeds[2].id, bottom_item_id: seeds[3].id, outer_item_id: null, shoes_item_id: seeds[6].id,
    headwear_item_id: seeds[7].id, accessory_item_id: seeds[10].id,
    weather: "sunny", temperature: 18, scene: "休日", style: "カジュアル", color_base: "navy",
    trend_level: "balanced", source: "manual", ai_comment: null, tryon_image_url: null, created_at: now,
  },
  {
    id: "o-demo-2", user_id: DEMO_USER_ID, date: today, title: "大人のオフィスカジュアル",
    top_item_id: seeds[0].id, bottom_item_id: seeds[4].id, outer_item_id: seeds[5].id, shoes_item_id: seeds[6].id,
    headwear_item_id: null, accessory_item_id: seeds[9].id,
    weather: "cloudy", temperature: 20, scene: "オフィスカジュアル", style: "きれいめ", color_base: "navy",
    trend_level: "classic", source: "ai", ai_comment: "ネイビーのワントーンに黒スニーカーで抜け感を。シルバーの時計が50代らしい品の良さを添えます。",
    tryon_image_url: null, created_at: now,
  },
];
