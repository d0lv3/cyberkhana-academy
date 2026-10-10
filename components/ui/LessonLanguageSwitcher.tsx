import React from 'react';
import { Languages } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

/** Uses the saved academy preference without remounting the active lesson. */
export default function LessonLanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label={lang === 'ar' ? 'لغة الدرس' : 'Lesson language'} dir="ltr"
      className="flex shrink-0 items-center gap-1 rounded-lg border border-[#263248] bg-[#0b1019] p-1">
      <Languages size={14} aria-hidden="true" className="hidden xl:block mx-1 text-[#8592ad]" />
      {(['en', 'ar'] as const).map((language) => (
        <button key={language} type="button" lang={language} onClick={() => setLang(language)}
          aria-pressed={lang === language} aria-label={language === 'en' ? 'Read in English' : 'القراءة بالعربية'}
          className={`min-h-9 rounded-md px-2 sm:px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859] ${
            lang === language ? 'bg-[#00a859]/15 text-[#74dfac] shadow-sm' : 'text-[#9aa5bf] hover:bg-[#1a2332] hover:text-white'
          }`}>
          {language === 'en' ? 'English' : 'العربية'}
        </button>
      ))}
    </div>
  );
}
