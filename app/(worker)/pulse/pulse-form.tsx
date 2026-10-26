"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitPulse } from "@/app/actions/pulse";
import { Button, Notice, Panel, cx } from "@/components/ui/print";
import { Label } from "@/components/ui/form";
import { IconCheck, IconShield } from "@/components/ui/icons";

const Q = ["q1", "q2", "q3", "q4", "q5"] as const;

export function PulseForm({ surveyId, period, consentOn }: { surveyId: string; period: string; consentOn: boolean }) {
  const t = useTranslations("pulse");
  const [vals, setVals] = useState<(number | null)[]>([null, null, null, null, null]);
  const [free, setFree] = useState("");
  const [allow, setAllow] = useState(consentOn);
  const [state, setState] = useState<null | "ok" | "consent" | "duplicate" | "error">(null);
  const [pending, start] = useTransition();
  const complete = vals.every((v) => v !== null);

  if (state === "ok" || state === "duplicate")
    return (
      <Panel print className="flex items-center gap-4 p-5">
        <span className="stamp-in grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-spot text-spot">
          <IconCheck className="size-8" />
        </span>
        <p className="text-[16px]">{state === "ok" ? t("done") : t("already")}</p>
      </Panel>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 border-[1.5px] border-ink bg-paper-2 p-3 text-[13.5px] leading-snug">
        <IconShield className="size-6 shrink-0 text-spot" />
        <p>{t("privacy")}</p>
      </div>
      <Panel className="flex flex-col gap-5 p-4">
        <div className="font-mono text-[12px] text-ink-soft">{period}</div>
        {Q.map((q, i) => (
          <fieldset key={q}>
            <legend className="text-[15.5px] font-semibold leading-snug">
              {i + 1}. {t(q)}
            </legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={vals[i] === n}
                  aria-label={`${n}`}
                  onClick={() => setVals((v) => v.map((x, j) => (j === i ? n : x)))}
                  className={cx(
                    "grid min-h-12 place-items-center rounded-full border-[1.5px] border-ink font-mono text-[17px] font-semibold",
                    vals[i] === n ? "bg-spot text-on-spot shadow-[var(--shadow-print-sm)]" : "bg-card",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11.5px] text-ink-soft">
              <span>{t("low")}</span>
              <span>{t("high")}</span>
            </div>
          </fieldset>
        ))}
        <div>
          <Label htmlFor="p-free" hint={t("freeHint")}>
            {t("free")}
          </Label>
          <textarea
            id="p-free"
            rows={3}
            maxLength={500}
            value={free}
            onChange={(e) => setFree(e.target.value)}
            className="mt-1.5 w-full border-[1.5px] border-ink bg-card p-3 text-[16px] focus:outline-none focus:shadow-[var(--shadow-print-sm)]"
          />
        </div>
        {!consentOn ? (
          <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug">
            <input type="checkbox" checked={allow} onChange={(e) => setAllow(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--spot)]" />
            <span>{t("consentNeeded")}</span>
          </label>
        ) : null}
        <Button
          disabled={!complete || !allow || pending}
          onClick={() =>
            start(async () => {
              const r = await submitPulse({ surveyId, q: vals as [number, number, number, number, number], freeText: free.trim() || null, allowAggregate: allow });
              setState(r.ok ? "ok" : (r.error ?? "error"));
            })
          }
        >
          {t("submit")}
        </Button>
        {state === "consent" || state === "error" ? <Notice tone="alert">{t("error")}</Notice> : null}
      </Panel>
    </div>
  );
}
