// Print-style primitives. Server-safe (no hooks).
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type Variant = "spot" | "ink" | "paper" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  spot: "bg-spot text-on-spot border-ink press",
  ink: "bg-ink text-paper border-ink press",
  paper: "bg-card text-ink border-ink press",
  ghost: "bg-transparent text-ink border-transparent underline decoration-1 underline-offset-4 hover:decoration-2",
  danger: "bg-alert text-white border-ink press",
};
const base =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 border-[1.5px] font-semibold text-[15px] leading-tight select-none disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "spot", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button {...p} className={cx(base, variants[variant], className)} />;
}

export function ButtonLink({ variant = "spot", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...p} className={cx(base, variants[variant], className)} />;
}

/** Card with a hard ink border; `print` adds the offset print shadow. */
export function Panel({ className, print, ...p }: ComponentProps<"div"> & { print?: boolean }) {
  return <div {...p} className={cx("bg-card border-[1.5px] border-ink", print && "shadow-[var(--shadow-print)]", className)} />;
}

/** Mono station-code kicker, e.g. "TS02 — 手取り". */
export function Kicker({ code, children, className }: { code?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft flex items-center gap-2", className)}>
      {code ? <span className="bg-ink text-paper px-1.5 py-0.5 tracking-[0.1em]">{code}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export function SampleTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] border border-dashed border-ink-soft text-ink-soft px-1.5 py-[1px] align-middle",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Red seal with vertical kanji — the prefecture's mark. */
export function Hanko({ text, size = 44, className }: { text: string; size?: number; className?: string }) {
  return (
    <span
      className={cx("inline-grid place-items-center bg-spot text-on-spot font-ja font-bold leading-none", className)}
      style={{ width: size, height: size, fontSize: size * (text.length > 2 ? 0.25 : 0.34), borderRadius: 5, boxShadow: "inset 0 0 0 2px var(--spot), inset 0 0 0 3.5px var(--on-spot)" }}
      aria-hidden="true"
    >
      <span className="vertical" style={{ letterSpacing: 0 }}>{text}</span>
    </span>
  );
}

/** Round ink stamp used for verdicts ("もっと残る"). */
export function VerdictStamp({ top, main, className }: { top: string; main: string; className?: string }) {
  return (
    <div
      className={cx(
        "stamp-in inline-flex flex-col items-center justify-center rounded-full border-[3px] border-spot text-spot size-24 text-center leading-tight",
        className,
      )}
      style={{ ["--r" as string]: "-10deg", transform: "rotate(-10deg)" }}
    >
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{top}</span>
      <span className="font-display text-[13px] leading-[1.1] px-1.5">{main}</span>
    </div>
  );
}

export function SectionTitle({ children, vertical, className }: { children: ReactNode; vertical?: string; className?: string }) {
  return (
    <div className={cx("flex items-end gap-3", className)}>
      {vertical ? (
        <span className="vertical font-ja text-[13px] font-bold text-spot border-l-[3px] border-spot pl-1 leading-none">{vertical}</span>
      ) : null}
      <h2 className="font-display text-[22px] leading-tight">{children}</h2>
    </div>
  );
}

export function Leader({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cx("flex items-baseline text-[14px]", strong && "font-semibold text-[15px]", muted && "text-ink-soft")}>
      <span>{label}</span>
      <span className="leader" />
      <span className="font-mono tabular whitespace-nowrap">{value}</span>
    </div>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warn" | "alert"; children: ReactNode; className?: string }) {
  const tones = {
    info: "border-ink bg-paper-2",
    warn: "border-ink bg-[color-mix(in_srgb,var(--spot-2)_30%,var(--card))]",
    alert: "border-alert bg-[color-mix(in_srgb,var(--alert)_10%,var(--card))]",
  };
  return <div className={cx("border-[1.5px] border-l-[6px] px-3 py-2.5 text-[14px] leading-snug", tones[tone], className)}>{children}</div>;
}
