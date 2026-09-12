import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Compass, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { getJourney } from '../../services/journeyService';
import {
  hasSeenTour,
  markTourSeen,
  navIsDrawer,
  prefersReducedMotion,
  requestTourSidebar,
} from '../../services/tourService';
import { TOUR_STEPS, type TourStep } from './tourSteps';

/* ─── The Academy tour ───
 *
 * A dark layer over the app with one thing left bright, a card explaining it,
 * and a cursor pointing at it. It opens by itself once, for a learner who has
 * signed in and finished nothing yet, and after that only when asked for from
 * the question mark in the header.
 *
 * Three decisions worth knowing:
 *
 * The hole is a box-shadow, not a mask. One absolutely positioned box sits on
 * the target with a shadow spread wide enough to cover any screen, so the
 * element itself is dimmed by nothing at all and stays as crisp as it was.
 * Clicks are caught by a separate transparent sheet underneath the box, which
 * is what keeps the app still while the tour talks about it.
 *
 * The target is measured every frame while a step is up. Elements move: the
 * page scrolls them into view, the drawer slides open under them, a font
 * lands and reflows the row. A single measurement on step change would leave
 * the light behind, and watching for the events that could move it means
 * knowing every one of them.
 *
 * Nothing is ever waited on forever. A target is polled for a couple of
 * seconds; a step marked optional is dropped when it never appears (the
 * navigation an account does not have), and any other step is shown in the
 * middle of the screen with nothing lit. The tour always continues.
 */

let trigger: (() => void) | null = null;

