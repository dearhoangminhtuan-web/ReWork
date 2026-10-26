// 東京 artwork: night-navy ink, Tokyo Tower orange, Yamanote green.
import { useId } from "react";

/** Dusk over Minato: Tokyo Tower in front, Skytree and Fuji behind, a Yamanote train on the viaduct. */
export function TokyoPoster({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const windows: React.ReactNode[] = [];
  const blocks: [number, number, number][] = [
    [0, 176, 26],
    [26, 160, 22],
    [48, 186, 18],
    [150, 170, 24],
    [174, 150, 20],
    [194, 178, 22],
    [216, 162, 26],
    [242, 184, 16],
    [282, 168, 24],
    [306, 146, 20],
    [326, 172, 34],
  ];
  blocks.forEach(([x, y, w]) => {
    for (let wy = y + 6; wy < 210; wy += 8)
      for (let wx = x + 4; wx < x + w - 3; wx += 6)
        windows.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width="2.4" height="3" fill="var(--spot-2)" fillOpacity={(wx + wy) % 3 ? 0.9 : 0.25} />);
  });
  return (
    <svg viewBox="0 0 360 260" className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={`frame-${id}`}>
          <rect width="360" height="260" />
        </clipPath>
        <clipPath id={`tower-${id}`}>
          <path d="M92 214 L113 126 L115 126 L117 72 L119 72 L119.5 30 L120.5 30 L121 72 L123 72 L125 126 L127 126 L148 214 L137 214 L124 150 L116 150 L103 214Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#frame-${id})`}>
        {/* dusk sun */}
        <circle cx="118" cy="104" r="62" fill="var(--spot)" fillOpacity=".16" />
        {/* 富士山 far away */}
        <path d="M214 176 L264 116 Q272 107 280 116 L330 176Z" fill="var(--sea)" fillOpacity=".38" />
        <path d="M253 129 L264 116 Q272 107 280 116 L291 129 L284 125 L278 131 L272 124 L266 131 L260 125Z" fill="var(--card)" />

        {/* skyline */}
        {blocks.map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={214 - y} fill="var(--ink)" />
        ))}
        {windows}

        {/* スカイツリー */}
        <path d="M264 214 L268.5 64 L271.5 64 L276 214Z" fill="var(--sea)" />
        <rect x="264.5" y="120" width="11" height="6" rx="2" fill="var(--sea)" />
        <rect x="266" y="92" width="8" height="4" rx="2" fill="var(--sea)" />
        <path d="M270 64 V34" stroke="var(--sea)" strokeWidth="1.4" />

        {/* 東京タワー: orange with white bands + lattice */}
        <g>
          <path
            d="M92 214 L113 126 L115 126 L117 72 L119 72 L119.5 30 L120.5 30 L121 72 L123 72 L125 126 L127 126 L148 214 L137 214 L124 150 L116 150 L103 214Z"
            fill="var(--spot)"
          />
          <g clipPath={`url(#tower-${id})`}>
            {[60, 96, 140, 176, 200].map((y) => (
              <rect key={y} x="80" y={y} width="80" height="6" fill="var(--card)" />
            ))}
            <path
              d="M98 200 L140 170 M100 186 L136 160 M104 172 L133 150 M142 200 L100 170 M140 186 L104 160 M136 172 L107 150 M114 120 L126 100 M126 120 L114 100"
              stroke="var(--card)"
              strokeWidth=".9"
              strokeOpacity=".8"
            />
          </g>
          <rect x="107" y="121" width="26" height="7" fill="var(--ink)" />
          <rect x="113" y="69" width="14" height="5" fill="var(--ink)" />
        </g>

        {/* 山手線 viaduct + train */}
        <rect x="0" y="214" width="360" height="12" fill="var(--spot-2)" />
        <g className="train-run">
          <rect x="0" y="203" width="82" height="13" rx="3" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.2" />
          <rect x="0" y="211" width="82" height="2.6" fill="var(--spot-2)" />
          {[6, 18, 30, 46, 58, 70].map((x) => (
            <rect key={x} x={x} y="205.5" width="8" height="4.5" fill="var(--ink)" />
          ))}
        </g>
        {/* street + scramble crossing */}
        <rect x="0" y="226" width="360" height="40" fill="var(--ink)" />
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={182 + i * 9} y="236" width="5" height="22" fill="var(--card)" fillOpacity=".85" />
        ))}
        <path d="M150 262 L240 230 M156 230 L246 262" stroke="var(--card)" strokeWidth="4" strokeDasharray="5 4" strokeOpacity=".55" />

        {/* 提灯 */}
        <path d="M30 0 V14" stroke="var(--ink)" strokeWidth="1.4" />
        <rect x="21" y="13" width="18" height="3" fill="var(--ink)" />
        <ellipse cx="30" cy="34" rx="15" ry="19" fill="var(--spot)" />
        <path d="M16 28 H44 M15 34 H45 M16 40 H44" stroke="var(--ink)" strokeOpacity=".35" strokeWidth="1" />
        <rect x="21" y="51" width="18" height="3" fill="var(--ink)" />
      </g>
    </svg>
  );
}

