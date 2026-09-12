import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Compass, GraduationCap, Network, Play, Terminal } from 'lucide-react';
import ProgressRing from '../ui/ProgressRing';
import { startTour } from '../tour/TourHost';
import { useLang } from '../../contexts/LangContext';
import type { Journey, JourneyTarget } from '../../services/journeyService';
import type { TrackProgress } from '../../services/progressService';
import { TARGET_META } from './targetMeta';

/* ─── The top of the dashboard ───
 *
 * One card, and it is the only thing on this page anyone has to read. What it
 * says depends on a single question: has this learner finished anything yet.
 *
 * Nobody arrives wanting statistics. Somebody who has never started wants to
 * be told where to start, and somebody who has wants the lesson they left
 * open. Both are one button. Everything a dashboard usually leads with, the
 * counters and the level and the charts, is further down the page where it
 * belongs: it is a record of learning, and there is nothing to record yet
 * when the answer to the only question is no.
 */

/** The hero's shell: the brand's grid and glow, shared by both states so the
 *  page does not change identity when the learner starts. */
const HeroShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.section
    data-tour-id="dashboard-primary"
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    className="relative overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
  >
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(159,239,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.4) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    />
    <div aria-hidden className="absolute -top-24 -end-10 h-72 w-72 rounded-full bg-[#00a859]/10 blur-[90px]" />
    <div className="relative z-10 p-6 sm:p-8">{children}</div>
  </motion.section>
);

const PILLARS = [
  {
    key: 'programming' as const,
    icon: Code2,
    color: '#9fef00',
    title: { en: 'Programming', ar: 'البرمجة' },
    body: { en: 'Write and run real code in the browser', ar: 'اكتب كودا حقيقيا ونفذه في المتصفح' },
  },
  {
    key: 'networking' as const,
    icon: Network,
    color: '#60a5fa',
    title: { en: 'Networking', ar: 'الشبكات' },
    body: { en: 'Watch packets move through a live topology', ar: 'شاهد الحزم تنتقل في طوبولوجيا حية' },
  },
  {
    key: 'os' as const,
    icon: Terminal,
    color: '#f3a43a',
    title: { en: 'Operating systems', ar: 'أنظمة التشغيل' },
    body: { en: 'Learn the shell by working at one', ar: 'تعلم الطرفية بالعمل عليها' },
  },
];

/* ── Nothing finished yet ── */

