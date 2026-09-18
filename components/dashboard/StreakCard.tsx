import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { STREAK_TIERS, type StreakInfo } from '../../services/streakService';

/* ─── The daily streak ───
 *
 * Three things stacked, in the order they matter to somebody glancing at it:
 * how long the run is and what it has earned, the ladder of milestones it is
 * climbing, and what today still needs.
 *
 * The ring around the number fills toward the next milestone rather than
 * showing the streak itself, because a streak has no ceiling to measure
 * against and a milestone does.
 */

/** Monday-first day initials for the week pips. */
const WEEK_LABELS: Record<'en' | 'ar', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

/** Days left before a milestone, agreeing with Arabic's number rules: one,
 *  two, a few (3 to 10) and many each take a different form. */
function daysToTier(ar: boolean, n: number, tier: string): string {
  if (!ar) return `${n} ${n === 1 ? 'day' : 'days'} to ${tier}`;
  const days = n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يوما`;
  return `${days} حتى ${tier}`;
}

/** The nudge under today's dots. `started` is false when nothing is done yet,
 *  so neither language says "more" before there is anything to be more than. */
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
  const reduceMotion = useReducedMotion();
  const ar = lang === 'ar';

  const { current, longest, tier, todayCount, dailyGoal, todayDone, week, daysThisWeek, weeklyGoal } =
    streak;

  /* The colour the card takes is the tier just earned, or the one being
     worked toward, so the reward ahead is already visible. A streak that
     has not started stays grey rather than promising anything. */
  const accent = current === 0 ? '#7c8aa6' : tier.current?.color ?? tier.next?.color ?? '#f3a43a';

  const reachedIndex = STREAK_TIERS.reduce((acc, t, i) => (current >= t.days ? i : acc), -1);
  /* The rail is drawn between the first and last dot centres, so a tier's
     position along it is its index, not its day count. */
  const railFill = reachedIndex <= 0 ? 0 : (reachedIndex / (STREAK_TIERS.length - 1)) * 100;

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
        {/* ── The run, and what it has earned ── */}
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
                animate={{ strokeDashoffset: RING_C * (1 - tier.fraction) }}
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
            {tier.current ? (
              <span
                className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em]"
                style={{
                  color: tier.current.color,
                  borderColor: `${tier.current.color}40`,
                  backgroundColor: `${tier.current.color}14`,
                }}
              >
                {tier.current.name[lang]}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-[#263248] bg-[#0d1420] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7c8aa6]">
                {ar ? 'لا وسام بعد' : 'No badge yet'}
              </span>
            )}

            <p className="mt-2.5 text-sm text-[#9aa5bf]">
              {tier.next ? (
                <>
                  <span className="font-bold text-[#f3f6ff]">
                    {daysToTier(ar, tier.toNext, tier.next.name[lang])}
                  </span>
                </>
              ) : (
                <span className="font-bold text-[#f3c84b]">
                  {ar ? 'قمة السلّم، لا شيء بعدها.' : 'Top of the ladder, nothing past this.'}
                </span>
              )}
            </p>

            {tier.next && (
              <p className="mt-1 text-xs text-[#7c8aa6]">
                {ar
                  ? `الوسام القادم عند ${tier.next.days} يوما`
                  : `Next badge at ${tier.next.days} days`}
              </p>
            )}
          </div>
        </div>

        {/* ── The ladder ── */}
        <div className="mt-7 px-1" dir="ltr">
          <div className="relative px-2">
            <div className="absolute inset-x-2 top-[7px] h-0.5 rounded-full bg-[#1c2740]" />
            <motion.div
              className="absolute left-2 top-[7px] h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, #00a859, ${accent})` }}
              initial={{ width: 0 }}
              animate={{ width: `calc((100% - 1rem) * ${railFill / 100})` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: 'easeOut', delay: 0.3 }}
            />
            <div className="relative flex justify-between">
              {STREAK_TIERS.map((t) => {
                const reached = current >= t.days;
                const isNext = tier.next?.days === t.days;
                return (
                  <div key={t.days} className="flex flex-col items-center gap-1.5">
                    <span
                      title={t.name[lang]}
                      className="h-4 w-4 rounded-full border-2 transition-colors"
                      style={{
                        borderColor: reached ? t.color : isNext ? `${t.color}80` : '#263248',
                        backgroundColor: reached ? t.color : '#0d1420',
                        boxShadow: reached ? `0 0 8px ${t.color}70` : undefined,
                      }}
                    />
                    <span
                      className="text-[9px] font-bold tabular-nums"
                      style={{ color: reached ? t.color : isNext ? '#9aa5bf' : '#4a5773' }}
                    >
                      {t.days}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── This week, and what today still needs ── */}
        <div className="mt-7 grid gap-5 border-t border-[#1c2740] pt-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c8aa6]">
                {ar ? 'هذا الأسبوع' : 'This week'}
              </p>
              <span
                className={`text-xs font-bold ${
                  daysThisWeek >= weeklyGoal ? 'text-[#00a859]' : 'text-[#9aa5bf]'
                }`}
                dir="ltr"
                title={ar ? 'هدف الأسبوع' : 'Weekly goal'}
              >
                {daysThisWeek}/{weeklyGoal}
              </span>
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5" dir="ltr">
              {week.map((d, di) => (
                <div
                  key={d.key}
                  title={d.key}
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
              {Array.from({ length: dailyGoal }, (_, i) => {
                const done = i < todayCount;
                return (
                  <div
                    key={i}
                    className={`flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors duration-500 ${
                      done
                        ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                        : 'border-[#263248] bg-[#0d1420] text-[#33415e]'
                    }`}
                  >
                    <Check size={13} />
                  </div>
                );
              })}
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
