"use client";

import type { Item, NewItem, NewOutfit, Outfit, Profile } from "@/types/database";
import { DEMO_USER_ID, MOCK_ITEMS, MOCK_OUTFITS, MOCK_PROFILE } from "./mock-data";
import { isSupabaseConfigured } from "./supabase/config";
import { getSupabaseBrowserClient } from "./supabase/client";
import { dataUrlToBlob } from "./image";

export class NotSignedInError extends Error {
  constructor() {
    super("ログインが必要です");
  }
}

/** データアクセスの共通インターフェース（デモ / Supabase を切り替え） */
export interface Repo {
  mode: "demo" | "supabase";
  getProfile(): Promise<Profile>;
  saveProfile(patch: Partial<Profile>): Promise<Profile>;
  uploadImage(bucket: "avatars" | "items", dataUrl: string): Promise<string>;
  listItems(): Promise<Item[]>;
  addItem(item: NewItem): Promise<Item>;
  updateItem(id: string, patch: Partial<NewItem>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  listOutfits(): Promise<Outfit[]>;
  addOutfit(outfit: NewOutfit): Promise<Outfit>;
  deleteOutfit(id: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* デモモード：localStorage に保存（初回はモックデータ）                */
/* ------------------------------------------------------------------ */

const KEY = "ai-stylist:demo:v1";
interface DemoState {
  profile: Profile;
  items: Item[];
  outfits: Outfit[];
}

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* 読み込めない場合は初期データ */
  }
  return { profile: MOCK_PROFILE, items: MOCK_ITEMS, outfits: MOCK_OUTFITS };
}

function saveDemo(state: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    throw new Error("ブラウザの保存容量を超えました。不要なアイテムを削除するか、Supabase に接続してください。");
  }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const demoRepo: Repo = {
  mode: "demo",
  async getProfile() {
    return loadDemo().profile;
  },
  async saveProfile(patch) {
    const s = loadDemo();
    s.profile = { ...s.profile, ...patch };
    saveDemo(s);
    return s.profile;
  },
  async uploadImage(_bucket, dataUrl) {
    return dataUrl; // デモでは data URL をそのまま保存
  },
  async listItems() {
    return loadDemo().items;
  },
  async addItem(item) {
    const s = loadDemo();
    const created: Item = { ...item, id: uid(), user_id: DEMO_USER_ID, created_at: new Date().toISOString() };
    s.items = [created, ...s.items];
    saveDemo(s);
    return created;
  },
  async updateItem(id, patch) {
    const s = loadDemo();
    s.items = s.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    saveDemo(s);
    return s.items.find((i) => i.id === id)!;
  },
  async deleteItem(id) {
    const s = loadDemo();
    s.items = s.items.filter((i) => i.id !== id);
    saveDemo(s);
  },
  async listOutfits() {
    return loadDemo().outfits;
  },
  async addOutfit(outfit) {
    const s = loadDemo();
    const created: Outfit = { ...outfit, id: uid(), user_id: DEMO_USER_ID, created_at: new Date().toISOString() };
    s.outfits = [created, ...s.outfits];
    saveDemo(s);
    return created;
  },
  async deleteOutfit(id) {
    const s = loadDemo();
    s.outfits = s.outfits.filter((o) => o.id !== id);
    saveDemo(s);
  },
};

export function resetDemoData() {
  localStorage.removeItem(KEY);
}

/* ------------------------------------------------------------------ */
/* Supabase モード                                                      */
/* ------------------------------------------------------------------ */

async function currentUserId(): Promise<string> {
  const { data } = await getSupabaseBrowserClient().auth.getUser();
  if (!data.user) throw new NotSignedInError();
  return data.user.id;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const supabaseRepo: Repo = {
  mode: "supabase",
  async getProfile() {
    const sb = getSupabaseBrowserClient();
    const user_id = await currentUserId();
    const existing = unwrap(await sb.from("profiles").select("*").eq("user_id", user_id).maybeSingle());
    if (existing) return existing as Profile;
    return unwrap(await sb.from("profiles").insert({ user_id }).select().single()) as Profile;
  },
  async saveProfile(patch) {
    const sb = getSupabaseBrowserClient();
    const user_id = await currentUserId();
    const { id: _id, user_id: _u, created_at: _c, ...rest } = patch;
    return unwrap(await sb.from("profiles").update(rest).eq("user_id", user_id).select().single()) as Profile;
  },
  async uploadImage(bucket, dataUrl) {
    const sb = getSupabaseBrowserClient();
    const user_id = await currentUserId();
    const blob = await dataUrlToBlob(dataUrl);
    const ext = blob.type.split("/")[1] ?? "png";
    const path = `${user_id}/${uid()}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type });
    if (error) throw new Error(error.message);
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
  async listItems() {
    const sb = getSupabaseBrowserClient();
    await currentUserId();
    return unwrap(await sb.from("items").select("*").order("created_at", { ascending: false })) as Item[];
  },
  async addItem(item) {
    const sb = getSupabaseBrowserClient();
    const user_id = await currentUserId();
    return unwrap(await sb.from("items").insert({ ...item, user_id }).select().single()) as Item;
  },
  async updateItem(id, patch) {
    const sb = getSupabaseBrowserClient();
    return unwrap(await sb.from("items").update(patch).eq("id", id).select().single()) as Item;
  },
  async deleteItem(id) {
    const { error } = await getSupabaseBrowserClient().from("items").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async listOutfits() {
    const sb = getSupabaseBrowserClient();
    await currentUserId();
    return unwrap(await sb.from("outfits").select("*").order("created_at", { ascending: false })) as Outfit[];
  },
  async addOutfit(outfit) {
    const sb = getSupabaseBrowserClient();
    const user_id = await currentUserId();
    return unwrap(await sb.from("outfits").insert({ ...outfit, user_id }).select().single()) as Outfit;
  },
  async deleteOutfit(id) {
    const { error } = await getSupabaseBrowserClient().from("outfits").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const repo: Repo = isSupabaseConfigured ? supabaseRepo : demoRepo;
