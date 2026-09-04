import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FlaskConical,
  ExternalLink,
  Download,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Wrench,
  Maximize2,
  Minimize2,
  Network,
  FileText,
} from 'lucide-react';
import LessonMarkdown from '../ui/LessonMarkdown';
import Button from '../ui/EnhancedButton';
import { NetworkSimulator } from '../network-sim';
import { hasSimulation } from '../network-sim/types';
import {
  checkFlag,
  formatBytes,
  isInsecureLabUrl,
  labFlags,
  labHost,
  type ModuleLab,
} from '../../services/labTypes';
import {
  emptyLabProgress,
  formatStartedAgo,
  getLabProgress,
  saveLabProgress,
  type LabProgress,
} from '../../services/labProgress';

interface LabViewProps {
  lab: ModuleLab;
  lang: 'en' | 'ar';
  /** Keys the working state. Absent in the studio preview, which persists nothing. */
  moduleSlug?: string;
  isComplete?: boolean;
  onComplete?: () => void;
  /** Studio preview: real layout, real links, no writes and no completion. */
  preview?: boolean;
}

/* Gold is the lab accent throughout: green already means "lesson complete" and
 * neon is reserved for flags, so hands-on work needs its own colour. */
const ACCENT = '#f3a43a';

const T = {
  lab: { en: 'Lab', ar: 'مختبر' },
  handsOn: { en: 'Hands-on', ar: 'عملي' },
  runsOn: { en: 'Runs on', ar: 'يعمل على' },
  inPage: { en: 'Runs in this page', ar: 'يعمل داخل الصفحة' },
  min: { en: 'min', ar: 'دقيقة' },
  before: { en: 'Before you start', ar: 'قبل أن تبدأ' },
  whatYoullDo: { en: "What you'll do", ar: 'ما ستقوم به' },
  openLab: { en: 'Open the lab', ar: 'افتح المختبر' },
  openAgain: { en: 'Open the lab again', ar: 'افتح المختبر مرة أخرى' },
  newTab: { en: 'Opens in a new tab', ar: 'يفتح في تبويب جديد' },
  alsoNeed: { en: 'Also open', ar: 'روابط أخرى' },
  files: { en: "Files you'll need", ar: 'الملفات التي ستحتاجها' },
  download: { en: 'Download', ar: 'تنزيل' },
  simulation: { en: 'Network simulation', ar: 'محاكاة الشبكة' },
  expand: { en: 'Expand', ar: 'توسيع' },
  collapse: { en: 'Collapse', ar: 'تصغير' },
  finished: { en: 'I finished this lab', ar: 'أنهيت هذا المختبر' },
  labDone: { en: 'Lab complete', ar: 'اكتمل المختبر' },
  submitFlags: { en: 'Submit your findings', ar: 'أرسل ما توصلت إليه' },
  submit: { en: 'Submit', ar: 'إرسال' },
  solved: { en: 'Correct', ar: 'صحيح' },
  wrong: { en: 'Not quite, try again.', ar: 'ليست صحيحة، حاول مرة أخرى.' },
  hint: { en: 'Show hint', ar: 'إظهار تلميح' },
  found: { en: 'found', ar: 'تم إيجادها' },
  insecure: { en: 'Not a secure link', ar: 'رابط غير آمن' },
  previewNote: {
    en: 'Preview, nothing is saved and completion is disabled.',
    ar: 'معاينة، لا يتم حفظ شيء والإكمال معطّل.',
  },
};

const t = (k: keyof typeof T, lang: 'en' | 'ar') => T[k][lang];

/* ── One destination ── */
const LaunchCard: React.FC<{
  label: string;
  url: string;
  lang: 'en' | 'ar';
  primary: boolean;
  started: boolean;
  onOpen: () => void;
}> = ({ label, url, lang, primary, started, onOpen }) => {
  const host = labHost(url);
  const insecure = isInsecureLabUrl(url);

  if (!primary) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className="flex items-center gap-3 rounded-lg border border-[#263248] bg-[#0d1420] px-4 py-3 transition-colors hover:border-[#f3a43a]/40 hover:bg-[#161f30]"
      >
        <ExternalLink size={14} className="rtl-flip flex-shrink-0 text-[#8592ad]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#d2d7e3]">
            {label || host}
          </span>
          <span className="block truncate text-[11px] text-[#7c8aa6]" dir="ltr">
            {host}
          </span>
        </span>
        {insecure && (
          <span className="flex-shrink-0 rounded border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#f3a43a]">
            http
          </span>
        )}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="group flex items-center gap-4 rounded-xl border border-[#f3a43a]/35 bg-gradient-to-br from-[#f3a43a]/12 to-[#121a2a] px-5 py-4 transition-all hover:border-[#f3a43a]/60 hover:shadow-[0_0_24px_rgba(243,164,58,0.15)]"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#f3a43a]/30 bg-[#f3a43a]/10">
        <ExternalLink size={18} className="rtl-flip text-[#f3a43a]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-[#f3f6ff] group-hover:text-[#f3a43a]">
          {started ? t('openAgain', lang) : label || t('openLab', lang)}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#9aa5bf]">
          {host && (
            <span className="font-semibold text-[#c4cad6]" dir="ltr">
              {host}
            </span>
          )}
          <span className="text-[#7c8aa6]">{t('newTab', lang)}</span>
          {insecure && (
            <span className="rounded border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-1.5 py-0.5 font-bold text-[#f3a43a]">
              {t('insecure', lang)}
            </span>
          )}
        </span>
      </span>
    </a>
  );
};