const stampFrame = (label: string, id: string) => (
  <>
    <defs>
      <path id={`arc-${id}`} d="M24 60 a36 36 0 0 1 72 0" />
    </defs>
    <rect x="5" y="5" width="110" height="110" rx="22" fill="none" stroke="currentColor" strokeWidth="3.4" />
    <rect x="11" y="11" width="98" height="98" rx="17" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <text fontSize="9.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="var(--font-plex)">
      <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
        {label}
      </textPath>
    </text>
  </>
);

export function StampTower({ label = "TOKYO · TOWER" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M42 98 L56 58 L64 58 L78 98" />
        <path d="M50 98 Q60 80 70 98" />
        <path d="M56 58 L58 36 L62 36 L64 58" />
        <path d="M60 36 V22" />
        <path d="M52 58 H68 M55 36 H65" strokeWidth="3" />
        <path d="M47 84 L73 84 M50 74 L70 74 M46 90 L66 70 M74 90 L54 70" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

export function StampKaminarimon({ label = "ASAKUSA · 雷門" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <path d="M26 46 L60 34 L94 46 Z" fill="currentColor" />
      <rect x="30" y="46" width="60" height="4" fill="currentColor" />
      <path d="M34 50 V96 M86 50 V96" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="60" cy="74" rx="17" ry="20" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M44 68 H76 M43 76 H77 M45 84 H75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="52" y="52" width="16" height="3" fill="currentColor" />
      <rect x="52" y="93" width="16" height="3" fill="currentColor" />
    </svg>
  );
}

export function StampScramble({ label = "SHIBUYA · SCRAMBLE" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <g fill="currentColor">
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={`h${i}`} x={30 + i * 9} y="46" width="5" height="12" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={`v${i}`} x={30 + i * 9} y="80" width="5" height="12" />
        ))}
      </g>
      <path d="M32 98 L88 42 M32 42 L88 98" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="60" cy="70" r="3.4" fill="currentColor" />
      <circle cx="48" cy="66" r="2.6" fill="currentColor" />
      <circle cx="72" cy="74" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function StampYamanote({ label = "JY · YAMANOTE" }: { label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {stampFrame(label, id)}
      <ellipse cx="60" cy="72" rx="32" ry="22" fill="none" stroke="currentColor" strokeWidth="4" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={60 + 32 * Math.cos(r)}
            cy={72 + 22 * Math.sin(r)}
            r="4"
            fill="var(--card, #fff)"
            stroke="currentColor"
            strokeWidth="2"
          />
        );
      })}
      <rect x="48" y="62" width="24" height="18" rx="4" fill="currentColor" />
      <rect x="51" y="65" width="18" height="6" rx="1" fill="var(--card, #fff)" />
    </svg>
  );
}
