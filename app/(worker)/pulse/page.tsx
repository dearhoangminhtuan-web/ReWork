import { getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { getProgress } from "@/lib/data/progress";
import { Kicker, Notice } from "@/components/ui/print";
import { PulseForm } from "./pulse-form";

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  const me = await requireWorker();
  const t = await getTranslations("pulse");
  const { pendingSurvey } = await getProgress(me.userId, me.profile.teamId);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="mt-2 font-display text-[28px] leading-tight">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t("lead")}</p>
      </header>
      {pendingSurvey ? (
        <PulseForm surveyId={pendingSurvey.id} period={pendingSurvey.period} consentOn={me.consents.surveyAggregate} />
      ) : (
        <Notice>{me.profile.teamId ? t("none") : t("noTeam")}</Notice>
      )}
    </div>
  );
}
