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
 *
 * Every catalog carries a stamp: the formula version plus a hash of every
 * stop's worth. An account records the stamp its figures were scored against
 * (`xpStamp`), so when content changes, whoever is still in the old catalog's
 * figures is restated (utils/xpMigration.ts) instead of keeping a stale number
 * on the board, or booking the change as XP earned this month.
 */

import { createHash } from 'crypto';
import builtinJson from '../data/builtinXpCatalog.json';
import builtinAnswersJson from '../data/builtinAnswerKey.json';
import ContentBucket from '../models/ContentBucket';
import { isPlainObject, isPublishedItem, type AnyItem } from './contentStatus';
import {
  XP_FORMULA_VERSION,
  groupKey,
  measureConcept,
  measureModuleStop,
  measureNetworkingLesson,
  scoreGroups,
  stopMinutes,
  stopXp,
  type BuiltinXpCatalog,
  type StopMeasure,
  type XpGroup,
  type XpScore,
} from '../shared/xp';
import type { BuiltinAnswerKey, QuizRule } from '../shared/checks';

const builtin = builtinJson as BuiltinXpCatalog;
const builtinAnswers = builtinAnswersJson as BuiltinAnswerKey;

/** Where a group's completions live in a progress snapshot. */
type Source = { kind: 'module'; slug: string } | { kind: 'programming'; language: string } | { kind: 'networking' };

/**
 * What finishing a stop takes, as the server checks it (routes/progress.ts):
 *   quiz   the answers, marked against the questions as authored
 *   flags  every flag of a lab, each one sent and checked on its own
 *   tests  the output of every test case a challenge runs
 *   none   nothing that can be checked: reading, a video, a self-check lab
 */
export type StopCheck =
  | { kind: 'none' }
  | { kind: 'quiz'; questions: unknown[]; rule: QuizRule }
  | { kind: 'flags'; flags: AnyItem[] }
  | { kind: 'tests'; tests: { id: string; expectedOutput: string }[] };

export interface ServerStop {
  id: string;
  xp: number;
  /** Plain minutes it is expected to take, which unchecked work is paced by. */
  minutes: number;
  check: StopCheck;
}

export interface ServerXpGroup extends XpGroup {
  source: Source;
  stops: ServerStop[];
}

/** A stop as a learner names it: which container, and which stop in it. */
export type StopRef =
  | { kind: 'module'; slug: string; stopId: string }
  | { kind: 'programming'; language: string; stopId: string }
  | { kind: 'networking'; stopId: string };

export interface XpCatalog {
  groups: ServerXpGroup[];
  /** Changes whenever any stop's worth does, or the formula's version. */
  stamp: string;
  /** Every stop by refKey(), the first one wherever a container repeats one. */
  stops: Map<string, { group: ServerXpGroup; stop: ServerStop }>;
}

const refKey = (ref: StopRef): string =>
  ref.kind === 'module'
    ? `module\u0000${ref.slug}\u0000${ref.stopId}`
    : ref.kind === 'programming'
      ? `programming\u0000${ref.language}\u0000${ref.stopId}`
      : `networking\u0000${ref.stopId}`;

/** The published stop a learner means, or null when there is no such thing. */
export function findStop(catalog: XpCatalog, ref: StopRef): { group: ServerXpGroup; stop: ServerStop } | null {
  return catalog.stops.get(refKey(ref)) ?? null;
}

function indexStops(groups: ServerXpGroup[]): XpCatalog['stops'] {
  const index: XpCatalog['stops'] = new Map();
  for (const group of groups) {
    const { source } = group;
    for (const stop of group.stops) {
      const ref: StopRef =
        source.kind === 'module'
          ? { kind: 'module', slug: source.slug, stopId: stop.id }
          : source.kind === 'programming'
            ? { kind: 'programming', language: source.language, stopId: stop.id }
            : { kind: 'networking', stopId: stop.id };
      const key = refKey(ref);
      if (!index.has(key)) index.set(key, { group, stop });
    }
  }
  return index;
}

/* Content changes rarely, so the catalog is kept for a minute, and dropped at
   once whenever a content bucket is written (routes/content.ts). */
