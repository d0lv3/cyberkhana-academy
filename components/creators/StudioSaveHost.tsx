import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { confirmDialog } from '../ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import {
  discardBackup,
  discardLocalVersion,
  keepMyVersion,
  restoreBackup,
  type SaveProblem,
} from '../../services/syncService';

/** The server's reason in the reader's language, where it is one of the reasons
 *  an author can do something about. */
const REASON_AR: Record<string, string> = {
  ITEM_TOO_LARGE: 'حجم هذا العنصر كبير جدًا ولا يمكن حفظه. قسّمه إلى أجزاء أصغر وارفع الصور كملفات.',
  INLINE_IMAGES_TOO_LARGE: 'يحتوي هذا العنصر على صور كبيرة مُلصقة داخل النص. ارفعها كملفات ثم احفظ مجددًا.',
  BUCKET_FULL: 'هذا القسم من الاستوديو ممتلئ. انقل شيئًا منه أو احذفه ثم احفظ مجددًا.',
  ACCOUNT_CHANGED: 'أنت مسجّل الدخول بحساب آخر الآن. أعد تحميل هذه الصفحة.',
};

/* ── What a creator has to decide about their saves ──
 * Saves happen behind the page, so this sits at the app's root and speaks up on
 * whatever page they are on by then: another copy got there first, the server
 * refused the save and said why, or the last visit left work that never reached
 * the server. Nothing here is ever decided for them. */
