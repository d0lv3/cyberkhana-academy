import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BadgeCheck, ChevronRight, Hourglass, Lock, ShieldCheck } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { fetchExamStatus, type ExamInfo, type ExamStatus } from '../../services/examService';

/* ─── The last stop of a path: its final exam ───
 *
 * Sits at the end of the curriculum. Until every step is done it is locked,
 * and says how far there is to go; after that it is the way into the exam,
 * and once the exam is passed, the way to the certificate.
 *
 * Whether it is open is the server's answer (GET /api/exams/:pathId). The
 * progress this browser holds is only used to draw the lock before that
 * answer arrives, so the stop never flashes open and shut.
 */

interface PathExamStopProps {
  pathId: string;
  slug: string;
  info: ExamInfo;
  certificate: boolean;
  /** Steps done and steps there are, as this browser counts them. */
  done: number;
  total: number;
}

const PathExamStop: React.FC<PathExamStopProps> = ({ pathId, slug, info, certificate, done, total }) => {
  const navigate = useNavigate();
  const { isArabic } = useLang();
  const say = (en: string, ar: string) => (isArabic ? ar : en);
  const [status, setStatus] = useState<ExamStatus | null>(null);

  useEffect(() => {
    let live = true;
    fetchExamStatus(pathId)
      .then((s) => {
        if (live) setStatus(s);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // Asked again when a step is finished: that is what unlocks it.
  }, [pathId, done]);

  const state = status?.state ?? (total > 0 && done >= total ? 'ready' : 'locked');
  const stepsDone = status?.path.done ?? done;
  const stepsTotal = status?.path.available ?? total;
  const open = () => navigate(`/paths/${slug}/exam`);
  const when = (iso: string) =>
    new Date(iso).toLocaleString(isArabic ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const minutes =
    info.minutes >= 120
      ? say(`${Math.round((info.minutes / 60) * 10) / 10} hours`, `${Math.round((info.minutes / 60) * 10) / 10} ساعة`)
      : say(`${info.minutes} minutes`, `${info.minutes} دقيقة`);

  const locked = state === 'locked';
  const passed = state === 'passed';
  const accent = passed ? '#9fef00' : locked ? '#4d5a73' : '#00a859';

  let action: React.ReactNode = null;
  let note: string | null = null;
  const cta = (label: string) => (
    <button
      type="button"
      onClick={open}
      className="group inline-flex w-fit flex-shrink-0 items-center gap-2 rounded-xl border border-[#00a859]/45 bg-[#00a859]/12 px-5 py-3 text-sm font-bold text-[#00a859] transition-all hover:border-[#9fef00]/60 hover:bg-[#00a859]/20 hover:text-[#9fef00]"
    >
      {label}
      <ChevronRight size={15} className="rtl-flip transition-transform group-hover:translate-x-0.5" />
    </button>
  );

  if (state === 'ready') action = cta(say('Start exam', 'ابدأ الاختبار'));
  else if (state === 'active') action = cta(say('Resume exam', 'متابعة الاختبار'));
  else if (passed) {
    action = cta(
      status?.certificate
        ? say('View certificate', 'عرض الشهادة')
        : status?.claimable
          ? say('Claim certificate', 'طلب الشهادة')
          : say('See your result', 'عرض نتيجتك')
    );
    note = status?.passed
      ? `${status.passed.distinction ? say('Passed with distinction', 'نجاح بامتياز') : say('Passed', 'ناجح')} · ${status.passed.percent}%`
      : null;
  } else if (locked) {
    note = say(
      `Finish every step to unlock. ${stepsDone} of ${stepsTotal} done.`,
      `أكمل كل الخطوات لفتحه. أُنجز ${stepsDone} من ${stepsTotal}.`
    );
  } else if (state === 'cooldown' && status?.retryAt) {
    note = `${say('You can sit it again from', 'يمكنك إعادته ابتداءً من')} ${when(status.retryAt)}`;
    action = cta(say('See your result', 'عرض نتيجتك'));
  } else if (state === 'paused') note = say('Temporarily unavailable. Check back soon.', 'غير متاح مؤقتًا. عُد قريبًا.');
  else if (state === 'not-open' && info.opensAt) note = `${say('Opens on', 'يُفتح في')} ${when(info.opensAt)}`;
  else if (state === 'closed') note = say('The exam window has closed.', 'انتهت فترة الاختبار.');
  else if (state === 'exhausted') note = say('You have used every attempt this exam allows.', 'استنفدت كل المحاولات المسموحة.');
  else if (state === 'author') {
    note = say('You wrote this exam, so it cannot be sat from this account.', 'أنت كاتب هذا الاختبار، فلا يمكن أداؤه من هذا الحساب.');
    action = cta(say('See its rules', 'عرض قواعده'));
  }

  const Icon = passed ? BadgeCheck : locked ? Lock : state === 'cooldown' || state === 'paused' || state === 'not-open' ? Hourglass : ShieldCheck;

  return (
    <section
      aria-label={say('Final exam', 'الاختبار النهائي')}
      className={`relative overflow-hidden rounded-2xl border bg-[#121a2a]/45 p-5 backdrop-blur-md sm:p-6 ${
        locked ? 'border-[#263248]' : passed ? 'border-[#9fef00]/40' : 'border-[#00a859]/45'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border"
            style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}14` }}
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <h3 className={`text-base font-black ${locked ? 'text-[#9aa5bf]' : 'text-[#f3f6ff]'}`}>{say('Final exam', 'الاختبار النهائي')}</h3>
            <p className="mt-0.5 text-xs text-[#8592ad]">
              <span dir="ltr">{info.tasks}</span> {say('tasks', 'مهمة')} · {minutes} · <span dir="ltr">{info.passPercent}%</span>{' '}
              {say('to pass', 'للنجاح')}
              {info.practical && <> · {say('with a practical part', 'يتضمن جزءًا عمليًا')}</>}
            </p>
            {note && <p className={`mt-2 text-sm ${passed ? 'font-bold text-[#9fef00]' : 'text-[#d2d7e3]'}`}>{note}</p>}
            {certificate && !passed && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#9aa5bf]">
                <Award size={13} className="text-[#9fef00]" />
                {say('Pass it to earn the certificate of achievement.', 'انجح فيه لتنال شهادة الإنجاز.')}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </section>
  );
};

export default PathExamStop;
