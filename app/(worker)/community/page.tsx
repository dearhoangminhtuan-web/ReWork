import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { one, withActor } from "@/lib/db";
import { communityFor } from "@/lib/data/directory";
import { getPrefecture, municipalityName, type Lang } from "@/config/prefectures";
import { Kicker, SampleTag } from "@/components/ui/print";
import { IconCalendar, IconPin } from "@/components/ui/icons";
import { BuddyForm } from "./buddy-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getTranslations("community"))("title") };
}

export default async function CommunityPage() {
  const me = await requireWorker();
  const lang = (await getLocale()) as Lang;
  const t = await getTranslations("community");
  const tl = await getTranslations("lang");
  const tc = await getTranslations("common");
  const pref = getPrefecture(me.profile.prefectureCode);
  const { groups, events, buddy } = await withActor({ userId: me.userId }, async (q) => ({
    ...(await communityFor(q, me.profile.prefectureCode)),
    buddy: await one<{ status: "new" | "matched" | "closed" }>(q, `select status from buddy_requests order by created_at desc limit 1`),
  }));
  // own-language groups first
  const sorted = [...groups].sort((a, b) => Number(b.language === lang) - Number(a.language === lang));
  const dt = (iso: string) => new Date(iso);
  const tz = { timeZone: "Asia/Tokyo" } as const;
  const locale = { vi: "vi-VN", ja: "ja-JP", en: "en-GB" }[lang];

  return (
    <div className="flex flex-col gap-7">
      <header>
        <Kicker code={`${pref.lineCode}04`}>{t("kicker")}</Kicker>
        <h1 className="mt-2 font-display text-[30px] leading-none">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t("subtitle", { pref: pref.name[lang] })}</p>
      </header>

      {/* events: calendar tear-offs */}
      <section>
        <h2 className="font-display text-[20px]">{t("events")}</h2>
        {events.length === 0 ? <p className="mt-2 text-ink-soft">{t("noEvents")}</p> : null}
        <ol className="mt-3 flex flex-col gap-2.5">
          {events.map((e) => (
            <li key={e.id} className="flex border-[1.5px] border-ink bg-card">
              <div className="flex w-[70px] shrink-0 flex-col items-center justify-center border-r-[1.5px] border-ink bg-spot py-2 text-on-spot">
                <span className="font-mono text-[11px] uppercase">{new Intl.DateTimeFormat(locale, { ...tz, month: "short" }).format(dt(e.startsAt))}</span>
                <span className="font-display text-[26px] leading-none">{new Intl.DateTimeFormat("en", { ...tz, day: "numeric" }).format(dt(e.startsAt))}</span>
                <span className="font-mono text-[11px]">{new Intl.DateTimeFormat(locale, { ...tz, weekday: "short" }).format(dt(e.startsAt))}</span>
              </div>
              <div className="min-w-0 p-3">
                <div className="text-[15.5px] font-bold leading-tight">{e.title[lang]}</div>
                <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">{e.description[lang]}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                  <span className="inline-flex items-center gap-1">
                    <IconCalendar className="size-4" />
                    {new Intl.DateTimeFormat(locale, { ...tz, hour: "2-digit", minute: "2-digit" }).format(dt(e.startsAt))}
                  </span>
                  <span className="inline-flex items-center gap-1 font-ja">
                    <IconPin className="size-4" />
                    {e.place}
                  </span>
                  {e.isSample ? <SampleTag label={tc("sample")} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* groups: notes pinned on a bulletin board (掲示板) */}
      <section>
        <h2 className="font-display text-[20px]">{t("groups")}</h2>
        <div className="pattern-bg mt-3 grid gap-5 border-[1.5px] border-ink bg-paper-2 p-4 pt-6 sm:grid-cols-2">
          {sorted.map((g, i) => (
            <article key={g.id} className="relative border-[1.5px] border-ink bg-card p-3 shadow-[var(--shadow-print-sm)]" style={{ transform: `rotate(${[-1.2, 0.8, -0.5, 1.1, -0.9][i % 5]}deg)` }}>
              <span className="tape" aria-hidden="true" />
              <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">
                {t("inLang", { lang: tl(g.language as never) })} · {municipalityName(me.profile.prefectureCode, g.municipality, lang)}
              </div>
              <h3 className="mt-1 text-[16px] font-bold leading-tight">{g.name[lang]}</h3>
              <p className="mt-1 text-[13.5px] leading-snug">{g.description[lang]}</p>
              <dl className="mt-2 space-y-0.5 text-[12.5px]">
                {g.meets ? (
                  <div>
                    <dt className="inline font-semibold">{t("meets")}: </dt>
                    <dd className="inline">{g.meets}</dd>
                  </div>
                ) : null}
                {g.contact ? (
                  <div>
                    <dt className="inline font-semibold">{t("contact")}: </dt>
                    <dd className="inline">{g.contact}</dd>
                  </div>
                ) : null}
              </dl>
              {g.isSample ? <SampleTag label={tc("sample")} className="mt-2" /> : null}
            </article>
          ))}
        </div>
      </section>

      <BuddyForm lang={lang} status={buddy?.status ?? null} />
    </div>
  );
}
