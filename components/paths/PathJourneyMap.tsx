import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { coverImageSrc } from '../../data/fundamentalsData';
import { buildCatalogIndex } from '../../data/pathCatalog';
import type { PathStep } from '../../services/creatorTypes';
import type { PathStepState } from '../../services/progressService';

interface PathJourneyMapProps {
  steps: PathStep[];
  states: PathStepState[];
  nextIndex: number;
  color: string;
  onOpen: (index: number) => void;
}

/* ── Palette — the site green, used for every cube border / glow ── */
const GREEN = '#00a859';
const GREEN_DIM = '#33415e';

/* ── Layout ── */
const VBW = 680;
const LEFT_X = 214;
const RIGHT_X = 466;
const ROW_GAP = 128;
const TOP_PAD = 136;
const BOTTOM_PAD = 108;

/* ── Isometric cube geometry (top-face half-width/height, side depth) ── */
const CW = 52;
const CH = 29;
const CD = 29;
const TOP = `0,${-CH} ${CW},0 0,${CH} ${-CW},0`;
const LEFT = `${-CW},0 0,${CH} 0,${CH + CD} ${-CW},${CD}`;
const RIGHT = `0,${CH} ${CW},0 ${CW},${CD} 0,${CH + CD}`;

/* Floating cover tile — square resting just on the cube's top face */
const TS = 90;
const TILE_X = -TS / 2;
const TILE_Y = -112;
const TILE_R = 13;

const xOf = (i: number) => (i % 2 === 0 ? LEFT_X : RIGHT_X);
/* Trails leave/join a cube from its inner side edge: left cubes → right edge,
 * right cubes → left edge, so connectors run cleanly through the middle. */
const edgeX = (i: number) => xOf(i) + (i % 2 === 0 ? CW : -CW);
const EDGE_DY = CD * 0.3;

function truncate(s: string, n = 22): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/* Deterministic PRNG so the starfield/glyph scatter is stable across renders. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Small cyber-sec glyphs scattered across the space background (centered at 0). */
const GLYPHS: (() => React.ReactNode)[] = [
  () => <polygon points="9,0 4.5,7.8 -4.5,7.8 -9,0 -4.5,-7.8 4.5,-7.8" />,
  () => <path d="M0,-9 L8,-6 L8,1 Q8,7 0,10 Q-8,7 -8,1 L-8,-6 Z" />,
  () => (
    <>
      <rect x={-5} y={-1} width={10} height={8} rx={1.5} />
      <path d="M-3,-1 v-3 a3,3 0 0 1 6,0 v3" />
    </>
  ),
  () => (
    <>
      <path d="M-3,-7 L-9,0 L-3,7" />
      <path d="M3,-7 L9,0 L3,7" />
      <line x1={1.5} y1={-8} x2={-1.5} y2={8} />
    </>
  ),
  () => (
    <>
      <circle r={2.6} />
      <line x1={2.6} y1={0} x2={9} y2={0} />
      <line x1={-2} y1={2} x2={-7} y2={7} />
      <line x1={2} y1={-2} x2={7} y2={-7} />
      <circle cx={9} cy={0} r={1.4} />
      <circle cx={-7} cy={7} r={1.4} />
    </>
  ),
  () => (
    <>
      <rect x={-9} y={-7} width={18} height={14} rx={2} />
      <path d="M-5,-2 L-1,1 L-5,4" />
      <line x1={1} y1={4} x2={6} y2={4} />
    </>
  ),
];

/**
 * PathJourneyMap — the path's curriculum as a climbing road of floating
 * isometric cubes over a space backdrop, alternating left/right up toward the
 * finish. Cubes carry the module cover (module steps) or a green number tile;
 * side-edge trails link them and light up as steps complete. Desktop-only.
 */