export const StartHereCard: React.FC<{ tracks: TrackProgress[]; firstName: string }> = ({
  tracks,
  firstName,
}) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const totalOf = (key: TrackProgress['key']) => tracks.find((t) => t.key === key)?.total ?? 0;

  return (
    <HeroShell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="min-w-0">
          <p className="text-eyebrow text-[#00a859]">{ar ? 'ابدأ من هنا' : 'Start here'}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl">
            {ar ? `أهلا ${firstName}، ابدأ بالأساسيات` : `Welcome, ${firstName}. Begin with Fundamentals.`}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9aa5bf]">
            {ar
              ? 'الأمن السيبراني يقوم على ثلاث ركائز: البرمجة والشبكات وأنظمة التشغيل. خذها بالترتيب، وستفهم كل وحدة ومسار بعدها. تبدأ من أول درس ولا تحتاج إلى أي إعداد.'
              : 'Security stands on three pillars: programming, networking and operating systems. Take them in order and every module and path after them makes sense. You start at the first lesson, and there is nothing to install.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/fundamentals')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9fef00] px-5 py-3 text-sm font-black text-[#0d1117] transition-all hover:bg-[#8dd900] hover:shadow-[0_0_20px_rgba(159,239,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
            >
              {ar ? 'ابدأ الأساسيات' : 'Start Fundamentals'}
              <ArrowRight size={16} className="rtl-flip" />
            </button>
            <button
              onClick={startTour}
              className="inline-flex items-center gap-2 rounded-xl border border-[#263248] px-4 py-3 text-sm font-semibold text-[#d2d7e3] transition-colors hover:border-[#00a859]/50 hover:text-[#00a859] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50 touch:min-h-tap"
            >
              <Compass size={16} />
              {ar ? 'جولة في الأكاديمية' : 'Tour the Academy'}
            </button>
          </div>
        </div>

        {/* The three pillars, with what is actually published in each. */}
        <ul className="space-y-2.5">
          {PILLARS.map((pillar) => {
            const total = totalOf(pillar.key);
            const Icon = pillar.icon;
            return (
              <li
                key={pillar.key}
                className="flex items-start gap-3 rounded-xl border border-[#1e293b] bg-[#0e1522]/70 p-3"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${pillar.color}15`, border: `1px solid ${pillar.color}30` }}
                >
                  <Icon size={15} style={{ color: pillar.color }} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#f3f6ff]">{pillar.title[lang]}</p>
                  <p className="text-[11px] leading-snug text-[#8592ad]">{pillar.body[lang]}</p>
                  {total > 0 && (
                    <p className="mt-0.5 text-[11px] font-semibold text-[#7c8aa6]" dir="ltr">
                      {total} {ar ? 'درسا' : total === 1 ? 'lesson' : 'lessons'}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </HeroShell>
  );
};

/* ── Something already underway ── */

export const ContinueCard: React.FC<{ target: JourneyTarget; path: Journey['path'] }> = ({
  target,
  path,
}) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const meta = TARGET_META[target.kind];
  const Icon = meta.icon;
  const pct = target.progress?.pct ?? 0;

  return (
    <HeroShell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-eyebrow text-[#00a859]">{ar ? 'تابع التعلم' : 'Continue learning'}</p>

          <div className="mt-2 flex items-center gap-2 text-xs font-semibold" style={{ color: meta.color }}>
            <Icon size={14} />
            <span className="truncate">{target.context?.[lang] || meta.label[lang]}</span>
          </div>

          <h1 className="mt-1.5 text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl">
            {target.title[lang] || target.title.en}
          </h1>

          {target.progress && target.progress.total > 0 && (
            <div className="mt-4 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold" dir="ltr">
                <span className="text-[#8592ad]">
                  {target.progress.done} / {target.progress.total}{' '}
                  <span className="font-normal">{ar ? '' : target.progress.total === 1 ? 'lesson' : 'lessons'}</span>
                </span>
                <span className="text-[#00a859]">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0a0f18]" dir="ltr">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(target.route)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9fef00] px-5 py-3 text-sm font-black text-[#0d1117] transition-all hover:bg-[#8dd900] hover:shadow-[0_0_20px_rgba(159,239,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]/60 touch:min-h-tap"
            >
              <Play size={15} />
              {ar ? 'تابع' : 'Continue'}
            </button>

            {/* The path this sits inside, when the learner has joined one. */}
            {path && (
              <button
                onClick={() => navigate(`/paths/${path.path.slug}`)}
                className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-[#263248] px-4 py-3 text-xs font-semibold text-[#9aa5bf] transition-colors hover:border-[#a78bfa]/50 hover:text-[#d2d7e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/40 touch:min-h-tap"
              >
                <GraduationCap size={14} className="flex-shrink-0 text-[#a78bfa]" />
                <span className="truncate">{path.path.title[lang] || path.path.title.en}</span>
                <span className="flex-shrink-0 font-bold text-[#a78bfa]" dir="ltr">
                  {path.progress.pct}%
                </span>
              </button>
            )}
          </div>
        </div>

        {/* How far through the thing being resumed, at a glance. */}
        {target.progress && target.progress.total > 0 && (
          <ProgressRing progress={pct} size={132} stroke={8} color={meta.color} className="hidden lg:block">
            <span className="text-2xl font-black text-[#f3f6ff]" dir="ltr">
              {pct}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8592ad]">
              {ar ? 'من هذه الوحدة' : 'of this course'}
            </span>
          </ProgressRing>
        )}
      </div>
    </HeroShell>
  );
};
