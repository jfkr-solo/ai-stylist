"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { PageState, PageTitle } from "@/components/ui/PageState";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { useToast } from "@/components/ui/Toast";
import { GENERATIONS, STYLES } from "@/lib/constants";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  return (
    <PageState>
      <ProfileContent />
    </PageState>
  );
}

const GENDERS: { id: NonNullable<Profile["gender_preference"]>; label: string }[] = [
  { id: "mens", label: "メンズ" },
  { id: "womens", label: "レディース" },
  { id: "unisex", label: "ユニセックス" },
];

function ProfileContent() {
  const { profile, saveProfile, uploadImage, mode, resetDemo, items, outfits } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await saveProfile({
        display_name: form.display_name ?? null,
        generation: form.generation ?? null,
        base_style: form.base_style ?? null,
        gender_preference: form.gender_preference ?? null,
        height_cm: form.height_cm ?? null,
      });
      toast.show("プロフィールを保存しました");
    } catch (e) {
      toast.show((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle en="PROFILE" ja="プロフィール" />
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <section className="card p-6">
          <h2 className="mb-4 text-center text-sm font-bold">全身写真（試着のベース）</h2>
          <AvatarUploader
            value={profile?.avatar_full_body_url ?? null}
            onChange={async (dataUrl) => {
              const url = await uploadImage("avatars", dataUrl);
              await saveProfile({ avatar_full_body_url: url });
              toast.show("全身写真を更新しました");
            }}
          />
        </section>

        <section className="card space-y-6 p-6">
          <div>
            <label className="label">ニックネーム</label>
            <input className="input" value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} placeholder="例：こうき" />
          </div>

          <div>
            <label className="label">世代</label>
            <div className="flex flex-wrap gap-2">
              {GENERATIONS.map((g) => (
                <button key={g} className={form.generation === g ? "chip-on" : "chip-off"} onClick={() => set("generation", g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">基本となるスタイル</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button key={s} className={form.base_style === s ? "chip-on" : "chip-off"} onClick={() => set("base_style", s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="label">アイテムの好み</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button key={g.id} className={form.gender_preference === g.id ? "chip-on" : "chip-off"} onClick={() => set("gender_preference", g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">身長（任意）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  className="input w-28"
                  value={form.height_cm ?? ""}
                  onChange={(e) => set("height_cm", e.target.value ? Number(e.target.value) : null)}
                />
                <span className="text-sm text-ink/50">cm</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-5">
            <p className="text-xs text-ink/50">
              登録アイテム {items.length} 点 ・ 保存コーデ {outfits.length} 件
            </p>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存する"}
            </button>
          </div>

          {mode === "demo" && (
            <div className="rounded-2xl bg-gold/10 p-4 text-xs leading-relaxed text-ink/70">
              現在は<b>デモモード</b>です（データはこのブラウザ内に保存）。<code>.env.local</code> に Supabase の URL とキーを設定すると、クラウドに保存されます。
              <button
                className="ml-2 font-bold text-gold underline"
                onClick={async () => {
                  await resetDemo();
                  toast.show("デモデータを初期状態に戻しました");
                }}
              >
                デモデータを初期化
              </button>
            </div>
          )}
        </section>
      </div>
      {toast.node}
    </>
  );
}
