import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Route, Clock, ListChecks, ChevronRight, Check, Lock, ArrowLeft } from 'lucide-react';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import Button from '../../components/ui/EnhancedButton';
import { useLang } from '../../contexts/LangContext';
import { coverImageSrc } from '../../data/fundamentalsData';
import PathJourneyMap from '../../components/paths/PathJourneyMap';
import { getPublishedPathBySlug } from '../../services/creatorDataService';
import { getPathProgress, isPathEnrolled, enrollInPath } from '../../services/progressService';

/** One number and what it counts, the same tile a module's page uses. */
const PathStat: React.FC<{
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  accent: string;
}> = ({ icon: Icon, value, label, accent }) => (
  <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4 transition-colors hover:border-[#354562] sm:p-5">
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
      style={{ borderColor: `${accent}40`, backgroundColor: `${accent}14`, color: accent }}
    >
      <Icon size={19} />
    </span>
    <p className="mt-3 text-2xl font-black leading-none text-[#f3f6ff] sm:text-[1.75rem]" dir="ltr">
      {value}
    </p>
    <p className="mt-1.5 text-xs font-medium text-[#8592ad]">{label}</p>
  </div>
);

const PathDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const path = getPublishedPathBySlug(slug || '');
  const [enrolled, setEnrolled] = useState(() => (path ? isPathEnrolled(path.id) : false));

  if (!path) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">{t('paths.notFound')}</h2>
          <Button variant="outline" onClick={() => navigate('/paths')}>
            {t('paths.back')}
          </Button>
        </div>
      </div>
    );
  }

  const progress = getPathProgress(path.steps);
  const isComplete = progress.total > 0 && progress.completed === progress.total;
  const firstAvailable = progress.states.findIndex((s) => s.available);

  const handleEnroll = () => {
    enrollInPath(path.id);
    setEnrolled(true);
  };

  const goToNext = () => {
    const idx = progress.nextIndex >= 0 ? progress.nextIndex : firstAvailable;
    if (idx >= 0) navigate(progress.states[idx].route);
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/paths')}
        className="inline-flex items-center gap-2 touch:min-h-tap text-sm text-[#8592ad] hover:text-[#d2d7e3] transition-colors select-none"
      >
        <ArrowLeft size={16} className="rtl-flip" />
        <span>{t('sidebar.paths')}</span>
      </button>

      {/* ── Hero ──
          One card on one background, the way a module's front door is built.
          The cover used to be a full-bleed band with the title floating on a
          scrim over it, which made the top half of the page a different
          surface from the bottom half, and the seam between them was the first
          thing you saw. It is a picture on the card now, at the size a picture
          needs to be, and everything sits on the same ground. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        <div className="relative p-6 md:p-8">
          {/* Accent wash, tinted by the path's own colour */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(90% 120% at 0% 0%, ${path.color}22 0%, transparent 60%)` }}
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {/* ── The cover ── */}
            <div className="w-full max-w-[220px] flex-shrink-0">
              <div
                className="relative aspect-square w-full overflow-hidden rounded-xl border"
                style={{ borderColor: `${path.color}40`, backgroundColor: `${path.color}0f` }}
              >
                {path.coverImage ? (
                  <img
                    src={coverImageSrc(path.coverImage)}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(120% 110% at 20% 0%, ${path.color}33 0%, #0d1424 62%)` }}
                  >
                    <Route
                      size={150}
                      className="absolute -bottom-5 -end-4 opacity-[0.12]"
                      style={{ color: path.color }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── What you decide with ── */}
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                    style={{ color: path.color, backgroundColor: `${path.color}1f`, borderColor: `${path.color}55` }}
                  >
                    <Route size={13} /> {t('sidebar.paths')}
                  </span>
                  <DifficultyBadge difficulty={path.difficulty} className="backdrop-blur-sm" />
                </div>

                <h1 className="text-2xl font-black leading-tight text-[#f3f6ff] sm:text-3xl lg:text-4xl">
                  {path.title[lang] || path.title.en}
                </h1>

                {(path.description[lang] || path.description.en) && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9aa5bf]">
                    {path.description[lang] || path.description.en}
                  </p>
                )}
              </div>

              {/* The way in, and how far in you already are */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                {enrolled ? (
                  firstAvailable >= 0 && (
                    <button
                      onClick={goToNext}
                      className="group inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#00a859]/45 bg-[#00a859]/12 px-6 py-3.5 text-sm font-bold text-[#00a859] shadow-lg shadow-[#00a859]/5 backdrop-blur-md transition-all hover:border-[#9fef00]/60 hover:bg-[#00a859]/20 hover:text-[#9fef00]"
                    >
                      {isComplete ? t('paths.review') : t('paths.continue')}
                      <ChevronRight
                        size={15}
                        className="rtl-flip transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="group inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#9fef00]/45 bg-[#9fef00]/12 px-6 py-3.5 text-sm font-bold text-[#9fef00] shadow-lg shadow-[#9fef00]/5 backdrop-blur-md transition-all hover:border-[#9fef00]/70 hover:bg-[#9fef00]/20"
                  >
                    {t('paths.enroll')}
                    <ChevronRight
                      size={15}
                      className="rtl-flip transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                )}

                {enrolled && progress.total > 0 && (
                  <div className="w-full lg:w-[19rem] lg:flex-shrink-0" dir="ltr">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a859]">
                        <Check size={13} /> {isComplete ? t('paths.completed') : t('paths.enrolled')}
                      </span>
                      <span className="text-xs font-medium text-[#9aa5bf]">
                        {progress.completed}/{progress.total} · {progress.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#0a0f18]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── The path at a glance ── */}
      <div className="grid max-w-lg grid-cols-2 gap-3">
        <PathStat
          icon={ListChecks}
          value={progress.total}
          label={t('paths.stepsLabel')}
          accent={path.color}
        />
        <PathStat
          icon={Clock}
          value={`${path.estimatedHours}${lang === 'ar' ? 'س' : 'h'}`}
          label={lang === 'ar' ? 'الوقت المقدر' : 'Estimated time'}
          accent="#60a5fa"
        />
      </div>

      {/* ── Curriculum timeline ── */}
      <div>
        <h2 className="text-sm font-bold text-[#f3f6ff] mb-4">{t('paths.curriculum')}</h2>

        {/* Desktop: the curriculum as a climbing road of floating cubes */}
        <div className="hidden md:block">
          <PathJourneyMap
            steps={path.steps}
            states={progress.states}
            nextIndex={progress.nextIndex}
            color={path.color}
            onOpen={(idx) => {
              const st = progress.states[idx];
              if (st?.available) navigate(st.route);
            }}
          />
        </div>

        {/* Mobile: vertical curriculum list */}
        <div className="relative max-w-3xl md:hidden">
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-[#263248]" />

          <div className="space-y-3">
            {path.steps.map((step, idx) => {
              const st = progress.states[idx];
              const isNext = enrolled && idx === progress.nextIndex;
              return (
                <motion.button
                  key={`${step.kind}-${step.refId}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + idx * 0.05, duration: 0.35 }}
                  onClick={() => st.available && navigate(st.route)}
                  disabled={!st.available}
                  className={`relative z-10 w-full flex items-center gap-4 rounded-xl border bg-[#121a2a] p-4 text-left transition-all group ${
                    st.available
                      ? isNext
                        ? 'border-[#00a859]/50 hover:border-[#00a859]'
                        : 'border-[#263248] hover:border-[#354562]'
                      : 'border-[#263248] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
                    style={{
                      backgroundColor: st.complete ? '#00a859' : '#0d1117',
                      color: st.complete ? '#0d1117' : st.available ? step.accent : '#4d5a73',
                      borderColor: st.complete
                        ? '#00a859'
                        : st.available
                        ? `${step.accent}55`
                        : '#263248',
                    }}
                    dir="ltr"
                  >
                    {st.complete ? <Check size={16} /> : st.available ? idx + 1 : <Lock size={13} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-bold truncate transition-colors ${
                        st.available
                          ? 'text-[#f3f6ff] group-hover:text-[#00a859]'
                          : 'text-[#8592ad]'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                      {step.subtitle && (
                        <p className="text-xs text-[#8592ad] truncate">{step.subtitle}</p>
                      )}
                      {!st.available && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#1a2332] border border-[#263248] text-[#8592ad]">
                          <Lock size={8} /> {t('paths.unavailable')}
                        </span>
                      )}
                    </div>
                  </div>
                  {st.available && (
                    <ChevronRight
                      size={18}
                      className="text-[#7c8aa6] group-hover:text-[#00a859] transition-colors flex-shrink-0 rtl-flip"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathDetailPage;
