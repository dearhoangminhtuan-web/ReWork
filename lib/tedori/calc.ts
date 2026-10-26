// Deterministic take-home ("tedori") calculator. PRD rule 3: money numbers are
// always computed here, never by the LLM. Runs on client and server.
import { TEDORI, sampleRentFor } from "@/config/tedori";
import { minWageFor } from "@/config/min-wage";

export type WageType = "hourly" | "monthly";

export interface OfferInput {
  employerName: string | null;
  prefectureCode: string;
  municipality: string | null;
  wageType: WageType;
  wageAmount: number; // ¥ per hour or ¥ per month
  hoursPerMonth: number | null;
  housingProvided: boolean;
  housingFee: number | null; // ¥/month charged by employer when housing is provided
  transportAllowance: number; // ¥/month
  otherAllowances: number; // ¥/month, taxable
  deductions: { label: string; amount: number }[]; // other listed deductions (meals, utilities…)
  /** Rent the worker enters themselves. Used when no housing and no sample rent, or to override. */
  userRent: number | null;
  /** Monthly commute cost the worker expects to pay. */
  commuteCost: number;
}

export interface WorkerContext {
  /** Years the worker has lived in Japan. < 1 means first year → resident tax 0. */
  yearsInJapan: number;
}

export type RentSource = "employer_housing" | "user" | "sample" | "missing";

export interface TedoriResult {
  hoursUsed: number;
  hoursAssumed: boolean;
  baseWageMonthly: number;
  gross: number;
  socialInsurance: number;
  incomeTax: number;
  residentTax: number;
  rent: number;
  rentSource: RentSource;
  commuteUncovered: number;
  otherDeductions: number;
  moneyLeft: number;
  effectiveHourly: number | null;
  minWage: number | null;
  belowMinWage: boolean;
  assumptions: {
    socialInsuranceRate: number;
    incomeTaxRate: number;
    residentTaxRate: number;
    residentTaxApplied: boolean;
  };
}

const yen = (n: number) => Math.round(n);
const nonNeg = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0);

export function calculateTedori(offer: OfferInput, worker: WorkerContext): TedoriResult {
  const hoursAssumed = !offer.hoursPerMonth || offer.hoursPerMonth <= 0;
  const hoursUsed = hoursAssumed ? TEDORI.defaultHoursPerMonth : (offer.hoursPerMonth as number);

  const baseWageMonthly =
    offer.wageType === "hourly" ? nonNeg(offer.wageAmount) * hoursUsed : nonNeg(offer.wageAmount);
  const gross = baseWageMonthly + nonNeg(offer.otherAllowances);

  const socialInsurance = gross * TEDORI.socialInsuranceRate;
  const incomeTax = (gross - socialInsurance) * TEDORI.incomeTaxRate;
  const residentTaxApplied = worker.yearsInJapan >= 1;
  const residentTax = residentTaxApplied ? gross * TEDORI.residentTaxRate : 0;

  let rent = 0;
  let rentSource: RentSource;
  if (offer.housingProvided) {
    rent = nonNeg(offer.housingFee);
    rentSource = "employer_housing";
  } else if (offer.userRent !== null && offer.userRent !== undefined && offer.userRent >= 0) {
    rent = offer.userRent;
    rentSource = "user";
  } else {
    const sample = sampleRentFor(offer.prefectureCode, offer.municipality);
    if (sample !== null) {
      rent = sample;
      rentSource = "sample";
    } else {
      rentSource = "missing"; // US-E03: UI asks the worker to enter rent
    }
  }

  const commuteUncovered = Math.max(0, nonNeg(offer.commuteCost) - nonNeg(offer.transportAllowance));
  const otherDeductions = offer.deductions.reduce((s, d) => s + nonNeg(d.amount), 0);

  const moneyLeft = gross - socialInsurance - incomeTax - residentTax - rent - commuteUncovered - otherDeductions;

  // Minimum-wage check compares the base wage per hour (allowances excluded).
  const effectiveHourly =
    offer.wageType === "hourly"
      ? nonNeg(offer.wageAmount)
      : hoursAssumed
        ? null // can't check a monthly wage without hours
        : baseWageMonthly / hoursUsed;
  const minWage = minWageFor(offer.prefectureCode);
  const belowMinWage = effectiveHourly !== null && minWage !== null && effectiveHourly < minWage;

  return {
    hoursUsed,
    hoursAssumed,
    baseWageMonthly: yen(baseWageMonthly),
    gross: yen(gross),
    socialInsurance: yen(socialInsurance),
    incomeTax: yen(incomeTax),
    residentTax: yen(residentTax),
    rent: yen(rent),
    rentSource,
    commuteUncovered: yen(commuteUncovered),
    otherDeductions: yen(otherDeductions),
    moneyLeft: yen(moneyLeft),
    effectiveHourly: effectiveHourly === null ? null : Math.round(effectiveHourly * 10) / 10,
    minWage,
    belowMinWage,
    assumptions: {
      socialInsuranceRate: TEDORI.socialInsuranceRate,
      incomeTaxRate: TEDORI.incomeTaxRate,
      residentTaxRate: TEDORI.residentTaxRate,
      residentTaxApplied,
    },
  };
}

export interface Comparison {
  a: TedoriResult;
  b: TedoriResult;
  /** Which offer leaves more money. "tie" within ¥1. Always the honest result. */
  winner: "a" | "b" | "tie";
  difference: number; // absolute ¥/month
}

export function compareOffers(a: OfferInput, b: OfferInput, worker: WorkerContext): Comparison {
  const ra = calculateTedori(a, worker);
  const rb = calculateTedori(b, worker);
  const diff = ra.moneyLeft - rb.moneyLeft;
  return {
    a: ra,
    b: rb,
    winner: Math.abs(diff) < 1 ? "tie" : diff > 0 ? "a" : "b",
    difference: Math.abs(diff),
  };
}

export function emptyOffer(prefectureCode: string): OfferInput {
  return {
    employerName: null,
    prefectureCode,
    municipality: null,
    wageType: "hourly",
    wageAmount: 0,
    hoursPerMonth: null,
    housingProvided: false,
    housingFee: null,
    transportAllowance: 0,
    otherAllowances: 0,
    deductions: [],
    userRent: null,
    commuteCost: 0,
  };
}
