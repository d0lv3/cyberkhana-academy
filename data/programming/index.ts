import type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept } from './types';
import python from './python';
import { mergeProgrammingLanguages, getVisibleCreatorLanguages } from '../../services/creatorDataService';

const staticLanguages: ProgrammingLanguage[] = [
  python,
  {
    id: 'c',
    slug: 'c',
    name: 'C',
    color: '#555555',
    available: false,
    description: {
      en: 'Understand memory, pointers, and low-level concepts essential for reverse engineering and exploit development.',
      ar: 'فهم الذاكرة، المؤشرات، والمفاهيم المنخفضة المستوى الأساسية للهندسة العكسية وتطوير الاستغلالات.',
    },
    modules: [],
  },
  {
    id: 'bash',
    slug: 'bash',
    name: 'Bash',
    color: '#4EAA25',
    available: false,
    description: {
      en: 'Shell scripting for automating security tasks, log analysis, and system administration.',
      ar: 'برمجة الشيل لأتمتة مهام الأمن، تحليل السجلات، وإدارة النظام.',
    },
    modules: [],
  },
];

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
