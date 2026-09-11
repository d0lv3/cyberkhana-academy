import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, Loader2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import LeaderboardPodium from '../components/leaderboard/LeaderboardPodium';
import LevelBadge from '../components/ui/LevelBadge';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { api } from '../services/api';
import { profilePath } from '../services/profiles';
import { LEVELS } from '../services/xpService';
import { universityLabel, NOT_ENROLLED } from '../data/iraqUniversities';

type Scope = 'overall' | 'monthly';

interface LbEntry {
  rank: number;
  userId: string;
  /** Public handle, when claimed; the row links to the profile either way. */
  username?: string | null;
  displayName: string;
  avatarUrl: string | null;
  university: string | null;
  role: string;
  /** The board's score: XP since the last reset, or this month's XP. */
  points: number;
  /** Lifetime XP, which the level badge is read from. */
  xp: number;
}

interface LbResponse {
  scope: Scope;
  month: string;
  university: string | null;
  entries: LbEntry[];
  me: { rank: number; points: number; xp: number } | null;
  /** The requesting member's lifetime XP, ranked or not. */
  myXp?: number;
  /** Lifetime XP needed to be ranked at all (level 0x2). */
  minXp?: number;
  /** When the all-time board was last reset, if ever. */
  since?: string | null;
  universities: string[];
}

