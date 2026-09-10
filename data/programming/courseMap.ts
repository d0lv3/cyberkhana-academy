import type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept } from './types';

/* ─── A language's course, as one ordered path ───
 *
 * The course map on the language page and the previous and next buttons on
 * the lesson page walk the same list, module by module and step by step, so
 * "next" at the end of one module is the first step of the one after it.
 */

export interface CourseStep {
  module: ProgrammingModule;
  concept: ProgrammingConcept;
  /** 1-based position of the module in the language. */
  moduleNumber: number;
  /** 1-based position of the step inside its module. */
  stepNumber: number;
}

export function courseSteps(language: ProgrammingLanguage): CourseStep[] {
  return language.modules.flatMap((module, m) =>
    module.concepts.map((concept, s) => ({
      module,
      concept,
      moduleNumber: m + 1,
      stepNumber: s + 1,
    }))
  );
}

export const stepPath = (
  langSlug: string,
  step: { module: Pick<ProgrammingModule, 'slug'>; concept: Pick<ProgrammingConcept, 'slug'> }
): string => `/fundamentals/programming/${langSlug}/${step.module.slug}/${step.concept.slug}`;
