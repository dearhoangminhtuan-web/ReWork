"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";

const Buddy = z.object({
  interests: z.string().trim().min(1).max(300),
  availability: z.string().trim().min(1).max(200),
  language: z.enum(["vi", "ja", "en"]),
});

/** FR-031: goes to the admin queue; a person matches manually. */
export async function requestBuddy(input: z.infer<typeof Buddy>) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { ok: false };
  const d = Buddy.parse(input);
  await withActor({ userId: me.userId }, (q) =>
    q.query(`insert into buddy_requests (user_id, interests, availability, language) values ($1, $2, $3, $4)`, [me.userId, d.interests, d.availability, d.language]),
  );
  revalidatePath("/community");
  return { ok: true };
}
