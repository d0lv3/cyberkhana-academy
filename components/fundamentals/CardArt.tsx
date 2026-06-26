import React, { useId } from 'react';

export type CardArtKind = 'network' | 'code' | 'path';

interface CardArtProps {
  kind: CardArtKind;
  /** Accent color the built-in art is tinted with. */
  color: string;
  /** Raw uploaded SVG markup; when present it replaces the built-in art. */
  svg?: string;
  /** Short glyph drawn large behind the code window (e.g. "Py", "C", "$_"). */
  glyph?: string;
  className?: string;
}

/** Mix a hex color toward a target by t (0..1). */
function blend(hex: string, target: string, t: number): string {
  const p = (h: string) => {
    const s = h.replace('#', '');
    const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = p(hex);
  const [r2, g2, b2] = p(target);
  const m = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`;
}

/**
 * Full-bleed square illustration used as the cover for Fundamentals cards.
 * If a creator supplies raw SVG it is rendered as a sandboxed <img> (a data
 * URI image can't execute scripts); otherwise a built-in scene is drawn.
 */
const CardArt: React.FC<CardArtProps> = ({ kind, color, svg, glyph, className = '' }) => {
  const uid = useId().replace(/:/g, '');

  // Creator-supplied SVG → safe data-URI image.
  if (svg && svg.trim().startsWith('<svg')) {
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return (
      <img
        src={dataUri}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  const tintFrom = blend(color, '#0d1117', 0.55);
  const tintTo = '#080c14';

  return (
    <svg
      viewBox="0 0 400 400"
      className={`absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tintFrom} />
          <stop offset="62%" stopColor={tintTo} />
          <stop offset="100%" stopColor="#05080e" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width="400" height="400" fill={`url(#bg-${uid})`} />
      <rect width="400" height="400" fill={`url(#glow-${uid})`} />

      {/* faint dotted grid */}
      <g opacity="0.5">
        {Array.from({ length: 9 }).map((_, r) =>
          Array.from({ length: 9 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={24 + c * 44} cy={24 + r * 44} r="1.1" fill="#1c2740" />
          )),
        )}
      </g>

      {kind === 'network'
        ? NetworkScene({ color, uid })
        : kind === 'path'
          ? PathScene({ color, uid })
          : CodeScene({ color, uid, glyph })}
    </svg>
  );
};