/** Show the learner around, from wherever. No-op until <TourHost/> mounts. */
export function startTour(): void {
  trigger?.();
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** How long to keep looking for a step's element before moving on. */
const WAIT_LIMIT = 2500;
const POLL = 90;

/** Breathing room around the lit element, and between it and the card. */
const HALO = 6;
const GAP = 16;
const EDGE = 12;

/** Below this the card stops sitting beside things and spans the screen. */
const COMPACT_WIDTH = 720;
const CARD_WIDTH = 372;

/** The account has answered the first-run prompts and can be shown around. */
const settledIn = (user: { username?: string; university?: string } | null): boolean =>
  !!user?.username && !!user?.university;

const sameBox = (a: Box | null, b: Box): boolean =>
  !!a &&
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

const TourHost: React.FC = () => {
  const { lang, isArabic } = useLang();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  /** Which way the learner is moving, so a dropped step is skipped that way. */
  const dirRef = useRef<1 | -1>(1);

  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Box | null>(null);
  const [radius, setRadius] = useState(12);
  /** The step's element never turned up; the card stands on its own. */
  const [orphan, setOrphan] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  /* Only the height is measured. The width is set here and never read back:
     letting the card's own rendered width decide its next width is a loop,
     and the loop's fixed point is the whole screen. */
  const [cardHeight, setCardHeight] = useState(240);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }));

  const steps = TOUR_STEPS;
  const step: TourStep | undefined = steps[index];
  const isLast = index === steps.length - 1;
  const compact = viewport.width < COMPACT_WIDTH;

  /* ── Opening and closing ── */

  const begin = useCallback(() => {
    dirRef.current = 1;
    setIndex(0);
    setOrphan(false);
    setTarget(null);
    setRect(null);
    setOpen(true);
  }, []);

  const close = useCallback(
    (outcome: 'finished' | 'skipped') => {
      markTourSeen(outcome);
      setOpen(false);
      setTarget(null);
      setRect(null);
      requestTourSidebar(false);
    },
    []
  );

  useEffect(() => {
    trigger = () => begin();
    return () => {
      trigger = null;
    };
  }, [begin]);

  /* Opens itself once, for a learner who has signed in, answered the prompts
     that come before it, and has nothing finished yet. The wait is not
     decoration: progress arrives from the server a moment after the session
     does, and starting before it lands would show the tour to someone who is
     halfway through the course. */
  useEffect(() => {
    if (open || isLoading || !isAuthenticated || !settledIn(user)) return;
    if (hasSeenTour()) return;
    if (location.pathname !== '/dashboard') return;

    const timer = setTimeout(() => {
      if (hasSeenTour()) return;
      try {
        if (getJourney().started) return;
      } catch {
        /* Content not ready to be read is not a reason to skip the tour. */
      }
      begin();
    }, 1500);
    return () => clearTimeout(timer);
  }, [open, isLoading, isAuthenticated, user, location.pathname, begin]);

  /* ── Moving between steps ── */

  const go = useCallback(
    (delta: 1 | -1) => {
      dirRef.current = delta;
      setIndex((i) => {
        const next = i + delta;
        if (next < 0) return 0;
        if (next > steps.length - 1) return steps.length - 1;
        return next;
      });
    },
    [steps.length]
  );

  /* The step says where it belongs and whether it lives in the navigation.
     Both are settled before anything is measured: a card about the dashboard
     that opened over the leaderboard would be a lie, and on a phone there is
     nothing to point at until the drawer is open. */
  useEffect(() => {
    if (!open || !step) return;
    if (step.route && location.pathname !== step.route) navigate(step.route);
    requestTourSidebar(!!step.inNav && navIsDrawer());
  }, [open, step, location.pathname, navigate]);

  /* Find the step's element, and keep looking for a little while. */
  useEffect(() => {
    if (!open || !step) return;
    if (!step.target) {
      setTarget(null);
      setOrphan(false);
      return;
    }

    let cancelled = false;
    let waited = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const look = () => {
      if (cancelled) return;
      /* A tour id can be on screen more than once: the navigation is rendered
         twice, as the phone's drawer and as the desktop column, and only one
         of the two has a size at any width. The one being shown is the one to
         point at. */
      const found = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-tour-id="${step.target}"]`)
      ).find((candidate) => {
        const b = candidate.getBoundingClientRect();
        return b.width > 0 && b.height > 0;
      });
      const box = found?.getBoundingClientRect();
      if (found && box) {
        setTarget(found);
        setOrphan(false);
        const corner = parseFloat(getComputedStyle(found).borderTopLeftRadius);
        setRadius(Number.isFinite(corner) ? Math.min(corner + HALO, 28) : 12);
        found.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
        return;
      }

      waited += POLL;
      if (waited >= WAIT_LIMIT) {
        /* Gone for good. An optional step is one the account may not have at
           all, so it is dropped in whichever direction the learner is going;
           anything else still has something to say without a spotlight. */
        if (step.optional) {
          const next = index + dirRef.current;
          if (next >= 0 && next < steps.length) setIndex(next);
          else close('finished');
          return;
        }
        setTarget(null);
        setOrphan(true);
        return;
      }
      timer = setTimeout(look, POLL);
    };

    look();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, step?.target, lang]);

  /* Follow the element while the step is up. */
  useEffect(() => {
    if (!open || !target) {
      setRect(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const r = target.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setRect((prev) => (sameBox(prev, next) ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  /* The card's own size decides where it can sit, so it is measured rather
     than assumed: the steps differ by several lines of Arabic or English. */
  useLayoutEffect(() => {
    if (!open) return;
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      setCardHeight((prev) => (Math.abs(prev - height) < 1 ? prev : height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, index, lang, compact]);

  /* ── Keyboard ──
     Escape is the way out, arrows step, and Tab stays inside the card, which
     is the only thing on screen that can be used. Nothing is held hostage:
     every key that leaves is also a button. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close('skipped');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(isArabic ? -1 : 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(isArabic ? 1 : -1);
        return;
      }
      if (e.key === 'Tab') {
        const card = cardRef.current;
        if (!card) return;
        const focusable = card.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === card)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, go, isArabic]);

  /* Each step is a new thing to read, so the card takes focus and the live
     region says which step it is. */
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(timer);
  }, [open, index]);

  /* ── Where the card goes ── */
  const placement = useMemo(() => {
    const vw = viewport.width;
    const vh = viewport.height;
    const w = compact ? Math.min(vw - EDGE * 2, 480) : CARD_WIDTH;
    const h = cardHeight || 240;

    if (!rect) {
      return { top: Math.max(EDGE, (vh - h) / 2), left: Math.max(EDGE, (vw - w) / 2), width: w };
    }

    const clampLeft = (value: number) => Math.min(Math.max(EDGE, value), Math.max(EDGE, vw - w - EDGE));
    const clampTop = (value: number) => Math.min(Math.max(EDGE, value), Math.max(EDGE, vh - h - EDGE));

    if (compact) {
      const below = rect.top + rect.height + GAP;
      const above = rect.top - GAP - h;
      const top = below + h + EDGE <= vh ? below : above >= EDGE ? above : clampTop(below);
      return { top, left: clampLeft((vw - w) / 2), width: w };
    }

    /* Logical sides: `end` is the right in English and the left in Arabic, so
       a card beside the navigation lands on the content side either way. */
    const sides = {
      bottom: { top: rect.top + rect.height + GAP, left: clampLeft(rect.left + rect.width / 2 - w / 2) },
      top: { top: rect.top - GAP - h, left: clampLeft(rect.left + rect.width / 2 - w / 2) },
      end: isArabic
        ? { top: clampTop(rect.top + rect.height / 2 - h / 2), left: rect.left - GAP - w }
        : { top: clampTop(rect.top + rect.height / 2 - h / 2), left: rect.left + rect.width + GAP },
      start: isArabic
        ? { top: clampTop(rect.top + rect.height / 2 - h / 2), left: rect.left + rect.width + GAP }
        : { top: clampTop(rect.top + rect.height / 2 - h / 2), left: rect.left - GAP - w },
    } as const;

    const order: (keyof typeof sides)[] = step?.placement
      ? [step.placement, 'bottom', 'end', 'top', 'start']
      : ['bottom', 'end', 'top', 'start'];

    for (const side of order) {
      const box = sides[side];
      if (box.left >= EDGE && box.left + w <= vw - EDGE && box.top >= EDGE && box.top + h <= vh - EDGE) {
        return { ...box, width: w };
      }
    }
    const fallback = sides[order[0]];
    return { top: clampTop(fallback.top), left: clampLeft(fallback.left), width: w };
  }, [rect, cardHeight, viewport, compact, isArabic, step?.placement]);

  if (!open || !step) return null;

  const lit = rect
    ? {
        top: rect.top - HALO,
        left: rect.left - HALO,
        width: rect.width + HALO * 2,
        height: rect.height + HALO * 2,
      }
    : null;

  /* The cursor rides the lit element's near corner and nudges toward it. It
     says nothing a screen reader needs and catches nothing a mouse does. */
  const cursor = lit
    ? {
        top: lit.top + lit.height - 4,
        left: isArabic
          ? lit.left + Math.max(18, lit.width * 0.25)
          : lit.left + Math.min(lit.width * 0.75, lit.width - 18),
      }
    : null;

  const finishJourney = () => {
    /* Somebody who has not started goes where "Start Fundamentals" goes on the
       dashboard, which is the Fundamentals page itself: the same words have to
       mean the same thing in both places. Somebody who has started is taken
       back to the lesson they left open. */
    let route = '/fundamentals';
    try {
      const journey = getJourney();
      if (journey.started) route = journey.resume?.route ?? journey.recommended?.route ?? route;
    } catch {
      /* The button still has somewhere sensible to go. */
    }
    close('finished');
    navigate(route);
  };

  const finishLabel = (() => {
    try {
      return getJourney().started
        ? { en: 'Continue learning', ar: 'تابع التعلم' }
        : { en: 'Start Fundamentals', ar: 'ابدأ الأساسيات' };
    } catch {
      return { en: 'Start Fundamentals', ar: 'ابدأ الأساسيات' };
    }
  })();

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} data-tour-open="true">
      {/* Holds the app still underneath. The dimming itself is the spotlight's
          shadow, so this sheet stays transparent. */}
      <div className="fixed inset-0 z-[80]" aria-hidden />

      {/* The one bright thing. Nothing is drawn over the element: the dark is
          a shadow cast outward from this box, so what is lit stays crisp. */}
      {lit && (
        <div
          aria-hidden
          className="tour-spotlight pointer-events-none fixed z-[81]"
          style={{
            top: lit.top,
            left: lit.left,
            width: lit.width,
            height: lit.height,
            borderRadius: radius,
          }}
        />
      )}
      {!lit && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[81]"
          style={{ backgroundColor: 'rgba(3, 7, 13, 0.78)' }}
        />
      )}

      {/* Where to click, said without words. */}
      {cursor && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed z-[82]"
          style={{ top: cursor.top, left: cursor.left }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: isArabic ? [-10, 0, -10] : [10, 0, 10],
            y: [10, 0, 10],
          }}
          transition={{
            opacity: { duration: 0.25 },
            scale: { duration: 0.25 },
            x: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <span className="relative block" style={{ transform: isArabic ? 'scaleX(-1)' : undefined }}>
            <span className="tour-cursor-pulse absolute -top-1 -left-1 block h-7 w-7 rounded-full" />
            <svg width="26" height="30" viewBox="0 0 26 30" fill="none" className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <path
                d="M4 2.2 L20.4 15.2 L12.6 16.1 L16.4 24.6 L12.6 26.4 L8.8 17.8 L4 22.6 Z"
                fill="#f3f6ff"
                stroke="#0d1117"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.div>
      )}

      {/* What this step is about. */}
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed z-[83] rounded-2xl border border-[#00a859]/30 bg-[#101827] p-5 shadow-2xl shadow-black/60 outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60"
        style={{ top: placement.top, left: placement.left, width: placement.width }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00a859]">
            <Compass size={14} />
            {isArabic ? 'جولة الأكاديمية' : 'Academy tour'}
          </span>
          <span className="text-[11px] font-semibold text-[#8592ad] tabular-nums" dir="ltr">
            {index + 1} / {steps.length}
          </span>
        </div>

        <h2 id="tour-title" className="text-lg font-black leading-tight text-[#f3f6ff]">
          {step.title[lang]}
        </h2>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-[#9aa5bf]">
          {step.body[lang]}
        </p>
        {step.points && (
          <ul className="mt-3 space-y-1.5">
            {step.points.map((point) => (
              <li key={point.en} className="flex items-start gap-2 text-xs text-[#aab3c7]">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00a859]" aria-hidden />
                {point[lang]}
              </li>
            ))}
          </ul>
        )}

        {/* How far along, as a rail rather than another line of text. */}
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-[width] duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {isLast ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={() => close('skipped')}
              className="rounded-md px-1 py-1 text-xs font-semibold text-[#8592ad] transition-colors hover:text-[#d2d7e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
            >
              {isArabic ? 'تخطي الجولة' : 'Skip tour'}
            </button>
          )}

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] bg-[#1a2332] px-3 py-2 text-xs font-semibold text-[#d2d7e3] transition-colors hover:border-[#354562] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
              >
                <ChevronLeft size={14} className="rtl-flip" />
                {isArabic ? 'السابق' : 'Back'}
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={finishJourney}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9fef00] px-4 py-2 text-xs font-black text-[#0d1117] transition-colors hover:bg-[#8dd900] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
              >
                {finishLabel[lang]}
                <ChevronRight size={14} className="rtl-flip" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a859] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#00954e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
              >
                {isArabic ? 'التالي' : 'Next'}
                <ChevronRight size={14} className="rtl-flip" />
              </button>
            )}
          </div>
        </div>

        {/* Closing the card is the same as saying no to the tour, and says so. */}
        <button
          type="button"
          onClick={() => close('skipped')}
          aria-label={isArabic ? 'إنهاء الجولة' : 'End the tour'}
          className="absolute end-2.5 top-2.5 hidden h-7 w-7 items-center justify-center rounded-md text-[#8592ad] transition-colors hover:bg-[#182235] hover:text-[#d2d7e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 sm:flex"
        >
          <X size={14} />
        </button>

        {orphan && (
          <p className="mt-3 text-[11px] text-[#7c8aa6]">
            {isArabic
              ? 'هذا الجزء غير ظاهر على هذه الصفحة الآن.'
              : 'That part of the interface is not on screen right now.'}
          </p>
        )}
      </motion.div>

      {/* Said aloud for anyone who is not looking at the spotlight. */}
      <p className="sr-only" aria-live="polite">
        {isArabic
          ? `الخطوة ${index + 1} من ${steps.length}: ${step.title.ar}`
          : `Step ${index + 1} of ${steps.length}: ${step.title.en}`}
      </p>
    </div>
  );
};

export default TourHost;
