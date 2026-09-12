import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { LEVELS, type LevelProgress } from '../../services/xpService';
import LevelEmblem from './LevelEmblem';
import { levelColor } from '../ui/LevelBadge';

/* ─── Every level, opened from the learner's own ───
 *
 * The learner's level is the trigger. With a mouse, resting on it shows the
 * list and a click keeps it open; on a touch screen a tap, or a press and
 * hold, opens it. Escape or a press anywhere else closes it. The list is
 * portalled to the body and fixed to the trigger, because the dashboard's
 * hero clips anything that leaves it.
 */

type OpenedBy = 'hover' | 'pin';

interface Place {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const PANEL_WIDTH = 336;
const GAP = 8;
const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 220;
const HOLD_MS = 350;
const PANEL_ID = 'levels-dropdown';

interface LevelsDropdownProps {
  xp: number;
  level: LevelProgress;
  lang: 'en' | 'ar';
  /** Changes whenever something asks for the list ("See all levels"), which
   *  opens it and keeps it open. */
  openRequest?: string | null;
  /** Classes for the trigger, which lays its children out in a row. */
  className?: string;
  children: React.ReactNode;
}

const LevelsDropdown: React.FC<LevelsDropdownProps> = ({ xp, level, lang, openRequest, className = '', children }) => {
  const ar = lang === 'ar';
  const [openedBy, setOpenedBy] = useState<OpenedBy | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const open = openedBy !== null;
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);
  const currentIndex = level.level.number - 1;

  const clearHover = () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  const clearHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  useEffect(
    () => () => {
      clearHover();
      clearHold();
    },
    []
  );

