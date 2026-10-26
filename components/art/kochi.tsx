// 高知 artwork. Hand-built two-ink SVG: Kuroshio indigo + Yosakoi vermilion + yuzu.
// Colours come from CSS variables so art always matches the active theme.
import { useId } from "react";

/** Katsurahama at morning: Ryuo-misaki pines + shrine torii, Kochi Castle on its hill, a leaping katsuo. */
export function KochiPoster({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 360 260" className={className} role="img" aria-hidden="true">
      <defs>
        <pattern id={`sg-${id}`} width="28" height="14" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--card)" strokeOpacity=".35" strokeWidth="1.1">
            <path d="M0 14a14 14 0 0 1 28 0M5 14a9 9 0 0 1 18 0M10 14a4 4 0 0 1 8 0" />
            <path d="M-14 7a14 14 0 0 1 28 0M-9 7a9 9 0 0 1 18 0M14 7a14 14 0 0 1 28 0M19 7a9 9 0 0 1 18 0" />
          </g>
        </pattern>
        <clipPath id={`frame-${id}`}>
          <rect width="360" height="260" />
        </clipPath>
      </defs>
      <g clipPath={`url(#frame-${id})`}>
        {/* sun (yuzu) with a misregistered ink ring */}
        <circle cx="262" cy="84" r="46" fill="var(--spot-2)" />
        <circle cx="265" cy="81" r="46" fill="none" stroke="var(--ink)" strokeWidth="1.2" strokeOpacity=".5" />

        {/* Shikoku mountains */}
        <path
          d="M0 150 L36 130 L70 141 L112 113 L156 137 L204 117 L246 139 L298 121 L360 142 L360 178 L0 178Z"
          fill="var(--sea)"
          fillOpacity=".28"
        />
        {/* castle hill */}
        <path d="M70 178 Q138 126 214 178Z" fill="var(--sea)" fillOpacity=".55" />
        {/* 高知城 — stone base + three roof tiers */}
        <g>
          <path d="M118 151 L156 151 L151 140 L123 140Z" fill="var(--ink)" />
          <rect x="126" y="130" width="22" height="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="1" />
          <path d="M118 133 L156 133 L149 127 L125 127Z" fill="var(--ink)" />
          <rect x="129" y="120" width="16" height="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="1" />
          <path d="M122 122 L152 122 L146 116 L128 116Z" fill="var(--ink)" />
          <rect x="132" y="110" width="10" height="6" fill="var(--card)" stroke="var(--ink)" strokeWidth="1" />
          <path d="M125 112 L149 112 L142 104 L132 104Z" fill="var(--ink)" />
          <path d="M131 104 l-2 -3 M143 104 l2 -3" stroke="var(--ink)" strokeWidth="1.4" />
        </g>

        {/* the Pacific */}
        <rect x="0" y="176" width="360" height="90" fill="var(--sea)" />
        <rect x="0" y="176" width="360" height="90" fill={`url(#sg-${id})`} />
        <path
          d="M0 178 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"
          fill="none"
          stroke="var(--card)"
          strokeWidth="2"
        />

        {/* katsuo leaping */}
        <g transform="translate(236 206) rotate(-24)">
          <path d="M-34 0 C-20 -13 12 -13 26 -2 L40 -12 L36 0 L40 12 L26 2 C12 13 -20 13 -34 0Z" fill="var(--spot)" />
          <path d="M-14 -5 L14 -5 M-10 0 L16 0 M-14 5 L14 5" stroke="var(--card)" strokeWidth="1.3" strokeOpacity=".7" />
          <circle cx="-24" cy="-2" r="2" fill="var(--card)" />
        </g>
        <path d="M200 228 q6 -8 12 0 M266 226 q5 -7 10 0 M214 236 q4 -5 8 0" fill="none" stroke="var(--card)" strokeWidth="1.6" />

        {/* 龍王岬 cliff with pines and the little shrine torii */}
        <path d="M0 168 Q22 148 50 156 Q74 163 88 192 L98 262 L0 262Z" fill="var(--ink)" />
        <path d="M30 160 Q22 140 36 122" fill="none" stroke="var(--ink)" strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="38" cy="120" rx="19" ry="6" fill="var(--ink)" />
        <ellipse cx="22" cy="131" rx="12" ry="5" fill="var(--ink)" />
        <ellipse cx="51" cy="133" rx="12" ry="4.5" fill="var(--ink)" />
        <path d="M60 162 Q58 148 70 138" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
        <ellipse cx="71" cy="137" rx="13" ry="4.5" fill="var(--ink)" />
        <ellipse cx="62" cy="146" rx="9" ry="3.6" fill="var(--ink)" />
        <g transform="translate(72 163)">
          <rect x="-7" y="-9" width="14" height="2" fill="var(--spot)" />
          <rect x="-6" y="-6" width="12" height="1.5" fill="var(--spot)" />
          <rect x="-5" y="-7" width="1.8" height="9" fill="var(--spot)" />
          <rect x="3.2" y="-7" width="1.8" height="9" fill="var(--spot)" />
        </g>
      </g>
    </svg>
  );
}

