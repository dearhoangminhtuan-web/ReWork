// 北海道 artwork: winter-night ink, red-brick red, Furano lavender, snow paper.
import { useId } from "react";

/** Sapporo Clock Tower in snow, Mt. Yotei, Furano lavender rows, a red-crowned crane. */
export function HokkaidoPoster({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const flakes: [number, number, number][] = [
    [30, 30, 2.2],
    [80, 60, 1.6],
    [140, 24, 2],
    [200, 50, 1.4],
    [250, 20, 2.4],
    [300, 70, 1.8],
    [330, 34, 1.4],
    [110, 96, 1.4],
    [20, 110, 1.8],
    [310, 120, 2],
  ];
  return (
    <svg viewBox="0 0 360 260" className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={`frame-${id}`}>
          <rect width="360" height="260" />
        </clipPath>
      </defs>
      <g clipPath={`url(#frame-${id})`}>
        {/* 羊蹄山 */}
        <path d="M150 160 L232 78 Q240 70 248 78 L330 160Z" fill="var(--sea)" fillOpacity=".5" />
        <path d="M220 90 L232 78 Q240 70 248 78 L260 90 L252 86 L246 93 L240 86 L234 93 L228 86Z" fill="var(--card)" />
        <path d="M0 150 L60 120 L120 144 L160 160 L0 160Z" fill="var(--sea)" fillOpacity=".3" />

        {/* lavender rows (Furano) */}
        <path d="M0 160 H360 V260 H0Z" fill="var(--card)" />
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M${-40 + i * 50} 260 Q${100 + i * 12} 196 ${180 + i * 4} 162`}
            fill="none"
            stroke="var(--spot-2)"
            strokeWidth={10 - i * 0.6}
            strokeLinecap="round"
          />
        ))}

        {/* 時計台 */}
        <g transform="translate(64 96)">
          <rect x="0" y="40" width="64" height="40" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
          <path d="M-6 42 L32 20 L70 42Z" fill="var(--spot)" />
          <rect x="22" y="2" width="20" height="26" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
          <circle cx="32" cy="14" r="6.5" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.4" />
          <path d="M32 14 V9.5 M32 14 L35 15.5" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M20 4 L32 -8 L44 4Z" fill="var(--spot)" />
          <path d="M32 -8 V-16" stroke="var(--ink)" strokeWidth="1.2" />
          {[8, 20, 38, 50].map((x) => (
            <rect key={x} x={x} y="50" width="6" height="12" fill="var(--sea)" />
          ))}
          <rect x="27" y="62" width="10" height="18" fill="var(--ink)" />
          {/* snow on the roof */}
          <path d="M-6 42 L32 20 L70 42 L64 40 L32 23 L0 40Z" fill="var(--card)" opacity=".85" />
        </g>

        {/* 丹頂 crane */}
        <g transform="translate(250 112) rotate(-8)">
          <path d="M0 0 C 18 -14 40 -16 60 -10 C 40 -4 22 2 0 0Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M8 -2 C -10 -26 -30 -30 -46 -24 C -30 -16 -12 -8 8 -2Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M-46 -24 L-58 -20" stroke="var(--ink)" strokeWidth="1.2" />
          <path d="M-36 -22 L-46 -24" stroke="var(--ink)" strokeWidth="3" />
          <path d="M58 -10 l14 2" stroke="var(--ink)" strokeWidth="1.4" />
          <circle cx="56" cy="-11" r="2" fill="var(--spot)" />
          <path d="M20 -4 l26 -4" stroke="var(--ink)" strokeWidth="3" />
        </g>

        {/* snow */}
        {flakes.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--sea)" fillOpacity=".55" />
        ))}
      </g>
    </svg>
  );
}

const frame = (label: string, id: string) => (
  <>
    <defs>
      <path id={`arc-${id}`} d="M24 60 a36 36 0 0 1 72 0" />
    </defs>
    {/* 雪輪 snow-ring frame */}
    <path
      d="M60 4 Q70 12 80 8 Q86 18 96 20 Q98 30 108 36 Q104 46 112 56 Q104 66 108 76 Q98 82 96 92 Q86 94 80 104 Q70 100 60 108 Q50 100 40 104 Q34 94 24 92 Q22 82 12 76 Q16 66 8 56 Q16 46 12 36 Q22 30 24 20 Q34 18 40 8 Q50 12 60 4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <circle cx="60" cy="58" r="46" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <text fontSize="9.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="var(--font-plex)">
      <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
        {label}
      </textPath>
    </text>
  </>
);

export function StampClockTower({ label = "SAPPORO · CLOCK" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <rect x="36" y="66" width="48" height="26" />
        <path d="M30 68 L60 52 L90 68" />
        <rect x="52" y="36" width="16" height="22" />
        <circle cx="60" cy="45" r="5" />
        <path d="M50 38 L60 28 L70 38" />
        <rect x="56" y="80" width="8" height="12" fill="currentColor" />
      </g>
    </svg>
  );
}

export function StampOtaruCanal({ label = "OTARU · CANAL" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2">
        <path d="M44 92 V44" strokeWidth="2.8" />
        <path d="M36 44 h16 l-3 -10 h-10z" />
        <path d="M40 34 l4 -4 l4 4" />
        <path d="M60 70 h30 M60 70 v-14 h30 v14" />
        <path d="M62 56 l13 -8 l13 8" />
        <path d="M30 98 q8 -4 16 0 t16 0 t16 0 t14 0" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function StampLavender({ label = "FURANO · LAVENDER" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {[44, 54, 64, 74].map((x, i) => (
          <g key={x} transform={`rotate(${(i - 1.5) * 10} 60 96)`}>
            <path d={`M${x} 96 V48`} strokeWidth="1.6" />
            {[50, 56, 62, 68].map((y) => (
              <ellipse key={y} cx={x} cy={y} rx="3" ry="2.2" fill="currentColor" stroke="none" />
            ))}
          </g>
        ))}
        <path d="M46 92 q14 6 28 0" strokeWidth="2.6" />
      </g>
    </svg>
  );
}

export function StampYotei({ label = "MT · YOTEI" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {frame(label, id)}
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M24 88 L54 46 Q60 40 66 46 L96 88Z" />
        <path d="M46 57 L54 46 Q60 40 66 46 L74 57 L68 54 L63 60 L58 54 L53 60 L50 54Z" fill="currentColor" />
        <path d="M24 96 H96" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
