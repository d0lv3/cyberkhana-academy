import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Network, Terminal } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import type { Journey } from '../../services/journeyService';
import type { TrackProgress } from '../../services/progressService';

/* ─── Where the learner stands, in their own work ───
 *
 * The three fundamentals tracks and, when they have joined one, the path they
 * are on. Every number here is counted from content that exists and lessons
 * they actually finished: a track with nothing published in it says so rather
 * than showing an empty bar and implying they are behind.
 */

const TRACK_META: Record<TrackProgress['key'], { icon: React.ElementType; color: string; label: { en: string; ar: string }; to: string }> = {
  programming: { icon: Code2, color: '#9fef00', label: { en: 'Programming', ar: 'البرمجة' }, to: '/fundamentals/programming' },
  networking: { icon: Network, color: '#60a5fa', label: { en: 'Networking', ar: 'الشبكات' }, to: '/fundamentals/networking' },
  os: { icon: Terminal, color: '#f3a43a', label: { en: 'Operating systems', ar: 'أنظمة التشغيل' }, to: '/fundamentals/operating-systems' },
};

const ProgressStrip: React.FC<{ journey: Journey }> = ({ journey }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const live = journey.tracks.filter((t) => t.total > 0);
  if (live.length === 0 && !journey.path) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5"
      aria-label={ar ? 'تقدمك' : 'Your progress'}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#8592ad]">
          {ar ? 'تقدّمك' : 'Your progress'}
        </h2>
        <p className="text-xs text-[#8592ad]">
          {ar ? (
            <>
              <span className="font-bold text-[#d2d7e3]" dir="ltr">
                {journey.stopsDone.toLocaleString('en-US')}
              </span>{' '}
              درسا مكتملا
            </>
          ) : (
            <>
              <span className="font-bold text-[#d2d7e3]">{journey.stopsDone.toLocaleString('en-US')}</span>{' '}
              {journey.stopsDone === 1 ? 'lesson finished' : 'lessons finished'}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {live.map((track) => {
          const meta = TRACK_META[track.key];
          const Icon = meta.icon;
          const pct = Math.round((track.done / track.total) * 100);
          return (
            <button
              key={track.key}
              onClick={() => navigate(meta.to)}
              className="group min-w-0 rounded-xl p-2 text-start transition-colors hover:bg-[#182235] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon size={14} style={{ color: meta.color }} className="flex-shrink-0" />
                  <span className="truncate text-xs font-semibold text-[#d2d7e3]">{meta.label[lang]}</span>
                </span>
                <span className="flex-shrink-0 text-[11px] font-bold tabular-nums text-[#8592ad]" dir="ltr">
                  {track.done}/{track.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* The path being followed, measured across everything it holds. */}
      {journey.path && (
        <button
          onClick={() => navigate(`/paths/${journey.path!.path.slug}`)}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[#1e293b] bg-[#0e1522]/70 p-3 text-start transition-colors hover:border-[#a78bfa]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/40"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
              {ar ? 'مسارك' : 'Your path'}
            </p>
            <p className="truncate text-sm font-bold text-[#f3f6ff]">
              {journey.path.path.title[lang] || journey.path.path.title.en}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#a78bfa] transition-all duration-700"
                style={{ width: `${journey.path.progress.pct}%` }}
              />
            </div>
          </div>
          <span className="flex-shrink-0 text-sm font-black text-[#a78bfa]" dir="ltr">
            {journey.path.progress.pct}%
          </span>
        </button>
      )}
    </motion.section>
  );
};

export default ProgressStrip;
