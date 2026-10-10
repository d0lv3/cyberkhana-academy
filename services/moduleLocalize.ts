/* ─── A module's two languages, from the Studio to the learner ───
 *
 * The Studio keeps exactly what the creator typed: each text in its English
 * slot, its Arabic slot, or both (`chapters`, `labs`). What learners are sent
 * (`courseData`) is worked out from that here, once, when the module is saved:
 *
 *   - A module written in one language sends that language alone. Whatever was
 *     typed in the other stays in the Studio, so switching back loses nothing.
 *   - A module written in both sends both, and where one is missing the first
 *     slot carries the other. So the plain `title` of a lesson is never empty,
 *     and everything that reads it without asking for a language (the server's
 *     scoring, a list of lessons, an older page) still has a name to show.
 *
 * The second half of the file answers the Studio's own question: what is left
 * to translate, and where.
 */

import { exactText, hasText, otherLang, pairOf, type Lang, type Pair } from './contentLang';
import {
  toLocalizedMarkdown,
  type CreatorModuleChapter,
  type CreatorModuleSection,
  type LocalizedMarkdown,
  type LocalizedQuizQuestion,
} from './creatorTypes';
import type { LabFlag, LabLink, ModuleLab } from './labTypes';

/* ── What learners are sent ── */

/** One text as it is sent: the first slot for whoever asks for no language in
 *  particular, the Arabic slot for Arabic. */
export function servedText(text: Pair, languages: Lang[]): { text: string; textAr: string } {
  const en = text.en.trim();
  const ar = text.ar.trim();
  if (languages.length === 1) return languages[0] === 'ar' ? { text: ar, textAr: ar } : { text: en, textAr: '' };
  return { text: en || ar, textAr: ar };
}

/** A lesson body or a lab brief as it is sent. */
export function servedBody(body: LocalizedMarkdown | undefined | null, languages: Lang[]): Pair {
  const pair = toLocalizedMarkdown(body);
  if (languages.length === 1) return languages[0] === 'ar' ? { en: '', ar: pair.ar } : { en: pair.en, ar: '' };
  return pair;
}

/** A cleaned quiz as it is sent and marked. Every question keeps a wording and
 *  every option a text in the first slot, since that is what the server marks
 *  against and what an older page shows. */
export function servedQuiz(quiz: LocalizedQuizQuestion[], languages: Lang[]): LocalizedQuizQuestion[] {
  const arabic = languages.includes('ar');
  return quiz.map((q) => {
    const question = servedText(pairOf(q.question, q.questionAr), languages);
    if (q.kind === 'text') {
      const answer = servedText(pairOf(q.answer, q.answerAr), languages);
      return {
        question: question.text,
        kind: 'text' as const,
        options: [],
        correctIndex: 0,
        answer: answer.text,
        ...(arabic && question.textAr && question.textAr !== question.text ? { questionAr: question.textAr } : {}),
        // Only when it differs: the same answer twice is one answer.
        ...(arabic && answer.textAr && answer.textAr !== answer.text ? { answerAr: answer.textAr } : {}),
      };
    }
    const options = q.options.map((option, i) => servedText(pairOf(option, q.optionsAr?.[i]), languages));
    return {
      question: question.text,
      kind: 'mcq' as const,
      options: options.map((o) => o.text),
      correctIndex: q.correctIndex,
      // An Arabic wording is sent beside the first slot only when it says
      // something the first slot does not.
      ...(arabic && question.textAr && question.textAr !== question.text ? { questionAr: question.textAr } : {}),
      ...(arabic && options.some((o) => o.textAr && o.textAr !== o.text) ? { optionsAr: options.map((o) => o.textAr) } : {}),
    };
  });
}

