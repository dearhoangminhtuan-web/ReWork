import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { one, withActor } from "@/lib/db";
import type { Lang } from "@/config/prefectures";

export type Role = "worker" | "employer" | "support_org" | "municipality" | "admin";

export interface Profile {
  userId: string;
  role: Role;
  language: Lang;
  prefectureCode: string;
  municipality: string | null;
  industry: string | null;
  residenceStatus: string | null;
  yearsInJapan: number;
  monthsAtEmployer: number | null;
  supportOrgId: string | null;
  employerId: string | null;
  teamId: string | null;
  displayName: string | null;
  isSample: boolean;
}

export interface Consents {
  chatImprove: boolean;
  surveyAggregate: boolean;
  shareSwapWithOrg: boolean;
}

export interface Me {
  userId: string;
  profile: Profile;
  consents: Consents;
}

type ProfileRow = {
  user_id: string;
  role: Role;
  language: Lang;
  prefecture_code: string;
  municipality: string | null;
  industry: string | null;
  residence_status: string | null;
  years_in_japan: string | number;
  months_at_employer: number | null;
  support_org_id: string | null;
  employer_id: string | null;
  team_id: string | null;
  display_name: string | null;
  is_sample: boolean;
  chat_improve: boolean | null;
  survey_aggregate: boolean | null;
  share_swap_with_org: boolean | null;
};

export function mapProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    role: r.role,
    language: r.language,
    prefectureCode: r.prefecture_code,
    municipality: r.municipality,
    industry: r.industry,
    residenceStatus: r.residence_status,
    yearsInJapan: Number(r.years_in_japan),
    monthsAtEmployer: r.months_at_employer,
    supportOrgId: r.support_org_id,
    employerId: r.employer_id,
    teamId: r.team_id,
    displayName: r.display_name,
    isSample: r.is_sample,
  };
}

/** Current user + profile, read under RLS. Null if signed out or profile missing. */
export const getMe = cache(async (): Promise<Me | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const row = await withActor({ userId }, (q) =>
    one<ProfileRow>(
      q,
      `select p.*, c.chat_improve, c.survey_aggregate, c.share_swap_with_org
       from profiles p left join consents c on c.user_id = p.user_id
       where p.user_id = $1`,
      [userId],
    ),
  );
  if (!row) return null;
  return {
    userId,
    profile: mapProfile(row),
    consents: {
      chatImprove: !!row.chat_improve,
      surveyAggregate: !!row.survey_aggregate,
      shareSwapWithOrg: !!row.share_swap_with_org,
    },
  };
});

export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/onboarding");
  return me;
}

export async function requireWorker(): Promise<Me> {
  const me = await requireMe();
  if (me.profile.role !== "worker") redirect(homeFor(me.profile.role));
  return me;
}

export async function requireRole(...roles: Role[]): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!roles.includes(me.profile.role)) redirect(homeFor(me.profile.role));
  return me;
}

export function homeFor(role: Role): string {
  switch (role) {
    case "worker":
      return "/home";
    case "employer":
      return "/employer";
    case "support_org":
      return "/org";
    case "municipality":
      return "/municipality";
    case "admin":
      return "/admin";
  }
}
