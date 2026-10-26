"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateSwapStatus } from "@/app/actions/org";
import { cx } from "@/components/ui/print";

export function StatusButtons({ id, status }: { id: string; status: "new" | "contacted" | "closed" }) {
  const t = useTranslations("org");
  const [pending, start] = useTransition();
  return (
    <div className="flex border-[1.5px] border-ink text-[12.5px]" role="group" aria-label={t("status")}>
      {(["new", "contacted", "closed"] as const).map((s) => (
        <button
          key={s}
          disabled={pending}
          aria-pressed={status === s}
          onClick={() => start(() => updateSwapStatus(id, s))}
          className={cx("min-h-9 px-2.5", status === s ? "bg-ink font-semibold text-paper" : "bg-card hover:bg-paper-2")}
        >
          {t(`st.${s}`)}
        </button>
      ))}
    </div>
  );
}
