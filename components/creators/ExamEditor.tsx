import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  Crosshair,
  Flag,
  Keyboard,
  ListChecks,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import BilingualMarkdown from './BilingualMarkdown';
import LabFileUploader from './LabFileUploader';
import { useLang } from '../../contexts/LangContext';
import type { PathStep } from '../../services/creatorTypes';
import {
  EXAM_LIMITS,
  badTargetAddress,
  cleanExam,
  examInfoOf,
  examUid,
  newExamSection,
  newExamTask,
  newExamVersion,
  type ExamSection,
  type ExamSectionKind,
  type ExamTask,
  type ExamTaskKind,
  type ExamVersion,
  type PathExam,
} from '../../services/examService';

/* ─── The final exam, in the path's settings ───
 *
 * An exam is built from sections. A theory section is a bank of questions,
 * dealt in a new order (and, if it draws, a new selection) to every attempt.
 * A practical section is a scenario: a brief in markdown, the address of
 * something to work against, files to work from, and the tasks answered from
 * them. It can be written in several versions, and each attempt gets one.
 *
 * Nothing here runs a lab. A target is an address somebody typed in, and only
 * an admin can type it: a learner is told to attack whatever it says.
 */

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';
const labelCls = 'block text-xs font-semibold text-[#9aa5bf] mb-1.5';
const hintCls = 'text-[11px] leading-relaxed text-[#7c8aa6]';
const iconBtn =
  'w-7 h-7 flex items-center justify-center rounded text-[#7c8aa6] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all disabled:opacity-20 disabled:hover:bg-transparent';
const addBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#263248] bg-[#0d1420] px-3 py-2 text-xs font-medium text-[#8592ad] transition-all hover:border-[#00a859]/40 hover:text-[#00a859]';

type Say = (en: string, ar: string) => string;

export const Switch: React.FC<{ on: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }> = ({
  on,
  onChange,
  label,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    dir="ltr"
    className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
      on ? 'border-[#00a859]/60 bg-[#00a859]/30' : 'border-[#263248] bg-[#0a0f18]'
    }`}
  >
    <span
      className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all ${
        on ? 'left-[22px] bg-[#00a859]' : 'left-0.5 bg-[#4d5a73]'
      }`}
    />
  </button>
);

/** A whole number field that may be left empty. */
const NumberField: React.FC<{
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, min, max, placeholder, className = '' }) => (
  <input
    type="number"
    dir="ltr"
    min={min}
    max={max}
    step={1}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e) => {
      const raw = e.target.value;
      onChange(raw === '' ? undefined : Math.max(0, Math.round(Number(raw))));
    }}
    className={`${inputCls} ${className}`}
  />
);

const toLocalInput = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/* ── One task ── */

const TASK_KINDS: { value: ExamTaskKind; en: string; ar: string; icon: React.ElementType }[] = [
  { value: 'mcq', en: 'Multiple choice', ar: 'اختيار من متعدد', icon: ListChecks },
  { value: 'text', en: 'Written answer', ar: 'إجابة مكتوبة', icon: Keyboard },
  { value: 'flag', en: 'Flag', ar: 'علم', icon: Flag },
];

