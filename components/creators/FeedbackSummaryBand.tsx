import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import EnhancedCard from '../ui/EnhancedCard';
import { toneForAverage } from '../feedback/ratingScale';
import { useLang } from '../../contexts/LangContext';
import {
  emptyFeedbackSummary,
  fetchFeedbackSummary,
  FEEDBACK_TRACKS,
  type FeedbackSummary,
  type FeedbackTrack,
} from '../../services/feedbackService';
import { FEEDBACK_TRACK_META } from '../../pages/creators/feedbackMeta';

const COPY = {
  title: { en: 'Learner Feedback', ar: 'ملاحظات المتعلمين' },
  description: {
    en: 'Scores and notes left the moment a lesson or module was finished.',
    ar: 'تقييمات وملاحظات تُترك لحظة إنهاء درس أو وحدة.',
  },
  open: { en: 'Open feedback', ar: 'فتح الملاحظات' },
  responses: { en: 'responses', ar: 'ردود' },
  response: { en: 'response', ar: 'رد' },
  none: { en: 'No responses yet', ar: 'لا ردود بعد' },
};

/** Short names for the tile strip, where the full card titles do not fit. */
const SHORT_LABEL: Record<FeedbackTrack, { en: string; ar: string }> = {
  programming: { en: 'Programming', ar: 'البرمجة' },
  networking: { en: 'Networking', ar: 'الشبكات' },
  'os-modules': { en: 'OS & Modules', ar: 'الوحدات وأنظمة التشغيل' },
};

/**
 * The Content Studio's window onto feedback: the three tracks at a glance,
 * each tile a way into that track's responses.
 *
 * A studio that cannot reach the feedback API still renders the band and its
 * link, so the section never becomes a dead end over one failed request.
 */
const FeedbackSummaryBand: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeedbackSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(emptyFeedbackSummary());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <EnhancedCard padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#00a859]/25 bg-[#00a859]/10">
            <MessageSquare size={21} className="text-[#00a859]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#f3f6ff]">{COPY.title[lang]}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9aa5bf]">{COPY.description[lang]}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/creators/feedback')}
          className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-[#263248] bg-[#0e1522] px-4 py-2.5 text-xs font-bold text-[#d2d7e3] transition-colors hover:border-[#354562] hover:bg-[#172033] sm:self-auto"
        >
          {COPY.open[lang]} <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#263248] border-t border-[#263248] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FEEDBACK_TRACKS.map((track) => {
          const meta = FEEDBACK_TRACK_META[track];
          const data = summary?.[track];
          const tone = toneForAverage(data?.average ?? 0);

          return (
            <button
              key={track}
              type="button"
              onClick={() => navigate(`/creators/feedback/${track}`)}
              className="flex items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-[#101826]"
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
              >
                <meta.icon size={16} style={{ color: meta.color }} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#d2d7e3]">
                  {SHORT_LABEL[track][lang]}
                </span>
                {!summary ? (
                  <span className="mt-1.5 block h-3 w-20 animate-pulse rounded bg-[#1a2332]" />
                ) : data && data.total > 0 ? (
                  <span className="mt-0.5 block text-[11px] text-[#8592ad]">
                    <span className="font-mono font-bold" style={{ color: tone }} dir="ltr">
                      {data.average.toFixed(1)}
                    </span>
                    {' / 5 · '}
                    <span dir="ltr">{data.total}</span>{' '}
                    {data.total === 1 ? COPY.response[lang] : COPY.responses[lang]}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[11px] text-[#6e7a94]">{COPY.none[lang]}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </EnhancedCard>
  );
};

export default FeedbackSummaryBand;
