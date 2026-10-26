"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChat, IconHome, IconPeople, IconRoute, IconYen } from "@/components/ui/icons";

const ICONS = { home: IconHome, tedori: IconYen, assistant: IconChat, community: IconPeople, swap: IconRoute };

export interface Station {
  key: keyof typeof ICONS;
  href: string;
  label: string;
}

/**
 * Bottom navigation drawn as a railway line map (路線図): every feature is a
 * station with a number, the current one is the filled marker.
 */
export function LineNav({ stations, lineCode, lineName }: { stations: Station[]; lineCode: string; lineName: string }) {
  const path = usePathname();
  return (
    <nav aria-label={lineName} className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-ink bg-card/95 backdrop-blur-[2px]">
      <div className="relative mx-auto max-w-[520px] px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-2">
        <div className="absolute left-[10%] right-[10%] top-[21px] h-[6px] bg-spot-2 border-y-[1.5px] border-ink" aria-hidden="true" />
        <ul className="relative grid grid-cols-5">
          {stations.map((s, i) => {
            const active = path === s.href || path.startsWith(s.href + "/");
            const Icon = ICONS[s.key];
            return (
              <li key={s.key}>
                <Link href={s.href} aria-current={active ? "page" : undefined} className="group flex min-h-14 flex-col items-center gap-1">
                  <span
                    className={`grid size-[34px] place-items-center rounded-full border-[2.5px] border-ink transition-transform group-active:scale-90 ${
                      active ? "bg-ink text-paper" : "bg-card text-ink"
                    }`}
                  >
                    {active ? (
                      <span className="font-mono text-[10px] font-semibold leading-none">
                        {lineCode}
                        <br />
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    ) : (
                      <Icon className="size-[18px]" />
                    )}
                  </span>
                  <span className={`text-[11.5px] leading-none ${active ? "font-bold" : "text-ink-soft"}`}>{s.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
