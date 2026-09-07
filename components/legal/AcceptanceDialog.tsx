import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import type { LegalKeyPoint } from '../../data/legalTypes';

interface AcceptanceDialogProps {
  title: string;
  intro: string;
  points: LegalKeyPoint[];
  /** Hash link to the full document, e.g. '#/creator-agreement'. New tab. */
  docHref: string;
  docLabel: string;
  updated: string;
  confirmation: React.ReactNode;
  acceptLabel: string;
  /** Must reject on failure — the dialog stays open and shows the message. */
  onAccept: () => Promise<void>;
  secondaryLabel: string;
  onSecondary: () => void;
  footnote: string;
}

/**
 * A legal acceptance dialog that cannot be dismissed.
 *
 * There are exactly two ways out — accept, or the caller's secondary action —
 * so this renders its own backdrop, traps focus, locks the page behind it and
 * swallows Escape. No close button by design.
 *
 * A prompt, not a security boundary: acceptance is enforced independently on
 * the server, so removing this node from the DOM yields 403s, not access.
 */
const AcceptanceDialog: React.FC<AcceptanceDialogProps> = ({
  title,
  intro,
  points,
  docHref,
  docLabel,
  updated,
  confirmation,
  acceptLabel,
  onAccept,
  secondaryLabel,
  onSecondary,
  footnote,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    acceptRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keep Tab inside the dialog, and swallow Escape — there is no dismissing it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

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

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onAccept();
      // No success state: accepting removes the condition that renders this,
      // so the caller unmounts us.
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not save your acceptance — the server did not respond. Check your connection and try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1117]/92 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acceptance-title"
      aria-describedby="acceptance-intro"
      dir="ltr"
    >
      <div
        ref={panelRef}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#263248] bg-[#121a2a] shadow-2xl"
      >
        <div className="border-b border-[#1e293b] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3a43a]/20">
              <AlertTriangle size={19} className="text-[#f3a43a]" aria-hidden="true" />
            </span>
            <div>
              <h2 id="acceptance-title" className="text-xl font-bold text-[#f3f6ff] sm:text-2xl">
                {title}
              </h2>
              <p id="acceptance-intro" className="mt-1.5 text-sm leading-relaxed text-[#9aa5bf]">
                {intro}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <p className="text-sm font-semibold text-[#d2d7e3]">The parts that matter most:</p>

          <ul className="mt-4 space-y-4">
            {points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00a859]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#f3f6ff]">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#9aa5bf]">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <a
            href={docHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#00a859] underline underline-offset-4 transition-colors hover:text-[#9fef00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00]"
          >
            {docLabel}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <p className="mt-1 text-xs text-[#7c8aa6]">Opens in a new tab · Last updated {updated}</p>
        </div>

        <div className="border-t border-[#1e293b] bg-[#0f1624]/70 px-5 py-5 sm:px-7">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3"
            >
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <p className="text-sm leading-relaxed text-[#d2d7e3]">{confirmation}</p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onSecondary}
              disabled={submitting}
              className="h-12 rounded-full px-6 text-sm font-bold text-[#9aa5bf] transition-colors hover:bg-[#182235] hover:text-[#f3f6ff] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00] sm:w-48"
            >
              {secondaryLabel}
            </button>
            <button
              ref={acceptRef}
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#00a859] px-6 text-sm font-bold text-white transition-colors hover:bg-[#009a51] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00] sm:w-64"
            >
              {submitting && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
              {submitting ? 'Saving…' : acceptLabel}
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#7c8aa6]">{footnote}</p>
        </div>
      </div>
    </div>
  );
};

export default AcceptanceDialog;
