// General information, not legal advice. Verify against official 運用要領 before pilot.
export const IKUSEI_TRANSFER = {
  effectiveFrom: "2027-04-01",
  minPeriodYears: {
    oneYear: [
      "building_cleaning",
      "linen_supply",
      "accommodation",
      "railway",
      "logistics_warehouse",
      "agriculture",
      "fishery",
      "forestry",
      "wood_industry",
    ],
    twoYears: [
      "nursing_care",
      "construction",
      "industrial_products",
      "shipbuilding",
      "auto_maintenance",
      "food_manufacturing",
      "food_service",
      "resource_recycling",
    ],
  },
  conditions: [
    "min_period_at_current_employer",
    "skill_test_basic_and_japanese_A1", // e.g. JLPT N5
    "destination_is_qualified_employer",
    "no_private_placement_agency",
    "destination_transferee_cap_one_third",
  ] as const,
  sourceUrl:
    "https://office-tree.jp/blog/immigration/registered-support/registered-support-20260608-6/",
};

export type TransferCondition = (typeof IKUSEI_TRANSFER.conditions)[number];

/** Minimum years at current employer for a field, or null if the field is not listed. */
export function minPeriodYearsFor(field: string): 1 | 2 | null {
  if (IKUSEI_TRANSFER.minPeriodYears.oneYear.includes(field)) return 1;
  if (IKUSEI_TRANSFER.minPeriodYears.twoYears.includes(field)) return 2;
  return null;
}
