import { NextResponse } from "next/server";
import { withActor } from "@/lib/db";
import { env } from "@/lib/env";

// Nightly job (vercel.json): retention (FR-025, §9.2) + municipality aggregates (FR-070).
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await withActor("service", async (q) => {
    await q.query("select app.refresh_topic_counts()");
    await q.query("select app.purge_expired()");
  });
  return NextResponse.json({ ok: true });
}
