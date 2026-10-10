import React from 'react';
import { CopyPlus } from 'lucide-react';
import MarkdownUploader from '../MarkdownUploader';
import { hasText, isFallback, otherLang, type Pair } from '../../../services/contentLang';
import { isBilingual, labelCls, LangTag, MissingMark, useTr, type EditingLanguage } from './fields';

interface LocalizedMarkdownFieldProps {
  label: string;
  value: Pair;
  onChange: (next: Pair) => void;
  editing: EditingLanguage;
  placeholder?: Pair;
}

/**
 * A markdown body, written in the language being edited.
 *
 * The long counterpart of LocalizedInput, used for a lesson's text and a lab's
 * brief. When the creator is translating, the other language's text sits
 * beside it as it was typed, markdown and all, since the headings and code
 * blocks are part of what has to be carried across.
 */
const LocalizedMarkdownField: React.FC<LocalizedMarkdownFieldProps> = ({ label, value, onChange, editing, placeholder }) => {
  const tr = useTr();
  const { lang } = editing;
  const other = otherLang(lang);
  const bilingual = isBilingual(editing);
  const missing = bilingual && isFallback(value, lang);
  const showReference = bilingual && editing.compare && hasText(value[other]);

  return (
    <div>
      <div className="mb-1.5 flex min-h-[20px] flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className={labelCls}>{label}</span>
        {missing && <MissingMark lang={lang} />}
      </div>
      <div className={showReference ? 'grid grid-cols-1 gap-4 2xl:grid-cols-2' : ''}>
        {showReference && (
          <div className="min-w-0">
            <div className="mb-2 flex min-h-[30px] items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[11px] font-semibold text-[#8592ad]">
                <LangTag lang={other} />
                {other === 'ar'
                  ? tr('The Arabic, for reference', 'النص العربي للمراجعة')
                  : tr('The English, for reference', 'النص الإنجليزي للمراجعة')}
              </span>
              {!hasText(value[lang]) && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [lang]: value[other] })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#263248] px-2 py-1 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-[#00a859]/40 hover:text-[#00a859]"
                >
                  <CopyPlus size={12} aria-hidden="true" />
                  {tr('Copy it over to translate', 'انسخه لتترجمه')}
                </button>
              )}
            </div>
            <pre
              dir={other === 'ar' ? 'rtl' : 'ltr'}
              lang={other}
              tabIndex={0}
              className={`max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#1c2740] bg-[#0d1420] px-4 py-3 text-xs text-[#9aa5bf] custom-scrollbar 2xl:max-h-[460px] ${
                other === 'ar' ? 'font-sans leading-6' : 'font-mono leading-relaxed'
              }`}
            >
              {value[other]}
            </pre>
          </div>
        )}
        <div className="min-w-0">
          <MarkdownUploader
            key={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            value={value[lang]}
            onChange={(v) => onChange({ ...value, [lang]: v })}
            placeholder={placeholder?.[lang]}
          />
        </div>
      </div>
    </div>
  );
};

export default LocalizedMarkdownField;
