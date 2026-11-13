import { NextResponse } from "next/server";
import { suggestOutfits, type StylistConditions } from "@/lib/stylist";
import type { Item } from "@/types/database";

/**
 * AIスタイリスト：条件に合う「自分のアイテム」の組み合わせを返す。
 * 現在はルールベース（lib/stylist.ts）。LLM に置き換える場合はここで
 * items と conditions をプロンプトに渡し、Suggestion[] 形式の JSON を返せばフロントはそのまま動く。
 */
export async function POST(req: Request) {
  const { items, conditions } = (await req.json()) as { items: Item[]; conditions: StylistConditions };
  if (!Array.isArray(items) || !conditions) {
    return NextResponse.json({ error: "items と conditions が必要です" }, { status: 400 });
  }
  return NextResponse.json({ suggestions: suggestOutfits(items, conditions, 3) });
}
