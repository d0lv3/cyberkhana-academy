import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Flame, Target, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import {
  STREAK_BREAKPOINTS,
  goalFraction,
  type StreakInfo,
} from '../../services/streakService';
import StreakHeatmap from './StreakHeatmap';

/* ─── The daily streak ───
 *
 * Three things, in the order they matter to somebody glancing at the page:
 * how long the run is and how far it is from the goal they set, the year
 * behind it as a wall of squares, and what today still needs.
 *
 * The ring fills toward the goal rather than showing the streak itself,
 * because a streak has no ceiling to measure against and a goal does. The
 * ticks under the bar are the breakpoints that pay on the way there, which
 * is the answer to "what do I get for this".
 */

/** Monday-first day initials for the week pips. */
const WEEK_LABELS: Record<'en' | 'ar', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

/** How much of the year the heat map can show. A full 53 columns needs about
 *  740px; a phone gets a season instead. Chosen here rather than by rendering
 *  all three and hiding two, which would build 700 cells to throw most away. */
function weeksForWidth(): number {
  if (typeof window === 'undefined') return 53;
  if (window.innerWidth >= 1024) return 53;
  if (window.innerWidth >= 640) return 30;
  return 17;
}

function useHeatmapWeeks(): number {
  const [weeks, setWeeks] = useState(weeksForWidth);
  useEffect(() => {
    // Setting the same number is a no-op re-render, so resize spam is cheap.
    const onResize = () => setWeeks(weeksForWidth());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return weeks;
}

/** Days left, agreeing with Arabic's number rules: one, two, a few (3 to 10)
 *  and many each take a different form. */
function daysLeft(ar: boolean, n: number): string {
  if (!ar) return `${n} ${n === 1 ? 'day' : 'days'} to go`;
  const days = n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يوما`;
  return `${days} متبقية`;
}

/** The nudge under today's slots. `started` is false when nothing is done
 *  yet, so neither language says "more" before there is anything to be more
 *  than. */
function remainingCopy(ar: boolean, remaining: number, started: boolean): string {
  if (ar) {
    const counts: Record<number, string> = {
      1: started ? 'نشاطا واحدا آخر' : 'نشاطا واحدا',
      2: started ? 'نشاطين آخرين' : 'نشاطين',
      3: started ? 'ثلاثة أنشطة أخرى' : 'ثلاثة أنشطة',
    };
    return `أكمل ${counts[remaining] ?? `${remaining} أنشطة`} اليوم للحفاظ على التتابع.`;
  }
  const noun = remaining === 1 ? 'activity' : 'activities';
  return `Finish ${remaining}${started ? ' more' : ''} ${noun} today to keep the streak alive.`;
}

const StreakCard: React.FC<{ streak: StreakInfo }> = ({ streak }) => {
  const { lang } = useLang();
  const { user, updateProfile } = useAuth();
  const reduceMotion = useReducedMotion();
  const ar = lang === 'ar';

  const { current, longest, todayCount, dailyGoal, todayDone, week, days, next } = streak;
  const goal = user?.streakGoal ?? null;
  const [saving, setSaving] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const weeks = useHeatmapWeeks();

  const fraction = goalFraction(current, goal);
  const reachedGoal = goal !== null && current >= goal;
  const accent = current === 0 ? '#7c8aa6' : reachedGoal ? '#f3c84b' : '#00a859';

  const chooseGoal = async (choice: number) => {
    setSaving(choice);
    try {
      await updateProfile({ streakGoal: choice });
      setPicking(false);
    } catch {
      /* The server refused it; the card simply keeps the goal it had. */
    } finally {
      setSaving(null);
    }
  };

  /* Which breakpoints sit on the way to the goal, as fractions along the bar. */
  const ticks = goal
    ? STREAK_BREAKPOINTS.filter((b) => b.days < goal).map((b) => ({
        ...b,
        at: (b.days / goal) * 100,
        earned: current >= b.days,
      }))
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]">
      <div className="flex items-center justify-between border-b border-[#263248] px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#f3f6ff]">
          <Flame size={17} style={{ color: current > 0 ? accent : '#7c8aa6' }} />
          {ar ? 'التتابع اليومي' : 'Daily streak'}
        </h2>
        <span className="text-xs text-[#8592ad]" dir="ltr">
          {ar ? 'الأطول' : 'best'} {longest}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* ── The run, and the goal it is heading for ── */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-6">
          <div className="relative flex-shrink-0" dir="ltr">
            <svg width="124" height="124" viewBox="0 0 124 124" className="-rotate-90">
              <circle cx="62" cy="62" r={RING_R} fill="none" stroke="#1c2740" strokeWidth="8" />
              <motion.circle
                cx="62"
                cy="62"
                r={RING_R}
                fill="none"
                stroke={accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                style={{ filter: `drop-shadow(0 0 6px ${accent}80)` }}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: RING_C * (1 - (goal ? fraction : 0)) }}
                transition={reduceMotion ? { duration: 0 } : { duration: 1.1, ease: 'easeOut', delay: 0.15 }}
              />
            </svg>
            {/* Centred over the ring rather than drawn in it: SVG text takes
                its own anchoring rules under RTL, and this has none. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black leading-none text-[#f3f6ff]">{current}</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7c8aa6]">
                {ar ? 'يوم' : current === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {goal === null || picking ? (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#9aa5bf]">
                  <Target size={13} />
                  {ar ? 'اختر هدفك' : 'Pick your goal'}
                </p>
                <p className="mt-1.5 text-xs text-[#7c8aa6]">
                  {ar
                    ? 'تكسب نقاطا عند كل محطة في الطريق، وليس عند الهدف وحده.'
                    : 'You earn points at every stop along the way, not only at the goal.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
                  {STREAK_BREAKPOINTS.map((b) => (
                    <button
                      key={b.days}
                      type="button"
                      disabled={saving !== null}
                      onClick={() => chooseGoal(b.days)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                        goal === b.days
                          ? 'border-[#00a859]/50 bg-[#00a859]/15 text-[#00a859]'
                          : 'border-[#263248] bg-[#0d1420] text-[#d2d7e3] hover:border-[#00a859]/40 hover:text-[#00a859]'
                      }`}
                    >
                      {b.days} {ar ? 'يوم' : 'days'}
                      <span className="ms-1.5 font-mono text-[10px] text-[#8592ad]">
                        +{b.points.toLocaleString('en-US')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#9aa5bf]">
                    <Target size={13} />
                    {ar ? `الهدف ${goal} يوما` : `Goal: ${goal} days`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="text-[11px] font-semibold text-[#7c8aa6] underline-offset-2 transition-colors hover:text-[#00a859] hover:underline"
                  >
                    {ar ? 'تغيير' : 'Change'}
                  </button>
                </div>

                <p className="mt-1.5 text-sm font-bold text-[#f3f6ff]">
                  {reachedGoal
                    ? ar
                      ? 'بلغت هدفك.'
                      : 'Goal reached.'
                    : daysLeft(ar, goal - current)}
                </p>

                {/* The bar to the goal, with a tick at every breakpoint that
                    pays on the way. A filled tick has already been banked. */}
                <div className="relative mt-3 h-2 rounded-full bg-[#0a0f18]" dir="ltr">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, #00a859, ${accent})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(fraction * 100)}%` }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                  />
                  {ticks.map((t) => (
                    <span
                      key={t.days}
                      title={`${t.days} days: +${t.points} XP`}
                      className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full"
                      style={{
                        left: `${t.at}%`,
                        backgroundColor: t.earned ? '#9fef00' : '#3a4763',
                      }}
                    />
                  ))}
                </div>

                {next && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-[#8592ad]" dir="ltr">
                    <Zap size={11} className="text-[#f3a43a]" />
                    {ar
                      ? `${next.days} يوما تمنحك ${next.points.toLocaleString('en-US')} نقطة`
                      : `${next.days} days pays ${next.points.toLocaleString('en-US')} XP`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── The year behind it ── */}
        <div className="mt-6 border-t border-[#1c2740] pt-5">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c8aa6]">
            {ar ? 'سجل النشاط' : 'Activity'}
          </p>
          <StreakHeatmap days={days} lang={lang} weeks={weeks} />
        </div>

        {/* ── This week, and what today still needs ── */}
        <div className="mt-6 grid gap-5 border-t border-[#1c2740] pt-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c8aa6]">
              {ar ? 'هذا الأسبوع' : 'This week'}
            </p>
            <div className="flex items-center gap-1 xs:gap-1.5" dir="ltr">
              {week.map((d, di) => (
                <div
                  key={d.key}
                  title={`${d.key}: ${d.count}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold transition-colors xs:h-8 xs:w-8 ${
                    d.done
                      ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                      : d.isToday
                      ? 'border-[#f3a43a]/40 bg-[#f3a43a]/10 text-[#f3a43a]'
                      : d.isFuture
                      ? 'border-[#1c2740] bg-[#0d1420] text-[#33415e]'
                      : 'border-[#263248] bg-[#0d1420] text-[#7c8aa6]'
                  }`}
                >
                  {d.done ? <Check size={13} /> : WEEK_LABELS[lang][di]}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c8aa6]">
                {ar ? 'نشاط اليوم' : 'Today'}
              </p>
              <span
                className={`text-xs font-bold ${todayDone ? 'text-[#00a859]' : 'text-[#f3a43a]'}`}
                dir="ltr"
              >
                {Math.min(todayCount, dailyGoal)}/{dailyGoal}
              </span>
            </div>
            <div className="flex items-center gap-1.5" dir="ltr">
              {Array.from({ length: dailyGoal }, (_, i) => (
                <div
                  key={i}
                  className={`flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors duration-500 ${
                    i < todayCount
                      ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                      : 'border-[#263248] bg-[#0d1420] text-[#33415e]'
                  }`}
                >
                  <Check size={13} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-[#8592ad]">
          {todayDone
            ? ar
              ? 'تم التسجيل اليوم، أحسنت.'
              : 'Today is logged, nice work.'
            : remainingCopy(ar, dailyGoal - todayCount, todayCount > 0)}
        </p>
      </div>
    </div>
  );
};

export default StreakCard;
