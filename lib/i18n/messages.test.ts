// Every UI string exists in all three languages (PRD rule 6).
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import ja from "@/messages/ja.json";

function keys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
}
function get(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], o);
}

describe("messages", () => {
  const enKeys = keys(en).sort();
  for (const [name, other] of [["vi", vi], ["ja", ja]] as const) {
    it(`${name} has exactly the same keys as en`, () => {
      expect(keys(other).sort()).toEqual(enKeys);
    });
    it(`${name} uses the same {placeholders} as en`, () => {
      for (const k of enKeys) {
        const a = get(en, k);
        const b = get(other, k);
        if (typeof a === "string" && typeof b === "string") expect([k, placeholders(b)]).toEqual([k, placeholders(a)]);
      }
    });
  }
  it("no empty strings", () => {
    for (const m of [en, vi, ja]) for (const k of keys(m)) expect([k, get(m, k)]).not.toEqual([k, ""]);
  });
});
