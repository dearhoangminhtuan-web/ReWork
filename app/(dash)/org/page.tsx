import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/me";
import { many, withActor } from "@/lib/db";
import { getSupportOrg, listingsByIds } from "@/lib/data/directory";
import { municipalityName, type Lang } from "@/config/prefectures";
import { formatDate, formatYen } from "@/lib/i18n/format";
import { DashShell, LedgerTitle } from "@/components/dash/shell";
import { Notice, SampleTag, cx } from "@/components/ui/print";
import { StatusButtons } from "./status-buttons";

export const dynamic = "force-dynamic";

type Req = {
  id: string;
  status: "new" | "contacted" | "closed";
  created_at: string | Date;
  suggested_listing_ids: string[];
  answers_json: {
    desiredMoneyLeft: number | null;
    needDormitory: boolean;
    nearCompatriots: boolean;
    preferredIndustry: string | null;
    earliestStart: string | null;
    message: string | null;
    snapshot: { language: string; industry: string | null; residenceStatus: string | null; monthsAtEmployer: number | null; municipality: string | null };
  };
};

export default async function OrgInbox() {
  const me = await requireRole("support_org");
  const t = await getTranslations("org");
  const ti = await getTranslations("industry");
  const tl = await getTranslations("lang");
  const tr = await getTranslations("residence");
  const tc = await getTranslations("common");
  const lang = (await getLocale()) as Lang;
  const { org, requests, listings } = await withActor({ userId: me.userId }, async (q) => {
    const requests = await many<Req>(q, `select id, status, created_at, suggested_listing_ids, answers_json from swap_requests order by (status = 'closed'), created_at desc`);
    const ids = [...new Set(requests.flatMap((r) => r.suggested_listing_ids))];
    return { org: await getSupportOrg(q, me.profile.supportOrgId), requests, listings: await listingsByIds(q, ids) };
  });
  const byId = new Map(listings.map((l) => [l.id, l]));
  const pref = org?.prefectureCode ?? me.profile.prefectureCode;

  return (
    <DashShell me={me} active="inbox">
      <LedgerTitle kicker={org?.name ?? ""} title={t("title")} lead={t("lead")} />
      <Notice className="mt-4">{t("process")}</Notice>
      {requests.length === 0 ? <p className="mt-6 text-ink-soft">{t("empty")}</p> : null}
      <ol className="mt-6 flex flex-col gap-5">
        {requests.map((r) => {
          const a = r.answers_json;
          const s = a.snapshot ?? {};
          return (
            <li key={r.id} className={cx("border-[1.5px] border-ink bg-card", r.status !== "closed" && "shadow-[var(--shadow-print)]", r.status === "closed" && "opacity-70")}>
              <div className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-ink px-4 py-2.5">
                <span className="font-mono text-[12px]">#{r.id.slice(0, 8)}</span>
                <span className="text-[13px] text-ink-soft">{t("received", { date: formatDate(new Date(r.created_at).toISOString(), lang) })}</span>
                <div className="ml-auto">
                  <StatusButtons id={r.id} status={r.status} />
                </div>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-3">
                <dl className="text-[13.5px]">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">{t("worker")}</dt>
                  <dd className="mt-1 space-y-0.5">
                    <div>{tl(s.language as never)}</div>
                    <div>{s.industry ? ti(s.industry as never) : "—"}</div>
                    <div>{s.residenceStatus ? tr(s.residenceStatus as never) : "—"}</div>
                    <div>{t("months", { n: s.monthsAtEmployer ?? 0 })}</div>
                    <div>{municipalityName(pref, s.municipality, lang)}</div>
                  </dd>
                </dl>
                <dl className="text-[13.5px]">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">{t("wants")}</dt>
                  <dd className="mt-1 space-y-0.5">
                    <div>{t("wantLeft", { amount: a.desiredMoneyLeft ? formatYen(a.desiredMoneyLeft, lang) : "—" })}</div>
                    <div>{a.needDormitory ? t("wantDorm") : t("noDorm")}</div>
                    <div>{a.nearCompatriots ? t("wantCompat") : t("noCompat")}</div>
                    <div>{a.preferredIndustry ? ti(a.preferredIndustry as never) : t("anyIndustry")}</div>
                    <div>{t("start", { month: a.earliestStart ?? "—" })}</div>
                  </dd>
                </dl>
                <div className="text-[13.5px]">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">{t("suggested")}</div>
                  <ul className="mt-1 space-y-1">
                    {r.suggested_listing_ids.map((id) => {
                      const l = byId.get(id);
                      return l ? (
                        <li key={id} className="border-l-[3px] border-spot-2 pl-2">
                          <span className="font-ja font-bold">{l.title}</span> · <span className="font-ja">{l.employerName}</span>{" "}
                          {l.isSample ? <SampleTag label={tc("sample")} /> : null}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
                {a.message ? (
                  <blockquote className="border-l-[4px] border-spot bg-paper-2 px-3 py-2 text-[14px] md:col-span-3">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">{t("message")}</div>
                    {a.message}
                  </blockquote>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </DashShell>
  );
}
