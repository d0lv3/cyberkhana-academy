/* ─── Creator Data Service ───
 * Manages all creator-authored content in localStorage.
 * Merges with static data so consumer pages see everything seamlessly.
 */

import type { NetworkingLesson } from '../components/network-sim/types';
import type { ProgrammingConcept, ProgrammingModule, ProgrammingLanguage } from '../data/programming/types';
import type { FundamentalModule } from '../data/fundamentalsData';
import {
  STORAGE_KEYS,
  PUBLISHED_CACHE_KEYS,
  type CreatorNetworkingLesson,
  type CreatorProgrammingConcept,
  type CreatorProgrammingLanguage,
  type CreatorFundamentalModule,
  type CreatorPath,
  type ProgrammingPatch,
  type ContentStatus,
  type StudioContentItem,
  type CreatorMeta,
  statusOf,
  authorOf,
} from './creatorTypes';
import { queueContentPush } from './syncService';
import { api } from './api';

/* ─────────────────────────────────────────────
 * Generic localStorage helpers
 * ───────────────────────────────────────────── */

function readStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('[creator] local cache write failed (quota?):', err);
  }
  // Write-through to the server (debounced; no-op when signed out).
  queueContentPush(key, data as unknown[]);
}

/* ── Published cache: everyone's published content, hydrated from the
 * server. Own items always win on id collisions (e.g. freshly edited). ── */

function readPublishedCache<T extends { id?: string }>(key: string): T[] {
  return readStorage<T>(key);
}

function mergeWithPublishedCache<T extends { id: string }>(own: T[], cacheKey: string): T[] {
  const ownIds = new Set(own.map((item) => item.id));
  const remote = readPublishedCache<T>(cacheKey).filter((item) => !ownIds.has(item.id));
  return [...own, ...remote];
}

/** Keep the legacy `isPublished` flag in sync with the lifecycle `status`. */
function syncPublished<T extends { status?: ContentStatus; isPublished?: boolean }>(item: T): T {
  if (item.status) {
    return { ...item, isPublished: item.status === 'published' };
  }
  return item;
}

/* ═══════════════════════════════════════════════
 * NETWORKING
 * ═══════════════════════════════════════════════ */

export function getCreatorNetworkingLessons(): CreatorNetworkingLesson[] {
  return readStorage<CreatorNetworkingLesson>(STORAGE_KEYS.NETWORKING_LESSONS);
}

export function getPublishedCreatorNetworkingLessons(): CreatorNetworkingLesson[] {
  return mergeWithPublishedCache(
    getCreatorNetworkingLessons().filter((l) => l.isPublished),
    PUBLISHED_CACHE_KEYS.NETWORKING_LESSONS
  );
}

export function saveNetworkingLesson(lesson: CreatorNetworkingLesson): void {
  const lessons = getCreatorNetworkingLessons();
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const next = syncPublished({ ...lesson, updatedAt: new Date().toISOString() });
  if (idx >= 0) {
    lessons[idx] = next;
  } else {
    lessons.push(next);
  }
  writeStorage(STORAGE_KEYS.NETWORKING_LESSONS, lessons);
}

export function deleteNetworkingLesson(id: string): void {
  const lessons = getCreatorNetworkingLessons().filter((l) => l.id !== id);
  writeStorage(STORAGE_KEYS.NETWORKING_LESSONS, lessons);
}

export function getNetworkingLessonById(id: string): CreatorNetworkingLesson | undefined {
  return getCreatorNetworkingLessons().find((l) => l.id === id);
}

/**
 * Merge static networking lessons with creator-authored ones.
 * Creator lessons are appended after static ones, sorted by order.
 * If a creator lesson has the same id as a static one, the creator version wins.
 */
export function mergeNetworkingLessons(staticLessons: NetworkingLesson[]): NetworkingLesson[] {
  const creatorLessons = getPublishedCreatorNetworkingLessons();
  const staticIds = new Set(staticLessons.map((l) => l.id));

  // Creator lessons that don't collide with static ones
  const additional = creatorLessons.filter((l) => !staticIds.has(l.id));

  // Creator lessons that override static ones
  const overrides = new Map(creatorLessons.filter((l) => staticIds.has(l.id)).map((l) => [l.id, l]));

  const merged = staticLessons.map((l) => overrides.get(l.id) ?? l);
  return [...merged, ...additional].sort((a, b) => a.order - b.order);
}

