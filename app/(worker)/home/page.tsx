import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { getProgress } from "@/lib/data/progress";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { ART, type StampFeature } from "@/components/art";
import { Kicker, Panel } from "@/components/ui/print";
import { IconArrowRight, IconShield } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await requireWorker();
  const lang = (await getLocale()) as Lang;
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const pref = getPrefecture(me.profile.prefectureCode);
  const art = ART[pref.theme];
  const progress = await getProgress(me.userId, me.profile.teamId);
  const collected = (["tedori", "assistant", "community", "swap"] as StampFeature[]).filter((f) => progress[f]).length;
  const prefName = pref.name[lang];

  const routes: { f: StampFeature; href: string; title: string; desc: string }[] = [
    { f: "tedori", href: "/tedori", title: t("tedoriTitle"), desc: t("tedoriDesc") },
    { f: "assistant", href: "/assistant", title: t("assistantTitle"), desc: t("assistantDesc") },
    { f: "community", href: "/community", title: t("communityTitle"), desc: t("communityDesc") },
    { f: "swap", href: "/swap", title: t("swapTitle"), desc: t("swapDesc", { pref: prefName }) },
  ];

  return (
    <div className="flex flex-col gap-7">
      {/* poster */}
      <section className="relative border-[1.5px] border-ink bg-card shadow-[var(--shadow-print)]">
        <art.Poster className="block w-full" />
        <span className="vertical absolute right-3 top-3 font-display text-[46px] leading-none drop-shadow-[2px_2px_0_var(--card)]">
          {pref.kanji}
        </span>
        <div className="border-t-[1.5px] border-ink px-4 py-3">
          <h1 className="font-display text-[24px] leading-tight">
            {me.profile.displayName ? t("hello", { name: me.profile.displayName }) : t("helloAnon")}
          </h1>
          <p className="mt-1 font-ja text-[14px] font-bold">{pref.greeting.local}</p>
          <p className="text-[12.5px] text-ink-soft">{pref.greeting.translation[lang]}</p>
        </div>
      </section>

      {/* this month's anonymous check-in */}
      {progress.pendingSurvey ? (
        <Link href="/pulse" className="press flex items-center gap-3 border-[1.5px] border-ink bg-spot-2 px-4 py-3 text-ink">
          <div className="flex-1">
            <div className="font-bold">
              {t("pulseTitle")} · {progress.pendingSurvey.period}
            </div>
            <div className="text-[13px] leading-snug">{t("pulseDesc")}</div>
          </div>
          <span className="whitespace-nowrap font-semibold">{t("pulseCta")}</span>
          <IconArrowRight className="size-5" />
        </Link>
      ) : null}

      {/* features as a timetable (時刻表) */}
      <section aria-label={pref.lineName[lang]}>
        <Kicker code={pref.lineCode}>{pref.lineName[lang]}</Kicker>
        <ol className="mt-3 border-[1.5px] border-ink bg-card">
          {routes.map((r, i) => (
            <li key={r.f} className="border-b-[1.5px] border-ink last:border-b-0">
              <Link href={r.href} className="group flex items-center gap-3 px-3 py-3.5 hover:bg-paper-2">
                <span className="w-11 shrink-0 text-center font-mono text-[12px] font-semibold leading-tight">
                  {pref.lineCode}
                  <br />
                  <span className="text-[18px]">{String(i + 2).padStart(2, "0")}</span>
                </span>
                <span className="h-10 w-[3px] shrink-0 bg-spot-2" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold leading-tight">{r.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{r.desc}</span>
                </span>
                <IconArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* stamp rally card (スタンプラリー) */}
      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[20px]">{t("stampTitle")}</h2>
            <p className="text-[13px] text-ink-soft">{t("stampLead", { pref: prefName })}</p>
          </div>
          <span className="whitespace-nowrap font-mono text-[20px] font-semibold">{t("stampCount", { n: collected })}</span>
        </div>
        <Panel className="pattern-bg mt-3 grid grid-cols-2 gap-x-3 gap-y-4 p-4">
          {pref.stamps.map((s, i) => {
            const Stamp = art.stamps[s.feature];
            const got = progress[s.feature];
            const rot = [-8, 5, -3, 9][i];
            return (
              <Link key={s.feature} href={routes.find((r) => r.f === s.feature)!.href} className="flex flex-col items-center text-center">
                <span
                  className={`block size-[104px] ${got ? "stamp-ink text-spot" : "text-ink/20"}`}
                  style={{ transform: `rotate(${got ? rot : 0}deg)` }}
                >
                  <Stamp label={`${pref.lineCode}0${i + 2} · ${s.name.en.toUpperCase()}`} />
                </span>
                <span className={`mt-1 text-[12.5px] leading-tight ${got ? "font-semibold" : "text-ink-soft"}`}>{s.name[lang]}</span>
              </Link>
            );
          })}
        </Panel>
      </section>

      {/* known for */}
      <section>
        <h2 className="font-display text-[18px]">{t("knownFor", { pref: prefName })}</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {pref.motifs.map((m) => (
            <li key={m.en} className="border-[1.5px] border-ink bg-card px-2.5 py-1 text-[13px]">
              {m[lang]}
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-center gap-2 text-[13px] text-ink-soft">
        <IconShield className="size-5 shrink-0 text-spot" />
        {tc("privacyLine")}
      </p>
    </div>
  );
}
