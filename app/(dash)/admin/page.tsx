import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/me";
import { many, withActor } from "@/lib/db";
import { kbAll } from "@/lib/data/kb";
import { MIN_WAGE_HOURLY } from "@/config/min-wage";
import { SAMPLE_RENT, TEDORI } from "@/config/tedori";
import { IKUSEI_TRANSFER } from "@/config/ikusei-rules";
import { DashShell, LedgerTitle } from "@/components/dash/shell";
import { Panel, SampleTag } from "@/components/ui/print";
import { KbEditor, BuddyRow } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireRole("admin");
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const tab = (await searchParams).tab ?? "kb";
  const data = await withActor({ userId: me.userId }, async (q) => ({
    kb: tab === "kb" ? await kbAll(q) : [],
    buddies:
      tab === "buddies"
        ? await many<{ id: string; interests: string; availability: string; language: string; status: "new" | "matched" | "closed"; admin_note: string | null; created_at: string | Date }>(
            q,
            `select id, interests, availability, language, status, admin_note, created_at from buddy_requests order by (status = 'new') desc, created_at desc`,
          )
        : [],
  }));

  const Source = ({ url }: { url: string | null }) =>
    url ? (
      <a href={url} target="_blank" rel="noreferrer" className="break-all text-[12.5px] underline underline-offset-2">
        {t("source")}: {url}
      </a>
    ) : (
      <span className="text-[12.5px] text-alert">{t("noSource")}</span>
    );

  return (
    <DashShell me={me} active={tab === "buddies" ? "buddies" : tab === "config" ? "config" : "kb"}>
      <LedgerTitle kicker="ReWork" title={t("title")} />
      {tab === "kb" ? (
        <>
          <p className="mt-4 text-[14px] text-ink-soft">{t("kbLead")}</p>
          <KbEditor articles={data.kb.map((a) => ({ slug: a.slug, language: a.language, title: a.title, topic: a.topic, bodyMd: a.bodyMd, isSample: a.isSample }))} />
        </>
      ) : null}
      {tab === "buddies" ? (
        <>
          <p className="mt-4 text-[14px] text-ink-soft">{t("buddiesLead")}</p>
          {data.buddies.length === 0 ? <p className="mt-4">{t("buddyEmpty")}</p> : null}
          <ul className="mt-4 flex flex-col gap-3">
            {data.buddies.map((b) => (
              <BuddyRow key={b.id} b={{ ...b, created_at: new Date(b.created_at).toISOString() }} />
            ))}
          </ul>
        </>
      ) : null}
      {tab === "config" ? (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-[14px] text-ink-soft">{t("configLead")}</p>
          <Panel className="p-4">
            <h2 className="font-display text-[17px]">
              {t("minWage")} · FY{MIN_WAGE_HOURLY.fiscalYear}
            </h2>
            <p className="font-mono text-[11px] text-alert">{t("approx")}</p>
            <ul className="mt-2 font-mono text-[14px]">
              {Object.entries(MIN_WAGE_HOURLY.values).map(([k, v]) => (
                <li key={k}>
                  {k}: ¥{v}
                </li>
              ))}
            </ul>
            <Source url={MIN_WAGE_HOURLY.sourceUrl} />
          </Panel>
          <Panel className="p-4">
            <h2 className="font-display text-[17px]">{t("rates")}</h2>
            <p className="font-mono text-[11px] text-alert">{t("approx")}</p>
            <ul className="mt-2 font-mono text-[14px]">
              <li>socialInsuranceRate: {TEDORI.socialInsuranceRate}</li>
              <li>incomeTaxRate: {TEDORI.incomeTaxRate}</li>
              <li>residentTaxRate: {TEDORI.residentTaxRate} (0 in first year)</li>
              <li>defaultHoursPerMonth: {TEDORI.defaultHoursPerMonth}</li>
            </ul>
            <Source url={TEDORI.sourceUrl} />
          </Panel>
          <Panel className="p-4">
            <h2 className="font-display text-[17px]">
              {t("rent")} <SampleTag label={tc("sample")} />
            </h2>
            {Object.entries(SAMPLE_RENT).map(([pref, m]) => (
              <div key={pref} className="mt-2 font-mono text-[13.5px]">
                <b>{pref}</b>: {Object.entries(m).map(([k, v]) => `${k} ¥${v}`).join(" · ")}
              </div>
            ))}
          </Panel>
          <Panel className="p-4">
            <h2 className="font-display text-[17px]">{t("ikusei")}</h2>
            <ul className="mt-2 font-mono text-[13px]">
              <li>effectiveFrom: {IKUSEI_TRANSFER.effectiveFrom}</li>
              <li>1y: {IKUSEI_TRANSFER.minPeriodYears.oneYear.join(", ")}</li>
              <li>2y: {IKUSEI_TRANSFER.minPeriodYears.twoYears.join(", ")}</li>
              <li>conditions: {IKUSEI_TRANSFER.conditions.join(", ")}</li>
            </ul>
            <Source url={IKUSEI_TRANSFER.sourceUrl} />
          </Panel>
        </div>
      ) : null}
    </DashShell>
  );
}
