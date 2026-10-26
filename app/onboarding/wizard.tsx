"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { completeOnboarding, previewPrefecture, setLocale, type OnboardingInput } from "@/app/actions/session";
import { INDUSTRIES, PREFECTURES, RESIDENCE_STATUSES, getPrefecture, type Lang } from "@/config/prefectures";
import { ART } from "@/components/art";
import { Button, Hanko, Kicker, Notice } from "@/components/ui/print";
import { Choice, Toggle } from "@/components/ui/form";
import { IconArrowLeft, IconArrowRight, IconShield } from "@/components/ui/icons";

const YEARS = [
  { key: "lt1", value: 0.5 },
  { key: "y1", value: 1.5 },
  { key: "y2", value: 2.5 },
  { key: "y3", value: 3 },
] as const;
const TENURE = [
  { key: "m0", value: 3 },
  { key: "m6", value: 9 },
  { key: "m12", value: 18 },
  { key: "m24", value: 24 },
] as const;

const STEPS = ["welcome", "language", "prefecture", "municipality", "industry", "status", "years", "tenure", "org", "consent"] as const;

export function Wizard({
  initialLang,
  initialPref,
  orgsByPrefecture,
  deleted,
}: {
  initialLang: Lang;
  initialPref: string;
  orgsByPrefecture: Record<string, { id: string; name: string }[]>;
  deleted: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [form, setForm] = useState<OnboardingInput>({
    language: initialLang,
    prefectureCode: initialPref,
    municipality: null,
    industry: "accommodation",
    residenceStatus: "ikusei",
    yearsInJapan: 0.5,
    monthsAtEmployer: 3,
    supportOrgId: orgsByPrefecture[initialPref]?.[0]?.id ?? null,
    consents: { chatImprove: false, surveyAggregate: false, shareSwapWithOrg: false },
  });
  const [error, setError] = useState(false);
  const pref = getPrefecture(form.prefectureCode);
  const Poster = ART[pref.theme].Poster;
  const name = STEPS[step];
  const total = STEPS.length - 1;
  const set = <K extends keyof OnboardingInput>(k: K, v: OnboardingInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pickLang = (l: Lang) => {
    setLang(l);
    set("language", l);
    start(async () => {
      await setLocale(l);
      router.refresh();
    });
  };
  const pickPref = (code: string) => {
    setForm((f) => ({ ...f, prefectureCode: code, municipality: null, supportOrgId: orgsByPrefecture[code]?.[0]?.id ?? null }));
    // re-theme the whole app instantly
    document.documentElement.dataset.theme = PREFECTURES[code].theme;
    void previewPrefecture(code);
  };
  const finish = () =>
    start(async () => {
      setError(false);
      const res = await completeOnboarding(form);
      if (res && !res.ok) setError(true);
    });

  if (name === "welcome") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-4 pb-8 pt-6">
        {deleted ? <Notice className="mb-4">{t("settings.deleted")}</Notice> : null}
        <div className="flex items-center gap-2.5">
          <Hanko text={pref.kanji} size={40} />
          <span className="font-display text-[20px]">ReWork</span>
        </div>
        <div className="relative mt-6 border-[1.5px] border-ink bg-card shadow-[var(--shadow-print)]">
          <Poster className="block w-full" />
          <span className="vertical absolute right-3 top-3 font-display text-[44px] leading-none text-ink drop-shadow-[2px_2px_0_var(--card)]">
            {pref.kanji}
          </span>
          <div className="border-t-[1.5px] border-ink px-4 py-3">
            <p className="font-ja text-[15px] font-bold">{pref.greeting.local}</p>
            <p className="text-[12.5px] text-ink-soft">{pref.greeting.translation[lang]}</p>
          </div>
        </div>
        <Kicker className="mt-7">{t("onboarding.welcomeKicker")}</Kicker>
        <h1 className="mt-2 font-display text-[30px] leading-[1.12]">{t("onboarding.welcomeTitle")}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{t("onboarding.welcomeLead")}</p>
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button onClick={() => setStep(1)} className="min-h-14 text-[17px]">
            {t("onboarding.start")} <IconArrowRight className="size-5" />
          </Button>
          <Link href="/login" className="text-center text-[14px] underline underline-offset-4">
            {t("onboarding.orgLogin")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col px-4 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep((s) => s - 1)} aria-label={t("common.back")} className="grid size-11 place-items-center border-[1.5px] border-ink bg-card">
          <IconArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <Kicker code={`${pref.lineCode}${String(step).padStart(2, "0")}`}>{t("onboarding.stepOf", { n: step, total })}</Kicker>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 border border-ink ${i < step ? "bg-spot" : "bg-card"}`} />
            ))}
          </div>
        </div>
      </div>

      <section className="mt-7 flex-1" aria-live="polite">
        {name === "language" && (
          <Step title={t("onboarding.languageTitle")}>
            {(["vi", "ja", "en"] as Lang[]).map((l) => (
              <Choice key={l} lang={l} selected={lang === l} onSelect={() => pickLang(l)}>
                {t(`lang.${l}`)}
              </Choice>
            ))}
          </Step>
        )}

        {name === "prefecture" && (
          <Step title={t("onboarding.prefectureTitle")} hint={t("onboarding.prefectureHint")}>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(PREFECTURES).map((p) => {
                const P = ART[p.theme].Poster;
                const sel = form.prefectureCode === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => pickPref(p.code)}
                    data-theme={p.theme}
                    className={`relative overflow-hidden border-[1.5px] border-ink bg-card text-left text-ink ${sel ? "shadow-[var(--shadow-print-spot)] outline-[3px] outline-offset-2 outline-ink outline" : ""}`}
                  >
                    <P className="block w-full" />
                    <span className="vertical absolute right-1.5 top-1.5 font-display text-[24px] leading-none drop-shadow-[1.5px_1.5px_0_var(--card)]">{p.kanji}</span>
                    <span className="block border-t-[1.5px] border-ink px-2.5 py-2">
                      <span className="block text-[15px] font-bold">{p.name[lang]}</span>
                      <span className="block text-[11.5px] leading-snug text-ink-soft">{p.tagline[lang]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {name === "municipality" && (
          <Step title={t("onboarding.municipalityTitle")}>
            {pref.municipalities.map((m) => (
              <Choice key={m.id} selected={form.municipality === m.id} onSelect={() => set("municipality", m.id)} sub={lang !== "ja" ? m.name.ja : undefined}>
                {m.name[lang]}
              </Choice>
            ))}
            <Choice selected={form.municipality === null} onSelect={() => set("municipality", null)}>
              {t("onboarding.municipalityUnknown")}
            </Choice>
          </Step>
        )}

        {name === "industry" && (
          <Step title={t("onboarding.industryTitle")}>
            {INDUSTRIES.map((i) => (
              <Choice key={i} selected={form.industry === i} onSelect={() => set("industry", i)}>
                {t(`industry.${i}`)}
              </Choice>
            ))}
          </Step>
        )}

        {name === "status" && (
          <Step title={t("onboarding.statusTitle")}>
            {RESIDENCE_STATUSES.map((s) => (
              <Choice key={s} selected={form.residenceStatus === s} onSelect={() => set("residenceStatus", s)}>
                {t(`residence.${s}`)}
              </Choice>
            ))}
          </Step>
        )}

        {name === "years" && (
          <Step title={t("onboarding.yearsTitle")}>
            {YEARS.map((y) => (
              <Choice key={y.key} selected={form.yearsInJapan === y.value} onSelect={() => set("yearsInJapan", y.value)}>
                {t(`years.${y.key}`)}
              </Choice>
            ))}
          </Step>
        )}

        {name === "tenure" && (
          <Step title={t("onboarding.tenureTitle")}>
            {TENURE.map((y) => (
              <Choice key={y.key} selected={form.monthsAtEmployer === y.value} onSelect={() => set("monthsAtEmployer", y.value)}>
                {t(`tenure.${y.key}`)}
              </Choice>
            ))}
          </Step>
        )}

        {name === "org" && (
          <Step title={t("onboarding.orgTitle")} hint={t("onboarding.orgHint")}>
            {(orgsByPrefecture[form.prefectureCode] ?? []).map((o) => (
              <Choice key={o.id} selected={form.supportOrgId === o.id} onSelect={() => set("supportOrgId", o.id)} sub={t("common.sample")}>
                {o.name}
              </Choice>
            ))}
            <Choice selected={form.supportOrgId === null} onSelect={() => set("supportOrgId", null)}>
              {t("onboarding.orgNone")}
            </Choice>
          </Step>
        )}

        {name === "consent" && (
          <Step title={t("onboarding.consentTitle")}>
            <div className="flex gap-3 border-[1.5px] border-ink bg-paper-2 p-3 text-[14px] leading-snug">
              <IconShield className="size-6 shrink-0 text-spot" />
              <p>{t("onboarding.consentLead")}</p>
            </div>
            <div className="divide-y divide-ink/20 border-y-[1.5px] border-ink">
              <Toggle id="c-chat" checked={form.consents.chatImprove} onChange={(v) => set("consents", { ...form.consents, chatImprove: v })} label={t("consents.chatImprove")} help={t("consents.chatImproveHelp")} />
              <Toggle id="c-survey" checked={form.consents.surveyAggregate} onChange={(v) => set("consents", { ...form.consents, surveyAggregate: v })} label={t("consents.surveyAggregate")} help={t("consents.surveyAggregateHelp")} />
              <Toggle id="c-swap" checked={form.consents.shareSwapWithOrg} onChange={(v) => set("consents", { ...form.consents, shareSwapWithOrg: v })} label={t("consents.shareSwap")} help={t("consents.shareSwapHelp")} />
            </div>
            <Link href="/privacy" className="text-[14px] underline underline-offset-4">
              {t("onboarding.privacyLink")}
            </Link>
            {error ? <Notice tone="alert">{t("common.error")}</Notice> : null}
          </Step>
        )}
      </section>

      <div className="sticky bottom-0 bg-paper pt-4 pb-1">
        {name === "consent" ? (
          <Button onClick={finish} disabled={pending} className="w-full min-h-14 text-[17px]">
            {pending ? t("onboarding.starting") : t("onboarding.finish")} <IconArrowRight className="size-5" />
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)} disabled={pending} className="w-full min-h-14 text-[17px]">
            {t("common.next")} <IconArrowRight className="size-5" />
          </Button>
        )}
      </div>
    </main>
  );
}

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={title} className="flex flex-col gap-2.5">
      <h1 className="font-display text-[25px] leading-tight">{title}</h1>
      {hint ? <p className="-mt-1 mb-1 text-[14px] text-ink-soft">{hint}</p> : null}
      {children}
    </div>
  );
}
