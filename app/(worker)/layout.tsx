import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { LineNav } from "@/components/worker/line-nav";
import { Hanko } from "@/components/ui/print";
import { IconSettings } from "@/components/ui/icons";
import { LangSwitch } from "@/components/worker/lang-switch";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireWorker();
  const lang = (await getLocale()) as Lang;
  const t = await getTranslations("nav");
  const pref = getPrefecture(me.profile.prefectureCode);
  const stations = [
    { key: "home" as const, href: "/home", label: t("home") },
    { key: "tedori" as const, href: "/tedori", label: t("tedori") },
    { key: "assistant" as const, href: "/assistant", label: t("assistant") },
    { key: "community" as const, href: "/community", label: t("community") },
    { key: "swap" as const, href: "/swap", label: t("swap") },
  ];
  return (
    <div className="min-h-dvh pb-28">
      <a href="#main" className="sr-only focus:not-sr-only">
        {t("main")}
      </a>
      <header className="mx-auto flex max-w-[520px] items-center gap-3 px-4 pt-4">
        <Link href="/home" className="flex items-center gap-2.5" aria-label="ReWork">
          <Hanko text={pref.kanji} size={40} />
          <span className="leading-none">
            <span className="block font-display text-[19px] tracking-tight">ReWork</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              {pref.lineCode} · {pref.name[lang]}
            </span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LangSwitch current={lang} />
          <Link href="/settings" aria-label={t("settings")} className="grid size-11 place-items-center border-[1.5px] border-transparent hover:border-ink">
            <IconSettings className="size-[22px]" />
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[520px] px-4 pt-4">
        {children}
      </main>
      <LineNav stations={stations} lineCode={pref.lineCode} lineName={pref.lineName[lang]} />
    </div>
  );
}
