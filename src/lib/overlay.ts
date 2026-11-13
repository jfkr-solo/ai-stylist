import type { Category, Item, Overlay } from "@/types/database";

/**
 * 全身写真（縦横比 1:2 の枠）に対する、カテゴリ別の既定の重ね位置。
 * アップロード画像はまずこの位置に置かれ、試着室の「位置調整」で微調整して item.overlay に保存する。
 */
export const DEFAULT_OVERLAY: Record<Category, Overlay> = {
  headwear: { left: 0.37, top: 0.03, width: 0.26 },
  tops: { left: 0.215, top: 0.157, width: 0.57 },
  outer: { left: 0.2, top: 0.15, width: 0.6 },
  bottoms: { left: 0.335, top: 0.43, width: 0.33 },
  shoes: { left: 0.32, top: 0.91, width: 0.36 },
  accessory: { left: 0.6, top: 0.42, width: 0.2 },
};

/** レイヤーの重なり順（大きいほど手前） */
export const LAYER_Z: Record<Category, number> = {
  bottoms: 10,
  shoes: 15,
  tops: 20,
  outer: 30,
  accessory: 40,
  headwear: 50,
};

export function getOverlay(item: Item): Overlay {
  return item.overlay ?? DEFAULT_OVERLAY[item.category];
}

/** 全身写真上のスワイプ領域（縦位置の割合）→ カテゴリ */
export function zoneAt(yRatio: number): Category {
  if (yRatio < 0.13) return "headwear";
  if (yRatio < 0.43) return "tops";
  if (yRatio < 0.88) return "bottoms";
  return "shoes";
}
