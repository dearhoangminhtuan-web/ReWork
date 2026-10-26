import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { getEmployer, listingsForEmployer, teamsFor } from "@/lib/data/directory";
import { employerPulse, getOrBuildSummary, type PulseResult } from "@/lib/data/pulse";
import { calculateTedori, emptyOffer } from "@/lib/tedori/calc";
import { municipalityName, type Lang } from "@/config/prefectures";
import { MIN_WAGE_HOURLY } from "@/config/min-wage";
import { formatYen } from "@/lib/i18n/format";
import { DashShell, LedgerTitle } from "@/components/dash/shell";
import { Button, Panel, SampleTag, cx } from "@/components/ui/print";
import { IconAlert, IconCheck, IconShield } from "@/components/ui/icons";
import { createSurvey } from "@/app/actions/employer";

export const dynamic = "force-dynamic";
const QS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function EmployerPage() {
  const me = await requireRole("employer");
  const t = await getTranslations("employer");
  const tc = await getTranslations("common");
  const lang = (await getLocale()) as Lang;
  const employerId = me.profile.employerId!;
  const { employer, teams, listings } = await withActor({ userId: me.userId }, async (q) => ({
    employer: await getEmployer(q, employerId),
    teams: await teamsFor(q, employerId),
    listings: await listingsForEmployer(q, employerId),
  }));
  const results = await employerPulse(me.userId, employerId);
  const thisMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

  const latestByTeam = teams.map((team) => {
    const rs = results.filter((r) => r.teamId === team.id);
    return { team, latest: rs[0] ?? null, previous: rs[1] ?? null, hasThisMonth: rs.some((r) => r.period === thisMonth) };
  });
  const summaries = new Map<string, Awaited<ReturnType<typeof getOrBuildSummary>>>();
  for (const x of latestByTeam) if (x.latest?.shown) summaries.set(x.latest.surveyId, await getOrBuildSummary(me.userId, x.latest));

  // FR-054 compliance: base wage per hour vs stored prefecture minimum
  const flags = listings
    .map((l) => {
      const r = calculateTedori({ ...emptyOffer(l.prefectureCode), municipality: l.municipality, wageType: l.wageType, wageAmount: l.wageAmount, hoursPerMonth: l.hoursMonth }, { yearsInJapan: 1 });
      return { l, r };
    })
    .filter((x) => x.r.belowMinWage);

  return (
    <DashShell me={me} active="pulse">
      <LedgerTitle kicker={`${employer?.name ?? ""} · ${t("kicker")}`} title={t("title")} lead={t("lead")} />
      {employer?.isSample ? <SampleTag label={tc("sample")} className="mt-3" /> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          {latestByTeam.map(({ team, latest, previous, hasThisMonth }) => (
            <TeamCard key={team.id} teamId={team.id} name={team.name} latest={latest} previous={previous} hasThisMonth={hasThisMonth} summary={latest ? (summaries.get(latest.surveyId) ?? null) : null} />
          ))}
        </div>

        <aside className="flex flex-col gap-6">
          <Panel className="p-4">
            <h2 className="flex items-center gap-2 font-display text-[16px]">
              <IconShield className="size-5 text-spot" /> {t("cantSeeTitle")}
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] leading-snug">
              <li>{t("cantSee1")}</li>
              <li>{t("cantSee2")}</li>
              <li>{t("cantSee3")}</li>
            </ul>
            <p className="mt-2 text-[12.5px] text-ink-soft">{t("kNote")}</p>
          </Panel>

          <Panel className="p-4">
            <h2 className="font-display text-[16px]">{t("complianceTitle")}</h2>
            <p className="text-[12px] text-ink-soft">{t("complianceLead", { fy: MIN_WAGE_HOURLY.fiscalYear })}</p>
            {flags.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-[14px]">
                <IconCheck className="size-5 text-spot-2" /> {t("complianceOk", { n: listings.length })}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {flags.map(({ l, r }) => (
                  <li key={l.id} className="border-[1.5px] border-alert border-l-[6px] bg-card p-2.5 text-[13.5px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <IconAlert className="size-4 text-alert" /> {l.title}
                    </div>
                    <div>
                      {t("complianceBelow", {
                        wage: formatYen(r.effectiveHourly ?? 0, lang),
                        min: formatYen(r.minWage ?? 0, lang),
                        place: municipalityName(l.prefectureCode, l.municipality, lang),
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <a href={MIN_WAGE_HOURLY.officialInfoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[12.5px] underline underline-offset-2">
              {t("complianceSource")}
            </a>
          </Panel>
        </aside>
      </div>
    </DashShell>
  );

  function TeamCard({
    teamId,
    name,
    latest,
    previous,
    hasThisMonth,
    summary,
  }: {
    teamId: string;
    name: string;
    latest: PulseResult | null;
    previous: PulseResult | null;
    hasThisMonth: boolean;
    summary: Awaited<ReturnType<typeof getOrBuildSummary>>;
  }) {
    const score = latest?.avg ? Math.round(((latest.avg.reduce((a, b) => a + b, 0) / 5 - 1) / 4) * 100) : null;
    const prevScore = previous?.avg ? Math.round(((previous.avg.reduce((a, b) => a + b, 0) / 5 - 1) / 4) * 100) : null;
    const ruleActions = latest?.avg ? QS.filter((_, i) => latest.avg![i] < 3.5).map((q) => t(`rule.${q}`)) : [];
    return (
      <section className="border-[1.5px] border-ink bg-card shadow-[var(--shadow-print)]">
        <div className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-ink px-4 py-3">
          <h2 className="font-ja text-[18px] font-bold">{name}</h2>
          {latest ? <span className="font-mono text-[12px] text-ink-soft">{latest.period}</span> : null}
          <div className="ml-auto">
            {!hasThisMonth ? (
              <form action={createSurvey.bind(null, teamId)}>
                <Button variant="paper" className="min-h-9 text-[13px]">
                  {t("startSurvey")}
                </Button>
              </form>
            ) : null}
          </div>
        </div>
        {!latest ? (
          <p className="px-4 py-4 text-[14px] text-ink-soft">{t("noSurvey")}</p>
        ) : !latest.shown ? (
          <div className="flex items-center gap-3 px-4 py-5">
            <IconShield className="size-7 shrink-0 text-ink-soft" />
            <div>
              <p className="text-[15px] font-semibold">{t("notEnough")}</p>
              <p className="text-[13px] text-ink-soft">{t("notEnoughLead")}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-4 md:grid-cols-[150px_1fr]">
            <div className="text-center md:border-r-[1.5px] md:border-dashed md:border-ink md:pr-4">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{t("score")}</div>
              <div className="font-display text-[54px] leading-none">{score}</div>
              <div className="font-mono text-[12px] text-ink-soft">/ 100</div>
              {prevScore !== null && score !== null ? (
                <div className={cx("mt-2 font-mono text-[13px]", score >= prevScore ? "" : "text-alert")}>
                  {score >= prevScore ? "▲" : "▼"} {Math.abs(score - prevScore)} {t("vsLast")}
                </div>
              ) : null}
              <div className="mt-2 text-[12px] text-ink-soft">{t("responses", { n: latest.responseCount ?? 0 })}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {QS.map((q, i) => {
                const v = latest.avg![i];
                const pv = previous?.avg?.[i];
                return (
                  <div key={q}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span>{t(`short.${q}`)}</span>
                      <span className="font-mono tabular">
                        {v.toFixed(1)}
                        {pv !== undefined ? <span className="ml-2 text-[11.5px] text-ink-soft">({pv.toFixed(1)})</span> : null}
                      </span>
                    </div>
                    <div className="relative mt-1 h-3 border-[1.5px] border-ink bg-paper-2" role="img" aria-label={`${t(`short.${q}`)} ${v.toFixed(1)} / 5`}>
                      <span className={cx("absolute inset-y-0 left-0", v < 3 ? "bg-alert" : v < 3.5 ? "bg-spot" : "bg-sea")} style={{ width: `${((v - 1) / 4) * 100}%` }} />
                      {[1, 2, 3].map((m) => (
                        <span key={m} className="absolute inset-y-0 w-px bg-ink/40" style={{ left: `${m * 25}%` }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="md:col-span-2 grid gap-4 border-t-[1.5px] border-dashed border-ink pt-4 md:grid-cols-2">
              <div>
                <h3 className="font-display text-[15px]">{t("themes")}</h3>
                {summary?.themesJa.length ? (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 font-ja text-[14px]" lang="ja">
                    {summary.themesJa.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-[13px] text-ink-soft">{latest.freeTextCount ? t("themesNeedAi", { n: latest.freeTextCount }) : t("noThemes")}</p>
                )}
              </div>
              <div>
                <h3 className="font-display text-[15px]">{t("actions")}</h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[14px]">
                  {(summary?.actionsJa.length ? summary.actionsJa : ruleActions).map((x) => (
                    <li key={x} lang={summary?.actionsJa.length ? "ja" : undefined}>
                      {x}
                    </li>
                  ))}
                  {!summary?.actionsJa.length && ruleActions.length === 0 ? <li>{t("rule.allGood")}</li> : null}
                </ul>
                <p className="mt-1.5 text-[11.5px] text-ink-soft">{summary?.ai ? t("aiNote") : t("ruleNote")}</p>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
}
