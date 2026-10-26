import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { getMe, homeFor } from "@/lib/data/me";
import { withActor } from "@/lib/db";
import { supportOrgsIn } from "@/lib/data/directory";
import { PREFECTURE_CODES, DEFAULT_PREFECTURE, type Lang } from "@/config/prefectures";
import { Wizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const me = await getMe();
  if (me) redirect(homeFor(me.profile.role));
  const sp = await searchParams;
  const lang = (await getLocale()) as Lang;
  const pref = (await cookies()).get("rw_pref")?.value;
  // Support orgs are public directory data; read them as the service (no user yet).
  const orgs = await withActor("service", async (q) => {
    const out: Record<string, { id: string; name: string }[]> = {};
    for (const code of PREFECTURE_CODES) out[code] = (await supportOrgsIn(q, code)).map((o) => ({ id: o.id, name: o.name }));
    return out;
  });
  return (
    <Wizard
      initialLang={lang}
      initialPref={pref && PREFECTURE_CODES.includes(pref) ? pref : DEFAULT_PREFECTURE}
      orgsByPrefecture={orgs}
      deleted={sp.deleted === "1"}
    />
  );
}
