import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, BadgeCheck, ExternalLink, Loader2, RotateCcw, ShieldX, XCircle } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import {
  fetchExamAttempts,
  fetchExamStats,
  voidExamAttempt,
  type ExamAttemptRow,
  type ExamStats,
} from '../../services/examService';
import {
  certificateLink,
  fetchPathCertificates,
  reissueCertificate,
  restoreCertificate,
  revokeCertificate,
  type AdminCertificate,
} from '../../services/certificateService';

/* ─── How a path's exam is going ───
 *
 * For the path's author: figures only. How many sat it, how many passed, and
 * which tasks almost nobody gets right, which is how a broken question shows
 * itself. Who sat it and what they scored is not the author's to see.
 *
 * For an admin, underneath: the sittings and the certificates by name, with
 * the three things only an admin does. Cancel an attempt that should not
 * count, withdraw a certificate, correct the name printed on one.
 */

interface ExamActivityProps {
  pathId: string;
  /** Set when the path is in someone else's bucket (shared, or moderated). */
  ownerId?: string;
  isAdmin: boolean;
  /** Task id to its prompt, to name the tasks the figures point at. */
  prompts: Map<string, string>;
  onStats?: (stats: ExamStats) => void;
}

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 placeholder:text-[#7c8aa6]';
const smallBtn =
  'inline-flex items-center gap-1 rounded-md border border-[#263248] px-2 py-1 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-[#354562] hover:text-[#f3f6ff] disabled:opacity-40';

const Tile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2.5">
    <p className="text-lg font-black leading-none text-[#f3f6ff]" dir="ltr">
      {value}
    </p>
    <p className="mt-1 text-[11px] text-[#8592ad]">{label}</p>
  </div>
);

