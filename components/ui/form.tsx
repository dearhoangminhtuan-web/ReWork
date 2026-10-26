"use client";
// Form controls styled like a paper form (記入欄): ink underline fields, square
// choice tiles, a physical-looking switch.
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./print";

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[13px] font-semibold">{children}</span>
      {hint ? <span className="block text-[12px] text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...p }: ComponentProps<"input">) {
  return (
    <input
      {...p}
      className={cx(
        "w-full min-h-11 bg-card border-[1.5px] border-ink px-3 text-[16px] placeholder:text-ink-soft/70 focus:outline-none focus:shadow-[var(--shadow-print-sm)]",
        className,
      )}
    />
  );
}

/** ¥ amount input. Keeps numbers as numbers; empty → null. */
export function YenInput({
  value,
  onChange,
  id,
  placeholder,
  suffix,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  id?: string;
  placeholder?: string;
  suffix?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex min-h-11 items-stretch border-[1.5px] border-ink bg-card focus-within:shadow-[var(--shadow-print-sm)]">
      <span className="grid place-items-center border-r-[1.5px] border-ink bg-paper-2 px-2.5 font-mono text-[15px]" aria-hidden="true">
        ¥
      </span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        className="w-full min-w-0 bg-transparent px-3 font-mono text-[16px] tabular focus:outline-none"
        placeholder={placeholder}
        value={value === null || Number.isNaN(value) ? "" : value.toLocaleString("en-US")}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
      />
      {suffix ? <span className="grid place-items-center px-2.5 text-[12px] text-ink-soft whitespace-nowrap">{suffix}</span> : null}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  id,
  placeholder,
  suffix,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  id?: string;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-h-11 items-stretch border-[1.5px] border-ink bg-card focus-within:shadow-[var(--shadow-print-sm)]">
      <input
        id={id}
        inputMode="numeric"
        className="w-full min-w-0 bg-transparent px-3 font-mono text-[16px] tabular focus:outline-none"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
      />
      {suffix ? <span className="grid place-items-center px-2.5 text-[12px] text-ink-soft whitespace-nowrap">{suffix}</span> : null}
    </div>
  );
}

export function Select({ className, children, ...p }: ComponentProps<"select">) {
  return (
    <select
      {...p}
      className={cx(
        "w-full min-h-11 appearance-none bg-card border-[1.5px] border-ink px-3 pr-9 text-[16px] bg-[length:12px] bg-no-repeat bg-[right_12px_center]",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23000' stroke-width='1.8'/%3E%3C/svg%3E\")]",
        className,
      )}
    >
      {children}
    </select>
  );
}

/** Big tappable choice tile (radio semantics). */
export function Choice({
  selected,
  onSelect,
  children,
  sub,
  lang,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  sub?: ReactNode;
  lang?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      lang={lang}
      className={cx(
        "flex w-full min-h-12 items-center gap-3 border-[1.5px] border-ink px-3.5 py-2.5 text-left transition-[transform,box-shadow] duration-75",
        selected ? "bg-ink text-paper shadow-[var(--shadow-print-spot)] -translate-x-[1px] -translate-y-[1px]" : "bg-card hover:bg-paper-2",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-spot-2" : "border-ink")}
      >
        {selected ? <span className="size-2.5 rounded-full bg-spot-2" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold leading-tight">{children}</span>
        {sub ? <span className={cx("block text-[12.5px] leading-snug", selected ? "text-paper/75" : "text-ink-soft")}>{sub}</span> : null}
      </span>
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  help,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  help?: ReactNode;
  id: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-7 w-12 shrink-0 border-[1.5px] border-ink transition-colors",
          checked ? "bg-spot" : "bg-paper-2",
        )}
      >
        <span
          className={cx(
            "absolute top-[2px] size-[20px] border-[1.5px] border-ink bg-card transition-[left] duration-150",
            checked ? "left-[22px]" : "left-[2px]",
          )}
        />
      </button>
      <div className="min-w-0">
        <div id={`${id}-l`} className="text-[15px] font-semibold leading-snug">
          {label}
        </div>
        {help ? <div className="text-[12.5px] leading-snug text-ink-soft">{help}</div> : null}
      </div>
    </div>
  );
}
