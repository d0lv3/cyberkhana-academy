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
  prefersReducedMotion,
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
 * The card never covers what it is explaining, and every step about the page
 * is laid out the same way: the thing itself, lit, and the card underneath
 * it. Something on the page can be taller than the screen (a grid of every
 * module, the road map on a phone), so the tour owns the scrolling while it
 * is open: it brings the element to the top of the page's area, and when the
 * card needs some of that room it lights the beginning of the element and
 * lets the rest fade out, rather than parking the card on top of it.
 *
 * Nothing is ever waited on forever. A target is polled for a couple of
 * seconds; a step marked optional is dropped when it never appears (the
 * navigation an account does not have), and any other step is shown in the
 * middle of the screen with nothing lit. The tour always continues.
 */

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The part of the screen a thing on the page can be shown in: below the
 *  header, above the phone's bar. Null for the navigation itself, which is
 *  not on the page and has the whole screen. */
interface Stage {
  top: number;
  bottom: number;
}

/** How long to keep looking for a step's element before moving on. */
const WAIT_LIMIT = 2500;
const POLL = 90;

/** Breathing room around the lit element, and between it and the card. */
const HALO = 6;
const GAP = 16;
const EDGE = 12;
/** The least of a tall element worth lighting when the card needs the rest. */
const MIN_LIT = 120;
/** How much of a cut-off edge fades out, to say there is more beyond it. */
const FADE = 56;

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

/** `requests` counts how often the tour has been asked for by hand
 *  (components/tour/TourGate.tsx); each new one opens it. */
