import { describe, expect, it } from "vitest";
import { evaluateTransfer } from "./conditions";

const period = (industry: string | null, months: number | null) =>
  evaluateTransfer({ industry, monthsAtEmployer: months }).items.find((i) => i.key === "min_period_at_current_employer")!;

describe("transfer conditions checklist", () => {
  it("1-year field: 14 months → ok", () => expect(period("accommodation", 14)).toMatchObject({ status: "ok", years: 1 }));
  it("1-year field: 9 months → not yet, 3 left", () => expect(period("agriculture", 9)).toMatchObject({ status: "not_yet", monthsLeft: 3 }));
  it("2-year field: 14 months → not yet", () => expect(period("food_manufacturing", 14)).toMatchObject({ status: "not_yet", years: 2, monthsLeft: 10 }));
  it("unknown field or tenure → check", () => {
    expect(period("other", 30).status).toBe("check");
    expect(period("fishery", null).status).toBe("check");
  });
  it("lists all five conditions and never claims more than 'ok' for the ones we can't know", () => {
    const r = evaluateTransfer({ industry: "fishery", monthsAtEmployer: 20 });
    expect(r.items).toHaveLength(5);
    expect(r.items.find((i) => i.key === "skill_test_basic_and_japanese_A1")!.status).toBe("check");
    expect(r.effectiveFrom).toBe("2027-04-01");
  });
});
