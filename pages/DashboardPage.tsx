import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  Zap,
  ArrowRight,
  Network,
  ChevronRight,
  Play,
  Flame,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getFundamentalsByCategory, moduleViewerPath } from '../data/fundamentalsData';
import { getAllModules } from '../data/modulesData';
import { getNetworkingLessons } from '../data/networking';
import { getProgrammingLanguages } from '../data/programming';
import {
  getProgrammingDone,
  getNetworkingDone,
  getOSModuleDoneCount,
  getLastActivity,
} from '../services/progressService';
import { getStreak } from '../services/streakService';
import SkillMatrix from '../components/skills/SkillMatrix';

/** Monday-first day initials for the streak pips. */
const WEEK_LABELS: Record<'en' | 'ar', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

/* ── circular progress ring ── */
const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}> = ({ progress, size = 110, stroke = 9, color = '#00a859', children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(progress, 100) / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2332" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  /* ── compute real content + local progress ── */
  const data = useMemo(() => {
    const python = getProgrammingLanguages().find((l) => l.slug === 'python');
    const pyModules = python?.modules ?? [];
    const pyConcepts = pyModules.flatMap((m) =>
      m.concepts.map((c) => ({ ...c, moduleSlug: m.slug }))
    );

    const doneSet = getProgrammingDone('python');
    const pyDone = pyConcepts.filter((c) => doneSet.has(c.id)).length;
    const nextConcept = pyConcepts.find((c) => !doneSet.has(c.id)) ?? pyConcepts[0];

    const osModules = getFundamentalsByCategory('operating-systems');
    const osLessonsTotal = osModules.reduce((s, m) => s + m.totalLessons, 0);
    const osDone = osModules.reduce(
      (s, m) => s + Math.min(getOSModuleDoneCount(m.slug), m.totalLessons),
      0
    );
    const netLessons = getNetworkingLessons();
    const netTotal = netLessons.length;
    const netDoneSet = getNetworkingDone();
    const netDone = netLessons.filter((l) => netDoneSet.has(l.id)).length;

    const completedUnits = pyDone + osDone + netDone;
    const totalUnits = pyConcepts.length + osLessonsTotal + netTotal;
    const overallPct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    const xp = completedUnits * 20;
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;

    const lastActivity = getLastActivity();

    return {
      pyModules,
      pyConcepts,
      pyDone,
      nextConcept,
      osLessonsTotal,
      osDone,
      netTotal,
      netDone,
      completedUnits,
      totalUnits,
      overallPct,
      xp,
      level,
      xpInLevel,
      lastActivity,
      started: completedUnits > 0,
    };
  }, []);

  const streak = useMemo(() => getStreak(), []);

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
  }, []);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Student';

  const nextLink = data.nextConcept
    ? `/fundamentals/programming/python/${data.nextConcept.moduleSlug}/${data.nextConcept.slug}`
    : '/fundamentals/programming';

  /* The hero's Continue button resumes the most recent activity on any track,
     falling back to the next Python concept for brand-new students. */
  const jumpRoute = data.lastActivity?.route ?? nextLink;

  return (
    <div className="space-y-6">
      {/* ── Greeting hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        {/* neon grid + glow */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(159,239,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.4) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="absolute -top-24 -right-10 w-72 h-72 bg-[#00a859]/10 rounded-full blur-[90px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f6ff]">
              {t('dashboard.welcome')}, {firstName} 👋
            </h1>
            <p className="text-[#9aa5bf] mt-2 max-w-md">{t('dashboard.subtitle')}</p>

            {/* Overall progress */}
            <div className="mt-5 max-w-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs" dir="ltr">
                <span className="text-[#9aa5bf]">{t('dashboard.overall')}</span>
                <span className="font-bold text-[#9fef00]">{data.overallPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#0a0f18] overflow-hidden" dir="ltr">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                  style={{ width: `${data.overallPct}%` }}
                />
              </div>
              <p className="text-[10px] text-[#6e7a94] mt-1" dir="ltr">
                {data.completedUnits} / {data.totalUnits} {t('dashboard.lessonsLabel')}
              </p>
            </div>

            <button
              onClick={() => navigate(jumpRoute)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#9fef00] text-[#0d1117] font-bold text-sm hover:bg-[#8dd900] transition-all hover:shadow-[0_0_20px_rgba(159,239,0,0.35)]"
            >
              {data.started ? t('dashboard.continueBtn') : t('dashboard.start')}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Level ring */}
          <div className="flex items-center gap-5 self-start md:self-center" dir="ltr">
            <ProgressRing progress={data.xpInLevel} color="#9fef00">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e7a94]">
                {t('dashboard.level')}
              </span>
              <span className="text-3xl font-black text-[#f3f6ff] leading-none">{data.level}</span>
            </ProgressRing>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 text-[#9fef00]">
                <Zap size={15} />
                <span className="text-xl font-black">{data.xp}</span>
                <span className="text-xs font-semibold text-[#6e7a94]">{t('dashboard.xp')}</span>
              </div>
              <p className="text-xs text-[#6e7a94] mt-1">
                {100 - data.xpInLevel} {t('dashboard.toNextLevel')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Skill Matrix ── */}
      <SkillMatrix variant="compact" />

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Streak & weekly goal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#263248]">
              <h2 className="text-base font-bold text-[#f3f6ff] flex items-center gap-2">
                <Flame size={17} className={streak.current > 0 ? 'text-[#f3a43a]' : 'text-[#4d5a73]'} />
                {lang === 'ar' ? 'التتابع اليومي' : 'Daily streak'}
              </h2>
              <span className="text-xs text-[#6e7a94]" dir="ltr">
                {lang === 'ar' ? 'الأطول' : 'best'} {streak.longest}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Current streak */}
                <div className="flex items-baseline gap-2" dir="ltr">
                  <span className="text-4xl font-black text-[#f3f6ff]">{streak.current}</span>
                  <span className="text-sm text-[#9aa5bf]">
                    {streak.current === 1
                      ? lang === 'ar' ? 'يوم' : 'day'
                      : lang === 'ar' ? 'أيام' : 'days'}
                  </span>
                </div>

                {/* Week pips, Monday-first */}
                <div className="flex items-center gap-1.5" dir="ltr">
                  {streak.week.map((d, di) => (
                    <div
                      key={d.key}
                      title={d.key}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors ${
                        d.done
                          ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                          : d.isToday
                          ? 'border-[#f3a43a]/40 bg-[#f3a43a]/10 text-[#f3a43a]'
                          : d.isFuture
                          ? 'border-[#1c2740] bg-[#0d1420] text-[#33415e]'
                          : 'border-[#263248] bg-[#0d1420] text-[#4d5a73]'
                      }`}
                    >
                      {d.done ? <Check size={13} /> : WEEK_LABELS[lang][di]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly goal */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-1.5 text-xs" dir="ltr">
                  <span className="text-[#9aa5bf]">
                    {lang === 'ar' ? 'هدف الأسبوع' : 'Weekly goal'}
                  </span>
                  <span className="font-bold text-[#00a859]">
                    {streak.daysThisWeek}/{streak.weeklyGoal}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0a0f18] overflow-hidden" dir="ltr">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round((streak.daysThisWeek / streak.weeklyGoal) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#6e7a94] mt-2">
                  {streak.daysThisWeek >= streak.weeklyGoal
                    ? lang === 'ar'
                      ? 'أنجزت هدف هذا الأسبوع.'
                      : "You've hit this week's goal."
                    : streak.todayDone
                    ? lang === 'ar'
                      ? 'تم التسجيل اليوم — أحسنت.'
                      : 'Today is logged — nice work.'
                    : lang === 'ar'
                    ? 'أكمل درسا واحدا اليوم للحفاظ على التتابع.'
                    : 'Finish one lesson today to keep the streak alive.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* Featured simulation */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#0a0f18]"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#60a5fa]/10 rounded-full blur-3xl" />
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Network size={15} className="text-[#60a5fa]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">
                  {t('dashboard.featuredSim')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#f3f6ff] mb-2">
                {lang === 'ar' ? 'عنونة IP والاتصالات' : 'IP Addressing & NAT'}
              </h3>
              <p className="text-xs text-[#9aa5bf] leading-relaxed mb-5">{t('dashboard.simDesc')}</p>
              <button
                onClick={() => navigate('/fundamentals/networking/lesson/ip-addressing')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#60a5fa]/10 border border-[#60a5fa]/25 text-[#60a5fa] text-sm font-semibold hover:bg-[#60a5fa]/20 transition-all"
              >
                <Play size={14} /> {t('dashboard.tryNow')}
              </button>
            </div>
          </motion.div>

          {/* Modules — resume the ones already started, else a few to begin */}
          {moduleShortlist.items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4"
            >
              <div className="flex items-center justify-between px-2 mb-3 gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">
                  {moduleShortlist.started
                    ? lang === 'ar'
                      ? 'وحدات قيد التقدم'
                      : 'Modules in progress'
                    : lang === 'ar'
                    ? 'ابدأ وحدة'
                    : 'Start a module'}
                </h3>
                <button
                  onClick={() => navigate('/modules')}
                  className="text-[11px] font-semibold text-[#6e7a94] hover:text-[#00a859] transition-colors flex-shrink-0"
                >
                  {lang === 'ar' ? 'عرض الكل' : 'View all'}
                </button>
              </div>
              <div className="space-y-1">
                {moduleShortlist.items.map(({ mod, done, pct }) => (
                  <button
                    key={mod.id}
                    onClick={() => navigate(moduleViewerPath(mod))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#182235] transition-all group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${mod.iconColor}15`,
                        border: `1px solid ${mod.iconColor}30`,
                      }}
                    >
                      <Layers size={15} style={{ color: mod.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <p className="text-sm font-medium text-[#9aa5bf] group-hover:text-[#f3f6ff] transition-colors truncate">
                        {mod.title[lang] || mod.title.en}
                      </p>
                      {done > 0 ? (
                        <div className="mt-1.5 flex items-center gap-2" dir="ltr">
                          <div className="h-1 flex-1 rounded-full bg-[#0a0f18] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: mod.iconColor }}
                            />
                          </div>
                          <span className="text-[10px] text-[#4d5a73] tabular-nums flex-shrink-0">
                            {done}/{mod.totalLessons}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#4d5a73] mt-0.5" dir="ltr">
                          {mod.totalLessons} {t('dashboard.lessonsLabel')}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-[#4d5a73] group-hover:text-[#9aa5bf] transition-colors flex-shrink-0 rtl-flip"
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
