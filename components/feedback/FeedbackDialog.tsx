import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, Send, CircleCheckBig, ShieldCheck } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { RATINGS, RATING_META, SCALE_ENDS } from './ratingScale';
import type { FeedbackContext, Rating } from '../../services/feedbackService';

/** Heading per surface, so the dialog names the thing that was just finished. */
const TRACK_HEADING: Record<
  FeedbackContext['track'],
  { title: { en: string; ar: string }; prompt: { en: string; ar: string } }
> = {
  programming: {
    title: { en: 'Module complete', ar: 'اكتملت الوحدة' },
    prompt: { en: 'How was this module?', ar: 'كيف كانت هذه الوحدة؟' },
  },
  networking: {
    title: { en: 'Lesson complete', ar: 'اكتمل الدرس' },
    prompt: { en: 'How was this lesson?', ar: 'كيف كان هذا الدرس؟' },
  },
  'os-modules': {
    title: { en: 'Module complete', ar: 'اكتملت الوحدة' },
    prompt: { en: 'How was this module?', ar: 'كيف كانت هذه الوحدة؟' },
  },
};

const COPY = {
  note: {
    en: 'Only the Academy team sees this.',
    ar: 'يراه فريق الأكاديمية وحده.',
  },
  skip: { en: 'Not now', ar: 'ليس الآن' },
  send: { en: 'Send feedback', ar: 'إرسال الملاحظة' },
  sending: { en: 'Sending', ar: 'جارٍ الإرسال' },
  thanks: { en: 'Thank you', ar: 'شكرًا لك' },
  thanksLine: {
    en: 'Your notes go straight to the creator behind this content.',
    ar: 'ملاحظاتك تصل مباشرة إلى منشئ هذا المحتوى.',
  },
  queued: {
    en: 'Saved on this device. It will be sent the moment you are back online.',
    ar: 'حُفظت على هذا الجهاز، وستُرسل فور عودة الاتصال.',
  },
  close: { en: 'Close', ar: 'إغلاق' },
  optional: { en: 'Optional', ar: 'اختياري' },
};

