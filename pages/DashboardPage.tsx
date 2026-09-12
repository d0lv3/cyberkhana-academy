import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Network, ChevronRight, Play, Flame, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { modulePath } from '../data/fundamentalsData';
import { getAllModules } from '../data/modulesData';
import { getNetworkingLessons } from '../data/networking';
import { hasSimulation } from '../components/network-sim/types';
import { getOSModuleDoneCount } from '../services/progressService';
import { useJourney } from '../services/journeyService';
import { useXp } from '../services/xpService';
import { getStreak } from '../services/streakService';
import SkillMatrix from '../components/skills/SkillMatrix';
import { ContinueCard, StartHereCard } from '../components/dashboard/PrimaryCard';
import JourneyMap from '../components/dashboard/JourneyMap';
import ProgressStrip from '../components/dashboard/ProgressStrip';
import NextStepCard from '../components/dashboard/NextStepCard';
import StandingCard from '../components/dashboard/StandingCard';

/* ─── The dashboard ───
 *
 * Ordered by what the learner came for, not by what the app can measure.
 *
 *   1  the next thing to open, which is the whole point of the page
 *   2  where they stand in their own work
 *   3  what to take up after that
 *   4  the skill matrix, which is the shape of the work rather than its score
 *   5  level, XP and rank, and the smaller things around them
 *
 * Somebody who has finished nothing sees the same five, with the first two
 * replaced: where to start, and what the Academy is made of. They are not
 * shown a row of zeroes and asked to feel behind on their first day.
 */

