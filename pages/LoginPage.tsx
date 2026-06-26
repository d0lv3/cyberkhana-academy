import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, AlertTriangle } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

/** Set VITE_GOOGLE_CLIENT_ID to switch the page from the dev session to real Google sign-in. */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GSI_SCRIPT_ID = 'google-gsi-client';

/* Minimal typing for the Google Identity Services SDK. */
interface GsiSdk {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: 'popup' | 'redirect';
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

function getGsi(): GsiSdk | undefined {
  return (window as unknown as { google?: GsiSdk }).google;
}

/** Standard multicolor Google "G". */
const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 5.1 29.3 3 24 3 15.9 3 8.9 7.6 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 34C8.8 40.3 15.8 45 24 45z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.4 45 30.2 45 24c0-1.3-.1-2.6-.4-3.9z"
    />
  </svg>
);

/** Aurora backdrop — three blurred gradient orbs drifting on slow loops. */
const Aurora: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <motion.div
      animate={{ x: ['-10%', '8%', '-10%'], y: ['-6%', '6%', '-6%'] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-[22%] left-[8%] w-[58vw] h-[58vw] max-w-[720px] max-h-[720px] rounded-full bg-[#00a859]/[0.15] blur-[120px]"
    />
    <motion.div
      animate={{ x: ['10%', '-8%', '10%'], y: ['6%', '-5%', '6%'] }}
      transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[30%] -right-[10%] w-[44vw] h-[44vw] max-w-[560px] max-h-[560px] rounded-full bg-[#9fef00]/[0.06] blur-[110px]"
    />
    <motion.div
      animate={{ x: ['-6%', '7%', '-6%'], y: ['4%', '-6%', '4%'] }}
      transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -bottom-[28%] left-[28%] w-[52vw] h-[52vw] max-w-[660px] max-h-[660px] rounded-full bg-[#60a5fa]/[0.07] blur-[130px]"
    />
  </div>
);

/** BlurText-style heading: words blur+rise in with a stagger. */
const StaggerTitle: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <h1 className={className}>
    {text.split(' ').map((word, i) => (
      <motion.span
        key={`${word}-${i}`}
        initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
        className="inline-block"
      >
        {word}
        {' '}
      </motion.span>
    ))}
  </h1>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { lang, setLang } = useLang();
  const ar = lang === 'ar';

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  // Spotlight border: tracks the cursor over the card.
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });
  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  // Dev fallback (only shown when no Google client id is configured).
  const handleDevLogin = () => {
    void login();
  };

  const handleCredential = useCallback(
    (response: { credential: string }) => {
      setAuthFailed(false);
      loginWithGoogle(response.credential).catch(() => setAuthFailed(true));
    },
    [loginWithGoogle]
  );

  // Load the Google Identity Services SDK once.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const init = () => {
      const gsi = getGsi();
      if (!gsi) return;
      gsi.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        ux_mode: 'popup',
      });
      setGisReady(true);
    };

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
    script.onerror = () => setAuthFailed(true);
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)render the official Google button — re-runs on language switch.
  useEffect(() => {
    const gsi = getGsi();
    if (!gisReady || !gsi || !googleBtnRef.current) return;
    googleBtnRef.current.innerHTML = '';
    gsi.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
      locale: ar ? 'ar' : 'en',
    });
  }, [gisReady, ar]);

  return (
    <div className="min-h-screen bg-[#0a0e15] flex flex-col relative overflow-hidden">
      <Aurora />
      {/* fine noise-like vignette to ground the aurora */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,14,21,0.7))]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors"
        >
          <ArrowLeft size={15} className="rtl-flip" />
          {ar ? 'الرئيسية' : 'Home'}
        </button>
        <button
          onClick={() => setLang(ar ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9aa5bf] hover:text-[#9fef00] hover:bg-white/[0.04] transition-all"
        >
          <Globe size={14} />
          <span>{ar ? 'English' : 'العربية'}</span>
        </button>
      </header>

      {/* Centered auth */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[400px]">
          {/* Brand + heading */}
          <div className="text-center mb-9">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex justify-center mb-7"
            >
              <BrandLogo variant="full" loading="eager" className="h-10 w-auto max-w-[200px] object-contain" />
            </motion.div>
            <StaggerTitle
              text={ar ? 'سجّل الدخول أو أنشئ حسابًا' : 'Sign in or create an account'}
              className="text-2xl font-bold text-[#f3f6ff] leading-snug"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-sm text-[#9aa5bf] mt-2.5"
            >
              {ar
                ? 'بنقرة واحدة عبر Google — وتقدمك يتبعك على أي جهاز.'
                : 'One click with Google — your progress follows you on any device.'}
            </motion.p>
          </div>

          {/* Spotlight-border auth card */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
          >
            <div
              onMouseMove={handleCardMove}
              onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
              className="relative rounded-2xl p-px transition-all duration-300"
              style={{
                background: spot.active
                  ? `radial-gradient(240px circle at ${spot.x}% ${spot.y}%, rgba(159,239,0,0.5), rgba(38,50,72,0.65) 70%)`
                  : 'rgba(38,50,72,0.65)',
              }}
            >
              <div className="relative rounded-[15px] bg-[#0f1624]/95 backdrop-blur-sm p-7 sm:p-8 overflow-hidden">
                {/* inner glow following the cursor */}
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    opacity: spot.active ? 1 : 0,
                    background: `radial-gradient(340px circle at ${spot.x}% ${spot.y}%, rgba(0,168,89,0.09), transparent 65%)`,
                  }}
                />

                <div className="relative">
                  {GOOGLE_CLIENT_ID ? (
                    <>
                      {/* Official Google Identity Services button */}
                      <div className="flex justify-center min-h-[44px]" ref={googleBtnRef}>
                        {!gisReady && !authFailed && (
                          <div className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-white/90 text-[#1f2937] text-sm font-bold shadow-md opacity-70">
                            <GoogleIcon />
                            {ar ? 'جارٍ التحميل…' : 'Loading…'}
                          </div>
                        )}
                      </div>
                      {isLoading && (
                        <p className="text-center text-xs text-[#9aa5bf] mt-4">
                          {ar ? 'جارٍ تسجيل الدخول…' : 'Signing in…'}
                        </p>
                      )}
                      {authFailed && (
                        <p className="flex items-center justify-center gap-1.5 text-xs text-red-400 mt-4">
                          <AlertTriangle size={13} />
                          {ar
                            ? 'فشل تسجيل الدخول عبر Google. حاول مجددًا.'
                            : 'Google sign-in failed. Please try again.'}
                        </p>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleDevLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-white text-[#1f2937] text-sm font-bold hover:bg-[#f1f3f7] active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-wait"
                    >
                      <GoogleIcon />
                      {isLoading
                        ? ar
                          ? 'جارٍ تسجيل الدخول…'
                          : 'Signing in…'
                        : ar
                        ? 'المتابعة باستخدام Google'
                        : 'Continue with Google'}
                    </button>
                  )}

                  <p className="text-center text-[11px] text-[#4d5a73] mt-6 leading-relaxed">
                    {ar
                      ? 'بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية.'
                      : 'By continuing, you agree to the Terms of Use and Privacy Policy.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* First-time note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-center text-xs text-[#6e7a94] mt-6"
          >
            {ar
              ? 'جديد هنا؟ يُنشأ حسابك تلقائيًا عند أول تسجيل دخول.'
              : 'New here? Your account is created automatically on first sign-in.'}
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-[#4d5a73]">
        © 2026 CyberKhana Academy · {ar ? 'صُنعت في العراق' : 'Built in Iraq'}
      </footer>
    </div>
  );
};

export default LoginPage;
