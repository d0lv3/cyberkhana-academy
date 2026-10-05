import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  EyeOff,
  Flag,
  Hourglass,
  ListChecks,
  Loader2,
  Lock,
  Percent,
  RefreshCw,
  Server,
  ShieldCheck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import Button from '../../components/ui/EnhancedButton';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import BrandLogo from '../../components/ui/BrandLogo';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import { getPublishedPathBySlug } from '../../services/creatorDataService';
import { formatBytes } from '../../services/labTypes';
import { NOT_ENROLLED } from '../../data/iraqUniversities';
import {
  cleanCertificateName,
  fetchAttempt,
  fetchExamStatus,
  reportExamProblem,
  saveExamAnswers,
  startExam,
  submitExam,
  targetText,
  type AttemptSectionView,
  type AttemptTaskView,
  type AttemptView,
  type ExamAnswer,
  type ExamResult,
  type ExamStatus,
} from '../../services/examService';
import { claimCertificate } from '../../services/certificateService';

/* ─── Sitting a path's final exam ───
 *
 * Three screens. The rules, which say what the exam is before its clock
 * starts. The paper: a section at a time, theory one question to a screen and
 * a practical section with its brief and target beside its tasks. And the
 * result, which for a pass is where the certificate is claimed.
 *
 * Nothing on this page decides anything. The server deals the attempt, keeps
 * the clock, and marks it (backend/src/routes/exams.ts); what is typed here is
 * kept there every few seconds, so a closed tab costs nothing but the time.
 */

type Say = (en: string, ar: string) => string;

/** A length of time in words: "45 minutes", "2 hours", "3 days". */
function span(minutes: number, say: Say): string {
  if (minutes >= 2880 && minutes % 1440 === 0) return say(`${minutes / 1440} days`, `${minutes / 1440} أيام`);
  if (minutes >= 120) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return say(`${hours} hours`, `${hours} ساعة`);
  }
  return say(`${minutes} minutes`, `${minutes} دقيقة`);
}

/** What is left on the clock, as digits. */
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const rest = `${pad(minutes)}:${pad(seconds)}`;
  if (days > 0) return `${days}d ${pad(hours)}:${rest}`;
  return hours > 0 ? `${hours}:${rest}` : rest;
}

const when = (iso: string, isArabic: boolean) =>
  new Date(iso).toLocaleString(isArabic ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

const Shell: React.FC<{ title: string; onBack: () => void; backLabel: string; right?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  onBack,
  backLabel,
  right,
  children,
}) => (
  <div className="lesson-shell fixed inset-0 flex flex-col bg-[#0a0e14]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263248] bg-[#0d1117] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#8592ad] transition-colors hover:bg-[#182235] hover:text-[#f3f6ff]"
        >
          <ArrowLeft size={15} className="rtl-flip" /> <span className="hidden sm:inline">{backLabel}</span>
        </button>
        <BrandLogo className="hidden h-6 w-auto sm:block" />
        <p className="min-w-0 truncate text-sm font-bold text-[#f3f6ff]" dir="auto">
          {title}
        </p>
      </div>
      {right}
    </header>
    <main className="custom-scrollbar flex-1 overflow-y-auto">{children}</main>
  </div>
);

const Fact: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-[#263248] bg-[#0d1117] p-3.5">
    <Icon size={16} className="text-[#00a859]" />
    <p className="mt-2 text-lg font-black leading-tight text-[#f3f6ff]">{value}</p>
    <p className="mt-0.5 text-[11px] text-[#8592ad]">{label}</p>
  </div>
);

const RuleLine: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed text-[#d2d7e3]">
    <Icon size={16} className="mt-0.5 flex-shrink-0 text-[#8592ad]" />
    <span>{children}</span>
  </li>
);

/* ── One task ── */