const selectCls =
  'bg-[#121a2a] border border-[#263248] rounded-lg px-3 py-2.5 text-xs font-semibold text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors cursor-pointer';

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [scope, setScope] = useState<Scope>('overall');
  const [university, setUniversity] = useState('');
  const [data, setData] = useState<LbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (university) params.set('university', university);
    api
      .get<LbResponse>(`/leaderboard?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Keep the dropdown populated regardless of the active filter.
        // Exclude the "not enrolled" sentinel — it isn't a real university.
        const named = res.universities.filter((u) => u && u !== NOT_ENROLLED);
        if (named.length) setUniversities(named);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, university]);

  const monthLabel = useMemo(() => {
    if (!data?.month) return '';
    try {
      const [y, m] = data.month.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return data.month;
    }
  }, [data?.month, lang]);

  /* The all-time board counts from the last admin reset, so it says so. */
  const sinceLabel = useMemo(() => {
    if (!data?.since) return '';
    const date = new Date(data.since);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [data?.since, lang]);

  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Whether the current user already appears in the visible top list.
  const meInList = !!user && entries.some((e) => e.userId === user._id);
  const ar = lang === 'ar';
  const minXp = data?.minXp ?? LEVELS[1].minXp;
  const firstRanked = LEVELS.find((l) => l.minXp === minXp) ?? LEVELS[1];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        iconColor="#f3c84b"
        title={t('leaderboard.title')}
        subtitle={t('leaderboard.subtitle')}
      />

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Scope tabs */}
        <div className="flex items-center bg-[#0b1019] border border-[#263248] rounded-lg p-0.5 w-fit">
          {(['overall', 'monthly'] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3.5 py-2 touch:min-h-tap touch:px-4 rounded-md text-xs font-bold transition-colors select-none ${
                scope === s ? 'bg-[#1a2332] text-[#f3f6ff]' : 'text-[#8592ad] hover:text-[#d2d7e3]'
              }`}
            >
              {t(s === 'overall' ? 'leaderboard.overall' : 'leaderboard.monthly')}
            </button>
          ))}
        </div>

        {/* University filter */}
        <select value={university} onChange={(e) => setUniversity(e.target.value)} className={selectCls}>
          <option value="">{t('leaderboard.allUniversities')}</option>
          {universities.map((u) => (
            <option key={u} value={u}>
              {universityLabel(u, lang).text || u}
            </option>
          ))}
        </select>

        {scope === 'monthly' && (
          <span className="text-[11px] text-[#8592ad] sm:ms-auto">
            {monthLabel ? `${monthLabel} · ` : ''}
            {t('leaderboard.monthlyReset')}
          </span>
        )}
        {scope === 'overall' && sinceLabel && (
          <span className="text-[11px] text-[#8592ad] sm:ms-auto">
            {ar ? `منذ ${sinceLabel}` : `Since ${sinceLabel}`}
          </span>
        )}
      </div>

      {/* ── Board ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#00a859]" size={26} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[#121a2a] border border-[#263248] flex items-center justify-center mx-auto mb-4">
            <Trophy size={24} className="text-[#8592ad]" />
          </div>
          <h3 className="text-base font-bold text-[#f3f6ff] mb-1.5">{t('leaderboard.empty')}</h3>
          <p className="text-sm text-[#8592ad] max-w-sm mx-auto">{t('leaderboard.emptyDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top-3 podium, each card linking to its profile */}
          <LeaderboardPodium top={podium} currentUserId={user?._id} />

          {/* Ranks 4+ */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden">
              {/* Header row */}
              <div
                className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 px-4 sm:px-5 py-3 border-b border-[#263248] text-[10px] font-bold uppercase tracking-wider text-[#8592ad]"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                <span>{t('leaderboard.rank')}</span>
                <span>{t('leaderboard.student')}</span>
                <span className="hidden sm:block">{t('profile.university')}</span>
                <span className="text-end">XP</span>
              </div>

              <div className="divide-y divide-[#263248]/60">
                {rest.map((e, i) => {
                  const isMe = !!user && e.userId === user._id;
                  return (
                    <motion.div
                      key={e.userId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                    >
                    {/* The whole row opens the member's profile. */}
                    <Link
                      to={profilePath({ id: e.userId, username: e.username }) ?? '/leaderboard'}
                      className={`grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 items-center px-4 sm:px-5 py-3 transition-colors focus:outline-none focus-visible:bg-[#1a2332] ${
                        isMe ? 'bg-[#00a859]/10 hover:bg-[#00a859]/15' : 'hover:bg-[#1a2332]/70'
                      }`}
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {/* Rank */}
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black text-[#9aa5bf]">
                          {e.rank}
                        </span>
                      </div>

                      {/* Student */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          avatarUrl={e.avatarUrl}
                          name={e.displayName}
                          className="w-9 h-9 rounded-full"
                          initialClassName="text-sm"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 min-w-0 text-sm font-semibold text-[#f3f6ff]">
                            <span className="truncate" dir="auto">
                              {e.displayName}
                            </span>
                            <LevelBadge xp={e.xp} lang={lang} compact className="flex-shrink-0" />
                            {isMe && (
                              <span className="text-[10px] font-bold text-[#00a859] uppercase flex-shrink-0">
                                {t('leaderboard.you')}
                              </span>
                            )}
                          </p>
                          {/* University on mobile (hidden column) */}
                          <p className="sm:hidden text-[11px] text-[#8592ad] truncate inline-flex items-center gap-1">
                            <GraduationCap size={11} /> {(() => { const u = universityLabel(e.university, lang); return u.isSet && !u.isNotEnrolled ? u.text : '-'; })()}
                          </p>
                        </div>
                      </div>

                      {/* University (desktop) */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#9aa5bf] min-w-0">
                        <GraduationCap size={13} className="text-[#8592ad] flex-shrink-0" />
                        <span className="truncate">{(() => { const u = universityLabel(e.university, lang); return u.isSet && !u.isNotEnrolled ? u.text : '-'; })()}</span>
                      </div>

                      {/* XP */}
                      <div className="text-end">
                        <span className="text-sm font-black text-[#f3f6ff]" dir="ltr">
                          {e.points.toLocaleString('en-US')}
                        </span>
                        <span className="text-[10px] text-[#8592ad] ms-1">XP</span>
                      </div>
                    </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your standing, if outside the visible top list */}
          {data?.me && !meInList && (
            <Link
              to={profilePath({ id: user?._id, username: user?.username }) ?? '/profile'}
              className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 items-center px-4 sm:px-5 py-3 rounded-2xl border border-[#00a859]/30 bg-[#00a859]/10 transition-colors hover:bg-[#00a859]/15"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black text-[#00a859]">
                  {data.me.rank}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#0e1522] border border-[#00a859]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-[#9fef00]">
                    {(user?.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="flex items-center gap-2 min-w-0 text-sm font-semibold text-[#f3f6ff]">
                  <span className="truncate">{t('leaderboard.yourRank')}</span>
                  <LevelBadge xp={data.me.xp} lang={lang} compact className="flex-shrink-0" />
                </p>
              </div>
              <div className="hidden sm:block" />
              <div className="text-end">
                <span className="text-sm font-black text-[#f3f6ff]" dir="ltr">
                  {data.me.points.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-[#8592ad] ms-1">XP</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Not yet ranked: how to get on the board */}
      {!loading && data && !data.me && (
        <p className="text-xs text-[#8592ad] text-center">
          {(data.myXp ?? 0) < minXp ? (
            ar ? (
              <>
                تظهر في لوحة المتصدرين عند بلوغ المستوى{' '}
                <span dir="ltr" className="font-mono">
                  {firstRanked.hex}
                </span>{' '}
                {firstRanked.name.ar}، أي{' '}
                <span dir="ltr">{minXp.toLocaleString('en-US')} XP</span>. لديك الآن{' '}
                <span dir="ltr">{(data.myXp ?? 0).toLocaleString('en-US')} XP</span>.
              </>
            ) : (
              <>
                You join the leaderboard at level{' '}
                <span className="font-mono">{firstRanked.hex}</span> {firstRanked.name.en},{' '}
                {minXp.toLocaleString('en-US')} XP. You have {(data.myXp ?? 0).toLocaleString('en-US')} XP so far.
              </>
            )
          ) : ar ? (
            'أكمل المزيد من المحتوى لتظهر في هذه اللوحة.'
          ) : (
            'Complete more content to appear on this board.'
          )}
        </p>
      )}
    </div>
  );
};

export default LeaderboardPage;
