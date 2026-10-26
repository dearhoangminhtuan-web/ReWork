"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { makeLesson } from "@/app/actions/assistant";
import type { Lesson } from "@/lib/llm/schemas";
import { Markdown } from "@/components/ui/markdown";
import { Button, Notice, Panel, SampleTag, cx } from "@/components/ui/print";
import { IconAlert, IconBook, IconPhone, IconSend, IconShield } from "@/components/ui/icons";

export interface ChatItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  topic: string | null;
  citations: { slug: string; title: string; sourceUrl: string | null; isSample: boolean }[];
  fallback: "no_article" | "offline" | null;
  emergency: boolean;
  escalate: boolean;
  pending?: boolean;
  error?: boolean;
}

type Org = { name: string; phone: string | null; hours: string | null } | null;

export function AssistantApp({ initial, org, industry }: { initial: ChatItem[]; org: Org; industry: string | null }) {
  const t = useTranslations("assistant");
  const [tab, setTab] = useState<"chat" | "lesson">("chat");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 border-[1.5px] border-ink" role="tablist">
        {(["chat", "lesson"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("min-h-11 text-[14.5px]", tab === k ? "bg-ink font-semibold text-paper" : "bg-card")}>
            {t(k === "chat" ? "tabChat" : "tabLesson")}
          </button>
        ))}
      </div>
      {tab === "chat" ? <Chat initial={initial} org={org} /> : <LessonView industry={industry} />}
    </div>
  );
}

