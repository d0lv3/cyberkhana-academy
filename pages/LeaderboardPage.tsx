import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, Loader2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import LeaderboardPodium from '../components/leaderboard/LeaderboardPodium';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { api } from '../services/api';

type Scope = 'overall' | 'monthly';

interface LbEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  university: string | null;
  role: string;
  points: number;
}

interface LbResponse {
  scope: Scope;
  month: string;
  university: string | null;
  entries: LbEntry[];
  me: { rank: number; points: number } | null;
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
        if (res.universities.length) setUniversities(res.universities);
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

  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Whether the current user already appears in the visible top list.
  const meInList = !!user && entries.some((e) => e.userId === user._id);

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
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
                scope === s ? 'bg-[#1a2332] text-[#f3f6ff]' : 'text-[#6e7a94] hover:text-[#d2d7e3]'
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
              {u}
            </option>
          ))}
        </select>

        {scope === 'monthly' && (
          <span className="text-[11px] text-[#6e7a94] sm:ms-auto">
            {monthLabel ? `${monthLabel} · ` : ''}
            {t('leaderboard.monthlyReset')}
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
            <Trophy size={24} className="text-[#6e7a94]" />
          </div>
          <h3 className="text-base font-bold text-[#f3f6ff] mb-1.5">{t('leaderboard.empty')}</h3>
          <p className="text-sm text-[#6e7a94] max-w-sm mx-auto">{t('leaderboard.emptyDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top-3 podium */}
          <LeaderboardPodium top={podium} currentUserId={user?._id} />

          {/* Ranks 4+ */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden">
              {/* Header row */}
              <div
                className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 px-4 sm:px-5 py-3 border-b border-[#263248] text-[10px] font-bold uppercase tracking-wider text-[#6e7a94]"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                <span>{t('leaderboard.rank')}</span>
                <span>{t('leaderboard.student')}</span>
                <span className="hidden sm:block">{t('profile.university')}</span>
                <span className="text-end">{t('leaderboard.points')}</span>
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
                      className={`grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 items-center px-4 sm:px-5 py-3 ${
                        isMe ? 'bg-[#00a859]/10' : ''
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
                        {e.avatarUrl ? (
                          <img
                            src={e.avatarUrl}
                            alt={e.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-[#263248] flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-[#9fef00]">
                              {(e.displayName || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#f3f6ff] truncate">
                            {e.displayName}
                            {isMe && (
                              <span className="ms-2 text-[10px] font-bold text-[#00a859] uppercase">
                                {t('leaderboard.you')}
                              </span>
                            )}
                          </p>
                          {/* University on mobile (hidden column) */}
                          <p className="sm:hidden text-[11px] text-[#6e7a94] truncate inline-flex items-center gap-1">
                            <GraduationCap size={11} /> {e.university || '—'}
                          </p>
                        </div>
                      </div>

                      {/* University (desktop) */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#9aa5bf] min-w-0">
                        <GraduationCap size={13} className="text-[#6e7a94] flex-shrink-0" />
                        <span className="truncate">{e.university || '—'}</span>
                      </div>

                      {/* Points */}
                      <div className="text-end">
                        <span className="text-sm font-black text-[#f3f6ff]" dir="ltr">
                          {e.points.toLocaleString('en-US')}
                        </span>
                        <span className="text-[10px] text-[#6e7a94] ms-1">{t('leaderboard.pts')}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your standing, if outside the visible top list */}
          {data?.me && !meInList && (
            <div
              className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_10rem_auto] gap-3 items-center px-4 sm:px-5 py-3 rounded-2xl border border-[#00a859]/30 bg-[#00a859]/10"
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
                <p className="text-sm font-semibold text-[#f3f6ff] truncate">
                  {t('leaderboard.yourRank')}
                </p>
              </div>
              <div className="hidden sm:block" />
              <div className="text-end">
                <span className="text-sm font-black text-[#f3f6ff]" dir="ltr">
                  {data.me.points.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-[#6e7a94] ms-1">{t('leaderboard.pts')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not yet ranked hint */}
      {!loading && data && !data.me && (
        <p className="text-xs text-[#6e7a94] text-center">{t('leaderboard.notRanked')}</p>
      )}
    </div>
  );
};

export default LeaderboardPage;