const PathJourneyMap: React.FC<PathJourneyMapProps> = ({ steps, states, nextIndex, color, onOpen }) => {
  const uid = useId().replace(/:/g, '');
  const catalog = useMemo(() => buildCatalogIndex(), []);
  const n = steps.length;
  const cyOf = (i: number) => TOP_PAD + (n - 1 - i) * ROW_GAP;
  const totalH = TOP_PAD + Math.max(0, n - 1) * ROW_GAP + BOTTOM_PAD;

  // Starfield + scattered glyphs, distributed across the whole scene height.
  const bg = useMemo(() => {
    const rand = mulberry32(20240703);
    const stars = Array.from({ length: Math.round(totalH / 22) }, () => ({
      x: rand() * VBW,
      y: rand() * totalH,
      r: 0.5 + rand() * 1.5,
      o: 0.2 + rand() * 0.5,
    }));
    const glyphs = Array.from({ length: Math.max(7, Math.round(totalH / 90)) }, () => ({
      x: rand() * VBW,
      y: rand() * totalH,
      s: 0.7 + rand() * 0.95,
      rot: rand() * 360,
      type: Math.floor(rand() * GLYPHS.length),
      o: 0.3 + rand() * 0.22,
    }));
    return { stars, glyphs };
  }, [totalH]);

  // Draw far (top) cubes first so nearer (bottom) ones overlap them.
  const order = Array.from({ length: n }, (_, i) => i).reverse();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#070a12]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px circle at 70% 6%, rgba(0,168,89,0.13), transparent 60%), radial-gradient(520px circle at 14% 82%, rgba(0,168,89,0.06), transparent 60%), radial-gradient(420px circle at 42% 46%, rgba(16,185,129,0.05), transparent 60%)',
        }}
      />
      <svg viewBox={`0 0 ${VBW} ${totalH}`} className="relative mx-auto h-auto w-full max-w-[880px]" role="img" aria-label="Learning path journey">
        {/* Starfield */}
        {bg.stars.map((s, i) => (
          <circle key={`st${i}`} cx={s.x} cy={s.y} r={s.r} fill="#4a5d82" opacity={s.o} />
        ))}

        {/* Scattered cyber-sec glyphs */}
        {bg.glyphs.map((g, i) => (
          <g
            key={`gl${i}`}
            transform={`translate(${g.x}, ${g.y}) rotate(${g.rot}) scale(${g.s})`}
            stroke={GREEN}
            fill="none"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={g.o}
          >
            {GLYPHS[g.type]()}
          </g>
        ))}

        {/* Climbing trails — from the inner side edges of the cubes */}
        {steps.slice(0, -1).map((_, i) => {
          const x1 = edgeX(i);
          const y1 = cyOf(i) + EDGE_DY;
          const x2 = edgeX(i + 1);
          const y2 = cyOf(i + 1) + EDGE_DY;
          const midX = (x1 + x2) / 2;
          const done = states[i]?.complete;
          return (
            <path
              key={`t${i}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={done ? GREEN : GREEN_DIM}
              strokeWidth={2}
              strokeDasharray="6 8"
              strokeLinecap="round"
              opacity={done ? 0.9 : 0.72}
            />
          );
        })}

        {/* Cubes */}
        {order.map((i) => {
          const step = steps[i];
          const st = states[i] ?? { available: false, complete: false, route: step.route };
          const isCurrent = i === nextIndex;
          const isLast = i === n - 1;
          const cover = catalog.get(`${step.kind}:${step.refId}`)?.coverImage;
          const coverSrc = cover ? coverImageSrc(cover) : undefined;
          const clipId = `clip-${uid}-${i}`;

          return (
            <g key={step.kind + step.refId} transform={`translate(${xOf(i)}, ${cyOf(i)})`}>
              <motion.g
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: st.available ? 1 : 0.55, scale: 1 }}
                transition={{ duration: 0.35 }}
                whileHover={st.available ? { scale: 1.06 } : undefined}
                style={{ cursor: st.available ? 'pointer' : 'default', willChange: 'transform' }}
                onClick={() => st.available && onOpen(i)}
                role="link"
                aria-label={step.title}
              >
                {/* Soft green glow under the cube */}
                <ellipse cx={0} cy={CH + CD + 8} rx={CW * 0.95} ry={10} fill={GREEN} opacity={0.11} filter={`url(#blur-${uid})`} />

                {/* Cube body */}
                <polygon points={LEFT} fill="#0f1726" stroke="#1f2c45" strokeWidth={1} />
                <polygon points={RIGHT} fill="#141f36" stroke="#23304c" strokeWidth={1} />
                <polygon points={TOP} fill="#16223b" />
                <polygon points={TOP} fill={GREEN} opacity={isCurrent ? 0.24 : 0.14} />
                <polygon points={TOP} fill="none" stroke={GREEN} strokeOpacity={0.9} strokeWidth={1.5} />

                {/* Current step: a static green ring marks where you are */}
                {isCurrent && st.available && (
                  <ellipse cx={0} cy={0} rx={CW * 0.82} ry={CH * 0.82} fill="none" stroke={GREEN} strokeWidth={1.5} strokeOpacity={0.5} />
                )}

                {/* Tile contact shadow */}
                <ellipse cx={0} cy={-6} rx={24} ry={6} fill="#03050b" opacity={0.4} filter={`url(#blur-${uid})`} />

                {/* Floating cover tile (square, glassy) */}
                <clipPath id={clipId}>
                  <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} />
                </clipPath>
                {coverSrc ? (
                  <image
                    href={coverSrc}
                    x={TILE_X}
                    y={TILE_Y}
                    width={TS}
                    height={TS}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                  />
                ) : (
                  <>
                    <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} fill="#0e1726" />
                    <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} fill={GREEN} opacity={0.13} />
                    <text x={0} y={TILE_Y + TS / 2 + 10} textAnchor="middle" fill={GREEN} fontSize={32} fontWeight={800} fontFamily="'Poppins', sans-serif" opacity={0.9}>
                      {i + 1}
                    </text>
                  </>
                )}
                {/* Glass sheen + translucent border */}
                <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} fill={`url(#glass-${uid})`} clipPath={`url(#${clipId})`} />
                <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} fill="none" stroke="#ffffff" strokeOpacity={st.available ? 0.34 : 0.16} strokeWidth={1.2} />

                {/* Finish flag on the last cube */}
                {isLast && (
                  <g transform={`translate(${TS / 2 - 8}, ${TILE_Y - 2})`}>
                    <line x1={0} y1={0} x2={0} y2={-18} stroke={GREEN} strokeWidth={1.8} strokeLinecap="round" />
                    <path d="M0,-18 L13,-14 L0,-10 Z" fill={GREEN} />
                  </g>
                )}

                {/* Status badge on the cube face */}
                {st.complete ? (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={12} fill={GREEN} stroke="#070a12" strokeWidth={2} />
                    <path d={`M-5,${CH + CD * 0.5} l3.5,4 l7,-8`} fill="none" stroke="#070a12" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : st.available ? (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={12} fill="#0e1726" stroke={GREEN} strokeWidth={isCurrent ? 2.6 : 2} />
                    <text x={0} y={CH + CD * 0.5 + 4} textAnchor="middle" fill={GREEN} fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                      {i + 1}
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={12} fill="#0e1726" stroke={GREEN_DIM} strokeWidth={2} />
                    <path d={`M-4,${CH + CD * 0.5} v-3 a4,4 0 0 1 8,0 v3`} fill="none" stroke="#6e7a94" strokeWidth={1.7} />
                    <rect x={-5.5} y={CH + CD * 0.5 - 1} width={11} height={8.5} rx={2} fill="#6e7a94" />
                  </g>
                )}

                {/* Labels */}
                <text
                  x={0}
                  y={CH + CD + 26}
                  textAnchor="middle"
                  fill={st.available ? (isCurrent ? '#f3f6ff' : '#e5e9f0') : '#6e7a94'}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="'Poppins', sans-serif"
                >
                  {truncate(step.title)}
                </text>
                {step.subtitle && (
                  <text x={0} y={CH + CD + 41} textAnchor="middle" fill="#8b98ae" fontSize={10.5} fontFamily="'Poppins', sans-serif">
                    {truncate(step.subtitle, 30)}
                  </text>
                )}
              </motion.g>
            </g>
          );
        })}

        <defs>
          <filter id={`blur-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          {/* Glass sheen for the floating tiles */}
          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default PathJourneyMap;
