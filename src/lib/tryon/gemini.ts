import type { Category } from "@/types/database";

/**
 * Google Gemini の画像生成（Nano Banana）でバーチャル試着画像を作る。
 * 全身写真＋アイテム画像をまとめて1回のリクエストで送り、着せ替えた全身写真を1枚受け取る。
 * 料金の目安: gemini-2.5-flash-image は1枚 $0.039（https://ai.google.dev/gemini-api/docs/pricing）。
 */

export interface InlineImage {
  mimeType: string;
  data: string; // base64
}

export interface TryOnGarment {
  category: Category;
  image: InlineImage;
}

const CATEGORY_EN: Record<Category, string> = {
  tops: "top (shirt / knit / T-shirt)",
  bottoms: "bottoms (trousers / skirt)",
  outer: "outerwear (jacket / coat), worn over the top",
  shoes: "shoes",
  headwear: "headwear (hat / cap)",
  accessory: "accessory (bag / watch / jewelry)",
};

function buildPrompt(garments: TryOnGarment[]): string {
  const list = garments.map((g, i) => `- Image ${i + 2}: ${CATEGORY_EN[g.category]}`).join("\n");
  return [
    "You are a virtual fitting room. Image 1 is a full-body photo of a person.",
    "The following images are clothing items and accessories:",
    list,
    "",
    "Generate a photorealistic full-body photo of the SAME person from Image 1 wearing ALL of these items together.",
    "Rules:",
    "- Keep the person's face, hairstyle, skin tone, body shape, pose, and the background exactly as in Image 1.",
    "- Reproduce each item's color, pattern, material, and design faithfully. Do not add logos or text.",
    "- Fit the items naturally to the body with realistic wrinkles, drape, and shadows.",
    "- Items not listed keep what the person is already wearing.",
    "- Show the whole body from head to feet, framed like Image 1. Output only the image.",
  ].join("\n");
}

export class TryOnError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

/**
 * backend:
 *  - "ai-studio": Gemini API（Google AI Studio で発行したキー。前払い制）
 *  - "vertex": Google Cloud の Vertex AI（Cloud のAPIキー。無料トライアルの$300クレジットが使える）
 */
export type GeminiBackend = "ai-studio" | "vertex";

export async function generateTryOnWithGemini(opts: {
  apiKey: string;
  backend?: GeminiBackend;
  model?: string;
  person: InlineImage;
  garments: TryOnGarment[];
}): Promise<InlineImage> {
  const model = opts.model || "gemini-2.5-flash-image";
  const parts = [
    { text: buildPrompt(opts.garments) },
    { inline_data: { mime_type: opts.person.mimeType, data: opts.person.data } },
    ...opts.garments.map((g) => ({ inline_data: { mime_type: g.image.mimeType, data: g.image.data } })),
  ];

  const endpoint =
    opts.backend === "vertex"
      ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": opts.apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "9:16" } },
    }),
  });

  const json = (await res.json().catch(() => null)) as GeminiResponse | null;
  if (!res.ok) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    console.error("[tryon/gemini]", res.status, msg);
    if (/API key/i.test(msg) && (res.status === 400 || res.status === 401)) throw new TryOnError("AI試着のAPIキーが正しくありません。設定を確認してください。");
    if (res.status === 403) throw new TryOnError("AI試着のAPIキーに権限がありません（APIの有効化と請求先アカウントの設定を確認してください）。");
    if (res.status === 429) throw new TryOnError("AI試着の利用上限に達しました。しばらく待ってからお試しください。", 429);
    throw new TryOnError("AI試着の生成に失敗しました。時間をおいてもう一度お試しください。");
  }

  const candidate = json?.candidates?.[0];
  const img = candidate?.content?.parts?.find((p) => p.inlineData?.data || p.inline_data?.data);
  const b64 = img?.inlineData?.data ?? img?.inline_data?.data;
  const mimeType = img?.inlineData?.mimeType ?? img?.inline_data?.mime_type ?? "image/png";
  if (!b64) {
    console.error("[tryon/gemini] no image", candidate?.finishReason, json?.promptFeedback);
    throw new TryOnError("AIが画像を返しませんでした。写真やアイテムを変えてもう一度お試しください。");
  }
  return { mimeType, data: b64 };
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: unknown;
  error?: { message?: string };
}
