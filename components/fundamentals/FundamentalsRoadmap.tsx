import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Monitor, Wifi, ShieldCheck, ChevronRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { getTrackProgress, type TrackKey } from '../../services/progressService';

/* ─── Fundamentals Roadmap ───
 * The Fundamentals hub as a journey: three floating land cubes (Programming →
 * Operating Systems → Networking) climbing toward the summit island —
 * Cybersecurity 101. Hand-drawn isometric SVG, no chart library. Each cube
 * carries a chunky, extruded 3D emblem seated on its top face.
 */

interface IslandDef {
  key: string;
  step: number;
  trackKey: TrackKey | null;
  icon: React.ElementType;
  color: string;
  route: string;
  cx: number;
  cy: number;
  scale: number;
  title: { en: string; ar: string };
  meta: { en: string; ar: string };
  isGoal?: boolean;
}

const ISLANDS: IslandDef[] = [
  {
    key: 'programming',
    step: 1,
    trackKey: 'programming',
    icon: Code,
    color: '#9fef00',
    route: '/fundamentals/programming',
    cx: 200,
    cy: 660,
    scale: 1,
    title: { en: 'Programming', ar: 'البرمجة' },
    meta: { en: 'Python · scripting · logic', ar: 'بايثون · السكربتات · المنطق' },
  },
  {
    key: 'operating-systems',
    step: 2,
    trackKey: 'os',
    icon: Monitor,
    color: '#f3a43a',
    route: '/fundamentals/operating-systems',
    cx: 740,
    cy: 515,
    scale: 1,
    title: { en: 'Operating Systems', ar: 'أنظمة التشغيل' },
    meta: { en: 'Linux · terminal · hardening', ar: 'لينكس · الطرفية · التقوية' },
  },
  {
    key: 'networking',
    step: 3,
    trackKey: 'networking',
    icon: Wifi,
    color: '#60a5fa',
    route: '/fundamentals/networking',
    cx: 255,
    cy: 350,
    scale: 1,
    title: { en: 'Networking', ar: 'الشبكات' },
    meta: { en: 'TCP/IP · packets · protocols', ar: 'TCP/IP · الحزم · البروتوكولات' },
  },
  {
    key: 'cybersecurity',
    step: 4,
    trackKey: null,
    icon: ShieldCheck,
    color: '#00a859',
    route: '/fundamentals/cybersecurity-101',
    cx: 610,
    cy: 165,
    scale: 1.16,
    title: { en: 'Cybersecurity', ar: 'الأمن السيبراني' },
    meta: { en: 'Security+ foundations', ar: 'أساسيات +Security' },
    isGoal: true,
  },
];

/* Climbing trails between islands, in journey order. */
const TRAILS: { from: string; d: string }[] = [
  { from: 'programming', d: 'M 300 672 C 450 712, 555 622, 648 555' },
  { from: 'operating-systems', d: 'M 652 472 C 525 418, 470 400, 363 368' },
  { from: 'networking', d: 'M 348 312 C 440 266, 480 238, 518 202' },
];

/* Isometric cube geometry (top-face half-width / half-height, side depth). */
const W = 96;
const H = 55;
const D = 52;

const cubeFaces = (s: number) => {
  const w = W * s;
  const h = H * s;
  const d = D * s;
  return {
    w,
    h,
    d,
    top: `0,${-h} ${w},0 0,${h} ${-w},0`,
    right: `0,${h} ${w},0 ${w},${d} 0,${h + d}`,
    left: `${-w},0 0,${h} 0,${h + d} ${-w},${d}`,
  };
};

/* ── Color helpers ── */
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
/** Mix `hex` toward `target` by t (0..1). */
const blend = (hex: string, target: string, t: number): string => {
  const a = rgb(hex);
  const b = rgb(target);
  const m = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
};

/* ── 3D extruded emblem seated on the cube's top face ──
 * Dark "obsidian" look: deeply tinted faces (toward near-black) with a graded
 * rim light (bright top edge → dim bottom), a gradient extrusion for real
 * thickness, a soft colored halo, and a neon bloom on the glyph.
 */
