import "server-only";
import { one, withActor } from "@/lib/db";

export interface Progress {
  tedori: boolean;
  assistant: boolean;
  community: boolean;
  swap: boolean;
  pendingSurvey: { id: string; period: string } | null;
}

/** Stamp-rally progress + this month's open check-in. All reads are the worker's own rows (RLS). */
export async function getProgress(userId: string, teamId: string | null): Promise<Progress> {
  return withActor({ userId }, async (q) => {
    const r = await one<{ c: number; m: number; b: number; s: number }>(
      q,
      `select (select count(*)::int from comparisons) c,
              (select count(*)::int from chat_messages where role = 'user') m,
              (select count(*)::int from buddy_requests) b,
              (select count(*)::int from swap_requests) s`,
    );
    let pendingSurvey: Progress["pendingSurvey"] = null;
    if (teamId) {
      pendingSurvey = await one<{ id: string; period: string }>(
        q,
        `select s.id, s.period from pulse_surveys s
         where s.team_id = $1 and s.period = to_char(now() at time zone 'Asia/Tokyo', 'YYYY-MM')
           and not exists (select 1 from pulse_participation p where p.survey_id = s.id)
         limit 1`,
        [teamId],
      );
    }
    return {
      tedori: (r?.c ?? 0) > 0,
      assistant: (r?.m ?? 0) > 0,
      community: (r?.b ?? 0) > 0,
      swap: (r?.s ?? 0) > 0,
      pendingSurvey,
    };
  });
}
