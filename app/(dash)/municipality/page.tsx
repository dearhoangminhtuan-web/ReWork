import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/me";
import { many, withActor } from "@/lib/db";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { TOPICS } from "@/lib/llm/schemas";
import { DashShell, LedgerTitle } from "@/components/dash/shell";
import { Notice, cx } from "@/components/ui/print";

export const dynamic = "force-dynamic";

export default async function MunicipalityPage() {
  const me = await requireRole("municipality", "admin");
  const t = await getTranslations("muni");
  const lang = (await getLocale()) as Lang;
  const pref = getPrefecture(me.profile.prefectureCode);
  // RLS returns only this prefecture's rows with distinct_users >= 5.
  const rows = await withActor({ userId: me.userId }, (q) =>
    many<{ week: string | Date; topic: string; distinct_users: number }>(
      q,
      `select week, topic, distinct_users from topic_counts where prefecture_code = $1 order by week`,
      [pref.code],
    ),
  );
  const weekKey = (w: string | Date) => new Date(w).toISOString().slice(0, 10);
  const weeks = [...new Set(rows.map((r) => weekKey(r.week)))].slice(-8);
  const cell = new Map(rows.map((r) => [`${weekKey(r.week)}|${r.topic}`, Number(r.distinct_users)]));
  const max = Math.max(1, ...rows.map((r) => Number(r.distinct_users)));

  return (
    <DashShell me={me} active="topics">
      <LedgerTitle kicker={t("kicker")} title={t("title")} lead={t("lead", { pref: pref.name[lang] })} />
      <div className="mt-6 overflow-x-auto border-[1.5px] border-ink bg-card">
        <table className="w-full min-w-[560px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b-[1.5px] border-ink bg-paper-2">
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em]">{t("week")}</th>
              {weeks.map((w) => (
                <th key={w} className="px-2 py-2 text-right font-mono text-[12px]">
                  {w.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOPICS.map((topic) => (
              <tr key={topic} className="border-b border-ink/15 last:border-b-0">
                <th className="px-3 py-2 text-left font-semibold">{t(`topics.${topic}`)}</th>
                {weeks.map((w) => {
                  const v = cell.get(`${w}|${topic}`);
                  return (
                    <td key={w} className="px-1.5 py-1.5 text-right">
                      {v === undefined ? (
                        <span className="font-mono text-[11.5px] text-ink-soft">{t("hidden")}</span>
                      ) : (
                        <span
                          className={cx("inline-block min-w-12 border border-ink px-1.5 py-0.5 text-center font-mono tabular", v / max > 0.6 ? "bg-spot text-on-spot" : v / max > 0.3 ? "bg-spot-2" : "bg-paper-2")}
                        >
                          {v}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice className="mt-4">{t("note")}</Notice>
    </DashShell>
  );
}
