/* ─── Progress Service ───
 * The single source of truth for learner progress across every track.
 *
 * One place owns the localStorage keys so the dashboard, header, sidebar and
 * the lesson viewers can never disagree about "how much have I done?".
 *
 * Storage shape (all arrays of completed item-ids, JSON-encoded):
 *   academy-prog-<langSlug>   → programming concept ids (lessons + challenges)
 *   academy-progress-<slug>   → OS-module lecture ids
 *   academy-net               → networking lesson ids
 */

import { useEffect, useState } from 'react';
import { getProgrammingLanguages } from '../data/programming';
import { getNetworkingLessons } from '../data/networking';
import { getFundamentalsByCategory, getMergedFundamentalModules } from '../data/fundamentalsData';
import { buildCatalogIndex } from '../data/pathCatalog';
import { queueProgressPush } from './syncService';
import type { PathStep } from './creatorTypes';

const progKey = (langSlug: string) => `academy-prog-${langSlug}`;
const osKey = (slug: string) => `academy-progress-${slug}`;
const NET_KEY = 'academy-net';
const PATHS_ENROLLED_KEY = 'academy-paths-enrolled';
const LAST_ACTIVITY_KEY = 'academy-last-activity';

/** Fired whenever any progress is written, so persistent UI (header/sidebar) can refresh. */
export const PROGRESS_EVENT = 'academy-progress-changed';

export function emitProgressChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

/* ── raw helpers ── */

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]));
  emitProgressChange();
  // Write-through to the server (debounced; no-op when signed out).
  queueProgressPush();
}

/* ── programming ── */

export function getProgrammingDone(langSlug: string): Set<string> {
  return readSet(progKey(langSlug));
}

/** Mark a programming concept (lesson or challenge) complete. Returns the new set. */
export function markProgrammingDone(langSlug: string, conceptId: string): Set<string> {
  const set = readSet(progKey(langSlug));
  if (!set.has(conceptId)) {
    set.add(conceptId);
    writeSet(progKey(langSlug), set);
  }
  return new Set(set);
}

/* ── networking ── */

export function getNetworkingDone(): Set<string> {
  return readSet(NET_KEY);
}

export function isNetworkingDone(lessonId: string): boolean {
  return readSet(NET_KEY).has(lessonId);
}

/** Mark a networking lesson complete. Returns the new set. */
export function markNetworkingDone(lessonId: string): Set<string> {
  const set = readSet(NET_KEY);
  if (!set.has(lessonId)) {
    set.add(lessonId);
    writeSet(NET_KEY, set);
  }
  return new Set(set);
}

/* ── OS modules ── */

/** Number of completed lectures stored for an OS module. */
export function getOSModuleDoneCount(slug: string): number {
  return readSet(osKey(slug)).size;
}

/* ── last activity ──
 * The most recently opened lesson/module across every track, so the
 * dashboard's "Jump back in" can resume anywhere — not just Python.
 */

export interface LastActivity {
  kind: TrackKey;
  /** Route to reopen exactly where the learner was. */
  route: string;
  title: { en: string; ar: string };
  /** Short context line, e.g. "Python" or a module name. */
  context?: string;
  at: string;
}

export function recordActivity(activity: Omit<LastActivity, 'at'>): void {
  try {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      JSON.stringify({ ...activity, at: new Date().toISOString() })
    );
  } catch {
    /* quota — non-critical */
  }
  emitProgressChange();
  queueProgressPush();
}

export function getLastActivity(): LastActivity | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as LastActivity) : null;
  } catch {
    return null;
  }
}

/* ── learning paths ── */

export function getEnrolledPaths(): Set<string> {
  return readSet(PATHS_ENROLLED_KEY);
}

export function isPathEnrolled(pathId: string): boolean {
  return readSet(PATHS_ENROLLED_KEY).has(pathId);
}

export function enrollInPath(pathId: string): void {
  const set = readSet(PATHS_ENROLLED_KEY);
  if (!set.has(pathId)) {
    set.add(pathId);
    writeSet(PATHS_ENROLLED_KEY, set);
  }
}

export function unenrollFromPath(pathId: string): void {
  const set = readSet(PATHS_ENROLLED_KEY);
  if (set.has(pathId)) {
    set.delete(pathId);
    writeSet(PATHS_ENROLLED_KEY, set);
  }
}

export interface PathStepState {
  /** The referenced content still exists and is published. */
  available: boolean;
  /** The underlying content has been completed. */
  complete: boolean;
  /** Freshly-resolved route (falls back to the stored route). */
  route: string;
}

export interface PathProgress {
  /** Available (live) steps only. */
  total: number;
  completed: number;
  pct: number;
  /** Per-step state, aligned to the input `steps` array. */
  states: PathStepState[];
  /** Index of the first available, incomplete step — or -1 if none. */
  nextIndex: number;
}