/** Monday-first day initials for the streak pips. */
const WEEK_LABELS: Record<'en' | 'ar', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const ar = lang === 'ar';

  /* Sent here to see the levels (the level-up card or the profile): every
     such arrival has its own key, and each one opens the list. */
  const levelsRequest = (location.state as { focus?: string } | null)?.focus === 'levels' ? location.key : null;

  /* Where this learner is, read from their real progress and kept current. */
  const journey = useJourney();
  const { xp, level } = useXp();

  const streak = useMemo(() => getStreak(), []);

  /* The featured card follows whatever is actually published: the first
     networking lesson that ships a simulation, or nothing at all. */
  const featuredSim = useMemo(
    () => getNetworkingLessons().find((l) => hasSimulation(l.simulation)) ?? null,
    []
  );

  /* ── Modules the student has already started; falls back to a few to begin. ── */
  const moduleShortlist = useMemo(() => {
    const withProgress = getAllModules().map((m) => {
      const done = Math.min(getOSModuleDoneCount(m.slug), m.totalLessons);
      const pct = m.totalLessons > 0 ? Math.round((done / m.totalLessons) * 100) : 0;
      return { mod: m, done, pct };
    });
    const inProgress = withProgress
      .filter((x) => x.done > 0 && x.done < x.mod.totalLessons)
      .sort((a, b) => b.pct - a.pct);
    const fresh = withProgress.filter((x) => x.done === 0);
    return {
      started: inProgress.length > 0,
      items: (inProgress.length ? inProgress : fresh).slice(0, 4),
    };
  }, [journey.stopsDone]);

  const firstName = user?.displayName?.split(' ')[0] ?? (ar ? 'صديقي' : 'Student');

  /* The card at the top: the lesson left open, or failing that the one thing
     we would have them take up. A learner with progress but nothing to resume
     (a fresh browser, progress pulled down from the server) still gets a way
     in rather than an empty hero. */
  const hero = journey.resume ?? journey.recommended;
  const showNext =
    journey.started && journey.recommended !== null && journey.recommended.route !== hero?.route;

  return (
    <div className="space-y-6">
      {journey.started && hero ? (
        <>
          <p className="px-1 text-sm text-[#8592ad]">
            {t('dashboard.welcome')}
            {t('punct.comma')} <span className="font-semibold text-[#d2d7e3]">{firstName}</span>
          </p>
          <ContinueCard target={hero} path={journey.path} />
        </>
      ) : (
        <StartHereCard tracks={journey.tracks} firstName={firstName} />
      )}

      {journey.started ? <ProgressStrip journey={journey} /> : <JourneyMap />}

      {showNext && journey.recommended && <NextStepCard target={journey.recommended} />}

      {/* ── The shape of the work ── */}
      <div data-tour-id="skill-matrix">
        <SkillMatrix variant="compact" />
      </div>

      {/* ── The record of it ── */}
      <StandingCard xp={xp} level={level} levelsRequest={levelsRequest} />

      {/* ── Everything else ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Streak & weekly goal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] lg:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-[#263248] px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#f3f6ff]">
              <Flame size={17} className={streak.current > 0 ? 'text-[#f3a43a]' : 'text-[#7c8aa6]'} />
              {ar ? 'التتابع اليومي' : 'Daily streak'}
            </h2>
            <span className="text-xs text-[#8592ad]" dir="ltr">
              {ar ? 'الأطول' : 'best'} {streak.longest}
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center gap-4 sm:gap-6">
              {/* Current streak */}
              <div className="flex items-baseline gap-2" dir="ltr">
                <span className="text-3xl font-black text-[#f3f6ff] sm:text-4xl">{streak.current}</span>
                <span className="text-sm text-[#9aa5bf]">
                  {streak.current === 1 ? (ar ? 'يوم' : 'day') : ar ? 'أيام' : 'days'}
                </span>
              </div>

              {/* Week pips, Monday-first. Seven 32px pips plus their gaps come
                  to 260px, which does not fit a 320px phone, so they step down
                  below xs. */}
              <div className="flex items-center gap-1 xs:gap-1.5" dir="ltr">
                {streak.week.map((d, di) => (
                  <div
                    key={d.key}
                    title={d.key}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold transition-colors xs:h-8 xs:w-8 ${
                      d.done
                        ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                        : d.isToday
                        ? 'border-[#f3a43a]/40 bg-[#f3a43a]/10 text-[#f3a43a]'
                        : d.isFuture
                        ? 'border-[#1c2740] bg-[#0d1420] text-[#33415e]'
                        : 'border-[#263248] bg-[#0d1420] text-[#7c8aa6]'
                    }`}
                  >
                    {d.done ? <Check size={13} /> : WEEK_LABELS[lang][di]}
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly goal */}
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-xs" dir="ltr">
                <span className="text-[#9aa5bf]">{ar ? 'هدف الأسبوع' : 'Weekly goal'}</span>
                <span className="font-bold text-[#00a859]">
                  {streak.daysThisWeek}/{streak.weeklyGoal}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((streak.daysThisWeek / streak.weeklyGoal) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#8592ad]">
                {streak.daysThisWeek >= streak.weeklyGoal
                  ? ar
                    ? 'أنجزت هدف هذا الأسبوع.'
                    : "You've hit this week's goal."
                  : streak.todayDone
                  ? ar
                    ? 'تم التسجيل اليوم، أحسنت.'
                    : 'Today is logged, nice work.'
                  : ar
                  ? 'أكمل درسا واحدا اليوم للحفاظ على التتابع.'
                  : 'Finish one lesson today to keep the streak alive.'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Featured simulation, skipped entirely when nothing published has one */}
          {featuredSim && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#0a0f18]"
            >
              <div aria-hidden className="absolute -top-16 -end-16 h-48 w-48 rounded-full bg-[#60a5fa]/10 blur-3xl" />
              <div className="relative z-10 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Network size={15} className="text-[#60a5fa]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">
                    {t('dashboard.featuredSim')}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#f3f6ff]">{featuredSim.title[lang]}</h3>
                <p className="mb-5 line-clamp-3 text-xs leading-relaxed text-[#9aa5bf]">
                  {featuredSim.description[lang] || t('dashboard.simDesc')}
                </p>
                <button
                  onClick={() => navigate(`/fundamentals/networking/lesson/${featuredSim.slug}`)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#60a5fa]/25 bg-[#60a5fa]/10 px-4 py-2.5 text-sm font-semibold text-[#60a5fa] transition-all hover:bg-[#60a5fa]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/40"
                >
                  <Play size={14} /> {t('dashboard.tryNow')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Modules: resume the ones already started, else a few to begin */}
          {moduleShortlist.items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8592ad]">
                  {moduleShortlist.started
                    ? ar
                      ? 'وحدات قيد التقدم'
                      : 'Modules in progress'
                    : ar
                    ? 'ابدأ وحدة'
                    : 'Start a module'}
                </h3>
                <button
                  onClick={() => navigate('/modules')}
                  className="-me-2 flex-shrink-0 select-none text-[11px] font-semibold text-[#8592ad] transition-colors hover:text-[#00a859] touch:min-h-tap touch:px-2"
                >
                  {ar ? 'عرض الكل' : 'View all'}
                </button>
              </div>
              <div className="space-y-1">
                {moduleShortlist.items.map(({ mod, done, pct }) => (
                  <button
                    key={mod.id}
                    onClick={() => navigate(modulePath(mod))}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-[#182235]"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${mod.iconColor}15`,
                        border: `1px solid ${mod.iconColor}30`,
                      }}
                    >
                      <Layers size={15} style={{ color: mod.iconColor }} />
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="truncate text-sm font-medium text-[#9aa5bf] transition-colors group-hover:text-[#f3f6ff]">
                        {mod.title[lang] || mod.title.en}
                      </p>
                      {done > 0 ? (
                        <div className="mt-1.5 flex items-center gap-2" dir="ltr">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#0a0f18]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: mod.iconColor }}
                            />
                          </div>
                          <span className="flex-shrink-0 text-[10px] tabular-nums text-[#7c8aa6]">
                            {done}/{mod.totalLessons}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[10px] text-[#7c8aa6]" dir="ltr">
                          {mod.totalLessons} {t('dashboard.lessonsLabel')}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={15}
                      className="rtl-flip flex-shrink-0 text-[#7c8aa6] transition-colors group-hover:text-[#9aa5bf]"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
