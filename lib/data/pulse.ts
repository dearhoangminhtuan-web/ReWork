import "server-only";
import { many, one, withActor, type Queryable } from "@/lib/db";
import { structured, untrusted } from "@/lib/llm/client";
import { PulseSummary } from "@/lib/llm/schemas";
import { PULSE_SUMMARY_SYSTEM } from "@/lib/llm/prompts";

export const K_MIN = 5; // mirrors app.k_min() in SQL

export interface PulseResult {
  surveyId: string;
  teamId: string;
  teamName: string;
  period: string;
  shown: boolean;
  responseCount: number | null;
  avg: [number, number, number, number, number] | null;
  freeTextCount: number | null;
}

/** Employer view: per-team results. Averages only exist when responses ≥ k (enforced in SQL). */
export async function employerPulse(userId: string, employerId: string): Promise<PulseResult[]> {
  return withActor({ userId }, async (q) => {
    const surveys = await many<{ id: string; team_id: string; team_name: string; period: string }>(
      q,
      `select s.id, s.team_id, t.name as team_name, s.period from pulse_surveys s join teams t on t.id = s.team_id
       where s.employer_id = $1 order by s.period desc, t.name`,
      [employerId],
    );
    const out: PulseResult[] = [];
    for (const s of surveys) {
      const r = await one<{ shown: boolean; response_count: number | null; avg_q1: string | null; avg_q2: string | null; avg_q3: string | null; avg_q4: string | null; avg_q5: string | null; free_text_count: number | null }>(
        q,
        `select * from app.pulse_results($1)`,
        [s.id],
      );
      out.push({
        surveyId: s.id,
        teamId: s.team_id,
        teamName: s.team_name,
        period: s.period,
        shown: !!r?.shown,
        responseCount: r?.response_count ?? null,
        avg: r?.shown ? ([r.avg_q1, r.avg_q2, r.avg_q3, r.avg_q4, r.avg_q5].map(Number) as PulseResult["avg"]) : null,
        freeTextCount: r?.free_text_count ?? null,
      });
    }
    return out;
  });
}

export interface Summary {
  themesJa: string[];
  actionsJa: string[];
  ai: boolean;
}

/**
 * FR-052/053: themes from free text + suggested actions, only for surveys with
 * ≥ k responses. Runs as the service; raw comments never leave this function —
 * only the summary is stored and returned.
 */
export async function getOrBuildSummary(userId: string, r: PulseResult): Promise<Summary | null> {
  if (!r.shown || !r.avg) return null;
  const existing = await withActor({ userId }, (q) =>
    one<{ themes_ja: string[]; actions_ja: string[] }>(q, `select themes_ja, actions_ja from pulse_summaries where survey_id = $1`, [r.surveyId]),
  );
  if (existing) return { themesJa: existing.themes_ja, actionsJa: existing.actions_ja, ai: true };

  const texts = await withActor("service", async (q: Queryable) => {
    const n = await one<{ n: number }>(q, `select count(*)::int n from pulse_answers where survey_id = $1`, [r.surveyId]);
    if (!n || n.n < K_MIN) return null; // re-check k on the service side too
    return (await many<{ free_text: string }>(q, `select free_text from pulse_answers where survey_id = $1 and free_text is not null order by random()`, [r.surveyId])).map((x) => x.free_text);
  });
  if (texts === null) return null;

  const ai = await structured({
    tier: "main",
    system: PULSE_SUMMARY_SYSTEM,
    schema: PulseSummary,
    content:
      `Team averages (1–5): safety/respect ${r.avg[0]}, hours/shifts ${r.avg[1]}, Japanese & life support ${r.avg[2]}, pay clarity ${r.avg[3]}, wants to stay ${r.avg[4]}. Responses: ${r.responseCount}.\n` +
      untrusted("comments", texts.length ? texts.map((x) => `- ${x.slice(0, 400)}`).join("\n") : "(no comments)"),
    timeoutMs: 20_000,
  });
  if (!ai) return null; // UI shows rule-based actions from averages instead
  await withActor("service", (q) =>
    q.query(
      `insert into pulse_summaries (survey_id, response_count, themes_ja, actions_ja) values ($1, $2, $3, $4) on conflict (survey_id) do nothing`,
      [r.surveyId, r.responseCount, JSON.stringify(ai.themes_ja), JSON.stringify(ai.actions_ja)],
    ),
  );
  return { themesJa: ai.themes_ja, actionsJa: ai.actions_ja, ai: true };
}