const Emblem: React.FC<{ k: string; color: string }> = ({ k, color }) => {
  const faceA = blend(color, '#0b1220', 0.74); // lit top of the face
  const faceMid = blend(color, '#070b14', 0.86);
  const faceB = blend(color, '#04070e', 0.93); // shaded bottom
  const side = blend(color, '#03050b', 0.94); // extrusion depth (darkest)
  const sideTop = blend(color, '#0a111e', 0.82); // depth catches a little light up top
  const rimHi = blend(color, '#ffffff', 0.3); // top edge — bright
  const rimLo = blend(color, '#0b1220', 0.42); // bottom edge — dim
  const spec = blend(color, '#ffffff', 0.82); // pale highlights
  const glyph = blend(color, '#ffffff', 0.42); // glowing accent
  const faceId = `face-${k}`;
  const rimId = `rim-${k}`;
  const sideId = `side-${k}`;
  const sphId = `sph-${k}`;
  const dx = 5;
  const dy = 9;

  return (
    <g>
      <defs>
        <linearGradient id={faceId} x1="0.12" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor={faceA} />
          <stop offset="0.55" stopColor={faceMid} />
          <stop offset="1" stopColor={faceB} />
        </linearGradient>
        <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rimHi} />
          <stop offset="1" stopColor={rimLo} />
        </linearGradient>
        <linearGradient id={sideId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sideTop} />
          <stop offset="1" stopColor={side} />
        </linearGradient>
        <radialGradient id={sphId} cx="0.36" cy="0.3" r="0.92">
          <stop offset="0" stopColor={spec} />
          <stop offset="0.4" stopColor={blend(color, '#0b1220', 0.6)} />
          <stop offset="1" stopColor={side} />
        </radialGradient>
      </defs>

      {/* Neon halo + grounded contact shadow */}
      <ellipse cx={0} cy={-26} rx={50} ry={44} fill={color} opacity={0.12} filter="url(#island-blur)" />
      <ellipse cx={0} cy={18} rx={40} ry={9} fill="#03050b" opacity={0.5} filter="url(#island-blur)" />

      {k === 'cybersecurity' && (() => {
        const shield = 'M-40,-66 Q0,-77 40,-66 L40,-24 Q40,9 0,30 Q-40,9 -40,-24 Z';
        return (
          <>
            <path d={shield} transform={`translate(${dx},${dy})`} fill={`url(#${sideId})`} />
            <path d={shield} fill={`url(#${faceId})`} stroke={`url(#${rimId})`} strokeWidth={2.6} strokeLinejoin="round" />
            {/* top specular sweep */}
            <path d="M-31,-58 Q0,-68 31,-58" fill="none" stroke={spec} strokeWidth={2.4} strokeLinecap="round" opacity={0.22} />
            <g filter="url(#emblem-glow)">
              <path d="M-15,-26 l11,13 l22,-27" fill="none" stroke={glyph} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        );
      })()}

      {k === 'operating-systems' && (
        <>
          {/* stand */}
          <rect x={-11} y={-10} width={22} height={16} fill={`url(#${sideId})`} />
          <rect x={-30} y={2} width={60} height={10} rx={3} fill={blend(color, '#060a12', 0.84)} />
          {/* screen depth + face */}
          <rect x={-48} y={-74} width={96} height={64} rx={9} transform={`translate(${dx},${dy})`} fill={`url(#${sideId})`} />
          <rect x={-48} y={-74} width={96} height={64} rx={9} fill={`url(#${faceId})`} stroke={`url(#${rimId})`} strokeWidth={2.6} />
          {/* inset screen */}
          <rect x={-39} y={-65} width={78} height={46} rx={4} fill="#05080f" opacity={0.8} />
          <rect x={-39} y={-65} width={78} height={46} rx={4} fill="none" stroke={rimLo} strokeOpacity={0.5} strokeWidth={1} />
          {/* glowing content */}
          <g filter="url(#emblem-glow)">
            <rect x={-32} y={-57} width={48} height={5.5} rx={2.5} fill={glyph} opacity={0.9} />
            <rect x={-32} y={-46} width={30} height={5.5} rx={2.5} fill={glyph} opacity={0.5} />
            <circle cx={24} cy={-31} r={6} fill={glyph} opacity={0.75} />
          </g>
          {/* top bezel highlight */}
          <rect x={-44} y={-71} width={88} height={3} rx={1.5} fill={spec} opacity={0.18} />
        </>
      )}

      {k === 'programming' && (() => {
        const card = 'M-48,-58 q0,-12 12,-12 l72,0 q12,0 12,12 l0,46 q0,12 -12,12 l-72,0 q-12,0 -12,-12 Z';
        return (
          <>
            <path d={card} transform={`translate(${dx},${dy})`} fill={`url(#${sideId})`} />
            <path d={card} fill={`url(#${faceId})`} stroke={`url(#${rimId})`} strokeWidth={2.6} strokeLinejoin="round" />
            {/* top edge highlight */}
            <rect x={-40} y={-67} width={80} height={3} rx={1.5} fill={spec} opacity={0.16} />
            {/* window dots */}
            <circle cx={-34} cy={-58} r={3} fill={spec} opacity={0.55} />
            <circle cx={-24} cy={-58} r={3} fill={spec} opacity={0.38} />
            <circle cx={-14} cy={-58} r={3} fill={spec} opacity={0.26} />
            {/* </> — glowing neon glyph */}
            <g filter="url(#emblem-glow)">
              <path d="M-12,-40 L-28,-26 L-12,-12" fill="none" stroke={glyph} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12,-40 L28,-26 L12,-12" fill="none" stroke={glyph} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5,-46 L-5,-6" fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" />
            </g>
          </>
        );
      })()}

      {k === 'networking' && (() => {
        const nodes: [number, number, number][] = [
          [0, -32, 15],
          [-33, -58, 10],
          [33, -54, 10],
          [-24, -6, 8],
          [28, -10, 8],
        ];
        const [c0] = nodes;
        const sphere = (cx: number, cy: number, r: number, key: number) => (
          <g key={key}>
            <circle cx={cx + 2} cy={cy + 3} r={r} fill={side} />
            <circle cx={cx} cy={cy} r={r} fill={`url(#${sphId})`} stroke={`url(#${rimId})`} strokeWidth={1.5} />
            <circle cx={cx - r * 0.32} cy={cy - r * 0.34} r={r * 0.3} fill={spec} opacity={0.6} />
          </g>
        );
        return (
          <>
            {/* glowing mesh links */}
            <g filter="url(#emblem-glow)">
              {nodes.slice(1).map(([x, y], i) => (
                <line key={`l${i}`} x1={c0[0]} y1={c0[1]} x2={x} y2={y} stroke={color} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
              ))}
            </g>
            {nodes.map(([x, y, r], i) => sphere(x, y, r, i))}
          </>
        );
      })()}
    </g>
  );
};

