import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Trophy, Youtube, Check, ChevronDown, PlayCircle } from 'lucide-react';
import Button from '../../components/ui/EnhancedButton';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import AuthorChip from '../../components/ui/AuthorChip';
import ModuleActionButton from '../../components/fundamentals/ModuleActionButton';
import { useLang } from '../../contexts/LangContext';
import { getLanguage } from '../../data/programming';
import { courseSteps, stepPath } from '../../data/programming/courseMap';
import type { ProgrammingConcept } from '../../data/programming';
import { getProgrammingDone, PROGRESS_EVENT } from '../../services/progressService';
import { conceptXp, languageXp } from '../../services/xpService';
import { creditOf, type ContentCredit } from '../../services/creatorTypes';

/* ─── A language's course map ───
 *
 * The modules down a path, the way the Networking page lays out its units,
 * but compact: a language runs to a hundred steps where Networking has a
 * handful. Each module is in one of three states. Finished ones fold to a
 * single line, the one you are in opens into its steps, and the ones ahead
 * show a strip with one mark per step. Any module opens with a click.
 *
 * Colours are the site's own: brand green (#00a859) for done and current,
 * the green to lime gradient for progress, and the gold used for challenges
 * everywhere else.
 */

const TRAIL_DONE = '#00a859';
const TRAIL_TODO = '#33415e';

/** Finished steps in this language, kept current when one is completed in
 *  another tab. */
