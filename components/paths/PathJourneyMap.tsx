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

/* ── Layout ── */
const VBW = 680;
const LEFT_X = 214;
const RIGHT_X = 466;
const ROW_GAP = 120;
const TOP_PAD = 128;
const BOTTOM_PAD = 104;

/* ── Isometric cube geometry (top-face half-width/height, side depth) ── */
const CW = 46;
const CH = 26;
const CD = 26;
const TOP = `0,${-CH} ${CW},0 0,${CH} ${-CW},0`;
const LEFT = `${-CW},0 0,${CH} 0,${CH + CD} ${-CW},${CD}`;
const RIGHT = `0,${CH} ${CW},0 ${CW},${CD} 0,${CH + CD}`;

/* Floating cover tile — square resting just on the cube's top face */
const TS = 80;
const TILE_X = -TS / 2;
const TILE_Y = -102;
const TILE_R = 12;

const xOf = (i: number) => (i % 2 === 0 ? LEFT_X : RIGHT_X);

function truncate(s: string, n = 22): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/**
 * PathJourneyMap — the path's curriculum as a climbing road of floating
 * isometric cubes, alternating left/right up toward the finish. Each cube
 * carries the referenced module's cover (module steps) or an accent tile with
 * the step number; dashed trails link them and light up green as steps are
 * completed. Desktop-only; the detail page keeps a vertical list for mobile.
 */
