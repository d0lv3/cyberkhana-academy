import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Target } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import SectionHeading from './SectionHeading';
import { SKILL_PILLARS } from '../../services/skillMatrixService';

/* ── Radar geometry (mirrors components/skills/SkillMatrix.tsx) ── */
const CX = 150;
const CY = 140;
const R = 88;
const LABEL_R = R + 22;

const polar = (value: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const r = (Math.max(0, Math.min(100, value)) / 100) * R;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};
const polarPx = (radiusPx: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radiusPx * Math.cos(a), y: CY + radiusPx * Math.sin(a) };
};

/* Illustrative scores per pillar — a believable mid-journey learner.
 * Order matches SKILL_PILLARS: offensive, defensive, networking, programming, systems, fundamentals. */
const SAMPLE_SCORES = [60, 45, 85, 75, 55, 92];
const SAMPLE_INDEX = Math.round(SAMPLE_SCORES.reduce((a, b) => a + b, 0) / SAMPLE_SCORES.length);

const PILLAR_SHORT: Record<string, { en: string; ar: string }> = {
  offensive: { en: 'Offensive', ar: 'هجومي' },
  defensive: { en: 'Defensive', ar: 'دفاعي' },
  networking: { en: 'Networking', ar: 'الشبكات' },
  programming: { en: 'Programming', ar: 'البرمجة' },
  systems: { en: 'Systems', ar: 'الأنظمة' },
  fundamentals: { en: 'Fundamentals', ar: 'الأساسيات' },
};

const ShowcaseRadar: React.FC<{ lang: 'en' | 'ar' }> = ({ lang }) => {
  const n = SKILL_PILLARS.length;
  const angleFor = (i: number) => -90 + (360 / n) * i;
  const dataPoints = SAMPLE_SCORES.map((s, i) => polar(s, angleFor(i)));
  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const rings = [25, 50, 75, 100];
  const gridPolygon = (val: number) =>
    SKILL_PILLARS.map((_, i) => {
      const p = polar(val, angleFor(i));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  return (
    <svg viewBox="0 0 300 280" className="w-full max-w-[320px] h-auto" aria-hidden>
      <defs>
        <radialGradient id="sps-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00a859" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#00a859" stopOpacity="0.1" />
        </radialGradient>
        <filter id="sps-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {rings.map((val) => (
        <polygon key={val} points={gridPolygon(val)} fill="none" stroke="#243047" strokeWidth={1} />
      ))}

      {SKILL_PILLARS.map((pillar, i) => {
        const ang = angleFor(i);
        const outer = polar(100, ang);
        const labelPt = polarPx(LABEL_R, ang);
        const cos = Math.cos((ang * Math.PI) / 180);
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
        return (
          <g key={pillar.id}>
            <line x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke={`${pillar.color}55`} strokeWidth={1} />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="text-[10px] font-bold"
              fill={pillar.color}
            >
              {PILLAR_SHORT[pillar.id][lang]}
            </text>
          </g>
        );
      })}

      <motion.polygon
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        points={dataPolygon}
        fill="url(#sps-fill)"
        stroke="#00a859"
        strokeWidth={2}
        strokeLinejoin="round"
        filter="url(#sps-glow)"
      />

      {SKILL_PILLARS.map((pillar, i) => {
        const p = dataPoints[i];
        return <circle key={pillar.id} cx={p.x} cy={p.y} r={4} fill={pillar.color} stroke="#0d1117" strokeWidth={1.5} />;
      })}
      <circle cx={CX} cy={CY} r={2.5} fill="#3a465c" />
    </svg>
  );
};

const SkillProgressionSection: React.FC = () => {
  const { t, lang } = useLang();

  const points = [
    { icon: Layers, title: t('skills.point1.title'), desc: t('skills.point1.desc') },
    { icon: Target, title: t('skills.point2.title'), desc: t('skills.point2.desc') },
  ];

  return (
    <section className="relative px-6 py-24 md:py-32 bg-[#0d1117] overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-[20%] w-80 h-80 rounded-full bg-[#00a859]/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-[15%] w-72 h-72 rounded-full bg-[#60a5fa]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeading heading={t('skills.heading')} subtitle={t('skills.subtitle')} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mt-16 items-center">
          {/* ── Matrix card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-[#263248] bg-[#121a2a]/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-end gap-4 px-6 pt-5 pb-4 border-b border-[#1e293b]">
              <div className="text-end" dir="ltr">
                <span className="text-2xl font-black leading-none text-[#9fef00]">
                  {SAMPLE_INDEX}
                  <span className="text-sm text-[#6e7a94] font-bold">/100</span>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center p-5">
              <ShowcaseRadar lang={lang} />
            </div>
          </motion.div>

          {/* ── Copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-6">
              {points.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#00a859]/10 border border-[#00a859]/25">
                    <p.icon size={20} className="text-[#00a859]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#f3f6ff] mb-1">{p.title}</h3>
                    <p className="text-[#9aa5bf] text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SkillProgressionSection;
