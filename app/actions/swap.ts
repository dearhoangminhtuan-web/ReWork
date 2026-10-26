"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withActor } from "@/lib/db";
import { getMe } from "@/lib/data/me";
import { compatriotMunicipalities, listingsInPrefecture } from "@/lib/data/directory";
import { rankListings, type SwapAnswers } from "@/lib/swap/rank";
import { structured, untrusted } from "@/lib/llm/client";
import { Reasons } from "@/lib/llm/schemas";
import { REASONS_SYSTEM } from "@/lib/llm/prompts";
import { INDUSTRIES } from "@/config/prefectures";

const AnswersSchema = z.object({
  desiredMoneyLeft: z.number().min(0).max(1_000_000).nullable(),
  needDormitory: z.boolean(),
  nearCompatriots: z.boolean(),
  preferredIndustry: z.enum(INDUSTRIES).nullable(),
  earliestStart: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
});

export interface Suggestion {
  id: string;
  title: string;
  titleI18n: Record<string, string>;
  employerName: string;
  employerNameEn: string | null;
  municipality: string;
  industry: string;
  dormitory: boolean;
  housingFee: number | null;
  languages: string[];
  wageType: "hourly" | "monthly";
  wageAmount: number;
  moneyLeft: number;
  parts: { money: number; dormitory: number; compatriots: number; industry: number; language: number };
  compatriotsNearby: boolean;
  reason: string | null; // AI sentence; UI builds a template reason when null
  isSample: boolean;
}

const LANG_NAME = { vi: "Vietnamese", ja: "Japanese", en: "English" } as const;

/**
 * FR-041: deterministic in-prefecture ranking, then the LLM only writes a short
 * honest reason for each of the top 3. Nothing is sent to any employer.
 */
export async function rankForMe(input: SwapAnswers): Promise<{ suggestions: Suggestion[] }> {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { suggestions: [] };
  const answers = AnswersSchema.parse(input);
  const p = me.profile;

  const { listings, compat } = await withActor({ userId: me.userId }, async (q) => ({
    listings: await listingsInPrefecture(q, p.prefectureCode),
    compat: await compatriotMunicipalities(q, p.prefectureCode, p.language),
  }));
  const ranked = rankListings(
    listings,
    answers,
    { prefectureCode: p.prefectureCode, currentEmployerId: p.employerId, language: p.language, yearsInJapan: p.yearsInJapan },
    { compatriotMunicipalities: compat },
  );
  const byId = new Map(listings.map((l) => [l.id, l]));

  let reasons = new Map<string, string>();
  if (ranked.length) {
    const facts = ranked.map((s) => ({
      listing_id: s.listing.id,
      job: byId.get(s.listing.id)!.titleI18n.en ?? byId.get(s.listing.id)!.title,
      industry: s.listing.industry,
      estimated_money_left_yen: s.moneyLeft,
      worker_wants_left_yen: answers.desiredMoneyLeft,
      dormitory: s.listing.dormitory,
      worker_needs_dormitory: answers.needDormitory,
      compatriot_group_nearby: compat.includes(s.listing.municipality),
      worker_wants_compatriots: answers.nearCompatriots,
      industry_matches: answers.preferredIndustry ? s.listing.industry === answers.preferredIndustry : null,
      languages_at_work: s.listing.languages,
    }));
    const ai = await structured({
      tier: "fast",
      system: REASONS_SYSTEM,
      schema: Reasons,
      content: `Write the reasons in ${LANG_NAME[p.language]}.\n${untrusted("facts", JSON.stringify(facts))}`,
      timeoutMs: 8000,
    });
    if (ai) reasons = new Map(ai.reasons.filter((r) => byId.has(r.listing_id)).map((r) => [r.listing_id, r.reason.slice(0, 240)]));
  }

  return {
    suggestions: ranked.map((s) => {
      const l = byId.get(s.listing.id)!;
      return {
        id: l.id,
        title: l.title,
        titleI18n: l.titleI18n as Record<string, string>,
        employerName: l.employerName,
        employerNameEn: l.employerNameEn,
        municipality: l.municipality,
        industry: l.industry,
        dormitory: l.dormitory,
        housingFee: l.housingFee,
        languages: l.languages,
        wageType: l.wageType,
        wageAmount: l.wageAmount,
        moneyLeft: s.moneyLeft,
        parts: s.parts,
        compatriotsNearby: compat.includes(l.municipality),
        reason: reasons.get(l.id) ?? null,
        isSample: l.isSample,
      };
    }),
  };
}

/**
 * FR-043: the ONLY action — send interest to the worker's own support org.
 * Requires consent (c); ticking the box here is that consent. The current
 * employer is never notified and no destination employer is contacted.
 */
export async function sendSwapRequest(input: { answers: SwapAnswers; suggestedIds: string[]; message: string; consent: boolean }) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { ok: false as const, error: "forbidden" };
  if (!input.consent) return { ok: false as const, error: "consent" };
  if (!me.profile.supportOrgId) return { ok: false as const, error: "no_org" };
  const answers = AnswersSchema.parse(input.answers);
  const ids = z.array(z.string().uuid()).max(3).parse(input.suggestedIds);
  const message = input.message.trim().slice(0, 600);
  const p = me.profile;
  await withActor({ userId: me.userId }, async (q) => {
    await q.query(
      `insert into consents (user_id, share_swap_with_org) values ($1, true)
       on conflict (user_id) do update set share_swap_with_org = true, updated_at = now()`,
      [me.userId],
    );
    await q.query(
      `insert into swap_requests (worker_id, support_org_id, answers_json, suggested_listing_ids) values ($1, $2, $3, $4)`,
      [
        me.userId,
        p.supportOrgId,
        {
          ...answers,
          message: message || null,
          // what the org needs to help, nothing more (no name, no employer)
          snapshot: {
            language: p.language,
            industry: p.industry,
            residenceStatus: p.residenceStatus,
            monthsAtEmployer: p.monthsAtEmployer,
            municipality: p.municipality,
          },
        },
        ids,
      ],
    );
  });
  revalidatePath("/swap");
  return { ok: true as const };
}
