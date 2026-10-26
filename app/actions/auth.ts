"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendMagicLink } from "@/lib/auth/session";
import { authMode } from "@/lib/env";

export async function requestMagicLink(_: unknown, formData: FormData): Promise<{ status: "sent" | "failed" | "not_configured" | "invalid" }> {
  if (authMode() !== "supabase") return { status: "not_configured" };
  const email = z.string().email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "invalid" };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  try {
    await sendMagicLink(email.data, `${origin}/auth/callback`);
    return { status: "sent" };
  } catch {
    return { status: "failed" };
  }
}
