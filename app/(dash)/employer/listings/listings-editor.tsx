"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { deleteListing, saveListing, type ListingForm } from "@/app/actions/employer";
import { INDUSTRIES, getPrefecture, municipalityName, type Lang } from "@/config/prefectures";
import { minWageFor } from "@/config/min-wage";
import { formatYen } from "@/lib/i18n/format";
import { Button, Notice, Panel, cx } from "@/components/ui/print";
import { Label, NumberInput, Select, TextInput, Toggle, YenInput } from "@/components/ui/form";
import { IconAlert } from "@/components/ui/icons";

type Row = Omit<ListingForm, "industry" | "languages"> & { id: string; industry: string; languages: string[] };
const LANGS = ["ja", "vi", "en", "id", "tl", "ne", "my"] as const;

export function ListingsEditor({ listings, prefCode, defaultMunicipality, defaultIndustry }: { listings: Row[]; prefCode: string; defaultMunicipality: string | null; defaultIndustry: string }) {
  const t = useTranslations("listings");
  const ti = useTranslations("industry");
  const tl = useTranslations("lang");
  const tc = useTranslations("common");
  const lang = useLocale() as Lang;
  const pref = getPrefecture(prefCode);
  const blank: ListingForm = {
    id: null,
    title: "",
    titleEn: "",
    titleVi: "",
    industry: (INDUSTRIES as readonly string[]).includes(defaultIndustry) ? (defaultIndustry as ListingForm["industry"]) : "other",
    municipality: defaultMunicipality ?? pref.municipalities[0].id,
    wageType: "hourly",
    wageAmount: 0,
    hoursMonth: 160,
    dormitory: false,
    housingFee: null,
    languages: ["ja"],
    active: true,
  };
  const [edit, setEdit] = useState<ListingForm | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);
  const min = minWageFor(prefCode);
  const hourly = (l: { wageType: string; wageAmount: number; hoursMonth: number | null }) => (l.wageType === "hourly" ? l.wageAmount : l.hoursMonth ? l.wageAmount / l.hoursMonth : null);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="overflow-x-auto border-[1.5px] border-ink bg-card">
        <table className="w-full min-w-[640px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b-[1.5px] border-ink bg-paper-2 text-left font-mono text-[11px] uppercase tracking-[0.12em]">
              <th className="px-3 py-2">{t("colTitle")}</th>
              <th className="px-3 py-2">{t("colPlace")}</th>
              <th className="px-3 py-2 text-right">{t("colWage")}</th>
              <th className="px-3 py-2">{t("colDorm")}</th>
              <th className="px-3 py-2">{t("colStatus")}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const h = hourly(l);
              const below = h !== null && min !== null && h < min;
              return (
                <tr key={l.id} className="border-b border-ink/20 last:border-b-0">
                  <td className="px-3 py-2.5">
                    <div className="font-ja font-bold">{l.title}</div>
                    <div className="text-[12px] text-ink-soft">{ti(l.industry as never)}</div>
                  </td>
                  <td className="px-3 py-2.5">{municipalityName(prefCode, l.municipality, lang)}</td>
                  <td className={cx("px-3 py-2.5 text-right font-mono tabular", below && "text-alert")}>
                    {below ? <IconAlert className="mr-1 inline size-4" /> : null}
                    {formatYen(l.wageAmount, lang)}
                    {l.wageType === "hourly" ? tc("perHour") : tc("perMonth")}
                  </td>
                  <td className="px-3 py-2.5">{l.dormitory ? formatYen(l.housingFee ?? 0, lang) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={cx("border px-1.5 py-0.5 font-mono text-[11px]", l.active ? "border-ink bg-spot-2" : "border-dashed border-ink-soft text-ink-soft")}>
                      {l.active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button className="min-h-9 underline underline-offset-2" onClick={() => setEdit({ ...l, industry: l.industry as ListingForm["industry"], languages: l.languages as ListingForm["languages"] })}>
                      {tc("edit")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!edit ? (
        <Button className="self-start" onClick={() => setEdit(blank)}>
          + {t("new")}
        </Button>
      ) : (
        <Panel print className="grid gap-4 p-5 md:grid-cols-2">
          <h2 className="font-display text-[19px] md:col-span-2">{edit.id ? t("editTitle") : t("new")}</h2>
          <div className="md:col-span-2">
            <Label htmlFor="l-title">{t("fTitle")}</Label>
            <TextInput id="l-title" className="mt-1.5" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="l-vi">{t("fTitleVi")}</Label>
            <TextInput id="l-vi" className="mt-1.5" value={edit.titleVi} onChange={(e) => setEdit({ ...edit, titleVi: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="l-en">{t("fTitleEn")}</Label>
            <TextInput id="l-en" className="mt-1.5" value={edit.titleEn} onChange={(e) => setEdit({ ...edit, titleEn: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="l-ind">{t("fIndustry")}</Label>
            <Select id="l-ind" className="mt-1.5" value={edit.industry} onChange={(e) => setEdit({ ...edit, industry: e.target.value as ListingForm["industry"] })}>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {ti(i)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="l-muni">{t("fMunicipality")}</Label>
            <Select id="l-muni" className="mt-1.5" value={edit.municipality} onChange={(e) => setEdit({ ...edit, municipality: e.target.value })}>
              {pref.municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name[lang]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="l-wt">{t("fWageType")}</Label>
            <Select id="l-wt" className="mt-1.5" value={edit.wageType} onChange={(e) => setEdit({ ...edit, wageType: e.target.value as "hourly" | "monthly" })}>
              <option value="hourly">{t("hourly")}</option>
              <option value="monthly">{t("monthly")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="l-wage">{t("fWage")}</Label>
            <div className="mt-1.5">
              <YenInput id="l-wage" value={edit.wageAmount || null} onChange={(v) => setEdit({ ...edit, wageAmount: v ?? 0 })} />
            </div>
          </div>
          <div>
            <Label htmlFor="l-h">{t("fHours")}</Label>
            <div className="mt-1.5">
              <NumberInput id="l-h" value={edit.hoursMonth} onChange={(v) => setEdit({ ...edit, hoursMonth: v })} suffix="h" />
            </div>
          </div>
          <div>
            <Toggle id="l-dorm" checked={edit.dormitory} onChange={(v) => setEdit({ ...edit, dormitory: v })} label={t("fDorm")} />
            {edit.dormitory ? <YenInput ariaLabel={t("fHousingFee")} value={edit.housingFee} onChange={(v) => setEdit({ ...edit, housingFee: v })} /> : null}
          </div>
          <fieldset className="md:col-span-2">
            <legend className="text-[13px] font-semibold">{t("fLanguages")}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {LANGS.map((l) => {
                const on = edit.languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setEdit({ ...edit, languages: on ? edit.languages.filter((x) => x !== l) : [...edit.languages, l] })}
                    className={cx("min-h-10 border-[1.5px] border-ink px-3 text-[13.5px]", on ? "bg-ink text-paper" : "bg-card")}
                  >
                    {tl(l)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <Toggle id="l-act" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label={t("fActive")} help={t("fActiveHelp")} />
          </div>
          {min && hourly(edit) !== null && (hourly(edit) as number) < min && edit.wageAmount > 0 ? (
            <Notice tone="warn" className="md:col-span-2">
              {t("belowMin", { min: formatYen(min, lang) })}
            </Notice>
          ) : null}
          {err ? <Notice tone="alert" className="md:col-span-2">{tc("error")}</Notice> : null}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              disabled={pending || !edit.title || edit.wageAmount <= 0 || edit.languages.length === 0}
              onClick={() =>
                start(async () => {
                  setErr(false);
                  try {
                    await saveListing(edit);
                    setEdit(null);
                  } catch {
                    setErr(true);
                  }
                })
              }
            >
              {tc("save")}
            </Button>
            <Button variant="paper" onClick={() => setEdit(null)}>
              {tc("cancel")}
            </Button>
            {edit.id ? (
              <Button variant="ghost" className="ml-auto text-alert" onClick={() => start(async () => { await deleteListing(edit.id!); setEdit(null); })}>
                {tc("delete")}
              </Button>
            ) : null}
          </div>
        </Panel>
      )}
    </div>
  );
}
