import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { MessageSquare, RefreshCw, Search, User } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import CreatorLayout from '../../components/creators/CreatorLayout';
import RatingDistribution from '../../components/feedback/RatingDistribution';
import { RATING_META, toneForAverage } from '../../components/feedback/ratingScale';
import { useLang } from '../../contexts/LangContext';
import {
  fetchFeedback,
  fetchFeedbackSummary,
  FEEDBACK_TRACKS,
  type FeedbackEntry,
  type FeedbackTrack,
  type Rating,
  type TrackSummary,
} from '../../services/feedbackService';
import { FEEDBACK_TRACK_META, feedbackTimeAgo } from './feedbackMeta';

const COPY = {
  subtitle: {
    en: 'Newest first, filtered by score.',
    ar: 'الأحدث أولًا، مع الترشيح حسب التقييم.',
  },
  responses: { en: 'responses', ar: 'ردود' },
  response: { en: 'response', ar: 'رد' },
  average: { en: 'Average', ar: 'المعدل' },
  all: { en: 'All', ar: 'الكل' },
  search: { en: 'Search feedback...', ar: 'ابحث في الملاحظات...' },
  noComment: { en: 'Rated without a note', ar: 'تقييم بلا ملاحظة' },
  noneYet: { en: 'No responses yet', ar: 'لا توجد ردود بعد' },
  noneHint: {
    en: 'Answers land here as learners finish this content.',
    ar: 'تظهر الردود هنا كلما أنهى المتعلمون هذا المحتوى.',
  },
  noMatch: { en: 'Nothing matches', ar: 'لا يوجد تطابق' },
  noMatchHint: {
    en: 'Try a different score or search term.',
    ar: 'جرّب تقييمًا أو كلمة بحث مختلفة.',
  },
  loadFailed: { en: 'Could not load feedback', ar: 'تعذّر تحميل الملاحظات' },
  loadFailedHint: {
    en: 'The server did not answer. Check your connection and try again.',
    ar: 'لم يستجب الخادم. تحقق من الاتصال وحاول مجددًا.',
  },
  retry: { en: 'Try again', ar: 'إعادة المحاولة' },
  showing: { en: 'Showing', ar: 'المعروض' },
  of: { en: 'of', ar: 'من' },
  loadMore: { en: 'Load more', ar: 'تحميل المزيد' },
  loadingMore: { en: 'Loading', ar: 'جارٍ التحميل' },
};

function isTrack(value: string | undefined): value is FeedbackTrack {
  return !!value && (FEEDBACK_TRACKS as readonly string[]).includes(value);
}

