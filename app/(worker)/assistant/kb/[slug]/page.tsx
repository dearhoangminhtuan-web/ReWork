import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { kbArticle } from "@/lib/data/kb";
import { Markdown } from "@/components/ui/markdown";
import { Kicker, Panel, SampleTag } from "@/components/ui/print";
import { IconArrowLeft } from "@/components/ui/icons";

export default async function KbPage({ params }: { params: Promise<{ slug: string }> }) {
  const me = await requireWorker();
  const { slug } = await params;
  const lang = await getLocale();
  const t = await getTranslations("assistant");
  const tc = await getTranslations("common");
  const a = await withActor({ userId: me.userId }, (q) => kbArticle(q, slug, lang));
  if (!a) notFound();
  return (
    <article className="flex flex-col gap-4">
      <Link href="/assistant" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">
        <IconArrowLeft className="size-5" /> {t("title")}
      </Link>
      <Kicker>
        {t("article")} {a.isSample ? <SampleTag label={tc("sample")} className="ml-1" /> : null}
      </Kicker>
      <h1 className="font-display text-[26px] leading-tight">{a.title}</h1>
      <Panel className="p-4 text-[15.5px] leading-relaxed">
        <Markdown text={a.bodyMd} />
      </Panel>
      {a.sourceUrl ? (
        <p className="text-[13px]">
          {t("source")}:{" "}
          <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
            {a.sourceUrl}
          </a>
        </p>
      ) : null}
      <p className="text-[12.5px] text-ink-soft">{t("sampleKbNote")}</p>
    </article>
  );
}