/* ── The flags a student brings back from the environment ── */
const FlagBoard: React.FC<{
  lab: ModuleLab;
  lang: 'en' | 'ar';
  solved: string[];
  onSolve: (flagId: string) => void;
  disabled: boolean;
}> = ({ lab, lang, solved, onSolve, disabled }) => {
  const flags = labFlags(lab);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const submit = (flagId: string) => {
    const flag = flags.find((f) => f.id === flagId);
    if (!flag || disabled) return;
    if (checkFlag(flag, drafts[flagId] ?? '')) {
      setWrong((w) => ({ ...w, [flagId]: false }));
      onSolve(flagId);
    } else {
      setWrong((w) => ({ ...w, [flagId]: true }));
    }
  };

  const solvedCount = flags.filter((f) => solved.includes(f.id)).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#263248] bg-[#121a2a]">
      <div className="flex items-center gap-2 border-b border-[#263248] px-5 py-3.5">
        <Flag size={15} className="text-[#9fef00]" />
        <h3 className="text-sm font-bold text-[#f3f6ff]">{t('submitFlags', lang)}</h3>
        <span className="ms-auto text-xs font-semibold text-[#8592ad]" dir="ltr">
          {solvedCount}/{flags.length} {t('found', lang)}
        </span>
      </div>

      <div className="divide-y divide-[#263248]/70">
        {flags.map((flag) => {
          const isSolved = solved.includes(flag.id);
          return (
            <div key={flag.id} className="px-5 py-4">
              <div className="mb-2.5 flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0">
                  {isSolved ? (
                    <CheckCircle2 size={15} className="text-[#00a859]" />
                  ) : (
                    <Circle size={15} className="text-[#7c8aa6]" />
                  )}
                </span>
                <p
                  className={`text-sm font-medium leading-snug ${
                    isSolved ? 'text-[#8592ad] line-through' : 'text-[#d2d7e3]'
                  }`}
                >
                  {flag.label}
                </p>
              </div>

              {isSolved ? (
                <p className="ms-6 text-xs font-semibold text-[#00a859]">{t('solved', lang)}</p>
              ) : (
                <div className="ms-6 space-y-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit(flag.id);
                    }}
                    className="flex flex-col gap-2 sm:flex-row"
                    dir="ltr"
                  >
                    <input
                      type="text"
                      value={drafts[flag.id] ?? ''}
                      disabled={disabled}
                      onChange={(e) => {
                        setDrafts((d) => ({ ...d, [flag.id]: e.target.value }));
                        setWrong((w) => ({ ...w, [flag.id]: false }));
                      }}
                      placeholder="khana{...}"
                      aria-label={flag.label}
                      className={`min-w-0 flex-1 rounded-lg border bg-[#0d1117] px-3.5 py-2.5 font-mono text-sm text-[#f3f6ff] transition-colors placeholder:text-[#7c8aa6] focus:outline-none disabled:opacity-50 ${
                        wrong[flag.id]
                          ? 'border-red-500/50 focus:border-red-500/70'
                          : 'border-[#263248] focus:border-[#9fef00]/50'
                      }`}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={disabled || !(drafts[flag.id] ?? '').trim()}
                    >
                      {t('submit', lang)}
                    </Button>
                  </form>

                  <div className="flex flex-wrap items-center gap-3">
                    {wrong[flag.id] && (
                      <span className="text-xs font-semibold text-red-400">{t('wrong', lang)}</span>
                    )}
                    {flag.hint && !hints[flag.id] && (
                      <button
                        type="button"
                        onClick={() => setHints((h) => ({ ...h, [flag.id]: true }))}
                        className="text-xs font-semibold text-[#8592ad] underline-offset-2 transition-colors hover:text-[#f3a43a] hover:underline"
                      >
                        {t('hint', lang)}
                      </button>
                    )}
                    {flag.hint && hints[flag.id] && (
                      <span className="text-xs italic text-[#9aa5bf]">{flag.hint}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * The student's view of a lab, and the studio's preview of one. Both render
 * this component so a creator is looking at the real thing rather than an
 * approximation of it: `preview` only stops writes and completion, it changes
 * nothing about the layout.
 */
const LabView: React.FC<LabViewProps> = ({
  lab,
  lang,
  moduleSlug,
  isComplete = false,
  onComplete,
  preview = false,
}) => {
  const persist = !preview && !!moduleSlug;

  const [progress, setProgress] = useState<LabProgress>(() =>
    persist ? getLabProgress(moduleSlug!, lab.id) : emptyLabProgress()
  );
  const [simExpanded, setSimExpanded] = useState(false);

  // A different lab in the same viewer is a different document.
  useEffect(() => {
    setProgress(persist ? getLabProgress(moduleSlug!, lab.id) : emptyLabProgress());
  }, [moduleSlug, lab.id, persist]);

  /* Takes the previous state rather than a patch, so two answers submitted in
     quick succession can't overwrite each other. */
  const update = useCallback(
    (patch: (prev: LabProgress) => Partial<LabProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...patch(prev) };
        if (persist) saveLabProgress(moduleSlug!, lab.id, next);
        return next;
      });
    },
    [moduleSlug, lab.id, persist]
  );

  const flags = labFlags(lab);
  const solvedAll = flags.length > 0 && flags.every((f) => progress.flagsSolved.includes(f.id));

  /* All the flags in means the lab is done. Marking it here rather than making
     the student press a second button: they already proved it. */
  useEffect(() => {
    if (solvedAll && !isComplete && onComplete && !preview) onComplete();
  }, [solvedAll, isComplete, onComplete, preview]);

  const markOpened = useCallback(() => {
    update((prev) => (prev.openedAt ? {} : { openedAt: new Date().toISOString() }));
  }, [update]);

  const toggleObjective = (index: number) => {
    update((prev) => ({
      objectivesDone: prev.objectivesDone.includes(index)
        ? prev.objectivesDone.filter((i) => i !== index)
        : [...prev.objectivesDone, index],
    }));
  };

  const brief = lab.brief[lang] || lab.brief.en || lab.brief.ar;
  const sim = hasSimulation(lab.simulation) ? lab.simulation : undefined;
  const [primaryLink, ...otherLinks] = lab.links;
  const started = !!progress.openedAt;

  const objectivesDoneCount = useMemo(
    () => lab.objectives.filter((_, i) => progress.objectivesDone.includes(i)).length,
    [lab.objectives, progress.objectivesDone]
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: ACCENT,
              borderColor: `${ACCENT}4d`,
              backgroundColor: `${ACCENT}1a`,
            }}
          >
            <FlaskConical size={11} /> {t('lab', lang)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#263248] bg-[#1a2332] px-2 py-0.5 text-[11px] font-medium text-[#9aa5bf]">
            <Clock size={10} /> {lab.estimatedMinutes} {t('min', lang)}
          </span>
          {primaryLink ? (
            <span
              className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-[#263248] bg-[#1a2332] px-2 py-0.5 text-[11px] font-medium text-[#9aa5bf]"
              dir="ltr"
            >
              <ExternalLink size={10} className="rtl-flip" /> {t('runsOn', lang)}{' '}
              {labHost(primaryLink.url)}
            </span>
          ) : sim ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-[#263248] bg-[#1a2332] px-2 py-0.5 text-[11px] font-medium text-[#9aa5bf]">
              <Network size={10} /> {t('inPage', lang)}
            </span>
          ) : null}
          {started && !isComplete && (
            <span className="text-[11px] font-medium text-[#7c8aa6]">
              {formatStartedAgo(progress.openedAt!, lang)}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-[#f3f6ff] md:text-3xl">{lab.title}</h2>

        {preview && (
          <p className="mt-2 text-xs italic text-[#7c8aa6]">{t('previewNote', lang)}</p>
        )}
      </div>

      {/* ── Setup notes ── */}
      {lab.setupNotes && (
        <div className="flex items-start gap-3 rounded-xl border border-[#60a5fa]/25 bg-[#60a5fa]/[0.07] px-4 py-3.5">
          <Wrench size={15} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
          <div className="min-w-0">
            <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-[#60a5fa]">
              {t('before', lang)}
            </p>
            <p className="text-sm leading-relaxed text-[#d2d7e3]">{lab.setupNotes}</p>
          </div>
        </div>
      )}

      {/* ── Objectives ──
          The one thing in the page to touch while the real work happens on
          another site. Ticking the last one is what earns the finish button. */}
      {lab.objectives.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#263248] bg-[#121a2a]">
          <div className="flex items-center gap-2 border-b border-[#263248] px-5 py-3.5">
            <CheckCircle2 size={15} style={{ color: ACCENT }} />
            <h3 className="text-sm font-bold text-[#f3f6ff]">{t('whatYoullDo', lang)}</h3>
            <span className="ms-auto text-xs font-semibold text-[#8592ad]" dir="ltr">
              {objectivesDoneCount}/{lab.objectives.length}
            </span>
          </div>
          <ul className="p-2">
            {lab.objectives.map((objective, i) => {
              const done = progress.objectivesDone.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggleObjective(i)}
                    aria-pressed={done}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-[#182235]"
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      {done ? (
                        <CheckCircle2 size={16} className="text-[#00a859]" />
                      ) : (
                        <Circle size={16} className="text-[#7c8aa6]" />
                      )}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        done ? 'text-[#8592ad] line-through' : 'text-[#d2d7e3]'
                      }`}
                    >
                      {objective}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── The brief ── */}
      {brief.trim() && (
        <div className="rounded-xl border border-[#263248] bg-[#121a2a] p-6 md:p-8">
          <LessonMarkdown content={brief} />
        </div>
      )}

      {/* ── Where the work happens ── */}
      {lab.links.length > 0 && (
        <div className="space-y-2.5">
          <LaunchCard
            label={primaryLink.label}
            url={primaryLink.url}
            lang={lang}
            primary
            started={started}
            onOpen={markOpened}
          />
          {otherLinks.length > 0 && (
            <>
              <p className="pt-1 text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
                {t('alsoNeed', lang)}
              </p>
              {otherLinks.map((link) => (
                <LaunchCard
                  key={link.id}
                  label={link.label}
                  url={link.url}
                  lang={lang}
                  primary={false}
                  started={started}
                  onOpen={markOpened}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Files ── */}
      {lab.files.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#263248] bg-[#121a2a]">
          <div className="flex items-center gap-2 border-b border-[#263248] px-5 py-3.5">
            <FileText size={15} className="text-[#60a5fa]" />
            <h3 className="text-sm font-bold text-[#f3f6ff]">{t('files', lang)}</h3>
          </div>
          <ul className="divide-y divide-[#263248]/70">
            {lab.files.map((file) => (
              <li key={file.id}>
                <a
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#182235]"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#263248] bg-[#0d1420] text-[10px] font-bold uppercase text-[#60a5fa]">
                    {file.kind || 'file'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#d2d7e3]">
                      {file.name}
                    </span>
                    <span className="block text-[11px] text-[#7c8aa6]" dir="ltr">
                      {formatBytes(file.bytes)}
                    </span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-[#8592ad]">
                    <Download size={13} /> {t('download', lang)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── The half that runs here ── */}
      {sim && (
        <div
          className={
            simExpanded
              ? 'fixed inset-3 z-[60] flex flex-col overflow-hidden rounded-xl border border-[#263248] bg-[#121a2a] shadow-2xl md:inset-6'
              : 'overflow-hidden rounded-xl border border-[#263248] bg-[#121a2a]'
          }
        >
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#263248] px-5 py-3.5">
            <Network size={15} className="text-[#60a5fa]" />
            <h3 className="text-sm font-bold text-[#f3f6ff]">{t('simulation', lang)}</h3>
            <button
              type="button"
              onClick={() => setSimExpanded((v) => !v)}
              className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-[#263248] px-2.5 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-[#60a5fa]/40 hover:text-[#d2d7e3]"
            >
              {simExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {simExpanded ? t('collapse', lang) : t('expand', lang)}
            </button>
          </div>
          <div className={simExpanded ? 'min-h-0 flex-1 p-4' : 'h-[460px] p-4'}>
            <NetworkSimulator simulation={sim} lang={lang} />
          </div>
        </div>
      )}

      {/* ── Finishing ── */}
      {flags.length > 0 ? (
        <FlagBoard
          lab={lab}
          lang={lang}
          solved={progress.flagsSolved}
          onSolve={(flagId) =>
            update((prev) =>
              prev.flagsSolved.includes(flagId)
                ? {}
                : { flagsSolved: [...prev.flagsSolved, flagId] }
            )
          }
          disabled={preview}
        />
      ) : null}

      <div className="border-t border-[#263248] pt-4">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#00a859]/20 bg-[#0f1f15] px-4 py-2.5 text-[#00a859]"
            >
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">{t('labDone', lang)}</span>
            </motion.div>
          ) : flags.length === 0 ? (
            <motion.div key="finish" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={onComplete}
                disabled={preview || !onComplete}
                leftIcon={<CheckCircle2 size={16} />}
              >
                {t('finished', lang)}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Expanded simulation needs a way out that is not the toggle behind it. */}
      {simExpanded && (
        <button
          type="button"
          onClick={() => setSimExpanded(false)}
          aria-label={t('collapse', lang)}
          className="fixed inset-0 z-[59] cursor-default bg-black/60"
        />
      )}
    </div>
  );
};

export default LabView;
