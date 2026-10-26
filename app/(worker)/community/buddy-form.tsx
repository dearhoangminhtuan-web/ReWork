"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestBuddy } from "@/app/actions/community";
import type { Lang } from "@/config/prefectures";
import { Button, Notice, Panel } from "@/components/ui/print";
import { Label, Select, TextInput } from "@/components/ui/form";
import { IconHeart } from "@/components/ui/icons";

export function BuddyForm({ lang, status }: { lang: Lang; status: "new" | "matched" | "closed" | null }) {
  const t = useTranslations("community");
  const tl = useTranslations("lang");
  const tc = useTranslations("common");
  const [f, setF] = useState({ interests: "", availability: "", language: lang });
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);
  return (
    <Panel print className="p-4">
      <h2 className="flex items-center gap-2 font-display text-[19px]">
        <IconHeart className="size-6 text-spot" /> {t("buddyTitle")}
      </h2>
      <p className="mt-1 text-[14px] text-ink-soft">{t("buddyLead")}</p>
      {status ? (
        <Notice className="mt-3">{t("buddyStatus", { status: t(`bst.${status}`) })}</Notice>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <Label htmlFor="b-int" hint={t("buddyInterestsHint")}>
              {t("buddyInterests")}
            </Label>
            <TextInput id="b-int" className="mt-1.5" value={f.interests} onChange={(e) => setF({ ...f, interests: e.target.value })} maxLength={300} />
          </div>
          <div>
            <Label htmlFor="b-av">{t("buddyAvailability")}</Label>
            <TextInput id="b-av" className="mt-1.5" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} maxLength={200} />
          </div>
          <div>
            <Label htmlFor="b-lang">{t("buddyLanguage")}</Label>
            <Select id="b-lang" className="mt-1.5" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value as Lang })}>
              {(["vi", "ja", "en"] as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {tl(l)}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={pending || !f.interests.trim() || !f.availability.trim()}
            onClick={() =>
              start(async () => {
                const r = await requestBuddy(f);
                setErr(!r.ok);
              })
            }
          >
            {t("buddySubmit")}
          </Button>
          {err ? <Notice tone="alert">{tc("error")}</Notice> : null}
        </div>
      )}
    </Panel>
  );
}
