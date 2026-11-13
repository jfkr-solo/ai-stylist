"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { PageState, PageTitle } from "@/components/ui/PageState";
import { CategoryTabs } from "@/components/closet/CategoryTabs";
import { ItemCard } from "@/components/closet/ItemCard";
import { ItemForm } from "@/components/closet/ItemForm";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { COLORS, SCENES } from "@/lib/constants";
import type { Category, Item } from "@/types/database";

export default function ClosetPage() {
  return (
    <PageState>
      <ClosetContent />
    </PageState>
  );
}

function ClosetContent() {
  const { items, addItem, updateItem, deleteItem, uploadImage, importSamples } = useStore();
  const [importing, setImporting] = useState(false);
  const toast = useToast();
  const [tab, setTab] = useState<Category | "all">("all");
  const [scene, setScene] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.category] = (c[i.category] ?? 0) + 1));
    return c;
  }, [items]);

  const filtered = items.filter(
    (i) => (tab === "all" || i.category === tab) && (!scene || i.scene_tags.includes(scene)) && (!color || i.color === color),
  );
  const usedColors = COLORS.filter((c) => items.some((i) => i.color === c.id));

  return (
    <>
      <PageTitle en="MY CLOSET" ja="デジタルクローゼット">
        <button className="btn-gold" onClick={() => setAdding(true)}>
          ＋ アイテムを登録
        </button>
      </PageTitle>

      <div className="mb-5 space-y-3">
        <CategoryTabs value={tab} onChange={setTab} counts={counts} />
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          <span className="shrink-0 text-[11px] font-bold text-ink/40">シーン</span>
          {SCENES.map((s) => (
            <button key={s} className={`${scene === s ? "chip-on" : "chip-off"} shrink-0`} onClick={() => setScene(scene === s ? null : s)}>
              {s}
            </button>
          ))}
          <span className="ml-3 shrink-0 text-[11px] font-bold text-ink/40">色</span>
          {usedColors.map((c) => (
            <button
              key={c.id}
              title={c.label}
              onClick={() => setColor(color === c.id ? null : c.id)}
              className={`h-6 w-6 shrink-0 rounded-full border border-black/10 ${color === c.id ? "ring-2 ring-navy ring-offset-2" : ""}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center text-sm text-ink/50">
          <span className="text-4xl">👔</span>
          条件に合うアイテムがありません
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn-ghost" onClick={() => setAdding(true)}>写真から登録する</button>
            {items.length === 0 && (
              <button
                className="btn-primary"
                disabled={importing}
                onClick={async () => {
                  setImporting(true);
                  try {
                    toast.show(`サンプルアイテムを${await importSamples()}点追加しました`);
                  } catch (e) {
                    toast.show((e as Error).message);
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                {importing ? "取り込み中…" : "サンプルアイテムで試す"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          <button
            onClick={() => setAdding(true)}
            className="grid aspect-[4/5] place-items-center rounded-3xl border-2 border-dashed border-black/10 text-sm font-semibold text-ink/40 transition hover:border-gold hover:text-gold"
          >
            <span className="text-center">
              <span className="mb-1 block text-3xl">＋</span>写真から登録
            </span>
          </button>
          {filtered.map((i) => (
            <ItemCard key={i.id} item={i} onClick={() => setEditing(i)} />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/fitting-room" className="btn-primary">
          ✦ 試着室でコーデを組む
        </Link>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="アイテムを登録" wide>
        <ItemForm
          uploadImage={(d) => uploadImage("items", d)}
          onSubmit={async (item) => {
            await addItem(item);
            setAdding(false);
            toast.show("クローゼットに追加しました");
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="アイテムを編集" wide>
        {editing && (
          <ItemForm
            key={editing.id}
            initial={editing}
            uploadImage={(d) => uploadImage("items", d)}
            onSubmit={async (item) => {
              await updateItem(editing.id, item);
              setEditing(null);
              toast.show("保存しました");
            }}
            onDelete={async () => {
              await deleteItem(editing.id);
              setEditing(null);
              toast.show("削除しました");
            }}
          />
        )}
      </Modal>
      {toast.node}
    </>
  );
}
