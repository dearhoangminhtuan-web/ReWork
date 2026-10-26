"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";

const Answer = z.object({
  surveyId: z.string().uuid(),
  q: z.tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(5), z.number().int().min(1).max(5), z.number().int().min(1).max(5), z.number().int().min(1).max(5)]),
  freeText: z.string().max(500).nullable(),
  allowAggregate: z.boolean(),
});

/** FR-050/051 via app.submit_pulse(): answers stored without user id, once per survey. */
export async function submitPulse(input: z.infer<typeof Answer>): Promise<{ ok: boolean; error?: "consent" | "duplicate" | "error" }> {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { ok: false, error: "error" };
  const d = Answer.parse(input);
  try {
    await withActor({ userId: me.userId }, async (q) => {
      if (d.allowAggregate && !me.consents.surveyAggregate) {
        await q.query(
          `insert into consents (user_id, survey_aggregate) values ($1, true)
           on conflict (user_id) do update set survey_aggregate = true, updated_at = now()`,
          [me.userId],
        );
      }
      await q.query(`select app.submit_pulse($1, $2, $3, $4, $5, $6, $7)`, [d.surveyId, ...d.q, d.freeText]);
    });
  } catch (e) {
    const m = String((e as Error).message);
    return { ok: false, error: m.includes("consent") ? "consent" : m.includes("duplicate") ? "duplicate" : "error" };
  }
  revalidatePath("/home");
  revalidatePath("/pulse");
  return { ok: true };
}
