import { describe, expect, it } from "vitest";
import { rankListings, scoreListing, type RankableListing, type SwapAnswers, type SwapWorker } from "./rank";

const L = (over: Partial<RankableListing> & { id: string }): RankableListing => ({
  employerId: "e-" + over.id,
  prefectureCode: "39_kochi",
  municipality: "kochi_city",
  industry: "accommodation",
  wageType: "hourly",
  wageAmount: 1100,
  hoursMonth: 168,
  dormitory: true,
  housingFee: 15000,
  languages: ["ja"],
  active: true,
  ...over,
});

const worker: SwapWorker = { prefectureCode: "39_kochi", currentEmployerId: "e-current", language: "vi", yearsInJapan: 1.5 };
const answers: SwapAnswers = {
  desiredMoneyLeft: 110000,
  needDormitory: true,
  nearCompatriots: true,
  preferredIndustry: "agriculture",
  earliestStart: "2027-04",
};
const ctx = { compatriotMunicipalities: ["nankoku", "kochi_city"] };

describe("rankListings — prefecture boundary", () => {
  const tokyoGreat = L({ id: "tokyo", prefectureCode: "13_tokyo", municipality: "shinjuku", wageAmount: 3000, industry: "agriculture" });
  const osaka = L({ id: "osaka", prefectureCode: "27_osaka", municipality: "kita", wageAmount: 2500 });
  const kochiOk = L({ id: "kochi-ok", municipality: "nankoku", industry: "agriculture" });

  it("never returns out-of-prefecture listings, even when they score higher", () => {
    const out = rankListings([tokyoGreat, osaka, kochiOk], answers, worker, ctx);
    expect(out.map((s) => s.listing.id)).toEqual(["kochi-ok"]);
    expect(out.every((s) => s.listing.prefectureCode === worker.prefectureCode)).toBe(true);
  });

  it("returns fewer than 3 rather than padding (US-E07)", () => {
    expect(rankListings([tokyoGreat, osaka], answers, worker, ctx)).toEqual([]);
  });

  it("property: for random inputs, every result is in the worker's prefecture", () => {
    const prefs = ["39_kochi", "13_tokyo", "27_osaka", "01_hokkaido"];
    let seed = 42;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let run = 0; run < 200; run++) {
      const ls = Array.from({ length: 12 }, (_, i) =>
        L({ id: `${run}-${i}`, prefectureCode: prefs[Math.floor(rnd() * prefs.length)], wageAmount: 900 + Math.floor(rnd() * 2000) }),
      );
      const out = rankListings(ls, answers, worker, ctx);
      expect(out.length).toBeLessThanOrEqual(3);
      for (const s of out) expect(s.listing.prefectureCode).toBe("39_kochi");
    }
  });

  it("excludes the worker's current employer and inactive listings", () => {
    const current = L({ id: "cur", employerId: "e-current" });
    const inactive = L({ id: "off", active: false });
    const ok = L({ id: "ok" });
    expect(rankListings([current, inactive, ok], answers, worker, ctx).map((s) => s.listing.id)).toEqual(["ok"]);
  });
});

describe("rankListings — no paid input exists (FR-044)", () => {
  it("the listing contract has no paid / sponsored / boost / priority field", () => {
    const keys = Object.keys(L({ id: "x" }));
    for (const k of keys) expect(k).not.toMatch(/paid|sponsor|boost|priority|promot|fee_per_hire|ad/i);
  });

  it("extra 'sponsored' data smuggled onto a listing has no effect on order", () => {
    const a = L({ id: "a", municipality: "nankoku", industry: "agriculture" });
    const b = L({ id: "b", wageAmount: 1050 });
    const plain = rankListings([a, b], answers, worker, ctx).map((s) => s.listing.id);
    const smuggled = rankListings(
      [a, { ...b, sponsored: true, paid: 999999, priority: 1 } as unknown as RankableListing],
      answers,
      worker,
      ctx,
    ).map((s) => s.listing.id);
    expect(smuggled).toEqual(plain);
  });

  it("rankListings and scoreListing take no payment-related argument", () => {
    // (listings, answers, worker, ctx, limit) and (listing, answers, worker, ctx)
    expect(rankListings.length).toBeLessThanOrEqual(5);
    expect(scoreListing.length).toBe(4);
  });
});

describe("rankListings — scoring", () => {
  it("prefers fit: dormitory, compatriots, industry", () => {
    const fit = L({ id: "fit", municipality: "nankoku", industry: "agriculture", dormitory: true, languages: ["ja", "vi"] });
    const noDorm = L({ id: "nodorm", municipality: "nankoku", industry: "agriculture", dormitory: false, housingFee: null });
    const far = L({ id: "far", municipality: "muroto", industry: "fishery" });
    const out = rankListings([far, noDorm, fit], answers, worker, ctx);
    expect(out[0].listing.id).toBe("fit");
  });

  it("is deterministic (stable tie-break by id)", () => {
    const a = L({ id: "a" });
    const b = L({ id: "b" });
    expect(rankListings([b, a], answers, worker, ctx).map((s) => s.listing.id)).toEqual(["a", "b"]);
    expect(rankListings([a, b], answers, worker, ctx).map((s) => s.listing.id)).toEqual(["a", "b"]);
  });

  it("returns at most 3", () => {
    const ls = Array.from({ length: 10 }, (_, i) => L({ id: `l${i}` }));
    expect(rankListings(ls, answers, worker, ctx)).toHaveLength(3);
  });
});
