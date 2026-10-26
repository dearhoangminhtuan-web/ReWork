"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteSupabaseAuthUser, setLocalSession, signOut, startAnonymousSession } from "@/lib/auth/session";
import { withActor } from "@/lib/db";
import { authMode, env } from "@/lib/env";
import { getMe, homeFor, type Role } from "@/lib/data/me";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";
import { INDUSTRIES, LANGS, PREFECTURE_CODES, RESIDENCE_STATUSES } from "@/config/prefectures";

const YEAR = 60 * 60 * 24 * 365;

// Seeded demo accounts (supabase/seed.sql). Only usable when DEMO_MODE=true.
const DEMO_USERS: Record<Exclude<Role, never>, string> = {
  worker: "40000000-0000-4000-a000-000000000001",
  employer: "50000000-0000-4000-a000-000000000001",
  support_org: "50000000-0000-4000-a000-000000000002",
  municipality: "50000000-0000-4000-a000-000000000003",
  admin: "50000000-0000-4000-a000-000000000004",
};

export async function demoSwitch(formData: FormData) {
  if (!env.demoMode) throw new Error("demo mode is off");
  const role = String(formData.get("role") ?? "");
  const store = await cookies();
  if (role === "new") {
    await signOut();
    store.delete("rw_pref");
    redirect("/onboarding");
  }
  if (!(role in DEMO_USERS)) throw new Error("unknown role");
  const userId = DEMO_USERS[role as Role];
  await setLocalSession(userId);
  const lang = await withActor({ userId }, async (q) => (await q.query<{ language: string }>("select language from profiles where user_id = $1", [userId])).rows[0]?.language);
  if (lang) store.set(LOCALE_COOKIE, lang, { path: "/", maxAge: YEAR });
  redirect(homeFor(role as Role));
}

export async function setLocale(lang: string) {
  if (!(LANGS as string[]).includes(lang)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const me = await getMe();
  if (me) await withActor({ userId: me.userId }, (q) => q.query("update profiles set language = $1 where user_id = $2", [lang, me.userId]));
  revalidatePath("/", "layout");
}

/** Remembers the prefecture picked during onboarding so the theme follows it before sign-up. */
export async function previewPrefecture(code: string) {
  if (!PREFECTURE_CODES.includes(code)) return;
  (await cookies()).set("rw_pref", code, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

const OnboardingSchema = z.object({
  language: z.enum(["vi", "ja", "en"]),
  prefectureCode: z.string().refine((c) => PREFECTURE_CODES.includes(c)),
  municipality: z.string().max(64).nullable(),
  industry: z.enum(INDUSTRIES),
  residenceStatus: z.enum(RESIDENCE_STATUSES),
  yearsInJapan: z.number().min(0).max(60),
  monthsAtEmployer: z.number().int().min(0).max(600).nullable(),
  supportOrgId: z.string().uuid().nullable(),
  consents: z.object({ chatImprove: z.boolean(), surveyAggregate: z.boolean(), shareSwapWithOrg: z.boolean() }),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export async function completeOnboarding(input: OnboardingInput): Promise<{ ok: false; error: string } | void> {
  const data = OnboardingSchema.safeParse(input);
  if (!data.success) return { ok: false, error: "invalid" };
  const d = data.data;
  const { userId } = await startAnonymousSession();
  if (authMode() === "local") {
    await withActor("service", (q) => q.query("insert into auth.users (id, is_anonymous) values ($1, true) on conflict do nothing", [userId]));
  }
  await withActor({ userId }, async (q) => {
    await q.query(
      `insert into profiles (user_id, role, language, prefecture_code, municipality, industry, residence_status, years_in_japan, months_at_employer, support_org_id)
       values ($1, 'worker', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, d.language, d.prefectureCode, d.municipality, d.industry, d.residenceStatus, d.yearsInJapan, d.monthsAtEmployer, d.supportOrgId],
    );
    await q.query(
      `insert into consents (user_id, chat_improve, survey_aggregate, share_swap_with_org) values ($1, $2, $3, $4)`,
      [userId, d.consents.chatImprove, d.consents.surveyAggregate, d.consents.shareSwapWithOrg],
    );
  });
  const store = await cookies();
  store.set(LOCALE_COOKIE, d.language, { path: "/", maxAge: YEAR });
  store.set("rw_pref", d.prefectureCode, { path: "/", maxAge: YEAR });
  redirect("/home");
}

const ProfileSchema = z.object({
  prefectureCode: z.string().refine((c) => PREFECTURE_CODES.includes(c)),
  municipality: z.string().max(64).nullable(),
  industry: z.enum(INDUSTRIES),
  residenceStatus: z.enum(RESIDENCE_STATUSES),
  yearsInJapan: z.number().min(0).max(60),
  monthsAtEmployer: z.number().int().min(0).max(600).nullable(),
  supportOrgId: z.string().uuid().nullable(),
});

export async function updateProfile(input: z.infer<typeof ProfileSchema>) {
  const me = await getMe();
  if (!me || me.profile.role !== "worker") return { ok: false as const };
  const d = ProfileSchema.parse(input);
  await withActor({ userId: me.userId }, (q) =>
    q.query(
      `update profiles set prefecture_code = $2, municipality = $3, industry = $4, residence_status = $5,
         years_in_japan = $6, months_at_employer = $7, support_org_id = $8 where user_id = $1`,
      [me.userId, d.prefectureCode, d.municipality, d.industry, d.residenceStatus, d.yearsInJapan, d.monthsAtEmployer, d.supportOrgId],
    ),
  );
  (await cookies()).set("rw_pref", d.prefectureCode, { path: "/", maxAge: YEAR });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

const ConsentSchema = z.object({ chatImprove: z.boolean(), surveyAggregate: z.boolean(), shareSwapWithOrg: z.boolean() });

export async function updateConsents(input: z.infer<typeof ConsentSchema>) {
  const me = await getMe();
  if (!me) return { ok: false as const };
  const d = ConsentSchema.parse(input);
  await withActor({ userId: me.userId }, (q) =>
    q.query(
      `insert into consents (user_id, chat_improve, survey_aggregate, share_swap_with_org, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (user_id) do update set chat_improve = $2, survey_aggregate = $3, share_swap_with_org = $4, updated_at = now()`,
      [me.userId, d.chatImprove, d.surveyAggregate, d.shareSwapWithOrg],
    ),
  );
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** FR-006: one button, everything linked to the worker is removed in this request. */
export async function deleteMyData(confirm: string) {
  if (confirm.trim().toUpperCase() !== "DELETE") return { ok: false as const };
  const me = await getMe();
  if (!me) return { ok: false as const };
  await withActor({ userId: me.userId }, (q) => q.query("select app.delete_my_data()"));
  await deleteSupabaseAuthUser(me.userId);
  await signOut();
  (await cookies()).delete("rw_pref");
  redirect("/onboarding?deleted=1");
}

export async function signOutAction() {
  await signOut();
  redirect("/onboarding");
}
