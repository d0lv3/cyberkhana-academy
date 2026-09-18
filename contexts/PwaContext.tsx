import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_UNTIL = 'academy-install-dismissed-until';
const DAY = 24 * 60 * 60 * 1000;
function isSnoozed() {
  try { return Number(localStorage.getItem(DISMISSED_UNTIL)) > Date.now(); }
  catch { return false; }
}

const PwaContext = createContext({
  visible: false, canPrompt: false, ios: false, busy: false,
  dismiss: () => {},
  install: async (): Promise<boolean> => false,
});

/** Keep the one-use browser event alive across page navigation. */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const deferred = useRef<InstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [snoozed, setSnoozed] = useState(isSnoozed);
  const [busy, setBusy] = useState(false);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const snooze = (days: number) => {
    try { localStorage.setItem(DISMISSED_UNTIL, String(Date.now() + days * DAY)); } catch { /* Keep session-only dismissal. */ }
    setSnoozed(true);
  };

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 767px) and (pointer: coarse)');
    const standalone = window.matchMedia('(display-mode: standalone)');
    const updatePhone = () => setMobile(phone.matches);
    const updateStandalone = () => setInstalled(standalone.matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const capture = (event: Event) => {
      // Leave the browser's desktop promotion available.
      if (phone.matches) event.preventDefault();
      deferred.current = event as InstallPromptEvent;
      setCanPrompt(true);
    };
    const completed = () => {
      deferred.current = null;
      setCanPrompt(false);
      setInstalled(true);
      snooze(180);
    };
    updatePhone();
    updateStandalone();
    phone.addEventListener('change', updatePhone);
    standalone.addEventListener('change', updateStandalone);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', completed);
    return () => {
      phone.removeEventListener('change', updatePhone);
      standalone.removeEventListener('change', updateStandalone);
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', completed);
    };
  }, []);

  const install = async () => {
    const event = deferred.current;
    if (!event || busy) return false;
    deferred.current = null;
    setCanPrompt(false);
    setBusy(true);
    try {
      // Call from the click while transient user activation is still available.
      await event.prompt();
      const { outcome } = await event.userChoice;
      snooze(outcome === 'accepted' ? 180 : 14);
      return true;
    } catch {
      return false; // Offer manual steps if the browser withdrew the prompt.
    } finally {
      setBusy(false);
    }
  };

  return (
    <PwaContext.Provider value={{ visible: mobile && !installed && !snoozed, canPrompt, ios, busy, dismiss: () => snooze(14), install }}>
      {children}
    </PwaContext.Provider>
  );
}

export const usePwa = () => useContext(PwaContext);
