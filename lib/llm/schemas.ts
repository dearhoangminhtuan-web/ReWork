import { z } from "zod";

// FR-011: fields the model may extract from a job offer. Missing = null, never guessed.
// The LLM only extracts — lib/tedori/calc.ts computes every number shown to users.
export const OfferExtraction = z.object({
  is_job_offer: z.boolean().describe("false if the image/text is not a job offer or is unreadable"),
  employer_name: z.string().nullable(),
  prefecture: z.string().nullable().describe("Prefecture as written, e.g. 高知県 / 東京都"),
  municipality: z.string().nullable().describe("City/town/ward as written, e.g. 高知市, 新宿区"),
  wage_type: z.enum(["hourly", "monthly"]).nullable(),
  wage_amount: z.number().nullable().describe("Yen. Base wage only (時給 or 月給/基本給)"),
  hours_per_month: z.number().nullable(),
  housing_provided: z.boolean().nullable(),
  housing_fee: z.number().nullable().describe("Yen per month charged for employer housing/dormitory (寮費)"),
  transport_allowance: z.number().nullable().describe("Yen per month (通勤手当/交通費)"),
  other_allowances: z.number().nullable().describe("Yen per month, other fixed allowances"),
  deductions: z
    .array(z.object({ label: z.string(), amount: z.number() }))
    .describe("Other fixed monthly deductions listed (meals 食費, utilities 水道光熱費…), not taxes/insurance"),
});
export type OfferExtraction = z.infer<typeof OfferExtraction>;

export const TOPICS = ["daily_life", "japanese_learning", "visa_legal", "labor_dispute", "emergency", "other"] as const;
export type Topic = (typeof TOPICS)[number];

export const Classification = z.object({
  topic: z.enum(TOPICS),
  search_terms: z.array(z.string()).describe("3-8 short keywords in Japanese, English AND the user's language for searching the knowledge base"),
});

export const Lesson = z.object({
  phrases: z
    .array(
      z.object({
        ja: z.string().describe("Japanese phrase"),
        reading: z.string().describe("Hiragana/romaji reading"),
        meaning: z.string().describe("Meaning in the learner's language"),
        when: z.string().describe("When you use it at work, in the learner's language"),
      }),
    )
    .length(5),
  quiz: z
    .array(
      z.object({
        question: z.string().describe("In the learner's language"),
        options: z.array(z.string()).length(3),
        answer_index: z.number().int().min(0).max(2),
      }),
    )
    .length(3),
});
export type Lesson = z.infer<typeof Lesson>;

export const Reasons = z.object({
  reasons: z.array(z.object({ listing_id: z.string(), reason: z.string() })),
});

export const PulseSummary = z.object({
  themes_ja: z.array(z.string()).max(5),
  actions_ja: z.array(z.string()).max(4),
});
