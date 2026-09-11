import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronsUp, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useXp } from '../../services/xpService';
import { LEVEL_SEEN_KEY } from '../../services/syncService';
import LevelEmblem from './LevelEmblem';
import { levelColor } from '../ui/LevelBadge';

/* ─── The level-up card ───
 *
 * Shown once, on whatever page the learner is on, when their level passes the
 * highest one this device has celebrated. Mounted at the app root like the
 * other one-off notices, above a lesson's full-screen view and the feedback
 * prompt that finishing a module opens, so the moment is not lost under them.
 *
 * Never on signing in: the first level this device sees is taken as already
 * celebrated, and a new device takes the server's level (syncService,
 * rememberLevelReached), so pulling progress down is not mistaken for
 * progress made. Several levels at once show as the highest of them.
 */

function readSeen(): number | null {
  try {
    const raw = localStorage.getItem(LEVEL_SEEN_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? n : null;
  } catch {
    return null;
  }
}

function writeSeen(level: number): void {
  try {
    localStorage.setItem(LEVEL_SEEN_KEY, String(level));
  } catch {
    /* storage unavailable: the card may show again, which is harmless */
  }
}

/** Sparks rising through the card: position, size, pace. */
const SPARKS = [
  { left: '8%', size: 3, rise: 260, duration: 3.6, delay: 0.2 },
  { left: '17%', size: 2, rise: 320, duration: 4.4, delay: 1.4 },
  { left: '26%', size: 4, rise: 280, duration: 3.9, delay: 0.7 },
  { left: '38%', size: 2, rise: 340, duration: 4.8, delay: 2.1 },
  { left: '47%', size: 3, rise: 300, duration: 4.1, delay: 0.1 },
  { left: '58%', size: 2, rise: 330, duration: 4.6, delay: 1.1 },
  { left: '66%', size: 4, rise: 270, duration: 3.7, delay: 1.8 },
  { left: '75%', size: 2, rise: 310, duration: 4.3, delay: 0.5 },
  { left: '84%', size: 3, rise: 290, duration: 3.8, delay: 2.4 },
  { left: '92%', size: 2, rise: 330, duration: 4.5, delay: 0.9 },
];

const LevelUpHost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { xp, level } = useXp();
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const ar = lang === 'ar';
  const number = level.level.number;

  useEffect(() => {
    if (!user || isLoading) return;
    const seen = readSeen();
    if (seen === null) {
      writeSeen(number);
      return;
    }
    if (number <= seen) return;
    writeSeen(number);
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, [user, isLoading, number]);

  // Signed out while it was open: it belonged to that session.
  useEffect(() => {
    if (!user) setOpen(false);
  }, [user]);

  const dismiss = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus?.();
  }, []);

  const seeAllLevels = () => {
    setOpen(false);
    navigate('/dashboard', { state: { focus: 'levels' } });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  const current = level.level;
  const next = level.next;
  const color = levelColor(current);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="level-up"
          className="fixed inset-0 z-[75] flex items-center justify-center p-4"
          dir={ar ? 'rtl' : 'ltr'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div aria-hidden className="absolute inset-0 bg-[#020a06]/80 backdrop-blur-md" onClick={dismiss} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
            aria-describedby="level-up-body"
            className="relative w-full max-w-[25rem] overflow-hidden rounded-[28px] border"
            style={{
              borderColor: 'rgba(0,168,89,0.35)',
              background:
                'radial-gradient(120% 75% at 50% 0%, #145c38 0%, #0c3d25 36%, #07261a 70%, #041a10 100%)',
              boxShadow: `0 40px 120px -30px ${color}73, 0 0 0 1px rgba(159,239,0,0.05) inset`,
            }}
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
          >
            {/* A faint grid, fading out from behind the emblem. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.09]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(159,239,0,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.55) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%, black 0%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 28%, black 0%, transparent 100%)',
              }}
            />

            {/* Rays turning slowly behind the emblem, in the level's colour. */}
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-[150px] h-0 w-0">
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

            {/* Sparks rising through the card. */}
            {!reduceMotion &&
              SPARKS.map((spark, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: spark.left,
                    bottom: -6,
                    width: spark.size,
                    height: spark.size,
                    background: i % 3 === 0 ? color : '#9fef00',
                    boxShadow: `0 0 8px ${i % 3 === 0 ? color : '#9fef00'}`,
                  }}
                  animate={{ y: [0, -spark.rise], opacity: [0, 0.9, 0] }}
                  transition={{ duration: spark.duration, delay: spark.delay, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}

            <button
              type="button"
              onClick={dismiss}
              aria-label={ar ? 'إغلاق' : 'Close'}
              className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[#9fcfb3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative flex flex-col items-center px-7 pb-7 pt-9 text-center">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#9fef00]/30 bg-[#9fef00]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9fef00]"
              >
                <ChevronsUp size={13} />
                {ar ? 'مستوى جديد' : 'Level up'}
              </motion.span>

              <motion.div
                className="relative mt-5"
                initial={reduceMotion ? { opacity: 0 } : { scale: 0.3, rotate: -14, opacity: 0 }}
                animate={reduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 170, damping: 13, delay: 0.28 }}
              >
                <div aria-hidden className="absolute inset-6 rounded-full blur-2xl" style={{ background: color, opacity: 0.4 }} />
                <LevelEmblem
                  level={current}
                  lang={lang}
                  size="lg"
                  eager
                  decorative
                  className="relative h-44 w-44 drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <p className="mt-4 text-sm text-[#a7d9bd]">{ar ? 'وصلت إلى المستوى' : 'You reached level'}</p>
                <h2 id="level-up-title" className="mt-1 flex flex-col items-center leading-none">
                  <span dir="ltr" className="font-mono text-2xl font-black" style={{ color }}>
                    {current.hex}
                  </span>
                  <span className="mt-1.5 text-4xl font-black text-white">{current.name[lang]}</span>
                </h2>
                <p id="level-up-body" className="mt-3 text-sm text-[#cfe9da]">
                  {ar ? (
                    <>
                      مجموع نقاط خبرتك الآن{' '}
                      <span dir="ltr" className="font-bold text-white">
                        {xp.toLocaleString('en-US')} XP
                      </span>
                    </>
                  ) : (
                    <>
                      You now have <span className="font-bold text-white">{xp.toLocaleString('en-US')} XP</span>.
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
                  <>
                    <div className="flex items-center gap-3">
                      <LevelEmblem level={next} lang={lang} decorative className="h-10 w-10 opacity-70 grayscale-[40%]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7fb89a]">
                          {ar ? 'المستوى التالي' : 'Next level'}
                        </p>
                        <p className="truncate text-sm font-bold text-white">
                          <span dir="ltr" className="font-mono">
                            {next.hex}
                          </span>{' '}
                          {next.name[lang]}
                        </p>
                      </div>
                      <p className="flex-shrink-0 text-xs font-bold text-white" dir="ltr">
                        {next.minXp.toLocaleString('en-US')} XP
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40" dir="ltr">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(level.fraction * 100)}%` }}
                        transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#a7d9bd]">
                      {ar ? (
                        <>
                          تبقّى <span dir="ltr">{level.toNext.toLocaleString('en-US')} XP</span>
                        </>
                      ) : (
                        <>{level.toNext.toLocaleString('en-US')} XP to go</>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-center text-sm text-[#cfe9da]">
                    {ar
                      ? 'هذا أعلى مستوى في الأكاديمية، وصلاحياتك الآن صلاحيات الروت.'
                      : 'This is the top of the Academy. You have root.'}
                  </p>
                )}
              </motion.div>

              <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  autoFocus
                  onClick={dismiss}
                  className="flex-1 rounded-xl bg-[#9fef00] px-4 py-3 text-sm font-bold text-[#06180f] transition-colors hover:bg-[#b4ff2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {ar ? 'تابع التعلّم' : 'Keep learning'}
                </button>
                <button
                  type="button"
                  onClick={seeAllLevels}
                  className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {ar ? 'كل المستويات' : 'See all levels'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpHost;