/* ═══════════════════════════════════════════════
 * PROGRAMMING
 * ═══════════════════════════════════════════════ */

export function getCreatorProgrammingPatches(): ProgrammingPatch[] {
  return readStorage<ProgrammingPatch>(STORAGE_KEYS.PROGRAMMING_PATCHES);
}

function saveAllProgrammingPatches(patches: ProgrammingPatch[]): void {
  writeStorage(STORAGE_KEYS.PROGRAMMING_PATCHES, patches);
}

function ensurePatch(patches: ProgrammingPatch[], langSlug: string): ProgrammingPatch {
  let patch = patches.find((p) => p.languageSlug === langSlug);
  if (!patch) {
    patch = { languageSlug: langSlug, newModules: [], newConcepts: {} };
    patches.push(patch);
  }
  return patch;
}

/** Save a new or updated concept to a language+module */
export function saveProgrammingConcept(
  langSlug: string,
  moduleSlug: string,
  concept: CreatorProgrammingConcept
): void {
  const patches = getCreatorProgrammingPatches();
  const patch = ensurePatch(patches, langSlug);

  if (!patch.newConcepts[moduleSlug]) {
    patch.newConcepts[moduleSlug] = [];
  }
  const list = patch.newConcepts[moduleSlug];
  const idx = list.findIndex((c) => c.id === concept.id);
  const next = syncPublished({ ...concept, updatedAt: new Date().toISOString() });
  if (idx >= 0) {
    list[idx] = next;
  } else {
    list.push(next);
  }
  saveAllProgrammingPatches(patches);
}

/** Delete a creator concept */
export function deleteProgrammingConcept(langSlug: string, moduleSlug: string, conceptId: string): void {
  const patches = getCreatorProgrammingPatches();
  const patch = patches.find((p) => p.languageSlug === langSlug);
  if (!patch) return;
  if (patch.newConcepts[moduleSlug]) {
    patch.newConcepts[moduleSlug] = patch.newConcepts[moduleSlug].filter((c) => c.id !== conceptId);
  }
  saveAllProgrammingPatches(patches);
}

/** Set (or clear) the cover art for a language card. Cosmetic — not publish-gated. */
export function saveProgrammingLanguageCoverSvg(langSlug: string, svg: string): void {
  const patches = getCreatorProgrammingPatches();
  const patch = ensurePatch(patches, langSlug);
  patch.languageCoverSvg = svg.trim() || undefined;
  saveAllProgrammingPatches(patches);
}

/* ── Creator-defined languages ──
 * A patch whose `newLanguage` is set defines a whole new catalog language.
 * Gated by the 'programming-languages' permission (client UI + server). */

/** All languages this creator has defined (any status). */
export function getCreatorLanguages(): CreatorProgrammingLanguage[] {
  return getCreatorProgrammingPatches()
    .map((p) => p.newLanguage)
    .filter((l): l is CreatorProgrammingLanguage => !!l);
}

export function getCreatorLanguageBySlug(slug: string): CreatorProgrammingLanguage | undefined {
  return getCreatorLanguages().find((l) => l.slug === slug);
}

/** Create/update a creator language definition on its patch. */
export function saveProgrammingLanguage(langDef: CreatorProgrammingLanguage): void {
  const patches = getCreatorProgrammingPatches();
  const patch = ensurePatch(patches, langDef.slug);
  patch.newLanguage = syncPublished({ ...langDef, updatedAt: new Date().toISOString() });
  saveAllProgrammingPatches(patches);
}

/** Delete a creator language — removes its whole patch (modules/concepts too). */
export function deleteProgrammingLanguage(slug: string): void {
  const patches = getCreatorProgrammingPatches().filter((p) => p.languageSlug !== slug);
  saveAllProgrammingPatches(patches);
}

/** Build a bare catalog entry from a language definition (modules merge in later). */
function languageToCatalogEntry(def: CreatorProgrammingLanguage, coverSvg?: string): ProgrammingLanguage {
  return {
    id: def.slug,
    slug: def.slug,
    name: def.name,
    color: def.color || '#9fef00',
    available: true,
    description: def.description ?? { en: '', ar: '' },
    coverSvg,
    modules: [],
  };
}

/**
 * Creator languages visible in the CATALOG: my own published + everyone
 * else's published (from the hydrated cache). Own definition wins on slug
 * collisions; static built-ins always win over creator ones.
 */
