"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { deleteMyData, updateConsents, updateProfile } from "@/app/actions/session";
import { INDUSTRIES, PREFECTURES, RESIDENCE_STATUSES, getPrefecture, type Lang } from "@/config/prefectures";
import type { Consents, Profile } from "@/lib/data/me";
import { Label, Select, TextInput, Toggle } from "@/components/ui/form";
import { Button, Notice, Panel } from "@/components/ui/print";
import { IconTrash } from "@/components/ui/icons";

const YEARS = [0.5, 1.5, 2.5, 3];
const YEAR_KEYS = ["lt1", "y1", "y2", "y3"] as const;
const TENURE = [3, 9, 18, 24];
const TENURE_KEYS = ["m0", "m6", "m12", "m24"] as const;
const nearest = (arr: number[], v: number) => arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

export function SettingsForm({
  profile,
  consents,
  orgsByPrefecture,
}: {
  profile: Profile;
  consents: Consents;
  orgsByPrefecture: Record<string, { id: string; name: string }[]>;
}) {
  const t = useTranslations();
  const lang = useLocale() as Lang;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<"profile" | "consents" | null>(null);
  const [p, setP] = useState({
    prefectureCode: profile.prefectureCode,
    municipality: profile.municipality,
    industry: (profile.industry ?? "other") as (typeof INDUSTRIES)[number],
    residenceStatus: (profile.residenceStatus ?? "other") as (typeof RESIDENCE_STATUSES)[number],
    yearsInJapan: nearest(YEARS, profile.yearsInJapan),
    monthsAtEmployer: profile.monthsAtEmployer === null ? null : nearest(TENURE, profile.monthsAtEmployer),
    supportOrgId: profile.supportOrgId,
  });
  const [c, setC] = useState(consents);
  const [confirm, setConfirm] = useState("");
  const pref = getPrefecture(p.prefectureCode);

  const saveProfile = () =>
    start(async () => {
      await updateProfile(p);
      document.documentElement.dataset.theme = pref.theme;
      setSaved("profile");
      router.refresh();
    });
  const saveConsents = (next: Consents) => {
    setC(next);
    start(async () => {
      await updateConsents(next);
      setSaved("consents");
    });
  };

  return (
    <>
      <Panel className="flex flex-col gap-4 p-4">
        <h2 className="font-display text-[18px]">{t("settings.profile")}</h2>
        <div>
          <Label htmlFor="s-pref" hint={t("settings.prefectureNote")}>
            {t("settings.prefecture")}
          </Label>
          <Select
            id="s-pref"
            className="mt-1.5"
            value={p.prefectureCode}
            onChange={(e) =>
              setP({ ...p, prefectureCode: e.target.value, municipality: null, supportOrgId: orgsByPrefecture[e.target.value]?.[0]?.id ?? null })
            }
          >
            {Object.values(PREFECTURES).map((x) => (
              <option key={x.code} value={x.code}>
                {x.name[lang]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="s-muni">{t("settings.municipality")}</Label>
          <Select id="s-muni" className="mt-1.5" value={p.municipality ?? ""} onChange={(e) => setP({ ...p, municipality: e.target.value || null })}>
            <option value="">{t("onboarding.municipalityUnknown")}</option>
            {pref.municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name[lang]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="s-ind">{t("settings.industry")}</Label>
          <Select id="s-ind" className="mt-1.5" value={p.industry} onChange={(e) => setP({ ...p, industry: e.target.value as typeof p.industry })}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {t(`industry.${i}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="s-status">{t("settings.status")}</Label>
          <Select
            id="s-status"
            className="mt-1.5"
            value={p.residenceStatus}
            onChange={(e) => setP({ ...p, residenceStatus: e.target.value as typeof p.residenceStatus })}
          >
            {RESIDENCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`residence.${s}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="s-years">{t("settings.years")}</Label>
            <Select id="s-years" className="mt-1.5" value={p.yearsInJapan} onChange={(e) => setP({ ...p, yearsInJapan: Number(e.target.value) })}>
              {YEARS.map((y, i) => (
                <option key={y} value={y}>
                  {t(`years.${YEAR_KEYS[i]}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="s-ten">{t("settings.tenure")}</Label>
            <Select
              id="s-ten"
              className="mt-1.5"
              value={p.monthsAtEmployer ?? ""}
              onChange={(e) => setP({ ...p, monthsAtEmployer: e.target.value === "" ? null : Number(e.target.value) })}
            >
              {TENURE.map((m, i) => (
                <option key={m} value={m}>
                  {t(`tenure.${TENURE_KEYS[i]}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="s-org">{t("settings.supportOrg")}</Label>
          <Select id="s-org" className="mt-1.5" value={p.supportOrgId ?? ""} onChange={(e) => setP({ ...p, supportOrgId: e.target.value || null })}>
            <option value="">{t("onboarding.orgNone")}</option>
            {(orgsByPrefecture[p.prefectureCode] ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={pending}>
            {t("common.save")}
          </Button>
          {saved === "profile" ? <span className="text-[14px]">✓ {t("common.saved")}</span> : null}
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[18px]">{t("settings.consents")}</h2>
          {saved === "consents" ? <span className="text-[13px]">✓ {t("common.saved")}</span> : null}
        </div>
        <div className="mt-1 divide-y divide-ink/20">
          <Toggle id="s-c1" checked={c.chatImprove} onChange={(v) => saveConsents({ ...c, chatImprove: v })} label={t("consents.chatImprove")} help={t("consents.chatImproveHelp")} />
          <Toggle id="s-c2" checked={c.surveyAggregate} onChange={(v) => saveConsents({ ...c, surveyAggregate: v })} label={t("consents.surveyAggregate")} help={t("consents.surveyAggregateHelp")} />
          <Toggle id="s-c3" checked={c.shareSwapWithOrg} onChange={(v) => saveConsents({ ...c, shareSwapWithOrg: v })} label={t("consents.shareSwap")} help={t("consents.shareSwapHelp")} />
        </div>
      </Panel>

      <section className="border-[1.5px] border-alert bg-card p-4">
        <h2 className="flex items-center gap-2 font-display text-[18px] text-alert">
          <IconTrash className="size-5" /> {t("settings.deleteTitle")}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed">{t("settings.deleteBody")}</p>
        <div className="mt-3">
          <Label htmlFor="s-del">{t("settings.deleteConfirm")}</Label>
          <TextInput id="s-del" className="mt-1.5" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </div>
        <Button
          variant="danger"
          className="mt-3 w-full"
          disabled={confirm.trim().toUpperCase() !== "DELETE" || pending}
          onClick={() => start(async () => void (await deleteMyData(confirm)))}
        >
          {t("settings.deleteCta")}
        </Button>
        {pending ? <Notice className="mt-3">{t("common.loading")}</Notice> : null}
      </section>
    </>
  );
}