const TaskInput: React.FC<{
  task: AttemptTaskView;
  value: ExamAnswer | undefined;
  onChange: (value: ExamAnswer) => void;
  say: Say;
}> = ({ task, value, onChange, say }) => {
  if (task.kind === 'mcq') {
    return (
      <div className="space-y-2" role="radiogroup">
        {(task.options ?? []).map((option, i) => {
          const picked = value === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() => onChange(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm transition-colors ${
                picked
                  ? 'border-[#00a859] bg-[#00a859]/10 text-[#f3f6ff]'
                  : 'border-[#263248] bg-[#0d1117] text-[#d2d7e3] hover:border-[#354562]'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  picked ? 'border-[#00a859] bg-[#00a859] text-[#0d1117]' : 'border-[#354562] text-[#8592ad]'
                }`}
                dir="ltr"
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span dir="auto" className="min-w-0 break-words">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  const flag = task.kind === 'flag';
  return (
    <input
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={flag ? task.placeholder || 'khana{...}' : say('Type your answer', 'اكتب إجابتك')}
      dir={flag ? 'ltr' : 'auto'}
      spellCheck={false}
      autoComplete="off"
      maxLength={400}
      className={`w-full rounded-xl border border-[#263248] bg-[#0d1117] px-4 py-3 text-sm text-[#f3f6ff] placeholder:text-[#6e7a94] focus:border-[#00a859]/60 focus:outline-none ${
        flag ? 'font-mono' : ''
      }`}
    />
  );
};

const isAnswered = (value: ExamAnswer | undefined) => (typeof value === 'number' ? true : typeof value === 'string' && value.trim() !== '');

/* ── A practical section's environment ── */

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* the text is selectable either way */
        }
      }}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#263248] text-[#8592ad] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859]"
    >
      {copied ? <Check size={15} className="text-[#00a859]" /> : <Copy size={15} />}
    </button>
  );
};

const Environment: React.FC<{ section: AttemptSectionView; lang: 'en' | 'ar'; say: Say }> = ({ section, lang, say }) => {
  const brief = section.brief[lang] || section.brief.en || section.brief.ar;
  return (
    <div className="space-y-5">
      {section.targets.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">{say('Target', 'الهدف')}</p>
          <div className="space-y-2">
            {section.targets.map((target, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#f3a43a]/30 bg-[#f3a43a]/[0.06] px-3.5 py-3">
                <Server size={17} className="flex-shrink-0 text-[#f3a43a]" />
                <div className="min-w-0 flex-1">
                  {target.label && (
                    <p className="truncate text-xs text-[#9aa5bf]" dir="auto">
                      {target.label}
                    </p>
                  )}
                  {/* An address is pasted into a terminal, not clicked, so it is text and never a link. */}
                  <p className="break-all text-sm font-bold text-[#f3f6ff]">
                    <span dir="ltr" className="font-mono">
                      {targetText(target)}
                    </span>
                  </p>
                </div>
                <CopyButton text={targetText(target)} label={say('Copy the address', 'نسخ العنوان')} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#8592ad]">
            {say(
              'Work against this address only, and only while this attempt is running. No denial of service, and leave it working for the next person.',
              'اعمل على هذا العنوان فقط، وفقط أثناء هذه المحاولة. لا هجمات حجب خدمة، واتركه يعمل لمن يأتي بعدك.'
            )}
          </p>
        </div>
      )}

      {(section.links.length > 0 || section.files.length > 0) && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">{say('Files and links', 'الملفات والروابط')}</p>
          <div className="space-y-2">
            {section.files.map((file, i) => (
              <a
                key={`f${i}`}
                href={file.url}
                download={file.name}
                className="flex items-center gap-3 rounded-xl border border-[#263248] bg-[#0d1117] px-3.5 py-2.5 transition-colors hover:border-[#354562]"
              >
                <Download size={15} className="flex-shrink-0 text-[#60a5fa]" />
                <span className="min-w-0 flex-1 truncate text-sm text-[#d2d7e3]" dir="ltr">
                  {file.name}
                </span>
                <span className="flex-shrink-0 text-[11px] text-[#8592ad]" dir="ltr">
                  {formatBytes(file.bytes)}
                </span>
              </a>
            ))}
            {section.links.map((link, i) => {
              let host = '';
              try {
                host = new URL(link.url).hostname.replace(/^www\./, '');
              } catch {
                /* shown without its host */
              }
              return (
                <a
                  key={`l${i}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[#263248] bg-[#0d1117] px-3.5 py-2.5 transition-colors hover:border-[#354562]"
                >
                  <ExternalLink size={15} className="flex-shrink-0 text-[#60a5fa]" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#d2d7e3]" dir="auto">
                    {link.label || host}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-[#8592ad]" dir="ltr">
                    {host}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {brief.trim() && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">{say('The brief', 'الموجز')}</p>
          <div className="rounded-xl border border-[#263248] bg-[#0d1117] p-4" dir={lang === 'ar' && section.brief.ar ? 'rtl' : 'ltr'}>
            <LessonMarkdown content={brief} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── The paper ── */

const Paper: React.FC<{
  pathId: string;
  title: string;
  attempt: AttemptView;
  onDone: (result: ExamResult) => void;
  onLeave: () => void;
}> = ({ pathId, title, attempt, onDone, onLeave }) => {
  const { lang, isArabic } = useLang();
  const say: Say = (en, ar) => (isArabic ? ar : en);

  const [answers, setAnswers] = useState<Map<string, ExamAnswer>>(() => new Map(attempt.answers.map((a) => [a.task, a.value])));
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [sectionIndex, setSectionIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'failed'>('saved');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reported, setReported] = useState(attempt.reported);

  /* The deadline is the server's. Its clock and this one may disagree, so the
     countdown runs on the gap between them as measured when the attempt arrived. */
  const offset = useRef(new Date(attempt.serverNow).getTime() - Date.now());
  const deadline = useMemo(() => new Date(attempt.deadline).getTime(), [attempt.deadline]);
  const [left, setLeft] = useState(() => deadline - (Date.now() + offset.current));

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const payload = () => [...answersRef.current.entries()].map(([task, value]) => ({ task, value }));

  const section = attempt.sections[Math.min(sectionIndex, attempt.sections.length - 1)];
  const allTasks = useMemo(() => attempt.sections.flatMap((s) => s.tasks), [attempt.sections]);
  const answeredCount = allTasks.filter((t) => isAnswered(answers.get(t.id))).length;

  const finish = useCallback(
    async (silent: boolean) => {
      if (submitting) return;
      setSubmitting(true);
      setError('');
      try {
        const { result } = await submitExam(pathId, attempt.id, payload());
        onDone(result);
      } catch (err) {
        setSubmitting(false);
        if (!silent || !(err instanceof ApiError)) {
          setError(say('Could not submit. Check your connection and try again.', 'تعذّر الإرسال. تحقق من اتصالك وحاول مجددًا.'));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempt.id, pathId, submitting]
  );

  /* The clock. At zero the paper hands itself in with whatever it holds, and
     if that does not get through it tries again every ten seconds. */
  const lastAuto = useRef(0);
  useEffect(() => {
    const tick = () => {
      const remaining = deadline - (Date.now() + offset.current);
      setLeft(remaining);
      if (remaining <= 0 && Date.now() - lastAuto.current > 10_000) {
        lastAuto.current = Date.now();
        void finish(true);
      }
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, finish]);

  /* Answers are kept on the server a moment after each change. */
  const dirty = useRef(false);
  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSaveState('saving');
    try {
      await saveExamAnswers(pathId, attempt.id, payload());
      setSaveState(dirty.current ? 'unsaved' : 'saved');
    } catch (err) {
      if (err instanceof ApiError && err.body.code === 'TIME_UP' && err.body.result) {
        onDone(err.body.result as ExamResult);
        return;
      }
      dirty.current = true;
      setSaveState('failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id, pathId]);

  useEffect(() => {
    if (saveState !== 'unsaved' && saveState !== 'failed') return;
    const timer = setTimeout(() => void save(), saveState === 'failed' ? 8000 : 1500);
    return () => clearTimeout(timer);
  }, [answers, saveState, save]);

  /* Closing the tab with something unsaved gets one last push. */
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') void save();
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [save]);

  const setAnswer = (taskId: string, value: ExamAnswer) => {
    setAnswers((prev) => new Map(prev).set(taskId, value));
    dirty.current = true;
    setSaveState('unsaved');
  };

  const goSection = (index: number) => {
    setSectionIndex(index);
    setTaskIndex(0);
    void save();
  };

  const askSubmit = async () => {
    const missing = allTasks.length - answeredCount;
    const ok = await confirmDialog({
      title: say('Submit the exam?', 'إرسال الاختبار؟'),
      message:
        missing > 0
          ? say(
              `${missing} of ${allTasks.length} tasks have no answer. Once submitted, the exam is marked and cannot be reopened.`,
              `${missing} من ${allTasks.length} مهمة بلا إجابة. بعد الإرسال يُصحَّح الاختبار ولا يمكن فتحه مجددًا.`
            )
          : say('Once submitted, the exam is marked and cannot be reopened.', 'بعد الإرسال يُصحَّح الاختبار ولا يمكن فتحه مجددًا.'),
      confirmLabel: say('Submit', 'إرسال'),
    });
    if (ok) void finish(false);
  };

  const sendReport = async () => {
    try {
      await reportExamProblem(pathId, attempt.id, reportNote.trim());
      setReported(true);
      setReporting(false);
    } catch {
      setError(say('Could not send the report.', 'تعذّر إرسال البلاغ.'));
    }
  };

  const low = left < 5 * 60_000;
  const theory = section.kind === 'theory';
  const task = theory ? section.tasks[Math.min(taskIndex, section.tasks.length - 1)] : null;

  const saveLabel =
    saveState === 'saved'
      ? say('Saved', 'تم الحفظ')
      : saveState === 'failed'
        ? say('Not saved, retrying', 'لم يُحفظ، إعادة المحاولة')
        : say('Saving', 'جارٍ الحفظ');

  return (
    <Shell
      title={title}
      onBack={onLeave}
      backLabel={say('Leave', 'خروج')}
      right={
        <div className="flex items-center gap-3">
          <span className={`hidden text-[11px] sm:inline ${saveState === 'failed' ? 'text-[#f3a43a]' : 'text-[#8592ad]'}`}>{saveLabel}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold ${
              low ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-[#263248] bg-[#0a0f18] text-[#f3f6ff]'
            }`}
            role="timer"
            aria-label={say('Time left', 'الوقت المتبقي')}
          >
            <Clock size={14} />
            <span dir="ltr" className="font-mono tabular-nums">
              {clock(left)}
            </span>
          </span>
          <Button size="sm" onClick={askSubmit} isLoading={submitting}>
            {say('Submit', 'إرسال')}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-5">
        {/* Sections */}
        {attempt.sections.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {attempt.sections.map((s, i) => {
              const done = s.tasks.filter((t) => isAnswered(answers.get(t.id))).length;
              const active = i === sectionIndex;
              const Icon = s.kind === 'practical' ? Crosshair : BookOpen;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => goSection(i)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[#00a859]/50 bg-[#00a859]/10 text-[#f3f6ff]'
                      : 'border-[#263248] bg-[#0d1117] text-[#9aa5bf] hover:border-[#354562]'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-[#00a859]' : ''} />
                  <span dir="auto">{s.title || (s.kind === 'practical' ? say('Practical', 'عملي') : say('Theory', 'نظري'))}</span>
                  <span className="text-[#8592ad]" dir="ltr">
                    {done}/{s.tasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </p>
        )}

        {theory && task ? (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#8592ad]">
                  {say('Question', 'السؤال')} <span dir="ltr">{taskIndex + 1}</span> {say('of', 'من')}{' '}
                  <span dir="ltr">{section.tasks.length}</span>
                </p>
                <p className="text-xs text-[#8592ad]">
                  <span dir="ltr">{task.points}</span> {say(task.points === 1 ? 'pt' : 'pts', 'نقطة')}
                </p>
              </div>
              <p className="mb-5 whitespace-pre-line break-words text-base font-semibold leading-relaxed text-[#f3f6ff]">
                <span dir="auto">{task.prompt}</span>
              </p>
              <TaskInput task={task} value={answers.get(task.id)} onChange={(v) => setAnswer(task.id, v)} say={say} />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  aria-pressed={flagged.has(task.id)}
                  onClick={() =>
                    setFlagged((prev) => {
                      const next = new Set(prev);
                      if (next.has(task.id)) next.delete(task.id);
                      else next.add(task.id);
                      return next;
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    flagged.has(task.id)
                      ? 'border-[#f3a43a]/50 bg-[#f3a43a]/10 text-[#f3a43a]'
                      : 'border-[#263248] text-[#8592ad] hover:text-[#d2d7e3]'
                  }`}
                >
                  <Flag size={13} /> {flagged.has(task.id) ? say('Flagged for review', 'معلَّم للمراجعة') : say('Flag for review', 'تعليم للمراجعة')}
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={taskIndex === 0}
                    leftIcon={<ChevronLeft size={15} className="rtl-flip" />}
                    onClick={() => setTaskIndex((i) => Math.max(0, i - 1))}
                  >
                    {say('Previous', 'السابق')}
                  </Button>
                  <Button
                    size="sm"
                    variant={taskIndex === section.tasks.length - 1 ? 'outline' : 'primary'}
                    disabled={taskIndex === section.tasks.length - 1}
                    rightIcon={<ChevronRight size={15} className="rtl-flip" />}
                    onClick={() => setTaskIndex((i) => Math.min(section.tasks.length - 1, i + 1))}
                  >
                    {say('Next', 'التالي')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Every question of the section, to jump between */}
            <div className="mt-4 rounded-2xl border border-[#263248] bg-[#121a2a] p-4">
              <div className="flex flex-wrap gap-1.5">
                {section.tasks.map((t, i) => {
                  const current = i === taskIndex;
                  const marked = flagged.has(t.id);
                  const filled = isAnswered(answers.get(t.id));
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-current={current ? 'step' : undefined}
                      aria-label={`${say('Question', 'السؤال')} ${i + 1}`}
                      onClick={() => setTaskIndex(i)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                        current ? 'ring-2 ring-[#00a859] ring-offset-2 ring-offset-[#121a2a]' : ''
                      } ${
                        marked
                          ? 'border-[#f3a43a]/50 bg-[#f3a43a]/15 text-[#f3a43a]'
                          : filled
                            ? 'border-[#00a859]/40 bg-[#00a859]/15 text-[#00a859]'
                            : 'border-[#263248] bg-[#0d1117] text-[#8592ad]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-[#8592ad]">
                {say('Green is answered, amber is flagged for review.', 'الأخضر مُجاب، والكهرماني معلَّم للمراجعة.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-5">
              <Environment section={section} lang={lang} say={say} />
              <div className="mt-5 border-t border-[#263248] pt-4">
                {reported ? (
                  <p className="flex items-center gap-2 text-xs text-[#00a859]">
                    <Check size={14} /> {say('Reported. An admin will look at it.', 'تم الإبلاغ. سيراجعه أحد المشرفين.')}
                  </p>
                ) : reporting ? (
                  <div className="space-y-2">
                    <textarea
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      rows={2}
                      dir="auto"
                      maxLength={1000}
                      placeholder={say('What is wrong? e.g. the target does not answer on port 80', 'ما المشكلة؟ مثل: الهدف لا يستجيب على المنفذ 80')}
                      className="w-full rounded-lg border border-[#263248] bg-[#0d1117] px-3 py-2 text-sm text-[#f3f6ff] placeholder:text-[#6e7a94] focus:border-[#00a859]/60 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={reportNote.trim().length < 3} onClick={sendReport}>
                        {say('Send report', 'إرسال البلاغ')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReporting(false)}>
                        {say('Cancel', 'إلغاء')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReporting(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8592ad] hover:text-[#f3a43a]"
                  >
                    <AlertTriangle size={13} /> {say('Report a problem with the target or a file', 'الإبلاغ عن مشكلة في الهدف أو ملف')}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {section.tasks.map((t, i) => (
                <div key={t.id} className="rounded-2xl border border-[#263248] bg-[#121a2a] p-4 sm:p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="min-w-0 whitespace-pre-line break-words text-sm font-semibold leading-relaxed text-[#f3f6ff]">
                      <span className="me-2 text-[#8592ad]" dir="ltr">
                        {i + 1}.
                      </span>
                      <span dir="auto">{t.prompt}</span>
                    </p>
                    <span className="flex-shrink-0 text-[11px] text-[#8592ad]">
                      <span dir="ltr">{t.points}</span> {say(t.points === 1 ? 'pt' : 'pts', 'نقطة')}
                    </span>
                  </div>
                  <TaskInput task={t} value={answers.get(t.id)} onChange={(v) => setAnswer(t.id, v)} say={say} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-[#6e7a94]">
          <span dir="ltr">
            {answeredCount}/{allTasks.length}
          </span>{' '}
          {say('answered. Nothing is marked until you submit.', 'مُجاب. لا يُصحَّح شيء قبل الإرسال.')}
        </p>
      </div>
    </Shell>
  );
};

/* ── The result ── */

const Result: React.FC<{
  pathId: string;
  result: ExamResult;
  status: ExamStatus | null;
  onBack: () => void;
}> = ({ pathId, result, status, onBack }) => {
  const { isArabic } = useLang();
  const say: Say = (en, ar) => (isArabic ? ar : en);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.certificateName || user?.displayName || '');
  const hasUniversity = !!user?.university && user.university !== NOT_ENROLLED;
  const [showUniversity, setShowUniversity] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const certificate = status?.certificate ?? null;
  const claimable = result.passed && !certificate && (status ? status.claimable : true) && status?.exam.certificate !== false;
  const cleanName = cleanCertificateName(name);

  const claim = async () => {
    if (!cleanName) {
      setClaimError(say('Enter your name as it should be printed: letters only, 2 to 80 characters.', 'اكتب اسمك كما يجب أن يُطبع: أحرف فقط، من 2 إلى 80 حرفًا.'));
      return;
    }
    setClaiming(true);
    setClaimError('');
    try {
      const { certificate: issued } = await claimCertificate(pathId, cleanName, showUniversity);
      navigate(`/certificates/${issued.code}`);
    } catch (err) {
      setClaiming(false);
      setClaimError(err instanceof Error ? err.message : say('Could not issue the certificate.', 'تعذّر إصدار الشهادة.'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-6 sm:p-8">
        <p className={`inline-flex items-center gap-2 text-sm font-bold ${result.passed ? 'text-[#00a859]' : 'text-[#f3a43a]'}`}>
          {result.passed ? <BadgeCheck size={18} /> : <XCircle size={18} />}
          {result.passed
            ? result.distinction
              ? say('Passed with distinction', 'نجاح بامتياز')
              : say('Passed', 'ناجح')
            : say('Not passed this time', 'لم تنجح هذه المرة')}
        </p>
        <p className="mt-3 text-5xl font-black leading-none text-[#f3f6ff]" dir="ltr">
          {result.percent}%
        </p>
        <p className="mt-2 text-sm text-[#9aa5bf]">
          <span dir="ltr">
            {result.earned}/{result.total}
          </span>{' '}
          {say('points. The pass mark is', 'نقطة. درجة النجاح')} <span dir="ltr">{result.passPercent}%</span>.
          {result.timedOut && <> {say('Time ran out, and what had been saved was marked.', 'انتهى الوقت، وصُحِّح ما كان محفوظًا.')}</>}
        </p>

        {result.review.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-bold text-[#f3f6ff]">
              {result.passed ? say('Worth going back over', 'يستحق المراجعة') : say('Go back over these before your next attempt', 'راجع هذه قبل محاولتك التالية')}
            </p>
            <ul className="divide-y divide-[#263248] rounded-xl border border-[#263248]">
              {result.review.map((step) => (
                <li key={step.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[#d2d7e3]">
                  <span className="min-w-0 truncate" dir="auto">
                    {step.title || say('A step of the path', 'خطوة من المسار')}
                  </span>
                  <span className="flex-shrink-0 text-xs text-[#8592ad]" dir="ltr">
                    {step.earned}/{step.total}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[#8592ad]">
              {say('Which answers were right is not shown, so that the exam stays an exam.', 'لا تُعرض الإجابات الصحيحة، ليبقى الاختبار اختبارًا.')}
            </p>
          </div>
        )}

        {certificate ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button leftIcon={<Award size={16} />} onClick={() => navigate(`/certificates/${certificate.code}`)}>
              {say('View your certificate', 'عرض شهادتك')}
            </Button>
            <Button variant="outline" onClick={onBack}>
              {say('Back to the path', 'العودة إلى المسار')}
            </Button>
          </div>
        ) : claimable ? (
          <div className="mt-6 rounded-xl border border-[#9fef00]/30 bg-[#9fef00]/[0.05] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
              <Award size={16} className="text-[#9fef00]" /> {say('Claim your certificate of achievement', 'اطلب شهادة الإنجاز')}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#9aa5bf]">
              {say(
                'It is printed with the name below and gets a public page: anyone you give the link to can see your name, this path, and that the certificate is real.',
                'تُطبع بالاسم أدناه ولها صفحة عامة: كل من تعطيه الرابط يرى اسمك وهذا المسار وأن الشهادة حقيقية.'
              )}
            </p>
            <label className="mt-4 block text-xs font-semibold text-[#9aa5bf]" htmlFor="cert-name">
              {say('Name on the certificate', 'الاسم على الشهادة')}
            </label>
            <input
              id="cert-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setClaimError('');
              }}
              dir="auto"
              maxLength={80}
              autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-[#263248] bg-[#0d1117] px-4 py-3 text-sm text-[#f3f6ff] focus:border-[#00a859]/60 focus:outline-none"
            />
            <p className="mt-1.5 text-[11px] text-[#8592ad]">
              {say('Printed exactly as written. Changing it later takes a message to support.', 'يُطبع كما كُتب تمامًا. تغييره لاحقًا يحتاج إلى مراسلة الدعم.')}
            </p>
            {hasUniversity && (
              <label className="mt-3 flex items-center gap-2.5 text-xs text-[#d2d7e3]">
                <input type="checkbox" checked={showUniversity} onChange={(e) => setShowUniversity(e.target.checked)} className="accent-[#00a859]" />
                <span>
                  {say('Print my university under my name:', 'اطبع جامعتي تحت اسمي:')} <span dir="auto">{user!.university}</span>
                </span>
              </label>
            )}
            {claimError && (
              <p role="alert" className="mt-3 text-xs text-red-400">
                {claimError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={claim} isLoading={claiming} leftIcon={<Award size={15} />}>
                {say('Claim certificate', 'طلب الشهادة')}
              </Button>
              <Button variant="ghost" onClick={onBack}>
                {say('Later', 'لاحقًا')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant={result.passed ? 'primary' : 'outline'} onClick={onBack}>
              {say('Back to the path', 'العودة إلى المسار')}
            </Button>
            {!result.passed && status?.retryAt && (
              <p className="text-xs text-[#8592ad]">
                {say('You can sit it again from', 'يمكنك إعادته ابتداءً من')} {when(status.retryAt, isArabic)}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── The page ── */

const PathExamPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, isArabic } = useLang();
  const say: Say = (en, ar) => (isArabic ? ar : en);

  const path = getPublishedPathBySlug(slug || '');
  const pathId = path?.id ?? '';
  const title = path ? path.title[lang] || path.title.en : '';
  const back = useCallback(() => navigate(`/paths/${slug}`), [navigate, slug]);

  const [status, setStatus] = useState<ExamStatus | null>(null);
  const [loadError, setLoadError] = useState<'none' | 'no-exam' | 'plan' | 'failed'>('none');
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const load = useCallback(async () => {
    if (!pathId) return;
    setLoadError('none');
    try {
      const next = await fetchExamStatus(pathId);
      setStatus(next);
      // An attempt already running is picked straight back up.
      if (next.state === 'active') {
        const { attempt: running } = await fetchAttempt(pathId);
        setAttempt(running);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setLoadError('no-exam');
      else if (err instanceof ApiError && err.body.code === 'SUBSCRIPTION_REQUIRED') setLoadError('plan');
      else setLoadError('failed');
    }
  }, [pathId]);
  useEffect(() => {
    void load();
  }, [load]);

  const begin = async () => {
    setStarting(true);
    setStartError('');
    try {
      const { attempt: started } = await startExam(pathId);
      setAttempt(started);
    } catch (err) {
      setStartError(
        err instanceof ApiError && err.status === 409
          ? say('This exam cannot be started right now.', 'لا يمكن بدء هذا الاختبار الآن.')
          : say('Could not start the exam. Check your connection and try again.', 'تعذّر بدء الاختبار. تحقق من اتصالك وحاول مجددًا.')
      );
      void load();
    } finally {
      setStarting(false);
    }
  };

  const leave = async () => {
    const ok = await confirmDialog({
      title: say('Leave the exam?', 'مغادرة الاختبار؟'),
      message: say(
        'Your answers are saved and the clock keeps running. You can come back while there is time left.',
        'إجاباتك محفوظة والوقت يستمر. يمكنك العودة ما دام هناك وقت.'
      ),
      confirmLabel: say('Leave', 'مغادرة'),
    });
    if (ok) back();
  };

  if (!path) {
    return (
      <Shell title={say('Final exam', 'الاختبار النهائي')} onBack={() => navigate('/paths')} backLabel={say('Paths', 'المسارات')}>
        <p className="py-24 text-center text-sm text-[#8592ad]">{say('This path was not found.', 'لم يُعثر على هذا المسار.')}</p>
      </Shell>
    );
  }

  if (attempt && !result) {
    return (
      <Paper
        pathId={pathId}
        title={title}
        attempt={attempt}
        onLeave={leave}
        onDone={(r) => {
          setResult(r);
          setAttempt(null);
          // The standing has changed: whether a certificate is waiting, and when a retake opens.
          fetchExamStatus(pathId)
            .then(setStatus)
            .catch(() => undefined);
        }}
      />
    );
  }

  const shown = result ?? (status?.state === 'passed' ? status.passed : null);
  const backLabel = say('Back to the path', 'العودة إلى المسار');

  if (shown) {
    return (
      <Shell title={title} onBack={back} backLabel={backLabel}>
        <Result pathId={pathId} result={shown} status={status} onBack={back} />
      </Shell>
    );
  }

  if (loadError !== 'none' || !status) {
    return (
      <Shell title={title} onBack={back} backLabel={backLabel}>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          {loadError === 'none' ? (
            <Loader2 size={26} className="animate-spin text-[#00a859]" />
          ) : (
            <>
              <p className="max-w-sm text-sm text-[#9aa5bf]">
                {loadError === 'no-exam'
                  ? say('This path has no final exam.', 'ليس لهذا المسار اختبار نهائي.')
                  : loadError === 'plan'
                    ? say('Your plan does not include this path.', 'خطتك لا تشمل هذا المسار.')
                    : say('Could not load the exam. Check your connection.', 'تعذّر تحميل الاختبار. تحقق من اتصالك.')}
              </p>
              {loadError === 'failed' && (
                <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => void load()}>
                  {say('Try again', 'إعادة المحاولة')}
                </Button>
              )}
            </>
          )}
        </div>
      </Shell>
    );
  }

  /* ── The rules ── */
  const { exam, state } = status;
  const rules = exam.rules[lang] || exam.rules.en || exam.rules.ar;

  const blocked: Record<Exclude<ExamStatus['state'], 'ready' | 'active' | 'passed'>, { icon: React.ElementType; text: string }> = {
    locked: {
      icon: Lock,
      text: say(
        `Finish every step of the path to unlock the exam. ${status.path.done} of ${status.path.available} done.`,
        `أكمل كل خطوات المسار لفتح الاختبار. أُنجز ${status.path.done} من ${status.path.available}.`
      ),
    },
    author: {
      icon: UserIcon,
      text: say(
        'You wrote this exam, or it is shared with you, so you can see its answers. It cannot be sat from this account.',
        'أنت كاتب هذا الاختبار أو مشارَك معك، فتستطيع رؤية إجاباته. لا يمكن أداؤه من هذا الحساب.'
      ),
    },
    paused: {
      icon: Hourglass,
      text: say('The exam is temporarily unavailable. Check back soon.', 'الاختبار غير متاح مؤقتًا. عُد قريبًا.'),
    },
    'not-open': {
      icon: Hourglass,
      text: exam.opensAt ? `${say('The exam opens on', 'يُفتح الاختبار في')} ${when(exam.opensAt, isArabic)}.` : '',
    },
    closed: { icon: Lock, text: say('The exam window has closed.', 'انتهت فترة الاختبار.') },
    exhausted: {
      icon: Lock,
      text: say('You have used every attempt this exam allows.', 'استنفدت كل المحاولات المسموحة لهذا الاختبار.'),
    },
    cooldown: {
      icon: Hourglass,
      text: status.retryAt ? `${say('You can sit it again from', 'يمكنك إعادته ابتداءً من')} ${when(status.retryAt, isArabic)}.` : '',
    },
  };
  const block = state === 'ready' ? null : blocked[state as keyof typeof blocked];

  return (
    <Shell title={title} onBack={back} backLabel={backLabel}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-[#263248] bg-[#121a2a] p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00a859]">
            <ShieldCheck size={15} /> {say('Final exam', 'الاختبار النهائي')}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-[#f3f6ff]" dir="auto">
            {title}
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={ListChecks} label={say('Tasks', 'المهام')} value={<span dir="ltr">{exam.tasks}</span>} />
            <Fact icon={Clock} label={say('Time limit', 'المدة')} value={span(exam.minutes, say)} />
            <Fact icon={Percent} label={say('To pass', 'للنجاح')} value={<span dir="ltr">{exam.passPercent}%</span>} />
            <Fact
              icon={RefreshCw}
              label={say('Retake after', 'الإعادة بعد')}
              value={exam.cooldownHours > 0 ? span(exam.cooldownHours * 60, say) : say('No wait', 'بلا انتظار')}
            />
          </div>

          <ul className="mt-6 space-y-3">
            <RuleLine icon={Clock}>
              {say(
                'The clock starts when you press Start and keeps running if you close the page. Your answers are saved as you go.',
                'يبدأ الوقت عند الضغط على «ابدأ» ويستمر حتى لو أغلقت الصفحة. تُحفظ إجاباتك أولًا بأول.'
              )}
            </RuleLine>
            <RuleLine icon={EyeOff}>
              {say(
                'Nothing is marked until you submit. You then see your score and what to go back over, not which answers were right.',
                'لا يُصحَّح شيء قبل الإرسال. بعدها ترى درجتك وما يستحق المراجعة، لا الإجابات الصحيحة.'
              )}
            </RuleLine>
            <RuleLine icon={UserIcon}>
              {say(
                'Your own work only. Notes and documentation are allowed; other people, and sharing questions or answers, are not.',
                'عملك أنت فقط. يُسمح بالملاحظات والتوثيق، ولا يُسمح بمساعدة الآخرين ولا بمشاركة الأسئلة أو الإجابات.'
              )}
            </RuleLine>
            {exam.practical && (
              <RuleLine icon={Crosshair}>
                {say(
                  'The practical part gives you an address to work against. Attack that address only, only during your attempt, with no denial of service, and leave it working for the next person.',
                  'الجزء العملي يعطيك عنوانًا تعمل عليه. هاجم ذلك العنوان فقط، وفقط أثناء محاولتك، بلا هجمات حجب خدمة، واتركه يعمل لمن يأتي بعدك.'
                )}
              </RuleLine>
            )}
            {exam.maxAttempts !== null && (
              <RuleLine icon={ListChecks}>
                {say(
                  `This exam allows ${exam.maxAttempts} attempts. You have used ${status.attemptsUsed}.`,
                  `يسمح هذا الاختبار بـ ${exam.maxAttempts} محاولات. استخدمت ${status.attemptsUsed}.`
                )}
              </RuleLine>
            )}
            {exam.certificate && (
              <RuleLine icon={Award}>
                {say('Pass it and you can claim a certificate of achievement.', 'انجح فيه لتتمكن من طلب شهادة الإنجاز.')}
              </RuleLine>
            )}
          </ul>

          {rules.trim() && (
            <div className="mt-6 rounded-xl border border-[#263248] bg-[#0d1117] p-4" dir={lang === 'ar' && exam.rules.ar ? 'rtl' : 'ltr'}>
              <LessonMarkdown content={rules} />
            </div>
          )}

          {status.last && !status.last.passed && (
            <p className="mt-6 rounded-xl border border-[#263248] bg-[#0d1117] px-4 py-3 text-sm text-[#9aa5bf]">
              {say('Your last attempt scored', 'درجة محاولتك الأخيرة')} <span className="font-bold text-[#f3f6ff]" dir="ltr">{status.last.percent}%</span>.
            </p>
          )}

          {block ? (
            <p className="mt-6 flex items-start gap-3 rounded-xl border border-[#f3a43a]/30 bg-[#f3a43a]/[0.06] px-4 py-3 text-sm text-[#d2d7e3]">
              <block.icon size={17} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" /> {block.text}
            </p>
          ) : null}

          {startError && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {startError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {state === 'ready' && (
              <Button size="lg" onClick={begin} isLoading={starting} leftIcon={<ShieldCheck size={16} />}>
                {say('Start exam', 'ابدأ الاختبار')}
              </Button>
            )}
            <Button variant="outline" size={state === 'ready' ? 'lg' : 'md'} onClick={back}>
              {backLabel}
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default PathExamPage;
