import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { llmAvailable } from "@/lib/llm/client";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { Kicker } from "@/components/ui/print";
import { TedoriApp } from "./tedori-app";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getTranslations("tedori"))("title") };
}

export default async function TedoriPage() {
  const me = await requireWorker();
  const lang = (await getLocale()) as Lang;
  const t = await getTranslations("tedori");
  const pref = getPrefecture(me.profile.prefectureCode);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <Kicker code={`${pref.lineCode}02`}>{t("kicker")}</Kicker>
        <h1 className="mt-2 font-display text-[30px] leading-none">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t("subtitle")}</p>
      </header>
      <TedoriApp
        lang={lang}
        workerPref={me.profile.prefectureCode}
        workerMunicipality={me.profile.municipality}
        yearsInJapan={me.profile.yearsInJapan}
        aiAvailable={llmAvailable()}
      />
    </div>
  );
}
