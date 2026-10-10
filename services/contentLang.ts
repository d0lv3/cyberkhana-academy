/* ─── Content in two languages ───
 *
 * The Academy is read in English and in Arabic, and a module can be written in
 * either, or in both. This file is the one rule for that, shared by the Studio
 * and by everything a learner reads:
 *
 *   - Every text a learner reads has an English slot and an Arabic slot. Which
 *     slot is which never depends on the module: `title` is English and
 *     `titleAr` is Arabic, `{ en, ar }` means what it says.
 *   - A module says which languages it is written in, the main one first
 *     (`languages`). Only the main one has to be complete.
 *   - Whoever reads in a language a text does not have gets the other one. With
 *     two languages that is the same as "falls back to the main language", and
 *     it holds in both directions, for every text.
 *
 * It imports nothing, so the services, the Studio and the lesson pages can all
 * use it without pulling each other in.
 */

export type Lang = 'en' | 'ar';

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'ar' : 'en');

/** A text held in both languages. Either side may be empty. */
export interface Pair {
  en: string;
  ar: string;
}

export const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** Two sibling fields (`title`, `titleAr`) as one pair. */
export const pairOf = (en?: string | null, ar?: string | null): Pair => ({ en: en ?? '', ar: ar ?? '' });

/** The text in exactly this language, or nothing. */
export function exactText(pair: Partial<Pair> | string | null | undefined, lang: Lang): string {
  if (!pair) return '';
  // A bare string predates the pairs, and was always English.
  if (typeof pair === 'string') return lang === 'en' ? pair : '';
  const own = pair[lang];
  return hasText(own) ? own : '';
}

/** The text a reader in `lang` gets: their language, or the other one when
 *  theirs was never written. */
export function pickText(pair: Partial<Pair> | string | null | undefined, lang: Lang): string {
  return exactText(pair, lang) || exactText(pair, otherLang(lang));
}

/** Is the reader being shown the other language because theirs is missing? */
export function isFallback(pair: Partial<Pair> | string | null | undefined, lang: Lang): boolean {
  return !exactText(pair, lang) && !!exactText(pair, otherLang(lang));
}

/** What each language is called, in each language. */
export const LANGUAGE_NAME: Record<Lang, Pair> = {
  en: { en: 'English', ar: 'الإنجليزية' },
  ar: { en: 'Arabic', ar: 'العربية' },
};

/** A language's own name for itself, which is how a switch labels it. */
export const NATIVE_NAME: Record<Lang, string> = { en: 'English', ar: 'العربية' };

/* ── The languages of a module ── */

/** One or two languages, the main one first. */
export function readLanguages(value: unknown): Lang[] | null {
  if (!Array.isArray(value)) return null;
  const seen: Lang[] = [];
  for (const item of value) {
    if ((item === 'en' || item === 'ar') && !seen.includes(item)) seen.push(item);
  }
  return seen.length ? seen : null;
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): Rec[] => (Array.isArray(v) ? v.filter(isRec) : []);

/** Does this module carry any Arabic of its own? Looked for in what the viewer
 *  reads and in what the Studio edits, since an older module has no list of
 *  languages to ask. Every place Arabic could have been written counts, a
 *  lab's brief included: a module read as English-only stops sending its
 *  Arabic the next time it is saved, so missing one here would drop a
 *  translation somebody made. */
function carriesArabic(mod: Rec): boolean {
  const pairHasArabic = (value: unknown) => isRec(value) && hasText(value.ar);
  const labHasArabic = (lab: unknown) => isRec(lab) && (pairHasArabic(lab.brief) || hasText(lab.titleAr));
  if (pairHasArabic(mod.title) || pairHasArabic(mod.description)) return true;
  const course = isRec(mod.courseData) ? mod.courseData : {};
  for (const chapter of list(course.modules)) {
    if (hasText(chapter.titleAr)) return true;
    for (const lecture of list(chapter.lectures)) {
      if (hasText(lecture.titleAr) || hasText(lecture.subtitleAr)) return true;
      if (pairHasArabic(lecture.markdownContent) || labHasArabic(lecture.lab)) return true;
    }
  }
  for (const chapter of list(mod.chapters)) {
    if (hasText(chapter.titleAr)) return true;
    for (const section of list(chapter.sections)) {
      if (hasText(section.titleAr) || hasText(section.subtitleAr) || pairHasArabic(section.markdownContent)) return true;
    }
  }
  return list(mod.labs).some(labHasArabic);
}

/**
 * The languages a module is written in, the main one first.
 *
 * A module saved by the current Studio says so itself. One saved before that
 * was written English first, with Arabic wherever some was added. A built-in
 * course is not asked: it ships in both.
 */
export function moduleLanguages(mod: unknown): Lang[] {
  if (!isRec(mod)) return ['en', 'ar'];
  const declared = readLanguages(mod.languages);
  if (declared) return declared;
  if (mod.isCreatorContent !== true) return ['en', 'ar'];
  return carriesArabic(mod) ? ['en', 'ar'] : ['en'];
}

/** Is the module offered in this language at all? */
export const offersLanguage = (languages: Lang[], lang: Lang): boolean => languages.includes(lang);

/** The language a reader lands on: theirs when the module has it, otherwise
 *  the module's main one. */
export const landingLanguage = (languages: Lang[], wanted: Lang): Lang =>
  languages.includes(wanted) ? wanted : languages[0] ?? 'en';

/**
 * A module's own title or description for a reader in `lang`.
 *
 * In a module written in one language that language is the answer whoever is
 * asking: a title left over in the other one from before is not part of what
 * the module offers, and showing it would promise lessons that are not there.
 */
export function moduleText(mod: unknown, text: Partial<Pair> | string | null | undefined, lang: Lang): string {
  return pickText(text, landingLanguage(moduleLanguages(mod), lang));
}

/** The chapter the Studio makes for the labs placed at the end of a module. It
 *  was named in English alone until the Studio learnt to name it in both. */
const LABS_CHAPTER_ARABIC: Record<string, string> = { Lab: 'المختبر', Labs: 'المختبرات' };

/**
 * A module's course with its labs chapter named in Arabic too.
 *
 * Only for modules saved before that name was written in both languages; a
 * course that needs nothing comes back as the very same object.
 */
export function withLabsChapterNamed<T>(course: T): T {
  if (!isRec(course) || !Array.isArray(course.modules)) return course;
  let changed = false;
  const modules = course.modules.map((chapter) => {
    if (!isRec(chapter) || hasText(chapter.titleAr)) return chapter;
    if (typeof chapter.id !== 'string' || !chapter.id.endsWith('-labs')) return chapter;
    const arabic = typeof chapter.title === 'string' ? LABS_CHAPTER_ARABIC[chapter.title] : undefined;
    if (!arabic) return chapter;
    changed = true;
    return { ...chapter, titleAr: arabic };
  });
  return changed ? ({ ...course, modules } as T) : course;
}
