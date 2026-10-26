import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { getEmployer, listingsForEmployer } from "@/lib/data/directory";
import { DashShell, LedgerTitle } from "@/components/dash/shell";
import { Notice } from "@/components/ui/print";
import { ListingsEditor } from "./listings-editor";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const me = await requireRole("employer");
  const t = await getTranslations("listings");
  const { employer, listings } = await withActor({ userId: me.userId }, async (q) => ({
    employer: await getEmployer(q, me.profile.employerId!),
    listings: await listingsForEmployer(q, me.profile.employerId!),
  }));
  return (
    <DashShell me={me} active="listings">
      <LedgerTitle kicker={employer?.name ?? ""} title={t("title")} lead={t("lead")} />
      <Notice className="mt-4">{t("noPaid")}</Notice>
      <ListingsEditor
        prefCode={employer?.prefectureCode ?? me.profile.prefectureCode}
        defaultMunicipality={employer?.municipality ?? null}
        defaultIndustry={employer?.industry ?? "other"}
        listings={listings.map((l) => ({
          id: l.id,
          title: l.title,
          titleEn: l.titleI18n.en ?? "",
          titleVi: l.titleI18n.vi ?? "",
          industry: l.industry,
          municipality: l.municipality,
          wageType: l.wageType,
          wageAmount: l.wageAmount,
          hoursMonth: l.hoursMonth,
          dormitory: l.dormitory,
          housingFee: l.housingFee,
          languages: l.languages,
          active: l.active,
        }))}
      />
    </DashShell>
  );
}
