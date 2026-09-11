import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';

/**
 * What just happened to the account, said once.
 *
 * Mounted at the app root rather than on a page, because both notices arrive
 * with a change of page: asking to be deleted signs the member out, away from
 * the profile page where they asked, and signing in sends them on to the
 * dashboard.
 */

function formatWhen(iso: string, lang: 'en' | 'ar'): string {
  try {
    return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

const AccountNoticeHost: React.FC = () => {
  const { accountNotice: notice, dismissAccountNotice: dismiss } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  useEffect(() => {
    if (!notice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notice, dismiss]);

  if (!notice) return null;

  const scheduled = notice.kind === 'deletion-scheduled';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-notice-title"
        aria-describedby="account-notice-body"
        className="w-full max-w-md rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-[#263248]">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              scheduled ? 'bg-red-500/10 border-red-500/25' : 'bg-[#00a859]/10 border-[#00a859]/25'
            }`}
          >
            {scheduled ? (
              <Clock size={18} className="text-red-400" />
            ) : (
              <ShieldCheck size={18} className="text-[#00a859]" />
            )}
          </div>
          <h2 id="account-notice-title" className="text-lg font-black text-[#f3f6ff]">
            {scheduled
              ? ar
                ? 'سيُحذف حسابك'
                : 'Your account will be deleted'
              : ar
              ? 'لن يُحذف حسابك'
              : 'Your account will not be deleted'}
          </h2>
        </div>

        <div id="account-notice-body" className="space-y-3 p-6 text-sm leading-relaxed text-[#9aa5bf]">
          {notice.kind === 'deletion-scheduled' ? (
            <>
              <p>
                {ar ? 'سنحذف حسابك في ' : 'We will delete it on '}
                <span className="font-semibold text-[#f3f6ff]">{formatWhen(notice.scheduledFor, lang)}</span>
                {ar ? '. وقد سُجّل خروجك من جميع الأجهزة.' : '. You have been signed out on every device.'}
              </p>
              <p>
                {ar
                  ? 'غيّرت رأيك؟ سجّل الدخول مجددًا قبل ذلك الموعد، وسيبقى حسابك كما تركته تمامًا.'
                  : 'Changed your mind? Sign in again before then and it stays, exactly as you left it.'}
              </p>
            </>
          ) : (
            <>
              <p>
                {ar
                  ? 'كنت قد طلبت حذف هذا الحساب، وتسجيل دخولك ألغى ذلك الطلب، فكل شيء كما تركته.'
                  : 'You had asked for this account to be deleted. Signing in cancelled that request, so everything is as you left it.'}
              </p>
              <p>
                {ar
                  ? 'وإن كنت ما زلت تريد حذفه، يمكنك أن تطلب ذلك من جديد من ملفك الشخصي.'
                  : 'If you still want to go, you can ask again from your profile.'}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-6 pb-6">
          {scheduled && (
            <button
              type="button"
              onClick={() => {
                dismiss();
                navigate('/login');
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#9aa5bf] bg-[#1a2332] border border-[#263248] hover:text-[#d2d7e3] hover:border-[#354562] transition-all"
            >
              {ar ? 'سجّل الدخول مجددًا' : 'Sign in again'}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={dismiss}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#007a42] hover:bg-[#006635] transition-all"
          >
            {scheduled ? (ar ? 'حسنًا' : 'OK') : ar ? 'فهمت' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountNoticeHost;
