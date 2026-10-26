"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { rankForMe, sendSwapRequest, type Suggestion } from "@/app/actions/swap";
import type { SwapAnswers } from "@/lib/swap/rank";
import type { CondItem } from "@/lib/swap/conditions";
import { INDUSTRIES, getPrefecture, municipalityName, type Lang } from "@/config/prefectures";
import { formatDate, formatYen } from "@/lib/i18n/format";
import { Button, Notice, Panel, SampleTag, cx } from "@/components/ui/print";
import { Label, Select, YenInput } from "@/components/ui/form";
import { IconCheck, IconSend, IconShield } from "@/components/ui/icons";

function nextMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 1; i <= n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function SwapApp({
  lang,
  prefCode,
  industry,
  residenceStatus,
  conditions,
  org,
  consentOn,
  last,
}: {
  lang: Lang;
  prefCode: string;
  industry: string | null;
  residenceStatus: string | null;
  conditions: { items: CondItem[]; effectiveFrom: string };
  org: { name: string } | null;
  consentOn: boolean;
  last: { status: string; createdAt: string } | null;
}) {
  const t = useTranslations("swap");
  const tc = useTranslations("common");
  const ti = useTranslations("industry");
  const pref = getPrefecture(prefCode);
  const prefName = pref.name[lang];
  const [answers, setAnswers] = useState<SwapAnswers>({
    desiredMoneyLeft: 120000,
    needDormitory: true,
    nearCompatriots: true,
    preferredIndustry: (industry as SwapAnswers["preferredIndustry"]) ?? null,
    earliestStart: null,
  });
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [pending, start] = useTransition();
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<null | "ok" | "error">(null);

  const find = () =>
    start(async () => {
      setSent(null);
      const r = await rankForMe(answers);
      setResults(r.suggestions);
      requestAnimationFrame(() => document.getElementById("swap-results")?.scrollIntoView({ behavior: "smooth" }));
    });

  const send = () =>
    start(async () => {
      const r = await sendSwapRequest({ answers, suggestedIds: (results ?? []).map((s) => s.id), message, consent });
      setSent(r.ok ? "ok" : "error");
    });

  const YesNo = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <fieldset>
      <legend className="text-[14.5px] font-semibold">{label}</legend>
      <div className="mt-1.5 grid grid-cols-2 border-[1.5px] border-ink">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={cx("min-h-11", value === v ? "bg-ink font-semibold text-paper" : "bg-card")}>
            {v ? tc("yes") : tc("no")}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 border-[1.5px] border-ink bg-paper-2 p-3 text-[13.5px] leading-snug">
        <IconShield className="size-6 shrink-0 text-spot" />
        <p>{t("notPlacement")}</p>
      </div>

      {last ? (
        <Notice>
          {t("already", { date: formatDate(last.createdAt, lang), status: t(`status.${last.status as "new" | "contacted" | "closed"}`) })}
        </Notice>
      ) : null}

      {/* questionnaire */}
      <Panel print className="flex flex-col gap-4 p-4">
        <p className="text-[14px] text-ink-soft">{t("lead", { pref: prefName })}</p>
        <div>
          <Label htmlFor="q-money" hint={t("qMoneyHint")}>
            <span className="text-[14.5px]">{t("qMoney")}</span>
          </Label>
          <div className="mt-1.5">
            <YenInput id="q-money" value={answers.desiredMoneyLeft} onChange={(v) => setAnswers({ ...answers, desiredMoneyLeft: v })} suffix={tc("perMonth")} />
          </div>
        </div>
        <YesNo label={t("qDorm")} value={answers.needDormitory} onChange={(v) => setAnswers({ ...answers, needDormitory: v })} />
        <YesNo label={t("qCompat")} value={answers.nearCompatriots} onChange={(v) => setAnswers({ ...answers, nearCompatriots: v })} />
        <div>
          <Label htmlFor="q-ind">
            <span className="text-[14.5px]">{t("qIndustry")}</span>
          </Label>
          <Select
            id="q-ind"
            className="mt-1.5"
            value={answers.preferredIndustry ?? ""}
            onChange={(e) => setAnswers({ ...answers, preferredIndustry: (e.target.value || null) as SwapAnswers["preferredIndustry"] })}
          >
            <option value="">{t("anyIndustry")}</option>
            {INDUSTRIES.filter((i) => i !== "other").map((i) => (
              <option key={i} value={i}>
                {ti(i)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="q-start">
            <span className="text-[14.5px]">{t("qStart")}</span>
          </Label>
          <Select id="q-start" className="mt-1.5" value={answers.earliestStart ?? ""} onChange={(e) => setAnswers({ ...answers, earliestStart: e.target.value || null })}>
            <option value="">{t("startAny")}</option>
            {nextMonths(18).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={find} disabled={pending} className="min-h-12">
          {pending && !results ? tc("loading") : t("find", { pref: prefName })}
        </Button>
      </Panel>

      {results ? (
        <section id="swap-results" className="flex flex-col gap-5 scroll-mt-4">
          <h2 className="font-display text-[22px]">{t("resultsTitle", { pref: prefName })}</h2>
          {results.length === 0 ? <Notice tone="warn">{t("none", { pref: prefName })}</Notice> : null}
          {results.map((s, i) => (
            <StationCard
              key={s.id}
              s={s}
              index={i}
              prev={results[i - 1]}
              next={results[i + 1]}
              lang={lang}
              prefCode={prefCode}
              answers={answers}
            />
          ))}
          {results.length > 0 && results.length < 3 ? <p className="text-[14px] text-ink-soft">{t("fewer", { pref: prefName })}</p> : null}

          {/* FR-042 */}
          <Panel className="p-4">
            <h3 className="font-display text-[18px]">{t("condTitle", { date: conditions.effectiveFrom })}</h3>
            <p className="text-[12.5px] text-ink-soft">{tc("notLegal")}</p>
            {residenceStatus && residenceStatus !== "ikusei" ? <Notice className="mt-2">{t("condOtherStatus")}</Notice> : null}
            <ul className="mt-3 flex flex-col divide-y divide-ink/20 border-y-[1.5px] border-ink">
              {conditions.items.map((c) => (
                <li key={c.key} className="flex items-start gap-3 py-2.5">
                  <span
                    className={cx(
                      "mt-0.5 shrink-0 border-[1.5px] border-ink px-1.5 font-mono text-[10.5px] uppercase",
                      c.status === "ok" ? "bg-spot-2 text-ink" : c.status === "not_yet" ? "bg-ink text-paper" : "bg-card",
                    )}
                  >
                    {t(`cond.status.${c.status}`)}
                  </span>
                  <div className="text-[14px] leading-snug">
                    <div>{t(`cond.${c.key}`, { years: c.years ?? 1 })}</div>
                    {c.monthsHave !== undefined ? (
                      <div className="text-[12.5px] text-ink-soft">
                        {c.status === "not_yet" ? t("cond.monthsLeft", { have: c.monthsHave, left: c.monthsLeft ?? 0 }) : t("cond.monthsHave", { have: c.monthsHave })}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <a href="https://office-tree.jp/blog/immigration/registered-support/registered-support-20260608-6/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12.5px] underline underline-offset-2">
              {t("condSource")}
            </a>
          </Panel>

          {/* FR-043: the only action */}
          <section className="border-[1.5px] border-ink bg-card p-4 shadow-[var(--shadow-print)]">
            <h3 className="font-display text-[18px]">{t("sendTitle")}</h3>
            {!org ? (
              <Notice tone="warn" className="mt-2">
                {t("noOrg")}
              </Notice>
            ) : sent === "ok" ? (
              <div className="mt-3 flex items-start gap-3">
                <span className="stamp-in grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-spot text-spot">
                  <IconCheck className="size-7" />
                </span>
                <p className="text-[15px]">{t("sent", { org: org.name })}</p>
              </div>
            ) : (
              <>
                <p className="mt-1 text-[14px]">
                  {t("sendTo")} <b>{org.name}</b>
                </p>
                <p className="mt-1 text-[13px] text-ink-soft">{t("never")}</p>
                <div className="mt-3">
                  <Label htmlFor="s-msg">{t("message")}</Label>
                  <textarea
                    id="s-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={600}
                    rows={3}
                    className="mt-1.5 w-full border-[1.5px] border-ink bg-card p-3 text-[16px] focus:outline-none focus:shadow-[var(--shadow-print-sm)]"
                  />
                </div>
                <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-[14px] leading-snug">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--spot)]" />
                  <span>
                    {t("consent")}
                    {consentOn ? <span className="block text-[12px] text-ink-soft">{t("consentAlready")}</span> : null}
                  </span>
                </label>
                <Button className="mt-3 w-full min-h-12" disabled={!consent || pending} onClick={send}>
                  <IconSend className="size-5" /> {t("sendCta")}
                </Button>
                {sent === "error" ? <Notice tone="alert" className="mt-2">{tc("error")}</Notice> : null}
              </>
            )}
          </section>
        </section>
      ) : null}
    </div>
  );
}

/** Job suggestion drawn as a Japanese station-name sign (駅名標). */
function StationCard({
  s,
  index,
  prev,
  next,
  lang,
  prefCode,
  answers,
}: {
  s: Suggestion;
  index: number;
  prev?: Suggestion;
  next?: Suggestion;
  lang: Lang;
  prefCode: string;
  answers: SwapAnswers;
}) {
  const t = useTranslations("swap");
  const tc = useTranslations("common");
  const ti = useTranslations("industry");
  const tl = useTranslations("lang");
  const pref = getPrefecture(prefCode);
  const muni = pref.municipalities.find((m) => m.id === s.municipality);
  const yen = (n: number) => formatYen(n, lang);

  // template reason from the deterministic score parts (used when AI is off)
  const fallbackReason = [
    answers.desiredMoneyLeft
      ? s.moneyLeft >= answers.desiredMoneyLeft
        ? t("r.moneyOk")
        : t("r.moneyLess", { diff: yen(answers.desiredMoneyLeft - s.moneyLeft) })
      : null,
    answers.needDormitory ? (s.dormitory ? t("r.dorm") : t("r.noDorm")) : null,
    answers.nearCompatriots ? (s.compatriotsNearby ? t("r.compat") : t("r.noCompat")) : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="flex flex-col">
      {/* 駅名標 */}
      <div className="border-[1.5px] border-ink bg-card">
        <div className="flex items-stretch">
          <span className="grid w-14 shrink-0 place-items-center border-r-[1.5px] border-ink bg-spot-2 font-mono text-[11px] font-semibold leading-tight text-ink">
            {pref.lineCode}
            <br />
            <span className="text-[17px]">{String(11 + index * 3).padStart(2, "0")}</span>
          </span>
          <div className="min-w-0 flex-1 px-3 py-2 text-center">
            <div className="font-ja text-[28px] font-bold leading-tight tracking-[0.12em]" lang="ja">
              {muni?.name.ja ?? s.municipality}
            </div>
            <div className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft">{muni?.name.en ?? ""}</div>
          </div>
        </div>
        <div className="h-[7px] border-y-[1.5px] border-ink bg-spot-2" />
        <div className="flex justify-between px-3 py-1.5 font-ja text-[12px]">
          <span className="truncate">{prev ? `← ${municipalityName(prefCode, prev.municipality, "ja")}` : ""}</span>
          <span className="truncate">{next ? `${municipalityName(prefCode, next.municipality, "ja")} →` : ""}</span>
        </div>
      </div>

      {/* details */}
      <div className="border-x-[1.5px] border-b-[1.5px] border-ink bg-card p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
          {ti(s.industry as never)} {s.isSample ? <SampleTag label={tc("sample")} /> : null}
        </div>
        <h3 className="text-[17px] font-bold leading-tight">{s.titleI18n[lang] ?? s.title}</h3>
        <div className="text-[13px]" lang="ja">
          {s.employerName}
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t-[1.5px] border-dashed border-ink pt-2">
          <span className="text-[12.5px] text-ink-soft">
            {formatYen(s.wageAmount, lang)}
            {s.wageType === "hourly" ? tc("perHour") : tc("perMonth")}
          </span>
          <span className="font-mono text-[18px] font-semibold tabular">
            ≈{yen(s.moneyLeft)} <span className="text-[11.5px] font-normal text-ink-soft">{t("leftShort")}</span>
          </span>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
          <Chip on={s.dormitory} label={s.dormitory ? t("chipDorm", { fee: yen(s.housingFee ?? 0) }) : t("chipNoDorm")} />
          <Chip on={s.compatriotsNearby} label={s.compatriotsNearby ? t("chipCompat") : t("chipNoCompat")} />
          <Chip on label={`${t("chipLang")}: ${s.languages.map((l) => tl(l as never)).join(" · ")}`} />
        </ul>
        <div className="mt-3 border-l-[4px] border-spot pl-2.5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{t("why")}</div>
          <p className="text-[14px] leading-snug">{s.reason ?? fallbackReason}</p>
        </div>
      </div>
    </article>
  );
}

function Chip({ on, label }: { on: boolean; label: string }) {
  return <li className={cx("border-[1.5px] px-1.5 py-0.5", on ? "border-ink bg-paper-2" : "border-dashed border-ink-soft text-ink-soft")}>{label}</li>;
}
