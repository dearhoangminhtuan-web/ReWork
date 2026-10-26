// 大阪 artwork: night ink, Dotonbori neon magenta, Osaka Castle verdigris.
import { useId } from "react";

/** Dotonbori at dusk: Osaka Castle above the city, Tsutenkaku, lanterns over the canal. */
export function OsakaPoster({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 360 260" className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={`frame-${id}`}>
          <rect width="360" height="260" />
        </clipPath>
      </defs>
      <g clipPath={`url(#frame-${id})`}>
        {/* moon */}
        <circle cx="70" cy="62" r="34" fill="var(--spot-2)" fillOpacity=".35" />
        <circle cx="73" cy="59" r="34" fill="none" stroke="var(--ink)" strokeOpacity=".45" strokeWidth="1.1" />

        {/* castle park: stone walls + trees */}
        <path d="M84 200 L100 134 L232 134 L248 200Z" fill="var(--ink)" fillOpacity=".7" />
        <path d="M100 134 L232 134" stroke="var(--card)" strokeWidth="1" strokeOpacity=".4" />
        {[96, 112, 216, 232].map((x) => (
          <ellipse key={x} cx={x} cy="132" rx="11" ry="7" fill="var(--spot-2)" fillOpacity=".8" />
        ))}

        {/* 大阪城 on its stone base */}
        <g transform="translate(118 40)">
          <path d="M-8 96 L72 96 L62 78 L2 78Z" fill="var(--ink)" />
          <rect x="6" y="62" width="52" height="16" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M-4 65 L68 65 L58 56 L6 56Z" fill="var(--spot-2)" />
          <rect x="12" y="44" width="40" height="12" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M2 47 L62 47 L54 38 L10 38Z" fill="var(--spot-2)" />
          <rect x="18" y="28" width="28" height="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M8 31 L56 31 L48 21 L16 21Z" fill="var(--spot-2)" />
          <path d="M16 21 l-3 -4 M48 21 l3 -4" stroke="var(--spot-2)" strokeWidth="2" />
          {[14, 22, 30, 38, 46].map((x) => (
            <rect key={x} x={x} y="66" width="3" height="5" fill="var(--ink)" />
          ))}
        </g>

        {/* city blocks */}
        {[
          [0, 150, 30],
          [30, 166, 26],
          [56, 140, 20],
          [214, 158, 24],
          [238, 146, 22],
          [300, 162, 26],
          [326, 138, 34],
        ].map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={200 - y} fill="var(--ink)" fillOpacity=".85" />
        ))}

        {/* 通天閣 */}
        <g transform="translate(268 52)">
          <path d="M-14 148 L-6 70 L6 70 L14 148 L8 148 L0 104 L-8 148Z" fill="var(--ink)" />
          <rect x="-12" y="52" width="24" height="18" fill="var(--ink)" />
          <rect x="-16" y="48" width="32" height="6" fill="var(--spot)" />
          <circle cx="0" cy="61" r="5" fill="var(--card)" />
          <path d="M-6 48 L-4 30 L4 30 L6 48Z" fill="var(--ink)" />
          <path d="M0 30 V14" stroke="var(--ink)" strokeWidth="1.6" />
          <path d="M-10 90 L10 120 M10 90 L-10 120" stroke="var(--card)" strokeWidth=".9" strokeOpacity=".6" />
        </g>

        {/* 道頓堀 canal with neon reflections */}
        <rect x="0" y="200" width="360" height="60" fill="var(--sea)" />
        {[30, 90, 150, 210, 270, 330].map((x, i) => (
          <g key={x}>
            <rect x={x - 10} y={206 + (i % 2) * 6} width="20" height="3" fill={i % 2 ? "var(--spot-2)" : "var(--spot)"} opacity=".85" />
            <rect x={x - 6} y={216 + (i % 2) * 6} width="12" height="2.4" fill={i % 2 ? "var(--spot-2)" : "var(--spot)"} opacity=".55" />
            <rect x={x - 3} y={226 + (i % 2) * 6} width="6" height="2" fill={i % 2 ? "var(--spot-2)" : "var(--spot)"} opacity=".35" />
          </g>
        ))}
        {/* 戎橋 */}
        <path d="M110 204 Q180 176 250 204" fill="none" stroke="var(--card)" strokeWidth="5" />
        <path d="M110 204 Q180 176 250 204" fill="none" stroke="var(--ink)" strokeWidth="1.4" />

        {/* lanterns strung across */}
        <path d="M0 18 Q180 46 360 18" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        {[24, 72, 120, 168, 216, 264, 312].map((x) => {
          const y = 18 + 28 * (1 - Math.pow((x - 180) / 180, 2)) + 2;
          return (
            <g key={x} transform={`translate(${x} ${y})`}>
              <rect x="-6" y="0" width="12" height="2" fill="var(--ink)" />
              <ellipse cx="0" cy="10" rx="7" ry="8.5" fill="var(--spot)" />
              <path d="M-6 8 H6 M-6 12 H6" stroke="var(--ink)" strokeOpacity=".35" strokeWidth=".8" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const frame = (label: string, id: string) => (
  <>
    <defs>
      <path id={`arc-${id}`} d="M24 60 a36 36 0 0 1 72 0" />
    </defs>
    <path d="M60 4 L112 30 L112 90 L60 116 L8 90 L8 30Z" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
    <path d="M60 11 L106 34 L106 86 L60 109 L14 86 L14 34Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <text fontSize="9.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="var(--font-plex)">
      <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
        {label}
      </textPath>
    </text>
  </>
);

export function StampTsutenkaku({ label = "OSAKA · TSUTENKAKU" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M46 96 L54 66 L66 66 L74 96" />
        <path d="M52 96 Q60 80 68 96" />
        <rect x="50" y="50" width="20" height="16" />
        <path d="M46 50 H74" strokeWidth="3.4" />
        <circle cx="60" cy="58" r="4" />
        <path d="M55 50 L57 36 L63 36 L65 50 M60 36 V26" />
      </g>
    </svg>
  );
}

export function StampOsakaCastle({ label = "OSAKA · CASTLE" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="currentColor">
        <path d="M34 94 L86 94 L80 82 L40 82Z" />
        <path d="M32 80 L88 80 L80 72 L40 72Z" />
        <rect x="44" y="64" width="32" height="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M38 66 L82 66 L74 58 L46 58Z" />
        <rect x="49" y="50" width="22" height="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M42 52 L78 52 L70 42 L50 42Z" />
      </g>
    </svg>
  );
}

export function StampTakoyaki({ label = "OSAKA · TAKOYAKI" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <path d="M30 76 Q60 98 90 76 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      {[
        [46, 68],
        [60, 64],
        [74, 68],
        [53, 56],
        [67, 56],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d={`M${x - 4} ${y - 2} q4 3 8 0`} stroke="currentColor" strokeWidth="1.4" fill="none" />
        </g>
      ))}
      <path d="M86 40 L70 60" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function StampEbisubashi({ label = "DOTONBORI" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M26 72 Q60 48 94 72" strokeWidth="3" />
        <path d="M30 66 Q60 44 90 66" strokeWidth="1.6" />
        {[38, 50, 62, 74, 84].map((x) => (
          <path key={x} d={`M${x} 60 v-14`} strokeWidth="1.6" />
        ))}
        <path d="M26 84 h14 M48 84 h22 M78 84 h16 M34 92 h10 M54 92 h12 M74 92 h12" strokeWidth="2" />
      </g>
    </svg>
  );
}
