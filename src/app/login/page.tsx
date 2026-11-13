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
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setMsg(toJapanese(error.message));
      // Supabase の「Confirm email」がオンだとセッションは返らず、確認メールのリンクを踏むまでログインできない
      if (!data.session) {
        setMode("signin");
        return setMsg("確認メールを送りました。メール内のリンクを開いてから、ログインしてください。");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(toJapanese(error.message));
    }
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

function toJapanese(message: string): string {
  if (/email not confirmed/i.test(message)) return "メールアドレスの確認がまだです。確認メールのリンクを開いてからログインしてください。";
  if (/invalid login credentials/i.test(message)) return "メールアドレスかパスワードが違います（新規登録がまだの場合は「アカウントを作成する」から登録してください）。";
  if (/already registered/i.test(message)) return "このメールアドレスは登録済みです。ログインしてください。";
  if (/rate limit/i.test(message)) return "確認メールの送信回数の上限に達しました。しばらく待ってから再度お試しください。";
  return message;
}
