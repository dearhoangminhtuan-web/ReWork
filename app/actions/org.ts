"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";

/** FR-060: support org updates status only (column grant + RLS). */
export async function updateSwapStatus(id: string, status: "new" | "contacted" | "closed") {
  const me = await getMe();
  if (!me || me.profile.role !== "support_org") throw new Error("forbidden");
  await withActor({ userId: me.userId }, (q) =>
    q.query(`update swap_requests set status = $2, updated_at = now() where id = $1`, [z.string().uuid().parse(id), z.enum(["new", "contacted", "closed"]).parse(status)]),
  );
  revalidatePath("/org");
}
