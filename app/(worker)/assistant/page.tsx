import { getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { getSupportOrg } from "@/lib/data/directory";
import { getPrefecture } from "@/config/prefectures";
import { Kicker } from "@/components/ui/print";
import { AssistantApp, type ChatItem } from "./assistant-app";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getTranslations("assistant"))("title") };
}

export default async function AssistantPage() {
  const me = await requireWorker();
  const t = await getTranslations("assistant");
  const pref = getPrefecture(me.profile.prefectureCode);
  const { history, org } = await withActor({ userId: me.userId }, async (q) => {
    const rows = await q.query<{ id: string; role: "user" | "assistant"; content: string; topic: string | null; citations: ChatItem["citations"] }>(
      `select id, role, content, topic, citations from (select * from chat_messages order by created_at desc limit 20) m order by created_at`,
    );
    return { history: rows.rows, org: await getSupportOrg(q, me.profile.supportOrgId) };
  });
  return (
    <div className="flex flex-col gap-4">
      <header>
        <Kicker code={`${pref.lineCode}03`}>{t("kicker")}</Kicker>
        <h1 className="mt-2 font-display text-[30px] leading-none">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t("subtitle")}</p>
      </header>
      <AssistantApp
        initial={history.map((h) => {
          const fallback = /^\[(no_article|offline)\]$/.test(h.content) ? (h.content.slice(1, -1) as "no_article" | "offline") : null;
          return {
          id: h.id,
          role: h.role,
          text: fallback ? "" : h.content,
          topic: h.topic,
          citations: h.citations ?? [],
          fallback,
          emergency: h.topic === "emergency",
          escalate: h.topic === "visa_legal" || h.topic === "labor_dispute",
          };
        })}
        org={org ? { name: org.name, phone: org.contact.phone ?? null, hours: org.contact.hours ?? null } : null}
        industry={me.profile.industry}
      />
    </div>
  );
}
