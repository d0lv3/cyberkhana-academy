/* Loaded by scripts/build-xp-catalog.mjs through Vite, so the course files are
   read exactly as the app reads them. Only the built-in content is measured:
   published creator content is in the database, and the server measures that
   itself with the same functions. */

import { fundamentalModules } from '../data/fundamentalsData';
import { programmingLanguages } from '../data/programming';
import { networkingLessons } from '../data/networking';
import linuxQuizzes from '../data/linuxQuizData';
import linuxQuizAnswers from '../data/linuxQuizAnswers';
import {
  measureConcept,
  measureModuleStop,
  measureNetworkingLesson,
  type BuiltinXpCatalog,
} from '../backend/src/shared/xp';
import { keyedAnswer, type BuiltinAnswerKey, type KeyedAnswer } from '../backend/src/shared/checks';

type Lecture = { id: string; quiz?: unknown; quizQuestions?: unknown[] };

export function buildBuiltinXpCatalog(): BuiltinXpCatalog {
  return {
    modules: fundamentalModules.map((mod) => ({
      id: mod.id,
      slug: mod.slug,
      difficulty: mod.difficulty,
      stops: ((mod.courseData?.modules ?? []) as { lectures: Lecture[] }[]).flatMap((chapter) =>
        chapter.lectures.map((lecture) => ({ id: lecture.id, m: measureModuleStop(lecture, linuxQuizzes) }))
      ),
    })),
    languages: programmingLanguages.map((language) => ({
      slug: language.slug,
      modules: language.modules.map((mod) => ({
        id: mod.id,
        slug: mod.slug,
        order: mod.order,
        concepts: mod.concepts.map((concept) => ({ id: concept.id, order: concept.order, m: measureConcept(concept) })),
      })),
    })),
    networking: networkingLessons.map((lesson) => ({
      id: lesson.id,
      order: lesson.order,
      m: measureNetworkingLesson(lesson),
    })),
  };
}

/**
 * A built-in lecture's quiz, answers attached. The Linux course keeps its
 * questions in the bundle and its answers apart; a lecture that embeds its own
 * questions carries both. Throws when the two halves disagree, so a question
 * added without its answer fails the build instead of being unanswerable.
 */
function lectureKey(lecture: Lecture): KeyedAnswer[] | null {
  if (lecture.quizQuestions?.length) return lecture.quizQuestions.map(keyedAnswer);
  if (!lecture.quiz) return null;
  const questions = linuxQuizzes[lecture.id] ?? [];
  if (questions.length === 0) return null;
  const answers = linuxQuizAnswers[lecture.id] ?? [];
  if (answers.length !== questions.length) {
    throw new Error(
      `data/linuxQuizAnswers.ts has ${answers.length} answer(s) for lecture ${lecture.id}, which asks ${questions.length} question(s)`
    );
  }
  return questions.map((q, i) => {
    const index = answers[i];
    if (!Number.isInteger(index) || index < 0 || index >= q.options.length) {
      throw new Error(`data/linuxQuizAnswers.ts: answer ${i + 1} of lecture ${lecture.id} is not one of its options`);
    }
    return { kind: 'mcq', correctIndex: index };
  });
}

export function buildBuiltinAnswerKey(): BuiltinAnswerKey {
  const quizzes: BuiltinAnswerKey['quizzes'] = {};
  for (const mod of fundamentalModules) {
    for (const chapter of (mod.courseData?.modules ?? []) as { lectures: Lecture[] }[]) {
      for (const lecture of chapter.lectures) {
        const key = lectureKey(lecture);
        if (key) (quizzes[mod.id] ??= {})[lecture.id] = key;
      }
    }
  }

  const tests: BuiltinAnswerKey['tests'] = {};
  for (const language of programmingLanguages) {
    for (const mod of language.modules) {
      for (const concept of mod.concepts) {
        if (concept.type !== 'challenge' || !concept.testCases?.length) continue;
        (tests[language.slug] ??= {})[concept.id] = concept.testCases.map((tc) => ({
          id: tc.id,
          expectedOutput: tc.expectedOutput,
        }));
      }
    }
  }

  const networking: BuiltinAnswerKey['networking'] = {};
  for (const lesson of networkingLessons) {
    if (lesson.quiz?.length) networking[lesson.id] = lesson.quiz.map(keyedAnswer);
  }

  return { quizzes, tests, networking };
}
