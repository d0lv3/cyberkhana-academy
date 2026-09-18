import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /* A click only counts as "on the backdrop" if it STARTED there. Without this,
     selecting text inside a form and releasing past the panel edge resolves the
     click on the backdrop and throws the entry away. */
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();

  /* Callers pass an inline arrow for onClose, so its identity changes on every
     render. Depending on it directly would re-run the effect below constantly —
     re-focusing the panel out from under whatever the user was typing in, and
     firing the focus-restore cleanup on every keystroke. Read it through a ref
     so the effect depends on isOpen alone. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the panel itself rather than guessing at a control inside it, so a
    // screen reader announces the dialog before its contents.
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      // Queried on every Tab, not cached, so content that appears after open
      // (an expanded section, a newly rendered row) is included.
      const focusable = (
        Array.from(
          panel.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ) as HTMLElement[]
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onMouseDown={(e) => { pressStartedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) onClose();
        pressStartedOnBackdrop.current = false;
      }}
    >
      <div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Dialog'} tabIndex={-1}
        className={`mobile-dialog-panel bg-[#121a2a] border border-[#263248] rounded-lg shadow-xl w-full ${className || 'max-w-md'} animate-modal-enter relative`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center px-4 pt-4 sm:px-6 sm:pt-6 pb-0 mb-4">
            <h2 id={titleId} className="text-xl font-bold text-[#f3f6ff]">{title}</h2>
            <button type="button" aria-label="Close dialog" onClick={onClose} className="min-h-tap min-w-tap inline-flex items-center justify-center shrink-0 text-[#8592ad] hover:text-[#d2d7e3] transition-colors">
              <X size={24} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            type="button" aria-label="Close dialog"
            className="absolute top-2 end-2 min-h-tap min-w-tap inline-flex items-center justify-center text-[#8592ad] hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}
        <div className={`p-4 sm:p-6 ${title ? 'pt-0 sm:pt-0' : 'pt-14 sm:pt-14'}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
