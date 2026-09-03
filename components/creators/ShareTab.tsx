import React, { useCallback, useEffect, useState } from 'react';
import { Share2, X, Trash2, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import Button from '../ui/EnhancedButton';
import { confirmDialog } from '../ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';
import {
  fetchGrants,
  shareBucket,
  revokeGrant,
  type CollabBucket,
  type GrantGiven,
} from '../../services/collabService';

interface ShareTabProps {
  /** Which studio tab (and therefore which bucket) is being shared. */
  bucket: CollabBucket;
  /** Human name of the tab, for the dialog copy. */
  label: string;
  /** Called after a share or revoke, so the page can refresh its lists. */
  onChange?: () => void;
}

/**
 * "Share" control for a studio tab.
 *
 * Sharing is per tab, not per item, because that is how the content is stored:
 * one bucket per (owner, tab). Handing someone a tab hands them everything in
 * it, now and in future, with the same rights the owner has.
 */
const ShareTab: React.FC<ShareTabProps> = ({ bucket, label, onChange }) => {
  const { lang } = useLang();
  const ar = lang === 'ar';

  const [open, setOpen] = useState(false);
  const [grants, setGrants] = useState<GrantGiven[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchGrants()
      .then(({ given }) => setGrants(given.filter((g) => g.bucket === bucket)))
      .catch(() => setGrants([]))
      .finally(() => setLoading(false));
  }, [bucket]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = username.trim();
    if (!handle) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const grant = await shareBucket(bucket, handle);
      setGrants((prev) => [...prev.filter((g) => g.id !== grant.id), grant]);
      setUsername('');
      setNotice(
        ar
          ? `تمت مشاركة ${label} مع ${grant.grantee?.displayName ?? handle}.`
          : `Shared ${label} with ${grant.grantee?.displayName ?? handle}.`
      );
      onChange?.();
    } catch (err) {
      // The server owns the wording here: it is the only side that knows
      // whether the handle exists, and whether that person may author this.
      setError(err instanceof Error ? err.message : ar ? 'تعذّرت المشاركة.' : 'Could not share.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (grant: GrantGiven) => {
    const who = grant.grantee?.displayName ?? (ar ? 'هذا المستخدم' : 'this user');
    const ok = await confirmDialog({
      title: ar ? 'إلغاء الوصول؟' : 'Remove access?',
      message: ar
        ? `لن يعود بإمكان ${who} فتح أو تعديل ${label}. يبقى كل المحتوى كما هو لديك.`
        : `${who} will no longer be able to open or edit ${label}. All of the content stays with you.`,
      confirmLabel: ar ? 'إلغاء الوصول' : 'Remove access',
    });
    if (!ok) return;

    try {
      await revokeGrant(grant.id);
      setGrants((prev) => prev.filter((g) => g.id !== grant.id));
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : ar ? 'تعذّر الإلغاء.' : 'Could not revoke.');
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" leftIcon={<Share2 size={14} />} onClick={() => setOpen(true)}>
        {ar ? 'مشاركة' : 'Share'}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#263248] bg-[#121a2a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#263248] px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-[#f3f6ff]">
                  {ar ? `مشاركة ${label}` : `Share ${label}`}
                </h3>
                <p className="mt-0.5 text-xs text-[#8592ad]">
                  {ar
                    ? 'يحصل من تشاركه على نفس صلاحياتك داخل هذا التبويب.'
                    : 'Whoever you add gets the same rights you have in this tab.'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#8592ad] transition-colors hover:text-[#f3f6ff]"
                aria-label={ar ? 'إغلاق' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Full rights is the deal here, so it is stated plainly rather
                  than left for someone to discover after the fact. */}
              <div className="flex items-start gap-2.5 rounded-lg border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-3 py-2.5">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" />
                <p className="text-[11px] leading-relaxed text-[#d2d7e3]">
                  {ar
                    ? 'يمكنهم التعديل والنشر والحذف في هذا التبويب، تمامًا مثلك. يبقى اسم المؤلف الأصلي على المحتوى.'
                    : 'They can edit, publish and delete in this tab, exactly as you can. The original author stays on the content.'}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-2" dir="ltr">
                <label className="block text-xs font-semibold text-[#9aa5bf]">
                  {ar ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="flex gap-2">
                  <input
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="username"
                    autoFocus
                    spellCheck={false}
                    className="w-full rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2 font-mono text-sm text-[#d2d7e3] transition-colors placeholder:text-[#7c8aa6] focus:border-[#00a859]/50 focus:outline-none"
                  />
                  <Button type="submit" size="sm" disabled={busy || !username.trim()} leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}>
                    {ar ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </form>

              {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
              {notice && <p className="text-xs text-[#00a859]">{notice}</p>}

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
                  {ar ? 'لديهم وصول' : 'Has access'} {grants.length > 0 && `(${grants.length})`}
                </h4>

                {loading ? (
                  <p className="text-xs text-[#8592ad]">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p>
                ) : grants.length === 0 ? (
                  <p className="text-xs text-[#8592ad]">
                    {ar ? 'لم تشارك هذا التبويب مع أحد بعد.' : "You haven't shared this tab with anyone yet."}
                  </p>
                ) : (
                  grants.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-lg border border-[#263248] bg-[#0a0f18] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#d2d7e3]">
                          {g.grantee?.displayName ?? (ar ? 'مستخدم محذوف' : 'Removed user')}
                        </p>
                        {g.grantee?.username && (
                          <p className="truncate font-mono text-[10px] text-[#7c8aa6]" dir="ltr">
                            @{g.grantee.username}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => revoke(g)}
                        title={ar ? 'إلغاء الوصول' : 'Remove access'}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#8592ad] transition-all hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareTab;
