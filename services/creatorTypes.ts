/* ─── Creator Platform Types ─── */

import type { NetworkingLesson } from '../components/network-sim/types';
import type { ProgrammingLanguage, ProgrammingModule, ProgrammingConcept, TestCase } from '../data/programming/types';
import type { FundamentalModule } from '../data/fundamentalsData';
import type { QuizQuestion } from '../data/linuxQuizData';
import type { Difficulty } from '../types';

/* ── Localized markdown ──
 * Lesson bodies are bilingual: { en, ar } with an English fallback. Legacy
 * content was a single string, so reads tolerate both shapes. */
export type LocalizedMarkdown = string | { en: string; ar: string };

export function mdFor(value: LocalizedMarkdown | undefined | null, lang: 'en' | 'ar'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.ar || '';
}

export function toLocalizedMarkdown(value: LocalizedMarkdown | undefined | null): { en: string; ar: string } {
  if (!value) return { en: '', ar: '' };
  if (typeof value === 'string') return { en: value, ar: '' };
  return { en: value.en || '', ar: value.ar || '' };
}

/* ── Content lifecycle ──
 * A community/Ambassador platform needs a quality gate, not a binary toggle.
 *   draft       → work in progress, only the author sees it
 *   in_review   → submitted, awaiting an editor/admin to approve
 *   published   → live for all students
 */
export type ContentStatus = 'draft' | 'in_review' | 'published';

export const STATUS_META: Record<
  ContentStatus,
  { label: string; labelAr: string; color: string }
> = {
  draft: { label: 'Draft', labelAr: 'مسودة', color: '#6e7a94' },
  in_review: { label: 'In Review', labelAr: 'قيد المراجعة', color: '#f3a43a' },
  published: { label: 'Published', labelAr: 'منشور', color: '#00a859' },
};

