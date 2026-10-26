import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireWorker } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { supportOrgsIn } from "@/lib/data/directory";
import { PREFECTURE_CODES } from "@/config/prefectures";
import { SettingsForm } from "./settings-form";
import { signOutAction } from "@/app/actions/session";
import { Button } from "@/components/ui/print";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireWorker();
  const t = await getTranslations("settings");
  const orgs = await withActor({ userId: me.userId }, async (q) => {
    const out: Record<string, { id: string; name: string }[]> = {};
    for (const c of PREFECTURE_CODES) out[c] = (await supportOrgsIn(q, c)).map((o) => ({ id: o.id, name: o.name }));
    return out;
  });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[28px]">{t("title")}</h1>
      <SettingsForm profile={me.profile} consents={me.consents} orgsByPrefecture={orgs} />
      <div className="flex items-center justify-between border-t-[1.5px] border-ink pt-4">
        <Link href="/privacy" className="underline underline-offset-4">
          {t("privacyNotice")}
        </Link>
        <form action={signOutAction}>
          <Button variant="paper" type="submit">
            {t("signOut")}
          </Button>
        </form>
      </div>
    </div>
  );
}
