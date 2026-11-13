-- =============================================================
-- プロAIスタイリスト : Supabase スキーマ定義
-- Next.js (App Router) + Supabase + Tailwind CSS
-- =============================================================

-- -------------------------------------------------------------
-- 0. 拡張・共通関数
-- -------------------------------------------------------------
create extension if not exists "pgcrypto";

-- updated_at 自動更新用
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- 1. 列挙型（カテゴリなど）
-- -------------------------------------------------------------
do $$ begin
  create type public.item_category as enum (
    'tops',       -- トップス
    'bottoms',    -- ボトムス
    'outer',      -- アウター
    'shoes',      -- 靴
    'headwear',   -- 帽子（キャップ・ニット帽など）
    'accessory'   -- 小物（バッグ・時計など）
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trend_level as enum (
    'classic',    -- 定番重視
    'balanced',   -- ほどよくトレンド
    'trendy'      -- トレンド強め
  );
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- 2. profiles : ユーザープロファイル ＆ 全身写真
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  display_name          text,
  generation            text,            -- 世代 例: '50代'
  base_style            text,            -- 基本となるスタイル 例: 'きれいめカジュアル'
  gender_preference     text check (gender_preference in ('mens', 'womens', 'unisex')),
  avatar_full_body_url  text,            -- 全身写真（試着のベース画像）
  height_cm             smallint,        -- 任意：重ね合わせ位置調整の参考値
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 3. items : 自分のアイテム（透過画像＋属性タグ）
-- -------------------------------------------------------------
create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,                    -- 例: 'ネイビー無地Tシャツ'
  image_url      text not null,                    -- 透過（切り抜き済）画像
  category       public.item_category not null,
  sub_category   text,                             -- 例: 'cap' / 'knit_hat' / 'bag' / 'watch'
  scene_tags     text[] not null default '{}',     -- 利用シーン 例: {'休日','街歩き'}
  color          text,                             -- メインカラー 例: 'navy'
  style_tags     text[] not null default '{}',     -- スタイルテイスト 例: {'きれいめ','ベーシック'}
  season_tags    text[] not null default '{}',     -- 季節 例: {'spring','autumn'}（AI提案の気温判定用）
  -- 試着オーバーレイの微調整値（全身写真に対する相対位置。null ならカテゴリ既定値を使用）
  overlay        jsonb,                            -- 例: {"top":0.22,"left":0.5,"width":0.46,"rotate":0}
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_items_user_category on public.items (user_id, category);
create index if not exists idx_items_scene_tags  on public.items using gin (scene_tags);
create index if not exists idx_items_style_tags  on public.items using gin (style_tags);

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 4. outfits : コーディネート（手動保存 / AI提案）
-- -------------------------------------------------------------
create table if not exists public.outfits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  date                date not null default current_date,
  title               text,                       -- 例: '週末の街歩きコーデ'
  top_item_id         uuid references public.items(id) on delete set null,
  bottom_item_id      uuid references public.items(id) on delete set null,
  outer_item_id       uuid references public.items(id) on delete set null,
  shoes_item_id       uuid references public.items(id) on delete set null,
  headwear_item_id    uuid references public.items(id) on delete set null,
  accessory_item_id   uuid references public.items(id) on delete set null,
  weather             text,                       -- 'sunny' / 'cloudy' / 'rainy' / 'snowy'
  temperature         smallint,                   -- ℃
  scene               text,                       -- 例: '休日'
  style               text,                       -- 例: 'きれいめカジュアル'
  color_base          text,                       -- 例: 'navy'
  trend_level         public.trend_level default 'balanced',
  source              text not null default 'manual' check (source in ('manual', 'ai')),
  ai_comment          text,                       -- AIスタイリストのコメント「こういう合わせ方はどう？」
  tryon_image_url     text,                       -- 外部AI試着APIの合成結果（将来用）
  created_at          timestamptz not null default now()
);

create index if not exists idx_outfits_user_date on public.outfits (user_id, date desc);

-- -------------------------------------------------------------
-- 5. Row Level Security（本人のデータのみ読み書き可）
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items    enable row level security;
alter table public.outfits  enable row level security;

create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "items_owner_all" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "outfits_owner_all" on public.outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 6. サインアップ時に profiles を自動作成
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- 7. Storage バケット（全身写真 / アイテム画像）
--    パス規約: {user_id}/{ファイル名}
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('items', 'items', true)
on conflict (id) do nothing;

create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('avatars', 'items'));

create policy "storage_owner_insert" on storage.objects
  for insert with check (
    bucket_id in ('avatars', 'items')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_owner_update" on storage.objects
  for update using (
    bucket_id in ('avatars', 'items')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_owner_delete" on storage.objects
  for delete using (
    bucket_id in ('avatars', 'items')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