const FeedbackTrackPage: React.FC = () => {
  const { track } = useParams<{ track: string }>();
  const { lang } = useLang();

  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<TrackSummary | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<Rating | null>(null);
  const [query, setQuery] = useState('');

  const valid = isTrack(track);

  /* The header reads the server's aggregate over every response, not just the
     page in hand, so it says the same thing as the overview card. The list is
     the newest page, extended on request. */
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setState('loading');
    setEntries([]);
    setRatingFilter(null);
    Promise.all([fetchFeedbackSummary(), fetchFeedback(track)])
      .then(([summary, page]) => {
        if (cancelled) return;
        setStats(summary[track]);
        setEntries(page.entries);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [track, valid, reloadKey]);

  const loadMore = () => {
    if (!valid || loadingMore) return;
    setLoadingMore(true);
    fetchFeedback(track, entries.length)
      .then((page) => setEntries((current) => [...current, ...page.entries]))
      .catch(() => {
        /* the Load more button stays, so this is retryable in place */
      })
      .finally(() => setLoadingMore(false));
  };

  const { total, average, distribution } = stats ?? {
    total: 0,
    average: 0,
    distribution: [0, 0, 0, 0, 0],
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (ratingFilter !== null && Math.round(entry.rating) !== ratingFilter) return false;
      if (!q) return true;
      return `${entry.comment} ${entry.contextTitle} ${entry.contextSub ?? ''} ${entry.userName}`
        .toLowerCase()
        .includes(q);
    });
  }, [entries, ratingFilter, query]);

  if (!valid) return <Navigate to="/creators/feedback" replace />;

  const meta = FEEDBACK_TRACK_META[track];
  const tone = toneForAverage(average);

  return (
    <CreatorLayout
      title={meta.title[lang]}
      subtitle={COPY.subtitle[lang]}
      backTo="/creators/feedback"
    >
      {/* ── The shape of the answers ── */}
      <EnhancedCard padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:gap-8 sm:px-6">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
            >
              <meta.icon size={22} style={{ color: meta.color }} />
            </span>
            <div>
              <p className="font-mono text-3xl font-black leading-none" dir="ltr" style={{ color: tone }}>
                {total > 0 ? average.toFixed(1) : '-'}
                <span className="text-sm font-bold text-[#8592ad]"> / 5</span>
              </p>
              <p className="mt-1.5 text-[11px] text-[#8592ad]">
                {COPY.average[lang]}
                {', '}
                <span dir="ltr">{total}</span>{' '}
                {total === 1 ? COPY.response[lang] : COPY.responses[lang]}
              </p>
            </div>
          </div>

          {/* Anchored to the far end so the band reads as two columns, the
              score on one side and its shape on the other. */}
          <div className="w-full min-w-0 sm:ms-auto sm:max-w-xs">
            <RatingDistribution
              distribution={distribution}
              active={ratingFilter}
              onSelect={setRatingFilter}
            />
          </div>
        </div>
      </EnhancedCard>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="scroll-x flex max-w-full items-center self-start rounded-lg border border-[#263248] bg-[#0b1019] p-0.5 sm:self-auto"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={`flex-shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors touch:min-h-tap touch:px-3.5 ${
              ratingFilter === null ? 'bg-[#1a2332] text-[#f3f6ff]' : 'text-[#8592ad] hover:text-[#d2d7e3]'
            }`}
          >
            {COPY.all[lang]}
          </button>
          {([5, 4, 3, 2, 1] as Rating[]).map((value) => {
            const active = ratingFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRatingFilter(active ? null : value)}
                className={`flex-shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors touch:min-h-tap touch:px-3.5 ${
                  active ? 'bg-[#1a2332]' : 'text-[#8592ad] hover:text-[#d2d7e3]'
                }`}
                style={active ? { color: RATING_META[value].color } : undefined}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="relative w-full min-w-0 sm:w-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa6]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={COPY.search[lang]}
            className="w-full rounded-lg border border-[#263248] bg-[#0b1019] py-2 pl-8 pr-3 text-xs text-[#d2d7e3] transition-colors placeholder:text-[#7c8aa6] focus:border-[#00a859]/50 focus:outline-none sm:w-56"
          />
        </div>
      </div>

      {/* ── The answers ── */}
      {state === 'loading' ? (
        <EnhancedCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-[#263248]/60">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-[#1a2332]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#1a2332]" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#1a2332]" />
                </div>
              </div>
            ))}
          </div>
        </EnhancedCard>
      ) : state === 'error' ? (
        <EnhancedCard padding="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263248] bg-[#121a2a]">
            <MessageSquare size={24} className="text-[#8592ad]" />
          </div>
          <h3 className="mb-1.5 text-base font-bold text-[#f3f6ff]">{COPY.loadFailed[lang]}</h3>
          <p className="mx-auto mb-5 max-w-sm text-sm text-[#8592ad]">{COPY.loadFailedHint[lang]}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00a859] px-4 py-2.5 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#00934e]"
          >
            <RefreshCw size={15} /> {COPY.retry[lang]}
          </button>
        </EnhancedCard>
      ) : filtered.length === 0 ? (
        <EnhancedCard padding="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#263248] bg-[#121a2a]">
            <MessageSquare size={24} className="text-[#8592ad]" />
          </div>
          <h3 className="mb-1.5 text-base font-bold text-[#f3f6ff]">
            {entries.length === 0 ? COPY.noneYet[lang] : COPY.noMatch[lang]}
          </h3>
          <p className="mx-auto max-w-sm text-sm text-[#8592ad]">
            {entries.length === 0 ? COPY.noneHint[lang] : COPY.noMatchHint[lang]}
          </p>
        </EnhancedCard>
      ) : (
        <>
          <EnhancedCard padding="none" className="overflow-hidden">
            <ul className="divide-y divide-[#263248]/60">
              {filtered.map((entry) => {
                const rating = Math.min(5, Math.max(1, Math.round(entry.rating))) as Rating;
                const ratingTone = RATING_META[rating].color;
                return (
                  <li key={entry.id} className="flex gap-4 px-5 py-4">
                    <span
                      className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border font-mono text-sm font-black"
                      style={{
                        borderColor: `${ratingTone}55`,
                        backgroundColor: `${ratingTone}1a`,
                        color: ratingTone,
                      }}
                      title={RATING_META[rating].label[lang]}
                      dir="ltr"
                    >
                      {rating}
                    </span>

                    <div className="min-w-0 flex-1">
                      {entry.comment ? (
                        <p
                          className="whitespace-pre-line text-sm leading-relaxed text-[#e5e9f0]"
                          dir={entry.lang === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {entry.comment}
                        </p>
                      ) : (
                        <p className="text-sm italic text-[#6e7a94]">{COPY.noComment[lang]}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8592ad]">
                        <span className="rounded border border-[#263248] bg-[#0e1522] px-1.5 py-0.5 font-semibold text-[#9aa5bf]">
                          {meta.source[lang]}
                        </span>
                        <span className="truncate font-medium text-[#9aa5bf]">
                          {entry.contextTitle || entry.contextId}
                        </span>
                        {entry.contextSub && (
                          <span className="text-[#6e7a94]">{entry.contextSub}</span>
                        )}
                        {/* On a phone, who wrote it joins the meta line rather
                            than taking a column: a fixed column beside the
                            comment leaves it a few words wide. */}
                        <span className="flex items-center gap-1.5 text-[#6e7a94] sm:hidden">
                          <User size={11} className="flex-shrink-0" />
                          <span className="max-w-[9rem] truncate">{entry.userName}</span>
                          <span dir="ltr">{feedbackTimeAgo(entry.createdAt, lang)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="hidden flex-shrink-0 flex-col items-end gap-1 text-[11px] sm:flex">
                      <span className="flex items-center gap-1.5 text-[#9aa5bf]">
                        <User size={11} className="flex-shrink-0" />
                        <span className="max-w-[10rem] truncate">{entry.userName}</span>
                      </span>
                      <span className="text-[#6e7a94]" dir="ltr">
                        {feedbackTimeAgo(entry.createdAt, lang)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </EnhancedCard>

          <div className="flex flex-col items-center gap-3">
            {/* The list is a page at a time, so the count says what is on
                screen against what exists, and the button appears only while
                the two disagree. */}
            <p className="text-[11px] text-[#7c8aa6]">
              {COPY.showing[lang]} <span dir="ltr">{filtered.length}</span> {COPY.of[lang]}{' '}
              <span dir="ltr">{total}</span>{' '}
              {total === 1 ? COPY.response[lang] : COPY.responses[lang]}
            </p>
            {entries.length < total && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-[#263248] bg-[#0e1522] px-4 py-2 text-xs font-semibold text-[#d2d7e3] transition-colors hover:border-[#354562] hover:bg-[#172033] disabled:cursor-not-allowed disabled:text-[#6e7a94]"
              >
                {loadingMore ? COPY.loadingMore[lang] : COPY.loadMore[lang]}
              </button>
            )}
          </div>
        </>
      )}
    </CreatorLayout>
  );
};

export default FeedbackTrackPage;
