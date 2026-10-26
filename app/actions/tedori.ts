"use server";

import { z } from "zod";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";
import { listingsInPrefecture } from "@/lib/data/directory";
import { calculateTedori, compareOffers, emptyOffer, type OfferInput } from "@/lib/tedori/calc";
import { TEDORI } from "@/config/tedori";

const OfferSchema = z.object({
  employerName: z.string().max(80).nullable(),
  prefectureCode: z.string().max(32),
  municipality: z.string().max(64).nullable(),
  wageType: z.enum(["hourly", "monthly"]),
  wageAmount: z.number().min(0).max(5_000_000),
  hoursPerMonth: z.number().min(0).max(400).nullable(),
  housingProvided: z.boolean(),
  housingFee: z.number().min(0).max(1_000_000).nullable(),
  transportAllowance: z.number().min(0).max(1_000_000),
  otherAllowances: z.number().min(0).max(5_000_000),
  deductions: z.array(z.object({ label: z.string().max(40), amount: z.number().min(0).max(1_000_000) })).max(8),
  userRent: z.number().min(0).max(1_000_000).nullable(),
  commuteCost: z.number().min(0).max(1_000_000),
});

/**
 * Saves a comparison to the worker's own history (RLS: owner only). The result
 * is recomputed on the server with the same deterministic calculator — the
 * client's numbers are never trusted.
 */
export async function saveComparison(input: { a: OfferInput; b: OfferInput; extracted: { a: unknown; b: unknown } }) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { ok: false as const };
  const a = OfferSchema.parse(input.a);
  const b = OfferSchema.parse(input.b);
  const worker = { yearsInJapan: me.profile.yearsInJapan };
  const result = compareOffers(a, b, worker);
  await withActor({ userId: me.userId }, async (q) => {
    const ia = await q.query<{ id: string }>(
      `insert into offers (user_id, label, extracted_json, edited_json) values ($1, 'A', $2, $3) returning id`,
      [me.userId, input.extracted.a ?? null, a],
    );
    const ib = await q.query<{ id: string }>(
      `insert into offers (user_id, label, extracted_json, edited_json) values ($1, 'B', $2, $3) returning id`,
      [me.userId, input.extracted.b ?? null, b],
    );
    await q.query(
      `insert into comparisons (user_id, offer_a_id, offer_b_id, result_json, assumptions_json) values ($1, $2, $3, $4, $5)`,
      [me.userId, ia.rows[0].id, ib.rows[0].id, result, { ...TEDORI, yearsInJapan: worker.yearsInJapan }],
    );
  });
  return { ok: true as const, result };
}

export interface JobNear {
  id: string;
  title: string;
  titleI18n: Record<string, string>;
  employerName: string;
  municipality: string;
  industry: string;
  moneyLeft: number;
  dormitory: boolean;
  isSample: boolean;
}

/**
 * FR-017: up to 3 listings in the worker's prefecture, ordered by computed
 * money left — never by payment (no such field exists).
 */
export async function jobsNearMe(): Promise<JobNear[]> {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return [];
  const listings = await withActor({ userId: me.userId }, (q) => listingsInPrefecture(q, me.profile.prefectureCode));
  return listings
    .filter((l) => l.employerId !== me.profile.employerId)
    .map((l) => ({
      l,
      left: calculateTedori(
        {
          ...emptyOffer(l.prefectureCode),
          municipality: l.municipality,
          wageType: l.wageType,
          wageAmount: l.wageAmount,
          hoursPerMonth: l.hoursMonth,
          housingProvided: l.dormitory,
          housingFee: l.dormitory ? l.housingFee : null,
        },
        { yearsInJapan: me.profile.yearsInJapan },
      ).moneyLeft,
    }))
    .sort((x, y) => y.left - x.left || x.l.id.localeCompare(y.l.id))
    .slice(0, 3)
    .map(({ l, left }) => ({
      id: l.id,
      title: l.title,
      titleI18n: l.titleI18n as Record<string, string>,
      employerName: l.employerName,
      municipality: l.municipality,
      industry: l.industry,
      moneyLeft: left,
      dormitory: l.dormitory,
      isSample: l.isSample,
    }));
}