/** A cleaned lab as it is sent. */
export function servedLab(lab: ModuleLab, languages: Lang[]): ModuleLab {
  const arabic = languages.includes('ar');
  const title = servedText(pairOf(lab.title, lab.titleAr), languages);
  const setup = servedText(pairOf(lab.setupNotes, lab.setupNotesAr), languages);
  const objectives = lab.objectives.map((o, i) => servedText(pairOf(o, lab.objectivesAr?.[i]), languages));
  const link = (l: LabLink): LabLink => {
    const label = servedText(pairOf(l.label, l.labelAr), languages);
    return { ...l, label: label.text, labelAr: arabic && label.textAr ? label.textAr : undefined };
  };
  const flag = (f: LabFlag): LabFlag => {
    const label = servedText(pairOf(f.label, f.labelAr), languages);
    const hint = servedText(pairOf(f.hint, f.hintAr), languages);
    return {
      ...f,
      label: label.text,
      labelAr: arabic && label.textAr ? label.textAr : undefined,
      hint: hint.text || undefined,
      hintAr: arabic && hint.textAr ? hint.textAr : undefined,
    };
  };
  return {
    ...lab,
    title: title.text || 'Lab',
    titleAr: arabic && title.textAr ? title.textAr : undefined,
    brief: servedBody(lab.brief, languages),
    objectives: objectives.map((o) => o.text),
    objectivesAr: arabic && objectives.some((o) => o.textAr) ? objectives.map((o) => o.textAr) : undefined,
    setupNotes: setup.text || undefined,
    setupNotesAr: arabic && setup.textAr ? setup.textAr : undefined,
    links: lab.links.map(link),
    completion:
      lab.completion.mode === 'flags'
        ? { mode: 'flags', flags: lab.completion.flags.map(flag) }
        : lab.completion,
  };
}

/** What something is called when its creator gave it no name. */
export const UNNAMED = {
  chapter: (n: number): Pair => ({ en: `Chapter ${n}`, ar: `الفصل ${n}` }),
  lesson: { en: 'Untitled lesson', ar: 'درس بلا عنوان' } as Pair,
  /** The chapter that gathers the labs placed at the end of a module. */
  labs: (count: number): Pair => (count === 1 ? { en: 'Lab', ar: 'المختبر' } : { en: 'Labs', ar: 'المختبرات' }),
};

/** A name as it is sent, with a stand-in when none was written. */
export function servedName(name: Pair, languages: Lang[], standIn: Pair): { text: string; textAr: string } {
  const served = servedText(name, languages);
  if (served.text) return served;
  if (languages.length === 1) return languages[0] === 'ar' ? { text: standIn.ar, textAr: standIn.ar } : { text: standIn.en, textAr: '' };
  return { text: standIn.en, textAr: standIn.ar };
}

/* ── What is left to translate ── */

export type GapPart = 'title' | 'description' | 'name' | 'subtitle' | 'body' | 'quiz' | 'brief' | 'details';

export interface Gap {
  /** Where the creator has to go to fill it. */
  target: { tab: 'details' } | { tab: 'content'; ci: number; si?: number } | { tab: 'lab'; labId: string };
  parts: GapPart[];
  /** What the thing is called, in the language that has a name for it. */
  name: string;
}

export type LessonState = 'done' | 'partial' | 'none';

/** Is `lang` missing here while the other language has it? */
const lacks = (pair: Pair, lang: Lang): boolean => !hasText(pair[lang]) && hasText(pair[otherLang(lang)]);

/** The parts of a quiz that have no wording in `lang`. A typed answer is not
 *  one of them: either language's answer is accepted, so one is enough. */
export function quizLacks(quiz: LocalizedQuizQuestion[] | undefined, lang: Lang): boolean {
  return (quiz ?? []).some((q) => {
    if (lacks(pairOf(q.question, q.questionAr), lang)) return true;
    if (q.kind === 'text') return false;
    return q.options.some((option, i) => lacks(pairOf(option, q.optionsAr?.[i]), lang));
  });
}

