// APPROXIMATION — verify before real use. Source: MHLW 地域別最低賃金 (FY2025)
// FY2026 revisions take effect from around Oct 2026: update from the MHLW table
// (https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/)
// before any real pilot.
export const MIN_WAGE_HOURLY = {
  fiscalYear: 2025,
  sourceUrl: "https://www.sakigake.jp/news/article/20250905CO0200/",
  // Osaka (eff. 2025-10-16) and Hokkaido (eff. 2025-10-04) from the regional labour bureaus:
  extraSources: [
    "https://jsite.mhlw.go.jp/osaka-hellowork/list/sakai/06saiteichingin_sakai.html",
    "https://jsite.mhlw.go.jp/hokkaido-roudoukyoku/minimum_wage.html",
  ],
  officialInfoUrl:
    "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/",
  values: { "13_tokyo": 1226, "39_kochi": 1023, "27_osaka": 1177, "01_hokkaido": 1075 } as Record<string, number>, // add other prefectures from MHLW table
};

export function minWageFor(prefectureCode: string | null | undefined): number | null {
  if (!prefectureCode) return null;
  return MIN_WAGE_HOURLY.values[prefectureCode] ?? null;
}
