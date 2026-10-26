"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { compareOffers, emptyOffer, type Comparison, type OfferInput, type TedoriResult } from "@/lib/tedori/calc";
import { mapExtraction, type FilledField } from "@/lib/tedori/from-extraction";
import { jobsNearMe, saveComparison, type JobNear } from "@/app/actions/tedori";
import { PREFECTURES, getPrefecture, municipalityName, type Lang } from "@/config/prefectures";
import { MIN_WAGE_HOURLY } from "@/config/min-wage";
import { TEDORI } from "@/config/tedori";
import { formatYen } from "@/lib/i18n/format";
import type { OfferExtraction } from "@/lib/llm/schemas";
import { Button, Kicker, Leader, Notice, Panel, SampleTag, VerdictStamp, cx } from "@/components/ui/print";
import { Label, NumberInput, Select, TextInput, Toggle, YenInput } from "@/components/ui/form";
import { IconAlert, IconArrowRight, IconCamera, IconPencil } from "@/components/ui/icons";

type Key = "a" | "b";
type ReadState = "idle" | "reading" | "ok" | "partial" | "unreadable" | "unavailable" | "error";

export function TedoriApp({
  lang,
  workerPref,
  workerMunicipality,
  yearsInJapan,
  aiAvailable,
}: {
  lang: Lang;
  workerPref: string;
  workerMunicipality: string | null;
  yearsInJapan: number;
  aiAvailable: boolean;
}) {
  const t = useTranslations("tedori");
  const tc = useTranslations("common");
  const otherPref = workerPref === "13_tokyo" ? "39_kochi" : "13_tokyo";
  const [offers, setOffers] = useState<Record<Key, OfferInput>>({
    a: { ...emptyOffer(workerPref), municipality: workerMunicipality },
    b: { ...emptyOffer(otherPref), municipality: getPrefecture(otherPref).municipalities[0]?.id ?? null },
  });
  const [active, setActive] = useState<Key>("a");
  const [filled, setFilled] = useState<Record<Key, FilledField[]>>({ a: [], b: [] });
  const [extracted, setExtracted] = useState<Record<Key, OfferExtraction | null>>({ a: null, b: null });
  const [read, setRead] = useState<Record<Key, ReadState>>({ a: "idle", b: "idle" });
  const [result, setResult] = useState<Comparison | null>(null);
  const [jobs, setJobs] = useState<JobNear[] | null>(null);
  const [saving, startSave] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const worker = { yearsInJapan };
  const ready = offers.a.wageAmount > 0 && offers.b.wageAmount > 0;
  const placeOf = (o: OfferInput) =>
    o.employerName || (o.municipality ? municipalityName(o.prefectureCode, o.municipality, lang) : getPrefecture(o.prefectureCode).name[lang]);

  const update = (k: Key, patch: Partial<OfferInput>) => {
    const next = { ...offers, [k]: { ...offers[k], ...patch } };
    setOffers(next);
    if (result) setResult(compareOffers(next.a, next.b, worker)); // live recompute (e.g. rent entered on the result screen)
  };

  const compare = () => {
    const r = compareOffers(offers.a, offers.b, worker); // < 200 ms, client-side
    setResult(r);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    startSave(async () => {
      await saveComparison({ a: offers.a, b: offers.b, extracted }).catch(() => null);
      setJobs(await jobsNearMe().catch(() => []));
    });
  };

  const onPhoto = async (k: Key, file: File) => {
    setRead((s) => ({ ...s, [k]: "reading" }));
    try {
      const body = new FormData();
      body.set("image", await downscale(file));
      const res = await fetch("/api/extract-offer", { method: "POST", body });
      const json = (await res.json()) as { status: string; extraction?: OfferExtraction };
      if (json.status === "unavailable") return setRead((s) => ({ ...s, [k]: "unavailable" }));
      if (json.status !== "ok" || !json.extraction) return setRead((s) => ({ ...s, [k]: json.status === "unreadable" ? "unreadable" : "error" }));
      const m = mapExtraction(json.extraction, offers[k]);
      setOffers((s) => ({ ...s, [k]: m.offer }));
      setFilled((s) => ({ ...s, [k]: m.filled }));
      setExtracted((s) => ({ ...s, [k]: json.extraction! }));
      setRead((s) => ({ ...s, [k]: m.unreadable ? "unreadable" : m.filled.length < 4 ? "partial" : "ok" }));
    } catch {
      setRead((s) => ({ ...s, [k]: "error" }));
    }
  };

  if (result) {
    return (
      <div ref={topRef}>
        <Result
          result={result}
          offers={offers}
          lang={lang}
          placeOf={placeOf}
          jobs={jobs}
          loadingJobs={saving}
          workerPref={workerPref}
          onEditRent={(k, rent) => update(k, { userRent: rent })}
          onEdit={() => setResult(null)}
        />
      </div>
    );
  }

  const o = offers[active];
  return (
    <div ref={topRef} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(["a", "b"] as Key[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={active === k}
            onClick={() => setActive(k)}
            className={cx(
              "ticket flex min-h-16 items-center gap-2.5 px-4 py-2 text-left",
              active === k ? "!bg-ink text-paper" : "",
            )}
          >
            <span className={cx("grid size-8 shrink-0 place-items-center rounded-full border-2 font-display text-[15px]", active === k ? "border-spot-2 text-spot-2" : "border-ink")}>
              {k.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold leading-tight">{t(k === "a" ? "offerA" : "offerB")}</span>
              <span className={cx("block truncate font-mono text-[12px]", active === k ? "text-paper/75" : "text-ink-soft")}>
                {offers[k].wageAmount > 0 ? `${formatYen(offers[k].wageAmount, lang)}${offers[k].wageType === "hourly" ? tc("perHour") : tc("perMonth")}` : "—"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={t(active === "a" ? "offerA" : "offerB")} className="flex flex-col gap-4">
        {/* photo first, typing always available */}
        <div className="grid grid-cols-2 gap-2">
          <label className={cx("press flex min-h-12 cursor-pointer items-center justify-center gap-2 border-[1.5px] border-ink bg-spot px-3 text-[14px] font-semibold text-on-spot", !aiAvailable && "opacity-60")}>
            <IconCamera className="size-5" />
            {t("addPhoto")}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPhoto(active, f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="flex min-h-12 items-center justify-center gap-2 border-[1.5px] border-dashed border-ink px-3 text-[14px] text-ink-soft">
            <IconPencil className="size-5" /> {t("orType")}
          </div>
        </div>
        <ReadNotice state={read[active]} />

        <OfferForm offer={o} lang={lang} filled={filled[active]} onChange={(p) => update(active, p)} />
      </section>

      <div className="sticky bottom-[92px] z-10 -mx-4 border-t-[1.5px] border-ink bg-paper/95 px-4 py-3">
        {!ready ? <p className="mb-2 text-center text-[13px] text-ink-soft">{t("needBoth")}</p> : null}
        <div className="flex gap-2">
          {active === "a" ? (
            <Button variant="paper" className="flex-1" onClick={() => setActive("b")}>
              {t("offerB")} <IconArrowRight className="size-5" />
            </Button>
          ) : null}
          <Button className="flex-1" disabled={!ready} onClick={compare}>
            {t("compare")}
          </Button>
        </div>
      </div>
      <p className="text-[12px] text-ink-soft">{t("photoNote")}</p>
    </div>
  );

  function ReadNotice({ state }: { state: ReadState }) {
    if (state === "idle") return null;
    if (state === "reading")
      return (
        <Notice>
          <span className="inline-block animate-pulse">●</span> {t("reading")}
        </Notice>
      );
    if (state === "ok") return <Notice>{t("readOk")}</Notice>;
    if (state === "partial") return <Notice tone="warn">{t("readPartial")}</Notice>;
    if (state === "unavailable") return <Notice tone="warn">{t("llmDown")}</Notice>;
    if (state === "unreadable") return <Notice tone="warn">{t("readFail")}</Notice>;
    return <Notice tone="warn">{t("readError")}</Notice>;
  }
}

function OfferForm({ offer: o, lang, filled, onChange }: { offer: OfferInput; lang: Lang; filled: FilledField[]; onChange: (p: Partial<OfferInput>) => void }) {
  const t = useTranslations("tedori");
  const tc = useTranslations("common");
  const pref = getPrefecture(o.prefectureCode);
  const mark = (f: FilledField) => (filled.includes(f) ? "border-l-[5px] border-l-spot-2 pl-2.5" : "");
  const ReadTag = ({ f }: { f: FilledField }) =>
    filled.includes(f) ? <span className="ml-1.5 bg-spot-2 px-1 font-mono text-[10px] uppercase text-ink">{t("readTag")}</span> : null;

  return (
    <Panel className="flex flex-col gap-4 p-4">
      <div className={mark("employerName")}>
        <Label htmlFor="o-emp">
          {t("f.employerName")} <ReadTag f="employerName" />
        </Label>
        <TextInput id="o-emp" className="mt-1.5" value={o.employerName ?? ""} onChange={(e) => onChange({ employerName: e.target.value || null })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={mark("prefectureCode")}>
          <Label htmlFor="o-pref">
            {t("f.prefecture")} <ReadTag f="prefectureCode" />
          </Label>
          <Select
            id="o-pref"
            className="mt-1.5"
            value={o.prefectureCode}
            onChange={(e) => onChange({ prefectureCode: e.target.value, municipality: getPrefecture(e.target.value).municipalities[0]?.id ?? null })}
          >
            {Object.values(PREFECTURES).map((p) => (
              <option key={p.code} value={p.code}>
                {p.name[lang]}
              </option>
            ))}
          </Select>
        </div>
        <div className={mark("municipality")}>
          <Label htmlFor="o-muni">
            {t("f.municipality")} <ReadTag f="municipality" />
          </Label>
          <Select id="o-muni" className="mt-1.5" value={o.municipality ?? ""} onChange={(e) => onChange({ municipality: e.target.value || null })}>
            <option value="">{t("f.otherTown")}</option>
            {pref.municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name[lang]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset className={mark("wageType")}>
        <legend className="text-[13px] font-semibold">
          {t("f.wageType")} <ReadTag f="wageType" />
        </legend>
        <div className="mt-1.5 grid grid-cols-2 border-[1.5px] border-ink">
          {(["hourly", "monthly"] as const).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={o.wageType === w}
              onClick={() => onChange({ wageType: w })}
              className={cx("min-h-11 text-[15px]", o.wageType === w ? "bg-ink font-semibold text-paper" : "bg-card")}
            >
              {t(`f.${w}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className={mark("wageAmount")}>
          <Label htmlFor="o-wage">
            {t("f.wageAmount")} <ReadTag f="wageAmount" />
          </Label>
          <div className="mt-1.5">
            <YenInput id="o-wage" value={o.wageAmount || null} onChange={(v) => onChange({ wageAmount: v ?? 0 })} suffix={o.wageType === "hourly" ? tc("perHour") : tc("perMonth")} />
          </div>
        </div>
        <div className={mark("hoursPerMonth")}>
          <Label htmlFor="o-hours">
            {t("f.hours")} <ReadTag f="hoursPerMonth" />
          </Label>
          <div className="mt-1.5">
            <NumberInput id="o-hours" value={o.hoursPerMonth} onChange={(v) => onChange({ hoursPerMonth: v })} placeholder={String(TEDORI.defaultHoursPerMonth)} suffix="h" />
          </div>
        </div>
      </div>
      <p className="-mt-2 text-[12px] text-ink-soft">{t("f.hoursHint", { h: TEDORI.defaultHoursPerMonth })}</p>

      <div className={cx("border-y-[1.5px] border-ink/20", mark("housingProvided"))}>
        <Toggle id="o-house" checked={o.housingProvided} onChange={(v) => onChange({ housingProvided: v })} label={<>{t("f.housingProvided")} <ReadTag f="housingProvided" /></>} />
      </div>
      {o.housingProvided ? (
        <div className={mark("housingFee")}>
          <Label htmlFor="o-hfee">
            {t("f.housingFee")} <ReadTag f="housingFee" />
          </Label>
          <div className="mt-1.5">
            <YenInput id="o-hfee" value={o.housingFee} onChange={(v) => onChange({ housingFee: v })} suffix={tc("perMonth")} />
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="o-rent" hint={t("f.userRentHint")}>
            {t("f.userRent")}
          </Label>
          <div className="mt-1.5">
            <YenInput id="o-rent" value={o.userRent} onChange={(v) => onChange({ userRent: v })} suffix={tc("perMonth")} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className={mark("transportAllowance")}>
          <Label htmlFor="o-ta">
            {t("f.transportAllowance")} <ReadTag f="transportAllowance" />
          </Label>
          <div className="mt-1.5">
            <YenInput id="o-ta" value={o.transportAllowance || null} onChange={(v) => onChange({ transportAllowance: v ?? 0 })} />
          </div>
        </div>
        <div>
          <Label htmlFor="o-cc">{t("f.commuteCost")}</Label>
          <div className="mt-1.5">
            <YenInput id="o-cc" value={o.commuteCost || null} onChange={(v) => onChange({ commuteCost: v ?? 0 })} />
          </div>
        </div>
      </div>
      <div className={mark("otherAllowances")}>
        <Label htmlFor="o-oa">
          {t("f.otherAllowances")} <ReadTag f="otherAllowances" />
        </Label>
        <div className="mt-1.5">
          <YenInput id="o-oa" value={o.otherAllowances || null} onChange={(v) => onChange({ otherAllowances: v ?? 0 })} suffix={tc("perMonth")} />
        </div>
      </div>

      <fieldset className={mark("deductions")}>
        <legend className="text-[13px] font-semibold">
          {t("f.deductions")} <ReadTag f="deductions" />
        </legend>
        <div className="mt-1.5 flex flex-col gap-2">
          {o.deductions.map((d, i) => (
            <div key={i} className="flex gap-2">
              <TextInput
                aria-label={t("f.deductionLabel")}
                placeholder={t("f.deductionLabel")}
                value={d.label}
                onChange={(e) => onChange({ deductions: o.deductions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
              />
              <div className="w-36 shrink-0">
                <YenInput ariaLabel={t("f.deductionAmount")} value={d.amount || null} onChange={(v) => onChange({ deductions: o.deductions.map((x, j) => (j === i ? { ...x, amount: v ?? 0 } : x)) })} />
              </div>
              <button type="button" aria-label={t("f.remove")} onClick={() => onChange({ deductions: o.deductions.filter((_, j) => j !== i) })} className="min-h-11 min-w-11 border-[1.5px] border-ink bg-card">
                ×
              </button>
            </div>
          ))}
          {o.deductions.length < 6 ? (
            <button type="button" onClick={() => onChange({ deductions: [...o.deductions, { label: "", amount: 0 }] })} className="min-h-11 self-start text-[14px] font-semibold underline underline-offset-4">
              {t("f.addDeduction")}
            </button>
          ) : null}
        </div>
      </fieldset>
    </Panel>
  );
}

function Result({
  result,
  offers,
  lang,
  placeOf,
  jobs,
  loadingJobs,
  workerPref,
  onEditRent,
  onEdit,
}: {
  result: Comparison;
  offers: Record<Key, OfferInput>;
  lang: Lang;
  placeOf: (o: OfferInput) => string;
  jobs: JobNear[] | null;
  loadingJobs: boolean;
  workerPref: string;
  onEditRent: (k: Key, rent: number | null) => void;
  onEdit: () => void;
}) {
  const t = useTranslations("tedori");
  const tc = useTranslations("common");
  const ti = useTranslations("industry");
  const yen = (n: number) => formatYen(n, lang);
  const winnerKey = result.winner === "tie" ? null : result.winner;
  const maxGross = Math.max(result.a.gross, result.b.gross, 1);
  const prefName = getPrefecture(workerPref).name[lang];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Kicker>{t("resultKicker")}</Kicker>
        <h2 className="mt-2 font-display text-[26px] leading-[1.15]" aria-live="polite">
          {winnerKey
            ? t.rich("headlineMore", {
                place: placeOf(offers[winnerKey]),
                amount: yen(result.difference),
                em: (c) => <span className="bg-spot-2 px-1 text-ink">{c}</span>,
              })
            : t("headlineTie")}
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          {tc("estimate")} · {t("estimateNote")}
        </p>
      </div>

      {/* two tickets */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {(["a", "b"] as Key[]).map((k) => {
          const r = result[k];
          const pref = getPrefecture(offers[k].prefectureCode);
          return (
            <div key={k} data-theme={pref.theme} className="relative">
              <div className="ticket overflow-hidden text-ink">
                <div className="flex items-center justify-between bg-ink px-3 py-1.5 font-mono text-[11px] text-paper">
                  <span>
                    {pref.lineCode} · {k.toUpperCase()}
                  </span>
                  <span className="font-ja">{pref.kanji}</span>
                </div>
                <div className="px-3 pb-3 pt-2">
                  <div className="truncate text-[13px] font-semibold">{placeOf(offers[k])}</div>
                  <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">{t("moneyLeft")}</div>
                  <div className={cx("font-mono text-[22px] font-semibold leading-tight tabular", r.moneyLeft < 0 && "text-alert")}>{yen(r.moneyLeft)}</div>
                  <div className="text-[11.5px] text-ink-soft">{tc("perMonth")}</div>
                </div>
                <div className="perforation mx-3" />
                <div className="px-3 py-1.5 font-mono text-[10.5px] text-ink-soft">
                  {t("gross")} {yen(r.gross)}
                </div>
              </div>
              {winnerKey === k ? (
                <div className="pointer-events-none absolute -right-1 -top-9">
                  <VerdictStamp top={t("verdictTop")} main={t("verdictMain")} className="size-[78px] bg-card/90" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* where the money goes */}
      <section aria-label={t("whereTitle")}>
        <h3 className="font-display text-[18px]">{t("whereTitle")}</h3>
        <div className="mt-3 flex flex-col gap-3">
          {(["a", "b"] as Key[]).map((k) => (
            <Bar key={k} r={result[k]} label={`${k.toUpperCase()} · ${placeOf(offers[k])}`} maxGross={maxGross} yen={yen} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
          <Legend cls="bg-spot-2" label={t("moneyLeft")} />
          <Legend cls="bg-sea" label={t("rent")} />
          <Legend cls="bg-ink" label={t("taxIns")} />
          <Legend cls="bg-ink-soft [background-image:repeating-linear-gradient(45deg,transparent_0_3px,var(--card)_3px_5px)]" label={t("otherCosts")} />
        </ul>
      </section>

      {/* receipts + warnings */}
      {(["a", "b"] as Key[]).map((k) => (
        <Receipt key={k} k={k} r={result[k]} offer={offers[k]} place={placeOf(offers[k])} lang={lang} onEditRent={(v) => onEditRent(k, v)} />
      ))}

      <Panel className="p-4">
        <h3 className="font-display text-[16px]">{t("assumptionsTitle")}</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] leading-snug">
          <li>
            {t("assumeRates", {
              si: Math.round(TEDORI.socialInsuranceRate * 100),
              it: Math.round(TEDORI.incomeTaxRate * 100),
              rt: Math.round(TEDORI.residentTaxRate * 100),
            })}
          </li>
          <li>{result.a.assumptions.residentTaxApplied ? t("assumeResident") : t("assumeResidentFirst")}</li>
          {(["a", "b"] as Key[]).map((k) =>
            result[k].hoursAssumed ? <li key={`h${k}`}>{t("assumeHours", { k: k.toUpperCase(), h: result[k].hoursUsed })}</li> : null,
          )}
          {(["a", "b"] as Key[]).map((k) =>
            result[k].rentSource === "sample" ? <li key={`r${k}`}>{t("assumeRentSample", { place: placeOf(offers[k]) })}</li> : null,
          )}
        </ul>
      </Panel>

      {/* FR-017 */}
      <section>
        <h3 className="font-display text-[18px]">{t("jobsNear", { pref: prefName })}</h3>
        <p className="text-[12.5px] text-ink-soft">{t("jobsNearLead")}</p>
        <div className="mt-3 flex flex-col gap-2">
          {loadingJobs && !jobs ? <p className="text-[14px] text-ink-soft">{tc("loading")}</p> : null}
          {jobs && jobs.length === 0 ? <p className="text-[14px]">{t("jobsNearEmpty", { pref: prefName })}</p> : null}
          {jobs?.map((j) => (
            <Panel key={j.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
                  <span>{municipalityName(workerPref, j.municipality, lang)}</span>·<span>{ti(j.industry as never)}</span>
                  {j.isSample ? <SampleTag label={tc("sample")} /> : null}
                </div>
                <div className="truncate text-[15px] font-bold">{j.titleI18n[lang] ?? j.title}</div>
                <div className="truncate text-[12.5px]">{j.employerName}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[16px] font-semibold tabular">≈{yen(j.moneyLeft)}</div>
                <div className="text-[11px] text-ink-soft">{t("leftPerMonth")}</div>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <Button variant="paper" onClick={onEdit}>
        {t("editOffers")}
      </Button>
    </div>
  );
}

function Bar({ r, label, maxGross, yen }: { r: TedoriResult; label: string; maxGross: number; yen: (n: number) => string }) {
  const tax = r.socialInsurance + r.incomeTax + r.residentTax;
  const other = r.commuteUncovered + r.otherDeductions;
  const left = Math.max(0, r.moneyLeft);
  const pct = (n: number) => `${(Math.max(0, n) / maxGross) * 100}%`;
  return (
    <div>
      <div className="flex justify-between text-[12.5px]">
        <span className="truncate font-semibold">{label}</span>
        <span className="font-mono tabular">{yen(r.gross)}</span>
      </div>
      <div className="mt-1 flex h-7 border-[1.5px] border-ink bg-paper-2" role="img" aria-label={`${label}: ${yen(r.moneyLeft)}`}>
        <span className="h-full bg-spot-2" style={{ width: pct(left) }} />
        <span className="h-full border-l border-card bg-sea" style={{ width: pct(r.rent) }} />
        <span className="h-full border-l border-card bg-ink" style={{ width: pct(tax) }} />
        <span className="h-full border-l border-card bg-ink-soft [background-image:repeating-linear-gradient(45deg,transparent_0_3px,var(--card)_3px_5px)]" style={{ width: pct(other) }} />
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={cx("inline-block size-3 border border-ink", cls)} />
      {label}
    </li>
  );
}

function Receipt({ k, r, offer, place, lang, onEditRent }: { k: Key; r: TedoriResult; offer: OfferInput; place: string; lang: Lang; onEditRent: (v: number | null) => void }) {
  const t = useTranslations("tedori");
  const yen = (n: number) => formatYen(n, lang);
  const neg = (n: number) => (n ? `−${yen(n)}` : yen(0));
  const rentLabel =
    r.rentSource === "employer_housing" ? t("rentHousing") : r.rentSource === "sample" ? t("rentSample") : r.rentSource === "user" ? t("rentUser") : t("rentMissing");
  return (
    <section className="flex flex-col gap-2">
      <div className="receipt border-x-[1.5px] border-t-[1.5px] border-ink px-4 pt-3 font-mono text-[13px]">
        <div className="flex items-baseline justify-between border-b-[1.5px] border-dashed border-ink pb-2">
          <span className="font-display text-[15px]">
            {k.toUpperCase()} · <span className="font-sans font-bold">{place}</span>
          </span>
          <span className="text-[11px] text-ink-soft">{t("receiptTitle")}</span>
        </div>
        <div className="flex flex-col gap-1 py-2">
          <Leader label={t("gross")} value={yen(r.gross)} />
          <Leader label={t("socialInsurance", { rate: Math.round(r.assumptions.socialInsuranceRate * 100) })} value={neg(r.socialInsurance)} muted />
          <Leader label={t("incomeTax", { rate: Math.round(r.assumptions.incomeTaxRate * 100) })} value={neg(r.incomeTax)} muted />
          <Leader
            label={r.assumptions.residentTaxApplied ? t("residentTax", { rate: Math.round(r.assumptions.residentTaxRate * 100) }) : t("residentTaxFirstYear")}
            value={neg(r.residentTax)}
            muted
          />
          <Leader label={`${t("rent")} · ${rentLabel}`} value={r.rentSource === "missing" ? "?" : neg(r.rent)} muted />
          {r.commuteUncovered ? <Leader label={t("commute")} value={neg(r.commuteUncovered)} muted /> : null}
          {r.otherDeductions ? <Leader label={t("otherDeductions")} value={neg(r.otherDeductions)} muted /> : null}
        </div>
        <div className="border-t-[1.5px] border-ink py-2">
          <Leader label={t("moneyLeft")} value={yen(r.moneyLeft)} strong />
        </div>
      </div>
      {r.rentSource === "missing" ? (
        <Notice tone="warn">
          <p className="mb-2">{t("rentMissingAsk", { place })}</p>
          <YenInput ariaLabel={t("f.userRent")} value={offer.userRent} onChange={onEditRent} />
        </Notice>
      ) : null}
      {r.belowMinWage && r.minWage && r.effectiveHourly ? (
        <Notice tone="warn">
          <p className="flex items-start gap-2">
            <IconAlert className="mt-0.5 size-5 shrink-0" />
            <span>
              <b>{t("minWageTitle")}</b> {t("minWageBody", { place, wage: yen(r.effectiveHourly), min: yen(r.minWage), fy: MIN_WAGE_HOURLY.fiscalYear })}{" "}
              <a href={MIN_WAGE_HOURLY.officialInfoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {t("minWageLink")}
              </a>
            </span>
          </p>
        </Notice>
      ) : null}
    </section>
  );
}

/** Shrink photos before upload (faster, cheaper, less data in transit). */
async function downscale(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
