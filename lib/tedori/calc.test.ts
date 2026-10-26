import { describe, expect, it } from "vitest";
import { calculateTedori, compareOffers, emptyOffer, type OfferInput } from "./calc";
import { TEDORI, SAMPLE_RENT } from "@/config/tedori";
import { MIN_WAGE_HOURLY } from "@/config/min-wage";

const base = (over: Partial<OfferInput> = {}): OfferInput => ({
  ...emptyOffer("39_kochi"),
  municipality: "kochi_city",
  ...over,
});

describe("calculateTedori", () => {
  it("hourly wage: gross = wage × hours", () => {
    const r = calculateTedori(base({ wageType: "hourly", wageAmount: 1100, hoursPerMonth: 160 }), { yearsInJapan: 2 });
    expect(r.baseWageMonthly).toBe(176000);
    expect(r.gross).toBe(176000);
    expect(r.hoursAssumed).toBe(false);
  });

  it("monthly wage: gross = monthly amount, effective hourly from hours", () => {
    const r = calculateTedori(base({ wageType: "monthly", wageAmount: 200000, hoursPerMonth: 160 }), { yearsInJapan: 2 });
    expect(r.gross).toBe(200000);
    expect(r.effectiveHourly).toBe(1250);
  });

  it("hourly and monthly with same pay give the same result", () => {
    const h = calculateTedori(base({ wageType: "hourly", wageAmount: 1250, hoursPerMonth: 160 }), { yearsInJapan: 2 });
    const m = calculateTedori(base({ wageType: "monthly", wageAmount: 200000, hoursPerMonth: 160 }), { yearsInJapan: 2 });
    expect(h.moneyLeft).toBe(m.moneyLeft);
  });

  it("applies config rates step by step", () => {
    const r = calculateTedori(
      base({ wageType: "monthly", wageAmount: 200000, hoursPerMonth: 160, housingProvided: true, housingFee: 20000 }),
      { yearsInJapan: 3 },
    );
    const si = 200000 * TEDORI.socialInsuranceRate;
    const it_ = (200000 - si) * TEDORI.incomeTaxRate;
    const rt = 200000 * TEDORI.residentTaxRate;
    expect(r.socialInsurance).toBe(Math.round(si));
    expect(r.incomeTax).toBe(Math.round(it_));
    expect(r.residentTax).toBe(Math.round(rt));
    expect(r.moneyLeft).toBe(Math.round(200000 - si - it_ - rt - 20000));
  });

  it("housing provided: uses employer housing fee, not sample rent", () => {
    const r = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160, housingProvided: true, housingFee: 15000 }), {
      yearsInJapan: 2,
    });
    expect(r.rent).toBe(15000);
    expect(r.rentSource).toBe("employer_housing");
  });

  it("no housing: falls back to sample rent for the municipality", () => {
    const r = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160 }), { yearsInJapan: 2 });
    expect(r.rent).toBe(SAMPLE_RENT["39_kochi"].kochi_city);
    expect(r.rentSource).toBe("sample");
  });

  it("user-entered rent overrides sample rent", () => {
    const r = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160, userRent: 41000 }), { yearsInJapan: 2 });
    expect(r.rent).toBe(41000);
    expect(r.rentSource).toBe("user");
  });

  it("municipality outside the rent table → rent missing (US-E03)", () => {
    const r = calculateTedori(base({ municipality: "somewhere_else", wageAmount: 1100, hoursPerMonth: 160 }), {
      yearsInJapan: 2,
    });
    expect(r.rentSource).toBe("missing");
    expect(r.rent).toBe(0);
  });

  it("first-year resident tax is 0", () => {
    const first = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160 }), { yearsInJapan: 0 });
    const second = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160 }), { yearsInJapan: 1 });
    expect(first.residentTax).toBe(0);
    expect(first.assumptions.residentTaxApplied).toBe(false);
    expect(second.residentTax).toBeGreaterThan(0);
    expect(first.moneyLeft - second.moneyLeft).toBe(second.residentTax);
  });

  it("commute cost is only subtracted where the allowance doesn't cover it", () => {
    const r = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160, commuteCost: 12000, transportAllowance: 8000 }), {
      yearsInJapan: 2,
    });
    expect(r.commuteUncovered).toBe(4000);
    const covered = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: 160, commuteCost: 5000, transportAllowance: 8000 }), {
      yearsInJapan: 2,
    });
    expect(covered.commuteUncovered).toBe(0);
  });

  it("subtracts listed deductions", () => {
    const r = calculateTedori(
      base({ wageAmount: 1100, hoursPerMonth: 160, deductions: [{ label: "meals", amount: 9000 }, { label: "utilities", amount: 6000 }] }),
      { yearsInJapan: 2 },
    );
    expect(r.otherDeductions).toBe(15000);
  });

  it("assumes default hours when missing and flags it", () => {
    const r = calculateTedori(base({ wageAmount: 1100, hoursPerMonth: null }), { yearsInJapan: 2 });
    expect(r.hoursAssumed).toBe(true);
    expect(r.hoursUsed).toBe(TEDORI.defaultHoursPerMonth);
  });
});

