// APPROXIMATION — verify before real use. Rough demo defaults, NOT official rates.
export const TEDORI = {
  socialInsuranceRate: 0.15, // employee share of health + pension + employment insurance, approx.
  incomeTaxRate: 0.03, // applied to (gross - social insurance), rough for low wages
  residentTaxRate: 0.05, // of gross, from 2nd year in Japan; 0 in first year
  defaultHoursPerMonth: 160, // used only when an offer gives no hours (shown as an assumption)
  sourceUrl: null as string | null, // TODO(Tuan): add official sources
  label: { vi: "Ước tính", ja: "概算", en: "Estimate" },
};

// Sample rent per municipality (¥/month) — fictional demo values, label "Sample" in UI.
// APPROXIMATION — fictional, NOT real rent statistics. Replace before pilot (see PRD Q-005).
export const SAMPLE_RENT: Record<string, Record<string, number>> = {
  "39_kochi": {
    kochi_city: 38000,
    nankoku: 33000,
    kami: 30000,
    aki: 29000,
    muroto: 27000,
    susaki: 30000,
    shimanto: 29000,
    tosashimizu: 26000,
  },
  "13_tokyo": {
    shinjuku: 82000,
    edogawa: 64000,
    adachi: 60000,
    ota: 70000,
    hachioji: 52000,
  },
  "27_osaka": {
    osaka_city: 58000,
    sakai: 46000,
    higashiosaka: 45000,
    toyonaka: 52000,
    izumisano: 40000,
  },
  "01_hokkaido": {
    sapporo: 45000,
    asahikawa: 36000,
    hakodate: 37000,
    otaru: 35000,
    obihiro: 36000,
    furano: 34000,
  },
};

export function sampleRentFor(prefectureCode: string, municipality: string | null | undefined): number | null {
  if (!municipality) return null;
  return SAMPLE_RENT[prefectureCode]?.[municipality] ?? null;
}