export function getVisibleCreatorLanguages(staticSlugs: Set<string>): ProgrammingLanguage[] {
  const bySlug = new Map<string, ProgrammingLanguage>();

  for (const patch of getCreatorProgrammingPatches()) {
    const def = patch.newLanguage;
    if (!def || statusOf(def) !== 'published' || staticSlugs.has(def.slug)) continue;
    bySlug.set(def.slug, languageToCatalogEntry(def, patch.languageCoverSvg));
  }

  const remote = readPublishedCache<ProgrammingPatch & { id?: string }>(
    PUBLISHED_CACHE_KEYS.PROGRAMMING_PATCHES
  );
  for (const patch of remote) {
    const def = (patch as ProgrammingPatch).newLanguage;
    if (!def || staticSlugs.has(def.slug) || bySlug.has(def.slug)) continue;
    bySlug.set(def.slug, languageToCatalogEntry(def, patch.languageCoverSvg));
  }

  return [...bySlug.values()];
}

/** Save a new module to a language */
export function saveProgrammingModule(
  langSlug: string,
  mod: ProgrammingModule & Partial<CreatorMeta>
): void {
  const patches = getCreatorProgrammingPatches();
  const patch = ensurePatch(patches, langSlug);
  const idx = patch.newModules.findIndex((m) => m.id === mod.id);
  if (idx >= 0) {
    patch.newModules[idx] = mod;
  } else {
    patch.newModules.push(mod);
  }
  saveAllProgrammingPatches(patches);
}

/** Delete a creator module */
export function deleteProgrammingModule(langSlug: string, moduleId: string): void {
  const patches = getCreatorProgrammingPatches();
  const patch = patches.find((p) => p.languageSlug === langSlug);
  if (!patch) return;
  patch.newModules = patch.newModules.filter((m) => m.id !== moduleId);
  // Also remove any concepts associated with this module
  const mod = patch.newModules.find((m) => m.id === moduleId);
  if (mod) {
    delete patch.newConcepts[mod.slug];
  }
  saveAllProgrammingPatches(patches);
}

/**
 * Own patches combined with the published cache (other creators' published
 * programming content). Own items win on id collisions.
 */
function getAllVisiblePatches(): ProgrammingPatch[] {
  const own = getCreatorProgrammingPatches();
  const remote = readPublishedCache<ProgrammingPatch & { id?: string }>(
    PUBLISHED_CACHE_KEYS.PROGRAMMING_PATCHES
  );
  if (remote.length === 0) return own;

  const byLang = new Map<string, ProgrammingPatch>();
  for (const patch of own) {
    byLang.set(patch.languageSlug, {
      languageSlug: patch.languageSlug,
      newModules: [...patch.newModules],
      newConcepts: Object.fromEntries(
        Object.entries(patch.newConcepts).map(([slug, list]) => [slug, [...list]])
      ),
      languageCoverSvg: patch.languageCoverSvg,
    });
  }
  for (const patch of remote) {
    if (!patch || typeof patch.languageSlug !== 'string') continue;
    const target = byLang.get(patch.languageSlug);
    if (!target) {
      byLang.set(patch.languageSlug, {
        languageSlug: patch.languageSlug,
        newModules: [...(patch.newModules ?? [])],
        newConcepts: Object.fromEntries(
          Object.entries(patch.newConcepts ?? {}).map(([slug, list]) => [slug, [...list]])
        ),
        languageCoverSvg: patch.languageCoverSvg,
      });
      continue;
    }
    // Own cover art wins; fall back to a published one if the creator set none.
    if (!target.languageCoverSvg && patch.languageCoverSvg) {
      target.languageCoverSvg = patch.languageCoverSvg;
    }
    const ownModuleIds = new Set(target.newModules.map((m) => m.id));
    target.newModules.push(...(patch.newModules ?? []).filter((m) => !ownModuleIds.has(m.id)));
    for (const [slug, concepts] of Object.entries(patch.newConcepts ?? {})) {
      const ownList = target.newConcepts[slug] ?? [];
      const ownIds = new Set(ownList.map((c) => c.id));
      target.newConcepts[slug] = [...ownList, ...concepts.filter((c) => !ownIds.has(c.id))];
    }
  }
  return [...byLang.values()];
}

