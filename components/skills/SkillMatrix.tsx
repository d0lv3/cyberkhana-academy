import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, ShieldCheck, Network, Code2, Terminal, GraduationCap, Lock, Radar } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { getSkillMatrix, type PillarId, type SkillRating } from '../../services/skillMatrixService';

/* Icon + short radar label per pillar (full names live in the service). */
const PILLAR_ICON: Record<PillarId, React.ElementType> = {
  offensive: Swords,
  defensive: ShieldCheck,
  networking: Network,
  programming: Code2,
  systems: Terminal,
  fundamentals: GraduationCap,
};

const PILLAR_SHORT: Record<PillarId, { en: string; ar: string }> = {
  offensive: { en: 'Offensive', ar: 'هجومي' },
  defensive: { en: 'Defensive', ar: 'دفاعي' },
  networking: { en: 'Networking', ar: 'الشبكات' },
  programming: { en: 'Programming', ar: 'البرمجة' },
  systems: { en: 'Systems', ar: 'الأنظمة' },
  fundamentals: { en: 'Fundamentals', ar: 'الأساسيات' },
};

/* ── Radar geometry ── */
const CX = 200;
const CY = 180;
const R = 108; // pixel radius of the 100% ring
const LABEL_R = R + 24; // labels sit OUTSIDE the ring so they never touch the shape

/** Point for a 0-100 data value along an axis (clamped to the ring). */
const polar = (value: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const r = (Math.max(0, Math.min(100, value)) / 100) * R;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

/** Point at an absolute pixel radius (used for labels beyond the ring). */
const polarPx = (radiusPx: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radiusPx * Math.cos(a), y: CY + radiusPx * Math.sin(a) };
};

