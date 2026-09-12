import React from 'react';
import { levelFor, type Level } from '../../services/xpService';
import LevelEmblem from '../levels/LevelEmblem';

/* ─── A member's level, 0x1 Newbie to 0xD Root ───
 * One colour per level, climbing from slate through the brand greens and
 * blues to gold, so the top of the ladder looks as rare as it is. */
const LEVEL_COLORS = [
  '#8592ad', // 0x1
  '#a3b1c9', // 0x2
  '#6ee7b7', // 0x3
  '#00a859', // 0x4
  '#2dd4bf', // 0x5
  '#9fef00', // 0x6
  '#60a5fa', // 0x7
  '#818cf8', // 0x8
  '#a78bfa', // 0x9
  '#e879f9', // 0xA
  '#f472b6', // 0xB
  '#f3a43a', // 0xC
  '#f3c84b', // 0xD
];

export const levelColor = (level: Pick<Level, 'number'>): string =>
  LEVEL_COLORS[Math.min(LEVEL_COLORS.length, Math.max(1, level.number)) - 1];

interface LevelBadgeProps {
  xp: number;
  lang: 'en' | 'ar';
  /** Only the hex number, for tight rows; the name stays in the tooltip. */
  compact?: boolean;
  /** Off where the emblem is already shown large beside the badge. */
  emblem?: boolean;
  /** 'md' beside a heading, where the emblem carries the level on its own. */
  size?: 'sm' | 'md';
  /** Let the level stand on its own without a chip around it. */
  unframed?: boolean;
  className?: string;
}

const SIZES = {
  sm: {
    framed: 'gap-1 px-1.5 py-0.5 text-[10px]',
    unframed: 'gap-1.5 text-xs',
    framedEmblem: '-my-1 h-4 w-4',
    unframedEmblem: 'h-5 w-5',
  },
  md: {
    framed: 'gap-1.5 px-2 py-1 text-xs',
    unframed: 'gap-2 text-sm',
    framedEmblem: '-my-1.5 h-6 w-6',
    unframedEmblem: 'h-8 w-8',
  },
} as const;

/** The level for an amount of XP. The hex reads left to right inside Arabic
 *  text too, so it sits in its own inline span (see rtl-layout notes). */
const LevelBadge: React.FC<LevelBadgeProps> = ({
  xp,
  lang,
  compact = false,
  emblem = true,
  size = 'sm',
  unframed = false,
  className = '',
}) => {
  const { level } = levelFor(xp);
  const color = levelColor(level);
  return (
    <span
      className={`inline-flex items-center font-bold leading-none whitespace-nowrap ${
        unframed ? SIZES[size].unframed : `${SIZES[size].framed} rounded-md border`
      } ${className}`}
      style={
        unframed
          ? { color }
          : { color, borderColor: `${color}40`, backgroundColor: `${color}14` }
      }
      title={`${level.hex} ${level.name[lang]}`}
    >
      {emblem && (
        <LevelEmblem
          level={level}
          lang={lang}
          decorative
          className={`${unframed ? SIZES[size].unframedEmblem : SIZES[size].framedEmblem} flex-shrink-0`}
        />
      )}
      <span dir="ltr" className="font-mono">
        {level.hex}
      </span>
      {!compact && <span>{level.name[lang]}</span>}
    </span>
  );
};

export default LevelBadge;
