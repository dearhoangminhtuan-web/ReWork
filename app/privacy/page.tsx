import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Kicker, Panel } from "@/components/ui/print";
import { IconArrowLeft, IconShield } from "@/components/ui/icons";

export const metadata = { title: "Privacy" };

const SECTIONS = ["purpose", "collected", "whoSees", "retention", "thirdParties", "rights"] as const;

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const tc = await getTranslations("common");
  return (
    <main className="mx-auto max-w-[680px] px-4 py-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
        <IconArrowLeft className="size-5" /> {tc("back")}
      </Link>
      <Kicker className="mt-4">ReWork · APPI</Kicker>
      <h1 className="mt-2 flex items-center gap-3 font-display text-[30px] leading-tight">
        <IconShield className="size-8 text-spot" /> {t("title")}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed">{t("intro")}</p>
      <div className="mt-6 flex flex-col gap-4">
        {SECTIONS.map((s, i) => (
          <Panel key={s} className="p-4">
            <h2 className="flex items-baseline gap-3 font-display text-[18px]">
              <span className="font-mono text-[13px] text-spot">0{i + 1}</span>
              {t(`${s}.h`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{t(`${s}.body`)}</p>
          </Panel>
        ))}
      </div>
      <p className="mt-6 text-[13px] text-ink-soft">{t("draft")}</p>
    </main>
  );
}
