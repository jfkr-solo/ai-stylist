-- =============================================================
-- プロAIスタイリスト : 初期データ（ローカル検証用）
-- `supabase db reset` で schema.sql の後に流れる想定
-- 画像は Next.js の public/mock 配下の透過SVG（モック）を参照。overlay は全身写真モックに合わせた重ね位置
-- =============================================================

-- デモユーザー（ローカル専用。パスワード: demo-password）
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@example.com',
  crypt('demo-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"デモ"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"demo@example.com","email_verified":true}',
  'email', now(), now(), now()
) on conflict do nothing;

-- プロファイル（トリガーで作成済みなら更新）
insert into public.profiles (user_id, display_name, generation, base_style, gender_preference, avatar_full_body_url, height_cm)
values (
  '00000000-0000-0000-0000-000000000001',
  'デモ', '50代', 'きれいめカジュアル', 'mens',
  '/mock/avatar/full-body-man.svg', 172
)
on conflict (user_id) do update set
  generation           = excluded.generation,
  base_style           = excluded.base_style,
  gender_preference    = excluded.gender_preference,
  avatar_full_body_url = excluded.avatar_full_body_url,
  height_cm            = excluded.height_cm;

-- アイテム（透過済み風モック画像）
insert into public.items (id, user_id, name, image_url, category, sub_category, scene_tags, color, style_tags, season_tags, overlay) values
  -- トップス
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'ネイビー無地Tシャツ（上質コットン）', '/mock/items/tee-navy.svg', 'tops', 'tshirt',
   '{休日,街歩き,オフィスカジュアル}', 'navy', '{ベーシック,きれいめ}', '{spring,summer,autumn}', '{"left":0.215,"top":0.1575,"width":0.57}'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'グレー無地Tシャツ', '/mock/items/tee-gray.svg', 'tops', 'tshirt',
   '{休日,旅行}', 'gray', '{ベーシック,リラックス}', '{spring,summer,autumn}', '{"left":0.215,"top":0.1575,"width":0.57}'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'ネイビースウェット', '/mock/items/sweat-navy.svg', 'tops', 'sweatshirt',
   '{休日,ジム帰り,街歩き}', 'navy', '{カジュアル,ベーシック}', '{autumn,winter,spring}', '{"left":0.21,"top":0.155,"width":0.58}'),
  -- ボトムス
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   'ダークデニム（ストレート）', '/mock/items/denim-dark.svg', 'bottoms', 'denim',
   '{休日,街歩き,旅行}', 'indigo', '{ベーシック,アメカジ}', '{spring,summer,autumn,winter}', '{"left":0.335,"top":0.42875,"width":0.33}'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
   'チャコールグレーのスラックス', '/mock/items/slacks-charcoal.svg', 'bottoms', 'slacks',
   '{オフィスカジュアル,会食}', 'charcoal', '{きれいめ}', '{spring,autumn,winter}', '{"left":0.335,"top":0.42875,"width":0.33}'),
  -- アウター
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
   'ネイビーのテーラードジャケット', '/mock/items/jacket-navy.svg', 'outer', 'jacket',
   '{オフィスカジュアル,会食}', 'navy', '{きれいめ,トラッド}', '{spring,autumn}', '{"left":0.2,"top":0.15,"width":0.6}'),
  -- 靴
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
   '黒のレザースニーカー', '/mock/items/sneakers-black.svg', 'shoes', 'sneakers',
   '{休日,街歩き,オフィスカジュアル}', 'black', '{きれいめ,ミニマル}', '{spring,summer,autumn,winter}', '{"left":0.32,"top":0.91,"width":0.36}'),
  -- 帽子
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
   'ネイビーのキャップ', '/mock/items/cap-navy.svg', 'headwear', 'cap',
   '{休日,旅行,アウトドア}', 'navy', '{カジュアル,スポーティ}', '{spring,summer,autumn}', '{"left":0.365,"top":0.03,"width":0.27}'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
   'ベーシックなニット帽（チャコール）', '/mock/items/beanie-charcoal.svg', 'headwear', 'knit_hat',
   '{休日,街歩き}', 'charcoal', '{カジュアル,ベーシック}', '{autumn,winter}', '{"left":0.38,"top":0.0275,"width":0.24}'),
  -- 小物
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'シルバーの腕時計', '/mock/items/watch-silver.svg', 'accessory', 'watch',
   '{オフィスカジュアル,会食,休日}', 'silver', '{きれいめ,ミニマル}', '{spring,summer,autumn,winter}', '{"left":0.695,"top":0.4525,"width":0.09}'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   '黒のショルダーバッグ', '/mock/items/shoulder-bag-black.svg', 'accessory', 'bag',
   '{休日,旅行,街歩き}', 'black', '{ミニマル,カジュアル}', '{spring,summer,autumn,winter}', '{"left":0.355,"top":0.165,"width":0.455}')
on conflict (id) do nothing;

-- サンプルコーデ（手動 / AI提案 各1件）
insert into public.outfits (
  user_id, date, title, top_item_id, bottom_item_id, outer_item_id, shoes_item_id,
  headwear_item_id, accessory_item_id, weather, temperature, scene, style, color_base,
  trend_level, source, ai_comment
) values
  ('00000000-0000-0000-0000-000000000001', current_date, '週末の街歩き',
   '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', null,
   '10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000011', 'sunny', 18, '休日', 'カジュアル', 'navy',
   'balanced', 'manual', null),
  ('00000000-0000-0000-0000-000000000001', current_date, '大人のオフィスカジュアル',
   '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', null,
   '10000000-0000-0000-0000-000000000010', 'cloudy', 20, 'オフィスカジュアル', 'きれいめ', 'navy',
   'classic', 'ai',
   'ネイビーのワントーンに黒スニーカーで抜け感を。シルバーの時計が50代らしい品の良さを添えます。');
