# AI Stylist（プロトタイプ）

自分のクローゼットを写真で登録し、自分の全身写真に重ねて「着せ替え」できる AI スタイリストアプリです。
Next.js (App Router) + Supabase + Tailwind CSS v4。

## すぐに試す（デモモード）

```bash
npm install
npm run dev   # http://localhost:3000
```

Supabase の環境変数が無い場合は **デモモード** で動きます。モックの全身写真と 11 点のアイテムが入った状態で始まり、
登録・編集したデータはブラウザ（localStorage）に保存されます。プロフィール画面から初期化できます。

## Supabase に接続する

1. `cp .env.local.example .env.local` して URL / anon key を設定
2. ローカルの場合：`supabase init` → `supabase/schema.sql` を migration として配置 → `supabase db reset`（`seed.sql` も流れます）
   クラウドの場合：SQL Editor で `schema.sql` を実行（`seed.sql` はローカル用のデモユーザーを作るので必要な場合のみ）
3. `/login` から `demo@example.com` / `demo-password`（seed 使用時）または新規登録

## 画面

| パス | 内容 |
| --- | --- |
| `/fitting-room` | バーチャル試着室。全身写真の上に透過アイテムをレイヤー表示。写真上のスワイプ（上下・左右）やタップで切替、位置調整、コーデ保存、AI合成（β）、AIスタイリスト提案 |
| `/closet` | デジタルクローゼット。カテゴリ・シーン・色で絞り込み。撮影/写真からの登録（簡易背景透過つき）と属性タグ編集 |
| `/profile` | 世代・基本スタイル・全身写真の登録 |
| `/login` | Supabase 接続時のログイン |

## 構成

```
supabase/          schema.sql（テーブル・RLS・Storage）, seed.sql
public/mock/       全身写真モック・透過アイテム SVG
src/app/           各ページ、api/suggest（コーデ提案）、api/tryon（外部AI試着APIのプレースホルダー）
src/components/    layout / profile / closet / fitting / ui
src/lib/           supabase/（client・server・middleware）, repo.ts（デモ⇔Supabase 切替）,
                   stylist.ts（提案ロジック）, overlay.ts（重ね位置）, image.ts（縮小・背景透過）
src/types/         database.ts
```

## 今後の拡張ポイント

- `src/app/api/tryon/route.ts`：Google Gemini の画像生成でAI試着（`GEMINI_API_KEY`、実装は `src/lib/tryon/gemini.ts`）
- `src/app/api/suggest/route.ts`：ルールベースの提案を LLM に置き換え（レスポンス形式はそのまま）
- `src/lib/image.ts`：簡易背景除去を remove.bg 等の切り抜き API に置き換え