const TourHost: React.FC<{ requests?: number }> = ({ requests = 0 }) => {
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
  const [stage, setStage] = useState<Stage | null>(null);
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
  /* A gate step needs its own target to advance. If that target never turned
     up (see `orphan` below), falling back to a normal Next button is what
     keeps the tour from stranding someone on a row that failed to render. */
  const gated = !!step?.requireClick && !!target && !orphan;

  /* ── Opening and closing ── */

  const begin = useCallback(() => {
    dirRef.current = 1;
    setIndex(0);
    setOrphan(false);
    setTarget(null);
    setRect(null);
    setStage(null);
    setOpen(true);
  }, []);

  const close = useCallback((outcome: 'finished' | 'skipped') => {
    markTourSeen(outcome);
    setOpen(false);
    setTarget(null);
    setRect(null);
  }, []);

  useEffect(() => {
    if (requests > 0) begin();
  }, [requests, begin]);

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

  /* The step says where it belongs, and it gets there before anything is
     measured: a card about the dashboard that opened over the leaderboard
     would be a lie. */
  useEffect(() => {
    if (!open || !step) return;
    if (step.route && location.pathname !== step.route) navigate(step.route);
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
         twice, as the phone's bottom bar and as the desktop column, and only
         one of the two has a size at any width. The one being shown is the one
         to point at. */
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
        /* Something on the page is brought into place further down, once the
           card's size is known. A navigation row only has to be in view. */
        if (!found.closest('main')) {
          found.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
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

  /* A gate step moves on only when its target is actually clicked. The
     listener fires once and detaches with the click: the same click already
     carries a nav row to wherever it goes, so this only has to notice it. */
  useEffect(() => {
    if (!open || !step?.requireClick || !target) return;
    const onTargetClick = () => go(1);
    target.addEventListener('click', onTargetClick, { once: true });
    return () => target.removeEventListener('click', onTargetClick);
  }, [open, step, target, go]);

  /* Follow the element while the step is up. */
  useEffect(() => {
    if (!open || !target) {
      setRect(null);
      setStage(null);
      return;
    }
    const scroller = target.closest('main');
    let raf = 0;
    const tick = () => {
      const r = target.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setRect((prev) => (sameBox(prev, next) ? prev : next));

      /* Where on the screen the page shows through: the scrolling area's own
         box, less the phone's bar, which is fixed over the foot of it. */
      if (scroller) {
        const area = scroller.getBoundingClientRect();
        const bar = document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect();
        const top = Math.max(0, area.top);
        const bottom = Math.min(window.innerHeight, area.bottom, bar && bar.height > 0 ? bar.top : Infinity);
        setStage((prev) =>
          prev && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.bottom - bottom) < 0.5 ? prev : { top, bottom }
        );
      } else {
        setStage((prev) => (prev === null ? prev : null));
      }
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
     than assumed: the steps differ by several lines of Arabic or English, and
     within a step the foot changes when its element turns up (a hint in place
     of the Next button) or fails to (a line saying so). */
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
  }, [open, index, lang, compact, gated, orphan]);

  /* Bring a thing on the page to where it and the card both fit. The tour
     holds the app still, so nobody else can scroll while it is open, and that
     makes this the one place the position is decided: the lit part goes to
     the top of the stage with the card under it, the two set in the middle
     when there is room to spare. An element too tall for that shows as much
     of its beginning as the card leaves room for.

     A short page cannot scroll far enough to lift its last row to the top, so
     for as long as the step is up the page is given the extra foot it needs.
     It is taken away again when the step changes or the tour closes.

     It runs again whenever the card or the element changes size or the
     element is somewhere other than where it was put: a step with more to
     say, or something above it on the page landing late and pushing it down.
     Its own scroll moves the element too, and that run finds nothing left to
     correct, so it settles instead of chasing itself. The jump is instant on
     purpose: the page is dimmed, and the spotlight sliding to its new place
     is the motion worth watching. */
  const targetHeight = rect ? Math.round(rect.height) : 0;
  const targetTop = rect ? Math.round(rect.top) : 0;
  useEffect(() => {
    if (!open || !target || !stage) return;
    const scroller = target.closest('main');
    if (!scroller) return;
    const content = (scroller.firstElementChild as HTMLElement | null) ?? scroller;
    const ownPadding = content.style.paddingBottom;

    const box = target.getBoundingClientRect();
    const room = stage.bottom - stage.top - EDGE * 2;
    const shown = Math.min(box.height + HALO * 2, Math.max(MIN_LIT, room - GAP - cardHeight));
    const slack = Math.max(0, room - shown - GAP - cardHeight);
    const litTop = stage.top + EDGE + slack / 2;
    const delta = box.top - HALO - litTop;

    /* Asked for twice at most: on a page shorter than its own area the first
       stretch only fills the empty space under the content, and it is the
       second that gives it somewhere to scroll to. */
    for (let pass = 0; pass < 3; pass++) {
      const reach = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      if (delta <= reach) break;
      const foot = parseFloat(getComputedStyle(content).paddingBottom) || 0;
      content.style.paddingBottom = `${Math.ceil(foot + delta - reach) + 1}px`;
    }
    if (Math.abs(delta) > 1) scroller.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });

    return () => {
      content.style.paddingBottom = ownPadding;
    };
  }, [open, target, stage?.top, stage?.bottom, cardHeight, targetHeight, targetTop]);

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
        /* A gate step is skipped by Tab-and-Enter on the lit row itself,
           which fires the same click the mouse would; the arrow key is not
           a substitute for that. */
        if (!gated) go(isArabic ? -1 : 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!gated) go(isArabic ? 1 : -1);
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
  }, [open, close, go, isArabic, gated]);

  /* Each step is a new thing to read, so the card takes focus and the live
     region says which step it is. */
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(timer);
  }, [open, index]);

  /* ── What is lit, and where the card goes ──
     Worked out together, because each decides the other: the card sits beside
     what is lit, and what is lit gives way when the card needs the room. */
  const layout = useMemo(() => {
    const vw = viewport.width;
    const vh = viewport.height;
    const w = compact ? Math.min(vw - EDGE * 2, 480) : CARD_WIDTH;
    const h = cardHeight || 240;

    const clampLeft = (value: number) => Math.min(Math.max(EDGE, value), Math.max(EDGE, vw - w - EDGE));
    const clampTop = (value: number) => Math.min(Math.max(EDGE, value), Math.max(EDGE, vh - h - EDGE));
    const centred = {
      card: { top: Math.max(EDGE, (vh - h) / 2), left: Math.max(EDGE, (vw - w) / 2), width: w },
      lit: null as Box | null,
      fadeTop: false,
      fadeBottom: false,
    };

    if (!rect) return centred;

    /* The element and its halo, kept on the screen sideways: a cell at the
       very edge of the phone's bar would otherwise lose its ring off it. */
    const litLeft = Math.max(2, rect.left - HALO);
    const litRight = Math.min(vw - 2, rect.left + rect.width + HALO);
    const fullTop = rect.top - HALO;
    const fullBottom = rect.top + rect.height + HALO;

    /* ── Something on the page ──
       It and the card share the stage, the element first and the card under
       it, the same on every step. The card goes above only when that is the
       one way to keep the element's beginning in view (it could not be
       brought any higher). A cut edge is marked so it can fade out. */
    if (stage) {
      const stageTop = stage.top + EDGE;
      const stageBottom = stage.bottom - EDGE;
      const visibleTop = Math.max(fullTop, stageTop);
      const visibleBottom = Math.min(fullBottom, stageBottom);

      const below = { top: visibleTop, bottom: Math.min(visibleBottom, stageBottom - h - GAP), card: 0 };
      below.card = below.bottom + GAP;
      const above = { top: Math.max(visibleTop, stageTop + h + GAP), bottom: visibleBottom, card: 0 };
      above.card = above.top - GAP - h;

      const span = (o: { top: number; bottom: number }) => o.bottom - o.top;
      const enough = Math.min(MIN_LIT, fullBottom - fullTop) - 1;
      const fromItsStart = (o: { top: number }) => o.top <= fullTop + 1;
      const order = [below, above];
      const pick =
        order.find((o) => span(o) >= enough && fromItsStart(o)) ??
        order.find((o) => span(o) >= enough) ??
        (span(below) >= span(above) ? below : above);

      /* Not in view yet: the page is still being brought into place. */
      if (span(pick) < 24) return centred;

      return {
        card: {
          top: clampTop(pick.card),
          left: clampLeft(compact ? (vw - w) / 2 : (litLeft + litRight) / 2 - w / 2),
          width: w,
        },
        lit: { top: pick.top, left: litLeft, width: litRight - litLeft, height: span(pick) },
        fadeTop: pick.top > fullTop + 1,
        fadeBottom: pick.bottom < fullBottom - 1,
      };
    }

    /* ── The navigation ──
       Lit whole, and kept on the screen. The card goes beside it. */
    const top = Math.max(2, fullTop);
    const lit: Box = { top, left: litLeft, width: litRight - litLeft, height: Math.min(vh - 2, fullBottom) - top };
    const beside = (card: { top: number; left: number }) => ({
      card: { ...card, width: w },
      lit,
      fadeTop: false,
      fadeBottom: false,
    });

    if (compact) {
      const below = rect.top + rect.height + GAP;
      const above = rect.top - GAP - h;
      const cardTop = below + h + EDGE <= vh ? below : above >= EDGE ? above : clampTop(below);
      return beside({ top: cardTop, left: clampLeft((vw - w) / 2) });
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
        return beside(box);
      }
    }
    const fallback = sides[order[0]];
    return beside({ top: clampTop(fallback.top), left: clampLeft(fallback.left) });
  }, [rect, stage, cardHeight, viewport, compact, isArabic, step?.placement]);

  if (!open || !step) return null;

  const { card: placement, lit } = layout;

  /* The cursor is there to say "click this", so it shows only on a step that
     waits for a click. On a step that only explains, the app underneath is
     held still, and a pointer over it would be asking for a click that does
     nothing. It rides the lit row's near corner and nudges toward it; it says
     nothing a screen reader needs and catches nothing a mouse does. */
  const cursor =
    gated && lit
      ? {
          top: lit.top + lit.height - 4,
          left: isArabic
            ? lit.left + Math.max(18, lit.width * 0.25)
            : lit.left + Math.min(lit.width * 0.75, lit.width - 18),
        }
      : null;

  /* A finger taps; only a mouse clicks. */
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  /* The closing question sends the learner off itself, so the button row
     below never renders a Next or Finish for this step. */
  const chooseBranch = (route: string) => {
    close('finished');
    navigate(route);
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} data-tour-open="true">
      {/* Holds the app still underneath. The dimming itself is the spotlight's
          shadow, so this sheet stays transparent. A gate step cuts an actual
          hole in it over the lit element, four bands framing the gap, since
          the row underneath has to receive a real click rather than have one
          faked on its behalf. */}
      {gated && lit ? (
        <>
          <div className="fixed z-[80]" style={{ top: 0, left: 0, right: 0, height: lit.top }} aria-hidden />
          <div
            className="fixed z-[80]"
            style={{ top: lit.top + lit.height, left: 0, right: 0, bottom: 0 }}
            aria-hidden
          />
          <div
            className="fixed z-[80]"
            style={{ top: lit.top, left: 0, width: lit.left, height: lit.height }}
            aria-hidden
          />
          <div
            className="fixed z-[80]"
            style={{ top: lit.top, left: lit.left + lit.width, right: 0, height: lit.height }}
            aria-hidden
          />
        </>
      ) : (
        <div className="fixed inset-0 z-[80]" aria-hidden />
      )}

      {/* The one bright thing. Nothing is drawn over the element: the dark is
          a shadow cast outward from this box, so what is lit stays crisp. Where
          the box stops short of the element, that edge fades into the same
          dark, which says the thing carries on rather than ends there. */}
      {lit && (
        <div
          aria-hidden
          className="tour-spotlight pointer-events-none fixed z-[81] overflow-hidden"
          style={{
            top: lit.top,
            left: lit.left,
            width: lit.width,
            height: lit.height,
            borderRadius: radius,
          }}
        >
          {layout.fadeTop && (
            <span
              className="absolute inset-x-0 top-0 block"
              style={{
                height: Math.min(FADE, lit.height / 3),
                background: 'linear-gradient(to top, rgba(3, 7, 13, 0), rgba(3, 7, 13, 0.78))',
              }}
            />
          )}
          {layout.fadeBottom && (
            <span
              className="absolute inset-x-0 bottom-0 block"
              style={{
                height: Math.min(FADE, lit.height / 3),
                background: 'linear-gradient(to bottom, rgba(3, 7, 13, 0), rgba(3, 7, 13, 0.78))',
              }}
            />
          )}
        </div>
      )}
      {!lit && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[81]"
          style={{ backgroundColor: 'rgba(3, 7, 13, 0.78)' }}
        />
      )}

      {/* Where to click, said without words. Only on a step that wants one. */}
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
        {/* One row: what this is, how far along, and the way out. The close
            button is part of the row, not laid over its corner, so it can
            never sit on the count beside it. Tracked capitals suit Latin and
            pull Arabic's joined letters apart, so only English is tracked. */}
        <div className="mb-3 flex items-center gap-3">
          <span
            className="inline-flex min-w-0 flex-1 items-center gap-2 text-[11px] font-bold uppercase text-[#00a859]"
            style={isArabic ? undefined : { letterSpacing: '0.14em' }}
          >
            <Compass size={14} className="flex-shrink-0" />
            <span className="truncate">{isArabic ? 'جولة الأكاديمية' : 'Academy tour'}</span>
          </span>
          <span className="flex-shrink-0 text-[11px] font-semibold text-[#8592ad] tabular-nums" dir="ltr">
            {index + 1} / {steps.length}
          </span>
          {/* Closing the card is the same as saying no to the tour, and says so. */}
          <button
            type="button"
            onClick={() => close('skipped')}
            aria-label={isArabic ? 'إنهاء الجولة' : 'End the tour'}
            title={isArabic ? 'إنهاء الجولة' : 'End the tour'}
            className="-my-1.5 -me-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[#8592ad] transition-colors hover:bg-[#182235] hover:text-[#d2d7e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:-my-3 touch:h-11 touch:w-11"
          >
            <X size={15} />
          </button>
        </div>

        <h2 id="tour-title" className="text-lg font-black leading-tight text-[#f3f6ff]">
          {step.title[lang]}
        </h2>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-[#9aa5bf]">
          {step.body[lang]}
        </p>
        {orphan && (
          <p className="mt-2 text-[11px] text-[#7c8aa6]">
            {isArabic
              ? 'هذا الجزء غير ظاهر على هذه الصفحة الآن.'
              : 'That part of the interface is not on screen right now.'}
          </p>
        )}
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
            {step.branch ? null : gated ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#354562] px-3 py-2 text-xs font-semibold text-[#8592ad]">
                {isArabic ? 'اضغط عليها للمتابعة' : touch ? 'Tap it to continue' : 'Click it to continue'}
              </span>
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

        {/* The closing question: two ways onward instead of one Finish. */}
        {step.branch && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => chooseBranch(step.branch!.a.route)}
              className="flex-1 rounded-lg border border-[#263248] bg-[#1a2332] px-4 py-2.5 text-xs font-bold text-[#d2d7e3] transition-colors hover:border-[#354562] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
            >
              {step.branch.a.label[lang]}
            </button>
            <button
              type="button"
              onClick={() => chooseBranch(step.branch!.b.route)}
              className="flex-1 rounded-lg bg-[#9fef00] px-4 py-2.5 text-xs font-black text-[#0d1117] transition-colors hover:bg-[#8dd900] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
            >
              {step.branch.b.label[lang]}
            </button>
          </div>
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