/**
 * Resolve a path's steps against live content and derive completion from the
 * learner's existing progress. A step is "complete" when its underlying
 * content is complete — so finishing a lesson anywhere lights up the path.
 * Steps whose content was unpublished/removed are flagged unavailable instead
 * of becoming dead links.
 */
export function getPathProgress(steps: PathStep[]): PathProgress {
  const catalog = buildCatalogIndex();

  // Modules by id → slug + total lessons (any category — paths can reference
  // general-topic standalone modules too)
  const osById = new Map<string, { slug: string; total: number }>();
  for (const m of getMergedFundamentalModules()) {
    osById.set(m.id, { slug: m.slug, total: m.totalLessons });
  }

  // Programming modules by id → language slug + concept ids
  const progById = new Map<string, { langSlug: string; conceptIds: string[] }>();
  for (const language of getProgrammingLanguages()) {
    for (const mod of language.modules) {
      progById.set(mod.id, { langSlug: language.slug, conceptIds: mod.concepts.map((c) => c.id) });
    }
  }

  const netDone = getNetworkingDone();

  const states: PathStepState[] = steps.map((step) => {
    const catalogItem = catalog.get(`${step.kind}:${step.refId}`);
    const available = !!catalogItem;
    let complete = false;

    if (available) {
      if (step.kind === 'networking') {
        complete = netDone.has(step.refId);
      } else if (step.kind === 'os-module') {
        const info = osById.get(step.refId);
        complete = !!info && info.total > 0 && getOSModuleDoneCount(info.slug) >= info.total;
      } else if (step.kind === 'programming-module') {
        const info = progById.get(step.refId);
        if (info && info.conceptIds.length > 0) {
          const done = getProgrammingDone(info.langSlug);
          complete = info.conceptIds.every((id) => done.has(id));
        }
      }
    }

    return { available, complete, route: catalogItem?.route ?? step.route };
  });

  const live = states.filter((s) => s.available);
  const total = live.length;
  const completed = live.filter((s) => s.complete).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextIndex = states.findIndex((s) => s.available && !s.complete);

  return { total, completed, pct, states, nextIndex };
}

/* ── aggregate ──
 * The canonical "overall progress" used by the dashboard hero, header and
 * sidebar. Counts completed units against total units across all tracks.
 */

export type TrackKey = 'programming' | 'networking' | 'os';

export interface TrackProgress {
  key: TrackKey;
  done: number;
  total: number;
}

export interface OverallProgress {
  completedUnits: number;
  totalUnits: number;
  pct: number;
  xp: number;
  level: number;
  xpInLevel: number;
}

const XP_PER_UNIT = 20;
const XP_PER_LEVEL = 100;

/** Per-track completed vs. total units. The shared basis for all progress numbers. */
export function getTrackProgress(): TrackProgress[] {
  // Programming — every language patch with content
  let progDone = 0;
  let progTotal = 0;
  for (const language of getProgrammingLanguages()) {
    const ids = language.modules.flatMap((m) => m.concepts.map((c) => c.id));
    if (ids.length === 0) continue;
    const done = getProgrammingDone(language.slug);
    progDone += ids.filter((id) => done.has(id)).length;
    progTotal += ids.length;
  }

  // Networking — completed lessons (intersected with live lessons so stale ids don't inflate)
  const netLessons = getNetworkingLessons();
  const netDone = getNetworkingDone();
  const netDoneCount = netLessons.filter((l) => netDone.has(l.id)).length;

  // Operating systems — completed lectures vs. total lessons
  let osDone = 0;
  let osTotal = 0;
  for (const mod of getFundamentalsByCategory('operating-systems')) {
    osDone += Math.min(getOSModuleDoneCount(mod.slug), mod.totalLessons);
    osTotal += mod.totalLessons;
  }

  return [
    { key: 'programming', done: progDone, total: progTotal },
    { key: 'networking', done: netDoneCount, total: netLessons.length },
    { key: 'os', done: osDone, total: osTotal },
  ];
}

export function getOverallProgress(): OverallProgress {
  const tracks = getTrackProgress();
  const completedUnits = tracks.reduce((s, t) => s + t.done, 0);
  const totalUnits = tracks.reduce((s, t) => s + t.total, 0);

  const pct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const xp = completedUnits * XP_PER_UNIT;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;

  return { completedUnits, totalUnits, pct, xp, level, xpInLevel };
}

/**
 * Live overall progress for persistent UI (header, sidebar) that never unmounts.
 * Refreshes on any progress write (same tab via PROGRESS_EVENT, other tabs via storage).
 */
export function useOverallProgress(): OverallProgress {
  const [progress, setProgress] = useState<OverallProgress>(getOverallProgress);

  useEffect(() => {
    const refresh = () => setProgress(getOverallProgress());
    refresh(); // catch any change between first render and effect
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return progress;
}