const StudioSaveHost: React.FC = () => {
  const status = useSyncStatus();
  const { lang } = useLang();
  const ar = lang === 'ar';
  const tr = (en: string, arabic: string) => (ar ? arabic : en);
  const [busy, setBusy] = useState(false);

  const conflict = status.problems.find((p) => p.kind === 'conflict');
  const rejected = status.problems.filter((p) => p.kind === 'rejected');
  const recoverable = status.loading ? [] : status.recoverable;

  const reasonOf = (problem: SaveProblem) =>
    (ar && problem.code && REASON_AR[problem.code]) || problem.reason || tr('The server refused this save.', 'رفض الخادم هذا الحفظ.');

  const takeNewer = async (id: string) => {
    setBusy(true);
    try {
      await discardLocalVersion(id);
    } finally {
      setBusy(false);
    }
  };

  const goBack = async (problem: SaveProblem) => {
    const ok = await confirmDialog({
      title: tr('Go back to the saved version?', 'العودة إلى النسخة المحفوظة؟'),
      message: tr(
        `The changes to "${problem.title}" that could not be saved will be dropped.`,
        `ستُحذف تغييرات «${problem.title}» التي تعذّر حفظها.`
      ),
      confirmLabel: tr('Drop my changes', 'احذف تغييراتي'),
      cancelLabel: tr('Keep them', 'أبقِها'),
    });
    if (ok) await takeNewer(problem.id);
  };

  const discard = async (id: string, title: string) => {
    const ok = await confirmDialog({
      title: tr('Discard this work?', 'تجاهل هذا العمل؟'),
      message: tr(
        `Your unsaved changes to "${title}" will be gone from this device. This cannot be undone.`,
        `ستُحذف تغييراتك غير المحفوظة على «${title}» من هذا الجهاز. لا يمكن التراجع عن هذا.`
      ),
      confirmLabel: tr('Discard', 'تجاهل'),
      cancelLabel: tr('Keep it', 'أبقِه'),
    });
    if (ok) void discardBackup(id);
  };

  const hasPanel = rejected.length > 0 || recoverable.length > 0;

  return (
    <>
      {conflict && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4" dir={ar ? 'rtl' : 'ltr'}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="save-conflict-title"
            aria-describedby="save-conflict-message"
            className="relative w-full max-w-md rounded-2xl border border-[#263248] bg-[#121a2a] p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border bg-[#f3a43a]/10 border-[#f3a43a]/25">
                <AlertTriangle size={18} className="text-[#f3a43a]" />
              </div>
              <div className="min-w-0">
                <h3 id="save-conflict-title" className="text-sm font-bold text-[#f3f6ff] break-words">
                  {tr('This was changed somewhere else: ', 'تغيّر هذا من مكان آخر: ')}
                  <bdi>{conflict.title}</bdi>
                </h3>
                <p id="save-conflict-message" className="text-xs text-[#9aa5bf] mt-1.5 leading-relaxed">
                  {tr(
                    'It was saved from another tab, another device or by a collaborator after you opened it. Your version has not been saved yet.',
                    'حُفظ من تبويب آخر أو جهاز آخر أو من قِبل متعاون بعد أن فتحته. نسختك لم تُحفظ بعد.'
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={() => keepMyVersion(conflict.id)}
                className="w-full rounded-lg bg-[#007a42] px-3.5 py-2.5 text-start text-xs font-bold text-white hover:bg-[#006635] disabled:opacity-60"
              >
                {tr('Keep my version', 'أبقِ نسختي')}
                <span className="block mt-0.5 font-normal text-white/80">
                  {tr(
                    'It replaces the other version. We keep a copy of that one on the server for 90 days.',
                    'ستحل محل النسخة الأخرى، ونحتفظ بنسخة منها على الخادم لمدة 90 يومًا.'
                  )}
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void takeNewer(conflict.id)}
                className="w-full rounded-lg border border-[#263248] bg-[#1a2332] px-3.5 py-2.5 text-start text-xs font-bold text-[#d2d7e3] hover:border-[#354562] disabled:opacity-60"
              >
                {tr('Use the newer version', 'استخدم النسخة الأحدث')}
                <span className="block mt-0.5 font-normal text-[#9aa5bf]">
                  {tr(
                    'Your changes to this item are dropped, and the page starts again from the other version.',
                    'تُحذف تغييراتك على هذا العنصر، وتبدأ الصفحة من جديد بالنسخة الأخرى.'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {hasPanel && (
        <div
          role="status"
          dir={ar ? 'rtl' : 'ltr'}
          className={`fixed inset-x-3 z-[54] mx-auto flex max-h-[60dvh] max-w-lg flex-col gap-3 overflow-y-auto rounded-xl border border-[#f3a43a]/40 bg-[#121a2a] p-4 shadow-xl md:inset-x-auto md:end-4 md:w-[28rem] ${
            status.saveFailed
              ? 'bottom-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:bottom-28'
              : 'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-4'
          }`}
        >
          {rejected.map((problem) => (
            <div key={problem.id} className="space-y-2">
              <p className="text-sm font-bold text-[#f3f6ff] break-words">
                {tr('Could not save: ', 'تعذّر الحفظ: ')}
                <bdi>{problem.title}</bdi>
              </p>
              <p className="text-xs leading-relaxed text-[#9aa5bf]">
                {reasonOf(problem)}{' '}
                {tr('Your version is still in this tab.', 'نسختك ما زالت في هذا التبويب.')}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void goBack(problem)}
                className="min-h-9 rounded-lg border border-[#263248] px-3 text-xs font-semibold text-[#d2d7e3] hover:border-[#354562] disabled:opacity-60"
              >
                {tr('Go back to the saved version', 'العودة إلى النسخة المحفوظة')}
              </button>
            </div>
          ))}

          {recoverable.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#f3f6ff]">
                {tr('Unsaved work from an earlier visit', 'عمل غير محفوظ من زيارة سابقة')}
              </p>
              <p className="text-xs leading-relaxed text-[#9aa5bf]">
                {tr(
                  'These changes were on this device but never reached the server.',
                  'كانت هذه التغييرات على هذا الجهاز لكنها لم تصل إلى الخادم.'
                )}
              </p>
              <ul className="space-y-2">
                {recoverable.map((offer) => (
                  <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#1a2332] p-2.5">
                    <span className="min-w-0 flex-1 text-xs text-[#d2d7e3]">
                      <bdi className="block truncate font-semibold">{offer.title}</bdi>
                      {offer.savedAt && (
                        <span className="text-[#8592ad]">
                          {new Date(offer.savedAt).toLocaleString(ar ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </span>
                    <span className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => restoreBackup(offer.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#007a42] px-3 text-xs font-bold text-white hover:bg-[#006635]"
                      >
                        <RotateCcw size={13} /> {tr('Restore', 'استعادة')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void discard(offer.id, offer.title)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#263248] px-3 text-xs font-semibold text-[#9aa5bf] hover:text-[#d2d7e3]"
                      >
                        <Trash2 size={13} /> {tr('Discard', 'تجاهل')}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StudioSaveHost;