describe("minimum wage warning (US-E02)", () => {
  it("flags an hourly wage below the prefecture minimum", () => {
    const min = MIN_WAGE_HOURLY.values["39_kochi"];
    const r = calculateTedori(base({ wageAmount: min - 1, hoursPerMonth: 160 }), { yearsInJapan: 1 });
    expect(r.belowMinWage).toBe(true);
    expect(r.minWage).toBe(min);
  });

  it("does not flag a wage at the minimum", () => {
    const min = MIN_WAGE_HOURLY.values["39_kochi"];
    const r = calculateTedori(base({ wageAmount: min, hoursPerMonth: 160 }), { yearsInJapan: 1 });
    expect(r.belowMinWage).toBe(false);
  });

  it("flags a monthly wage that works out below the minimum per hour", () => {
    // Tokyo minimum × 160h minus a bit
    const min = MIN_WAGE_HOURLY.values["13_tokyo"];
    const r = calculateTedori(
      { ...emptyOffer("13_tokyo"), municipality: "edogawa", wageType: "monthly", wageAmount: min * 160 - 1000, hoursPerMonth: 160 },
      { yearsInJapan: 1 },
    );
    expect(r.belowMinWage).toBe(true);
  });

  it("allowances do not count toward the minimum-wage check", () => {
    const min = MIN_WAGE_HOURLY.values["39_kochi"];
    const r = calculateTedori(base({ wageAmount: min - 10, hoursPerMonth: 160, otherAllowances: 50000 }), { yearsInJapan: 1 });
    expect(r.belowMinWage).toBe(true);
  });

  it("can't check a monthly wage without hours", () => {
    const r = calculateTedori(base({ wageType: "monthly", wageAmount: 100000, hoursPerMonth: null }), { yearsInJapan: 1 });
    expect(r.effectiveHourly).toBeNull();
    expect(r.belowMinWage).toBe(false);
  });
});

describe("compareOffers — honest headline both directions", () => {
  // Classic case: Tokyo pays more per hour but rent eats it.
  const kochi: OfferInput = {
    ...emptyOffer("39_kochi"),
    municipality: "nankoku",
    wageAmount: 1080,
    hoursPerMonth: 168,
    housingProvided: true,
    housingFee: 15000,
  };
  const tokyo: OfferInput = {
    ...emptyOffer("13_tokyo"),
    municipality: "shinjuku",
    wageAmount: 1300,
    hoursPerMonth: 168,
    commuteCost: 8000,
  };

  it("picks Kochi when it really leaves more", () => {
    const c = compareOffers(kochi, tokyo, { yearsInJapan: 2 });
    expect(c.winner).toBe("a");
    expect(c.difference).toBe(c.a.moneyLeft - c.b.moneyLeft);
  });

  it("picks Tokyo when Tokyo really leaves more (no bias toward staying)", () => {
    const richTokyo: OfferInput = { ...tokyo, wageAmount: 1900, housingProvided: true, housingFee: 20000 };
    const c = compareOffers(kochi, richTokyo, { yearsInJapan: 2 });
    expect(c.winner).toBe("b");
    expect(c.difference).toBe(c.b.moneyLeft - c.a.moneyLeft);
  });

  it("order of inputs doesn't change the facts", () => {
    const ab = compareOffers(kochi, tokyo, { yearsInJapan: 2 });
    const ba = compareOffers(tokyo, kochi, { yearsInJapan: 2 });
    expect(ab.difference).toBe(ba.difference);
    expect(ab.winner).toBe("a");
    expect(ba.winner).toBe("b");
  });

  it("reports a tie", () => {
    const c = compareOffers(kochi, { ...kochi }, { yearsInJapan: 2 });
    expect(c.winner).toBe("tie");
    expect(c.difference).toBe(0);
  });
});