function Chat({ initial, org }: { initial: ChatItem[]; org: Org }) {
  const t = useTranslations("assistant");
  const [items, setItems] = useState<ChatItem[]>(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length]);

  const ask = async (message: string) => {
    const text = message.trim();
    if (!text || busy) return;
    setDraft("");
    setBusy(true);
    const uid = crypto.randomUUID();
    const aid = crypto.randomUUID();
    const blank: ChatItem = { id: aid, role: "assistant", text: "", topic: null, citations: [], fallback: null, emergency: false, escalate: false, pending: true };
    setItems((s) => [...s, { ...blank, id: uid, role: "user", text, pending: false }, blank]);
    const patch = (p: Partial<ChatItem> | ((m: ChatItem) => Partial<ChatItem>)) =>
      setItems((s) => s.map((m) => (m.id === aid ? { ...m, ...(typeof p === "function" ? p(m) : p) } : m)));
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text }) });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "meta") patch({ topic: ev.topic, citations: ev.citations, emergency: ev.emergency, escalate: ev.escalate });
          else if (ev.type === "text") patch((m) => ({ text: m.text + ev.delta }));
          else if (ev.type === "fallback") patch({ fallback: ev.mode });
          else if (ev.type === "done") patch({ pending: false });
        }
      }
      patch({ pending: false });
    } catch {
      patch({ pending: false, error: true });
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [t("s1"), t("s2"), t("s3"), t("s4")];

  return (
    <div className="flex flex-col gap-4 pb-24">
      {items.length === 0 ? (
        <Panel className="pattern-bg p-4">
          <p className="text-[15px] font-semibold">{t("emptyTitle")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="min-h-11 border-[1.5px] border-ink bg-card px-3 py-2 text-left text-[14.5px] hover:bg-paper-2">
                {s}
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <ol className="flex flex-col gap-4" aria-live="polite">
        {items.map((m) =>
          m.role === "user" ? (
            <li key={m.id} className="ml-10 self-end border-[1.5px] border-ink bg-ink px-3.5 py-2.5 text-[15px] text-paper">
              {m.text}
            </li>
          ) : (
            <li key={m.id} className="mr-4 flex flex-col gap-2">
              {m.emergency ? <EmergencyCard org={org} /> : null}
              {m.escalate ? <HumanCard org={org} /> : null}
              <div className="border-[1.5px] border-ink bg-card px-3.5 py-3 text-[15px] leading-relaxed shadow-[var(--shadow-print-sm)]">
                {m.text ? <Markdown text={m.text} /> : null}
                {!m.text && m.pending ? <span className="inline-block animate-pulse text-ink-soft">{t("thinking")}</span> : null}
                {m.fallback === "no_article" ? <p>{t("noAnswer")}</p> : null}
                {m.fallback === "offline" ? <p>{m.citations.length ? t("offline") : t("noAnswer")}</p> : null}
                {m.error ? (
                  <p className="text-alert">
                    {t("error")}
                  </p>
                ) : null}
              </div>
              {m.citations.length ? (
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{t("sources")}</div>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/assistant/kb/${c.slug}`} className="inline-flex min-h-9 items-center gap-1.5 border-[1.5px] border-ink border-l-[6px] border-l-spot-2 bg-card px-2 text-[13px] hover:bg-paper-2">
                          <IconBook className="size-4" /> {c.title}
                          {c.isSample ? <SampleTag label={t("sampleShort")} className="ml-0.5" /> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ),
        )}
      </ol>
      <div ref={endRef} />

      <p className="flex items-start gap-2 text-[12.5px] text-ink-soft">
        <IconShield className="size-4 shrink-0 text-spot" /> {t("retention")}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(draft);
        }}
        className="fixed inset-x-0 bottom-[78px] z-20 mx-auto flex max-w-[520px] gap-2 border-t-[1.5px] border-ink bg-paper px-4 py-2.5"
      >
        <label htmlFor="ask" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="ask"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("placeholder")}
          maxLength={1500}
          className="min-h-12 flex-1 border-[1.5px] border-ink bg-card px-3 text-[16px] placeholder:text-ink-soft/70 focus:outline-none focus:shadow-[var(--shadow-print-sm)]"
        />
        <Button type="submit" disabled={busy || !draft.trim()} aria-label={t("send")} className="min-h-12 px-3.5">
          <IconSend className="size-5" />
        </Button>
      </form>
    </div>
  );
}

function EmergencyCard({ org }: { org: Org }) {
  const t = useTranslations("emergency");
  return (
    <section role="alert" className="border-[3px] border-alert bg-card">
      <div className="flex items-center gap-2 bg-alert px-3 py-2 text-[15px] font-bold text-white">
        <IconAlert className="size-5" /> {t("title")}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <a href="tel:119" className="press flex flex-col items-center border-[1.5px] border-ink bg-alert py-2 text-white">
          <span className="font-mono text-[30px] font-semibold leading-none">119</span>
          <span className="mt-1 text-[12.5px]">{t("fire")}</span>
        </a>
        <a href="tel:110" className="press flex flex-col items-center border-[1.5px] border-ink bg-ink py-2 text-paper">
          <span className="font-mono text-[30px] font-semibold leading-none">110</span>
          <span className="mt-1 text-[12.5px]">{t("police")}</span>
        </a>
      </div>
      <p className="px-3 text-[13.5px] leading-snug">{t("say")}</p>
      {org ? (
        <p className="m-3 mt-2 flex items-center gap-2 border-t-[1.5px] border-dashed border-ink pt-2 text-[13.5px]">
          <IconPhone className="size-4 shrink-0" />
          <span>
            {t("then")} <b>{org.name}</b>
            {org.phone ? <> · <a href={`tel:${org.phone.replace(/[^\d]/g, "")}`} className="underline">{org.phone}</a></> : null}
          </span>
        </p>
      ) : (
        <div className="h-3" />
      )}
    </section>
  );
}

function HumanCard({ org }: { org: Org }) {
  const t = useTranslations("assistant");
  return (
    <section className="border-[1.5px] border-ink bg-spot-2/25 p-3 text-[14px] leading-snug">
      <h3 className="flex items-center gap-2 font-bold">
        <IconPhone className="size-5" /> {t("humanTitle")}
      </h3>
      <p className="mt-1">{t("humanBody")}</p>
      <ul className="mt-2 space-y-1.5">
        <li className="border-l-[3px] border-ink pl-2">
          <b>{t("humanOrg")}</b>
          {org ? (
            <>
              : {org.name}
              {org.phone ? <> · <a className="underline" href={`tel:${org.phone.replace(/[^\d]/g, "")}`}>{org.phone}</a></> : null}
              {org.hours ? <span className="text-ink-soft"> ({org.hours})</span> : null}
            </>
          ) : (
            <> — {t("humanNoOrg")}</>
          )}
        </li>
        <li className="border-l-[3px] border-ink pl-2">{t("humanLabor")}</li>
        <li className="border-l-[3px] border-ink pl-2">
          <Link href="/assistant/kb/labor-consultation" className="underline underline-offset-2">
            {t("humanArticle")}
          </Link>
        </li>
      </ul>
    </section>
  );
}

function LessonView({ industry }: { industry: string | null }) {
  const t = useTranslations("assistant");
  const ti = useTranslations("industry");
  const [level, setLevel] = useState<"N5" | "N4" | "N3">("N4");
  const [lesson, setLesson] = useState<{ lesson: Lesson; sample: boolean } | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  const make = () =>
    start(async () => {
      setFailed(false);
      setAnswers({});
      setChecked(false);
      try {
        setLesson(await makeLesson(level));
      } catch {
        setFailed(true);
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4">
        <h2 className="font-display text-[19px]">{t("lessonTitle")}</h2>
        <p className="mt-1 text-[14px] text-ink-soft">{t("lessonLead", { industry: ti((industry ?? "other") as never) })}</p>
        <fieldset className="mt-3">
          <legend className="text-[13px] font-semibold">{t("level")}</legend>
          <div className="mt-1.5 grid grid-cols-3 border-[1.5px] border-ink">
            {(["N5", "N4", "N3"] as const).map((l) => (
              <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)} className={cx("min-h-11 font-mono", level === l ? "bg-ink text-paper" : "bg-card")}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <Button className="mt-3 w-full" onClick={make} disabled={pending}>
          {pending ? t("making") : lesson ? t("again") : t("make")}
        </Button>
        {failed ? <Notice tone="alert" className="mt-3">{t("error")}</Notice> : null}
      </Panel>

      {lesson ? (
        <>
          {lesson.sample ? <SampleTag label={t("sampleLesson")} className="self-start" /> : null}
          <ol className="flex flex-col gap-2.5">
            {lesson.lesson.phrases.map((p, i) => (
              <li key={i} className="flex gap-3 border-[1.5px] border-ink bg-card p-3">
                <span className="font-mono text-[13px] font-semibold text-spot">0{i + 1}</span>
                <div className="min-w-0">
                  <div className="font-ja text-[19px] font-bold leading-snug" lang="ja">
                    {p.ja}
                  </div>
                  <div className="font-mono text-[12px] text-ink-soft">{p.reading}</div>
                  <div className="mt-1 text-[14.5px]">{p.meaning}</div>
                  <div className="text-[12.5px] text-ink-soft">{p.when}</div>
                </div>
              </li>
            ))}
          </ol>
          <Panel className="p-4">
            <h3 className="font-display text-[17px]">{t("quiz")}</h3>
            <ol className="mt-2 flex flex-col gap-4">
              {lesson.lesson.quiz.map((q, qi) => (
                <li key={qi}>
                  <p className="text-[15px] font-semibold">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1.5" role="radiogroup">
                    {q.options.map((o, oi) => {
                      const sel = answers[qi] === oi;
                      const right = checked && oi === q.answer_index;
                      const wrong = checked && sel && oi !== q.answer_index;
                      return (
                        <button
                          key={oi}
                          role="radio"
                          aria-checked={sel}
                          onClick={() => !checked && setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className={cx(
                            "min-h-11 border-[1.5px] border-ink px-3 text-left text-[15px]",
                            right ? "bg-spot-2 font-semibold" : wrong ? "bg-alert text-white" : sel ? "bg-ink text-paper" : "bg-card",
                          )}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
            {!checked ? (
              <Button className="mt-4 w-full" variant="ink" disabled={Object.keys(answers).length < lesson.lesson.quiz.length} onClick={() => setChecked(true)}>
                {t("check")}
              </Button>
            ) : (
              <p className="mt-4 font-display text-[18px]">
                {t("score", { n: lesson.lesson.quiz.filter((q, i) => answers[i] === q.answer_index).length, total: lesson.lesson.quiz.length })}
              </p>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
