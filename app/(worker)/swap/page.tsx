import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { one, withActor } from "@/lib/db";
import { getSupportOrg } from "@/lib/data/directory";
import { evaluateTransfer } from "@/lib/swap/conditions";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { Kicker } from "@/components/ui/print";
import { SwapApp } from "./swap-app";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getTranslations("swap"))("title") };
}

export default async function SwapPage() {
  const me = await requireWorker();
  const lang = (await getLocale()) as Lang;
  const t = await getTranslations("swap");
  const pref = getPrefecture(me.profile.prefectureCode);
  const { org, last } = await withActor({ userId: me.userId }, async (q) => ({
    org: await getSupportOrg(q, me.profile.supportOrgId),
    last: await one<{ status: string; created_at: string | Date }>(q, `select status, created_at from swap_requests order by created_at desc limit 1`),
  }));
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Kicker code={`${pref.lineCode}05`}>{t("kicker")}</Kicker>
        <h1 className="mt-2 font-display text-[30px] leading-none">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t("subtitle", { pref: pref.name[lang] })}</p>
      </header>
      <SwapApp
        lang={lang}
        prefCode={pref.code}
        industry={me.profile.industry}
        residenceStatus={me.profile.residenceStatus}
        conditions={evaluateTransfer({ industry: me.profile.industry, monthsAtEmployer: me.profile.monthsAtEmployer })}
        org={org ? { name: org.name } : null}
        consentOn={me.consents.shareSwapWithOrg}
        last={last ? { status: last.status, createdAt: new Date(last.created_at).toISOString() } : null}
      />
    </div>
  );
}
