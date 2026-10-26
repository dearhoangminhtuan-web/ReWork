import { redirect } from "next/navigation";
import { getMe, homeFor } from "@/lib/data/me";

export const dynamic = "force-dynamic";

export default async function Root() {
  const me = await getMe();
  redirect(me ? homeFor(me.profile.role) : "/onboarding");
}
