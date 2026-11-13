import { NextResponse } from "next/server";

interface TryOnRequest {
  person_image_url: string | null;
  garments: { category: string; image_url: string }[];
}

/**
 * AI試着（バーチャルTry-On）合成 API のプレースホルダー。
 *
 * 外部サービス例：
 *  - Pixelcut Try-On API
 *  - Google Cloud Vertex AI Virtual Try-On
 *
 * 連携時の流れ（想定）：
 *  1. person_image_url（全身写真）と garments（透過アイテム画像）を外部APIへ送信
 *  2. 返ってきた合成画像を Supabase Storage に保存
 *  3. outfits.tryon_image_url に URL を保存し、ここで image_url として返す
 *
 * 注意：データURL（デモモードの画像）は外部APIに送れないため、Supabase Storage の公開URLが必要。
 */
export async function POST(req: Request) {
  const body = (await req.json()) as TryOnRequest;
  const provider = process.env.TRYON_PROVIDER;
  const apiKey = process.env.TRYON_API_KEY;

  if (!body.person_image_url || body.garments.length === 0) {
    return NextResponse.json({ status: "error", message: "全身写真とアイテムを選んでください。", image_url: null }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      status: "mock",
      provider: provider ?? null,
      image_url: null,
      message:
        "外部のAI試着APIは未接続のため、透過画像のレイヤー合成でプレビューしています。.env.local に TRYON_API_KEY を設定し、app/api/tryon/route.ts の連携処理を実装すると、シワや影まで自然に合成された画像に置き換わります。",
    });
  }

  // --- ここに外部API連携を実装 ---------------------------------------
  // 例（擬似コード）:
  // const res = await fetch("https://api.example-tryon.com/v1/try-on", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ person_image: body.person_image_url, garment_images: body.garments.map((g) => g.image_url) }),
  // });
  // const { result_url } = await res.json();
  // return NextResponse.json({ status: "ok", image_url: result_url, message: "AIで合成しました。" });
  // ------------------------------------------------------------------

  return NextResponse.json({
    status: "not_implemented",
    provider,
    image_url: null,
    message: `${provider ?? "外部"} のAPIキーは設定されていますが、連携処理が未実装です（app/api/tryon/route.ts）。`,
  });
}
