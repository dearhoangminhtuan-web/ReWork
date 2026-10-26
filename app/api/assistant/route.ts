import { getMe } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { kbForLanguage } from "@/lib/data/kb";
import { getSupportOrg } from "@/lib/data/directory";
import { classifyByKeywords, isEmergency, needsHuman } from "@/lib/assistant/route";
import { retrieve } from "@/lib/assistant/retrieve";
import { llmAvailable, streamText, structured, untrusted } from "@/lib/llm/client";
import { Classification, type Topic } from "@/lib/llm/schemas";
import { CLASSIFY_SYSTEM, assistantSystem } from "@/lib/llm/prompts";
import { getPrefecture } from "@/config/prefectures";
import type Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const LANG_NAME = { vi: "Vietnamese", ja: "Japanese", en: "English" } as const;

/**
 * Life Assistant (FR-020…025). Response is NDJSON:
 *   {type:"meta", topic, emergency, escalate, citations, org}   ← always first (US-E05)
 *   {type:"text", delta} … {type:"done", mode}
 */
export async function POST(req: Request) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return new Response("forbidden", { status: 403 });
  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  const message = (body?.message ?? "").trim().slice(0, 1500);
  if (!message) return new Response("bad request", { status: 400 });

  const lang = me.profile.language;
  const pref = getPrefecture(me.profile.prefectureCode);
  const emergency = isEmergency(message);

  // 1) classify (AI, with keyword fallback). Emergency words always win.
  let topic: Topic = classifyByKeywords(message);
  let terms: string[] = [];
  if (!emergency && llmAvailable()) {
    const c = await structured({
      tier: "fast",
      system: CLASSIFY_SYSTEM,
      schema: Classification,
      content: `User language: ${LANG_NAME[lang]}\n${untrusted("question", message)}`,
      timeoutMs: 6000,
    });
    if (c) {
      // never downgrade a keyword hit on visa/labour to a non-human topic
      topic = needsHuman(topic) && !needsHuman(c.topic) ? topic : c.topic;
      terms = c.search_terms;
    }
  }
  if (emergency) topic = "emergency";

  // 2) retrieve + history
  const { articles, org, history } = await withActor({ userId: me.userId }, async (q) => {
    const kb = await kbForLanguage(q, lang);
    const found = retrieve(kb, { query: message, terms, topic, prefectureCode: me.profile.prefectureCode });
    const extra =
      emergency || needsHuman(topic)
        ? kb.filter((a) => a.slug === (emergency ? "emergency-numbers" : "labor-consultation") && !found.includes(a))
        : [];
    const hist = await q.query<{ role: "user" | "assistant"; content: string }>(
      `select role, content from (select role, content, created_at from chat_messages order by created_at desc limit 6) h order by created_at`,
    );
    return { articles: [...extra, ...found].slice(0, 4), org: await getSupportOrg(q, me.profile.supportOrgId), history: hist.rows };
  });

  const citations = articles.map((a) => ({ slug: a.slug, title: a.title, sourceUrl: a.sourceUrl, isSample: a.isSample }));
  const escalate = needsHuman(topic);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      send({
        type: "meta",
        topic,
        emergency,
        escalate,
        citations,
        org: org ? { name: org.name, phone: org.contact.phone ?? null, hours: org.contact.hours ?? null } : null,
      });

      let answer = "";
      let mode: "ai" | "no_article" | "offline" = "ai";
      if (articles.length === 0) {
        mode = "no_article"; // US-E04: say we don't know; never guess
      } else if (!llmAvailable()) {
        mode = "offline";
      } else {
        try {
          const kbText = articles
            .map((a, i) => `<article id="${i + 1}" title="${a.title.replace(/"/g, "'")}">\n${a.bodyMd}\n</article>`)
            .join("\n");
          const messages: Anthropic.Beta.BetaMessageParam[] = [
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: untrusted("user_message", message) },
          ];
          // API requires the first message to be from the user
          while (messages.length && messages[0].role !== "user") messages.shift();
          for await (const delta of streamText({
            system: assistantSystem({ lang: LANG_NAME[lang], prefecture: pref.name.en, articles: kbText, escalate }),
            messages,
          })) {
            answer += delta;
            send({ type: "text", delta });
          }
          if (!answer.trim()) mode = "offline";
        } catch {
          mode = "offline"; // US-E08
        }
      }
      if (mode !== "ai") send({ type: "fallback", mode });

      // 3) store (30-day retention, owner-only by RLS). Fallback replies are
      // rendered client-side from i18n; store a short marker.
      try {
        await withActor({ userId: me.userId }, async (q) => {
          await q.query(`insert into chat_messages (user_id, role, content, topic) values ($1, 'user', $2, $3)`, [me.userId, message, topic]);
          await q.query(`insert into chat_messages (user_id, role, content, topic, citations) values ($1, 'assistant', $2, $3, $4)`, [
            me.userId,
            mode === "ai" ? answer : `[${mode}]`,
            topic,
            JSON.stringify(citations),
          ]);
        });
      } catch {
        /* never fail the reply because history couldn't be saved */
      }
      send({ type: "done", mode });
      controller.close();
    },
  });

  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
