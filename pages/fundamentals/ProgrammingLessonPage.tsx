import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Code,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trophy,
  CheckCircle2,
  Youtube,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { getLanguage, getModule, getConcept } from '../../data/programming';
import type { ProgrammingConcept } from '../../data/programming';
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
import { getProgrammingDone, markProgrammingDone, recordActivity } from '../../services/progressService';

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
  const { lang } = useLang();

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
  const [completed, setCompleted] = useState<Set<string>>(() =>
    getProgrammingDone(langSlug || '')
  );

  const concepts = mod?.concepts ?? [];
  const currentIdx = concepts.findIndex((c) => c.slug === conceptSlug);

  const prevConcept: ProgrammingConcept | null =
    currentIdx > 0 ? concepts[currentIdx - 1] : null;
  const nextConcept: ProgrammingConcept | null =
    currentIdx < concepts.length - 1 ? concepts[currentIdx + 1] : null;

  const goTo = (c: ProgrammingConcept) =>
    navigate(`/fundamentals/programming/${langSlug}/${moduleSlug}/${c.slug}`);

  const markDone = (id: string) => setCompleted(markProgrammingDone(langSlug || '', id));

  const handleChallengePass = () => {
    if (concept) markDone(concept.id);
  };

  const handleCompleteLesson = () => {
    if (!concept) return;
    markDone(concept.id);
    if (nextConcept) goTo(nextConcept);
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
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Lesson not found</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/fundamentals/programming')}
          >
            Back to Programming
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
            className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors inline-flex items-center justify-center touch:min-h-tap touch:min-w-tap -ms-2"
          >
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#6e7a94]" dir="ltr">
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
              <Trophy size={10} /> Challenge
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <BookOpen size={10} /> Lesson
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

          {/* Concept progress indicator */}
          <div className="flex items-center gap-1.5 touch:gap-2.5" dir="ltr">
            {concepts.map((c) => (
              <button
                key={c.id}
                onClick={() => goTo(c)}
                className={`tap-expand-y w-2 h-2 rounded-full transition-all ${
                  c.slug === conceptSlug
                    ? 'w-5 bg-[#00a859]'
                    : completed.has(c.id)
                    ? 'bg-[#00a859]/40'
                    : c.type === 'challenge'
                    ? 'bg-[#f3a43a]/30'
                    : 'bg-[#263248]'
                }`}
                title={c.title[lang]}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── MOBILE TAB SWITCHER ── */}
      <div className="md:hidden flex border-b border-[#263248] bg-[#121a2a]">
        <button
          onClick={() => setMobileTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'content'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#6e7a94]'
          }`}
        >
          <BookOpen size={14} /> Content
        </button>
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'code'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#6e7a94]'
          }`}
        >
          <Code size={14} /> Editor
        </button>
      </div>

      {/* ── BODY ── */}
      <div ref={bodyRef} className="flex-1 flex overflow-hidden">

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
                  {nextConcept && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => goTo(nextConcept)}
                      rightIcon={<ChevronRight size={14} />}
                    >
                      {lang === 'ar' ? 'الدرس التالي' : 'Next lesson'}
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
                  {nextConcept
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
            {prevConcept ? (
              <button
                onClick={() => goTo(prevConcept)}
                className="flex items-center gap-2 text-xs text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors touch:min-h-tap px-1 select-none"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">{prevConcept.title[lang]}</span>
                <span className="sm:hidden">Previous</span>
              </button>
            ) : (
              <div />
            )}

            <span className="text-[10px] text-[#4d5a73]">
              {currentIdx + 1} / {concepts.length}
            </span>

            {nextConcept ? (
              <button
                onClick={() => goTo(nextConcept)}
                className="flex items-center gap-2 text-xs text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors touch:min-h-tap px-1 select-none"
              >
                <span className="hidden sm:inline">{nextConcept.title[lang]}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <div />
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
  );
};

export default ProgrammingLessonPage;
