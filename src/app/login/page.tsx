"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useStore } from "@/components/StoreProvider";

export default function LoginPage() {
  const router = useRouter();
  const { reload } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center text-sm">
        Supabase が未設定のため、デモモードで動作しています。ログインは不要です。
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = getSupabaseBrowserClient();
    const { error } =
      mode === "signin" ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "signup") setMsg("確認メールを送りました（ローカル環境では即ログインできます）");
    await reload();
    router.push("/fitting-room");
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-10 max-w-sm space-y-4 p-7">
      <h1 className="text-xl font-bold">{mode === "signin" ? "ログイン" : "新規登録"}</h1>
      <input className="input" type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="input" type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      {msg && <p className="text-xs text-ink/60">{msg}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "送信中…" : mode === "signin" ? "ログイン" : "登録する"}
      </button>
      <button type="button" className="w-full text-xs text-ink/50 underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "アカウントを作成する" : "ログインに戻る"}
      </button>
      <p className="text-center text-[11px] text-ink/40">ローカルの seed では demo@example.com / demo-password でログインできます</p>
    </form>
  );
}