function useProgrammingDone(langSlug: string): Set<string> {
  const [done, setDone] = useState(() => getProgrammingDone(langSlug));
  useEffect(() => {
    const refresh = () => setDone(getProgrammingDone(langSlug));
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [langSlug]);
  return done;
}

/** A title short enough to sit in a button beside the summary. */
const shortTitle = (s: string, max = 40) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** Credit is shown for modules a creator added. Built-in courses carry no
 *  author of their own, and "by CyberKhana" on every row would be noise. */
function creatorCredit(item: unknown): ContentCredit | null {
  const it = (item ?? {}) as { _author?: unknown; authorName?: unknown };
  return it._author || it.authorName ? creditOf(item) : null;
}

/** The mark beside a step: a tick when done, a green ring on the step to take
 *  next in its module, a trophy on a challenge, otherwise its number. */
const StepIcon: React.FC<{ done: boolean; next: boolean; challenge: boolean; number: number }> = ({
  done,
  next,
  challenge,
  number,
}) => {
  const base = 'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold';
  if (done) {
    return (
      <span className={`${base} bg-[#00a859] text-[#0d1117]`}>
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (next) {
    return (
      <span className={`${base} border-2 border-[#00a859] text-[#00a859]`}>
        {challenge ? <Trophy size={11} /> : number}
      </span>
    );
  }
  if (challenge) {
    return (
      <span className={`${base} border border-[#f3a43a]/50 text-[#f3a43a]`}>
        <Trophy size={11} />
      </span>
    );
  }
  return <span className={`${base} border border-[#263248] text-[#8592ad]`}>{number}</span>;
};

/** One mark per step, for a module that is folded away. */
const StepStrip: React.FC<{ concepts: ProgrammingConcept[]; done: Set<string>; nextId: string | null }> = ({
  concepts,
  done,
  nextId,
}) => (
  <span className="mt-2.5 flex flex-wrap gap-1" aria-hidden>
    {concepts.map((c) => {
      const isDone = done.has(c.id);
      const isChallenge = c.type === 'challenge';
      const shape = isChallenge ? 'w-7' : 'w-5';
      const look = isDone
        ? 'bg-[#00a859]'
        : c.id === nextId
          ? 'border border-[#00a859]'
          : isChallenge
            ? 'border border-[#f3a43a]/60'
            : 'bg-[#263248]';
      return <span key={c.id} className={`h-2.5 rounded-sm ${shape} ${look}`} />;
    })}
  </span>
);

const ProgrammingLanguagePage: React.FC = () => {
  const { langSlug = '' } = useParams<{ langSlug: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const ar = lang === 'ar';

  const language = getLanguage(langSlug);
  const done = useProgrammingDone(langSlug);
  /* Which modules are open. Until the learner opens or closes one, only the
     module holding their next step is open. */
  const [openIds, setOpenIds] = useState<Set<string> | null>(null);

  if (!language) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Language not found</h2>
          <Button variant="outline" onClick={() => navigate('/fundamentals/programming')}>
            Back to Programming
          </Button>
        </div>
      </div>
    );
  }

  const header = (
    <PageHeader
      backTo="/fundamentals/programming"
      backLabel={ar ? 'البرمجة' : 'Programming'}
      title={language.name}
      subtitle={language.description[lang]}
      iconNode={
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
          style={{
            backgroundColor: `${language.color}15`,
            border: `1px solid ${language.color}30`,
            color: language.color,
          }}
        >
          {language.name === 'Python' ? 'Py' : language.name === 'C' ? 'C' : '#!'}
        </div>
      }
    />
  );

  /* A language with nothing published yet is a normal state, not an error:
     its modules are authored in the creator tools and merged in once live. */
  if (language.modules.length === 0) {
    return (
      <div className="space-y-8">
        {header}
        <EmptyState
          icon={BookOpen}
          title={ar ? 'قريباً' : 'Coming Soon'}
          description={
            ar
              ? 'لا توجد وحدات منشورة لهذه اللغة بعد. عد قريباً!'
              : 'No modules have been published for this language yet. Check back soon!'
          }
        />
      </div>
    );
  }

  const steps = courseSteps(language);
  const doneCount = steps.filter((s) => done.has(s.concept.id)).length;
  const challenges = steps.filter((s) => s.concept.type === 'challenge');
  const challengesDone = challenges.filter((s) => done.has(s.concept.id)).length;
  // Read after `done` changes, so it moves with every finished step.
  const xpEarned = done.size > 0 ? languageXp(langSlug) : 0;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const next = steps.find((s) => !done.has(s.concept.id)) ?? null;
  const currentModuleId = next?.module.id ?? null;

  const isOpen = (moduleId: string) => (openIds ? openIds.has(moduleId) : moduleId === currentModuleId);
  const toggle = (moduleId: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev ?? (currentModuleId ? [currentModuleId] : []));
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  const lessonsLabel = (n: number) => `${n} ${t(n === 1 ? 'card.lesson' : 'card.lessons')}`;
  const challengesLabel = (n: number) => `${n} ${t(n === 1 ? 'card.challenge' : 'card.challenges')}`;

  return (
    <div className="space-y-8">
      {header}

      {/* ── Where you are, and the way on ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#263248] bg-[#121a2a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#9aa5bf]">
            {ar ? (
              <>
                الخطوات: <span className="font-semibold text-[#f3f6ff]">{doneCount}</span> من {steps.length}
                <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
                التحديات: <span className="font-semibold text-[#f3f6ff]">{challengesDone}</span> من {challenges.length}
                <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
                نقاط الخبرة:{' '}
                <span className="font-semibold text-[#00a859]" dir="ltr">
                  {xpEarned.toLocaleString('en-US')}
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-[#f3f6ff]">{doneCount}</span> of {steps.length} steps
                <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
                <span className="font-semibold text-[#f3f6ff]">{challengesDone}</span> of {challenges.length}{' '}
                {challenges.length === 1 ? 'challenge' : 'challenges'}
                <span className="mx-2 text-[#4d5a73]" aria-hidden>·</span>
                <span className="font-semibold text-[#00a859]">{xpEarned.toLocaleString('en-US')}</span> XP
              </>
            )}
          </p>
          <div
            className="mt-2.5 h-2 max-w-md overflow-hidden rounded-full bg-[#0a0f18]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {next ? (
          <ModuleActionButton
            onClick={() => navigate(stepPath(langSlug, next))}
            icon={<PlayCircle size={17} />}
          >
            {doneCount === 0 ? (ar ? 'ابدأ: ' : 'Start: ') : ar ? 'تابع: ' : 'Continue: '}
            {shortTitle(next.concept.title[lang] || next.concept.title.en)}
          </ModuleActionButton>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00a859]">
            <Check size={16} /> {ar ? 'أكملت كل الخطوات' : 'Every step is done'}
          </span>
        )}
      </div>

      {/* ── The modules, down a dashed line ── */}
      <ol className="space-y-4">
        {language.modules.map((mod, i) => {
          const concepts = mod.concepts;
          const modDone = concepts.filter((c) => done.has(c.id)).length;
          const complete = concepts.length > 0 && modDone === concepts.length;
          const holdsNext = currentModuleId === mod.id;
          const open = isOpen(mod.id);
          const lessons = concepts.filter((c) => c.type !== 'challenge').length;
          const challengeCount = concepts.length - lessons;
          const firstOpenStep = concepts.find((c) => !done.has(c.id))?.id ?? null;
          const credit = creatorCredit(mod);
          const last = i === language.modules.length - 1;
          const panelId = `module-steps-${mod.id}`;

          return (
            <li key={mod.id} className="relative ps-12 sm:ps-14">
              {/* The stretch of road down to the next module */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute start-[17px] top-10 -bottom-4 border-s-2 border-dashed"
                  style={{ borderColor: complete ? TRAIL_DONE : TRAIL_TODO }}
                />
              )}
              <span
                className={`absolute start-0 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-black ${
                  complete
                    ? 'border-[#00a859] bg-[#00a859] text-[#0d1117]'
                    : holdsNext
                      ? 'border-[#00a859] bg-[#0d1117] text-[#00a859]'
                      : 'border-[#263248] bg-[#0d1117] text-[#8592ad]'
                }`}
              >
                {complete ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>

              <div
                className={`overflow-hidden rounded-2xl border bg-[#121a2a] transition-colors ${
                  holdsNext ? 'border-[#00a859]/60' : 'border-[#263248]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(mod.id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[#1a2332]/50 focus:outline-none focus-visible:bg-[#1a2332]/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#00a859]">
                      {ar ? `الوحدة ${i + 1}` : `Module ${i + 1}`}
                    </span>
                    <span className="mt-0.5 block text-base font-bold leading-snug text-[#f3f6ff]">
                      {mod.title[lang] || mod.title.en}
                    </span>
                    {!complete && (mod.description[lang] || mod.description.en) && (
                      <span className="mt-0.5 block text-sm text-[#9aa5bf] line-clamp-1">
                        {mod.description[lang] || mod.description.en}
                      </span>
                    )}
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8592ad]">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={12} /> {lessonsLabel(lessons)}
                      </span>
                      {challengeCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#f3a43a]">
                          <Trophy size={12} /> {challengesLabel(challengeCount)}
                        </span>
                      )}
                      {mod.videoId && (
                        <span className="inline-flex items-center gap-1 text-[#ff4d4d]">
                          <Youtube size={13} /> {ar ? 'فيديو' : 'Video'}
                        </span>
                      )}
                      {credit && <AuthorChip credit={credit} className="text-[#aab3c7]" />}
                    </span>
                    {/* Only the step to take next is outlined in a strip, so the
                        path has one green mark saying where you are. An opened
                        module still rings its own first unfinished step. */}
                    {!open && !complete && (
                      <StepStrip concepts={concepts} done={done} nextId={next?.concept.id ?? null} />
                    )}
                  </span>

                  <span className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    <span className={`text-xs ${complete ? 'font-bold text-[#00a859]' : 'text-[#9aa5bf]'}`}>
                      {complete ? (ar ? 'مكتملة' : 'Complete') : `${modDone}/${concepts.length}`}
                    </span>
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#0a0f18]">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#00a859] to-[#9fef00]"
                        style={{ width: `${concepts.length ? Math.round((modDone / concepts.length) * 100) : 0}%` }}
                      />
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#7c8aa6] transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {open ? (ar ? 'إخفاء الخطوات' : 'Hide steps') : ar ? 'عرض الخطوات' : 'Show steps'}
                    </span>
                  </span>
                </button>

                {open && (
                  <ol id={panelId} className="border-t border-[#263248] px-2 py-2">
                    {concepts.map((c, j) => {
                      const isDone = done.has(c.id);
                      const isChallenge = c.type === 'challenge';
                      const isGlobalNext = next?.concept.id === c.id;
                      return (
                        <li key={c.id}>
                          <Link
                            to={stepPath(langSlug, { module: mod, concept: c })}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50 ${
                              isGlobalNext
                                ? 'bg-[#00a859]/10 ring-1 ring-inset ring-[#00a859]/40'
                                : 'hover:bg-[#1a2332]'
                            }`}
                          >
                            <StepIcon
                              done={isDone}
                              next={c.id === firstOpenStep}
                              challenge={isChallenge}
                              number={j + 1}
                            />
                            <span
                              className={`min-w-0 flex-1 truncate text-sm ${
                                isDone
                                  ? 'text-[#d2d7e3]'
                                  : isChallenge
                                    ? 'text-[#f3a43a]'
                                    : c.id === firstOpenStep
                                      ? 'font-semibold text-[#f3f6ff]'
                                      : 'text-[#9aa5bf]'
                              }`}
                            >
                              {c.title[lang] || c.title.en}
                            </span>
                            {isGlobalNext && (
                              <span className="flex-shrink-0 text-[11px] font-bold text-[#00a859]">
                                {ar ? 'التالي' : 'Up next'}
                              </span>
                            )}
                            {isChallenge && (
                              <span className="flex-shrink-0 text-[11px] font-semibold text-[#f3a43a]" dir="ltr">
                                {conceptXp(c).toLocaleString('en-US')} XP
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default ProgrammingLanguagePage;