/** What a lesson is missing in `lang` that it has in the other language. */
export function lessonGaps(section: CreatorModuleSection, lang: Lang): GapPart[] {
  const parts: GapPart[] = [];
  if (lacks(pairOf(section.title, section.titleAr), lang)) parts.push('title');
  if (lacks(pairOf(section.subtitle, section.subtitleAr), lang)) parts.push('subtitle');
  if (lacks(toLocalizedMarkdown(section.markdownContent), lang)) parts.push('body');
  if (quizLacks(section.quiz, lang)) parts.push('quiz');
  return parts;
}

/** Does the lesson have anything at all in `lang`? */
function lessonHas(section: CreatorModuleSection, lang: Lang): boolean {
  return (
    hasText(exactText(pairOf(section.title, section.titleAr), lang)) ||
    hasText(exactText(toLocalizedMarkdown(section.markdownContent), lang))
  );
}

/** Where a lesson stands in `lang`, for the mark beside it in the outline. */
export function lessonState(section: CreatorModuleSection, lang: Lang): LessonState {
  const gaps = lessonGaps(section, lang);
  if (gaps.length === 0) return 'done';
  return lessonHas(section, lang) ? 'partial' : 'none';
}

/** What a lab is missing in `lang` that it has in the other language. */
export function labGaps(lab: ModuleLab, lang: Lang): GapPart[] {
  const parts: GapPart[] = [];
  if (lacks(pairOf(lab.title, lab.titleAr), lang)) parts.push('title');
  if (lacks(lab.brief, lang)) parts.push('brief');
  const flags = lab.completion.mode === 'flags' ? lab.completion.flags : [];
  const details =
    lacks(pairOf(lab.setupNotes, lab.setupNotesAr), lang) ||
    lab.objectives.some((o, i) => lacks(pairOf(o, lab.objectivesAr?.[i]), lang)) ||
    (lab.objectivesAr ?? []).some((o, i) => lacks(pairOf(lab.objectives[i], o), lang)) ||
    lab.links.some((l) => lacks(pairOf(l.label, l.labelAr), lang)) ||
    flags.some((f) => lacks(pairOf(f.label, f.labelAr), lang) || lacks(pairOf(f.hint, f.hintAr), lang));
  if (details) parts.push('details');
  return parts;
}

export interface TranslationReport {
  /** The language being checked. */
  language: Lang;
  lessons: { done: number; total: number };
  gaps: Gap[];
}

export interface EditorContent {
  title: Pair;
  description: Pair;
  chapters: CreatorModuleChapter[];
  labs: ModuleLab[];
}

/**
 * Everything the module has in the other language and not in `language`.
 * Asked of the second language it is the translation still to do; asked of the
 * main one it is what the creator skipped past in their own language.
 */
export function translationReport(content: EditorContent, language: Lang): TranslationReport {
  const other = otherLang(language);
  const gaps: Gap[] = [];
  const nameOf = (pair: Pair) => exactText(pair, other) || exactText(pair, language);

  const details: GapPart[] = [];
  if (lacks(content.title, language)) details.push('title');
  if (lacks(content.description, language)) details.push('description');
  if (details.length) gaps.push({ target: { tab: 'details' }, parts: details, name: nameOf(content.title) });

  let done = 0;
  let total = 0;
  content.chapters.forEach((chapter, ci) => {
    const chapterName = pairOf(chapter.title, chapter.titleAr);
    if (lacks(chapterName, language)) {
      gaps.push({ target: { tab: 'content', ci }, parts: ['name'], name: nameOf(chapterName) });
    }
    chapter.sections.forEach((section, si) => {
      total++;
      const parts = lessonGaps(section, language);
      if (parts.length === 0) done++;
      else gaps.push({ target: { tab: 'content', ci, si }, parts, name: nameOf(pairOf(section.title, section.titleAr)) });
    });
  });

  for (const lab of content.labs) {
    const parts = labGaps(lab, language);
    if (parts.length) gaps.push({ target: { tab: 'lab', labId: lab.id }, parts, name: nameOf(pairOf(lab.title, lab.titleAr)) });
  }

  return { language, lessons: { done, total }, gaps };
}