const PathJourneyMap: React.FC<PathJourneyMapProps> = ({ steps, states, nextIndex, color, onOpen }) => {
  const uid = useId().replace(/:/g, '');
  const catalog = useMemo(() => buildCatalogIndex(), []);
  const n = steps.length;
  const cyOf = (i: number) => TOP_PAD + (n - 1 - i) * ROW_GAP;
  const totalH = TOP_PAD + Math.max(0, n - 1) * ROW_GAP + BOTTOM_PAD;

  // Draw far (top) cubes first so nearer (bottom) ones overlap them.
  const order = Array.from({ length: n }, (_, i) => i).reverse();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#0a0f18]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(520px circle at 62% 6%, rgba(0,168,89,0.10), transparent 55%), radial-gradient(420px circle at 20% 88%, rgba(96,165,250,0.05), transparent 55%)',
        }}
      />
      <svg viewBox={`0 0 ${VBW} ${totalH}`} className="relative mx-auto h-auto w-full max-w-[860px]" role="img" aria-label="Learning path journey">
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

        {/* Ambient stars */}
        {[
          [70, 74, 1.2], [280, 52, 1], [560, 120, 1.2], [500, 40, 1], [150, 196, 1.1], [610, 170, 1], [120, 132, 1.2],
        ].map(([x, y, r], i) => (
          <circle key={`s${i}`} cx={x} cy={y} r={r} fill="#3d4f73">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2.6 + (i % 4) * 0.8}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Climbing trails (drawn under the cubes) */}
        {steps.slice(0, -1).map((_, i) => {
          const x1 = xOf(i);
          const y1 = cyOf(i) - CH;
          const x2 = xOf(i + 1);
          const y2 = cyOf(i + 1) + CH + CD;
          const midY = (y1 + y2) / 2;
          const done = states[i]?.complete;
          return (
            <path
              key={`t${i}`}
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              stroke={done ? '#00a859' : '#33415e'}
              strokeWidth={2}
              strokeDasharray="6 8"
              strokeLinecap="round"
              opacity={done ? 0.9 : 0.72}
            >
              <animate attributeName="stroke-dashoffset" from="28" to="0" dur="2.6s" repeatCount="indefinite" />
            </path>
          );
        })}

        {/* Cubes */}
        {order.map((i) => {
          const step = steps[i];
          const st = states[i] ?? { available: false, complete: false, route: step.route };
          const isCurrent = i === nextIndex;
          const isLast = i === n - 1;
          const accent = step.accent || color;
          const cover = catalog.get(`${step.kind}:${step.refId}`)?.coverImage;
          const coverSrc = cover ? coverImageSrc(cover) : undefined;
          const clipId = `clip-${uid}-${i}`;
          const bob = 6.2 + (i % 5) * 0.6;

          return (
            <g key={step.kind + step.refId} transform={`translate(${xOf(i)}, ${cyOf(i)})`}>
              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: st.available ? 1 : 0.55, scale: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.35 },
                  y: { delay: 0.15 * (i % 5), duration: bob, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={st.available ? { scale: 1.06 } : undefined}
                style={{ cursor: st.available ? 'pointer' : 'default', willChange: 'transform' }}
                onClick={() => st.available && onOpen(i)}
                role="link"
                aria-label={step.title}
              >
                {/* Soft glow under the cube */}
                <ellipse cx={0} cy={CH + CD + 6} rx={CW * 0.95} ry={9} fill={accent} opacity={0.1} filter={`url(#blur-${uid})`} />

                {/* Cube body */}
                <polygon points={LEFT} fill="#0f1726" stroke="#1f2c45" strokeWidth={1} />
                <polygon points={RIGHT} fill="#141f36" stroke="#23304c" strokeWidth={1} />
                <polygon points={TOP} fill="#16223b" />
                <polygon points={TOP} fill={accent} opacity={isCurrent ? 0.22 : 0.13} />
                <polygon points={TOP} fill="none" stroke={accent} strokeOpacity={0.85} strokeWidth={1.4} />

                {/* Current step: pulsing beacon on the top face */}
                {isCurrent && st.available && (
                  <ellipse cx={0} cy={0} rx={CW * 0.7} ry={CH * 0.7} fill="none" stroke={accent} strokeWidth={1.4}>
                    <animate attributeName="rx" values={`${CW * 0.4};${CW * 0.98}`} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="ry" values={`${CH * 0.4};${CH * 0.98}`} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.55;0" dur="3s" repeatCount="indefinite" />
                  </ellipse>
                )}

                {/* Tile contact shadow */}
                <ellipse cx={0} cy={-6} rx={20} ry={5} fill="#03050b" opacity={0.4} filter={`url(#blur-${uid})`} />

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
                    <rect x={TILE_X} y={TILE_Y} width={TS} height={TS} rx={TILE_R} fill={accent} opacity={0.12} />
                    <text x={0} y={TILE_Y + TS / 2 + 9} textAnchor="middle" fill={accent} fontSize={30} fontWeight={800} fontFamily="'Poppins', sans-serif" opacity={0.85}>
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
                    <line x1={0} y1={0} x2={0} y2={-18} stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
                    <path d="M0,-18 L12,-14 L0,-10 Z" fill={accent} />
                  </g>
                )}

                {/* Status badge on the cube face */}
                {st.complete ? (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={11} fill="#00a859" stroke="#0a0f18" strokeWidth={2} />
                    <path d={`M-4.5,${CH + CD * 0.5} l3,3.5 l6,-7`} fill="none" stroke="#0a0f18" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : st.available ? (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={11} fill="#0e1726" stroke={accent} strokeWidth={isCurrent ? 2.4 : 1.8} />
                    <text x={0} y={CH + CD * 0.5 + 4} textAnchor="middle" fill={accent} fontSize={11} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                      {i + 1}
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle cx={0} cy={CH + CD * 0.5} r={11} fill="#0e1726" stroke="#33415e" strokeWidth={1.8} />
                    <path d={`M-3.5,${CH + CD * 0.5} v-2.5 a3.5,3.5 0 0 1 7,0 v2.5`} fill="none" stroke="#6e7a94" strokeWidth={1.6} />
                    <rect x={-5} y={CH + CD * 0.5 - 1} width={10} height={8} rx={2} fill="#6e7a94" />
                  </g>
                )}

                {/* Labels */}
                <text
                  x={0}
                  y={CH + CD + 24}
                  textAnchor="middle"
                  fill={st.available ? (isCurrent ? '#f3f6ff' : '#e5e9f0') : '#6e7a94'}
                  fontSize={11.5}
                  fontWeight={700}
                  fontFamily="'Poppins', sans-serif"
                >
                  {truncate(step.title)}
                </text>
                {step.subtitle && (
                  <text x={0} y={CH + CD + 39} textAnchor="middle" fill="#8b98ae" fontSize={10} fontFamily="'Poppins', sans-serif">
                    {truncate(step.subtitle, 30)}
                  </text>
                )}
              </motion.g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default PathJourneyMap;
