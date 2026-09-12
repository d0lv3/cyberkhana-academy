import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Code,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Trophy,
  CheckCircle2,
  Youtube,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { getLanguage, getModule, getConcept } from '../../data/programming';
import { courseSteps, stepPath, type CourseStep } from '../../data/programming/courseMap';
import CourseViewerSidebar, { type SidebarModule } from '../../components/CourseViewerSidebar';
import { CodingEnvironment } from '../../components/code-editor';
import { runnerFor } from '../../components/code-editor/runners';
import Button from '../../components/ui/EnhancedButton';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import ResizeHandle from '../../components/ui/ResizeHandle';
import { youtubeEmbedUrl } from '../../services/youtube';
import { useLang } from '../../contexts/LangContext';
import { mdFor } from '../../services/creatorTypes';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useStoredState, storedBoolean, storedNumber } from '../../hooks/useStoredState';
import { useTocCollapsed } from '../../hooks/useTocCollapsed';
import { useProgrammingDone } from '../../hooks/useCourseProgress';
import { markProgrammingDone, recordActivity } from '../../services/progressService';
import { requestFeedback } from '../../components/feedback/FeedbackHost';

type Tab = 'content' | 'code';

/* ── The split between the lesson and the workspace ──
 *
 * Held as a percentage of the body rather than pixels, so a split chosen on a
 * wide monitor does not squeeze the prose to nothing on a laptop. Remembered,
 * because how you like to read while you code is not a preference worth
 * restating on every concept. */
const CODE_PCT_KEY = 'ck.progLesson.codePct';
const CODE_OPEN_KEY = 'ck.progLesson.codeOpen';
const CODE_PCT_DEFAULT = 50;
const CODE_PCT_MIN = 25;
const CODE_PCT_MAX = 75;

const clampPct = (v: number) => Math.min(CODE_PCT_MAX, Math.max(CODE_PCT_MIN, v));