/**
 * Merge static programming languages with creator patches.
 *
 * Two things happen here, and the id decides which:
 *  - a patch entry with a NEW id is an addition (a creator's own module/lesson);
 *  - a patch entry REUSING a built-in's id is an override — this is how an admin
 *    edits built-in content (copy-on-write). A module override replaces the
 *    built-in's metadata only; its concepts still come from the static course, so
 *    editing a module title never freezes or duplicates its lesson list.
 *
 * Either way, only published entries reach students.
 */
export function mergeProgrammingLanguages(staticLanguages: ProgrammingLanguage[]): ProgrammingLanguage[] {
  const patches = getAllVisiblePatches();

  return staticLanguages.map((lang) => {
    const patch = patches.find((p) => p.languageSlug === lang.slug);
    if (!patch) return lang;

    // Creator-overridden cover art (cosmetic, applies regardless of publish state).
    const coverSvg = patch.languageCoverSvg ?? lang.coverSvg;

    /** Apply this module's published patch concepts: overrides first, then additions. */
    const withPatchConcepts = (mod: ProgrammingModule): ProgrammingModule => {
      const patchConcepts = (patch.newConcepts[mod.slug] ?? []).filter(
        (c) => statusOf(c) === 'published'
      );
      if (patchConcepts.length === 0) return mod;

      const overrideById = new Map(patchConcepts.map((c) => [c.id, c]));
      const existingIds = new Set(mod.concepts.map((c) => c.id));

      return {
        ...mod,
        concepts: [
          ...mod.concepts.map((c) => overrideById.get(c.id) ?? c),
          ...patchConcepts.filter((c) => !existingIds.has(c.id)),
        ].sort((a, b) => a.order - b.order),
      };
    };

    const publishedPatchModules = patch.newModules.filter((m) => statusOf(m) === 'published');
    const overrideById = new Map(publishedPatchModules.map((m) => [m.id, m]));

    // Built-in modules, with an admin's metadata override applied. The slug and
    // concept list stay the built-in's: concepts are keyed by module slug, and a
    // renamed slug would orphan them along with every existing lesson URL.
    const mergedModules = lang.modules.map((mod) => {
      const override = overrideById.get(mod.id);
      const base = override ? { ...override, slug: mod.slug, concepts: mod.concepts } : mod;
      return withPatchConcepts(base);
    });

    const existingModuleIds = new Set(lang.modules.map((m) => m.id));
    const additionalModules = publishedPatchModules
      .filter((m) => !existingModuleIds.has(m.id))
      .map(withPatchConcepts);

    return {
      ...lang,
      coverSvg,
      modules: [...mergedModules, ...additionalModules].sort((a, b) => a.order - b.order),
    };
  });
}

/* ═══════════════════════════════════════════════
 * OS / FUNDAMENTAL MODULES
 * ═══════════════════════════════════════════════ */

export function getCreatorOSModules(): CreatorFundamentalModule[] {
  return readStorage<CreatorFundamentalModule>(STORAGE_KEYS.OS_MODULES);
}

export function getPublishedCreatorOSModules(): CreatorFundamentalModule[] {
  return mergeWithPublishedCache(
    getCreatorOSModules().filter((m) => m.isPublished),
    PUBLISHED_CACHE_KEYS.OS_MODULES
  );
}

export function saveOSModule(mod: CreatorFundamentalModule): void {
  const modules = getCreatorOSModules();
  const idx = modules.findIndex((m) => m.id === mod.id);
  const next = syncPublished({ ...mod, updatedAt: new Date().toISOString() });
  if (idx >= 0) {
    modules[idx] = next;
  } else {
    modules.push(next);
  }
  writeStorage(STORAGE_KEYS.OS_MODULES, modules);
}

export function deleteOSModule(id: string): void {
  const modules = getCreatorOSModules().filter((m) => m.id !== id);
  writeStorage(STORAGE_KEYS.OS_MODULES, modules);
}

export function getOSModuleById(id: string): CreatorFundamentalModule | undefined {
  return getCreatorOSModules().find((m) => m.id === id);
}

/**
 * Merge static fundamental modules with published creator modules:
 * creator OS modules + standalone modules. Standalone modules are placed by
 * their `category`, so the category filter applied downstream surfaces a
 * "networking" module under Fundamentals → Networking, etc.
 */
