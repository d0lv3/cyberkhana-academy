import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Flame, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { STREAK_SEEN_KEY } from '../../services/syncService';
import { PROGRESS_EVENT } from '../../services/progressService';
import { getStreak, STREAK_TIERS, type StreakTier } from '../../services/streakService';

/* ─── The streak milestone card ───
 *
 * Shown once, wherever the learner is, when their streak reaches a tier
 * longer than any this device has celebrated. Mounted at the app root beside
 * the level-up card, and deliberately behind it: passing a level and a
 * milestone on the same day should not stack two cards on top of each other,
 * so this one waits for the next render after the level card is gone.
 *
 * Only ever an improvement on the best already seen, so rebuilding a streak
 * to a tier reached before passes quietly. Like the level card, the first
 * reading on a device is taken as already celebrated: arriving on a new
 * browser with a long streak behind you is not news.
 */

function readSeen(): number | null {
  try {
    const raw = localStorage.getItem(STREAK_SEEN_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function writeSeen(days: number): void {
  try {
    localStorage.setItem(STREAK_SEEN_KEY, String(days));
  } catch {
    /* storage unavailable: at worst the card shows again, which is harmless */
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

/** The tier a streak of `days` has just earned, if any. */
function earnedTier(days: number): StreakTier | null {
  let found: StreakTier | null = null;
  for (const tier of STREAK_TIERS) if (days >= tier.days) found = tier;
  return found;
}

const StreakMilestoneHost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [tier, setTier] = useState<StreakTier | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const ar = lang === 'ar';

  const check = useCallback(() => {
    if (!user || isLoading) return;
    const { current } = getStreak();
    const earned = earnedTier(current);
    if (!earned) return;

    const seen = readSeen();
    if (seen === null) {
      // First reading on this device: nothing here was earned in front of us.
      writeSeen(earned.days);
      return;
    }
    if (earned.days <= seen) return;

    writeSeen(earned.days);
    returnFocus.current = document.activeElement as HTMLElement | null;
    setStreakDays(current);
    setTier(earned);
  }, [user, isLoading]);

  /* Checked on mount and again whenever progress is written, so the card can
     land on the lesson page the moment the third activity tips the day over
     rather than waiting for the dashboard. */
  useEffect(() => {
    check();
    window.addEventListener(PROGRESS_EVENT, check);
    return () => window.removeEventListener(PROGRESS_EVENT, check);
  }, [check]);

  // Signed out while it was open: it belonged to that session.
  useEffect(() => {
    if (!user) setTier(null);
  }, [user]);

  const dismiss = useCallback(() => {
    setTier(null);
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!tier) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tier, dismiss]);

  const next = tier ? STREAK_TIERS[STREAK_TIERS.indexOf(tier) + 1] ?? null : null;
  const color = tier?.color ?? '#f3a43a';

  return (
    <AnimatePresence>
      {tier && (
        <motion.div
          key="streak-milestone"
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
            aria-labelledby="streak-milestone-title"
            aria-describedby="streak-milestone-body"
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
            {/* A faint grid, fading out from behind the flame. */}
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

            {/* Rays turning slowly behind the flame, in the tier's colour. */}
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
                {ar ? 'وسام تتابع' : 'Streak milestone'}
              </motion.span>

              {/* The streak length in a ring of its tier's colour. */}
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
                    {streakDays}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e0b892]">
                    {ar ? 'يوم' : streakDays === 1 ? 'day' : 'days'}
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
                  {ar ? 'وصل تتابعك إلى وسام' : 'Your streak earned'}
                </p>
                <h2 id="streak-milestone-title" className="mt-1.5 text-4xl font-black text-white">
                  {tier.name[lang]}
                </h2>
                <p id="streak-milestone-body" className="mt-3 text-sm text-[#f0dcc6]">
                  {ar ? (
                    <>
                      <span dir="ltr" className="font-bold text-white">
                        {streakDays}
                      </span>{' '}
                      يوما متتاليا من التعلّم.
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-white">{streakDays}</span> days of learning in a row.
                    </>
                  )}
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
                      className="h-9 w-9 flex-shrink-0 rounded-full border-2"
                      style={{ borderColor: `${next.color}80`, backgroundColor: `${next.color}1f` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a483]">
                        {ar ? 'الوسام التالي' : 'Next badge'}
                      </p>
                      <p className="truncate text-sm font-bold text-white">{next.name[lang]}</p>
                    </div>
                    {/* Every badge past the first sits at 14 days or more, and
                        Arabic takes the accusative singular from eleven up. */}
                    <p className="flex-shrink-0 text-xs font-bold text-white" dir="ltr">
                      {next.days} {ar ? 'يوما' : 'days'}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-[#f0dcc6]">
                    {ar
                      ? 'سنة كاملة من التعلّم المتصل. لا وسام بعد هذا.'
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
