import type { Lang } from "@/config/prefectures";

export const LOCALE_COOKIE = "rw_locale";
export const LOCALES: Lang[] = ["vi", "ja", "en"];
export const DEFAULT_LOCALE: Lang = "vi";

export function resolveLocale(v: string | undefined | null): Lang {
  return (LOCALES as string[]).includes(v ?? "") ? (v as Lang) : DEFAULT_LOCALE;
}
