import type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept } from './types';
import python from './python';
import c from './c';
import cpp from './cpp';
import bash from './bash';
import { mergeProgrammingLanguages, getVisibleCreatorLanguages } from '../../services/creatorDataService';

const staticLanguages: ProgrammingLanguage[] = [python, c, cpp, bash];

/** Static languages (used for backwards-compat) */
export const programmingLanguages: ProgrammingLanguage[] = staticLanguages;

const staticSlugs = new Set(staticLanguages.map((l) => l.slug));

/** Is this slug one of the built-in languages (vs. creator-authored)? */
export const isBuiltinLanguage = (slug: string): boolean => staticSlugs.has(slug);

/** All languages: static + published creator-defined languages, each with
 * creator patches (published modules/concepts/covers) merged in. A built-in
 * an admin has hidden is left out, same as an unpublished creator language. */
export const getProgrammingLanguages = (): ProgrammingLanguage[] =>
  mergeProgrammingLanguages([...staticLanguages, ...getVisibleCreatorLanguages(staticSlugs)]);

/** Every language, hidden built-ins included — the admin studio's view, so a
 *  hidden one can still be found and brought back. Not for student-facing
 *  pages; use `getProgrammingLanguages` there. */
export const getAllProgrammingLanguagesForAdmin = (): ProgrammingLanguage[] =>
  mergeProgrammingLanguages([...staticLanguages, ...getVisibleCreatorLanguages(staticSlugs)], {
    includeHidden: true,
  });

export const getLanguage = (slug: string): ProgrammingLanguage | undefined =>
  getProgrammingLanguages().find((l) => l.slug === slug);

export const getModule = (langSlug: string, moduleSlug: string): ProgrammingModule | undefined =>
  getLanguage(langSlug)?.modules.find((m) => m.slug === moduleSlug);

export const getConcept = (
  langSlug: string,
  moduleSlug: string,
  conceptSlug: string
): ProgrammingConcept | undefined =>
  getModule(langSlug, moduleSlug)?.concepts.find((c) => c.slug === conceptSlug);

export type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept };
