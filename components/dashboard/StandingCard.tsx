import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import ProgressRing from '../ui/ProgressRing';
import LevelEmblem from '../levels/LevelEmblem';
import LevelsDropdown from '../levels/LevelsDropdown';
import { levelColor } from '../ui/LevelBadge';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import type { LevelProgress } from '../../services/xpService';

/* ─── The record of the learning ───
 *
 * Level, XP and where that puts the learner among everyone else. It sits low
 * on the dashboard on purpose: it is a consequence of the work, not a reason
 * to do it, and leading with it would tell a new member that the Academy is
 * a scoreboard.
 *
 * The rank is the leaderboard's own answer for this account, asked for once
 * per visit and allowed to fail: unranked and unreachable both come out as
 * "not ranked yet", which is the truth either way and never a made-up number.
 */

interface LeaderboardStanding {
  me: { rank: number; points: number; xp: number } | null;
  /** Lifetime XP a member needs before the board will rank them. */
  minXp?: number;
}

const StandingCard: React.FC<{
  xp: number;
  level: LevelProgress;
  levelsRequest: string | null;
}> = ({ xp, level, levelsRequest }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const accent = levelColor(level.level);

  const [standing, setStanding] = useState<LeaderboardStanding | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LeaderboardStanding>('/leaderboard?scope=overall&limit=1')
      .then((res) => {
        if (!cancelled) setStanding(res);
      })
      .catch(() => {
        /* Signed out, offline, or the board is down: the card simply says
           nothing about rank rather than guessing at one. */
        if (!cancelled) setStanding(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rank = standing?.me?.rank ?? null;
  const needed = standing?.minXp ?? null;

  return (
    <motion.section
      data-tour-id="dashboard-standing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5 sm:p-6"
      aria-label={ar ? 'مستواك وترتيبك' : 'Your level and rank'}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Level: the emblem inside a ring that fills toward the next one.
            Resting on it, or tapping it, lists every level. */}
        <LevelsDropdown
          xp={xp}
          level={level}
          lang={lang}
          openRequest={levelsRequest}
          className="-m-2 gap-5 p-2"
        >
          <ProgressRing progress={level.fraction * 100} color={accent} size={112} stroke={7}>
            <LevelEmblem
              level={level.level}
              lang={lang}
              size="lg"
              eager
              decorative
              className="h-[76px] w-[76px] drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
            />
          </ProgressRing>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8592ad]">
              {ar ? 'المستوى' : 'Level'}
            </p>
            <p className="mt-0.5 flex items-baseline gap-2 text-lg font-black leading-tight">
              <span dir="ltr" className="font-mono" style={{ color: accent }}>
                {level.level.hex}
              </span>
              <span className="text-[#f3f6ff]">{level.level.name[lang]}</span>
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[#f3f6ff]">
              <Zap size={14} className="text-[#9fef00]" />
              <span className="text-base font-black" dir="ltr">
                {xp.toLocaleString('en-US')}
              </span>
              <span className="text-xs font-semibold text-[#8592ad]">XP</span>
            </div>
            <p className="mt-1 text-xs text-[#8592ad]">
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

        {/* Rank, and the way to the board it comes from. */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="group flex items-center gap-3 self-start rounded-xl border border-[#1e293b] bg-[#0e1522]/70 px-4 py-3 text-start transition-colors hover:border-[#f3c84b]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c84b]/40 sm:self-center touch:min-h-tap"
        >
          <Trophy size={18} className="flex-shrink-0 text-[#f3c84b]" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8592ad]">
              {ar ? 'الترتيب العام' : 'All-time rank'}
            </span>
            {rank !== null ? (
              <span className="block text-lg font-black text-[#f3f6ff]" dir="ltr">
                #{rank.toLocaleString('en-US')}
              </span>
            ) : (
              <>
                <span className="block text-sm font-bold text-[#d2d7e3]">
                  {ar ? 'لم تدخل الترتيب بعد' : 'Not ranked yet'}
                </span>
                {needed !== null && xp < needed && (
                  <span className="block text-[11px] text-[#8592ad]">
                    {ar ? 'ابدأ الترتيب عند' : 'Ranked from'}{' '}
                    <span dir="ltr">{needed.toLocaleString('en-US')}</span> XP
                  </span>
                )}
              </>
            )}
          </span>
        </button>
      </div>
    </motion.section>
  );
};

export default StandingCard;
