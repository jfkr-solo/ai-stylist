"use client";

import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

/** 読み込み中・未ログイン・エラー時の共通表示。問題なければ children を表示 */
export function PageState({ children }: { children: React.ReactNode }) {
  const { loading, needsLogin, error, reload } = useStore();
  if (loading)
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-ink/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      </div>
    );
  if (needsLogin)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <p className="mb-4 font-semibold">ログインすると、あなたのクローゼットが表示されます。</p>
        <Link href="/login" className="btn-primary">ログイン / 新規登録</Link>
      </div>
    );
  if (error)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <p className="mb-4 text-sm text-red-700">{error}</p>
        <button className="btn-ghost" onClick={reload}>再読み込み</button>
      </div>
    );
  return <>{children}</>;
}

export function PageTitle({ en, ja, children }: { en: string; ja: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7">
      <div>
        <p className="text-[11px] font-bold tracking-[.3em] text-gold">{en}</p>
        <h1 className="text-2xl font-bold md:text-3xl">{ja}</h1>
      </div>
      {children}
    </div>
  );
}
