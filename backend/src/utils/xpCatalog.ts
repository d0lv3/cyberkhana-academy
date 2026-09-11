/* ─── The server's XP catalog ───
 *
 * Everything a learner can complete, with what each stop is worth, so the
 * server scores a progress snapshot itself instead of trusting a total the
 * browser sends. Built from two sources:
 *   - the built-in courses, measured at build time into
 *     data/builtinXpCatalog.json (scripts/build-xp-catalog.mjs), and
 *   - every creator's published content, read from the content buckets.
 *
 * They are merged the way the browser merges them (services/creatorDataService:
 * mergeFundamentalModules, mergeProgrammingLanguages, mergeNetworkingLessons),
 * so both sides score the same stops. Scoring itself is shared/xp.ts.
 */

import builtinJson from '../data/builtinXpCatalog.json';
import ContentBucket from '../models/ContentBucket';
import { isPlainObject, isPublishedItem, type AnyItem } from './contentStatus';
import {
  groupKey,
  measureConcept,
  measureModuleStop,
  measureNetworkingLesson,
  scoreGroups,
  stopXp,
  type BuiltinXpCatalog,
  type StopMeasure,
  type XpGroup,
  type XpScore,
} from '../shared/xp';

const builtin = builtinJson as BuiltinXpCatalog;

/** Where a group's completions live in a progress snapshot. */
type Source = { kind: 'module'; slug: string } | { kind: 'programming'; language: string } | { kind: 'networking' };

export interface ServerXpGroup extends XpGroup {
  source: Source;
}

/* Content changes rarely, so the catalog is kept for a minute, and dropped at
   once whenever a content bucket is written (routes/content.ts). */
const TTL_MS = 60_000;
let cached: { at: number; groups: ServerXpGroup[] } | null = null;

export function invalidateXpCatalog(): void {
  cached = null;
}

export async function getXpGroups(): Promise<ServerXpGroup[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.groups;
  const groups = buildGroups(await loadPublished());
  cached = { at: Date.now(), groups };
  return groups;
}

/* ── Published creator content ── */

interface Patch {
  newModules: AnyItem[];
  newConcepts: Record<string, AnyItem[]>;
  newLanguage?: AnyItem;
}

interface Published {
  modules: AnyItem[];
  lessons: AnyItem[];
  patches: Map<string, Patch>;
}

const publishedIn = (items: unknown): AnyItem[] =>
  Array.isArray(items) ? items.filter((i): i is AnyItem => isPlainObject(i) && isPublishedItem(i)) : [];

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const order = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

async function loadPublished(): Promise<Published> {
  const docs = await ContentBucket.find({
    bucket: { $in: ['os-modules', 'standalone-modules', 'networking-lessons', 'programming-patches'] },
  })
    .select('bucket items')
    .lean();

  const osModules: AnyItem[] = [];
  const standalone: AnyItem[] = [];
  const lessons: AnyItem[] = [];
  const patches = new Map<string, Patch>();

  for (const doc of docs) {
    if (doc.bucket === 'os-modules') osModules.push(...publishedIn(doc.items));
    else if (doc.bucket === 'standalone-modules') standalone.push(...publishedIn(doc.items));
    else if (doc.bucket === 'networking-lessons') lessons.push(...publishedIn(doc.items));
    else {
      // Several creators' patches for one language merge into one, as the feed does.
      for (const patch of Array.isArray(doc.items) ? doc.items : []) {
        if (!isPlainObject(patch) || typeof patch.languageSlug !== 'string') continue;
        const merged = patches.get(patch.languageSlug) ?? { newModules: [], newConcepts: {} };
        merged.newModules.push(...publishedIn(patch.newModules));
        if (isPlainObject(patch.newConcepts)) {
          for (const [slug, concepts] of Object.entries(patch.newConcepts)) {
            const list = publishedIn(concepts);
            if (list.length) merged.newConcepts[slug] = [...(merged.newConcepts[slug] ?? []), ...list];
          }
        }
        if (!merged.newLanguage && isPlainObject(patch.newLanguage) && isPublishedItem(patch.newLanguage)) {
          merged.newLanguage = patch.newLanguage;
        }
        patches.set(patch.languageSlug, merged);
      }
    }
  }

  return { modules: [...osModules, ...standalone], lessons, patches };
}

/* ── Merging, as the browser does ── */

interface Concept {
  id: string;
  order: number;
  m: StopMeasure;
}

const measured = (concepts: unknown): Concept[] =>
  (Array.isArray(concepts) ? concepts : [])
    .filter(isPlainObject)
    .map((c) => ({ id: str(c.id), order: order(c.order), m: measureConcept(c) }));

