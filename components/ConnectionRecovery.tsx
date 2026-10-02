import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { retrySync } from '../services/syncService';

export const ConnectionRecovery: React.FC<{
  session?: boolean;
  retry?: () => Promise<void>;
  retrying?: boolean;
}> = ({ session = false, retry = retrySync, retrying = false }) => {
  const { lang } = useLang();
  const status = useSyncStatus();
  const ar = lang === 'ar';
  const busy = retrying || status.retrying;
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#0d1117] p-6" dir={ar ? 'rtl' : 'ltr'}>
      <div role="alert" className="w-full max-w-md rounded-2xl border border-[#263248] bg-[#121a2a] p-6 text-center">
        <AlertTriangle size={30} className="mx-auto mb-4 text-[#f3a43a]" />
        <h1 className="text-xl font-bold text-[#f3f6ff]">
          {ar ? 'تعذّر الاتصال بالأكاديمية' : 'Couldn’t connect to the Academy'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9aa5bf]">
          {session
            ? ar ? 'تعذّر التحقق من تسجيل دخولك. تحقق من اتصالك وحاول مجددًا.' : 'We couldn’t check your sign-in. Check your connection and try again.'
            : ar ? 'تعذّر تحميل بعض بيانات التعلم. عملك المحفوظ على هذا الجهاز ما زال موجودًا. سنحاول الاتصال مجددًا تلقائيًا.' : 'Some learning data couldn’t load. Work saved on this device is still here. We’ll automatically try to reconnect.'}
        </p>
        <button type="button" disabled={busy} onClick={() => void retry()}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#007a42] px-5 py-3 text-sm font-bold text-white hover:bg-[#006635] disabled:opacity-60">
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
          {busy ? ar ? 'جارٍ إعادة الاتصال…' : 'Reconnecting…' : ar ? 'حاول مجددًا' : 'Retry now'}
        </button>
      </div>
    </main>
  );
};

/** Saved changes waiting on the connection remain visible on every learner page. */
export const SyncNoticeHost: React.FC = () => {
  const status = useSyncStatus();
  const { lang } = useLang();
  const ar = lang === 'ar';
  if (status.failedLoads.includes('courses') || status.failedLoads.includes('progress')) return null;
  if (!status.saveFailed && !status.failedLoads.includes('studio')) return null;
  return (
    <div role="status" dir={ar ? 'rtl' : 'ltr'}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] inset-x-3 z-[55] mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3a43a]/40 bg-[#121a2a] p-4 shadow-xl md:bottom-4 md:inset-x-auto md:end-4">
      <p className="flex-1 text-sm text-[#d2d7e3]">
        {status.saveFailed
          ? ar ? 'تغييراتك على هذا الجهاز تنتظر الحفظ. سنحاول مجددًا تلقائيًا.' : 'Your changes on this device are waiting to save. We’ll retry automatically.'
          : ar ? 'تعذّر تحميل محتوى استوديو المنشئين.' : 'Creator Studio content couldn’t load.'}
      </p>
      <button type="button" disabled={status.retrying} onClick={() => void retrySync()}
        className="min-h-11 rounded-lg border border-[#f3a43a]/40 px-3 text-sm font-bold text-[#f3a43a] disabled:opacity-60">
        {status.retrying ? ar ? 'جارٍ الاتصال…' : 'Reconnecting…' : ar ? 'حاول مجددًا' : 'Retry'}
      </button>
    </div>
  );
};