const TaskEditor: React.FC<{
  task: ExamTask;
  index: number;
  steps: PathStep[];
  say: Say;
  onChange: (task: ExamTask) => void;
  onRemove: () => void;
}> = ({ task, index, steps, say, onChange, onRemove }) => {
  const options = task.options ?? [];
  const patch = (p: Partial<ExamTask>) => onChange({ ...task, ...p });

  return (
    <div className="rounded-lg border border-[#263248] bg-[#0d1117] p-3.5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="w-6 flex-shrink-0 text-[11px] font-bold text-[#8592ad]" dir="ltr">
          {index + 1}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {TASK_KINDS.map(({ value, en, ar, icon: KindIcon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={task.kind === value}
              onClick={() => patch({ kind: value })}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                task.kind === value
                  ? 'border-[#00a859]/45 bg-[#00a859]/10 text-[#00a859]'
                  : 'border-[#263248] bg-[#0a0f18] text-[#7c8aa6] hover:text-[#9aa5bf]'
              }`}
            >
              <KindIcon size={12} /> {say(en, ar)}
            </button>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8592ad]">
            {say('Points', 'النقاط')}
            <NumberField
              value={task.points}
              onChange={(v) => patch({ points: Math.min(EXAM_LIMITS.points, Math.max(1, v ?? 1)) })}
              min={1}
              max={EXAM_LIMITS.points}
              className="!w-16 !px-2 !py-1 text-center"
            />
          </label>
          <button type="button" onClick={onRemove} className={`${iconBtn} hover:!text-red-400`} title={say('Remove task', 'حذف المهمة')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <textarea
        value={task.prompt}
        onChange={(e) => patch({ prompt: e.target.value })}
        rows={2}
        dir="auto"
        maxLength={EXAM_LIMITS.prompt}
        placeholder={
          task.kind === 'flag'
            ? say('What to bring back, e.g. The flag in /root/root.txt', 'ما المطلوب إحضاره، مثل: العلم الموجود في ‎/root/root.txt')
            : say('The question…', 'نص السؤال…')
        }
        className={`${inputCls} resize-y`}
      />

      <div className="mt-2.5 space-y-1.5">
        {task.kind === 'mcq' ? (
          <>
            {options.map((option, oi) => {
              const correct = oi === (task.correctIndex ?? 0);
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ correctIndex: oi })}
                    title={correct ? say('Correct answer', 'الإجابة الصحيحة') : say('Mark as correct', 'تحديد إجابة صحيحة')}
                    className={`flex-shrink-0 transition-colors ${correct ? 'text-[#00a859]' : 'text-[#7c8aa6] hover:text-[#9aa5bf]'}`}
                  >
                    {correct ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <input
                    value={option}
                    onChange={(e) => patch({ options: options.map((o, j) => (j === oi ? e.target.value : o)) })}
                    placeholder={say(`Option ${oi + 1}`, `الخيار ${oi + 1}`)}
                    dir="auto"
                    maxLength={EXAM_LIMITS.option}
                    className={`${inputCls} flex-1 ${correct ? 'border-[#00a859]/40' : ''}`}
                  />
                  <button
                    type="button"
                    disabled={options.length <= 2}
                    onClick={() => {
                      const current = task.correctIndex ?? 0;
                      patch({
                        options: options.filter((_, j) => j !== oi),
                        correctIndex: oi === current ? 0 : oi < current ? current - 1 : current,
                      });
                    }}
                    className={`${iconBtn} hover:!text-red-400`}
                    title={say('Remove option', 'حذف الخيار')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {options.length < EXAM_LIMITS.options && (
              <button
                type="button"
                onClick={() => patch({ options: [...options, ''] })}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#8592ad] transition-colors hover:text-[#00a859]"
              >
                <Plus size={12} /> {say('Add option', 'إضافة خيار')}
              </button>
            )}
          </>
        ) : (
          <>
            <input
              value={task.answer ?? ''}
              onChange={(e) => patch({ answer: e.target.value })}
              placeholder={task.kind === 'flag' ? 'khana{...}' : say('The answer, e.g. 4624', 'الإجابة، مثل: 4624')}
              dir={task.kind === 'flag' ? 'ltr' : 'auto'}
              maxLength={EXAM_LIMITS.answer}
              className={`${inputCls} ${task.kind === 'flag' ? 'font-mono' : ''} ${task.answer?.trim() ? 'border-[#00a859]/40' : ''}`}
            />
            {task.kind === 'flag' ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-[11px] text-[#9aa5bf]">
                  <input
                    type="checkbox"
                    checked={task.caseSensitive === true}
                    onChange={(e) => patch({ caseSensitive: e.target.checked })}
                    className="accent-[#00a859]"
                  />
                  {say('Case matters', 'حالة الأحرف مهمة')}
                </label>
                <input
                  value={task.placeholder ?? ''}
                  onChange={(e) => patch({ placeholder: e.target.value })}
                  placeholder={say('Hint in the empty box (optional)', 'تلميح في الخانة الفارغة (اختياري)')}
                  dir="auto"
                  maxLength={120}
                  className={`${inputCls} min-w-[12rem] flex-1 !py-1.5 text-xs`}
                />
              </div>
            ) : (
              <p className={hintCls}>
                {say(
                  'Marked ignoring case and extra spaces. No hint about its length is shown in an exam.',
                  'تُصحَّح دون اعتبار حالة الأحرف أو المسافات الزائدة. لا يظهر أي تلميح عن طولها في الاختبار.'
                )}
              </p>
            )}
          </>
        )}
      </div>

      {steps.length > 0 && (
        <label className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#8592ad]">
          {say('Examines', 'يختبر')}
          <select
            value={task.stepKey ?? ''}
            onChange={(e) => patch({ stepKey: e.target.value || undefined })}
            className={`${inputCls} !w-auto min-w-[10rem] max-w-full flex-1 !py-1 text-xs`}
          >
            <option value="">{say('No step in particular', 'لا خطوة بعينها')}</option>
            {steps.map((step) => (
              <option key={`${step.kind}:${step.refId}`} value={`${step.kind}:${step.refId}`}>
                {step.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

/* ── One version of a section ── */

const VersionEditor: React.FC<{
  version: ExamVersion;
  kind: ExamSectionKind;
  steps: PathStep[];
  isAdmin: boolean;
  say: Say;
  mdLang: 'en' | 'ar';
  onMdLang: (lang: 'en' | 'ar') => void;
  onChange: (version: ExamVersion) => void;
}> = ({ version, kind, steps, isAdmin, say, mdLang, onMdLang, onChange }) => {
  const patch = (p: Partial<ExamVersion>) => onChange({ ...version, ...p });
  const addTask = (taskKind: ExamTaskKind) => patch({ tasks: [...version.tasks, newExamTask(taskKind)] });

  return (
    <div className="space-y-5">
      {kind === 'practical' && (
        <>
          <div>
            <span className={labelCls}>{say('The brief', 'الموجز')}</span>
            <p className={`${hintCls} mb-2`}>
              {say(
                'The scenario, the scope and the rules of engagement, in markdown. Shown once the attempt starts.',
                'السيناريو والنطاق وقواعد الاشتباك بصيغة ماركداون. يظهر بعد بدء المحاولة.'
              )}
            </p>
            <BilingualMarkdown value={version.brief} onChange={(brief) => patch({ brief })} lang={mdLang} onLangChange={onMdLang} />
          </div>

          <div>
            <span className={labelCls}>{say('Targets', 'الأهداف')}</span>
            <p className={`${hintCls} mb-2`}>
              {say(
                'What the learner works against: an IP address, a range like 10.10.20.0/24, or a hostname. The Academy shows it and never connects to it.',
                'ما يعمل عليه المتعلم: عنوان IP أو نطاق مثل ‎10.10.20.0/24 أو اسم نطاق. تعرضه الأكاديمية ولا تتصل به أبدًا.'
              )}
            </p>
            {!isAdmin && (
              <p className="mb-2 flex items-center gap-2 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 text-xs text-[#9aa5bf]">
                <Lock size={13} className="flex-shrink-0 text-[#8592ad]" />
                {say('Only an admin can set or change a target address.', 'تحديد عنوان الهدف أو تغييره متاح للمشرفين فقط.')}
              </p>
            )}
            <div className="space-y-2">
              {version.targets.map((target, ti) => {
                const bad = badTargetAddress(target.address);
                const setTarget = (p: Partial<typeof target>) =>
                  patch({ targets: version.targets.map((t, j) => (j === ti ? { ...t, ...p } : t)), targetsConfirmed: false });
                return (
                  <div key={target.id} className="flex flex-wrap items-start gap-2">
                    <input
                      value={target.label}
                      disabled={!isAdmin}
                      onChange={(e) => setTarget({ label: e.target.value })}
                      placeholder={say('Label, e.g. Web server', 'التسمية، مثل: خادم الويب')}
                      dir="auto"
                      maxLength={EXAM_LIMITS.label}
                      className={`${inputCls} min-w-[9rem] flex-1 disabled:opacity-60`}
                    />
                    <div className="min-w-[11rem] flex-1">
                      <input
                        value={target.address}
                        disabled={!isAdmin}
                        onChange={(e) => setTarget({ address: e.target.value })}
                        placeholder="10.10.20.5"
                        dir="ltr"
                        spellCheck={false}
                        className={`${inputCls} font-mono disabled:opacity-60 ${bad ? '!border-red-500/60' : ''}`}
                      />
                      {bad && (
                        <p className="mt-1 text-[11px] text-red-400">
                          {say('Not an IP address or a hostname.', 'ليس عنوان IP ولا اسم نطاق.')}
                        </p>
                      )}
                    </div>
                    <NumberField
                      value={target.port}
                      onChange={(port) => setTarget({ port: port ? Math.min(65535, port) : undefined })}
                      min={1}
                      max={65535}
                      placeholder={say('Port', 'المنفذ')}
                      className={`!w-24 font-mono ${isAdmin ? '' : 'pointer-events-none opacity-60'}`}
                    />
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => patch({ targets: version.targets.filter((_, j) => j !== ti) })}
                      className={`${iconBtn} mt-1 hover:!text-red-400`}
                      title={say('Remove target', 'حذف الهدف')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
            {isAdmin && version.targets.length < EXAM_LIMITS.targets && (
              <button
                type="button"
                onClick={() =>
                  patch({ targets: [...version.targets, { id: examUid('tgt'), label: '', address: '' }], targetsConfirmed: false })
                }
                className={`${addBtn} mt-2`}
              >
                <Plus size={13} /> {say('Add a target', 'إضافة هدف')}
              </button>
            )}
            {version.targets.some((t) => t.address.trim()) && (
              <label
                className={`mt-3 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${
                  version.targetsConfirmed
                    ? 'border-[#00a859]/30 bg-[#00a859]/[0.06] text-[#d2d7e3]'
                    : 'border-[#f3a43a]/40 bg-[#f3a43a]/[0.07] text-[#d2d7e3]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={version.targetsConfirmed === true}
                  disabled={!isAdmin}
                  onChange={(e) => patch({ targetsConfirmed: e.target.checked })}
                  className="mt-0.5 accent-[#00a859]"
                />
                <span>
                  {say(
                    'CyberKhana controls these addresses, or has permission to have them tested. Learners will be told to attack exactly what is written here, so check each one.',
                    'هذه العناوين تحت سيطرة سايبرخانة، أو لديها إذن باختبارها. سيُطلب من المتعلمين مهاجمة المكتوب هنا تمامًا، فتحقق من كل عنوان.'
                  )}
                </span>
              </label>
            )}
          </div>

          <div>
            <span className={labelCls}>{say('Links', 'الروابط')}</span>
            <div className="space-y-2">
              {version.links.map((link, li) => (
                <div key={link.id} className="flex flex-wrap items-center gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => patch({ links: version.links.map((l, j) => (j === li ? { ...l, label: e.target.value } : l)) })}
                    placeholder={say('Label, e.g. VPN guide', 'التسمية، مثل: دليل VPN')}
                    dir="auto"
                    maxLength={EXAM_LIMITS.label}
                    className={`${inputCls} min-w-[9rem] flex-1`}
                  />
                  <input
                    value={link.url}
                    onChange={(e) => patch({ links: version.links.map((l, j) => (j === li ? { ...l, url: e.target.value } : l)) })}
                    placeholder="https://"
                    dir="ltr"
                    spellCheck={false}
                    className={`${inputCls} min-w-[12rem] flex-[2]`}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ links: version.links.filter((_, j) => j !== li) })}
                    className={`${iconBtn} hover:!text-red-400`}
                    title={say('Remove link', 'حذف الرابط')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {version.links.length < EXAM_LIMITS.links && (
              <button
                type="button"
                onClick={() => patch({ links: [...version.links, { id: examUid('link'), label: '', url: '' }] })}
                className={`${addBtn} mt-2`}
              >
                <Plus size={13} /> {say('Add a link', 'إضافة رابط')}
              </button>
            )}
          </div>

          <div>
            <span className={labelCls}>{say('Files', 'الملفات')}</span>
            <p className={`${hintCls} mb-2`}>
              {say(
                'Evidence to investigate or what it takes to connect: a capture, logs, a VPN profile. Handed over when the attempt starts.',
                'أدلة للتحقيق أو ما يلزم للاتصال: التقاط حزم أو سجلات أو ملف VPN. تُسلَّم عند بدء المحاولة.'
              )}
            </p>
            <LabFileUploader value={version.files} onChange={(files) => patch({ files })} maxFiles={EXAM_LIMITS.files} />
          </div>
        </>
      )}

      <div>
        <span className={labelCls}>
          {kind === 'theory' ? say('Question bank', 'بنك الأسئلة') : say('Tasks', 'المهام')}{' '}
          <span className="font-normal text-[#7c8aa6]" dir="ltr">
            ({version.tasks.length})
          </span>
        </span>
        <div className="space-y-3">
          {version.tasks.map((task, ti) => (
            <TaskEditor
              key={task.id}
              task={task}
              index={ti}
              steps={steps}
              say={say}
              onChange={(next) => patch({ tasks: version.tasks.map((t, j) => (j === ti ? next : t)) })}
              onRemove={() => patch({ tasks: version.tasks.filter((_, j) => j !== ti) })}
            />
          ))}
        </div>
        {version.tasks.length < EXAM_LIMITS.tasks && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(kind === 'theory' ? (['mcq', 'text'] as const) : (['flag', 'text', 'mcq'] as const)).map((taskKind) => {
              const meta = TASK_KINDS.find((k) => k.value === taskKind)!;
              return (
                <button key={taskKind} type="button" onClick={() => addTask(taskKind)} className={addBtn}>
                  <Plus size={13} /> {say(meta.en, meta.ar)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── One section ── */

const versionName = (index: number) => String.fromCharCode(65 + index);

const SectionEditor: React.FC<{
  section: ExamSection;
  index: number;
  count: number;
  open: boolean;
  steps: PathStep[];
  isAdmin: boolean;
  say: Say;
  mdLang: 'en' | 'ar';
  onMdLang: (lang: 'en' | 'ar') => void;
  onToggle: () => void;
  onChange: (section: ExamSection) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ section, index, count, open, steps, isAdmin, say, mdLang, onMdLang, onToggle, onChange, onMove, onRemove }) => {
  const [versionIndex, setVersionIndex] = useState(0);
  const current = Math.min(versionIndex, section.versions.length - 1);
  const version = section.versions[current];
  const practical = section.kind === 'practical';
  const KindIcon = practical ? Crosshair : BookOpen;
  const accent = practical ? '#f3a43a' : '#60a5fa';
  const bank = version?.tasks.length ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[#263248] bg-[#0b1019]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={onToggle} className={iconBtn} aria-expanded={open} title={say('Open or close', 'فتح أو إغلاق')}>
          <ChevronDown size={15} className={`transition-transform ${open ? '' : '-rotate-90 rtl:rotate-90'}`} />
        </button>
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border"
          style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}14` }}
        >
          <KindIcon size={14} />
        </span>
        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder={say('Section title', 'عنوان القسم')}
          dir="auto"
          maxLength={EXAM_LIMITS.label}
          className={`${inputCls} min-w-0 flex-1 !py-1.5 font-semibold`}
        />
        <span className="hidden flex-shrink-0 text-[11px] font-semibold sm:inline" style={{ color: accent }}>
          {practical ? say('Practical', 'عملي') : say('Theory', 'نظري')}
        </span>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={iconBtn} title={say('Move up', 'تحريك للأعلى')}>
            <ArrowUp size={13} />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className={iconBtn} title={say('Move down', 'تحريك للأسفل')}>
            <ArrowDown size={13} />
          </button>
          <button type="button" onClick={onRemove} className={`${iconBtn} hover:!text-red-400`} title={say('Remove section', 'حذف القسم')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && version && (
        <div className="space-y-5 border-t border-[#263248] p-4">
          {practical ? (
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                {section.versions.map((v, vi) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={vi === current}
                    onClick={() => setVersionIndex(vi)}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                      vi === current
                        ? 'border-[#f3a43a]/50 bg-[#f3a43a]/10 text-[#f3a43a]'
                        : 'border-[#263248] bg-[#0a0f18] text-[#8592ad] hover:text-[#d2d7e3]'
                    }`}
                  >
                    {say('Version', 'النسخة')} <span dir="ltr">{versionName(vi)}</span>
                  </button>
                ))}
                {section.versions.length < EXAM_LIMITS.versions && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...section, versions: [...section.versions, newExamVersion()] });
                      setVersionIndex(section.versions.length);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#263248] px-2.5 py-1 text-xs font-medium text-[#8592ad] hover:border-[#00a859]/40 hover:text-[#00a859]"
                  >
                    <Plus size={12} /> {say('Version', 'نسخة')}
                  </button>
                )}
                {section.versions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...section, versions: section.versions.filter((_, vi) => vi !== current) });
                      setVersionIndex(0);
                    }}
                    className="ms-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#8592ad] hover:text-red-400"
                  >
                    <Trash2 size={12} /> {say('Remove this version', 'حذف هذه النسخة')}
                  </button>
                )}
              </div>
              <p className={`${hintCls} mt-2`}>
                {say(
                  'Each attempt is dealt one version at random. Give each its own target and answers, so an answer passed between two learners is likely to be for the wrong one.',
                  'تحصل كل محاولة على نسخة واحدة عشوائيًا. اجعل لكل نسخة هدفها وإجاباتها، حتى تكون الإجابة المتبادلة بين متعلمَين غالبًا لنسخة أخرى.'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[14rem_1fr] sm:items-end">
              <div>
                <label className={labelCls}>{say('Questions dealt per attempt', 'عدد الأسئلة في كل محاولة')}</label>
                <NumberField
                  value={section.drawCount}
                  onChange={(drawCount) => onChange({ ...section, drawCount: drawCount || undefined })}
                  min={1}
                  max={EXAM_LIMITS.tasks}
                  placeholder={say(`All ${bank}`, `الكل (${bank})`)}
                />
              </div>
              <p className={hintCls}>
                {section.drawCount && section.drawCount < bank
                  ? say(
                      `Every attempt gets ${section.drawCount} of the ${bank} questions, chosen and ordered afresh.`,
                      `تحصل كل محاولة على ${section.drawCount} من ${bank} سؤالًا، تُختار وتُرتَّب من جديد.`
                    )
                  : say(
                      'Every attempt gets the whole bank in a new order. Write more questions than you deal, and a retake is not the same paper twice.',
                      'تحصل كل محاولة على البنك كاملًا بترتيب جديد. اكتب أسئلة أكثر مما تعرض، كي لا تكون الإعادة الورقة نفسها مرتين.'
                    )}
              </p>
            </div>
          )}

          <VersionEditor
            key={version.id}
            version={version}
            kind={section.kind}
            steps={steps}
            isAdmin={isAdmin}
            say={say}
            mdLang={mdLang}
            onMdLang={onMdLang}
            onChange={(next) => onChange({ ...section, versions: section.versions.map((v, vi) => (vi === current ? next : v)) })}
          />
        </div>
      )}
    </div>
  );
};

