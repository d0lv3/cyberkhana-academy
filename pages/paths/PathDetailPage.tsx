import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Route, Clock, ListChecks, ChevronRight, Check, Lock } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import Button from '../../components/ui/EnhancedButton';
import { useLang } from '../../contexts/LangContext';
import { coverImageSrc } from '../../data/fundamentalsData';
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
      <PageHeader
        backTo="/paths"
        backLabel={t('sidebar.paths')}
        icon={Route}
        iconColor={path.color}
        title={path.title[lang] || path.title.en}
        subtitle={path.description[lang] || path.description.en}
      >
        <div className="flex items-center gap-3" dir="ltr">
          <DifficultyBadge difficulty={path.difficulty} />
          <span className="flex items-center gap-1.5 text-xs text-[#6e7a94]">
            <ListChecks size={13} /> {path.steps.length} {t('paths.stepsLabel')}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#6e7a94]">
            <Clock size={13} /> {path.estimatedHours}h
          </span>
        </div>
      </PageHeader>

      {/* ── Cover banner ── */}
      {path.coverImage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative max-w-3xl overflow-hidden rounded-2xl border border-[#263248]"
        >
          <img
            src={coverImageSrc(path.coverImage)}
            alt=""
            aria-hidden
            className="h-44 w-full object-cover md:h-56"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18]/75 via-transparent to-transparent" />
        </motion.div>
      )}

      {/* ── Enroll / progress ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5 max-w-3xl"
      >
        {enrolled ? (
          <>
            <div className="flex items-center justify-between mb-2" dir="ltr">
              <span className="text-sm font-semibold text-[#d2d7e3]">
                {isComplete
                  ? t('paths.completed')
                  : `${progress.completed}/${progress.total} · ${progress.pct}%`}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00a859]">
                <Check size={13} /> {t('paths.enrolled')}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0a0f18] overflow-hidden mb-4" dir="ltr">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            {firstAvailable >= 0 && (
              <Button
                variant={isComplete ? 'outline' : 'primary'}
                onClick={goToNext}
                rightIcon={<ChevronRight size={16} className="rtl-flip" />}
              >
                {isComplete ? t('paths.review') : t('paths.continue')}
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#f3f6ff]">{path.title[lang] || path.title.en}</p>
              <p className="text-xs text-[#9aa5bf] mt-0.5" dir="ltr">
                {progress.total} {t('paths.stepsLabel')} · {path.estimatedHours}h
              </p>
            </div>
            <Button
              variant="neon"
              onClick={handleEnroll}
              rightIcon={<ChevronRight size={16} className="rtl-flip" />}
            >
              {t('paths.enroll')}
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── Curriculum timeline ── */}
      <div>
        <h2 className="text-sm font-bold text-[#f3f6ff] mb-4">{t('paths.curriculum')}</h2>
        <div className="relative max-w-3xl">
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