/* ── Metadata added to all creator content ── */
export interface CreatorMeta {
  /** Marks content as creator-authored (vs built-in static data) */
  isCreatorContent: true;
  /** Kept in sync with status === 'published' for backward-compatible merges */
  isPublished: boolean;
  /** Lifecycle stage */
  status: ContentStatus;
  /** Display name of the creator who authored this */
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Networking ── */
export type CreatorNetworkingLesson = NetworkingLesson & CreatorMeta;

/* ── Programming ── */
export type CreatorProgrammingConcept = ProgrammingConcept & CreatorMeta;

export type CreatorProgrammingModule = Omit<ProgrammingModule, 'concepts'> & {
  concepts: (ProgrammingConcept | CreatorProgrammingConcept)[];
} & Partial<CreatorMeta>;

/* ── OS / Modules ──
 * A creator module is divided into chapters → sections, mirroring the Linux
 * course structure (course → modules → lectures). Each section carries its
 * own markdown (and optional video). On save this is also flattened into
 * `courseData` so the existing module viewer can render it. */
export interface CreatorModuleSection {
  id: string;
  title: string;
  subtitle?: string;
  /** Optional YouTube video id shown above the markdown */
  videoId?: string;
  /** The section's markdown body (bilingual) */
  markdownContent: LocalizedMarkdown;
  /** Optional end-of-section quiz (multiple choice). */
  quiz?: QuizQuestion[];
}

export type { QuizQuestion };

export interface CreatorModuleChapter {
  id: string;
  title: string;
  sections: CreatorModuleSection[];
}

export type CreatorFundamentalModule = FundamentalModule & CreatorMeta & {
  /** If true, also appears on the Modules page */
  showInModules: boolean;
  /** Structured, section-divided content (source of truth for editing) */
  chapters?: CreatorModuleChapter[];
  /** Legacy single-blob markdown (pre-sections modules) */
  markdownContent?: LocalizedMarkdown;
  /** Legacy single video id */
  videoId?: string;
};

/* ── Learning Paths ──
 * A path is an ordered curriculum: the creator picks existing content
 * (modules, networking lessons, programming modules) and sequences them.
 * Each step is denormalized so the consumer can render without resolving. */
export type PathStepKind = 'os-module' | 'networking' | 'programming-module';

export interface PathStep {
  kind: PathStepKind;
  /** Stable id of the referenced content */
  refId: string;
  /** Denormalized title for display */
  title: string;
  /** Short context line (difficulty, length, etc.) */
  subtitle?: string;
  /** Precomputed consumer route to open this step */
  route: string;
  /** Accent color of the underlying content type */
  accent: string;
}

export interface CreatorPath extends CreatorMeta {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  difficulty: Difficulty;
  /** Accent color for the path card */
  color: string;
  tags: string[];
  estimatedHours: number;
  steps: PathStep[];
}

/* ── localStorage Keys ── */
export const STORAGE_KEYS = {
  NETWORKING_LESSONS: 'creator-networking-lessons',
  PROGRAMMING_PATCHES: 'creator-programming-patches',
  OS_MODULES: 'creator-os-modules',
  STANDALONE_MODULES: 'creator-standalone-modules',
  PATHS: 'creator-paths',
} as const;

/* ── Published cache (read-only mirror of everyone's published content,
 * hydrated from the server). The creator-* keys above stay strictly OWN
 * content; these hold what other creators have published. ── */
export const PUBLISHED_CACHE_KEYS = {
  NETWORKING_LESSONS: 'published-networking-lessons',
  PROGRAMMING_PATCHES: 'published-programming-patches',
  OS_MODULES: 'published-os-modules',
  STANDALONE_MODULES: 'published-standalone-modules',
  PATHS: 'published-paths',
} as const;

/** Server bucket names, keyed by the local creator-* storage key. */
export const SERVER_BUCKET_BY_STORAGE_KEY: Record<string, string> = {
  [STORAGE_KEYS.NETWORKING_LESSONS]: 'networking-lessons',
  [STORAGE_KEYS.PROGRAMMING_PATCHES]: 'programming-patches',
  [STORAGE_KEYS.OS_MODULES]: 'os-modules',
  [STORAGE_KEYS.STANDALONE_MODULES]: 'standalone-modules',
  [STORAGE_KEYS.PATHS]: 'paths',
};

/* ── Creator-defined programming language ──
 * A whole new language in the catalog (vs. the built-in Python/C/Bash). Stored
 * on its patch as `newLanguage`; the patch's languageSlug IS the new language.
 * Requires the 'programming-languages' permission to author. */
export interface CreatorProgrammingLanguage extends CreatorMeta {
  slug: string;
  name: string;
  /** Accent color for the language card. */
  color: string;
  description: { en: string; ar: string };
}

/* ── Programming patches structure ── */
export interface ProgrammingPatch {
  /** Which language this patch targets (e.g. 'python') */
  languageSlug: string;
  /** New modules to add to this language */
  newModules: (ProgrammingModule & Partial<CreatorMeta>)[];
  /** New concepts to add to existing modules. Key = moduleSlug */
  newConcepts: Record<string, CreatorProgrammingConcept[]>;
  /** Creator override for the language card's cover art (SVG markup or image URL). */
  languageCoverSvg?: string;
  /** Present when this patch DEFINES a creator-authored language. */
  newLanguage?: CreatorProgrammingLanguage;
}

/* ── Unified content item (for the studio overview / recent activity) ── */
export type StudioContentKind =
  | 'networking'
  | 'programming-concept'
  | 'programming-module'
  | 'os-module'
  | 'module'
  | 'path';

export interface StudioContentItem {
  kind: StudioContentKind;
  kindLabel: string;
  id: string;
  title: string;
  subtitle?: string;
  status: ContentStatus;
  author: string;
  updatedAt: string;
  /** Route to open this item in its editor */
  editPath: string;
  /** Accent color for the content type */
  accent: string;
}

/* ── Helper to generate creator metadata ── */
export function makeCreatorMeta(
  status: ContentStatus = 'draft',
  authorName = 'CyberKhana'
): CreatorMeta {
  const now = new Date().toISOString();
  return {
    isCreatorContent: true,
    isPublished: status === 'published',
    status,
    authorName,
    createdAt: now,
    updatedAt: now,
  };
}

/* ── Normalizers (handle legacy data without status/author) ── */
export function statusOf(item: Partial<CreatorMeta> | undefined | null): ContentStatus {
  if (!item) return 'draft';
  if (item.status) return item.status;
  return item.isPublished ? 'published' : 'draft';
}

export function authorOf(item: Partial<CreatorMeta> | undefined | null): string {
  return item?.authorName || 'CyberKhana';
}

/* ── Type guard ── */
export function isCreatorContent(item: any): item is { isCreatorContent: true } {
  return item && item.isCreatorContent === true;
}
