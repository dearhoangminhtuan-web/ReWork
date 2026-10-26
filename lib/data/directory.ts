import "server-only";
import { many, one, type Queryable } from "@/lib/db";
import type { RankableListing } from "@/lib/swap/rank";
import type { I18nText } from "@/config/prefectures";

export interface Listing extends RankableListing {
  title: string;
  titleI18n: Partial<I18nText>;
  employerName: string;
  employerNameEn: string | null;
  isSample: boolean;
}

type ListingRow = {
  id: string;
  employer_id: string;
  prefecture_code: string;
  municipality: string;
  industry: string;
  wage_type: "hourly" | "monthly";
  wage_amount: number;
  hours_month: number | null;
  dormitory: boolean;
  housing_fee: number | null;
  languages: string[];
  active: boolean;
  title: string;
  title_i18n: Partial<I18nText>;
  employer_name: string;
  employer_name_en: string | null;
  is_sample: boolean;
};

const LISTING_SELECT = `
  select l.id, l.employer_id, e.prefecture_code, l.municipality, l.industry, l.wage_type, l.wage_amount,
         l.hours_month, l.dormitory, l.housing_fee, l.languages, l.active, l.title, l.title_i18n,
         e.name as employer_name, e.name_en as employer_name_en, l.is_sample
  from job_listings l join employers e on e.id = l.employer_id`;

const mapListing = (r: ListingRow): Listing => ({
  id: r.id,
  employerId: r.employer_id,
  prefectureCode: r.prefecture_code,
  municipality: r.municipality,
  industry: r.industry,
  wageType: r.wage_type,
  wageAmount: Number(r.wage_amount),
  hoursMonth: r.hours_month === null ? null : Number(r.hours_month),
  dormitory: r.dormitory,
  housingFee: r.housing_fee === null ? null : Number(r.housing_fee),
  languages: r.languages,
  active: r.active,
  title: r.title,
  titleI18n: r.title_i18n ?? {},
  employerName: r.employer_name,
  employerNameEn: r.employer_name_en,
  isSample: r.is_sample,
});

/** Active listings in one prefecture. Order here is irrelevant: ranking is done in lib/swap/rank.ts. */
export async function listingsInPrefecture(q: Queryable, prefectureCode: string): Promise<Listing[]> {
  const rows = await many<ListingRow>(q, `${LISTING_SELECT} where e.prefecture_code = $1 and l.active order by l.id`, [prefectureCode]);
  return rows.map(mapListing);
}

export async function listingsByIds(q: Queryable, ids: string[]): Promise<Listing[]> {
  if (!ids.length) return [];
  const rows = await many<ListingRow>(q, `${LISTING_SELECT} where l.id = any($1::uuid[])`, [ids]);
  return rows.map(mapListing);
}

export async function listingsForEmployer(q: Queryable, employerId: string): Promise<Listing[]> {
  const rows = await many<ListingRow>(q, `${LISTING_SELECT} where l.employer_id = $1 order by l.created_at, l.id`, [employerId]);
  return rows.map(mapListing);
}

export interface Employer {
  id: string;
  name: string;
  nameEn: string | null;
  prefectureCode: string;
  municipality: string;
  industry: string;
  isSample: boolean;
}

export async function getEmployer(q: Queryable, id: string): Promise<Employer | null> {
  const r = await one<{ id: string; name: string; name_en: string | null; prefecture_code: string; municipality: string; industry: string; is_sample: boolean }>(
    q,
    `select id, name, name_en, prefecture_code, municipality, industry, is_sample from employers where id = $1`,
    [id],
  );
  return r
    ? { id: r.id, name: r.name, nameEn: r.name_en, prefectureCode: r.prefecture_code, municipality: r.municipality, industry: r.industry, isSample: r.is_sample }
    : null;
}

export interface SupportOrg {
  id: string;
  name: string;
  prefectureCode: string;
  contact: { phone?: string; email?: string; hours?: string; languages?: string[] };
  isSample: boolean;
}