const stampFrame = (label: string, id: string) => (
  <>
    <defs>
      <path id={`arc-${id}`} d="M24 60 a36 36 0 0 1 72 0" />
    </defs>
    <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3.4" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <text fontSize="9.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="var(--font-plex)">
      <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
        {label}
      </textPath>
    </text>
  </>
);

export function StampHarimaya({ label = "KOCHI · HARIMAYA" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M28 74 Q60 50 92 74" />
        <path d="M30 66 Q60 42 90 66" />
        {[36, 46, 56, 66, 76, 86].map((x, i) => (
          <path key={x} d={`M${x} ${[67, 60, 56.5, 56.5, 60, 67][i]} v8`} />
        ))}
        <path d="M30 86 q8 -4 16 0 t16 0 t16 0 t14 0" strokeWidth="1.6" />
        <path d="M38 94 q7 -3 14 0 t14 0 t14 0" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function StampCastle({ label = "KOCHI · CASTLE" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g fill="currentColor">
        <path d="M34 92 L86 92 L80 78 L40 78Z" />
        <path d="M30 76 L90 76 L82 68 L38 68Z" />
        <rect x="44" y="60" width="32" height="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M36 62 L84 62 L76 54 L44 54Z" />
        <rect x="49" y="47" width="22" height="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M42 49 L78 49 L69 39 L51 39Z" />
        <path d="M51 39 l-3 -4 M69 39 l3 -4" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function StampNaruko({ label = "KOCHI · YOSAKOI" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  const naruko = (
    <g>
      <rect x="-9" y="-22" width="18" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <rect x="-6" y="-17" width="12" height="4" fill="currentColor" />
      <rect x="-6" y="-9" width="12" height="4" fill="currentColor" />
      <rect x="-6" y="-1" width="12" height="4" fill="currentColor" />
      <path d="M0 8 v18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g transform="translate(48 64) rotate(-22)">{naruko}</g>
      <g transform="translate(72 64) rotate(22)">{naruko}</g>
      <path d="M40 40 l-4 -5 M60 34 v-6 M80 40 l4 -5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StampChinkabashi({ label = "SHIMANTO · RIVER" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M22 66 L42 46 L56 58 L72 40 L98 66" strokeWidth="2.2" />
        <path d="M24 72 H96" strokeWidth="3.4" />
        {[34, 50, 66, 82].map((x) => (
          <path key={x} d={`M${x} 72 v7`} strokeWidth="2.4" />
        ))}
        <path d="M24 84 q9 -4 18 0 t18 0 t18 0 t18 0" strokeWidth="1.6" />
        <path d="M32 92 q7 -3 14 0 t14 0 t14 0 t14 0" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
