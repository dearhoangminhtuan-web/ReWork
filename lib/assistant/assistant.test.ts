import { describe, expect, it } from "vitest";
import { classifyByKeywords, isEmergency, needsHuman } from "./route";
import { retrieve, type KbArticle } from "./retrieve";

describe("emergency detection (US-E05)", () => {
  it.each([
    "I got injured at work and I'm bleeding",
    "my friend can't breathe",
    "Có cháy ở ký túc xá!",
    "Tôi bị đánh, rất sợ",
    "同僚が倒れて意識がない",
    "火事です",
  ])("detects: %s", (m) => expect(isEmergency(m)).toBe(true));
  it.each(["Which day is plastic garbage?", "Lịch đổ rác nhựa là ngày nào?", "まっことってどういう意味？"])("ignores: %s", (m) =>
    expect(isEmergency(m)).toBe(false),
  );
});

describe("keyword routing (fallback classifier)", () => {
  it("visa / transfer questions go to a human", () => {
    for (const m of ["Can I change employer next year?", "Gia hạn thẻ cư trú thế nào?", "転籍の条件は？"]) {
      const t = classifyByKeywords(m);
      expect(t).toBe("visa_legal");
      expect(needsHuman(t)).toBe(true);
    }
  });
  it("labour disputes go to a human", () => {
    for (const m of ["My boss keeps my passport", "Công ty không trả lương làm thêm giờ", "残業代が未払いです"]) {
      expect(classifyByKeywords(m)).toBe("labor_dispute");
    }
  });
  it("daily life and Japanese", () => {
    expect(classifyByKeywords("Rác nhựa vứt ngày nào?")).toBe("daily_life");
    expect(classifyByKeywords("What does まっこと mean?")).toBe("japanese_learning");
  });
});

const A = (slug: string, tags: string[], topic = "daily_life", pref: string | null = null): KbArticle => ({
  slug, tags, topic, prefectureCode: pref, language: "en", title: slug.replace(/-/g, " "), bodyMd: "", sourceUrl: null, isSample: true,
});

describe("retrieve", () => {
  const kb = [
    A("garbage-sorting-kochi", ["garbage", "trash", "plastic", "ゴミ"], "daily_life", "39_kochi"),
    A("hospital-visit", ["hospital", "doctor", "sick"]),
    A("tosa-dialect", ["dialect", "まっこと", "ぜよ"], "japanese_learning", "39_kochi"),
  ];
  it("finds by tag in the question", () => {
    expect(retrieve(kb, { query: "Which day is plastic garbage?", terms: [], topic: null, prefectureCode: "39_kochi" })[0].slug).toBe("garbage-sorting-kochi");
  });
  it("respects prefecture", () => {
    expect(retrieve(kb, { query: "plastic garbage", terms: [], topic: null, prefectureCode: "13_tokyo" })).toEqual([]);
  });
  it("returns nothing rather than a weak guess (US-E04)", () => {
    expect(retrieve(kb, { query: "How do I buy a car?", terms: ["car"], topic: "other", prefectureCode: "39_kochi" })).toEqual([]);
  });
  it("uses classifier search terms across languages", () => {
    expect(retrieve(kb, { query: "Tôi bị ốm", terms: ["hospital", "病院"], topic: "daily_life", prefectureCode: "39_kochi" })[0].slug).toBe("hospital-visit");
  });
});
