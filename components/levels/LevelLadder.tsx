import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronsUp, Lock } from 'lucide-react';
import { LEVELS, type LevelProgress } from '../../services/xpService';
import LevelEmblem from './LevelEmblem';
import { levelColor } from '../ui/LevelBadge';

/* ─── The level ladder ───
 * Every level, the XP it starts at, and where the learner stands on the way
 * up. One column per level on a track that scrolls sideways, with a line
 * through the emblems that fills up to the learner's place. The line is
 * anchored at the inline start, so it runs from the right in Arabic. */

/** Width of one level's column, which the line is measured in. */
const STEP = 112;
/** The track's side padding. */
const PAD = 16;
/** Height of the emblem row; the line runs through its middle. */
const EMBLEM_ROW = 76;
const TOP = 24;

const LevelLadder: React.FC<{ xp: number; level: LevelProgress; lang: 'en' | 'ar'; id?: string }> = ({
  xp,
  level,
  lang,
  id,
}) => {
  const ar = lang === 'ar';
  const trackRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const currentIndex = level.level.number - 1;
  const accent = levelColor(level.level);

  // Bring the learner's level into view inside the track. Measured on screen
  // and scrolled by the difference, which works the same way in Arabic, and
  // never moves the page itself.
  useEffect(() => {
    const track = trackRef.current;
    const current = currentRef.current;
    if (!track || !current) return;
    const t = track.getBoundingClientRect();
    const c = current.getBoundingClientRect();
    track.scrollBy({ left: c.left + c.width / 2 - (t.left + t.width / 2) });
  }, [currentIndex]);

  const lineStart = PAD + STEP / 2;
  const lineLength = (LEVELS.length - 1) * STEP;
  const filled = Math.min(lineLength, (currentIndex + (level.next ? level.fraction : 0)) * STEP);
  const lineTop = TOP + EMBLEM_ROW / 2 - 2;

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="scroll-mt-6 rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#9fef00]/10 border border-[#9fef00]/25">
            <ChevronsUp size={17} className="text-[#9fef00]" />
          </div>
          <div className="min-w-0">
            <h3 id={id ? `${id}-title` : undefined} className="text-base font-bold text-[#f3f6ff] leading-tight">
              {ar ? 'المستويات' : 'Levels'}
            </h3>
            <p className="text-[11px] text-[#8592ad]">
              {ar
                ? 'كل مستوى يحتاج ضعف نقاط الخبرة التي احتاجها المستوى الذي قبله.'
                : 'Each level takes twice the XP of the one before it.'}
            </p>
          </div>
        </div>
        <p className="text-xs text-[#8592ad]">
          {ar ? 'أنت في المستوى ' : 'You are on level '}
          <span dir="ltr" className="font-mono font-bold" style={{ color: accent }}>
            {level.level.hex}
          </span>{' '}
          {ar ? 'من ' : 'of '}
          <span dir="ltr" className="font-mono">
            {LEVELS[LEVELS.length - 1].hex}
          </span>
        </p>
      </div>

      <div ref={trackRef} className="overflow-x-auto custom-scrollbar">
        <div className="relative w-max pb-5" style={{ paddingInline: PAD, paddingTop: TOP }}>
          {/* The whole ladder, then how far along it the learner is. */}
          <span
            aria-hidden
            className="absolute h-1 rounded-full bg-[#1c2740]"
            style={{ top: lineTop, insetInlineStart: lineStart, width: lineLength }}
          />
          <span
            aria-hidden
            className="absolute h-1 rounded-full transition-[width] duration-700"
            style={{
              top: lineTop,
              insetInlineStart: lineStart,
              width: filled,
              background: `linear-gradient(to ${ar ? 'left' : 'right'}, #8592ad, ${accent})`,
              boxShadow: `0 0 12px ${accent}66`,
            }}
          />

          <ol
            className="relative flex"
            aria-label={ar ? 'المستويات ونقاط الخبرة اللازمة لكل منها' : 'Levels and the XP each one starts at'}
          >
            {LEVELS.map((lvl, i) => {
              const reached = i < currentIndex;
              const current = i === currentIndex;
              const locked = i > currentIndex;
              const color = levelColor(lvl);
              const toGo = Math.max(0, lvl.minXp - xp);
              return (
                <li
                  key={lvl.hex}
                  ref={current ? currentRef : undefined}
                  aria-current={current ? 'step' : undefined}
                  className="relative flex flex-col items-center px-1.5 text-center"
                  style={{ width: STEP }}
                >
                  <div className="flex items-center justify-center" style={{ height: EMBLEM_ROW }}>
                    <div
                      className={`relative flex items-center justify-center rounded-full ${
                        current ? 'h-[76px] w-[76px]' : 'h-14 w-14'
                      }`}
                      style={{
                        background: current ? `radial-gradient(circle, ${color}33 0%, ${color}00 70%)` : '#121a2a',
                      }}
                    >
                      <LevelEmblem
                        level={lvl}
                        lang={lang}
                        decorative
                        eager={current}
                        className={
                          current ? 'h-[72px] w-[72px]' : locked ? 'h-14 w-14 opacity-35 grayscale' : 'h-14 w-14'
                        }
                      />
                      {current && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-full border-2 animate-pulse"
                          style={{ borderColor: `${color}66` }}
                        />
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] font-bold leading-tight">
                    <span dir="ltr" className="font-mono" style={{ color: locked ? '#5b6884' : color }}>
                      {lvl.hex}
                    </span>
                  </p>
                  <p
                    className={`text-xs font-bold leading-tight ${
                      current ? 'text-[#f3f6ff]' : reached ? 'text-[#d2d7e3]' : 'text-[#5b6884]'
                    }`}
                  >
                    {lvl.name[lang]}
                  </p>
                  <p className={`mt-1.5 text-[11px] tabular-nums ${locked ? 'text-[#7c8aa6]' : 'text-[#9aa5bf]'}`}>
                    {lvl.minXp === 0 ? (
                      ar ? 'البداية' : 'Start'
                    ) : (
                      <span dir="ltr">{lvl.minXp.toLocaleString('en-US')} XP</span>
                    )}
                  </p>
                  <p className="mt-1 flex min-h-[16px] items-center justify-center gap-1 text-[10px] font-semibold">
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
                            تبقّى <span dir="ltr">{toGo.toLocaleString('en-US')}</span>
                          </>
                        ) : (
                          <>{toGo.toLocaleString('en-US')} to go</>
                        )}
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </motion.section>
  );
};

export default LevelLadder;
