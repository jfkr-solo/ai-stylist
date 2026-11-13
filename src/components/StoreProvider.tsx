"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Item, NewItem, NewOutfit, Outfit, Profile } from "@/types/database";
import { NotSignedInError, repo, resetDemoData } from "@/lib/repo";
import { MOCK_ITEMS, MOCK_PROFILE } from "@/lib/mock-data";

interface StoreValue {
  mode: "demo" | "supabase";
  loading: boolean;
  needsLogin: boolean;
  error: string | null;
  profile: Profile | null;
  items: Item[];
  outfits: Outfit[];
  reload(): Promise<void>;
  saveProfile(patch: Partial<Profile>): Promise<void>;
  uploadImage(bucket: "avatars" | "items", dataUrl: string): Promise<string>;
  addItem(item: NewItem): Promise<Item>;
  updateItem(id: string, patch: Partial<NewItem>): Promise<void>;
  deleteItem(id: string): Promise<void>;
  addOutfit(outfit: NewOutfit): Promise<void>;
  deleteOutfit(id: string): Promise<void>;
  resetDemo(): Promise<void>;
  importSamples(): Promise<number>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, i, o] = await Promise.all([repo.getProfile(), repo.listItems(), repo.listOutfits()]);
      setProfile(p);
      setItems(i);
      setOutfits(o);
      setNeedsLogin(false);
    } catch (e) {
      if (e instanceof NotSignedInError) setNeedsLogin(true);
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<StoreValue>(
    () => ({
      mode: repo.mode,
      loading,
      needsLogin,
      error,
      profile,
      items,
      outfits,
      reload,
      async saveProfile(patch) {
        setProfile(await repo.saveProfile(patch));
      },
      uploadImage: (bucket, dataUrl) => repo.uploadImage(bucket, dataUrl),
      async addItem(item) {
        const created = await repo.addItem(item);
        setItems((prev) => [created, ...prev]);
        return created;
      },
      async updateItem(id, patch) {
        const updated = await repo.updateItem(id, patch);
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      },
      async deleteItem(id) {
        await repo.deleteItem(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
      async addOutfit(outfit) {
        const created = await repo.addOutfit(outfit);
        setOutfits((prev) => [created, ...prev]);
      },
      async deleteOutfit(id) {
        await repo.deleteOutfit(id);
        setOutfits((prev) => prev.filter((o) => o.id !== id));
      },
      async importSamples() {
        // ログインユーザーのクローゼットにモックアイテムを複製（同名アイテムはスキップ）
        const existing = new Set(items.map((i) => i.name));
        const created: Item[] = [];
        for (const { id: _id, user_id: _u, created_at: _c, ...rest } of MOCK_ITEMS) {
          if (existing.has(rest.name)) continue;
          created.push(await repo.addItem(rest));
        }
        setItems((prev) => [...created, ...prev]);
        if (!profile?.avatar_full_body_url) {
          setProfile(
            await repo.saveProfile({
              avatar_full_body_url: MOCK_PROFILE.avatar_full_body_url,
              generation: profile?.generation ?? MOCK_PROFILE.generation,
              base_style: profile?.base_style ?? MOCK_PROFILE.base_style,
            }),
          );
        }
        return created.length;
      },
      async resetDemo() {
        resetDemoData();
        await reload();
      },
    }),
    [loading, needsLogin, error, profile, items, outfits, reload],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore は StoreProvider の内側で使用してください");
  return ctx;
}