const TTL_MS = 60_000;
let cached: { at: number; catalog: XpCatalog } | null = null;

export function invalidateXpCatalog(): void {
  cached = null;
}

export async function getXpCatalog(): Promise<XpCatalog> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.catalog;
  const groups = buildGroups(await loadPublished());
  const catalog = { groups, stamp: stampOf(groups), stops: indexStops(groups) };
  cached = { at: Date.now(), catalog };
  return catalog;
}

export async function getXpGroups(): Promise<ServerXpGroup[]> {
  return (await getXpCatalog()).groups;
}

/* What the stamp hashes is what a score depends on: which completions each
   group reads, what each stop is worth and whether it pays the bonus. Order
   does not change a score, so the lines are sorted first: reordering lessons
   leaves the stamp alone and restates nobody. */
function stampOf(groups: ServerXpGroup[]): string {
  const lines = groups.map((g) => {
    const stops = g.stops.map((s) => `${s.id}:${s.xp}`).sort();
    return `${g.key}|${JSON.stringify(g.source)}|${g.finishBonus ? 1 : 0}|${stops.join(',')}`;
  });
  const hash = createHash('sha256').update(lines.sort().join('\n')).digest('hex').slice(0, 16);
  return `${XP_FORMULA_VERSION}.${hash}`;
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
  /* In creation order, as the published feed reads them (routes/content.ts),
     so where two creators' items collide both sides pick the same one. */
  const docs = await ContentBucket.find({
    bucket: { $in: ['os-modules', 'standalone-modules', 'networking-lessons', 'programming-patches'] },
  })
    .sort({ _id: 1 })
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

/* ── What finishing a stop takes ── */

const NONE: StopCheck = { kind: 'none' };

const quizOf = (questions: unknown, rule: QuizRule): StopCheck =>
  Array.isArray(questions) && questions.length > 0 ? { kind: 'quiz', questions, rule } : NONE;

/** A studio lecture: a lab's flags, or the section's own quiz. */
function lectureCheck(lecture: AnyItem): StopCheck {
  if (lecture.kind === 'lab' && isPlainObject(lecture.lab)) {
    const completion = isPlainObject(lecture.lab.completion) ? lecture.lab.completion : {};
    const flags = Array.isArray(completion.flags) ? completion.flags.filter(isPlainObject) : [];
    return completion.mode === 'flags' && flags.length > 0 ? { kind: 'flags', flags } : NONE;
  }
  return quizOf(lecture.quizQuestions, 'all');
}

/** A studio lesson or challenge: a challenge is marked by its tests. */
function conceptCheck(concept: AnyItem): StopCheck {
  if (concept.type !== 'challenge' || !Array.isArray(concept.testCases)) return NONE;
  const tests = concept.testCases
    .filter(isPlainObject)
    .map((tc) => ({ id: str(tc.id), expectedOutput: str(tc.expectedOutput) }));
  return tests.length ? { kind: 'tests', tests } : NONE;
}

/* ── Merging, as the browser does ── */

interface Concept {
  id: string;
  order: number;
  m: StopMeasure;
  check: StopCheck;
}

const measured = (concepts: unknown): Concept[] =>
  (Array.isArray(concepts) ? concepts : [])
    .filter(isPlainObject)
    .map((c) => ({ id: str(c.id), order: order(c.order), m: measureConcept(c), check: conceptCheck(c) }));

const stopOf = (id: string, m: StopMeasure, check: StopCheck, difficulty?: unknown): ServerStop => ({
  id,
  xp: stopXp(m, difficulty),
  minutes: stopMinutes(m),
  check,
});

function buildGroups(published: Published): ServerXpGroup[] {
  const groups: ServerXpGroup[] = [];
  const seenSlugs = new Set<string>();

  /* Modules. A published module reusing a built-in's id replaces it (an admin
     editing the built-in course); the rest are added after, first one wins. */
  const overrideById = new Map(published.modules.map((m) => [str(m.id), m]));
  const staticIds = new Set(builtin.modules.map((m) => m.id));
  const addModule = (slug: string, stops: ServerStop[]) => {
    // One set of completions per slug, so two modules sharing one never count it twice.
    if (!slug || seenSlugs.has(slug)) return;
    seenSlugs.add(slug);
    groups.push({ key: groupKey.module(slug), source: { kind: 'module', slug }, stops, finishBonus: true });
  };
  const creatorStops = (mod: AnyItem): ServerStop[] => {
    const course = isPlainObject(mod.courseData) ? mod.courseData : {};
    const chapters = Array.isArray(course.modules) ? course.modules.filter(isPlainObject) : [];
    return chapters.flatMap((chapter) =>
      (Array.isArray(chapter.lectures) ? chapter.lectures.filter(isPlainObject) : []).map((lecture) =>
        stopOf(str(lecture.id), measureModuleStop(lecture), lectureCheck(lecture), mod.difficulty)
      )
    );
  };
  for (const mod of builtin.modules) {
    const override = overrideById.get(mod.id);
    if (override) {
      addModule(str(override.slug), creatorStops(override));
      continue;
    }
    const key = builtinAnswers.quizzes[mod.id] ?? {};
    addModule(
      mod.slug,
      mod.stops.map((s) => stopOf(s.id, s.m, quizOf(key[s.id], 'all'), mod.difficulty))
    );
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
  /* A built-in an admin has hidden still counts: hiding is temporary, and
     what a learner earned in it stays earned. The browser scores it too
     (data/programming getScoredProgrammingLanguages). */
  const languages = [
    ...builtin.languages,
    ...[...published.patches.entries()]
      .filter(([slug, patch]) => patch.newLanguage && !staticLanguageSlugs.has(slug))
      .map(([slug]) => ({ slug, modules: [] as BuiltinXpCatalog['languages'][number]['modules'] })),
  ];
  for (const language of languages) {
    const patch = published.patches.get(language.slug);
    const builtinTests = builtinAnswers.tests[language.slug] ?? {};
    const withPatchConcepts = (moduleSlug: string, base: Concept[]): Concept[] => {
      const extra = measured(patch?.newConcepts[moduleSlug]);
      if (extra.length === 0) return base;
      const overrides = new Map(extra.map((c) => [c.id, c]));
      const existing = new Set(base.map((c) => c.id));
      return [...base.map((c) => overrides.get(c.id) ?? c), ...extra.filter((c) => !existing.has(c.id))].sort(
        (a, b) => a.order - b.order
      );
    };
    const builtinConcepts = (concepts: BuiltinXpCatalog['languages'][number]['modules'][number]['concepts']): Concept[] =>
      concepts.map((c) => {
        const tests = builtinTests[c.id];
        return { ...c, check: tests?.length ? { kind: 'tests', tests } : NONE };
      });
    const modules = language.modules.map((mod) => ({
      slug: mod.slug,
      concepts: withPatchConcepts(mod.slug, builtinConcepts(mod.concepts)),
    }));
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
        stops: mod.concepts.map((c) => stopOf(c.id, c.m, c.check)),
        finishBonus: true,
      });
    }
  }

  /* Networking lessons stand alone: there is no module to finish. A creator
     version of a built-in lesson replaces it; the rest are added once each. */
  const creatorLessons = new Map<string, ServerStop>();
  for (const lesson of published.lessons) {
    const id = str(lesson.id);
    if (id && !creatorLessons.has(id)) {
      creatorLessons.set(id, stopOf(id, measureNetworkingLesson(lesson), quizOf(lesson.quiz, 'most')));
    }
  }
  const builtinLessonIds = new Set(builtin.networking.map((l) => l.id));
  const lessonStops = [
    ...builtin.networking.map(
      (l) => creatorLessons.get(l.id) ?? stopOf(l.id, l.m, quizOf(builtinAnswers.networking[l.id], 'most'))
    ),
    ...[...creatorLessons.values()].filter((stop) => !builtinLessonIds.has(stop.id)),
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

/** Pass `catalog` to score against one already in hand, so a stamp recorded
 *  beside the score is the stamp of the catalog that produced it. */
export async function scoreProgress(
  progress: ProgressLike | null | undefined,
  finishedBefore: Iterable<string> = [],
  catalog?: XpCatalog
): Promise<XpScore> {
  const groups = (catalog ?? (await getXpCatalog())).groups;
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
