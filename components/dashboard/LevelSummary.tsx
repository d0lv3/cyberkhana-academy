import React from 'react';
import { Zap } from 'lucide-react';

import LevelEmblem from '../levels/LevelEmblem';
import LevelsDropdown from '../levels/LevelsDropdown';
import ProgressRing from '../ui/ProgressRing';
import { levelColor } from '../ui/LevelBadge';
import type { LevelProgress } from '../../services/xpService';

/**
 * The learner's current level and the trigger for the complete level list.
 * Kept as one component because it lives in the hero for returning learners
 * and in the standing card while a new learner still has the guided start
 * panel in that position.
 */
const LevelSummary: React.FC<{
  xp: number;
  level: LevelProgress;
  lang: 'en' | 'ar';
  openRequest?: string | null;
  className?: string;
  /** Enlarged treatment used in the returning learner's hero. */
  hero?: boolean;
}> = ({ xp, level, lang, openRequest, className = '', hero = false }) => {
  const ar = lang === 'ar';
  const accent = levelColor(level.level);
  const ringSize = hero ? 148 : 112;
  const ringStroke = hero ? 9 : 7;

  return (
    <div data-tour-id="dashboard-level" className={`${hero ? 'level-summary-hero' : ''} ${className}`}>
      <LevelsDropdown
        xp={xp}
        level={level}
        lang={lang}
        openRequest={openRequest}
        className={
          hero
            ? '-m-3 flex-col items-start gap-4 p-3 xs:flex-row xs:items-center xs:gap-6'
            : '-m-2 gap-5 p-2'
        }
      >
        <ProgressRing className="level-summary-ring" progress={level.fraction * 100} color={accent} size={ringSize} stroke={ringStroke}>
          <LevelEmblem
            level={level.level}
            lang={lang}
            size="lg"
            eager
            decorative
            className={`drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] ${
              hero ? 'h-[102px] w-[102px]' : 'h-[76px] w-[76px]'
            }`}
          />
        </ProgressRing>

        <div className="min-w-0">
          <p className={`${hero ? 'text-xs' : 'text-[10px]'} font-bold uppercase tracking-wider text-[#8592ad]`}>
            {ar ? 'المستوى' : 'Level'}
          </p>
          <p className={`mt-0.5 flex items-baseline gap-2 font-black leading-tight ${hero ? 'text-2xl' : 'text-lg'}`}>
            <span dir="ltr" className="font-mono" style={{ color: accent }}>
              {level.level.hex}
            </span>
            <span className="text-[#f3f6ff]">{level.level.name[lang]}</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[#f3f6ff]">
            <Zap size={hero ? 17 : 14} className="text-[#9fef00]" />
            <span className={`${hero ? 'text-xl' : 'text-base'} font-black`} dir="ltr">
              {xp.toLocaleString('en-US')}
            </span>
            <span className={`${hero ? 'text-sm' : 'text-xs'} font-semibold text-[#8592ad]`}>XP</span>
          </div>
          <p className={`mt-1 text-[#8592ad] ${hero ? 'text-sm' : 'text-xs'}`}>
            {level.next ? (
              <>
                <span dir="ltr">{level.toNext.toLocaleString('en-US')}</span>{' '}
                {ar ? 'نقطة خبرة حتى' : 'XP to'}{' '}
                <span dir="ltr" className="font-mono">
                  {level.next.hex}
                </span>{' '}
                <span className="font-semibold text-[#9aa5bf]">{level.next.name[lang]}</span>
              </>
            ) : ar ? (
              'أعلى مستوى في الأكاديمية'
            ) : (
              'The top level in the Academy'
            )}
          </p>
        </div>
      </LevelsDropdown>
    </div>
  );
};

export default LevelSummary;
