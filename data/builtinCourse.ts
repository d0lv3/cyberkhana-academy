/* ─── Built-in content → editable content ───
 * Flagship courses, networking lessons and programming modules/lessons all ship
 * as hardcoded static data. To let an admin edit one "like any other piece of
 * content" we convert it into the creator shape on the fly. IDs are preserved so
 * student progress carries over, and the first save writes a DB-backed override
 * that shadows the static original (copy-on-write).
 */

import type { FundamentalModule } from './fundamentalsData';
import type { NetworkingLesson } from '../components/network-sim/types';
import type { ProgrammingConcept, ProgrammingModule } from './programming/types';
import quizBank, { type StudentQuizQuestion } from './linuxQuizData';
import type { KeyedAnswer } from '../backend/src/shared/checks';
import linuxCourse from './linuxCourseData';
import { linuxLecturesAr } from './linuxCourseArabic';
import {
  makeCreatorMeta,
  type CreatorFundamentalModule,
  type CreatorModuleChapter,
  type CreatorNetworkingLesson,
  type CreatorProgrammingConcept,
  type CreatorMeta,
  type QuizQuestion,
} from '../services/creatorTypes';

interface RawLecture {
  id: string;
  title: string;
  subtitle?: string;
  videoId?: string;
  quiz?: unknown;
  quizQuestions?: StudentQuizQuestion[];
  notes?: string[];
  markdownContent?: string | { en: string; ar: string };
}

interface RawModule {
  id: string;
  title: string;
  lectures: RawLecture[];
}

/** Static lectures store bullet `notes[]`; the editor is markdown. Convert. */
function notesToMarkdown(notes?: string[]): string {
  if (!notes || !notes.length) return '';
  return notes.map((n) => `- ${n}`).join('\n');
}

/** Resolve a lecture's English body: existing markdown wins, else notes. */
function lectureBodyEn(l: RawLecture): string {
  if (l.markdownContent) {
    return typeof l.markdownContent === 'string' ? l.markdownContent : l.markdownContent.en || '';
  }
  return notesToMarkdown(l.notes);
}

/** Built-in lecture id to its quiz's answers, from the server
 *  (GET /content/admin/builtin-answers): the bundle does not carry them. */
export type BuiltinAnswers = Record<string, KeyedAnswer[]>;

/** A lecture's quiz, answers put back: embedded questions win, else the
 *  id-keyed static bank. An editable copy has to have every answer, or the
 *  first save would publish a quiz whose answers are all the first option. */
function lectureQuiz(l: RawLecture, answers: BuiltinAnswers): QuizQuestion[] {
  const questions = l.quizQuestions?.length ? l.quizQuestions : l.quiz ? quizBank[l.id] ?? [] : [];
  const key = answers[l.id] ?? [];
  return questions.map((q, i) => {
    const answer = key[i];
    if (answer?.kind === 'text') return { ...q, kind: 'text', correctIndex: 0, answer: answer.answer };
    return { ...q, correctIndex: answer?.kind === 'mcq' ? answer.correctIndex : q.correctIndex ?? 0 };
  });
}

/**
 * Convert a built-in (static) course into the editable creator-module model.
 * IDs (module → chapter, lecture → section) are preserved verbatim so existing
 * learner progress keeps counting after the module becomes DB-backed.
 */
export function builtinToEditableModule(mod: FundamentalModule, answers: BuiltinAnswers): CreatorFundamentalModule {
  const course = mod.courseData as { modules?: RawModule[] } | undefined;
  const isBuiltinLinux = mod.courseData === linuxCourse;

  const chapters: CreatorModuleChapter[] = (course?.modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    sections: (m.lectures ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      subtitle: l.subtitle || '',
      videoId: l.videoId || '',
      markdownContent: {
        en: lectureBodyEn(l),
        ar: isBuiltinLinux ? notesToMarkdown(linuxLecturesAr[l.id]?.notes) : '',
      },
      quiz: lectureQuiz(l, answers),
    })),
  }));

  return {
    ...mod,
    ...makeCreatorMeta('published', mod.author || 'CyberKhana'),
    showInModules: true,
    chapters,
  };
}

/**
 * Convert a built-in networking lesson into the editable creator shape. The id
 * is what makes it an override: mergeNetworkingLessons() lets a creator lesson
 * sharing a static lesson's id replace it.
 */
export function builtinToEditableLesson(lesson: NetworkingLesson): CreatorNetworkingLesson {
  return {
    ...lesson,
    ...makeCreatorMeta('published', 'CyberKhana'),
  };
}

/**
 * Convert a built-in programming module into the editable creator shape.
 *
 * `concepts` is deliberately dropped: a module override carries metadata only,
 * and mergeProgrammingLanguages() keeps serving the static lesson list beneath
 * it. Copying the concepts in would duplicate every lesson body into the
 * override and freeze the list at the moment of the edit.
 */
export function builtinToEditableProgrammingModule(
  mod: ProgrammingModule
): ProgrammingModule & CreatorMeta {
  return {
    ...mod,
    concepts: [],
    ...makeCreatorMeta('published', 'CyberKhana'),
  };
}

/** Convert a built-in programming lesson/challenge into the editable shape. */
export function builtinToEditableConcept(concept: ProgrammingConcept): CreatorProgrammingConcept {
  return {
    ...concept,
    ...makeCreatorMeta('published', 'CyberKhana'),
  };
}
