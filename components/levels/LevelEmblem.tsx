import React from 'react';
import type { Level } from '../../services/xpService';

/* ─── A level's emblem ───
 * One image per level in public/assets/levels, in two sizes: the full one for
 * the dashboard, the level-up card and profiles, and a small one for badges,
 * the ladder and the header. Both are square, transparent WebP, cropped so
 * every emblem carries the same weight side by side. */

export type EmblemSize = 'lg' | 'sm';

export const levelEmblemSrc = (level: Pick<Level, 'hex'>, size: EmblemSize = 'sm'): string =>
  `/assets/levels/level-${level.hex}${size === 'sm' ? '-sm' : ''}.webp`;

interface LevelEmblemProps {
  level: Level;
  lang: 'en' | 'ar';
  /** 'lg' is 512 px, for anything shown larger than about 80 px. */
  size?: EmblemSize;
  className?: string;
  /** Beside text that already names the level, the image says nothing new. */
  decorative?: boolean;
  /** Set on an emblem that is on screen straight away. */
  eager?: boolean;
}

const LevelEmblem: React.FC<LevelEmblemProps> = ({
  level,
  lang,
  size = 'sm',
  className = '',
  decorative = false,
  eager = false,
}) => (
  <img
    src={levelEmblemSrc(level, size)}
    alt={decorative ? '' : `${level.hex} ${level.name[lang]}`}
    aria-hidden={decorative || undefined}
    width={size === 'lg' ? 512 : 160}
    height={size === 'lg' ? 512 : 160}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    draggable={false}
    className={`select-none object-contain ${className}`}
  />
);

export default LevelEmblem;
