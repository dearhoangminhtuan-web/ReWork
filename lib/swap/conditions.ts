// FR-042: informational transfer-conditions checklist, from config/ikusei-rules.ts.
// "General information, not a legal decision." Never says "you can transfer".
import { IKUSEI_TRANSFER, minPeriodYearsFor, type TransferCondition } from "@/config/ikusei-rules";

export type CondStatus = "ok" | "not_yet" | "check";

export interface CondItem {
  key: TransferCondition;
  status: CondStatus;
  years?: number;
  monthsHave?: number;
  monthsLeft?: number;
}

export function evaluateTransfer(p: { industry: string | null; monthsAtEmployer: number | null }): {
  items: CondItem[];
  effectiveFrom: string;
} {
  const items: CondItem[] = IKUSEI_TRANSFER.conditions.map((key) => {
    switch (key) {
      case "min_period_at_current_employer": {
        const years = p.industry ? minPeriodYearsFor(p.industry) : null;
        if (years === null || p.monthsAtEmployer === null) return { key, status: "check" };
        const need = years * 12;
        return p.monthsAtEmployer >= need
          ? { key, status: "ok", years, monthsHave: p.monthsAtEmployer }
          : { key, status: "not_yet", years, monthsHave: p.monthsAtEmployer, monthsLeft: need - p.monthsAtEmployer };
      }
      case "no_private_placement_agency":
        // ReWork routes interest to the worker's support org only.
        return { key, status: "ok" };
      default:
        return { key, status: "check" };
    }
  });
  return { items, effectiveFrom: IKUSEI_TRANSFER.effectiveFrom };
}