export function mergeFundamentalModules(staticModules: FundamentalModule[]): FundamentalModule[] {
  const published = [...getPublishedCreatorOSModules(), ...getPublishedStandaloneModules()];

  // A published creator module sharing a built-in's id OVERRIDES the static one
  // (an admin edited the built-in course; the DB copy is now the source).
  const overrideById = new Map(published.map((m) => [m.id, m]));
  const merged = staticModules.map((m) => overrideById.get(m.id) ?? m);

  const staticIds = new Set(staticModules.map((m) => m.id));
  const seen = new Set<string>();
  const additional: FundamentalModule[] = [];
  for (const mod of published) {
    if (staticIds.has(mod.id) || seen.has(mod.id)) continue;
    seen.add(mod.id);
    additional.push(mod);
  }
  return [...merged, ...additional];
}

/* ═══════════════════════════════════════════════
 * STANDALONE MODULES (the "Modules" hub — not tied to OS Fundamentals)
 * ═══════════════════════════════════════════════ */

export function getCreatorStandaloneModules(): CreatorFundamentalModule[] {
  return readStorage<CreatorFundamentalModule>(STORAGE_KEYS.STANDALONE_MODULES);
}

export function getPublishedStandaloneModules(): CreatorFundamentalModule[] {
  return mergeWithPublishedCache(
    getCreatorStandaloneModules().filter((m) => m.isPublished),
    PUBLISHED_CACHE_KEYS.STANDALONE_MODULES
  );
}

export function saveStandaloneModule(mod: CreatorFundamentalModule): void {
  const modules = getCreatorStandaloneModules();
  const idx = modules.findIndex((m) => m.id === mod.id);
  const next = syncPublished({ ...mod, updatedAt: new Date().toISOString() });
  if (idx >= 0) {
    modules[idx] = next;
  } else {
    modules.push(next);
  }
  writeStorage(STORAGE_KEYS.STANDALONE_MODULES, modules);
}

export function deleteStandaloneModule(id: string): void {
  writeStorage(
    STORAGE_KEYS.STANDALONE_MODULES,
    getCreatorStandaloneModules().filter((m) => m.id !== id)
  );
}

export function getStandaloneModuleById(id: string): CreatorFundamentalModule | undefined {
  return getCreatorStandaloneModules().find((m) => m.id === id);
}

/**
 * Get all modules for the Modules page:
 * - Creator OS modules flagged showInModules = true
 * - All published standalone modules
 */
export function getModulesPageData(): FundamentalModule[] {
  const osModules = getPublishedCreatorOSModules().filter((m) => m.showInModules);
  const standalone = getPublishedStandaloneModules();
  return [...osModules, ...standalone];
}

/* ═══════════════════════════════════════════════
 * LEARNING PATHS
 * ═══════════════════════════════════════════════ */

export function getCreatorPaths(): CreatorPath[] {
  return readStorage<CreatorPath>(STORAGE_KEYS.PATHS);
}

export function getPublishedCreatorPaths(): CreatorPath[] {
  return mergeWithPublishedCache(
    getCreatorPaths().filter((p) => statusOf(p) === 'published'),
    PUBLISHED_CACHE_KEYS.PATHS
  );
}

export function getPathById(id: string): CreatorPath | undefined {
  return getCreatorPaths().find((p) => p.id === id);
}

export function getPathBySlug(slug: string): CreatorPath | undefined {
  return getCreatorPaths().find((p) => p.slug === slug);
}

/** Published-only resolver — the student detail page must never surface drafts. */
export function getPublishedPathBySlug(slug: string): CreatorPath | undefined {
  return getPublishedCreatorPaths().find((p) => p.slug === slug);
}

export function savePath(path: CreatorPath): void {
  const paths = getCreatorPaths();
  const idx = paths.findIndex((p) => p.id === path.id);
  const next = syncPublished({ ...path, updatedAt: new Date().toISOString() });
  if (idx >= 0) {
    paths[idx] = next;
  } else {
    paths.push(next);
  }
  writeStorage(STORAGE_KEYS.PATHS, paths);
}

export function deletePath(id: string): void {
  writeStorage(STORAGE_KEYS.PATHS, getCreatorPaths().filter((p) => p.id !== id));
}

/* ═══════════════════════════════════════════════
 * UNIFIED STUDIO LAYER
 * One coherent view across every content kind.
 * ═══════════════════════════════════════════════ */

const ACCENTS = {
  networking: '#60a5fa',
  programming: '#9fef00',
  os: '#f3a43a',
  module: '#34d399',
  path: '#a78bfa',
} as const;

