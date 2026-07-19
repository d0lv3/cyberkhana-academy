import React, { useState } from 'react';
import { AtSign, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { ApiError } from '../../services/api';

/**
 * Blocking first-run prompt claiming a public handle.
 *
 * A username is mandatory, so unlike the university prompt there is no opt-out
 * at all — it renders for any signed-in user without one and stays until the
 * server accepts a handle. Uniqueness is decided server-side, so this waits for
 * the response and shows the reason on rejection instead of guessing.
 */

/** Mirrors the server rule so the user gets told before a round-trip. */
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const UsernamePrompt: React.FC = () => {
  const { user, updateUsername } = useAuth();
  const { lang } = useLang();
  const ar = lang === 'ar';

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /* Safety valve. This modal is deliberately unskippable, which means a server
     that CANNOT accept usernames — an older API that doesn't know the field —
     would lock every user out of the app. 409 (taken/reserved) is the server
     working correctly and must stay blocking; anything else suggests the
     backend can't satisfy us, so we offer a way through rather than brick it. */
  const [serverCannot, setServerCannot] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only when signed in and no handle claimed yet.
  if (!user || user.username || dismissed) return null;

  const trimmed = value.trim();
  const localValid = USERNAME_RE.test(trimmed);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateUsername(trimmed);
    } catch (err) {
      // 409 = the server understood and refused this handle. Anything else
      // (400 unknown field, 5xx, network) means it can't take usernames at all.
      if (err instanceof ApiError && err.status !== 409) setServerCannot(true);
      setError(
        err instanceof Error
          ? err.message
          : ar
          ? 'تعذر حفظ اسم المستخدم.'
          : 'Could not save that username.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/50">
        <div className="p-6 pb-4 border-b border-[#263248]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00a859]/10 border border-[#00a859]/25 flex items-center justify-center flex-shrink-0">
              <AtSign size={18} className="text-[#00a859]" />
            </div>
            <h2 className="text-lg font-black text-[#f3f6ff]">
              {ar ? 'اختر اسم المستخدم' : 'Choose your username'}
            </h2>
          </div>
          <p className="text-sm text-[#9aa5bf]">
            {ar
              ? 'هذا هو اسمك العام في المنصة — يظهر في لوحة المتصدرين وبجانب محتواك. يمكنك تغييره لاحقا من ملفك الشخصي.'
              : "This is your public handle on the platform — it appears on the leaderboard and beside anything you publish. You can change it later from your profile."}
          </p>
        </div>

        <form onSubmit={submit} className="p-6">
          <div className="relative">
            <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#6e7a94] pointer-events-none">
              <AtSign size={16} />
            </span>
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="sara_hunts"
              dir="ltr"
              maxLength={20}
              aria-invalid={!!error}
              className="w-full ps-10 pe-3 py-3 rounded-xl bg-[#0a0f18] border border-[#263248] text-[#f3f6ff] font-mono text-sm placeholder:text-[#3d4a63] focus:outline-none focus:border-[#00a859]/50 transition-colors"
            />
          </div>

          {/* One line that is either the rule, a local complaint, or the server's */}
          <p
            className={`mt-2 text-xs ${
              error ? 'text-[#ff6b6b]' : trimmed && !localValid ? 'text-[#f3a43a]' : 'text-[#6e7a94]'
            }`}
          >
            {error
              ? error
              : trimmed && !localValid
              ? ar
                ? '3 إلى 20 حرفا: أحرف وأرقام وشرطة سفلية فقط.'
                : '3–20 characters: letters, numbers and underscores only.'
              : ar
              ? 'من 3 إلى 20 حرفا. أحرف إنجليزية وأرقام وشرطة سفلية.'
              : '3–20 characters. Letters, numbers and underscores.'}
          </p>

          <button
            type="submit"
            disabled={!localValid || saving}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00a859] text-white text-sm font-bold transition-all hover:bg-[#00934e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : ar ? 'تأكيد' : 'Confirm'}
          </button>

          {serverCannot && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="mt-3 w-full text-center text-xs text-[#6e7a94] hover:text-[#d2d7e3] transition-colors underline underline-offset-2"
            >
              {ar
                ? 'المتابعة الآن — سنطلب اسم المستخدم لاحقا'
                : "Continue for now — we'll ask again later"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UsernamePrompt;