interface FeedbackDialogProps {
  context: FeedbackContext;
  /** Resolves true when the answer reached the server, false when it queued. */
  onSubmit: (rating: Rating, comment: string) => Promise<boolean>;
  onDismiss: () => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ context, onSubmit, onDismiss }) => {
  const { lang } = useLang();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  /** null while answering, then whether the answer reached the server. */
  const [sent, setSent] = useState<null | 'ok' | 'queued'>(null);

  const heading = TRACK_HEADING[context.track];
  const meta = rating ? RATING_META[rating] : null;

  const subtitle = useMemo(
    () => [context.contextTitle, context.contextSub].filter(Boolean).join(' · '),
    [context.contextTitle, context.contextSub]
  );

  /* Focus lands on the panel when it opens and goes back where it was on
     close, and Tab stays inside meanwhile. Same contract as ConfirmHost. */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = (
        Array.from(
          panel.querySelectorAll(
            'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
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
  }, [onDismiss]);

  /* The thank-you state is an acknowledgement, not a screen to read: it steps
     aside on its own, and the Close button is there for anyone faster. The
     queued line gets longer, because it is telling the reader something. */
  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(onDismiss, sent === 'ok' ? 1800 : 3400);
    return () => clearTimeout(timer);
  }, [sent, onDismiss]);

  const handleSend = async () => {
    if (!rating || sending) return;
    setSending(true);
    const delivered = await onSubmit(rating, comment);
    setSending(false);
    setSent(delivered ? 'ok' : 'queued');
  };

  return (
    /* Entrances are the app's own CSS keyframes rather than framer-motion:
       both are already answered for in the reduced-motion block in index.css,
       and a collapsed height there would hide the question entirely. */
    <div className="fixed inset-0 z-[65] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/65 backdrop-blur-sm"
        onClick={onDismiss}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="custom-scrollbar relative max-h-[92dvh] w-full animate-modal-enter overflow-y-auto rounded-t-2xl border border-[#263248] bg-[#121a2a] shadow-2xl shadow-black/60 focus:outline-none sm:max-w-md sm:rounded-2xl"
      >
        {/* A hairline of the chosen tone across the top: the one place the
            score colours the whole panel rather than a single control. */}
        <span
          className="absolute inset-x-0 top-0 h-0.5 transition-colors duration-200"
          style={{ backgroundColor: meta?.color ?? '#263248' }}
        />

        {sent ? (
          /* ── Acknowledgement ── */
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00a859]/30 bg-[#00a859]/10">
              <CircleCheckBig size={22} className="text-[#00a859]" />
            </div>
            <h2 className="text-base font-bold text-[#f3f6ff]">{COPY.thanks[lang]}</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-[#9aa5bf]">
              {sent === 'ok' ? COPY.thanksLine[lang] : COPY.queued[lang]}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-5 rounded-lg border border-[#263248] bg-[#1a2332] px-4 py-2 text-xs font-semibold text-[#9aa5bf] transition-colors hover:border-[#354562] hover:text-[#d2d7e3]"
            >
              {COPY.close[lang]}
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-start gap-3.5 border-b border-[#263248] px-5 py-4 sm:px-6">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#00a859]/25 bg-[#00a859]/10">
                <Check size={17} className="text-[#00a859]" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="feedback-title" className="text-sm font-bold text-[#f3f6ff]">
                  {heading.title[lang]}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 truncate text-[11px] text-[#8592ad]">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onDismiss}
                aria-label={COPY.close[lang]}
                className="-me-1.5 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#7c8aa6] transition-colors hover:bg-[#1a2332] hover:text-[#d2d7e3]"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── The scale ── */}
            <div className="px-5 pt-5 sm:px-6">
              <p className="text-sm font-semibold text-[#d2d7e3]">{heading.prompt[lang]}</p>

              {/* Held LTR in both languages: 1 is always the low end, the way
                  every numeric scale in the Academy is read. */}
              <div dir="ltr" className="relative mt-4">
                <span className="pointer-events-none absolute inset-x-[22px] top-[22px] h-px bg-[#263248]" />
                <span
                  className="pointer-events-none absolute left-[22px] top-[22px] h-px transition-[width,background-color] duration-200"
                  style={{
                    width: rating ? `calc((100% - 44px) * ${(rating - 1) / 4})` : '0px',
                    backgroundColor: meta?.color ?? 'transparent',
                  }}
                />
                <div className="relative flex items-center justify-between">
                  {RATINGS.map((value) => {
                    const active = rating === value;
                    const tone = RATING_META[value].color;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-pressed={active}
                        aria-label={`${value} / 5, ${RATING_META[value].label[lang]}`}
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border font-mono text-sm transition-all duration-150 ${
                          active
                            ? 'scale-110 border-2 font-black'
                            : 'border-[#2a3346] bg-[#0e1522] font-bold text-[#8592ad] hover:border-[#3d4a68] hover:bg-[#172033] hover:text-[#d2d7e3]'
                        }`}
                        style={
                          active
                            ? { borderColor: tone, backgroundColor: `${tone}1f`, color: tone }
                            : undefined
                        }
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#7c8aa6]">
                  <span>{SCALE_ENDS.worst[lang]}</span>
                  <span>{SCALE_ENDS.best[lang]}</span>
                </div>
              </div>
            </div>

            {/* ── The question, and the box it asks to be answered in ── */}
            {meta && (
              <div key={rating} className="animate-fade-in px-5 pt-5 sm:px-6">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <label
                    htmlFor="feedback-comment"
                    className="text-[13px] font-semibold leading-snug text-[#f3f6ff]"
                  >
                    {meta.question[lang]}
                  </label>
                  <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#7c8aa6]">
                    {COPY.optional[lang]}
                  </span>
                </div>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder={meta.placeholder[lang]}
                  className="w-full resize-none rounded-xl border border-[#263248] bg-[#0b1019] px-3.5 py-3 text-sm leading-relaxed text-[#e5e9f0] transition-colors placeholder:text-[#6e7a94] focus:border-[#00a859]/50 focus:outline-none"
                />
              </div>
            )}

            {/* ── Footer ── */}
            {/* The note takes a line of its own rather than a column beside
                the buttons: the panel is 448px at its widest, and sharing that
                row left it wrapping three words at a time on a phone. */}
            <div className="mt-5 flex flex-col gap-3 border-t border-[#263248] px-5 py-4 sm:px-6">
              <p className="flex items-center gap-1.5 text-[10px] leading-tight text-[#7c8aa6]">
                <ShieldCheck size={12} className="flex-shrink-0" />
                <span>{COPY.note[lang]}</span>
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-[#8592ad] transition-colors hover:bg-[#1a2332] hover:text-[#d2d7e3]"
                >
                  {COPY.skip[lang]}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!rating || sending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a859] px-3.5 py-2 text-xs font-bold text-[#0d1117] transition-colors hover:bg-[#00934e] disabled:cursor-not-allowed disabled:bg-[#1a2332] disabled:text-[#6e7a94]"
                >
                  <Send size={13} />
                  {sending ? COPY.sending[lang] : COPY.send[lang]}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackDialog;
