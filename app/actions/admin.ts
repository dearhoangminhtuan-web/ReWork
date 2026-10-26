"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";

async function admin() {
  const me = await getMe();
  if (!me || me.profile.role !== "admin") throw new Error("forbidden");
  return me;
}

export async function saveKbArticle(input: { slug: string; language: string; title: string; bodyMd: string }) {
  const me = await admin();
  const d = z
    .object({ slug: z.string().min(1).max(80), language: z.enum(["vi", "ja", "en"]), title: z.string().trim().min(1).max(200), bodyMd: z.string().max(20000) })
    .parse(input);
  await withActor({ userId: me.userId }, (q) =>
    q.query(`update kb_articles set title = $3, body_md = $4, updated_at = now() where slug = $1 and language = $2`, [d.slug, d.language, d.title, d.bodyMd]),
  );
  revalidatePath("/admin");
}

export async function updateBuddy(id: string, status: "new" | "matched" | "closed", note: string) {
  const me = await admin();
  await withActor({ userId: me.userId }, (q) =>
    q.query(`update buddy_requests set status = $2, admin_note = $3 where id = $1`, [z.string().uuid().parse(id), z.enum(["new", "matched", "closed"]).parse(status), note.slice(0, 500) || null]),
  );
  revalidatePath("/admin");
}
