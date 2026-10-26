"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";
import { INDUSTRIES } from "@/config/prefectures";

async function employer() {
  const me = await getMe();
  if (!me || me.profile.role !== "employer" || !me.profile.employerId) throw new Error("forbidden");
  return me;
}

/** Start this month's check-in for a team (RLS: own teams only). */
export async function createSurvey(teamId: string) {
  const me = await employer();
  const period = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
  await withActor({ userId: me.userId }, (q) =>
    q.query(`insert into pulse_surveys (employer_id, team_id, period) values ($1, $2, $3) on conflict (team_id, period) do nothing`, [
      me.profile.employerId,
      z.string().uuid().parse(teamId),
      period,
    ]),
  );
  revalidatePath("/employer");
}

const ListingSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(80),
  titleEn: z.string().trim().max(80),
  titleVi: z.string().trim().max(80),
  industry: z.enum(INDUSTRIES),
  municipality: z.string().min(1).max(64),
  wageType: z.enum(["hourly", "monthly"]),
  wageAmount: z.number().int().positive().max(2_000_000),
  hoursMonth: z.number().int().positive().max(400).nullable(),
  dormitory: z.boolean(),
  housingFee: z.number().int().min(0).max(500_000).nullable(),
  languages: z.array(z.enum(["ja", "vi", "en", "id", "tl", "ne", "my"])).min(1),
  active: z.boolean(),
});
export type ListingForm = z.infer<typeof ListingSchema>;

// FR-055. NOTE: there is deliberately no paid / sponsored / priority field (FR-044).
export async function saveListing(input: ListingForm) {
  const me = await employer();
  const d = ListingSchema.parse(input);
  const i18n = { ...(d.titleEn ? { en: d.titleEn } : {}), ...(d.titleVi ? { vi: d.titleVi } : {}) };
  await withActor({ userId: me.userId }, async (q) => {
    if (d.id) {
      await q.query(
        `update job_listings set title=$2, title_i18n=$3, industry=$4, municipality=$5, wage_type=$6, wage_amount=$7, hours_month=$8,
           dormitory=$9, housing_fee=$10, languages=$11, active=$12, updated_at=now() where id=$1`,
        [d.id, d.title, i18n, d.industry, d.municipality, d.wageType, d.wageAmount, d.hoursMonth, d.dormitory, d.dormitory ? d.housingFee : null, d.languages, d.active],
      );
    } else {
      await q.query(
        `insert into job_listings (employer_id, title, title_i18n, industry, municipality, wage_type, wage_amount, hours_month, dormitory, housing_fee, languages, active, is_sample)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, false)`,
        [me.profile.employerId, d.title, i18n, d.industry, d.municipality, d.wageType, d.wageAmount, d.hoursMonth, d.dormitory, d.dormitory ? d.housingFee : null, d.languages, d.active],
      );
    }
  });
  revalidatePath("/employer");
  revalidatePath("/employer/listings");
  return { ok: true };
}

export async function deleteListing(id: string) {
  const me = await employer();
  await withActor({ userId: me.userId }, (q) => q.query(`delete from job_listings where id = $1`, [z.string().uuid().parse(id)]));
  revalidatePath("/employer/listings");
}