/** A row's own small form: one line of text, then the action. */
const ReasonForm: React.FC<{
  placeholder: string;
  confirm: string;
  initial?: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}> = ({ placeholder, confirm, initial = '', onSubmit, onCancel }) => {
  const { isArabic } = useLang();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} dir="auto" className={`${inputCls} min-w-[12rem] flex-1`} />
      <button
        type="button"
        disabled={busy || text.trim().length < 2}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await onSubmit(text.trim());
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
          } finally {
            setBusy(false);
          }
        }}
        className={`${smallBtn} !border-[#00a859]/40 !text-[#00a859]`}
      >
        {busy && <Loader2 size={11} className="animate-spin" />} {confirm}
      </button>
      <button type="button" onClick={onCancel} className={smallBtn}>
        {isArabic ? 'إلغاء' : 'Cancel'}
      </button>
      {error && <p className="w-full text-[11px] text-red-400">{error}</p>}
    </div>
  );
};

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const ExamActivity: React.FC<ExamActivityProps> = ({ pathId, ownerId, isAdmin, prompts, onStats }) => {
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [attempts, setAttempts] = useState<ExamAttemptRow[] | null>(null);
  const [certificates, setCertificates] = useState<AdminCertificate[] | null>(null);
  const [showNames, setShowNames] = useState(false);
  /** Which row has its form open, as `kind:id`. */
  const [form, setForm] = useState('');

  const load = useCallback(() => {
    fetchExamStats(pathId, ownerId)
      .then((s) => {
        setStats(s);
        onStats?.(s);
      })
      .catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, ownerId]);
  useEffect(load, [load]);

  const loadNames = useCallback(() => {
    fetchExamAttempts(pathId, ownerId)
      .then((r) => setAttempts(r.attempts))
      .catch(() => setAttempts([]));
    fetchPathCertificates(pathId, ownerId)
      .then((r) => setCertificates(r.certificates))
      .catch(() => setCertificates([]));
  }, [pathId, ownerId]);
  useEffect(() => {
    if (showNames) loadNames();
  }, [showNames, loadNames]);

  if (!stats) return null;
  const { attempts: a } = stats;
  if (a.submitted + a.active + a.voided === 0) return null;

  const passRate = a.submitted ? Math.round((a.passed / a.submitted) * 100) : 0;
  /* The tasks most often got wrong, once enough people have met them for the
     figure to mean something. */
  const hardest = stats.tasks
    .filter((t) => t.seen >= 3)
    .map((t) => ({ ...t, rate: Math.round((t.right / t.seen) * 100) }))
    .sort((x, y) => x.rate - y.rate)
    .slice(0, 3)
    .filter((t) => t.rate < 50);

  const after = async (work: Promise<unknown>) => {
    await work;
    setForm('');
    load();
    loadNames();
  };

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-[#263248] bg-[#121a2a] p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
        <Activity size={15} className="text-[#60a5fa]" /> {say('How the exam is going', 'سير الاختبار')}
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Tile label={say('Attempts marked', 'محاولات مصحَّحة')} value={a.submitted} />
        <Tile label={say('Pass rate', 'نسبة النجاح')} value={`${passRate}%`} />
        <Tile label={say('Average score', 'متوسط الدرجة')} value={stats.averagePercent === null ? '·' : `${stats.averagePercent}%`} />
        <Tile label={say('In progress now', 'جارية الآن')} value={a.active} />
        <Tile label={say('Certificates issued', 'شهادات صادرة')} value={stats.certificates.issued} />
      </div>

      {a.reported > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-[#f3a43a]/40 bg-[#f3a43a]/[0.07] px-3 py-2.5 text-xs text-[#d2d7e3]">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" />
          {say(
            `${a.reported} attempt${a.reported === 1 ? '' : 's'} reported a problem with a target or a file. An admin can read the reports and cancel an attempt that should not count.`,
            `عدد المحاولات التي أبلغت عن مشكلة في هدف أو ملف: ${a.reported}. يستطيع المشرف قراءة البلاغات وإلغاء المحاولة التي لا ينبغي احتسابها.`
          )}
        </p>
      )}

      {hardest.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-[#9aa5bf]">
            {say('Got wrong most often. Worth a second look at the wording and the answer.', 'الأكثر خطأً. راجع الصياغة والإجابة.')}
          </p>
          <ul className="space-y-1">
            {hardest.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-md bg-[#0a0f18] px-3 py-1.5 text-xs text-[#d2d7e3]">
                <span className="truncate" dir="auto">
                  {prompts.get(t.id) || say('A task since removed', 'مهمة حُذفت لاحقًا')}
                </span>
                <span className="flex-shrink-0 font-semibold text-[#f3a43a]" dir="ltr">
                  {t.rate}% · {t.right}/{t.seen}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-[#263248] pt-4">
          <button type="button" onClick={() => setShowNames((v) => !v)} className={smallBtn}>
            {showNames ? say('Hide the names', 'إخفاء الأسماء') : say('Attempts and certificates, by name', 'المحاولات والشهادات بالأسماء')}
          </button>

          {showNames && (
            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold text-[#f3f6ff]">{say('Attempts', 'المحاولات')}</p>
                {!attempts ? (
                  <Loader2 size={16} className="animate-spin text-[#8592ad]" />
                ) : attempts.length === 0 ? (
                  <p className="text-xs text-[#8592ad]">{say('None yet.', 'لا شيء بعد.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {attempts.map((row) => (
                      <li key={row.id} className="rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="font-semibold text-[#f3f6ff]" dir="auto">
                            {row.user.displayName}
                          </span>
                          {row.user.username && (
                            <span className="text-[#00a859]" dir="ltr">
                              @{row.user.username}
                            </span>
                          )}
                          <span className="text-[#8592ad]" dir="ltr">
                            #{row.number} · {shortDate(row.startedAt)}
                          </span>
                          <span
                            className={`font-semibold ${
                              row.status === 'voided'
                                ? 'text-[#8592ad]'
                                : row.status === 'active'
                                  ? 'text-[#60a5fa]'
                                  : row.passed
                                    ? 'text-[#00a859]'
                                    : 'text-[#f3a43a]'
                            }`}
                            dir="ltr"
                          >
                            {row.status === 'voided'
                              ? say('Cancelled', 'ملغاة')
                              : row.status === 'active'
                                ? say('In progress', 'جارية')
                                : `${row.percent}% · ${row.passed ? say('passed', 'ناجح') : say('not passed', 'لم ينجح')}`}
                          </span>
                          {row.status !== 'voided' && (
                            <button type="button" onClick={() => setForm(`void:${row.id}`)} className={`${smallBtn} ms-auto`}>
                              <XCircle size={11} /> {say('Cancel attempt', 'إلغاء المحاولة')}
                            </button>
                          )}
                        </div>
                        {row.report && (
                          <p className="mt-1.5 text-[11px] text-[#f3a43a]" dir="auto">
                            {say('Reported:', 'بلاغ:')} {row.report.note}
                          </p>
                        )}
                        {row.voidReason && (
                          <p className="mt-1.5 text-[11px] text-[#8592ad]" dir="auto">
                            {say('Cancelled:', 'سبب الإلغاء:')} {row.voidReason}
                          </p>
                        )}
                        {form === `void:${row.id}` && (
                          <ReasonForm
                            placeholder={say('Why it should not count, e.g. the target was down', 'لماذا لا تُحتسب، مثل: كان الهدف متوقفًا')}
                            confirm={say('Cancel it', 'إلغاء المحاولة')}
                            onCancel={() => setForm('')}
                            onSubmit={(reason) => after(voidExamAttempt(row.id, reason))}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-[#f3f6ff]">{say('Certificates', 'الشهادات')}</p>
                {!certificates ? (
                  <Loader2 size={16} className="animate-spin text-[#8592ad]" />
                ) : certificates.length === 0 ? (
                  <p className="text-xs text-[#8592ad]">{say('None issued yet.', 'لم تصدر أي شهادة بعد.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {certificates.map((c) => (
                      <li key={c.code} className="rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          {c.revoked ? (
                            <ShieldX size={13} className="text-red-400" />
                          ) : (
                            <BadgeCheck size={13} className="text-[#00a859]" />
                          )}
                          <span className="font-semibold text-[#f3f6ff]" dir="auto">
                            {c.name}
                          </span>
                          <span className="text-[#8592ad]" dir="ltr">
                            {c.scorePercent}% · {shortDate(c.issuedAt)}
                          </span>
                          <a href={certificateLink(c.code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#00a859] hover:underline">
                            {say('Open', 'فتح')} <ExternalLink size={11} />
                          </a>
                          <span className="ms-auto flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setForm(`name:${c.code}`)} className={smallBtn}>
                              {say('Correct the name', 'تصحيح الاسم')}
                            </button>
                            {c.revoked ? (
                              <button type="button" onClick={() => after(restoreCertificate(c.code))} className={smallBtn}>
                                <RotateCcw size={11} /> {say('Restore', 'إعادة')}
                              </button>
                            ) : (
                              <button type="button" onClick={() => setForm(`revoke:${c.code}`)} className={`${smallBtn} hover:!border-red-500/40 hover:!text-red-400`}>
                                <ShieldX size={11} /> {say('Revoke', 'سحب')}
                              </button>
                            )}
                          </span>
                        </div>
                        {c.revoked && c.revokedReason && (
                          <p className="mt-1.5 text-[11px] text-red-400" dir="auto">
                            {say('Revoked:', 'سبب السحب:')} {c.revokedReason}
                          </p>
                        )}
                        {form === `revoke:${c.code}` && (
                          <ReasonForm
                            placeholder={say('Why it is withdrawn', 'سبب سحب الشهادة')}
                            confirm={say('Revoke it', 'سحب الشهادة')}
                            onCancel={() => setForm('')}
                            onSubmit={(reason) => after(revokeCertificate(c.code, reason))}
                          />
                        )}
                        {form === `name:${c.code}` && (
                          <ReasonForm
                            placeholder={say('The name as it should be printed', 'الاسم كما يجب أن يُطبع')}
                            confirm={say('Save the name', 'حفظ الاسم')}
                            initial={c.name}
                            onCancel={() => setForm('')}
                            onSubmit={(name) => after(reissueCertificate(c.code, name))}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamActivity;
