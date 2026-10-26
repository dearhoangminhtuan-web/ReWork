// Turns an LLM extraction (strings as written on the offer) into calculator
// input. Pure + deterministic so it can be unit-tested. Anything that can't be
// matched stays null and the worker fills it in (FR-012).
import { PREFECTURES } from "@/config/prefectures";
import type { OfferInput } from "./calc";
import type { OfferExtraction } from "@/lib/llm/schemas";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s・·.,]/g, "")
    .replace(/(県|都|府|道|prefecture|-ken|ken$)/g, "");

export function matchPrefecture(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = norm(raw);
  for (const p of Object.values(PREFECTURES)) {
    const names = [p.name.ja, p.name.en, p.name.vi, p.kanji, p.code.split("_")[1]].map(norm);
    if (names.some((x) => x && (n === x || n.includes(x)))) return p.code;
  }
  return null;
}

export function matchMunicipality(prefCode: string, raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = norm(raw).replace(/(市|区|町|村|city|ward|town)$/g, "");
  const p = PREFECTURES[prefCode];
  if (!p) return null;
  for (const m of p.municipalities) {
    const names = [m.name.ja, m.name.en, m.name.vi, m.id].map((x) => norm(x).replace(/(市|区|町|村|city|ward|town|tp)/g, ""));
    if (names.some((x) => x && (n === x || n.includes(x) || x.includes(n)))) return m.id;
  }
  return null;
}

export type FilledField =
  | "employerName"
  | "prefectureCode"
  | "municipality"
  | "wageType"
  | "wageAmount"
  | "hoursPerMonth"
  | "housingProvided"
  | "housingFee"
  | "transportAllowance"
  | "otherAllowances"
  | "deductions";

export interface MappedOffer {
  offer: OfferInput;
  filled: FilledField[];
  /** true when the image clearly wasn't a job offer or nothing useful was read. */
  unreadable: boolean;
}

const pos = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null);

export function mapExtraction(ex: OfferExtraction, base: OfferInput): MappedOffer {
  const filled: FilledField[] = [];
  const offer: OfferInput = { ...base, deductions: [...base.deductions] };

  if (ex.employer_name?.trim()) {
    offer.employerName = ex.employer_name.trim().slice(0, 80);
    filled.push("employerName");
  }
  const pref = matchPrefecture(ex.prefecture) ?? (ex.municipality ? guessPrefFromMunicipality(ex.municipality) : null);
  if (pref) {
    offer.prefectureCode = pref;
    filled.push("prefectureCode");
  }
  const muni = matchMunicipality(offer.prefectureCode, ex.municipality);
  if (muni) {
    offer.municipality = muni;
    filled.push("municipality");
  } else if (pref) {
    offer.municipality = null;
  }
  if (ex.wage_type) {
    offer.wageType = ex.wage_type;
    filled.push("wageType");
  }
  const wage = pos(ex.wage_amount);
  if (wage) {
    offer.wageAmount = wage;
    filled.push("wageAmount");
    // A wage over ¥10,000 labelled hourly is almost certainly monthly — leave the
    // label for the worker to confirm rather than silently changing it.
  }
  const hours = pos(ex.hours_per_month);
  if (hours && hours <= 400) {
    offer.hoursPerMonth = hours;
    filled.push("hoursPerMonth");
  }
  if (ex.housing_provided !== null) {
    offer.housingProvided = ex.housing_provided;
    filled.push("housingProvided");
  }
  const hf = pos(ex.housing_fee);
  if (hf !== null) {
    offer.housingFee = hf;
    filled.push("housingFee");
  }
  const ta = pos(ex.transport_allowance);
  if (ta !== null) {
    offer.transportAllowance = ta;
    filled.push("transportAllowance");
  }
  const oa = pos(ex.other_allowances);
  if (oa !== null) {
    offer.otherAllowances = oa;
    filled.push("otherAllowances");
  }
  const ds = (ex.deductions ?? [])
    .map((d) => ({ label: d.label.slice(0, 40), amount: pos(d.amount) ?? 0 }))
    .filter((d) => d.amount > 0)
    .slice(0, 6);
  if (ds.length) {
    offer.deductions = ds;
    filled.push("deductions");
  }
  return { offer, filled, unreadable: !ex.is_job_offer || !filled.includes("wageAmount") };
}

function guessPrefFromMunicipality(raw: string): string | null {
  for (const code of Object.keys(PREFECTURES)) if (matchMunicipality(code, raw)) return code;
  return null;
}
