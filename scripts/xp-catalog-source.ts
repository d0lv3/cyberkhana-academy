/* Loaded by scripts/build-xp-catalog.mjs through Vite, so the course files are
   read exactly as the app reads them. Only the built-in content is measured:
   published creator content is in the database, and the server measures that
   itself with the same functions. */

import { fundamentalModules } from '../data/fundamentalsData';
import { programmingLanguages } from '../data/programming';
import { networkingLessons } from '../data/networking';
import linuxQuizzes from '../data/linuxQuizData';
import {
  measureConcept,
  measureModuleStop,
  measureNetworkingLesson,
  type BuiltinXpCatalog,
} from '../backend/src/shared/xp';

type Lecture = { id: string };

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
