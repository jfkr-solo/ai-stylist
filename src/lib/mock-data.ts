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

/** サンプル60点（写真は scripts/sample-images で作成、出典は public/mock/items/CREDITS.md） */
const seeds: Seed[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "ネイビー無地Tシャツ（上質コットン）", image_url: "/mock/items/tee-navy.webp", category: "tops", sub_category: "tshirt", scene_tags: ["休日", "街歩き", "オフィスカジュアル"], color: "navy", style_tags: ["ベーシック", "きれいめ"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000002", name: "白の無地Tシャツ", image_url: "/mock/items/tee-white.webp", category: "tops", sub_category: "tshirt", scene_tags: ["休日", "旅行"], color: "white", style_tags: ["ベーシック", "ミニマル"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000003", name: "グレー無地Tシャツ", image_url: "/mock/items/tee-gray.webp", category: "tops", sub_category: "tshirt", scene_tags: ["休日", "旅行"], color: "gray", style_tags: ["ベーシック", "リラックス"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000004", name: "ネイビーの鹿の子ポロシャツ", image_url: "/mock/items/polo-navy.webp", category: "tops", sub_category: "polo", scene_tags: ["オフィスカジュアル", "休日", "会食"], color: "navy", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000005", name: "サックスブルーのオックスフォードシャツ", image_url: "/mock/items/oxford-shirt-blue.webp", category: "tops", sub_category: "shirt", scene_tags: ["オフィスカジュアル", "会食"], color: "blue", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000006", name: "白のブロードシャツ", image_url: "/mock/items/shirt-white.webp", category: "tops", sub_category: "shirt", scene_tags: ["オフィスカジュアル", "会食"], color: "white", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000007", name: "白のスウェット", image_url: "/mock/items/sweat-white.webp", category: "tops", sub_category: "sweatshirt", scene_tags: ["休日", "ジム帰り", "街歩き"], color: "white", style_tags: ["カジュアル", "ベーシック"], season_tags: ["autumn", "winter", "spring"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000008", name: "ネイビーのクルーネックニット", image_url: "/mock/items/knit-crew-navy.webp", category: "tops", sub_category: "knit", scene_tags: ["オフィスカジュアル", "会食", "休日"], color: "navy", style_tags: ["きれいめ", "ベーシック"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000009", name: "グレーの鹿の子ポロシャツ", image_url: "/mock/items/polo-gray.webp", category: "tops", sub_category: "polo", scene_tags: ["休日", "オフィスカジュアル", "旅行"], color: "gray", style_tags: ["きれいめ", "ベーシック"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000010", name: "ブルーのヘンリーネック長袖", image_url: "/mock/items/henley-blue.webp", category: "tops", sub_category: "longsleeve", scene_tags: ["休日", "アウトドア"], color: "blue", style_tags: ["カジュアル", "アメカジ"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000011", name: "ダークデニム（ストレート）", image_url: "/mock/items/denim-dark.webp", category: "bottoms", sub_category: "denim", scene_tags: ["休日", "街歩き", "旅行"], color: "indigo", style_tags: ["ベーシック", "アメカジ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000012", name: "ブラックデニム（スリム）", image_url: "/mock/items/denim-black.webp", category: "bottoms", sub_category: "denim", scene_tags: ["休日", "街歩き"], color: "black", style_tags: ["ミニマル", "モード"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000013", name: "チャコールグレーのスラックス", image_url: "/mock/items/slacks-charcoal.webp", category: "bottoms", sub_category: "slacks", scene_tags: ["オフィスカジュアル", "会食"], color: "charcoal", style_tags: ["きれいめ"], season_tags: ["spring", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000014", name: "ネイビーのウールスラックス", image_url: "/mock/items/slacks-navy.webp", category: "bottoms", sub_category: "slacks", scene_tags: ["オフィスカジュアル", "会食"], color: "navy", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000015", name: "ベージュのチノパン", image_url: "/mock/items/chino-beige.webp", category: "bottoms", sub_category: "chino", scene_tags: ["休日", "オフィスカジュアル", "旅行"], color: "beige", style_tags: ["トラッド", "ベーシック"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000016", name: "ネイビーのチノパン", image_url: "/mock/items/chino-navy.webp", category: "bottoms", sub_category: "chino", scene_tags: ["休日", "オフィスカジュアル"], color: "navy", style_tags: ["トラッド", "きれいめ"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000017", name: "オリーブのチノパン", image_url: "/mock/items/chino-olive.webp", category: "bottoms", sub_category: "chino", scene_tags: ["休日", "アウトドア"], color: "olive", style_tags: ["カジュアル", "アメカジ"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000018", name: "カーキのカーゴパンツ", image_url: "/mock/items/cargo-khaki.webp", category: "bottoms", sub_category: "cargo", scene_tags: ["アウトドア", "旅行"], color: "olive", style_tags: ["カジュアル", "アメカジ"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000019", name: "黒のイージーパンツ", image_url: "/mock/items/easy-pants-black.webp", category: "bottoms", sub_category: "easy", scene_tags: ["休日", "ジム帰り", "旅行"], color: "black", style_tags: ["リラックス", "スポーティ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000020", name: "ネイビーのショートパンツ", image_url: "/mock/items/shorts-navy.webp", category: "bottoms", sub_category: "shorts", scene_tags: ["休日", "旅行"], color: "navy", style_tags: ["カジュアル", "リラックス"], season_tags: ["summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000021", name: "ネイビーのテーラードジャケット", image_url: "/mock/items/jacket-navy.webp", category: "outer", sub_category: "jacket", scene_tags: ["オフィスカジュアル", "会食"], color: "navy", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000022", name: "グレーのウールジャケット", image_url: "/mock/items/jacket-gray.webp", category: "outer", sub_category: "jacket", scene_tags: ["オフィスカジュアル", "会食"], color: "gray", style_tags: ["きれいめ", "トラッド"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000023", name: "ライトグレーのチェスターコート", image_url: "/mock/items/coat-chester-gray.webp", category: "outer", sub_category: "coat", scene_tags: ["オフィスカジュアル", "会食", "街歩き"], color: "gray", style_tags: ["きれいめ", "ミニマル"], season_tags: ["winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000024", name: "ベージュのトレンチコート", image_url: "/mock/items/trench-beige.webp", category: "outer", sub_category: "coat", scene_tags: ["オフィスカジュアル", "街歩き"], color: "beige", style_tags: ["トラッド", "きれいめ"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000025", name: "白のダウンジャケット", image_url: "/mock/items/down-white.webp", category: "outer", sub_category: "down", scene_tags: ["休日", "アウトドア", "旅行"], color: "white", style_tags: ["カジュアル", "スポーティ"], season_tags: ["winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000026", name: "インディゴのデニムジャケット", image_url: "/mock/items/denim-jacket.webp", category: "outer", sub_category: "jacket", scene_tags: ["休日", "街歩き"], color: "indigo", style_tags: ["アメカジ", "カジュアル"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000027", name: "黒のスイングトップ", image_url: "/mock/items/blouson-black.webp", category: "outer", sub_category: "blouson", scene_tags: ["休日", "街歩き"], color: "black", style_tags: ["カジュアル", "トラッド"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000028", name: "黒のニットカーディガン", image_url: "/mock/items/cardigan-black.webp", category: "outer", sub_category: "cardigan", scene_tags: ["オフィスカジュアル", "休日"], color: "black", style_tags: ["きれいめ", "ベーシック"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000029", name: "オリーブのフィールドジャケット", image_url: "/mock/items/field-jacket-olive.webp", category: "outer", sub_category: "jacket", scene_tags: ["アウトドア", "休日"], color: "olive", style_tags: ["アメカジ", "カジュアル"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000030", name: "ブラウンのシャツジャケット", image_url: "/mock/items/shirt-jacket-brown.webp", category: "outer", sub_category: "jacket", scene_tags: ["休日", "街歩き"], color: "brown", style_tags: ["カジュアル", "アメカジ"], season_tags: ["autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000031", name: "黒のレザースニーカー", image_url: "/mock/items/sneakers-black.webp", category: "shoes", sub_category: "sneakers", scene_tags: ["休日", "街歩き", "オフィスカジュアル"], color: "black", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000032", name: "白のレザースニーカー", image_url: "/mock/items/sneakers-white.webp", category: "shoes", sub_category: "sneakers", scene_tags: ["休日", "街歩き"], color: "white", style_tags: ["ミニマル", "きれいめ"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000033", name: "グレーのスエードスニーカー", image_url: "/mock/items/sneakers-gray-suede.webp", category: "shoes", sub_category: "sneakers", scene_tags: ["休日", "旅行"], color: "gray", style_tags: ["カジュアル", "スポーティ"], season_tags: ["spring", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000034", name: "ベージュスエードのビットローファー", image_url: "/mock/items/loafer-beige-suede.webp", category: "shoes", sub_category: "loafer", scene_tags: ["オフィスカジュアル", "会食"], color: "beige", style_tags: ["トラッド", "きれいめ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000035", name: "ブラウンのローファー", image_url: "/mock/items/loafer-brown.webp", category: "shoes", sub_category: "loafer", scene_tags: ["オフィスカジュアル", "休日"], color: "brown", style_tags: ["トラッド"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000036", name: "チャコールスエードのチャッカブーツ", image_url: "/mock/items/chukka-charcoal-suede.webp", category: "shoes", sub_category: "boots", scene_tags: ["休日", "街歩き"], color: "charcoal", style_tags: ["トラッド", "カジュアル"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000037", name: "黒のサイドゴアブーツ", image_url: "/mock/items/chelsea-black.webp", category: "shoes", sub_category: "boots", scene_tags: ["会食", "街歩き"], color: "black", style_tags: ["きれいめ", "モード"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000038", name: "黒のプレーントゥ", image_url: "/mock/items/derby-black.webp", category: "shoes", sub_category: "dress", scene_tags: ["オフィスカジュアル", "会食"], color: "black", style_tags: ["きれいめ", "トラッド"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000039", name: "ネイビーのキャンバススニーカー", image_url: "/mock/items/canvas-navy.webp", category: "shoes", sub_category: "sneakers", scene_tags: ["休日", "旅行"], color: "navy", style_tags: ["カジュアル", "ベーシック"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000040", name: "黒のトレイルシューズ", image_url: "/mock/items/trail-black.webp", category: "shoes", sub_category: "sneakers", scene_tags: ["アウトドア", "旅行"], color: "black", style_tags: ["スポーティ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000041", name: "ネイビーのキャップ", image_url: "/mock/items/cap-navy.webp", category: "headwear", sub_category: "cap", scene_tags: ["休日", "旅行", "アウトドア"], color: "navy", style_tags: ["カジュアル", "スポーティ"], season_tags: ["spring", "summer", "autumn"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000042", name: "黒のキャップ", image_url: "/mock/items/cap-black.webp", category: "headwear", sub_category: "cap", scene_tags: ["休日", "ジム帰り"], color: "black", style_tags: ["スポーティ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000043", name: "ベージュのキャップ", image_url: "/mock/items/cap-beige.webp", category: "headwear", sub_category: "cap", scene_tags: ["休日", "旅行"], color: "beige", style_tags: ["カジュアル"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000044", name: "ベーシックなニット帽（チャコール）", image_url: "/mock/items/beanie-charcoal.webp", category: "headwear", sub_category: "knit_hat", scene_tags: ["休日", "街歩き"], color: "charcoal", style_tags: ["カジュアル", "ベーシック"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000045", name: "ネイビーのニット帽", image_url: "/mock/items/beanie-navy.webp", category: "headwear", sub_category: "knit_hat", scene_tags: ["休日", "アウトドア"], color: "navy", style_tags: ["カジュアル"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000046", name: "黒のニット帽", image_url: "/mock/items/beanie-black.webp", category: "headwear", sub_category: "knit_hat", scene_tags: ["街歩き", "休日"], color: "black", style_tags: ["ミニマル"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000047", name: "オリーブのバケットハット", image_url: "/mock/items/bucket-olive.webp", category: "headwear", sub_category: "hat", scene_tags: ["アウトドア", "旅行"], color: "olive", style_tags: ["カジュアル", "アメカジ"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000048", name: "パナマハット", image_url: "/mock/items/panama-hat.webp", category: "headwear", sub_category: "hat", scene_tags: ["休日", "旅行"], color: "beige", style_tags: ["トラッド", "リラックス"], season_tags: ["summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000049", name: "キャメルの中折れハット", image_url: "/mock/items/fedora-camel.webp", category: "headwear", sub_category: "hat", scene_tags: ["街歩き", "会食"], color: "brown", style_tags: ["トラッド", "きれいめ"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000050", name: "ブラウンのハンチング", image_url: "/mock/items/hunting-cap-brown.webp", category: "headwear", sub_category: "hat", scene_tags: ["街歩き", "休日"], color: "brown", style_tags: ["トラッド"], season_tags: ["autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000051", name: "白文字盤のクロノグラフ腕時計（メタルバンド）", image_url: "/mock/items/watch-silver.webp", category: "accessory", sub_category: "watch", scene_tags: ["オフィスカジュアル", "会食", "休日"], color: "black", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000052", name: "黒文字盤の革ベルト腕時計", image_url: "/mock/items/watch-leather-brown.webp", category: "accessory", sub_category: "watch", scene_tags: ["オフィスカジュアル", "会食"], color: "black", style_tags: ["トラッド", "きれいめ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000053", name: "黒のショルダーバッグ", image_url: "/mock/items/shoulder-bag-black.webp", category: "accessory", sub_category: "bag", scene_tags: ["休日", "旅行", "街歩き"], color: "black", style_tags: ["ミニマル", "カジュアル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000054", name: "生成りのキャンバストート", image_url: "/mock/items/tote-natural.webp", category: "accessory", sub_category: "bag", scene_tags: ["休日", "旅行"], color: "beige", style_tags: ["カジュアル", "ベーシック"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000055", name: "黒のブリーフケース", image_url: "/mock/items/briefcase-black.webp", category: "accessory", sub_category: "bag", scene_tags: ["オフィスカジュアル"], color: "black", style_tags: ["きれいめ", "ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000056", name: "黒のレザーリュック", image_url: "/mock/items/backpack-black.webp", category: "accessory", sub_category: "bag", scene_tags: ["オフィスカジュアル", "旅行"], color: "black", style_tags: ["ミニマル"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000057", name: "黒のウェリントンサングラス", image_url: "/mock/items/sunglasses-black.webp", category: "accessory", sub_category: "glasses", scene_tags: ["休日", "旅行"], color: "black", style_tags: ["カジュアル", "トラッド"], season_tags: ["spring", "summer"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000058", name: "べっ甲柄のメガネ", image_url: "/mock/items/glasses-tortoise.webp", category: "accessory", sub_category: "glasses", scene_tags: ["オフィスカジュアル", "会食"], color: "brown", style_tags: ["トラッド", "きれいめ"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000059", name: "ブラウンのレザーベルト", image_url: "/mock/items/belt-brown.webp", category: "accessory", sub_category: "other", scene_tags: ["オフィスカジュアル", "休日"], color: "brown", style_tags: ["トラッド", "ベーシック"], season_tags: ["spring", "summer", "autumn", "winter"], overlay: null },
  { id: "10000000-0000-0000-0000-000000000060", name: "グレーのウールマフラー", image_url: "/mock/items/scarf-gray.webp", category: "accessory", sub_category: "other", scene_tags: ["街歩き", "オフィスカジュアル"], color: "gray", style_tags: ["きれいめ", "ベーシック"], season_tags: ["winter"], overlay: null },
];

export const MOCK_ITEMS: Item[] = seeds.map((s) => ({ ...s, user_id: DEMO_USER_ID, created_at: now }));

/** 画像ファイル名（slug）からサンプルの id を引く */
const byImage = (slug: string) => {
  const s = seeds.find((x) => x.image_url === `/mock/items/${slug}.webp`);
  if (!s) throw new Error(`unknown sample item: ${slug}`);
  return s.id;
};

export const MOCK_OUTFITS: Outfit[] = [
  {
    id: "o-demo-1", user_id: DEMO_USER_ID, date: today, title: "週末の街歩き",
    top_item_id: byImage("sweat-white"), bottom_item_id: byImage("denim-dark"), outer_item_id: null, shoes_item_id: byImage("sneakers-white"),
    headwear_item_id: byImage("cap-navy"), accessory_item_id: byImage("shoulder-bag-black"),
    weather: "sunny", temperature: 18, scene: "休日", style: "カジュアル", color_base: "navy",
    trend_level: "balanced", source: "manual", ai_comment: null, tryon_image_url: null, created_at: now,
  },
  {
    id: "o-demo-2", user_id: DEMO_USER_ID, date: today, title: "大人のオフィスカジュアル",
    top_item_id: byImage("tee-navy"), bottom_item_id: byImage("slacks-charcoal"), outer_item_id: byImage("jacket-navy"), shoes_item_id: byImage("sneakers-black"),
    headwear_item_id: null, accessory_item_id: byImage("watch-silver"),
    weather: "cloudy", temperature: 20, scene: "オフィスカジュアル", style: "きれいめ", color_base: "navy",
    trend_level: "classic", source: "ai", ai_comment: "ネイビーのジャケットにチャコールのスラックスで上品に、黒スニーカーで抜け感を。シルバーの時計が50代らしい品の良さを添えます。",
    tryon_image_url: null, created_at: now,
  },
];
