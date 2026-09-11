import React from 'react';
import { levelFor, type Level } from '../../services/xpService';

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
  className?: string;
}

/** The level for an amount of XP. The hex reads left to right inside Arabic
 *  text too, so it sits in its own inline span (see rtl-layout notes). */
const LevelBadge: React.FC<LevelBadgeProps> = ({ xp, lang, compact = false, className = '' }) => {
  const { level } = levelFor(xp);
  const color = levelColor(level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap ${className}`}
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}14` }}
      title={`${level.hex} ${level.name[lang]}`}
    >
      <span dir="ltr" className="font-mono">
        {level.hex}
      </span>
      {!compact && <span>{level.name[lang]}</span>}
    </span>
  );
};

export default LevelBadge;
