import { NextResponse } from "next/server";
import { getMe } from "@/lib/data/me";
import { llmAvailable, structured } from "@/lib/llm/client";
import { OfferExtraction } from "@/lib/llm/schemas";
import { EXTRACT_OFFER_SYSTEM } from "@/lib/llm/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * FR-011: photo → structured fields. The image is read in memory and dropped;
 * it is never stored or logged (DECISIONS.md D-006).
 */
export async function POST(req: Request) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return NextResponse.json({ status: "forbidden" }, { status: 403 });
  if (!llmAvailable()) return NextResponse.json({ status: "unavailable" });

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return NextResponse.json({ status: "bad_request" }, { status: 400 });
  if (!TYPES.includes(file.type as (typeof TYPES)[number]) || file.size > MAX_BYTES) {
    return NextResponse.json({ status: "unreadable" });
  }
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  const result = await structured({
    tier: "main",
    system: EXTRACT_OFFER_SYSTEM,
    schema: OfferExtraction,
    timeoutMs: 15_000,
    content: [
      { type: "image", source: { type: "base64", media_type: file.type as (typeof TYPES)[number], data } },
      { type: "text", text: "Extract the job-offer fields from this image." },
    ],
  });
  if (!result) return NextResponse.json({ status: "error" });
  return NextResponse.json({ status: "ok", extraction: result });
}