/**
 * Flatten every piece of creator-authored content into a single, sortable list.
 * Powers the studio dashboard's "Your Content" table and recent activity.
 */
export function getAllCreatorContent(): StudioContentItem[] {
  const items: StudioContentItem[] = [];

  // Networking lessons
  for (const lesson of getCreatorNetworkingLessons()) {
    items.push({
      kind: 'networking',
      kindLabel: 'Networking',
      id: lesson.id,
      title: lesson.title.en || 'Untitled lesson',
      subtitle: lesson.description.en,
      status: statusOf(lesson),
      author: authorOf(lesson),
      updatedAt: lesson.updatedAt || lesson.createdAt || '',
      editPath: `/creators/networking/edit/${lesson.id}`,
      accent: ACCENTS.networking,
    });
  }

  // Programming content (modules + concepts across every language patch)
  for (const patch of getCreatorProgrammingPatches()) {
    for (const mod of patch.newModules) {
      items.push({
        kind: 'programming-module',
        kindLabel: 'Module',
        id: mod.id,
        title: mod.title.en || 'Untitled module',
        subtitle: patch.languageSlug,
        status: statusOf(mod),
        author: authorOf(mod),
        updatedAt: mod.updatedAt || mod.createdAt || '',
        editPath: '/creators/programming',
        accent: ACCENTS.programming,
      });
    }
    for (const [moduleSlug, concepts] of Object.entries(patch.newConcepts)) {
      for (const concept of concepts) {
        items.push({
          kind: 'programming-concept',
          kindLabel: concept.type === 'challenge' ? 'Challenge' : 'Lesson',
          id: concept.id,
          title: concept.title.en || 'Untitled concept',
          subtitle: `${patch.languageSlug} · ${moduleSlug}`,
          status: statusOf(concept),
          author: authorOf(concept),
          updatedAt: concept.updatedAt || concept.createdAt || '',
          editPath: `/creators/programming/${patch.languageSlug}/${moduleSlug}/${concept.slug}`,
          accent: ACCENTS.programming,
        });
      }
    }
  }

  // Learning paths
  for (const path of getCreatorPaths()) {
    items.push({
      kind: 'path',
      kindLabel: 'Path',
      id: path.id,
      title: path.title.en || 'Untitled path',
      subtitle: path.description.en,
      status: statusOf(path),
      author: authorOf(path),
      updatedAt: path.updatedAt || path.createdAt || '',
      editPath: `/creators/paths/edit/${path.id}`,
      accent: ACCENTS.path,
    });
  }

  // OS modules
  for (const mod of getCreatorOSModules()) {
    items.push({
      kind: 'os-module',
      kindLabel: 'OS Module',
      id: mod.id,
      title: mod.title.en || 'Untitled module',
      subtitle: mod.description.en,
      status: statusOf(mod),
      author: authorOf(mod),
      updatedAt: mod.updatedAt || mod.createdAt || '',
      editPath: `/creators/os-modules/edit/${mod.id}`,
      accent: ACCENTS.os,
    });
  }

  // Standalone modules
  for (const mod of getCreatorStandaloneModules()) {
    items.push({
      kind: 'module',
      kindLabel: 'Module',
      id: mod.id,
      title: mod.title.en || 'Untitled module',
      subtitle: mod.description.en,
      status: statusOf(mod),
      author: authorOf(mod),
      updatedAt: mod.updatedAt || mod.createdAt || '',
      editPath: `/creators/modules/edit/${mod.id}`,
      accent: ACCENTS.module,
    });
  }

  return items;
}

/* ═══════════════════════════════════════════════
 * ADMIN — cross-author content moderation
 * Admins may edit ANY published content. Editing happens IN PLACE in the
 * original author's bucket (ownership preserved); the server enforces the
 * admin role and that the item already exists, so these calls 403/404
 * for everyone else.
 * ═══════════════════════════════════════════════ */

/** Buckets that store a flat, id-keyed array and share one admin endpoint. */
export type AdminItemBucket = 'os-modules' | 'standalone-modules' | 'networking-lessons';

/** The two module buckets — the subset the module studio pages care about. */
export type AdminModuleBucket = Extract<AdminItemBucket, 'os-modules' | 'standalone-modules'>;

/** Owner annotations the server adds to every admin-listed item. */
export interface AdminOwned {
  /** Author's user id — the bucket the edit is written back to. */
  _ownerId: string;
  /** Author's display name (for the studio list). */
  _ownerName: string;
}