/* ── The exam ── */

interface ExamEditorProps {
  value: PathExam;
  onChange: (exam: PathExam) => void;
  /** The path's steps, for saying which one a task examines. */
  steps: PathStep[];
  isAdmin: boolean;
  /** Why the exam cannot go live as it stands, when it cannot. */
  problem: string | null;
  /** Attempts being sat right now, when known. */
  activeAttempts?: number;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ value: exam, onChange, steps, isAdmin, problem, activeAttempts }) => {
  const { isArabic } = useLang();
  const say: Say = (en, ar) => (isArabic ? ar : en);
  const [mdLang, setMdLang] = useState<'en' | 'ar'>('en');
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const patch = (p: Partial<PathExam>) => onChange({ ...exam, ...p });
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addSection = (kind: ExamSectionKind) => {
    const section = newExamSection(kind);
    section.title = kind === 'theory' ? say('Knowledge check', 'اختبار المعرفة') : say('Practical', 'الجزء العملي');
    patch({ sections: [...exam.sections, section] });
    setOpen((prev) => new Set(prev).add(section.id));
  };
  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= exam.sections.length) return;
    const sections = [...exam.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    patch({ sections });
  };

  const info = examInfoOf(cleanExam({ ...exam, enabled: true }));
  const hours = exam.timeLimitMinutes >= 120 ? Math.round((exam.timeLimitMinutes / 60) * 10) / 10 : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
            <ShieldCheck size={15} className="text-[#00a859]" /> {say('Final exam', 'الاختبار النهائي')}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#8592ad]">
            {say(
              'The last stop of the path. It opens only to someone who has finished every step, is sat against the clock, and is marked on the server. Answers are never sent to a browser.',
              'المحطة الأخيرة في المسار. يُفتح فقط لمن أنهى كل الخطوات، ويُؤدّى ضمن وقت محدد، ويُصحَّح على الخادم. لا تُرسل الإجابات إلى المتصفح أبدًا.'
            )}
          </p>
        </div>
        <Switch on={exam.enabled} onChange={(enabled) => patch({ enabled })} label={say('Final exam', 'الاختبار النهائي')} />
      </div>

      {(exam.enabled || exam.sections.length > 0) && (
        <>
          {/* Settings */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <label className={labelCls}>{say('Pass mark (%)', 'درجة النجاح (%)')}</label>
              <NumberField
                value={exam.passPercent}
                onChange={(v) => patch({ passPercent: v ?? 0 })}
                min={EXAM_LIMITS.passMin}
                max={EXAM_LIMITS.passMax}
              />
            </div>
            <div>
              <label className={labelCls}>{say('Time limit (minutes)', 'المدة (بالدقائق)')}</label>
              <NumberField
                value={exam.timeLimitMinutes}
                onChange={(v) => patch({ timeLimitMinutes: v ?? 0 })}
                min={EXAM_LIMITS.minutesMin}
                max={EXAM_LIMITS.minutesMax}
              />
              {hours !== null && (
                <p className={`${hintCls} mt-1`} dir="ltr">
                  {isArabic ? `${hours} ساعة` : `${hours} hours`}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>{say('Wait before a retake (hours)', 'الانتظار قبل الإعادة (بالساعات)')}</label>
              <NumberField
                value={exam.cooldownHours}
                onChange={(v) => patch({ cooldownHours: v ?? 0 })}
                min={0}
                max={EXAM_LIMITS.cooldownMax}
              />
            </div>
            <div>
              <label className={labelCls}>{say('Attempt cap', 'الحد الأقصى للمحاولات')}</label>
              <NumberField
                value={exam.maxAttempts}
                onChange={(maxAttempts) => patch({ maxAttempts: maxAttempts || undefined })}
                min={1}
                max={EXAM_LIMITS.attemptsMax}
                placeholder={say('No cap', 'بلا حد')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label className={labelCls}>{say('Opens (optional)', 'يُفتح في (اختياري)')}</label>
              <input
                type="datetime-local"
                dir="ltr"
                value={toLocalInput(exam.opensAt)}
                onChange={(e) => patch({ opensAt: fromLocalInput(e.target.value) })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{say('Closes (optional)', 'يُغلق في (اختياري)')}</label>
              <input
                type="datetime-local"
                dir="ltr"
                value={toLocalInput(exam.closesAt)}
                onChange={(e) => patch({ closesAt: fromLocalInput(e.target.value) })}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2">
              <Switch on={exam.paused === true} onChange={(paused) => patch({ paused })} label={say('Paused', 'متوقف مؤقتًا')} />
              <span className="text-xs text-[#d2d7e3]">
                <span className="block font-semibold">{say('Paused', 'متوقف مؤقتًا')}</span>
                <span className="text-[#8592ad]">{say('No new attempts, e.g. while a target is down', 'لا محاولات جديدة، مثلًا أثناء توقف الهدف')}</span>
              </span>
            </label>
          </div>

          {typeof activeAttempts === 'number' && activeAttempts > 0 && (
            <p className="flex items-start gap-2 rounded-lg border border-[#60a5fa]/30 bg-[#60a5fa]/[0.07] px-3 py-2.5 text-xs text-[#d2d7e3]">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
              {say(
                `${activeAttempts} attempt${activeAttempts === 1 ? ' is' : 's are'} in progress. They keep the questions and answers they started with, so an edit here reaches only attempts started after it. If you are changing what a target answers, wait until none are running.`,
                `عدد المحاولات الجارية الآن: ${activeAttempts}. تحتفظ بالأسئلة والإجابات التي بدأت بها، لذا يصل أي تعديل هنا إلى المحاولات التي تبدأ بعده فقط. إن كنت تغيّر إجابات الهدف فانتظر حتى لا تبقى محاولات جارية.`
              )}
            </p>
          )}

          {/* Rules */}
          <div>
            <span className={labelCls}>{say('Exam rules', 'قواعد الاختبار')}</span>
            <p className={`${hintCls} mb-2`}>
              {say(
                'Shown before the clock starts, under the standard rules every exam carries. What is allowed, what is in scope, what to do if something breaks.',
                'تظهر قبل بدء الوقت، تحت القواعد الموحدة لكل اختبار. ما المسموح، وما ضمن النطاق، وما العمل عند حدوث عطل.'
              )}
            </p>
            <BilingualMarkdown value={exam.rules} onChange={(rules) => patch({ rules })} lang={mdLang} onLangChange={setMdLang} />
          </div>

          {/* Sections */}
          <div>
            <span className={labelCls}>{say('Sections', 'الأقسام')}</span>
            <div className="space-y-3">
              {exam.sections.map((section, si) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={si}
                  count={exam.sections.length}
                  open={open.has(section.id)}
                  steps={steps}
                  isAdmin={isAdmin}
                  say={say}
                  mdLang={mdLang}
                  onMdLang={setMdLang}
                  onToggle={() => toggle(section.id)}
                  onChange={(next) => patch({ sections: exam.sections.map((s, j) => (j === si ? next : s)) })}
                  onMove={(dir) => moveSection(si, dir)}
                  onRemove={() => patch({ sections: exam.sections.filter((_, j) => j !== si) })}
                />
              ))}
            </div>
            {exam.sections.length < EXAM_LIMITS.sections && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => addSection('theory')} className={addBtn}>
                  <BookOpen size={13} /> {say('Add a theory section', 'إضافة قسم نظري')}
                </button>
                <button type="button" onClick={() => addSection('practical')} className={addBtn}>
                  <Crosshair size={13} /> {say('Add a practical section', 'إضافة قسم عملي')}
                </button>
              </div>
            )}
          </div>

          {/* What an attempt comes to */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-[#263248] bg-[#0a0f18] px-4 py-3 text-xs text-[#9aa5bf]">
            <span>
              {say('One attempt:', 'المحاولة الواحدة:')}{' '}
              <span className="font-semibold text-[#f3f6ff]" dir="ltr">
                {info?.tasks ?? 0}
              </span>{' '}
              {say('tasks', 'مهمة')}
              {' · '}
              <span className="font-semibold text-[#f3f6ff]" dir="ltr">
                {info?.points ?? 0}
              </span>{' '}
              {say('points', 'نقطة')}
            </span>
            {problem && exam.enabled && (
              <span className="flex items-start gap-1.5 text-[#f3a43a]">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" /> {problem}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamEditor;
