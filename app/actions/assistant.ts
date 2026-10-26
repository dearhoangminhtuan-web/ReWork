"use server";

import { getMe } from "@/lib/data/me";
import { structured } from "@/lib/llm/client";
import { Lesson } from "@/lib/llm/schemas";
import { lessonSystem } from "@/lib/llm/prompts";
import { sampleLesson } from "@/content/lessons";

const LANG_NAME = { vi: "Vietnamese", ja: "Japanese (explain simply)", en: "English" } as const;

/** FR-024: 5 phrases + quiz for the worker's industry and level. Falls back to a sample lesson. */
export async function makeLesson(level: "N5" | "N4" | "N3"): Promise<{ lesson: Lesson; sample: boolean }> {
  const me = await getMe();
  if (!me) throw new Error("not signed in");
  const lang = me.profile.language;
  const ai = await structured({
    tier: "fast",
    system: lessonSystem(LANG_NAME[lang], me.profile.industry ?? "general", level),
    schema: Lesson,
    content: `Make today's lesson. Industry: ${me.profile.industry ?? "general"}. Level: ${level}.`,
    maxTokens: 2500,
    timeoutMs: 15_000,
  });
  return ai ? { lesson: ai, sample: false } : { lesson: sampleLesson(me.profile.industry, lang), sample: true };
}
