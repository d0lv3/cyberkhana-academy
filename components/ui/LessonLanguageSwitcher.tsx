import { Languages } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { useLessonLanguage } from './LessonLanguage';

const NAME = { en: 'English', ar: 'العربية' } as const;

/**
 * The language this lesson is read in.
 *
 * It changes the lesson and nothing else: the Academy around it, and the
 * language saved for it, stay as they were (components/ui/LessonLanguage.tsx).
 * A lesson that exists in one language has nothing to switch, so it says which
 * one it is in instead of offering a button that would do nothing.
 */
export default function LessonLanguageSwitcher() {
  const site = useLang();
  const lesson = useLessonLanguage();
  const lang = lesson?.lang ?? site.lang;
  const offered = lesson?.offered ?? (['en', 'ar'] as const);
  const choose = lesson?.choose ?? site.setLang;

  if (offered.length < 2) {
    const only = offered[0] ?? 'en';
    const note =
      only === 'ar'
        ? lang === 'ar' ? 'هذا المحتوى متوفر بالعربية فقط' : 'This is available in Arabic only'
        : lang === 'ar' ? 'هذا المحتوى متوفر بالإنجليزية فقط' : 'This is available in English only';
    return (
      <span
        dir="ltr"
        title={note}
        role="img"
        aria-label={note}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#263248] bg-[#0b1019] px-2.5 py-1.5 text-xs font-semibold text-[#9aa5bf]"
      >
        <Languages size={14} aria-hidden="true" className="text-[#8592ad]" />
        <span lang={only} aria-hidden="true">{NAME[only]}</span>
      </span>
    );
  }

  return (
    <div role="group" aria-label={lang === 'ar' ? 'لغة الدرس' : 'Lesson language'} dir="ltr"
      className="flex shrink-0 items-center gap-1 rounded-lg border border-[#263248] bg-[#0b1019] p-1">
      <Languages size={14} aria-hidden="true" className="hidden xl:block mx-1 text-[#8592ad]" />
      {(['en', 'ar'] as const).map((language) => (
        <button key={language} type="button" lang={language} onClick={() => choose(language)}
          aria-pressed={lang === language} aria-label={language === 'en' ? 'Read this lesson in English' : 'اقرأ هذا الدرس بالعربية'}
          className={`min-h-9 rounded-md px-2 sm:px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859] ${
            lang === language ? 'bg-[#00a859]/15 text-[#74dfac] shadow-sm' : 'text-[#9aa5bf] hover:bg-[#1a2332] hover:text-white'
          }`}>
          {NAME[language]}
        </button>
      ))}
    </div>
  );
}
