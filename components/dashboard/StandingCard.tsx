import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { api } from '../../services/api';
import type { LevelProgress } from '../../services/xpService';
import LevelSummary from './LevelSummary';

/* ─── The record of the learning ───
 *
 * Level, XP and where that puts the learner among everyone else. A new
 * learner sees the level here while the hero teaches the three foundations;
 * once learning starts, that level moves into the hero and this card keeps
 * the all-time rank below the learning content.
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
  showLevel?: boolean;
}> = ({ xp, level, levelsRequest, showLevel = true }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';

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
      aria-label={showLevel ? (ar ? 'مستواك وترتيبك' : 'Your level and rank') : ar ? 'ترتيبك' : 'Your rank'}
    >
      <div className={`flex flex-col gap-6 sm:flex-row sm:items-center ${showLevel ? 'sm:justify-between' : 'sm:justify-end'}`}>
        {/* A new learner's hero uses this space to explain the three
            foundations, so their level remains here. Once learning starts,
            the same control moves into the hero's top-right. */}
        {showLevel && (
          <LevelSummary xp={xp} level={level} lang={lang} openRequest={levelsRequest} />
        )}

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