export async function getSupportOrg(q: Queryable, id: string | null): Promise<SupportOrg | null> {
  if (!id) return null;
  const r = await one<{ id: string; name: string; prefecture_code: string; contact: SupportOrg["contact"]; is_sample: boolean }>(
    q,
    `select id, name, prefecture_code, contact, is_sample from support_orgs where id = $1`,
    [id],
  );
  return r ? { id: r.id, name: r.name, prefectureCode: r.prefecture_code, contact: r.contact, isSample: r.is_sample } : null;
}

export async function supportOrgsIn(q: Queryable, prefectureCode: string): Promise<SupportOrg[]> {
  const rows = await many<{ id: string; name: string; prefecture_code: string; contact: SupportOrg["contact"]; is_sample: boolean }>(
    q,
    `select id, name, prefecture_code, contact, is_sample from support_orgs where prefecture_code = $1 order by name`,
    [prefectureCode],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, prefectureCode: r.prefecture_code, contact: r.contact, isSample: r.is_sample }));
}

export async function employersIn(q: Queryable, prefectureCode: string): Promise<Employer[]> {
  const rows = await many<{ id: string; name: string; name_en: string | null; prefecture_code: string; municipality: string; industry: string; is_sample: boolean }>(
    q,
    `select id, name, name_en, prefecture_code, municipality, industry, is_sample from employers where prefecture_code = $1 order by name`,
    [prefectureCode],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, nameEn: r.name_en, prefectureCode: r.prefecture_code, municipality: r.municipality, industry: r.industry, isSample: r.is_sample }));
}

export interface Team {
  id: string;
  employerId: string;
  name: string;
}
export async function teamsFor(q: Queryable, employerId: string): Promise<Team[]> {
  const rows = await many<{ id: string; employer_id: string; name: string }>(
    q,
    `select id, employer_id, name from teams where employer_id = $1 order by name`,
    [employerId],
  );
  return rows.map((r) => ({ id: r.id, employerId: r.employer_id, name: r.name }));
}

export interface CommunityGroup {
  id: string;
  municipality: string | null;
  language: string;
  name: I18nText;
  description: I18nText;
  meets: string | null;
  contact: string | null;
  isSample: boolean;
}
export interface CommunityEvent {
  id: string;
  municipality: string | null;
  kind: string;
  title: I18nText;
  description: I18nText;
  startsAt: string;
  place: string;
  isSample: boolean;
}

export async function communityFor(q: Queryable, prefectureCode: string) {
  const groups = await many<{ id: string; municipality: string | null; language: string; name: I18nText; description: I18nText; meets: string | null; contact: string | null; is_sample: boolean }>(
    q,
    `select id, municipality, language, name, description, meets, contact, is_sample from community_groups where prefecture_code = $1 order by language, id`,
    [prefectureCode],
  );
  const events = await many<{ id: string; municipality: string | null; kind: string; title: I18nText; description: I18nText; starts_at: string | Date; place: string; is_sample: boolean }>(
    q,
    `select id, municipality, kind, title, description, starts_at, place, is_sample from community_events
     where prefecture_code = $1 and starts_at > now() - interval '1 day' order by starts_at limit 12`,
    [prefectureCode],
  );
  return {
    groups: groups.map<CommunityGroup>((g) => ({ id: g.id, municipality: g.municipality, language: g.language, name: g.name, description: g.description, meets: g.meets, contact: g.contact, isSample: g.is_sample })),
    events: events.map<CommunityEvent>((e) => ({ id: e.id, municipality: e.municipality, kind: e.kind, title: e.title, description: e.description, startsAt: new Date(e.starts_at).toISOString(), place: e.place, isSample: e.is_sample })),
  };
}

export async function compatriotMunicipalities(q: Queryable, prefectureCode: string, language: string): Promise<string[]> {
  const rows = await many<{ municipality: string }>(
    q,
    `select distinct municipality from community_groups where prefecture_code = $1 and language = $2 and municipality is not null`,
    [prefectureCode, language],
  );
  return rows.map((r) => r.municipality);
}