function buildGroups(published: Published): ServerXpGroup[] {
  const groups: ServerXpGroup[] = [];
  const seenSlugs = new Set<string>();

  /* Modules. A published module reusing a built-in's id replaces it (an admin
     editing the built-in course); the rest are added after, first one wins. */
  const overrideById = new Map(published.modules.map((m) => [str(m.id), m]));
  const staticIds = new Set(builtin.modules.map((m) => m.id));
  const addModule = (slug: string, stops: { id: string; xp: number }[]) => {
    // One set of completions per slug, so two modules sharing one never count it twice.
    if (!slug || seenSlugs.has(slug)) return;
    seenSlugs.add(slug);
    groups.push({ key: groupKey.module(slug), source: { kind: 'module', slug }, stops, finishBonus: true });
  };
  const creatorStops = (mod: AnyItem) => {
    const course = isPlainObject(mod.courseData) ? mod.courseData : {};
    const chapters = Array.isArray(course.modules) ? course.modules.filter(isPlainObject) : [];
    return chapters.flatMap((chapter) =>
      (Array.isArray(chapter.lectures) ? chapter.lectures.filter(isPlainObject) : []).map((lecture) => ({
        id: str(lecture.id),
        xp: stopXp(measureModuleStop(lecture), mod.difficulty),
      }))
    );
  };
  for (const mod of builtin.modules) {
    const override = overrideById.get(mod.id);
    if (override) addModule(str(override.slug), creatorStops(override));
    else addModule(mod.slug, mod.stops.map((s) => ({ id: s.id, xp: stopXp(s.m, mod.difficulty) })));
  }
  const seenIds = new Set<string>();
  for (const mod of published.modules) {
    const id = str(mod.id);
    if (staticIds.has(id) || seenIds.has(id)) continue;
    seenIds.add(id);
    addModule(str(mod.slug), creatorStops(mod));
  }

  /* Programming. Built-in languages plus published creator languages; a patch
     adds modules and lessons, and a lesson reusing a built-in's id replaces it. */
  const staticLanguageSlugs = new Set(builtin.languages.map((l) => l.slug));
  const languages = [
    ...builtin.languages,
    ...[...published.patches.entries()]
      .filter(([slug, patch]) => patch.newLanguage && !staticLanguageSlugs.has(slug))
      .map(([slug]) => ({ slug, modules: [] as BuiltinXpCatalog['languages'][number]['modules'] })),
  ];
  for (const language of languages) {
    const patch = published.patches.get(language.slug);
    const withPatchConcepts = (moduleSlug: string, base: Concept[]): Concept[] => {
      const extra = measured(patch?.newConcepts[moduleSlug]);
      if (extra.length === 0) return base;
      const overrides = new Map(extra.map((c) => [c.id, c]));
      const existing = new Set(base.map((c) => c.id));
      return [...base.map((c) => overrides.get(c.id) ?? c), ...extra.filter((c) => !existing.has(c.id))].sort(
        (a, b) => a.order - b.order
      );
    };
    const modules = language.modules.map((mod) => ({ slug: mod.slug, concepts: withPatchConcepts(mod.slug, mod.concepts) }));
    const existingIds = new Set(language.modules.map((m) => m.id));
    for (const mod of patch?.newModules ?? []) {
      if (existingIds.has(str(mod.id))) continue;
      const slug = str(mod.slug);
      modules.push({ slug, concepts: withPatchConcepts(slug, measured(mod.concepts)) });
    }
    for (const mod of modules) {
      groups.push({
        key: groupKey.programming(language.slug, mod.slug),
        source: { kind: 'programming', language: language.slug },
        stops: mod.concepts.map((c) => ({ id: c.id, xp: stopXp(c.m) })),
        finishBonus: true,
      });
    }
  }

  /* Networking lessons stand alone: there is no module to finish. A creator
     version of a built-in lesson replaces it; the rest are added once each. */
  const creatorLessonXp = new Map<string, number>();
  for (const lesson of published.lessons) {
    const id = str(lesson.id);
    if (id && !creatorLessonXp.has(id)) creatorLessonXp.set(id, stopXp(measureNetworkingLesson(lesson)));
  }
  const builtinLessonIds = new Set(builtin.networking.map((l) => l.id));
  const lessonStops = [
    ...builtin.networking.map((l) => ({ id: l.id, xp: creatorLessonXp.get(l.id) ?? stopXp(l.m) })),
    ...[...creatorLessonXp].filter(([id]) => !builtinLessonIds.has(id)).map(([id, xp]) => ({ id, xp })),
  ];
  groups.push({ key: groupKey.networking, source: { kind: 'networking' }, stops: lessonStops, finishBonus: false });

  return groups;
}

/* ── Scoring a stored snapshot ── */

export interface ProgressLike {
  programming?: unknown;
  osModules?: unknown;
  networking?: unknown;
}

const idsOf = (value: unknown): Set<string> =>
  new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

const own = (record: unknown, key: string): unknown =>
  isPlainObject(record) && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

export async function scoreProgress(
  progress: ProgressLike | null | undefined,
  finishedBefore: Iterable<string> = []
): Promise<XpScore> {
  const groups = await getXpGroups();
  const sets = new Map<string, Set<string>>();
  const setFor = (cacheKey: string, value: unknown) => {
    let set = sets.get(cacheKey);
    if (!set) {
      set = idsOf(value);
      sets.set(cacheKey, set);
    }
    return set;
  };
  return scoreGroups(
    groups,
    (group) => {
      const source = group.source;
      if (source.kind === 'module') return setFor(`os:${source.slug}`, own(progress?.osModules, source.slug));
      if (source.kind === 'programming') {
        return setFor(`prog:${source.language}`, own(progress?.programming, source.language));
      }
      return setFor('net', progress?.networking);
    },
    new Set(finishedBefore)
  );
}
