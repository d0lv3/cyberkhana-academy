import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' = red confirm (deletes) · 'default' = green confirm (overwrites etc.) */
  tone?: 'danger' | 'default';
}

type Trigger = (opts: ConfirmOptions) => Promise<boolean>;
let trigger: Trigger | null = null;

/**
 * Styled replacement for window.confirm. Resolves true/false.
 * Requires <ConfirmHost /> to be mounted once at the app root.
 */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === 'string' ? { message: options } : options;
  if (trigger) return trigger(opts);
  // Fallback if the host isn't mounted (tests, storybook…)
  return Promise.resolve(window.confirm(opts.message));
}

const ConfirmHost: React.FC = () => {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Whatever had focus when confirmDialog() was called, so it can be handed
   *  back when the dialog closes. */
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    trigger = (o) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false); // dismiss any prior dialog
        resolverRef.current = resolve;
        /* Captured HERE, not in the effect that reacts to `opts`. React applies
           the dialog's autoFocus during commit — before that effect runs — so
           reading document.activeElement there returns a button inside the
           dialog, and closing would "restore" focus to a node being unmounted,
           dropping it to <body>. At this point nothing has rendered yet, so
           this is still whatever the user actually pressed. */
        restoreFocusRef.current = document.activeElement as HTMLElement | null;
        setOpts(o);
      });
    return () => {
      trigger = null;
    };
  }, []);

  const close = useCallback((v: boolean) => {
    resolverRef.current?.(v);
    resolverRef.current = null;
    setOpts(null);
  }, []);

  useEffect(() => {
    if (!opts) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(false);
        return;
      }
      if (e.key !== 'Tab') return;
      // Keep Tab inside the dialog. Queried per keypress so it stays correct
      // if the contents change.
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = (
        Array.from(
          panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        ) as HTMLElement[]
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [opts, close]);

  if (!opts) return null;
  const danger = (opts.tone ?? 'danger') === 'danger';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => close(false)} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-sm rounded-2xl border border-[#263248] bg-[#121a2a] p-6 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              danger ? 'bg-red-500/10 border-red-500/25' : 'bg-[#f3a43a]/10 border-[#f3a43a]/25'
            }`}
          >
            <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-[#f3a43a]'} />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-title" className="text-sm font-bold text-[#f3f6ff]">
              {opts.title ?? 'Are you sure?'}
            </h3>
            <p id="confirm-message" className="text-xs text-[#9aa5bf] mt-1.5 leading-relaxed">
              {opts.message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          {/* On a destructive dialog the SAFE action takes initial focus, not
              the destructive one — otherwise a reflexive Enter deletes
              something. Non-destructive dialogs keep Confirm focused. */}
          <button
            type="button"
            autoFocus={danger}
            onClick={() => close(false)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#9aa5bf] bg-[#1a2332] border border-[#263248] hover:text-[#d2d7e3] hover:border-[#354562] transition-all"
          >
            {opts.cancelLabel ?? 'Cancel'}
          </button>
          {/* White on red-500/90 measured 3.76:1 and on #00a859 3.11:1 — both
              under AA. red-600 is 4.83:1, #007a42 is 5.44:1. */}
          <button
            type="button"
            autoFocus={!danger}
            onClick={() => close(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-all ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#007a42] hover:bg-[#006635]'
            }`}
          >
            {opts.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmHost;