/* ── Glowing node-mesh scene (Networking) ── */
function NetworkScene({ color, uid }: { color: string; uid: string }) {
  // node positions in the 400×400 space
  const nodes = [
    { x: 200, y: 150, r: 16, hub: true },
    { x: 96, y: 92, r: 10 },
    { x: 312, y: 104, r: 10 },
    { x: 70, y: 226, r: 9 },
    { x: 330, y: 224, r: 11 },
    { x: 150, y: 270, r: 8 },
    { x: 268, y: 276, r: 9 },
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [2, 4], [5, 6],
  ];
  const dim = blend(color, '#0d1117', 0.35);
  return (
    <g>
      {/* edges */}
      <g stroke={dim} strokeWidth="1.6" opacity="0.6">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>
      {/* travelling packets */}
      <g>
        {edges.slice(0, 5).map(([a, b], i) => {
          const t = 0.35 + (i % 3) * 0.18;
          const px = nodes[a].x + (nodes[b].x - nodes[a].x) * t;
          const py = nodes[a].y + (nodes[b].y - nodes[a].y) * t;
          return <circle key={i} cx={px} cy={py} r="2.6" fill={color} opacity="0.9" />;
        })}
      </g>
      {/* node halos */}
      <g filter={`url(#soft-${uid})`} opacity="0.55">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r + 4} fill={color} opacity={n.hub ? 0.5 : 0.3} />
        ))}
      </g>
      {/* nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill="#0b1220" stroke={color} strokeWidth={n.hub ? 2.4 : 1.6} />
          <circle cx={n.x} cy={n.y} r={n.r * 0.42} fill={color} opacity={n.hub ? 1 : 0.85} />
        </g>
      ))}
    </g>
  );
}

/* ── Winding roadmap scene (Paths) ── */
function PathScene({ color, uid }: { color: string; uid: string }) {
  // waypoints climbing from bottom-left to a summit at top-right
  const stops = [
    { x: 64, y: 330, r: 8 },
    { x: 150, y: 256, r: 8 },
    { x: 216, y: 206, r: 8 },
    { x: 282, y: 150, r: 8 },
    { x: 344, y: 80, r: 14, summit: true },
  ];
  const route =
    'M64 330 C 112 300 122 286 150 256 C 182 222 188 232 216 206 ' +
    'C 246 176 256 176 282 150 C 306 126 322 108 344 80';
  const dim = blend(color, '#0d1117', 0.35);
  return (
    <g>
      {/* route casing + bright dashed line */}
      <path d={route} fill="none" stroke={dim} strokeWidth="6" strokeLinecap="round" opacity="0.5" />
      <path
        d={route}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 9"
        opacity="0.9"
      />
      {/* waypoint halos */}
      <g filter={`url(#soft-${uid})`} opacity="0.55">
        {stops.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r + 4} fill={color} opacity={s.summit ? 0.5 : 0.3} />
        ))}
      </g>
      {/* waypoints */}
      {stops.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r} fill="#0b1220" stroke={color} strokeWidth={s.summit ? 2.4 : 1.6} />
          <circle cx={s.x} cy={s.y} r={s.r * 0.42} fill={color} opacity={s.summit ? 1 : 0.85} />
        </g>
      ))}
      {/* summit flag */}
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95">
        <line x1="344" y1="66" x2="344" y2="40" />
        <path d="M344 42 L362 48 L344 54 Z" fill={color} stroke="none" />
      </g>
    </g>
  );
}

/* ── Floating code-window scene (Programming) ── */
function CodeScene({ color, uid, glyph }: { color: string; uid: string; glyph?: string }) {
  const neutral = '#2a3650';
  // syntax-highlighted code lines: [indent, width, color]
  const lines: [number, number, string][] = [
    [0, 70, color],
    [16, 120, neutral],
    [16, 90, '#4d5a73'],
    [32, 110, color],
    [32, 64, neutral],
    [16, 96, '#4d5a73'],
    [0, 54, color],
  ];
  return (
    <g>
      {/* big translucent glyph behind the window */}
      {glyph && (
        <text
          x="200"
          y="232"
          textAnchor="middle"
          fontSize="170"
          fontWeight="800"
          fontFamily="ui-monospace, Menlo, monospace"
          fill={color}
          opacity="0.07"
        >
          {glyph}
        </text>
      )}

      {/* window glow */}
      <rect x="74" y="92" width="252" height="196" rx="16" fill={color} opacity="0.16" filter={`url(#soft-${uid})`} />

      {/* window body */}
      <rect x="78" y="96" width="244" height="188" rx="14" fill="#0b1220" stroke="#243047" strokeWidth="1.5" />

      {/* title bar */}
      <rect x="78" y="96" width="244" height="34" rx="14" fill="#0e1726" />
      <rect x="78" y="120" width="244" height="10" fill="#0e1726" />
      <circle cx="100" cy="113" r="4.5" fill="#ef4d57" />
      <circle cx="118" cy="113" r="4.5" fill="#f3c84b" />
      <circle cx="136" cy="113" r="4.5" fill={color} />

      {/* code lines */}
      <g>
        {lines.map(([indent, w, c], i) => (
          <rect
            key={i}
            x={98 + indent}
            y={150 + i * 18}
            width={w}
            height="7"
            rx="3.5"
            fill={c}
            opacity={c === color ? 0.9 : 0.6}
          />
        ))}
        {/* blinking caret */}
        <rect x={98 + 54 + 8} y={150 + 6 * 18 - 1} width="7" height="9" rx="1.5" fill={color} opacity="0.95" />
      </g>
    </g>
  );
}

export default CardArt;
