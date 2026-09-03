import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Activity,
  Clock,
  Tag,
  CheckCircle2,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { getNetworkingLesson, getNetworkingLessons } from '../../data/networking';
import { NetworkSimulator } from '../../components/network-sim';
import { hasSimulation, tFor, type NetworkingLesson } from '../../components/network-sim/types';
import Button from '../../components/ui/EnhancedButton';
import ResizeHandle from '../../components/ui/ResizeHandle';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import LessonQuiz from '../../components/ui/LessonQuiz';
import { useLang } from '../../contexts/LangContext';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useStoredState, storedBoolean, storedNumber } from '../../hooks/useStoredState';
import { isNetworkingDone, markNetworkingDone, recordActivity } from '../../services/progressService';

type Tab = 'content' | 'simulation';

/* ── The split between the reading pane and the simulation ──
 *
 * Kept as a percentage of the body rather than pixels, so a student who set it
 * on a wide screen does not find the reading pane squeezed to nothing on a
 * laptop. Remembered, because a preference about how you like to read is not
 * one you should have to restate every time you open a lesson. */
const SIM_PCT_KEY = 'ck.netLesson.simPct';
const SIM_OPEN_KEY = 'ck.netLesson.simOpen';
const SIM_PCT_DEFAULT = 50;
const SIM_PCT_MIN = 22;
const SIM_PCT_MAX = 78;

const clampPct = (v: number) => Math.min(SIM_PCT_MAX, Math.max(SIM_PCT_MIN, v));

const NetworkingLessonPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const lesson = getNetworkingLesson(slug || '');

  // Each lesson is a fresh document: the prose pane starts at the top.
  const proseRef = useScrollToTop<HTMLDivElement>(slug);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [mobileTab, setMobileTab] = useState<Tab>('content');
  const [done, setDone] = useState(() => (lesson ? isNetworkingDone(lesson.id) : false));

  const [simPct, setSimPct] = useStoredState(SIM_PCT_KEY, SIM_PCT_DEFAULT, storedNumber(clampPct));
  const [simOpen, setSimOpen] = useStoredState(SIM_OPEN_KEY, true, storedBoolean);

  /* Pixels dragged become a share of the body, so the same drag means the same
     thing whatever the window is doing. */
  const resizeSplit = useCallback(
    (deltaX: number) => {
      const width = bodyRef.current?.clientWidth ?? 0;
      if (width <= 0) return;
      setSimPct((p) => clampPct(p + (deltaX / width) * 100));
    },
    [setSimPct]
  );

  const handleComplete = () => {
    if (!lesson) return;
    markNetworkingDone(lesson.id);
    setDone(true);
  };

  useEffect(() => {
    if (!lesson) return;

    /* The Continue button swaps the slug underneath one mounted component, so
     * anything read at mount has to be read again. Completion above all: left
     * alone, the lesson you land on inherits the previous one's tick and
     * offers to move you along again without your reading a word of it. */
    setDone(isNetworkingDone(lesson.id));
    setMobileTab('content');

    // Remember this as the learner's most recent activity (dashboard "Jump back in").
    recordActivity({
      kind: 'networking',
      route: `/fundamentals/networking/lesson/${lesson.slug}`,
      title: lesson.title,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Lesson not found</h2>
          <Button variant="outline" onClick={() => navigate('/fundamentals/networking')}>
            Back to Networking
          </Button>
        </div>
      </div>
    );
  }

  const simulation = lesson.simulation;
  const showSim = hasSimulation(simulation);
  // A lesson with no simulation has nothing to sit beside: the prose takes the
  // whole screen, and the mobile tab strip has only one tab to offer.
  const splitView = showSim && simOpen;

  /* ── Where to go next, in lesson order ── */
  const lessons = getNetworkingLessons();
  const currentIdx = lessons.findIndex((l) => l.id === lesson.id);
  const nextLesson: NetworkingLesson | null =
    currentIdx >= 0 && currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
  const goToNext = () => {
    if (nextLesson) navigate(`/fundamentals/networking/lesson/${nextLesson.slug}`);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0d1117] text-[#d2d7e3]">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-14 border-b border-[#263248] bg-[#121a2a] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors inline-flex items-center justify-center touch:min-h-tap touch:min-w-tap -ms-2"
          >
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-[#f3f6ff] truncate max-w-[260px]">
              {lesson.title[lang]}
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-2" dir="ltr">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <Clock size={10} /> {lesson.estimatedMinutes} min
            </span>
            {simulation && showSim && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
                <Activity size={10} /> {simulation.steps.length} steps
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tags (desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            {lesson.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0e1522] border border-[#263248] text-[#8592ad]"
              >
                <Tag size={8} /> {tag}
              </span>
            ))}
          </div>

          {/* Minimise / restore the simulation. Desktop only: on a phone the
              two panes are tabs, so there is nothing to minimise. */}
          {showSim && (
            <button
              onClick={() => setSimOpen((open) => !open)}
              title={
                simOpen
                  ? lang === 'ar'
                    ? 'تصغير المحاكاة'
                    : 'Minimise the simulation'
                  : lang === 'ar'
                    ? 'إظهار المحاكاة'
                    : 'Show the simulation'
              }
              aria-pressed={simOpen}
              className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-[#263248] bg-[#0e1522] px-2.5 py-1 text-[10px] font-semibold text-[#9aa5bf] transition-colors hover:border-[#60a5fa]/40 hover:text-[#60a5fa]"
            >
              {simOpen ? (
                <PanelRightClose size={12} className="rtl-flip" />
              ) : (
                <PanelRightOpen size={12} className="rtl-flip" />
              )}
              {lang === 'ar' ? 'المحاكاة' : 'Simulation'}
            </button>
          )}
        </div>
      </header>

      {/* ── MOBILE TAB SWITCHER (only when there is a second pane to switch to) ── */}
      {showSim && (
        <div className="md:hidden flex border-b border-[#263248] bg-[#121a2a]">
          <button
            onClick={() => setMobileTab('content')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mobileTab === 'content'
                ? 'text-[#00a859] border-b-2 border-[#00a859]'
                : 'text-[#8592ad]'
            }`}
          >
            <BookOpen size={14} /> {lang === 'ar' ? 'المحتوى' : 'Content'}
          </button>
          <button
            onClick={() => setMobileTab('simulation')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mobileTab === 'simulation'
                ? 'text-[#00a859] border-b-2 border-[#00a859]'
                : 'text-[#8592ad]'
            }`}
          >
            <Activity size={14} /> {lang === 'ar' ? 'المحاكاة' : 'Simulation'}
          </button>
        </div>
      )}

      {/* ── BODY ── */}
      <div ref={bodyRef} className="flex-1 flex overflow-hidden">

        {/* ── Markdown content. Takes whatever the simulation is not using, which
             is the whole screen when there is no simulation at all. ── */}
        <div
          ref={proseRef}
          className={`
            min-w-0 flex-1 overflow-y-auto custom-scrollbar
            ${showSim && mobileTab === 'simulation' ? 'hidden md:block' : 'w-full'}
          `}
        >
          <article
            className={`mx-auto px-6 py-8 md:px-8 md:py-10 ${
              splitView ? 'max-w-2xl' : 'max-w-4xl'
            }`}
          >
            <LessonMarkdown content={tFor(lesson.markdownContent, lang)} />

            {/* ── Completion — quiz-gated when the lesson has one ── */}
            <div className="mt-10 pt-6 border-t border-[#263248] space-y-4">
              {done && (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#00a859]">
                  <CheckCircle2 size={18} /> {lang === 'ar' ? 'تم إكمال الدرس' : 'Lesson completed'}
                </div>
              )}
              {(lesson.quiz?.length ?? 0) > 0 ? (
                <LessonQuiz
                  key={lesson.id}
                  questions={lesson.quiz!}
                  onPass={handleComplete}
                  passed={done}
                />
              ) : (
                !done && (
                  <Button variant="primary" onClick={handleComplete} leftIcon={<CheckCircle2 size={16} />}>
                    {lang === 'ar' ? 'وضع علامة كمكتمل' : 'Mark as complete'}
                  </Button>
                )
              )}

              {/* ── Once the lesson is done, the way on is right here, rather
                   than back out through the lesson list. ── */}
              {done &&
                (nextLesson ? (
                  <div className="rounded-xl border border-[#263248] bg-[#0e1626] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8592ad]">
                      {lang === 'ar' ? 'الدرس التالي' : 'Next lesson'}
                    </p>
                    <p className="mt-1 mb-3 text-sm font-bold text-[#f3f6ff]">
                      {nextLesson.title[lang]}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={goToNext}
                      rightIcon={<ChevronRight size={14} className="rtl-flip" />}
                    >
                      {lang === 'ar' ? 'متابعة' : 'Continue'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/fundamentals/networking')}
                  >
                    {lang === 'ar'
                      ? 'أنهيت كل دروس الشبكات، عد إلى القائمة'
                      : 'That is every networking lesson, back to the list'}
                  </Button>
                ))}
            </div>
          </article>
        </div>

        {/* ── Simulation, when the lesson has one ── */}
        {simulation && showSim && (
          <>
            {/* Desktop: drag the boundary. Hidden while minimised, since there
                is nothing on the other side of it to grow. */}
            {simOpen && (
              <div className="hidden md:flex">
                <ResizeHandle
                  orientation="vertical"
                  label={lang === 'ar' ? 'لوحة المحاكاة' : 'Simulation panel'}
                  onResize={resizeSplit}
                  onReset={() => setSimPct(SIM_PCT_DEFAULT)}
                />
              </div>
            )}

            <div
              /* The width only applies to the desktop split; on a phone the
                 pane is whichever tab is showing, and takes the screen. */
              style={simOpen ? { flexBasis: `${simPct}%` } : undefined}
              className={`
                flex-col overflow-hidden border-[#263248] md:border-s
                ${simOpen ? 'md:flex md:flex-shrink-0 md:min-w-0' : 'md:hidden'}
                ${mobileTab === 'simulation' ? 'flex w-full' : 'hidden'}
              `}
            >
              <div className="flex-1 p-4 md:p-6 min-h-0">
                <NetworkSimulator simulation={simulation} />
              </div>
            </div>

            {/* Minimised: a rail keeps the way back where the panel was. */}
            {!simOpen && (
              <button
                onClick={() => setSimOpen(true)}
                title={lang === 'ar' ? 'إظهار المحاكاة' : 'Show the simulation'}
                aria-label={lang === 'ar' ? 'إظهار المحاكاة' : 'Show the simulation'}
                className="hidden md:flex w-11 flex-shrink-0 flex-col items-center gap-2 border-s border-[#263248] bg-[#0e1522] pt-4 text-[#8592ad] transition-colors hover:bg-[#121a2a] hover:text-[#60a5fa]"
              >
                <PanelRightOpen size={16} className="rtl-flip" />
                <span className="text-[10px] font-bold" dir="ltr">
                  {simulation.steps.length}
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkingLessonPage;