export interface AdminPublishedModule extends CreatorFundamentalModule, AdminOwned {
  _bucket: AdminModuleBucket;
}

export interface AdminPublishedNetworkingLesson extends CreatorNetworkingLesson, AdminOwned {
  _bucket: 'networking-lessons';
}

type AdminPublishedItem = (CreatorFundamentalModule | CreatorNetworkingLesson) &
  AdminOwned & { _bucket: AdminItemBucket };

/** Every published or in-review item across all authors, in every flat bucket.
 *  Drafts are never returned — a creator's unfinished work stays private until
 *  they move it to review. */
async function fetchAllPublishedItemsForAdmin(): Promise<AdminPublishedItem[]> {
  const { items } = await api.get<{ items: AdminPublishedItem[] }>('/content/admin/items');
  return items;
}

/** Every published or in-review module across all authors (admin-only). */
export async function fetchAllModeratableModulesForAdmin(): Promise<AdminPublishedModule[]> {
  const items = await fetchAllPublishedItemsForAdmin();
  return items.filter(
    (i): i is AdminPublishedModule =>
      i._bucket === 'os-modules' || i._bucket === 'standalone-modules'
  );
}

/** Every published or in-review networking lesson across all authors (admin-only). */
export async function fetchAllModeratableNetworkingForAdmin(): Promise<AdminPublishedNetworkingLesson[]> {
  const items = await fetchAllPublishedItemsForAdmin();
  return items.filter((i): i is AdminPublishedNetworkingLesson => i._bucket === 'networking-lessons');
}

/** Save an admin edit back into the original author's bucket, in place. */
export async function saveItemAsAdmin(
  ownerId: string,
  bucket: AdminItemBucket,
  item: CreatorFundamentalModule | CreatorNetworkingLesson
): Promise<void> {
  await api.patch('/content/admin/item', { ownerId, bucket, item });
}

/** Module-typed alias of {@link saveItemAsAdmin}, used by the module editors. */
export async function saveModuleAsAdmin(
  ownerId: string,
  bucket: AdminModuleBucket,
  item: CreatorFundamentalModule
): Promise<void> {
  await saveItemAsAdmin(ownerId, bucket, item);
}

/* ── Admin: programming ──
 * Programming content is nested (language → modules / concepts / language
 * definition) rather than a flat id-keyed array, so it gets its own pair. */

export interface AdminProgrammingPatch extends ProgrammingPatch, AdminOwned {}

/** Every author's published or in-review programming patches (admin-only). */
export async function fetchAllModeratableProgrammingForAdmin(): Promise<AdminProgrammingPatch[]> {
  const { items } = await api.get<{ items: AdminProgrammingPatch[] }>('/content/admin/programming');
  return items;
}

/** Replace one module / concept / language inside its author's patch, in place. */
export async function saveProgrammingAsAdmin(args: {
  ownerId: string;
  languageSlug: string;
  kind: 'module' | 'concept' | 'language';
  /** Required when kind is 'concept'. */
  moduleSlug?: string;
  item: unknown;
}): Promise<void> {
  await api.patch('/content/admin/programming', args);
}

/** Most recently updated content first. */
export function getRecentCreatorContent(limit = 6): StudioContentItem[] {
  return getAllCreatorContent()
    .slice()
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit);
}

export interface StudioStats {
  total: number;
  byStatus: Record<ContentStatus, number>;
  byKind: { networking: number; programming: number; os: number; modules: number; paths: number };
}

/** Pipeline + per-kind counts for the studio dashboard. */
export function getStudioStats(): StudioStats {
  const all = getAllCreatorContent();
  const byStatus: Record<ContentStatus, number> = { draft: 0, in_review: 0, published: 0 };
  const byKind = { networking: 0, programming: 0, os: 0, modules: 0, paths: 0 };

  for (const item of all) {
    byStatus[item.status] += 1;
    if (item.kind === 'networking') byKind.networking += 1;
    else if (item.kind === 'programming-concept' || item.kind === 'programming-module') byKind.programming += 1;
    else if (item.kind === 'os-module') byKind.os += 1;
    else if (item.kind === 'module') byKind.modules += 1;
    else if (item.kind === 'path') byKind.paths += 1;
  }

  return { total: all.length, byStatus, byKind };
}
