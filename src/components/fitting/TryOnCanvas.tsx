"use client";

import { useRef, useState } from "react";
import { CATEGORY_LABEL } from "@/lib/constants";
import { LAYER_Z, getOverlay, zoneAt } from "@/lib/overlay";
import type { Category, Item, Overlay } from "@/types/database";

interface Props {
  avatarUrl: string | null;
  items: Item[];
  /** 位置調整中のプレビュー値 */
  overrides?: Record<string, Overlay>;
  /** スワイプでアイテム切替（dir: 1=次, -1=前） */
  onSwipe?: (zone: Category, dir: 1 | -1) => void;
  onTapZone?: (zone: Category) => void;
  /** 位置調整モード：ドラッグで移動 */
  adjustItemId?: string | null;
  onDragAdjust?: (dxRatio: number, dyRatio: number) => void;
  compact?: boolean;
  className?: string;
}

/**
 * 全身写真の上に透過アイテム画像をレイヤーとして重ねるビジュアル試着キャンバス。
 * 枠は縦横比 1:2。各レイヤーは overlay（枠に対する割合）で配置する。
 */
export function TryOnCanvas({ avatarUrl, items, overrides, onSwipe, onTapZone, adjustItemId, onDragAdjust, compact, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; lastX: number; lastY: number } | null>(null);
  const [hint, setHint] = useState<{ zone: Category; dir: 1 | -1; key: number } | null>(null);
  const interactive = !compact && (onSwipe || onDragAdjust);

  function rect() {
    return ref.current!.getBoundingClientRect();
  }

  return (
    <div
      ref={ref}
      className={`relative aspect-[1/2] w-full select-none overflow-hidden bg-mist ${compact ? "rounded-2xl" : "rounded-[2rem] shadow-[0_20px_60px_-20px_rgba(31,42,68,.45)]"} ${className}`}
      style={interactive ? { touchAction: "none" } : undefined}
      onPointerDown={(e) => {
        if (!interactive) return;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!start.current || !adjustItemId || !onDragAdjust) return;
        const r = rect();
        onDragAdjust((e.clientX - start.current.lastX) / r.width, (e.clientY - start.current.lastY) / r.height);
        start.current.lastX = e.clientX;
        start.current.lastY = e.clientY;
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s || adjustItemId) return;
        const r = rect();
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        const zone = zoneAt((s.y - r.top) / r.height);
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) {
          onTapZone?.(zone);
          return;
        }
        const dir: 1 | -1 = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : dy < 0 ? 1 : -1;
        onSwipe?.(zone, dir);
        setHint({ zone, dir, key: Date.now() });
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="全身写真" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-xs text-ink/40">全身写真を登録してください</div>
      )}

      {items.map((item) => {
        const o = overrides?.[item.id] ?? getOverlay(item);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.image_url}
            alt={item.name}
            draggable={false}
            className={`animate-layer pointer-events-none absolute h-auto ${adjustItemId === item.id ? "outline-2 outline-offset-2 outline-dashed outline-gold" : ""}`}
            style={{
              left: `${o.left * 100}%`,
              top: `${o.top * 100}%`,
              width: `${o.width * 100}%`,
              zIndex: LAYER_Z[item.category],
              transform: o.rotate ? `rotate(${o.rotate}deg)` : undefined,
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,.18))",
            }}
          />
        );
      })}

      {hint && (
        <div key={hint.key} className="animate-pop pointer-events-none absolute inset-x-0 bottom-4 z-[60] flex justify-center">
          <span className="rounded-full bg-ink/75 px-3 py-1 text-[11px] font-semibold text-white">
            {CATEGORY_LABEL[hint.zone]} {hint.dir === 1 ? "→ 次へ" : "← 前へ"}
          </span>
        </div>
      )}
    </div>
  );
}
