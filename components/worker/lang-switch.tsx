"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/session";
import type { Lang } from "@/config/prefectures";

const SHORT: Record<Lang, string> = { vi: "VI", ja: "日", en: "EN" };

export function LangSwitch({ current }: { current: Lang }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex border-[1.5px] border-ink font-mono text-[12px]" role="group" aria-label="Language">
      {(["vi", "ja", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === current}
          onClick={() => start(async () => { await setLocale(l); router.refresh(); })}
          className={`min-h-9 min-w-9 px-1.5 ${l === current ? "bg-ink text-paper" : "bg-card"}`}
          lang={l}
        >
          {SHORT[l]}
        </button>
      ))}
    </div>
  );
}
