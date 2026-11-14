import { NextResponse } from "next/server";
import { generateTryOnWithGemini, TryOnError, type InlineImage } from "@/lib/tryon/gemini";
import { isSupabaseConfigured, SUPABASE_URL } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

// 画像生成は10〜30秒ほどかかるため、Vercel の関数の上限を延ばす
export const maxDuration = 60;

interface TryOnRequest {
  person_image_url: string | null;
  garments: { category: Category; image_url: string }[];
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

/**
 * AI試着（バーチャル Try-On）。
 * GOOGLE_CLOUD_API_KEY（Vertex AI）か GEMINI_API_KEY（AI Studio）が設定されていれば Google Gemini の画像生成で着せ替え画像を作り、data URL で返す。
 * 未設定なら status: "mock" を返し、フロントは透過画像のレイヤー合成をそのまま表示する。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as TryOnRequest;
  // Vertex AI（Google Cloud）のキーがあれば優先。無料トライアルのクレジットはこちらでしか使えない
  const vertexKey = process.env.GOOGLE_CLOUD_API_KEY;
  const apiKey = vertexKey || process.env.GEMINI_API_KEY || process.env.TRYON_API_KEY;

  if (!body.person_image_url || !Array.isArray(body.garments) || body.garments.length === 0) {
    return NextResponse.json({ status: "error", message: "全身写真とアイテムを選んでください。", image_url: null }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      status: "mock",
      image_url: null,
      message:
        "AI試着はまだ設定されていないため、透過画像のレイヤー合成でプレビューしています。環境変数 GOOGLE_CLOUD_API_KEY（または GEMINI_API_KEY）を設定すると、シワや影まで自然に合成された画像に置き換わります。",
    });
  }

  // 本番（Supabase 接続時）はログイン中のユーザーだけが使える（APIの利用料金を守るため）
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ status: "error", message: "AI試着を使うにはログインしてください。", image_url: null }, { status: 401 });
    }
  }

  try {
    const origin = new URL(req.url).origin;
    if (/\.svg($|\?)|^data:image\/svg/i.test(body.person_image_url)) {
      throw new TryOnError("AI試着には自分の全身写真が必要です。プロフィールから写真を登録してください。", 400);
    }
    const person = await loadImage(body.person_image_url, origin);
    const garments = await Promise.all(
      body.garments.slice(0, 6).map(async (g) => ({ category: g.category, image: await loadImage(g.image_url, origin) })),
    );
    const result = await generateTryOnWithGemini({
      apiKey,
      backend: vertexKey ? "vertex" : "ai-studio",
      model: process.env.TRYON_MODEL,
      person,
      garments,
    });
    return NextResponse.json({
      status: "ok",
      image_url: `data:${result.mimeType};base64,${result.data}`,
      message: "AIで合成しました。実際の着用感とは異なる場合があります。",
    });
  } catch (e) {
    const status = e instanceof TryOnError ? e.status : 500;
    const message = e instanceof TryOnError ? e.message : "AI試着の生成に失敗しました。";
    if (!(e instanceof TryOnError)) console.error("[tryon]", e);
    return NextResponse.json({ status: "error", image_url: null, message }, { status });
  }
}

/** data URL・アプリ内の画像（/mock/...）・Supabase Storage の画像を base64 にする。それ以外のURLは取りに行かない。 */
async function loadImage(url: string, origin: string): Promise<InlineImage> {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(url);
  if (m) {
    if (!ALLOWED_MIME.includes(m[1])) throw new TryOnError("対応していない画像形式です。", 400);
    return { mimeType: m[1], data: m[2] };
  }

  const resolved = new URL(url, origin);
  const allowedHosts = [new URL(origin).host];
  if (SUPABASE_URL) allowedHosts.push(new URL(SUPABASE_URL).host);
  if (!allowedHosts.includes(resolved.host)) throw new TryOnError("この画像は読み込めません。", 400);

  const res = await fetch(resolved);
  if (!res.ok) throw new TryOnError("画像を読み込めませんでした。", 400);
  const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!ALLOWED_MIME.includes(mimeType)) throw new TryOnError("対応していない画像形式です。", 400);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new TryOnError("画像が大きすぎます。", 400);
  return { mimeType, data: buf.toString("base64") };
}
