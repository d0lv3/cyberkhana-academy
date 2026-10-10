import React from 'react';
import MarkdownUploader from './MarkdownUploader';

interface BilingualMarkdownProps {
  value: { en: string; ar: string };
  onChange: (value: { en: string; ar: string }) => void;
  /** Active language tab (controlled, so a preview pane can mirror it). */
  lang: 'en' | 'ar';
  onLangChange: (lang: 'en' | 'ar') => void;
  showLanguageTabs?: boolean;
}

/**
 * EN/AR tabbed markdown editor. Each language reuses the full MarkdownUploader
 * (upload, image insert, editor), so the body can be authored in both languages.
 * Arabic is optional — the renderer falls back to English.
 */
const BilingualMarkdown: React.FC<BilingualMarkdownProps> = ({ value, onChange, lang, onLangChange, showLanguageTabs = true }) => {
  return (
    <div className="space-y-2">
      {showLanguageTabs && <div role="group" aria-label="Markdown language" className="creator-toolbar flex flex-wrap max-w-full items-center gap-1 bg-[#0b1019] rounded-lg p-1 w-fit">
        {(['en', 'ar'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLangChange(l)}
            aria-pressed={lang === l}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              lang === l
                ? 'bg-[#1a2332] text-[#f3f6ff] border border-[#263248]'
                : 'text-[#8592ad] hover:text-[#d2d7e3]'
            }`}
          >
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
        <span className="px-2 text-[10px] text-[#8592ad]">
          {lang === 'en' ? 'Required' : 'Optional, falls back to English'}
        </span>
      </div>}
      {!showLanguageTabs && <p className="text-xs text-[#9aa5bf]">{lang === 'ar' ? 'العربية · محتوى اختياري، يُعرض الإنجليزي عند تركه فارغًا' : 'English · Lesson body'}</p>}

      <MarkdownUploader
        key={lang}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        value={value[lang]}
        onChange={(v) => onChange({ ...value, [lang]: v })}
        placeholder={
          lang === 'ar'
            ? '## عنوان القسم\n\nاشرح الموضوع هنا...'
            : '## Section heading\n\nExplain the topic here...'
        }
      />
    </div>
  );
};

export default BilingualMarkdown;
