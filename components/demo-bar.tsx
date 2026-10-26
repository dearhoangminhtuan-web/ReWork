import { getTranslations } from "next-intl/server";
import { demoSwitch } from "@/app/actions/session";
import type { Role } from "@/lib/data/me";

const DEMO_WORKER = "40000000-0000-4000-a000-000000000001";

/** DEMO_MODE only (FR-005): switch between seeded accounts for presentations. */
export async function DemoBar({ role, userId }: { role: Role | null; userId: string | null }) {
  const t = await getTranslations("demo");
  const roles: (Role | "new")[] = ["worker", "new", "employer", "support_org", "municipality", "admin"];
  const label = (r: Role | "new") => (r === "new" ? t("newWorker") : t(r));
  // A worker who just onboarded is not the seeded "Linh" account.
  const current: Role | "new" = !role || (role === "worker" && userId !== DEMO_WORKER) ? "new" : role;
  return (
    <details className="group bg-ink font-mono text-[12px] text-paper">
      <summary className="mx-auto flex min-h-8 max-w-6xl cursor-pointer list-none items-center gap-3 px-3 py-1.5 [&::-webkit-details-marker]:hidden">
        <span className="uppercase tracking-[0.16em] text-spot-2">● {t("banner")}</span>
        <span className="ml-auto opacity-80">
          {t("viewAs")}: <b className="text-paper">{label(current)}</b> <span className="inline-block transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <form action={demoSwitch} className="mx-auto flex max-w-6xl flex-wrap gap-1.5 px-3 pb-2.5">
        {roles.map((r) => (
          <button
            key={r}
            name="role"
            value={r}
            className={`min-h-9 border px-2.5 ${current === r ? "border-spot-2 bg-spot-2 text-ink" : "border-paper/40 hover:border-paper"}`}
          >
            {label(r)}
          </button>
        ))}
      </form>
    </details>
  );
}