const Island: React.FC<{
  island: IslandDef;
  pct: number | null;
  index: number;
  lang: 'en' | 'ar';
  onClick: () => void;
}> = ({ island, pct, index, lang, onClick }) => {
  const { w, h, d, top, right, left } = cubeFaces(island.scale);
  const c = island.color;
  const labelBase = h + d + 36;

  return (
    <g transform={`translate(${island.cx}, ${island.cy})`}>
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: { delay: index * 0.04, duration: 0.28, ease: 'easeOut' },
          scale: { delay: index * 0.04, duration: 0.38, ease: [0.34, 1.3, 0.64, 1] },
        }}
        whileHover={{ scale: 1.06 }}
        style={{ cursor: 'pointer', willChange: 'transform' }}
        onClick={onClick}
        role="link"
        aria-label={island.title[lang]}
      >
        {/* Soft glow pooled under the island */}
        <ellipse cx={0} cy={h + d + 40} rx={w * 0.92} ry={14} fill={c} opacity={0.1} filter="url(#island-blur)" />

        {/* Stray floating shards beneath — sells the "floating land" */}
        <g opacity={0.85}>
          <polygon
            points={`-${w * 0.46},${h + d + 18} -${w * 0.34},${h + d + 11} -${w * 0.22},${h + d + 18} -${w * 0.34},${h + d + 25}`}
            fill="#141d33"
            stroke={c}
            strokeOpacity={0.25}
            strokeWidth={1}
          />
          <polygon
            points={`${w * 0.38},${h + d + 24} ${w * 0.46},${h + d + 19} ${w * 0.54},${h + d + 24} ${w * 0.46},${h + d + 29}`}
            fill="#101828"
            stroke={c}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        </g>

        {/* The land cube */}
        <polygon points={left} fill="#0f1726" stroke="#1f2c45" strokeWidth={1} />
        <polygon points={right} fill="#141f36" stroke="#23304c" strokeWidth={1} />
        <polygon points={top} fill="#16223b" />
        <polygon points={top} fill={c} opacity={island.isGoal ? 0.2 : 0.13} />
        <polygon points={top} fill="none" stroke={c} strokeOpacity={0.85} strokeWidth={1.6} />
        {/* Inner top-face contour, like terraced land */}
        <polygon
          points={`0,${-h * 0.55} ${w * 0.55},0 0,${h * 0.55} ${-w * 0.55},0`}
          fill="none"
          stroke={c}
          strokeOpacity={0.2}
          strokeWidth={1}
          strokeDasharray="4 5"
        />

        {/* Goal island gets a static beacon ring */}
        {island.isGoal && (
          <ellipse cx={0} cy={0} rx={w * 0.82} ry={h * 0.82} fill="none" stroke={c} strokeWidth={1.4} strokeOpacity={0.4} />
        )}

        {/* 3D emblem seated on the top face */}
        <g transform={`scale(${island.scale})`}>
          <Emblem k={island.key} color={c} />
        </g>

        {/* ── Label stack ── */}
        <text
          x={0}
          y={labelBase}
          textAnchor="middle"
          fill={c}
          fontSize={10.5}
          fontWeight={700}
          letterSpacing={2.5}
          fontFamily="'JetBrains Mono', 'Consolas', monospace"
        >
          {island.isGoal
            ? lang === 'ar' ? '— الهدف —' : '— THE GOAL —'
            : lang === 'ar' ? `المرحلة 0${island.step}` : `STEP 0${island.step}`}
        </text>
        <text
          x={0}
          y={labelBase + 24}
          textAnchor="middle"
          fill="#f3f6ff"
          fontSize={island.isGoal ? 22 : 19}
          fontWeight={800}
          fontFamily="'Poppins', sans-serif"
        >
          {island.title[lang]}
        </text>
        <text x={0} y={labelBase + 44} textAnchor="middle" fill="#8b98ae" fontSize={12} fontFamily="'Poppins', sans-serif">
          {island.meta[lang]}
        </text>

        {/* Progress bar (pillars) or enter-chip (goal) */}
        {pct !== null ? (
          <g transform={`translate(0, ${labelBase + 56})`}>
            <rect x={-62} y={0} width={124} height={5} rx={2.5} fill="#1c2740" />
            <rect x={-62} y={0} width={Math.max(4, 1.24 * pct)} height={5} rx={2.5} fill={c} />
            <text x={72} y={5.5} fill="#6e7a94" fontSize={10.5} fontFamily="'JetBrains Mono', monospace">
              {pct}%
            </text>
          </g>
        ) : (
          <g transform={`translate(0, ${labelBase + 54})`}>
            <rect x={-58} y={0} width={116} height={22} rx={11} fill={c} opacity={0.12} />
            <rect x={-58} y={0} width={116} height={22} rx={11} fill="none" stroke={c} strokeOpacity={0.5} strokeWidth={1} />
            <text
              x={0}
              y={14.5}
              textAnchor="middle"
              fill={c}
              fontSize={10.5}
              fontWeight={700}
              letterSpacing={1}
              fontFamily="'JetBrains Mono', monospace"
            >
              {lang === 'ar' ? 'ادخل 101 ←' : 'ENTER 101 →'}
            </text>
          </g>
        )}

        {/* Generous invisible hit area */}
        <rect x={-w - 14} y={-h - 86} width={(w + 14) * 2} height={h + 86 + labelBase + 70} fill="transparent" />
      </motion.g>
    </g>
  );
};

const FundamentalsRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();

  const tracks = getTrackProgress();
  const pctOf = (key: TrackKey | null): number | null => {
    if (!key) return null;
    const t = tracks.find((x) => x.key === key);
    if (!t || t.total === 0) return 0;
    return Math.round((t.done / t.total) * 100);
  };

  return (
    <>
      {/* ── Desktop / tablet: the floating-islands scene ── */}
      <div className="hidden md:block relative overflow-hidden rounded-2xl border border-[#263248] bg-[#0a0f18]">
        {/* Faint sky gradient toward the summit */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(560px circle at 60% 8%, rgba(0,168,89,0.09), transparent 55%), radial-gradient(420px circle at 18% 85%, rgba(159,239,0,0.05), transparent 55%)',
          }}
        />
        {/* Strapline, overlaid rather than stacked above the scene so it costs
            no vertical space — height is what limits how big the diagram can
            be. The art's top-left is empty (content starts at x=90), so it sits
            clear of the islands in both directions. */}
        <div className="pointer-events-none absolute top-0 start-0 z-10 p-5 sm:p-6 max-w-[min(15rem,26%)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00a859]">
            {lang === 'ar' ? 'المسار' : 'The path'}
          </p>
          <p className="mt-1 text-sm leading-snug text-[#9aa5bf]">
            {lang === 'ar'
              ? 'رحلة من ثلاث مراحل نحو القمة: الأمن السيبراني.'
              : 'A three-stage journey to the summit: Cybersecurity.'}
          </p>
        </div>

        {/* The scene is 1000x880, so at full width it would stand ~1100px tall
            and run off the screen. Cap it to the viewport (minus the app header,
            page padding and title) and let preserveAspectRatio scale the whole
            diagram down to fit — nothing is ever cropped. The content itself is
            already tight (only ~22px of vertical slack in the viewBox), so this
            cap is the only thing deciding how large the scene renders. */}
        <svg
          viewBox="0 0 1000 880"
          preserveAspectRatio="xMidYMid meet"
          className="relative mx-auto block h-auto w-full max-h-[calc(100vh-12rem)]"
        >
          <defs>
            <filter id="island-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            {/* Neon bloom for emblem glyphs (blur + crisp original) */}
            <filter id="emblem-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient stars */}
          {[
            [85, 120, 1.4], [320, 70, 1], [520, 300, 1.2], [880, 130, 1.5], [930, 420, 1],
            [120, 460, 1.2], [820, 690, 1.3], [480, 760, 1], [680, 330, 1], [60, 730, 1.4],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#3d4f73" opacity={0.5} />
          ))}

          {/* Climbing trails (drawn under the islands) */}
          {TRAILS.map((trail) => {
            const src = ISLANDS.find((i) => i.key === trail.from)!;
            const done = (pctOf(src.trackKey) ?? 0) >= 100;
            const stroke = done ? '#00a859' : '#33415e';
            return (
              <g key={trail.from}>
                <path d={trail.d} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="7 9" strokeLinecap="round" opacity={done ? 0.9 : 0.7} />
                {done && (
                  <path d={trail.d} fill="none" stroke="#9fef00" strokeWidth={4} strokeLinecap="round" opacity={0.1} />
                )}
              </g>
            );
          })}

          {ISLANDS.map((island, i) => (
            <Island
              key={island.key}
              island={island}
              pct={pctOf(island.trackKey)}
              index={i}
              lang={lang}
              onClick={() => navigate(island.route)}
            />
          ))}
        </svg>
      </div>

      {/* ── Mobile: vertical roadmap (same journey, stacked) ── */}
      <div className="md:hidden space-y-0">
        {/* The desktop scene carries this as an overlay; mobile has no scene,
            so it leads the list instead. */}
        <p className="mb-4 text-sm leading-snug text-[#9aa5bf]">
          {lang === 'ar'
            ? 'رحلة من ثلاث مراحل نحو القمة: الأمن السيبراني.'
            : 'A three-stage journey to the summit: Cybersecurity.'}
        </p>

        {ISLANDS.map((island, i) => {
          const pct = pctOf(island.trackKey);
          const Icon = island.icon;
          const c = island.color;
          return (
            <div key={island.key}>
              {i > 0 && (
                <div className="ms-[30px] h-7 border-s-2 border-dashed border-[#33415e]" />
              )}
              <button
                onClick={() => navigate(island.route)}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-start transition-colors ${
                  island.isGoal
                    ? 'border-[#00a859]/45 bg-[#00a859]/[0.07]'
                    : 'border-[#263248] bg-[#121a2a] hover:border-[#354562]'
                }`}
              >
                {/* Mini land cube */}
                <svg width="60" height="56" viewBox="-50 -42 100 96" className="flex-shrink-0">
                  <polygon points="-34,0 0,20 0,38 -34,18" fill="#0f1726" />
                  <polygon points="0,20 34,0 34,18 0,38" fill="#141f36" />
                  <polygon points="0,-20 34,0 0,20 -34,0" fill="#16223b" />
                  <polygon points="0,-20 34,0 0,20 -34,0" fill={c} opacity={0.16} />
                  <polygon points="0,-20 34,0 0,20 -34,0" fill="none" stroke={c} strokeWidth={1.4} strokeOpacity={0.85} />
                  <foreignObject x="-13" y="-40" width="26" height="26">
                    <div style={{ display: 'flex', justifyContent: 'center', color: c }}>
                      <Icon size={20} />
                    </div>
                  </foreignObject>
                </svg>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: c }} dir="ltr">
                    {island.isGoal
                      ? lang === 'ar' ? 'الهدف' : 'THE GOAL'
                      : lang === 'ar' ? `المرحلة 0${island.step}` : `STEP 0${island.step}`}
                  </p>
                  <p className="text-base font-bold text-[#f3f6ff]">{island.title[lang]}</p>
                  <p className="text-xs text-[#8b98ae] truncate">{island.meta[lang]}</p>
                  {pct !== null && (
                    <div className="mt-2 flex items-center gap-2" dir="ltr">
                      <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-[#1c2740] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#6e7a94]">{pct}%</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={17} className="flex-shrink-0 text-[#4d5a73] rtl:rotate-180" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FundamentalsRoadmap;
