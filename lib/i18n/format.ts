import type { Lang } from "@/config/prefectures";

const intlLocale: Record<Lang, string> = { vi: "vi-VN", ja: "ja-JP", en: "en-US" };

/** Always JPY with "¥" and thousands separators (PRD §7.5). */
export function formatYen(n: number, lang: Lang = "en"): string {
  const s = new Intl.NumberFormat(intlLocale[lang], { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));
  return `${n < 0 ? "−" : ""}¥${s}`;
}

export function formatNumber(n: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(intlLocale[lang]).format(n);
}

export function formatDate(iso: string | Date, lang: Lang): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(intlLocale[lang], { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Tokyo" }).format(d);
}

export function pick<T extends Record<Lang, string>>(t: T | null | undefined, lang: Lang): string {
  if (!t) return "";
  return t[lang] ?? t.en ?? t.ja ?? "";
}
