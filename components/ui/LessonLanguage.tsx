import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Languages } from 'lucide-react';
import { LangScope, useLang } from '../../contexts/LangContext';
import type { Lang } from '../../services/contentLang';

/* ─── The language a lesson is read in ───
 *
 * A lesson page has a language of its own, apart from the Academy's. It starts
 * out as the Academy's, and the switch in the lesson's header changes it for
 * the lesson alone: the menus, the dashboard and the saved preference stay as
 * they were. Someone browsing in English can read one module in Arabic and
 * come back out to an English Academy.
 *
 * The page wraps itself in LessonLanguageScope, and everything inside reads
 * `useLang()` as it always has. What it gets back is the lesson's language.
 *
 * A lesson can also say which languages it exists in (useLessonLanguages). One
 * written in Arabic alone has nothing to switch to, so its header says which
 * language it is in instead. The page around it stays in the reader's own
 * language: the buttons are theirs to read, whatever the lesson is written in.
 */

interface LessonLanguage {
  /** The language the lesson is being read in. */
  lang: Lang;
  /** The languages this lesson exists in, the main one first. */
  offered: Lang[];
  choose: (lang: Lang) => void;
  declare: (languages: Lang[]) => void;
  /** The language of the Academy around the lesson. */
  siteLang: Lang;
}

const LessonLanguageContext = createContext<LessonLanguage | null>(null);

const BOTH: Lang[] = ['en', 'ar'];

/* The choice lasts for the visit and belongs to the Academy language it was
   made under: someone who then switches the whole Academy to Arabic has said
   what they want everywhere, and an older "read this in English" is over. */
const CHOICE_KEY = 'academy-lesson-language';

function readChoice(siteLang: Lang): Lang | null {
  try {
    const raw = sessionStorage.getItem(CHOICE_KEY);
    const saved = raw ? (JSON.parse(raw) as { site?: unknown; lesson?: unknown }) : null;
    if (saved?.site === siteLang && (saved.lesson === 'en' || saved.lesson === 'ar')) return saved.lesson;
  } catch {
    /* storage unavailable: the lesson simply follows the Academy */
  }
  return null;
}

export function LessonLanguageScope({ children }: { children: React.ReactNode }) {
  const { lang: siteLang } = useLang();
  const [offered, setOffered] = useState<Lang[]>(BOTH);
  const [choice, setChoice] = useState<Lang | null>(() => readChoice(siteLang));

  useEffect(() => {
    setChoice(readChoice(siteLang));
  }, [siteLang]);

  const choose = useCallback(
    (next: Lang) => {
      setChoice(next);
      try {
        sessionStorage.setItem(CHOICE_KEY, JSON.stringify({ site: siteLang, lesson: next }));
      } catch {
        /* the choice still holds for this page */
      }
    },
    [siteLang]
  );

  const declare = useCallback((languages: Lang[]) => {
    setOffered((prev) => (prev.join() === languages.join() ? prev : languages));
  }, []);

  /* A choice made on another lesson holds here only if this one has that
     language. Otherwise the page is in the Academy's, and what the lesson
     lacks is shown in the language it does have. */
  const lang = choice && offered.includes(choice) ? choice : siteLang;
  const value = useMemo(() => ({ lang, offered, choose, declare, siteLang }), [lang, offered, choose, declare, siteLang]);

  return (
    <LessonLanguageContext.Provider value={value}>
      <LangScope lang={lang}>{children}</LangScope>
    </LessonLanguageContext.Provider>
  );
}

/** The lesson's language and what it can be switched to. Null outside a lesson. */
export const useLessonLanguage = (): LessonLanguage | null => useContext(LessonLanguageContext);

/**
 * Tell the page which languages this lesson exists in. Before paint, so a
 * module written in Arabic alone never flashes up in English first.
 */
export function useLessonLanguages(languages: Lang[]): void {
  const lesson = useContext(LessonLanguageContext);
  const declare = lesson?.declare;
  const key = languages.join();
  useLayoutEffect(() => {
    declare?.(key.split(',').filter((l): l is Lang => l === 'en' || l === 'ar'));
  }, [declare, key]);
}

/** Give a lesson page a language of its own. */
export function withLessonLanguage<P extends object>(Page: React.ComponentType<P>): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <LessonLanguageScope>
      <Page {...props} />
    </LessonLanguageScope>
  );
  Wrapped.displayName = `WithLessonLanguage(${Page.displayName || Page.name || 'Page'})`;
  return Wrapped;
}

/**
 * A line telling the reader why what they see is not in the language they
 * asked for. Quiet, because it is information and nothing is wrong, but always
 * there: the alternative was a page that changed language part of the way down
 * without a word.
 */
export const LanguageNotice: React.FC<{ children: React.ReactNode; lang?: Lang }> = ({ children, lang }) => (
  <p
    role="note"
    dir={lang ? (lang === 'ar' ? 'rtl' : 'ltr') : undefined}
    lang={lang}
    className="flex items-start gap-2.5 rounded-lg border border-[#263248] bg-[#121a2a] px-4 py-2.5 text-xs leading-relaxed text-[#9aa5bf]"
  >
    <Languages size={14} className="mt-0.5 flex-shrink-0 text-[#8592ad]" aria-hidden="true" />
    <span>{children}</span>
  </p>
);
