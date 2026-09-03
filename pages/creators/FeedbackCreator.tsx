import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MessageSquare, RefreshCw, Star } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import CreatorLayout from '../../components/creators/CreatorLayout';
import RatingDistribution from '../../components/feedback/RatingDistribution';
import { toneForAverage } from '../../components/feedback/ratingScale';
import { useLang } from '../../contexts/LangContext';
import {
  emptyFeedbackSummary,
  fetchFeedbackSummary,
  FEEDBACK_TRACKS,
  type FeedbackSummary,
} from '../../services/feedbackService';
import { FEEDBACK_TRACK_META } from './feedbackMeta';

const COPY = {
  title: { en: 'Feedback', ar: 'الملاحظات' },
  subtitle: {
    en: 'What learners said the moment they finished a lesson or a module.',
    ar: 'ما قاله المتعلمون لحظة إنهائهم درسًا أو وحدة.',
  },
  responses: { en: 'responses', ar: 'ردود' },
  response: { en: 'response', ar: 'رد' },
  average: { en: 'Average', ar: 'المعدل' },
  noneYet: { en: 'No responses yet', ar: 'لا توجد ردود بعد' },
  noneHint: {
    en: 'Answers land here as learners finish this content.',
    ar: 'تظهر الردود هنا كلما أنهى المتعلمون هذا المحتوى.',
  },
  view: { en: 'View responses', ar: 'عرض الردود' },
  loadFailed: { en: 'Could not load feedback', ar: 'تعذّر تحميل الملاحظات' },
  loadFailedHint: {
    en: 'The server did not answer. Check your connection and try again.',
    ar: 'لم يستجب الخادم. تحقق من الاتصال وحاول مجددًا.',
  },
  retry: { en: 'Try again', ar: 'إعادة المحاولة' },
  collected: { en: 'Collected across the Academy', ar: 'مجمّعة من كل الأكاديمية' },
  total: { en: 'Total responses', ar: 'إجمالي الردود' },
};

const FeedbackCreator: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();

  const [summary, setSummary] = useState<FeedbackSummary>(emptyFeedbackSummary);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetchFeedbackSummary()
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const grandTotal = FEEDBACK_TRACKS.reduce((sum, track) => sum + summary[track].total, 0);
  const grandSum = FEEDBACK_TRACKS.reduce(
    (sum, track) => sum + summary[track].average * summary[track].total,
    0
  );
  const grandAverage = grandTotal > 0 ? grandSum / grandTotal : 0;

  return (
    <CreatorLayout
      title={COPY.title[lang]}
      subtitle={COPY.subtitle[lang]}
      backTo="/creators"
    >
      {/* ── Everything, in one line ── */}
      <EnhancedCard padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#263248] bg-[#0e1522]">
              <MessageSquare size={17} className="text-[#8592ad]" />
            </span>
            <div>
              <p className="text-xl font-black leading-none text-[#f3f6ff]" dir="ltr">
                {grandTotal}
              </p>
              <p className="mt-1 text-[11px] text-[#8592ad]">{COPY.total[lang]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${toneForAverage(grandAverage)}33`,
                backgroundColor: `${toneForAverage(grandAverage)}14`,
              }}
            >
              <Star size={17} style={{ color: toneForAverage(grandAverage) }} />
            </span>
            <div>
              <p
                className="text-xl font-black leading-none"
                dir="ltr"
                style={{ color: toneForAverage(grandAverage) }}
              >
                {grandTotal > 0 ? grandAverage.toFixed(1) : '-'}
                <span className="text-xs font-bold text-[#8592ad]"> / 5</span>
              </p>
              <p className="mt-1 text-[11px] text-[#8592ad]">{COPY.average[lang]}</p>
            </div>
          </div>

          <p className="ms-auto hidden text-[11px] text-[#7c8aa6] sm:block">
            {COPY.collected[lang]}
          </p>
        </div>
      </EnhancedCard>

      {/* ── The three tracks ── */}
      {state === 'error' ? (
        <EnhancedCard padding="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263248] bg-[#121a2a]">
            <MessageSquare size={24} className="text-[#8592ad]" />
          </div>
          <h3 className="mb-1.5 text-base font-bold text-[#f3f6ff]">{COPY.loadFailed[lang]}</h3>
          <p className="mx-auto mb-5 max-w-sm text-sm text-[#8592ad]">
            {COPY.loadFailedHint[lang]}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00a859] px-4 py-2.5 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#00934e]"
          >
            <RefreshCw size={15} /> {COPY.retry[lang]}
          </button>
        </EnhancedCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEEDBACK_TRACKS.map((track) => {
            const meta = FEEDBACK_TRACK_META[track];
            const data = summary[track];
            const empty = state === 'ready' && data.total === 0;
            const tone = toneForAverage(data.average);

            return (
              <EnhancedCard
                key={track}
                padding="lg"
                hoverable
                onClick={() => navigate(`/creators/feedback/${track}`)}
                className="group flex flex-col"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${meta.color}15`,
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    <meta.icon size={22} style={{ color: meta.color }} />
                  </span>
                  <span className="rounded-md border border-[#263248] bg-[#0e1522] px-2 py-1 text-[11px] font-semibold text-[#8592ad]">
                    <span dir="ltr">{data.total}</span>{' '}
                    {data.total === 1 ? COPY.response[lang] : COPY.responses[lang]}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#f3f6ff]">{meta.title[lang]}</h3>
                {/* The description absorbs the slack, so a two-line one does
                    not push its card's numbers out of line with the others. */}
                <p className="mb-5 mt-1.5 flex-1 text-xs leading-relaxed text-[#9aa5bf]">
                  {meta.description[lang]}
                </p>

                {state === 'loading' ? (
                  <div className="mb-5 space-y-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 animate-pulse rounded bg-[#1a2332]" />
                    ))}
                  </div>
                ) : empty ? (
                  <div className="mb-5 rounded-xl border border-dashed border-[#263248] px-4 py-5 text-center">
                    <p className="text-xs font-semibold text-[#8592ad]">{COPY.noneYet[lang]}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#6e7a94]">
                      {COPY.noneHint[lang]}
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 flex items-end gap-4">
                    <div className="flex-shrink-0">
                      <p
                        className="font-mono text-3xl font-black leading-none"
                        dir="ltr"
                        style={{ color: tone }}
                      >
                        {data.average.toFixed(1)}
                      </p>
                      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7c8aa6]">
                        {COPY.average[lang]}
                        <span dir="ltr"> / 5</span>
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <RatingDistribution distribution={data.distribution} compact />
                    </div>
                  </div>
                )}

                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#8592ad] transition-colors group-hover:text-[#d2d7e3]">
                  {COPY.view[lang]} <ArrowUpRight size={12} />
                </span>
              </EnhancedCard>
            );
          })}
        </div>
      )}
    </CreatorLayout>
  );
};

export default FeedbackCreator;
