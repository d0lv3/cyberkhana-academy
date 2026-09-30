import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import type { FailReason } from '../../services/completionService';

/* What a lesson says when finishing it did not go straight through: the
 * server's pace clock is holding it (services/completionService.ts), or the
 * server turned it down. One place, so every kind of lesson says it the same
 * way in both languages. */

const FAILURES: Record<FailReason, { en: string; ar: string }> = {
  'not-passed': {
    en: "That didn't pass the check. Try again.",
    ar: 'لم يجتز ذلك التحقق. حاول مجددًا.',
  },
  changed: {
    en: 'This lesson changed since you opened it. Reload the page and try again.',
    ar: 'تغيّر هذا الدرس منذ فتحته. أعد تحميل الصفحة وحاول مجددًا.',
  },
  unpublished: {
    en: "This lesson isn't published, so progress on it isn't saved.",
    ar: 'هذا الدرس غير منشور، لذلك لا يُحفظ التقدم فيه.',
  },
  'signed-out': {
    en: 'Sign in to save your progress.',
    ar: 'سجّل الدخول لحفظ تقدمك.',
  },
  'rate-limited': {
    en: 'Too many attempts. Wait a minute, then try again.',
    ar: 'محاولات كثيرة. انتظر دقيقة ثم حاول مجددًا.',
  },
  network: {
    en: "Couldn't save your progress. Check your connection and try again.",
    ar: 'تعذّر حفظ تقدمك. تحقق من اتصالك وحاول مجددًا.',
  },
};

export function failureText(reason: FailReason, lang: 'en' | 'ar'): string {
  return FAILURES[reason][lang];
}

/** 1:05, or 12:00. */
function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

interface CompletionNoticeProps {
  /** When a completion held by the pace clock goes again. */
  readyAt?: number | null;
  failure?: FailReason | null;
  className?: string;
}

const CompletionNotice: React.FC<CompletionNoticeProps> = ({ readyAt, failure, className = '' }) => {
  const { lang } = useLang();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!readyAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [readyAt]);

  if (readyAt) {
    const left = readyAt - now;
    return (
      <div
        role="status"
        className={`flex items-start gap-2.5 rounded-lg border border-[#f3a43a]/25 bg-[#f3a43a]/[0.07] px-4 py-3 text-sm text-[#d2d7e3] ${className}`}
      >
        <Clock size={16} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" />
        {left > 0 ? (
          <span>
            {lang === 'ar'
              ? 'أنت تتقدم أسرع من مدة الدرس. سيُسجَّل مكتملًا بعد '
              : 'Moving faster than the lesson runs. It will be marked complete in '}
            <span dir="ltr" className="font-semibold tabular-nums text-[#f3a43a]">
              {clock(left)}
            </span>
            {lang === 'ar' ? '، ويمكنك المتابعة في هذه الأثناء.' : ', and you can carry on meanwhile.'}
          </span>
        ) : (
          <span>{lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
        )}
      </div>
    );
  }

  if (failure) {
    return (
      <div
        role="alert"
        className={`flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-3 text-sm text-red-300 ${className}`}
      >
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
        <span>{failureText(failure, lang)}</span>
      </div>
    );
  }

  return null;
};

export default CompletionNotice;
