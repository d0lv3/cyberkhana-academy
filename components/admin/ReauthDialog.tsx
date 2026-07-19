import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

/**
 * Step-up re-authentication dialog.
 *
 * Granting creator capabilities is privilege escalation, so a live session
 * isn't enough — the admin re-confirms through Google and we hand the fresh ID
 * token to the server, which checks it is theirs and was issued moments ago.
 *
 * We render a real Google button rather than calling `prompt()`: One Tap can be
 * silently suppressed (dismissed too often, third-party cookie rules), and a
 * security confirmation that sometimes doesn't appear is worse than none.
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GSI_SCRIPT_ID = 'google-gsi-client';

interface GsiSdk {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: 'popup' | 'redirect';
        auto_select?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
      cancel?: () => void;
    };
  };
}

function getGsi(): GsiSdk | undefined {
  return (window as unknown as { google?: GsiSdk }).google;
}

interface ReauthDialogProps {
  open: boolean;
  /** What the admin is about to do, shown so they can refuse knowingly. */
  actionLabel: string;
  onCancel: () => void;
  /** Receives a freshly minted Google ID token. */
  onCredential: (credential: string) => void;
  /** Surfaced from the server when it rejects the confirmation. */
  error?: string | null;
  busy?: boolean;
}

const ReauthDialog: React.FC<ReauthDialogProps> = ({
  open,
  actionLabel,
  onCancel,
  onCredential,
  error,
  busy,
}) => {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callback without re-initialising the SDK on every render.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const init = useCallback(() => {
    const gsi = getGsi();
    if (!gsi || !btnRef.current) return;
    gsi.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => onCredentialRef.current(res.credential),
      ux_mode: 'popup',
      // Never reuse a silent session — the whole point is a deliberate act.
      auto_select: false,
    });
    btnRef.current.innerHTML = '';
    gsi.accounts.id.renderButton(btnRef.current, {
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) return;
    if (document.getElementById(GSI_SCRIPT_ID)) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [open, init]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-[#263248]">
          <div className="w-10 h-10 rounded-xl bg-[#f3a43a]/10 border border-[#f3a43a]/25 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={18} className="text-[#f3a43a]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-[#f3f6ff]">
              {ar ? 'تأكيد هويتك' : "Confirm it's you"}
            </h2>
            <p className="text-sm text-[#9aa5bf] mt-1">
              {ar
                ? 'تغيير الصلاحيات إجراء حساس. أعد تسجيل الدخول عبر Google للمتابعة.'
                : 'Changing permissions is a sensitive action. Re-confirm with Google to continue.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label={ar ? 'إلغاء' : 'Cancel'}
            className="text-[#6e7a94] hover:text-[#d2d7e3] transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-[#263248] bg-[#0a0f18] px-4 py-3 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7a94] mb-1">
              {ar ? 'الإجراء' : 'Action'}
            </p>
            <p className="text-sm text-[#d2d7e3]">{actionLabel}</p>
          </div>

          {!GOOGLE_CLIENT_ID ? (
            <p className="text-sm text-[#f3a43a]">
              {ar
                ? 'تسجيل الدخول عبر Google غير مُهيأ على هذا الخادم، لذا لا يمكن تأكيد هذا الإجراء.'
                : 'Google sign-in is not configured on this server, so this action cannot be confirmed.'}
            </p>
          ) : (
            <>
              <div className="flex justify-center min-h-[44px]" ref={btnRef} />
              {!ready && (
                <p className="text-center text-xs text-[#6e7a94] mt-2">
                  {ar ? 'جارٍ تحميل Google...' : 'Loading Google...'}
                </p>
              )}
              {busy && (
                <p className="text-center text-xs text-[#00a859] mt-3">
                  {ar ? 'جارٍ الحفظ...' : 'Verifying and saving...'}
                </p>
              )}
            </>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/25 bg-red-950/25 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReauthDialog;
