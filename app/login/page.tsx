import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMe, homeFor } from "@/lib/data/me";
import { authMode } from "@/lib/env";
import { Kicker, Notice, Panel } from "@/components/ui/print";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const me = await getMe();
  if (me) redirect(homeFor(me.profile.role));
  const t = await getTranslations("login");
  const configured = authMode() === "supabase";
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-[440px] flex-col justify-center px-4 py-10">
      <Kicker>ReWork · 事業者・団体</Kicker>
      <h1 className="mt-2 font-display text-[28px] leading-tight">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("lead")}</p>
      <Panel print className="mt-6 p-4">
        {configured ? <LoginForm /> : <Notice tone="warn">{t("notConfigured")}</Notice>}
      </Panel>
      <Link href="/onboarding" className="mt-6 underline underline-offset-4">
        {t("worker")}
      </Link>
    </main>
  );
}
