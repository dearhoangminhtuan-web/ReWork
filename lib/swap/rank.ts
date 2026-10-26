// Kenkai Swap ranking (FR-041). Deterministic and in-prefecture only.
//
// COMPLIANCE (FR-044, PRD §6.5): ReWork is NOT a job-placement service. This
// function deliberately has NO input for payment, sponsorship, boosting or
// paid placement — the RankableListing type below is the whole contract, and
// rank.test.ts asserts it. Order depends only on fit for the worker.
import { calculateTedori, emptyOffer } from "@/lib/tedori/calc";

export interface RankableListing {
  id: string;
  employerId: string;
  prefectureCode: string;
  municipality: string;
  industry: string;
  wageType: "hourly" | "monthly";
  wageAmount: number;
  hoursMonth: number | null;
  dormitory: boolean;
  housingFee: number | null;
  languages: string[];
  active: boolean;
}

export interface SwapAnswers {
  /** Desired monthly money left (¥). */
  desiredMoneyLeft: number | null;
  needDormitory: boolean;
  nearCompatriots: boolean;
  preferredIndustry: string | null;
  earliestStart: string | null; // YYYY-MM, informational
}

export interface SwapWorker {
  prefectureCode: string;
  currentEmployerId: string | null;
  language: string;
  yearsInJapan: number;
}

export interface RankContext {
  /** Municipalities with a compatriot community group in the worker's language. */
  compatriotMunicipalities: string[];
}

export interface ScoredListing {
  listing: RankableListing;
  score: number;
  moneyLeft: number;
  parts: {
    money: number; // 0..40
    dormitory: number; // 0..20
    compatriots: number; // 0..20
    industry: number; // 0..15
    language: number; // 0..5
  };
}

export const MAX_SUGGESTIONS = 3;

export function scoreListing(l: RankableListing, a: SwapAnswers, w: SwapWorker, ctx: RankContext): ScoredListing {
  const r = calculateTedori(
    {
      ...emptyOffer(l.prefectureCode),
      municipality: l.municipality,
      wageType: l.wageType,
      wageAmount: l.wageAmount,
      hoursPerMonth: l.hoursMonth,
      housingProvided: l.dormitory,
      housingFee: l.dormitory ? l.housingFee : null,
    },
    { yearsInJapan: w.yearsInJapan },
  );

  // Money: full marks at/above the target; linear down to 0 at 30% below it.
  let money: number;
  if (a.desiredMoneyLeft && a.desiredMoneyLeft > 0) {
    const ratio = r.moneyLeft / a.desiredMoneyLeft;
    money = ratio >= 1 ? 40 : Math.max(0, 40 * (1 - (1 - ratio) / 0.3));
  } else {
    // No target: scale against ¥150,000/month left.
    money = Math.max(0, Math.min(40, (r.moneyLeft / 150000) * 40));
  }
  const dormitory = a.needDormitory ? (l.dormitory ? 20 : 0) : 10;
  const compatriots = a.nearCompatriots ? (ctx.compatriotMunicipalities.includes(l.municipality) ? 20 : 0) : 10;
  const industry = a.preferredIndustry ? (l.industry === a.preferredIndustry ? 15 : 0) : 8;
  const language = l.languages.includes(w.language) ? 5 : 0;

  const parts = {
    money: Math.round(money * 10) / 10,
    dormitory,
    compatriots,
    industry,
    language,
  };
  const score = Math.round((parts.money + dormitory + compatriots + industry + language) * 10) / 10;
  return { listing: l, score, moneyLeft: r.moneyLeft, parts };
}

/**
 * Rank listings for a worker. Only active listings in the worker's CURRENT
 * prefecture, excluding their current employer. Never pads with
 * out-of-prefecture jobs (US-E07): fewer than 3 results is a valid answer.
 */
export function rankListings(
  listings: RankableListing[],
  answers: SwapAnswers,
  worker: SwapWorker,
  ctx: RankContext,
  limit = MAX_SUGGESTIONS,
): ScoredListing[] {
  return listings
    .filter((l) => l.active)
    .filter((l) => l.prefectureCode === worker.prefectureCode)
    .filter((l) => l.employerId !== worker.currentEmployerId)
    .map((l) => scoreListing(l, answers, worker, ctx))
    .sort((x, y) => y.score - x.score || y.moneyLeft - x.moneyLeft || x.listing.id.localeCompare(y.listing.id))
    .slice(0, limit);
}
