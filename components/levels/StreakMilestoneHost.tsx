import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Flame, X, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import {
  STREAK_AWARD_EVENT,
  STREAK_SEEN_KEY,
  type StreakAwardDetail,
} from '../../services/syncService';
import { STREAK_BREAKPOINTS, breakpointFor } from '../../services/streakService';

/* ─── The streak reward card ───
 *
 * Shown once, wherever the learner is, when the server pays a streak
 * breakpoint. The server decides that, because it is the only side that can
 * vouch for the days behind it, and it says so in its answer to a push: the
 * sync service turns that into STREAK_AWARD_EVENT and this catches it.
 *
 * It also catches up at mount, from the rungs the session says have been
 * paid, so a payment made while the tab was closed or the answer was lost is
 * not silently missed. The first reading on a device marks everything as seen
 * without showing anything: arriving on a new browser with a long streak
 * already behind you is not an occasion.
 *
 * Mounted at the app root beside the level-up card and deliberately below it,
 * so passing a level and a breakpoint at once does not stack two cards.
 */

function readSeen(): number[] | null {
  try {
    const raw = localStorage.getItem(STREAK_SEEN_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : null;
  } catch {
    return null;
  }
}

function markSeen(days: number[]): void {
  try {
    const seen = readSeen() ?? [];
    const merged = [...new Set([...seen, ...days])].sort((a, b) => a - b);
    localStorage.setItem(STREAK_SEEN_KEY, JSON.stringify(merged));
  } catch {
    /* storage unavailable: at worst the card shows again */
  }
}

/** Embers drifting up the card: position, size, pace. */
const EMBERS = [
  { left: '10%', size: 3, rise: 250, duration: 3.5, delay: 0.3 },
  { left: '21%', size: 2, rise: 310, duration: 4.3, delay: 1.5 },
  { left: '33%', size: 4, rise: 270, duration: 3.8, delay: 0.8 },
  { left: '44%', size: 2, rise: 330, duration: 4.7, delay: 2.0 },
  { left: '56%', size: 3, rise: 290, duration: 4.0, delay: 0.2 },
  { left: '67%', size: 2, rise: 320, duration: 4.5, delay: 1.2 },
  { left: '79%', size: 4, rise: 260, duration: 3.6, delay: 1.9 },
  { left: '90%', size: 2, rise: 300, duration: 4.2, delay: 0.6 },
];

interface Shown {
  /** The highest rung this card is for. */
  days: number;
  /** XP it paid, including any lower rung cleared at the same time. */
  xp: number;
  /** The streak that earned it. */
  streak: number;
}

const StreakMilestoneHost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState<Shown | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const ar = lang === 'ar';

  const open = useCallback((days: number[], xp: number, streak: number) => {
    if (!days.length) return;
    const highest = Math.max(...days);
    markSeen(days);
    returnFocus.current = document.activeElement as HTMLElement | null;
    setShown({ days: highest, xp, streak });
  }, []);

  /* Paid just now, on whatever page the learner is on. */
  useEffect(() => {
    const onAward = (e: Event) => {
      const detail = (e as CustomEvent<StreakAwardDetail>).detail;
      if (!detail?.days?.length) return;
      if (readSeen() === null) {
        // Nothing has been seen on this device yet; take it as known.
        markSeen(detail.days);
        return;
      }
      const fresh = detail.days.filter((d) => !(readSeen() ?? []).includes(d));
      if (fresh.length) open(fresh, detail.xp, detail.streak);
    };
    window.addEventListener(STREAK_AWARD_EVENT, onAward);
    return () => window.removeEventListener(STREAK_AWARD_EVENT, onAward);
  }, [open]);

  /* Paid earlier, and never shown here. */
  useEffect(() => {
    if (!user || isLoading) return;
    const paid = user.streakAwarded ?? [];
    if (!paid.length) return;
    const seen = readSeen();
    if (seen === null) {
      markSeen(paid);
      return;
    }
    const fresh = paid.filter((d) => !seen.includes(d));
    if (!fresh.length) return;
    const xp = fresh.reduce((sum, d) => sum + (breakpointFor(d)?.points ?? 0), 0);
    open(fresh, xp, Math.max(...fresh));
  }, [user, isLoading, open]);

  // Signed out while it was open: it belonged to that session.
  useEffect(() => {
    if (!user) setShown(null);
  }, [user]);

  const dismiss = useCallback(() => {
    setShown(null);
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown, dismiss]);

  const next = shown ? STREAK_BREAKPOINTS.find((b) => b.days > shown.days) ?? null : null;
  const color = shown && shown.days >= 365 ? '#f3c84b' : '#9fef00';

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key="streak-reward"
          className="fixed inset-0 z-[74] flex items-center justify-center p-4"
          dir={ar ? 'rtl' : 'ltr'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div aria-hidden className="absolute inset-0 bg-[#0a0603]/80 backdrop-blur-md" onClick={dismiss} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="streak-reward-title"
            aria-describedby="streak-reward-body"
            className="relative w-full max-w-[25rem] overflow-hidden rounded-[28px] border"
            style={{
              borderColor: `${color}59`,
              background:
                'radial-gradient(120% 75% at 50% 0%, #46240c 0%, #33190a 36%, #1f1006 70%, #140a04 100%)',
              boxShadow: `0 40px 120px -30px ${color}73, 0 0 0 1px rgba(243,164,58,0.05) inset`,
            }}
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.09]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(243,164,58,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(243,164,58,0.55) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%, black 0%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%, black 0%, transparent 100%)',
              }}
            />

            <div aria-hidden className="pointer-events-none absolute left-1/2 top-[148px] h-0 w-0">
              <motion.div
                className="absolute -left-[260px] -top-[260px] h-[520px] w-[520px] rounded-full"
                style={{
                  background: `repeating-conic-gradient(from 0deg, ${color}30 0deg 5deg, transparent 5deg 16deg)`,
                  maskImage: 'radial-gradient(circle, black 0%, transparent 60%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 60%)',
                }}
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 48, ease: 'linear', repeat: Infinity }}
              />
            </div>

            {!reduceMotion &&
              EMBERS.map((ember, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: ember.left,
                    bottom: -6,
                    width: ember.size,
                    height: ember.size,
                    background: i % 3 === 0 ? color : '#f3a43a',
                    boxShadow: `0 0 8px ${i % 3 === 0 ? color : '#f3a43a'}`,
                  }}
                  animate={{ y: [0, -ember.rise], opacity: [0, 0.9, 0] }}
                  transition={{ duration: ember.duration, delay: ember.delay, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}

            <button
              type="button"
              onClick={dismiss}
              aria-label={ar ? 'إغلاق' : 'Close'}
              className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[#e0b892] transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative flex flex-col items-center px-7 pb-7 pt-9 text-center">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ borderColor: `${color}4d`, backgroundColor: `${color}1a`, color }}
              >
                <Flame size={13} />
                {ar ? 'محطة تتابع' : 'Streak reward'}
              </motion.span>

              <motion.div
                className="relative mt-6 flex h-40 w-40 items-center justify-center"
                initial={reduceMotion ? { opacity: 0 } : { scale: 0.3, rotate: -14, opacity: 0 }}
                animate={reduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 170, damping: 13, delay: 0.28 }}
              >
                <div aria-hidden className="absolute inset-5 rounded-full blur-2xl" style={{ background: color, opacity: 0.45 }} />
                <div
                  className="relative flex h-full w-full flex-col items-center justify-center rounded-full border-4"
                  style={{
                    borderColor: color,
                    background: 'radial-gradient(circle at 50% 35%, rgba(0,0,0,0.25), rgba(0,0,0,0.6))',
                    boxShadow: `0 0 40px ${color}66, inset 0 0 30px ${color}33`,
                  }}
                >
                  <Flame size={26} style={{ color }} />
                  <span dir="ltr" className="mt-1 text-5xl font-black leading-none text-white">
                    {shown.streak}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e0b892]">
                    {ar ? 'يوم' : shown.streak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <p className="mt-5 text-sm text-[#e8c9a8]">
                  {ar ? `تتابع ${shown.days} يوما` : `${shown.days} day streak`}
                </p>
                <h2
                  id="streak-reward-title"
                  dir="ltr"
                  className="mt-1.5 flex items-center gap-2 text-4xl font-black"
                  style={{ color }}
                >
                  <Zap size={28} />+{shown.xp.toLocaleString('en-US')} XP
                </h2>
                <p id="streak-reward-body" className="mt-3 text-sm text-[#f0dcc6]">
                  {ar
                    ? 'أضيفت إلى رصيدك، وتحتسب في مستواك وترتيبك.'
                    : 'Added to your total. It counts toward your level and your rank.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62 }}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-start"
              >
                {next ? (
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/15 text-[#e0b892]"
                    >
                      <Flame size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a483]">
                        {ar ? 'المحطة التالية' : 'Next reward'}
                      </p>
                      {/* Every rung past the first is 14 days or more, and
                          Arabic takes the accusative singular from eleven up. */}
                      <p className="truncate text-sm font-bold text-white">
                        {next.days} {ar ? 'يوما' : 'days'}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-xs font-bold text-white" dir="ltr">
                      +{next.points.toLocaleString('en-US')} XP
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-[#f0dcc6]">
                    {ar
                      ? 'سنة كاملة من التعلّم المتصل. لا محطة بعد هذه.'
                      : 'A full year of unbroken learning. There is nothing past this one.'}
                  </p>
                )}
              </motion.div>

              <button
                type="button"
                autoFocus
                onClick={dismiss}
                className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold text-[#1b0d02] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ background: color }}
              >
                {ar ? 'تابع التعلّم' : 'Keep it going'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakMilestoneHost;