  /* Below the trigger and aligned to its inline end (its right edge in
     English, its left edge in Arabic), kept on screen, and above it instead
     when there is more room there. */
  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, vw - GAP * 2);
    const left = Math.min(Math.max(GAP, ar ? r.left : r.right - width), vw - width - GAP);
    const below = vh - r.bottom - GAP * 2;
    const above = r.top - GAP * 2;
    setPlace(
      below >= 320 || below >= above
        ? { left, width, top: r.bottom + GAP, maxHeight: Math.min(560, below) }
        : { left, width, bottom: vh - r.top + GAP, maxHeight: Math.min(560, above) }
    );
  }, [ar]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  // Asked for from elsewhere: let the page settle into place, then open it.
  useEffect(() => {
    if (!openRequest) return;
    const timer = window.setTimeout(() => setOpenedBy('pin'), 450);
    return () => window.clearTimeout(timer);
  }, [openRequest]);

  // Escape, or a press anywhere outside the trigger and the list, closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenedBy(null);
      triggerRef.current?.focus();
    };
    const onPress = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenedBy(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPress, true);
    };
  }, [open]);

  // The learner's own level sits in the middle of the list when it opens.
  const placed = place !== null;
  useEffect(() => {
    if (!open || !placed) return;
    const list = listRef.current;
    const row = currentRef.current;
    if (list && row) list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
  }, [open, placed]);

  /* A mouse resting on the trigger or the list keeps it open; leaving both
     closes it, unless a click pinned it. */
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearHover();
    if (!open) hoverTimer.current = window.setTimeout(() => setOpenedBy('hover'), HOVER_OPEN_MS);
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearHover();
    hoverTimer.current = window.setTimeout(
      () => setOpenedBy((by) => (by === 'hover' ? null : by)),
      HOVER_CLOSE_MS
    );
  };

  // A press and hold on a touch screen opens it too.
  const onPressStart = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    held.current = false;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      setOpenedBy('pin');
    }, HOLD_MS);
  };

  const onClick = () => {
    clearHold();
    if (held.current) {
      held.current = false;
      return;
    }
    clearHover();
    setOpenedBy((by) => (by === 'pin' ? null : 'pin'));
  };

  const accent = levelColor(level.level);

  return (
    <>
      {/* A div in the button role rather than a <button>: the trigger wraps
          whatever shows the level, block elements included, which a button
          may not contain. Enter and Space work as they would on a button. */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          onClick();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? PANEL_ID : undefined}
        aria-label={
          ar
            ? `المستوى ${level.level.hex} ${level.level.name.ar}. عرض كل المستويات`
            : `Level ${level.level.hex} ${level.level.name.en}. Show every level`
        }
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerDown={onPressStart}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onClick={onClick}
        // A press and hold opens the list rather than the browser's image menu.
        onContextMenu={(e) => {
          if (held.current || holdTimer.current !== null) e.preventDefault();
        }}
        className={`group flex cursor-pointer select-none items-center rounded-2xl text-start transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/50 ${className}`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {children}
        <ChevronDown
          aria-hidden
          size={16}
          className={`flex-shrink-0 text-[#8592ad] transition-transform duration-200 group-hover:text-[#d2d7e3] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {createPortal(
        <AnimatePresence>
          {open && place && (
            <motion.div
              key="levels-dropdown"
              ref={panelRef}
              id={PANEL_ID}
              role="dialog"
              aria-label={ar ? 'المستويات' : 'Levels'}
              dir={ar ? 'rtl' : 'ltr'}
              onPointerEnter={onEnter}
              onPointerLeave={onLeave}
              initial={{ opacity: 0, y: place.top !== undefined ? -6 : 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: place.top !== undefined ? -6 : 6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-[#263248] bg-[#0f1624]/95 shadow-2xl shadow-black/60 backdrop-blur-md"
              style={{
                left: place.left,
                top: place.top,
                bottom: place.bottom,
                width: place.width,
                maxHeight: place.maxHeight,
                transformOrigin: place.top !== undefined ? 'top' : 'bottom',
              }}
            >
              <div className="border-b border-[#1e293b] px-4 py-3">
                <p className="flex items-center justify-between gap-3 text-sm font-bold text-[#f3f6ff]">
                  {ar ? 'المستويات' : 'Levels'}
                  <span className="text-[11px] font-semibold text-[#8592ad]">
                    <span dir="ltr" className="font-mono" style={{ color: accent }}>
                      {level.level.hex}
                    </span>{' '}
                    {ar ? 'من' : 'of'}{' '}
                    <span dir="ltr" className="font-mono">
                      {LEVELS[LEVELS.length - 1].hex}
                    </span>
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#8592ad]">
                  {ar
                    ? 'كل مستوى يحتاج ضعف نقاط الخبرة التي احتاجها المستوى الذي قبله.'
                    : 'Each level takes twice the XP of the one before it.'}
                </p>
              </div>

              <ol ref={listRef} className="custom-scrollbar relative flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
                {LEVELS.map((lvl, i) => {
                  const reached = i < currentIndex;
                  const current = i === currentIndex;
                  const locked = i > currentIndex;
                  const color = levelColor(lvl);
                  return (
                    <li
                      key={lvl.hex}
                      ref={current ? currentRef : undefined}
                      aria-current={current ? 'step' : undefined}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2"
                      style={current ? { background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}40` } : undefined}
                    >
                      <LevelEmblem
                        level={lvl}
                        lang={lang}
                        decorative
                        className={`h-9 w-9 flex-shrink-0 ${locked ? 'opacity-35 grayscale' : ''}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-1.5 text-sm font-bold leading-tight">
                          <span dir="ltr" className="font-mono text-xs" style={{ color: locked ? '#5b6884' : color }}>
                            {lvl.hex}
                          </span>
                          <span
                            className={`truncate ${
                              current ? 'text-[#f3f6ff]' : reached ? 'text-[#d2d7e3]' : 'text-[#7c8aa6]'
                            }`}
                          >
                            {lvl.name[lang]}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-[#7c8aa6]">
                          {lvl.minXp === 0 ? (
                            ar ? 'البداية' : 'Start'
                          ) : (
                            <span dir="ltr">{lvl.minXp.toLocaleString('en-US')} XP</span>
                          )}
                        </p>
                        {current && level.next && (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round(level.fraction * 100)}%`, background: color }}
                            />
                          </div>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-semibold">
                        {reached && (
                          <span className="inline-flex items-center gap-1 text-[#00a859]">
                            <Check size={11} /> {ar ? 'تم' : 'Reached'}
                          </span>
                        )}
                        {current && <span style={{ color }}>{ar ? 'أنت هنا' : 'You are here'}</span>}
                        {locked && (
                          <span className="inline-flex items-center gap-1 text-[#5b6884]">
                            <Lock size={10} />
                            {ar ? (
                              <>
                                تبقّى <span dir="ltr">{Math.max(0, lvl.minXp - xp).toLocaleString('en-US')}</span>
                              </>
                            ) : (
                              <>{Math.max(0, lvl.minXp - xp).toLocaleString('en-US')} to go</>
                            )}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default LevelsDropdown;