const SkillMatrix: React.FC<{ variant?: 'full' | 'compact'; className?: string }> = ({
  variant = 'full',
  className = '',
}) => {
  const { lang } = useLang();
  const matrix = useMemo(() => getSkillMatrix(), []);
  const { ratings, index, rank, strongest } = matrix;

  const n = ratings.length;
  const angleFor = (i: number) => -90 + (360 / n) * i;

  const dataPoints = ratings.map((r, i) => polar(r.score, angleFor(i)));
  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const rings = [25, 50, 75, 100];
  const gridPolygon = (val: number) =>
    ratings
      .map((_, i) => {
        const p = polar(val, angleFor(i));
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00a859]/12 border border-[#00a859]/25">
            <Radar size={17} className="text-[#00a859]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f3f6ff] leading-tight">
              {lang === 'ar' ? 'مصفوفة المهارات' : 'Skill Matrix'}
            </h3>
            <p className="text-[11px] text-[#6e7a94]">
              {lang === 'ar'
                ? 'تقييمك عبر ركائز الأمن السيبراني'
                : 'Your proficiency across security pillars'}
            </p>
          </div>
        </div>
        {/* Overall index + rank */}
        <div className="text-end">
          <p className="text-2xl font-black leading-none" style={{ color: rank.color }} dir="ltr">
            {index}
            <span className="text-sm text-[#6e7a94] font-bold">/100</span>
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wide mt-1" style={{ color: rank.color }}>
            {rank.label[lang]}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* ── Radar ── */}
        <div className="flex-shrink-0 flex items-center justify-center p-4 lg:p-5">
          <svg viewBox="0 0 400 380" className="w-full max-w-[360px] h-auto" aria-hidden>
            <defs>
              <radialGradient id="sm-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00a859" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#00a859" stopOpacity="0.12" />
              </radialGradient>
              <filter id="sm-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* grid rings */}
            {rings.map((val) => (
              <polygon
                key={val}
                points={gridPolygon(val)}
                fill="none"
                stroke="#243047"
                strokeWidth={1}
              />
            ))}

            {/* spokes + outer labels (labels live beyond the 100% ring) */}
            {ratings.map((r, i) => {
              const ang = angleFor(i);
              const outer = polar(100, ang);
              const labelPt = polarPx(LABEL_R, ang);
              const cos = Math.cos((ang * Math.PI) / 180);
              const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
              const muted = !r.hasContent;
              return (
                <g key={r.pillar.id}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={muted ? '#1e293b' : `${r.pillar.color}55`}
                    strokeWidth={1}
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    className="text-[11px] font-bold"
                    fill={muted ? '#4d5a73' : r.pillar.color}
                  >
                    {PILLAR_SHORT[r.pillar.id][lang]}
                  </text>
                </g>
              );
            })}

            {/* data shape */}
            {index > 0 && (
              <polygon
                points={dataPolygon}
                fill="url(#sm-fill)"
                stroke="#00a859"
                strokeWidth={2}
                strokeLinejoin="round"
                filter="url(#sm-glow)"
              />
            )}

            {/* vertex dots */}
            {ratings.map((r, i) => {
              const p = dataPoints[i];
              if (!r.hasContent) {
                const at = polar(8, angleFor(i));
                return <circle key={r.pillar.id} cx={at.x} cy={at.y} r={3} fill="#2a3650" />;
              }
              return (
                <circle
                  key={r.pillar.id}
                  cx={p.x}
                  cy={p.y}
                  r={r.score > 0 ? 4.5 : 3}
                  fill={r.pillar.color}
                  stroke="#0d1117"
                  strokeWidth={1.5}
                />
              );
            })}

            {/* center */}
            <circle cx={CX} cy={CY} r={2.5} fill="#3a465c" />
          </svg>
        </div>

        {/* ── Pillar list ── */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-s border-[#1e293b] p-5 space-y-3">
          {ratings.map((r, i) => (
            <PillarRow key={r.pillar.id} r={r} lang={lang} delay={0.05 + i * 0.04} compact={variant === 'compact'} />
          ))}

          {strongest && index > 0 && (
            <p className="text-[11px] text-[#6e7a94] pt-1.5">
              {lang === 'ar' ? 'أقوى مجالاتك: ' : 'Strongest area: '}
              <span className="font-semibold" style={{ color: strongest.pillar.color }}>
                {strongest.pillar.label[lang]}
              </span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── One pillar row: name · tier badge · coverage bar ── */
const PillarRow: React.FC<{
  r: SkillRating;
  lang: 'en' | 'ar';
  delay: number;
  compact: boolean;
}> = ({ r, lang, delay, compact }) => {
  const Icon = PILLAR_ICON[r.pillar.id];
  const muted = !r.hasContent;
  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: muted ? '#161f30' : `${r.pillar.color}18`,
              border: `1px solid ${muted ? '#243047' : `${r.pillar.color}35`}`,
            }}
          >
            <Icon size={13} style={{ color: muted ? '#4d5a73' : r.pillar.color }} />
          </span>
          <span className={`text-sm font-semibold truncate ${muted ? 'text-[#5b6884]' : 'text-[#d2d7e3]'}`}>
            {r.pillar.label[lang]}
          </span>
        </span>
        {muted ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4d5a73] flex-shrink-0">
            <Lock size={10} /> {lang === 'ar' ? 'قريباً' : 'Soon'}
          </span>
        ) : (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
            style={{
              color: r.tier.color,
              backgroundColor: `${r.tier.color}15`,
              border: `1px solid ${r.tier.color}30`,
            }}
          >
            {r.tier.label[lang]}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#0a0f18] overflow-hidden" dir="ltr">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${muted ? 0 : r.score}%` }}
            transition={{ delay, duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: muted ? '#243047' : r.pillar.color }}
          />
        </div>
        {!muted && (
          <span className="text-[11px] font-bold text-[#9aa5bf] tabular-nums w-9 text-end" dir="ltr">
            {r.score}%
          </span>
        )}
      </div>
      {!compact && !muted && (
        <p className="text-[10px] text-[#4d5a73] mt-1" dir="ltr">
          {r.doneItems}/{r.totalItems} · {r.earned.toLocaleString('en-US')} pts
        </p>
      )}
    </div>
  );
};

export default SkillMatrix;
