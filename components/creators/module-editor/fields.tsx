import React, { useId } from 'react';
import { CopyPlus } from 'lucide-react';
import { useLang } from '../../../contexts/LangContext';
import { hasText, otherLang, type Lang, type Pair } from '../../../services/contentLang';

/* ─── Writing a module in two languages ───
 *
 * The pieces every tab of the module editor is built from. A creator writes in
 * one language at a time, chosen once for the whole editor (EditingLanguage),
 * and every text field shows that language. When they are translating, each
 * field can show what the other language says underneath it, and take it over
 * as a starting point.
 */

/** Which language the editor is writing in, and what else it knows. */
export interface EditingLanguage {
  /** The language every text field is showing. */
  lang: Lang;
  /** The module's languages, the main one first. */
  languages: Lang[];
  /** Show the other language beside each field. */
  compare: boolean;
}

export const fieldCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

export const labelCls = 'block text-xs font-semibold text-[#9aa5bf]';

/** The Studio's own wording follows the interface language, whatever language
 *  the module is being written in. */
export function useTr(): (en: string, ar: string) => string {
  const { isArabic } = useLang();
  return (en, ar) => (isArabic ? ar : en);
}

/** The language the Studio itself is being used in. */
export function useInterfaceLang(): Lang {
  return useLang().isArabic ? 'ar' : 'en';
}

/** Is the module written in both languages? */
export const isBilingual = (editing: EditingLanguage): boolean => editing.languages.length === 2;

/** A two-letter mark for a language, for the tight spots a name will not fit. */
export const LangTag: React.FC<{ lang: Lang; className?: string }> = ({ lang, className = '' }) => (
  <span
    className={`inline-flex h-[18px] min-w-[22px] flex-shrink-0 items-center justify-center rounded border border-[#263248] bg-[#121a2a] px-1 text-[10px] font-bold leading-none text-[#8592ad] ${className}`}
    aria-hidden="true"
  >
    {lang === 'en' ? 'EN' : 'ع'}
  </span>
);

/** "Not translated yet", beside a field that has the other language only. */
export const MissingMark: React.FC<{ lang: Lang }> = ({ lang }) => {
  const tr = useTr();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f3a43a]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#f3a43a]" aria-hidden="true" />
      {lang === 'ar' ? tr('No Arabic yet', 'بلا عربية بعد') : tr('No English yet', 'بلا إنجليزية بعد')}
    </span>
  );
};

/** What the other language says, under the field being written. */
export const Reference: React.FC<{
  text: string;
  /** The language `text` is in. */
  lang: Lang;
  /** Offered when the field above is still empty. */
  onCopy?: () => void;
  mono?: boolean;
}> = ({ text, lang, onCopy, mono = false }) => {
  const tr = useTr();
  if (!hasText(text)) return null;
  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-md border border-[#1c2740] bg-[#0d1420] px-2.5 py-1.5">
      <LangTag lang={lang} className="mt-px" />
      <span
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        lang={lang}
        className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-[#9aa5bf] ${mono ? 'font-mono' : ''}`}
      >
        {text}
      </span>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          title={tr('Copy it here to translate', 'انسخه هنا لترجمته')}
          aria-label={tr('Copy it here to translate', 'انسخه هنا لترجمته')}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[#7c8aa6] transition-colors hover:bg-[#182235] hover:text-[#00a859]"
        >
          <CopyPlus size={13} />
        </button>
      )}
    </div>
  );
};

interface LocalizedInputProps {
  label?: string;
  value: Pair;
  onChange: (next: Pair) => void;
  editing: EditingLanguage;
  multiline?: boolean;
  rows?: number;
  /** Has to be filled in the module's main language. */
  required?: boolean;
  placeholder?: Pair;
  /** A line of help under the field. */
  hint?: string;
  inputClassName?: string;
  'aria-label'?: string;
}

/**
 * One text, written in the language being edited.
 *
 * It replaces the two boxes side by side: with both languages always on screen
 * a creator working in one of them had to read past the other at every field,
 * and the lesson body, which had no room for two boxes, played by a different
 * rule. Here every field plays by the same one.
 */
export const LocalizedInput: React.FC<LocalizedInputProps> = ({
  label,
  value,
  onChange,
  editing,
  multiline = false,
  rows = 3,
  required = false,
  placeholder,
  hint,
  inputClassName = '',
  'aria-label': ariaLabel,
}) => {
  const id = useId();
  const { lang } = editing;
  const other = otherLang(lang);
  const text = value[lang] ?? '';
  const reference = value[other] ?? '';
  const untranslated = isBilingual(editing) && !hasText(text) && hasText(reference);
  const showReference = isBilingual(editing) && editing.compare && hasText(reference);
  // With nothing written yet, the other language's text is the best hint of
  // what belongs here.
  const hintText = untranslated && !showReference ? reference : placeholder?.[lang] ?? '';
  const set = (next: string) => onChange({ ...value, [lang]: next });
  const shared = {
    id,
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.value),
    placeholder: hintText,
    dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const),
    lang,
    'aria-label': label ? undefined : ariaLabel,
    className: `${fieldCls} ${inputClassName}`,
  };

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex min-h-[20px] flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label htmlFor={id} className={labelCls}>
            {label}
            {required && lang === editing.languages[0] && <span className="ms-1 text-[#00a859]">*</span>}
          </label>
          {untranslated && <MissingMark lang={lang} />}
        </div>
      )}
      {multiline ? <textarea {...shared} rows={rows} className={`${shared.className} resize-none`} /> : <input type="text" {...shared} />}
      {showReference && <Reference text={reference} lang={other} onCopy={hasText(text) ? undefined : () => set(reference)} />}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-[#8592ad]">{hint}</p>}
    </div>
  );
};

/** A language's own name for itself. */
export const nativeName = (lang: Lang): string => (lang === 'ar' ? 'العربية' : 'English');
