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
        className="inline-flex items-center gap-2 text-sm text-[#6e7a94] hover:text-[#d2d7e3] transition-colors"
      >
        <ArrowLeft size={16} className="rtl-flip" />
        <span>{t('sidebar.paths')}</span>
      </button>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a]"
      >
        {/* Cover band */}
        <div className="relative h-52 md:h-64">
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
              style={{ background: `radial-gradient(130% 120% at 12% 0%, ${path.color}33 0%, #0d1424 52%, #0a0f18 100%)` }}
            >
              <Route size={230} className="absolute -bottom-10 -right-8 opacity-[0.06]" style={{ color: path.color }} />
            </div>
          )}

          {/* Readability scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18] via-[#0a0f18]/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent" />

          {/* Top: path tag + difficulty */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
              style={{ color: path.color, backgroundColor: `${path.color}1f`, borderColor: `${path.color}55` }}
            >
              <Route size={13} /> {t('sidebar.paths')}
            </span>
            <DifficultyBadge difficulty={path.difficulty} className="backdrop-blur-sm" />
          </div>

          {/* Bottom: title + description */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h1 className="text-2xl font-black text-white sm:text-3xl">{path.title[lang] || path.title.en}</h1>
            {(path.description[lang] || path.description.en) && (
              <p className="mt-2 max-w-2xl text-sm text-[#cbd3e1] line-clamp-2">
                {path.description[lang] || path.description.en}
              </p>
            )}
          </div>
        </div>

        {/* Info + CTA bar */}
        <div className="space-y-4 p-5">
          {enrolled && progress.total > 0 && (
            <div dir="ltr">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00a859]">
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

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9aa5bf]" dir="ltr">
              <span className="inline-flex items-center gap-1.5">
                <ListChecks size={15} className="text-[#6e7a94]" /> {progress.total} {t('paths.stepsLabel')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} className="text-[#6e7a94]" /> {path.estimatedHours}h
              </span>
            </div>

            {enrolled ? (
              firstAvailable >= 0 && (
                <Button
                  variant={isComplete ? 'outline' : 'primary'}
                  onClick={goToNext}
                  rightIcon={<ChevronRight size={16} className="rtl-flip" />}
                >
                  {isComplete ? t('paths.review') : t('paths.continue')}
                </Button>
              )
            ) : (
              <Button variant="neon" onClick={handleEnroll} rightIcon={<ChevronRight size={16} className="rtl-flip" />}>
                {t('paths.enroll')}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

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
                          : 'text-[#6e7a94]'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                      {step.subtitle && (
                        <p className="text-xs text-[#6e7a94] truncate">{step.subtitle}</p>
                      )}
                      {!st.available && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#1a2332] border border-[#263248] text-[#6e7a94]">
                          <Lock size={8} /> {t('paths.unavailable')}
                        </span>
                      )}
                    </div>
                  </div>
                  {st.available && (
                    <ChevronRight
                      size={18}
                      className="text-[#3d4a63] group-hover:text-[#00a859] transition-colors flex-shrink-0 rtl-flip"
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
