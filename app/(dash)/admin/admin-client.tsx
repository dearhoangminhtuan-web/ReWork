"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveKbArticle, updateBuddy } from "@/app/actions/admin";
import { Button, Panel, SampleTag, cx } from "@/components/ui/print";
import { Label, Select, TextInput } from "@/components/ui/form";

type Art = { slug: string; language: string; title: string; topic: string; bodyMd: string; isSample: boolean };

export function KbEditor({ articles }: { articles: Art[] }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [lang, setLang] = useState("ja");
  const [edit, setEdit] = useState<Art | null>(null);
  const [pending, start] = useTransition();
  const list = articles.filter((a) => a.language === lang);
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
      <div>
        <Label htmlFor="kb-lang">{t("language")}</Label>
        <Select id="kb-lang" className="mt-1.5" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="ja">日本語</option>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </Select>
        <ul className="mt-3 border-[1.5px] border-ink bg-card">
          {list.map((a) => (
            <li key={a.slug} className="border-b border-ink/20 last:border-b-0">
              <button onClick={() => setEdit(a)} className={cx("w-full px-3 py-2.5 text-left hover:bg-paper-2", edit?.slug === a.slug && edit.language === a.language && "bg-paper-2")}>
                <div className="text-[14px] font-semibold leading-tight">{a.title}</div>
                <div className="font-mono text-[11px] text-ink-soft">
                  {a.slug} · {a.topic} {a.isSample ? <SampleTag label={tc("sample")} /> : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {edit ? (
        <Panel className="flex flex-col gap-3 p-4">
          <Label htmlFor="kb-title">{t("edit")}</Label>
          <TextInput id="kb-title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <Label htmlFor="kb-body">{t("body")}</Label>
          <textarea id="kb-body" rows={18} value={edit.bodyMd} onChange={(e) => setEdit({ ...edit, bodyMd: e.target.value })} className="w-full border-[1.5px] border-ink bg-card p-3 font-mono text-[13px]" />
          <Button className="self-start" disabled={pending} onClick={() => start(() => saveKbArticle(edit))}>
            {t("save")}
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}

export function BuddyRow({ b }: { b: { id: string; interests: string; availability: string; language: string; status: "new" | "matched" | "closed"; admin_note: string | null; created_at: string } }) {
  const t = useTranslations("admin");
  const to = useTranslations("community");
  const tl = useTranslations("lang");
  const [note, setNote] = useState(b.admin_note ?? "");
  const [pending, start] = useTransition();
  return (
    <li className="border-[1.5px] border-ink bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-ink-soft">
        <span>{b.created_at.slice(0, 10)}</span>·<span>{tl(b.language as never)}</span>
      </div>
      <div className="mt-1 text-[14.5px]">{b.interests}</div>
      <div className="text-[13px] text-ink-soft">{b.availability}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TextInput aria-label={t("note")} placeholder={t("note")} value={note} onChange={(e) => setNote(e.target.value)} className="max-w-sm" />
        {(["new", "matched", "closed"] as const).map((s) => (
          <Button key={s} variant={b.status === s ? "ink" : "paper"} disabled={pending} className="min-h-10 text-[13px]" onClick={() => start(() => updateBuddy(b.id, s, note))}>
            {to(`bst.${s}`)}
          </Button>
        ))}
      </div>
    </li>
  );
}
