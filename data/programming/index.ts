import type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept } from './types';
import python from './python';
import c from './c';
import bash from './bash';
import { mergeProgrammingLanguages, getVisibleCreatorLanguages } from '../../services/creatorDataService';

const staticLanguages: ProgrammingLanguage[] = [python, c, bash];

/** Static languages (used for backwards-compat) */
export const programmingLanguages: ProgrammingLanguage[] = staticLanguages;

const staticSlugs = new Set(staticLanguages.map((l) => l.slug));

/** All languages: static + published creator-defined languages, each with
 * creator patches (published modules/concepts/covers) merged in. */
export const getProgrammingLanguages = (): ProgrammingLanguage[] =>
  mergeProgrammingLanguages([...staticLanguages, ...getVisibleCreatorLanguages(staticSlugs)]);

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
