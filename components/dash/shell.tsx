import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Me } from "@/lib/data/me";
import { getPrefecture, type Lang } from "@/config/prefectures";
import { Hanko } from "@/components/ui/print";
import { LangSwitch } from "@/components/worker/lang-switch";
import { signOutAction } from "@/app/actions/session";
import { IconChart, IconInbox, IconList, IconLogout, IconBook, IconPeople, IconSettings } from "@/components/ui/icons";

const NAV: Record<string, { href: string; key: "pulse" | "listings" | "inbox" | "topics" | "kb" | "buddies" | "config"; icon: (p: { className?: string }) => React.ReactElement }[]> = {
  employer: [
    { href: "/employer", key: "pulse", icon: IconChart },
    { href: "/employer/listings", key: "listings", icon: IconList },
  ],
  support_org: [{ href: "/org", key: "inbox", icon: IconInbox }],
  municipality: [{ href: "/municipality", key: "topics", icon: IconChart }],
  admin: [
    { href: "/admin", key: "kb", icon: IconBook },
    { href: "/admin?tab=buddies", key: "buddies", icon: IconPeople },
    { href: "/admin?tab=config", key: "config", icon: IconSettings },
  ],
};

/** Desktop "ledger" shell for employer / support-org / municipality / admin. */
export async function DashShell({ me, active, children }: { me: Me; active: string; children: React.ReactNode }) {
  const t = await getTranslations("dash");
  const lang = (await getLocale()) as Lang;
  const pref = getPrefecture(me.profile.prefectureCode);
  const nav = NAV[me.profile.role] ?? [];
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_1fr]">
      <aside className="border-b-[1.5px] border-ink bg-ink text-paper md:min-h-dvh md:border-b-0 md:border-r-[1.5px]">
        <div className="flex items-center gap-3 px-4 py-4">
          <Hanko text={pref.kanji} size={40} />
          <div className="leading-tight">
            <div className="font-display text-[18px]">ReWork</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/70">{t(`role.${me.profile.role}`)}</div>
          </div>
        </div>
        <div className="px-4 pb-3 text-[13px] text-paper/80">{me.profile.displayName}</div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
          {nav.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active === n.key ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 px-3 text-[14px] ${active === n.key ? "bg-spot-2 font-semibold text-ink" : "hover:bg-paper/10"}`}
            >
              <span className="font-mono text-[10px] opacity-70">{pref.lineCode}{String(i + 1).padStart(2, "0")}</span>
              <n.icon className="size-5" />
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>
        <div className="hidden px-4 pb-4 pt-6 md:block">
          <div className="text-ink">
            <LangSwitch current={lang} />
          </div>
          <form action={signOutAction} className="mt-3">
            <button className="flex min-h-11 items-center gap-2 text-[13px] text-paper/80 hover:text-paper">
              <IconLogout className="size-5" /> {t("signOut")}
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}

export function LedgerTitle({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <header className="border-b-[3px] border-double border-ink pb-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{kicker}</div>
      <h1 className="mt-1 font-display text-[28px] leading-tight">{title}</h1>
      {lead ? <p className="mt-1 max-w-3xl text-[14.5px] text-ink-soft">{lead}</p> : null}
    </header>
  );
}