const ProgrammingLessonPage: React.FC = () => {
  const { langSlug, moduleSlug, conceptSlug } = useParams<{
    langSlug: string;
    moduleSlug: string;
    conceptSlug: string;
  }>();
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const language = getLanguage(langSlug || '');
  const mod = getModule(langSlug || '', moduleSlug || '');
  const concept = getConcept(langSlug || '', moduleSlug || '', conceptSlug || '');

  // Each concept is a fresh document: both panes start at the top.
  const proseRef = useScrollToTop<HTMLDivElement>(conceptSlug);
  const workspaceRef = useScrollToTop<HTMLDivElement>(conceptSlug);

  const [mobileTab, setMobileTab] = useState<Tab>('content');
  const bodyRef = useRef<HTMLDivElement>(null);

  const [codePct, setCodePct] = useStoredState(CODE_PCT_KEY, CODE_PCT_DEFAULT, storedNumber(clampPct));
  const [codeOpen, setCodeOpen] = useStoredState(CODE_OPEN_KEY, true, storedBoolean);

  /* Pixels dragged become a share of the body, so the same drag means the same
     thing whatever the window is doing. */
  const resizeSplit = useCallback(
    (deltaX: number) => {
      const width = bodyRef.current?.clientWidth ?? 0;
      if (width <= 0) return;
      setCodePct((p) => clampPct(p + (deltaX / width) * 100));
    },
    [setCodePct]
  );
  const [videoOpen, setVideoOpen] = useState(true);
  const completed = useProgrammingDone(langSlug || '');

  const [tocMobileOpen, setTocMobileOpen] = useState(false);
  const [tocCollapsed, toggleToc] = useTocCollapsed();

  /* ── The course, as the contents list it ──
     Every module of the language, not just this one: the whole point of the
     column is being able to see where this step sits in the run. Challenges
     carry their own mark so a run of lessons and the test at the end of it do
     not read as the same kind of work. */
  const sidebarModules: SidebarModule[] = useMemo(
    () =>
      language?.modules.map((m) => ({
        id: m.id,
        title: m.title[lang] || m.title.en,
        lectures: m.concepts.map((c) => ({
          id: c.id,
          title: c.title[lang] || c.title.en,
          hasQuiz: false,
          kind: c.type === 'challenge' ? ('challenge' as const) : ('lesson' as const),
        })),
      })) ?? [],
    [language, lang]
  );

  const concepts = mod?.concepts ?? [];
  const currentIdx = concepts.findIndex((c) => c.slug === conceptSlug);

  /* Previous and next walk the whole course, the same path the course map
     draws: the step after a module's last one is the first of the next. */
  const steps = language ? courseSteps(language) : [];
  const stepIdx = steps.findIndex((s) => s.module.slug === moduleSlug && s.concept.slug === conceptSlug);
  const prevStep: CourseStep | null = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const nextStep: CourseStep | null =
    stepIdx >= 0 && stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;
  const here: CourseStep | null = stepIdx >= 0 ? steps[stepIdx] : null;

  /* Moving through the course replaces the step in the history rather than
     stacking on it, so the back button means "leave the course" wherever you
     stopped, instead of walking back up every lesson you read. The way out is
     the arrow in the header, which names where it goes. */
  const goTo = (step: Pick<CourseStep, 'module' | 'concept'>) =>
    navigate(stepPath(langSlug || '', step), { replace: true });

  /* The tick comes back through the progress event, which is also what marks
     it on the contents. The new set is returned so the caller can ask whether
     that was the last step of the module. */
  const markDone = (id: string) => markProgrammingDone(langSlug || '', id);

  /* A module is finished the moment its last concept is ticked off, and it is
     the module, not the single concept, that a learner has an opinion about.
     Both ways in are covered: reading the final lesson, or a challenge's tests
     going green. */
  const askAboutModule = (done: Set<string>) => {
    if (!mod || !language || mod.concepts.length === 0) return;
    if (!mod.concepts.every((c) => done.has(c.id))) return;
    requestFeedback({
      track: 'programming',
      contextId: mod.id,
      contextTitle: mod.title.en || mod.title.ar,
      contextSub: language.name,
    });
  };

  const handleChallengePass = () => {
    if (!concept) return;
    askAboutModule(markDone(concept.id));
  };

  const handleCompleteLesson = () => {
    if (!concept) return;
    askAboutModule(markDone(concept.id));
    if (nextStep) goTo(nextStep);
  };

  // Remember this as the learner's most recent activity (dashboard "Jump back in").
  useEffect(() => {
    if (language && concept) {
      recordActivity({
        kind: 'programming',
        route: `/fundamentals/programming/${langSlug}/${moduleSlug}/${concept.slug}`,
        title: concept.title,
        context: language.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id]);

  if (!language || !mod || !concept) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">{t('lesson.notFound')}</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/fundamentals/programming')}
          >
            {t('lesson.backToProgramming')}
          </Button>
        </div>
      </div>
    );
  }

  const isChallenge = concept.type === 'challenge';
  const isDone = completed.has(concept.id);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0d1117] text-[#d2d7e3]">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-14 border-b border-[#263248] bg-[#121a2a] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/fundamentals/programming/${langSlug}`)}
            title={lang === 'ar' ? 'خريطة المنهج' : 'Course map'}
            aria-label={lang === 'ar' ? 'خريطة المنهج' : 'Course map'}
            className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors inline-flex items-center justify-center touch:min-h-tap touch:min-w-tap -ms-2"
          >
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </button>
          <button
            className="lg:hidden text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors"
            onClick={() => setTocMobileOpen(true)}
            title={lang === 'ar' ? 'محتويات المنهج' : 'Course contents'}
            aria-label={lang === 'ar' ? 'محتويات المنهج' : 'Course contents'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            className="hidden lg:inline-flex text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors"
            onClick={toggleToc}
            title={
              tocCollapsed
                ? lang === 'ar' ? 'إظهار محتويات المنهج' : 'Show course contents'
                : lang === 'ar' ? 'إخفاء محتويات المنهج' : 'Hide course contents'
            }
            aria-label={
              tocCollapsed
                ? lang === 'ar' ? 'إظهار محتويات المنهج' : 'Show course contents'
                : lang === 'ar' ? 'إخفاء محتويات المنهج' : 'Hide course contents'
            }
            aria-pressed={!tocCollapsed}
          >
            {tocCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 rtl-flip" />
            ) : (
              <PanelLeftClose className="w-5 h-5 rtl-flip" />
            )}
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#8592ad]" dir="ltr">
            <span className="font-medium" style={{ color: language.color }}>
              {language.name}
            </span>
            <ChevronRight size={12} />
            <span>{mod.title[lang]}</span>
            <ChevronRight size={12} />
            <span className="text-[#f3f6ff] font-semibold">{concept.title[lang]}</span>
          </div>

          {/* Mobile title */}
          <h1 className="md:hidden text-sm font-bold text-[#f3f6ff] truncate max-w-[200px]">
            {concept.title[lang]}
          </h1>

          {/* Type badge */}
          {isChallenge ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f3a43a]/10 border border-[#f3a43a]/20 text-[#f3a43a]">
              <Trophy size={10} /> {t('lesson.challenge')}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <BookOpen size={10} /> {t('lesson.lesson')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Put the workspace away and read. Desktop only: on a phone the two
              panes are already tabs, so there is nothing to minimise. */}
          <button
            onClick={() => setCodeOpen((open) => !open)}
            title={
              codeOpen
                ? lang === 'ar'
                  ? 'إخفاء مساحة الكود'
                  : 'Hide the workspace'
                : lang === 'ar'
                  ? 'إظهار مساحة الكود'
                  : 'Show the workspace'
            }
            aria-pressed={codeOpen}
            className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-[#263248] bg-[#0e1522] px-2.5 py-1 text-[10px] font-semibold text-[#9aa5bf] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859]"
          >
            {codeOpen ? (
              <PanelRightClose size={12} className="rtl-flip" />
            ) : (
              <PanelRightOpen size={12} className="rtl-flip" />
            )}
            {lang === 'ar' ? 'الكود' : 'Code'}
          </button>

          {/* A row of dots stood here, one per step of this module. The
              contents answer the same question about the whole course, and
              the step line above the lesson answers it in words, so it was
              two answers too many. */}
        </div>
      </header>

      {/* ── MOBILE TAB SWITCHER ── */}
      <div className="md:hidden flex border-b border-[#263248] bg-[#121a2a]">
        <button
          onClick={() => setMobileTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'content'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#8592ad]'
          }`}
        >
          <BookOpen size={14} /> Content
        </button>
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'code'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#8592ad]'
          }`}
        >
          <Code size={14} /> Editor
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── The course, and where you are in it ──
             Pinned from a large screen only: the lesson and the workspace are
             already two columns, and a third at 768px leaves neither of them
             room. Below that it is the drawer behind the menu button. ── */}
        <CourseViewerSidebar
          modules={sidebarModules}
          activeLectureId={concept.id}
          completedLectures={[...completed]}
          onSelectLecture={(id) => {
            const step = steps.find((s) => s.concept.id === id);
            if (step) goTo(step);
            setTocMobileOpen(false);
          }}
          mobileOpen={tocMobileOpen}
          onMobileClose={() => setTocMobileOpen(false)}
          collapsed={tocCollapsed}
          groupNoun={{ en: 'Module', ar: 'الوحدة' }}
          title={{ en: 'Course contents', ar: 'محتويات المنهج' }}
          pinAt="lg"
        />

        {/* ── Reading and writing ──
             The split is measured here rather than across the whole body, so
             the share a reader chose stays a share of what they work in,
             whether or not the contents are beside it. ── */}
        <div ref={bodyRef} className="min-w-0 flex-1 flex overflow-hidden">

          {/* ── LEFT: Markdown. Takes whatever the workspace is not using, which
               is the whole screen once the workspace is put away. ── */}
          <div
            /* `flex` lives in the conditional, not the base: paired with `hidden`
               it would be two display rules on one element, and which one won
               would come down to the order Tailwind happened to emit them in. */
            className={`
              min-w-0 flex-1 flex-col overflow-hidden
              ${mobileTab === 'content' ? 'flex w-full' : 'hidden md:flex'}
            `}
          >
            <div ref={proseRef} className="flex-1 overflow-y-auto custom-scrollbar">
              {mod.videoId && (
                <div className={`mx-auto px-6 pt-6 md:px-8 ${codeOpen ? 'max-w-2xl' : 'max-w-4xl'}`}>
                  <div className="rounded-xl border border-[#263248] bg-[#0e1522] overflow-hidden">
                    <button
                      onClick={() => setVideoOpen((o) => !o)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#9aa5bf] transition-colors hover:text-[#f3f6ff]"
                    >
                      <span className="flex items-center gap-2">
                        <Youtube size={15} className="text-[#ff4d4d]" />
                        {lang === 'ar' ? 'فيديو الوحدة' : 'Module video'}
                      </span>
                      <ChevronDown size={15} className={`transition-transform ${videoOpen ? '' : '-rotate-90'}`} />
                    </button>
                    {videoOpen && (
                      <div className="aspect-video border-t border-[#263248]">
                        <iframe
                          className="h-full w-full"
                          src={youtubeEmbedUrl(mod.videoId)}
                          title={`${mod.title[lang]} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <article
                className={`mx-auto px-6 py-8 md:px-8 md:py-10 ${codeOpen ? 'max-w-2xl' : 'max-w-4xl'}`}
              >
                {/* Where this step sits in the course */}
                {here && (
                  <p className="mb-6 text-[11px] font-bold uppercase tracking-wider text-[#00a859]">
                    {lang === 'ar' ? `الوحدة ${here.moduleNumber}` : `Module ${here.moduleNumber}`}
                    <span className="mx-1.5 text-[#4d5a73]" aria-hidden>·</span>
                    <span className="normal-case tracking-normal">{mod.title[lang] || mod.title.en}</span>
                    <span className="mx-1.5 text-[#4d5a73]" aria-hidden>·</span>
                    <span className="normal-case tracking-normal text-[#8592ad]">
                      {lang === 'ar'
                        ? `الخطوة ${here.stepNumber} من ${concepts.length}`
                        : `Step ${here.stepNumber} of ${concepts.length}`}
                    </span>
                  </p>
                )}
                <LessonMarkdown content={mdFor(concept.markdownContent, lang)} />
              </article>
            </div>

            {/* ── Lesson completion strip (lessons only — challenges complete by passing tests) ── */}
            {!isChallenge && (
              <div className="flex-shrink-0 px-6 py-3 border-t border-[#263248] bg-[#0e1626]">
                {isDone ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#00a859]">
                      <CheckCircle2 size={16} /> {lang === 'ar' ? 'مكتمل' : 'Completed'}
                    </span>
                    {nextStep && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => goTo(nextStep)}
                        rightIcon={<ChevronRight size={14} className="rtl-flip" />}
                      >
                        {nextStep.module.id !== mod.id
                          ? lang === 'ar'
                            ? 'الوحدة التالية'
                            : 'Next module'
                          : lang === 'ar'
                            ? 'الدرس التالي'
                            : 'Next lesson'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={handleCompleteLesson}
                    leftIcon={<CheckCircle2 size={16} />}
                  >
                    {nextStep
                      ? lang === 'ar'
                        ? 'إكمال ومتابعة'
                        : 'Complete & Continue'
                      : lang === 'ar'
                      ? 'وضع علامة مكتمل'
                      : 'Mark Complete'}
                  </Button>
                )}
              </div>
            )}

            {/* ── Bottom nav bar ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-[#263248] bg-[#121a2a]">
              {prevStep ? (
                <button
                  onClick={() => goTo(prevStep)}
                  className="flex min-w-0 items-center gap-2 text-xs text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors touch:min-h-tap px-1 select-none"
                >
                  <ChevronLeft size={14} className="flex-shrink-0 rtl-flip" />
                  <span className="hidden truncate sm:inline">{prevStep.concept.title[lang]}</span>
                  <span className="sm:hidden">{lang === 'ar' ? 'السابق' : 'Previous'}</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-[10px] text-[#7c8aa6]">
                {currentIdx + 1} / {concepts.length}
              </span>

              {nextStep ? (
                /* Crossing into the next module says so, rather than dropping
                   the learner into a new topic under a lesson title alone. */
                <button
                  onClick={() => goTo(nextStep)}
                  className="flex min-w-0 items-center gap-2 text-xs text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors touch:min-h-tap px-1 select-none"
                >
                  <span className="hidden truncate sm:inline">
                    {nextStep.module.id !== mod.id
                      ? `${lang === 'ar' ? 'الوحدة التالية' : 'Next module'}: ${nextStep.module.title[lang] || nextStep.module.title.en}`
                      : nextStep.concept.title[lang]}
                  </span>
                  <span className="sm:hidden">{lang === 'ar' ? 'التالي' : 'Next'}</span>
                  <ChevronRight size={14} className="flex-shrink-0 rtl-flip" />
                </button>
              ) : (
                /* The last step of the course: the way on is back to the map. */
                <button
                  onClick={() => navigate(`/fundamentals/programming/${langSlug}`)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#00a859] hover:text-[#9fef00] transition-colors touch:min-h-tap px-1 select-none"
                >
                  {lang === 'ar' ? 'خريطة المنهج' : 'Course map'}
                  <ChevronRight size={14} className="flex-shrink-0 rtl-flip" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop: drag the boundary between reading and writing. Hidden while
              the workspace is put away, since there is nothing on the far side of
              it to grow. */}
          {codeOpen && (
            <div className="hidden md:flex">
              <ResizeHandle
                orientation="vertical"
                label={lang === 'ar' ? 'مساحة الكود' : 'Coding workspace'}
                onResize={resizeSplit}
                onReset={() => setCodePct(CODE_PCT_DEFAULT)}
              />
            </div>
          )}

          {/* ── RIGHT: Coding Environment ── */}
          <div
            /* The width only applies to the desktop split; on a phone the pane is
               whichever tab is showing, and takes the screen. */
            style={codeOpen ? { flexBasis: `${codePct}%` } : undefined}
            className={`
              flex-col overflow-hidden border-[#263248] md:border-s
              ${codeOpen ? 'md:flex md:flex-shrink-0 md:min-w-0' : 'md:hidden'}
              ${mobileTab === 'code' ? 'flex w-full' : 'hidden'}
            `}
          >
            <div ref={workspaceRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-4">
              <CodingEnvironment
                key={concept.id}
                starterCode={concept.starterCode}
                sampleInput={concept.sampleInput}
                language={runnerFor(langSlug)}
                testCases={concept.testCases}
                hints={concept.hints}
                solution={concept.solution}
                onPass={handleChallengePass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingLessonPage;
