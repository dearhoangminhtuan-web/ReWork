import { describe, expect, it } from "vitest";
import { mapExtraction, matchMunicipality, matchPrefecture } from "./from-extraction";
import { emptyOffer } from "./calc";
import type { OfferExtraction } from "@/lib/llm/schemas";

const ex = (over: Partial<OfferExtraction>): OfferExtraction => ({
  is_job_offer: true,
  employer_name: null,
  prefecture: null,
  municipality: null,
  wage_type: null,
  wage_amount: null,
  hours_per_month: null,
  housing_provided: null,
  housing_fee: null,
  transport_allowance: null,
  other_allowances: null,
  deductions: [],
  ...over,
});

describe("matching places as written on offers", () => {
  it("prefectures in any script", () => {
    expect(matchPrefecture("高知県")).toBe("39_kochi");
    expect(matchPrefecture("Kochi Prefecture")).toBe("39_kochi");
    expect(matchPrefecture("東京都")).toBe("13_tokyo");
    expect(matchPrefecture("Osaka")).toBeNull();
  });
  it("municipalities", () => {
    expect(matchMunicipality("39_kochi", "南国市")).toBe("nankoku");
    expect(matchMunicipality("39_kochi", "高知市")).toBe("kochi_city");
    expect(matchMunicipality("13_tokyo", "新宿区")).toBe("shinjuku");
    expect(matchMunicipality("13_tokyo", "Shinjuku-ku")).toBe("shinjuku");
    expect(matchMunicipality("39_kochi", "梼原町")).toBeNull();
  });
});

describe("mapExtraction", () => {
  it("fills what was read and reports which fields", () => {
    const m = mapExtraction(
      ex({ employer_name: "旅館テスト", prefecture: "高知県", municipality: "南国市", wage_type: "hourly", wage_amount: 1080, hours_per_month: 168, housing_provided: true, housing_fee: 15000 }),
      emptyOffer("13_tokyo"),
    );
    expect(m.offer.prefectureCode).toBe("39_kochi");
    expect(m.offer.municipality).toBe("nankoku");
    expect(m.offer.wageAmount).toBe(1080);
    expect(m.offer.housingFee).toBe(15000);
    expect(m.filled).toEqual(expect.arrayContaining(["wageAmount", "municipality", "housingProvided"]));
    expect(m.unreadable).toBe(false);
  });
  it("missing values stay null — never guessed", () => {
    const m = mapExtraction(ex({ wage_amount: 1100 }), emptyOffer("39_kochi"));
    expect(m.offer.hoursPerMonth).toBeNull();
    expect(m.offer.housingFee).toBeNull();
    expect(m.filled).toEqual(["wageAmount"]);
  });
  it("US-E01: not a job offer → unreadable, form still prefilled with whatever was read", () => {
    const m = mapExtraction(ex({ is_job_offer: false, employer_name: "Café" }), emptyOffer("39_kochi"));
    expect(m.unreadable).toBe(true);
    expect(m.offer.employerName).toBe("Café");
  });
  it("drops nonsense numbers", () => {
    const m = mapExtraction(ex({ wage_amount: -5, hours_per_month: 9999 }), emptyOffer("39_kochi"));
    expect(m.offer.wageAmount).toBe(0);
    expect(m.offer.hoursPerMonth).toBeNull();
  });
});
