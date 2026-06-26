/* ─── Sync Service ───
 * Bridges the localStorage cache layer with the backend API:
 *  - hydrateFromServer(): on login, pulls everyone's PUBLISHED content into
 *    the published-* caches, merges server progress with local progress, and
 *    seeds my own creator-* buckets (first login migrates existing local
 *    content UP to the server instead of wiping it).
 *  - queueContentPush()/queueProgressPush(): debounced write-through called
 *    by creatorDataService/progressService on every local write.
 *
 * All pushes are no-ops until a session exists, so the app still works fully
 * offline against the local cache.
 */

import { api, ApiError } from './api';
import { PUBLISHED_CACHE_KEYS, SERVER_BUCKET_BY_STORAGE_KEY } from './creatorTypes';
// Cycle-safe: getTotalPoints is only ever called at runtime (inside functions).
import { getTotalPoints } from './pointsService';

/* Mirrors progressService's event name (defined locally to avoid an import
 * cycle — progressService imports this module for write-through). */
const PROGRESS_EVENT = 'academy-progress-changed';

let syncEnabled = false;

export function setSyncEnabled(enabled: boolean): void {
  syncEnabled = enabled;
}

/* ── helpers ── */

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ── content write-through ── */

const pendingBuckets = new Map<string, unknown[]>();
let bucketTimer: ReturnType<typeof setTimeout> | null = null;

export function queueContentPush(storageKey: string, items: unknown[]): void {
  const bucket = SERVER_BUCKET_BY_STORAGE_KEY[storageKey];
  if (!bucket || !syncEnabled) return;
  pendingBuckets.set(bucket, items);
  if (bucketTimer) clearTimeout(bucketTimer);
  bucketTimer = setTimeout(flushBuckets, 800);
}

async function flushBuckets(): Promise<void> {
  const entries = [...pendingBuckets.entries()];
  pendingBuckets.clear();
  for (const [bucket, items] of entries) {
    try {
      await api.put(`/content/${bucket}`, { items });
    } catch (err) {
      console.warn(`[sync] failed to push ${bucket}:`, err);
    }
  }
}

/* ── progress write-through ── */

export interface ProgressSnapshot {
  programming: Record<string, string[]>;
  osModules: Record<string, string[]>;
  networking: string[];
  enrolledPaths: string[];
  /** Client-computed leaderboard points total (omitted from server reads). */
  points?: number;
  lastActivity: unknown | null;
}

/** Builds the full snapshot from the academy-* localStorage keys. */
export function collectProgressSnapshot(): ProgressSnapshot {
  const programming: Record<string, string[]> = {};
  const osModules: Record<string, string[]> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // NOTE: check the longer prefix first — 'academy-progress-' also matches 'academy-prog'.
    if (key.startsWith('academy-progress-')) {
      osModules[key.slice('academy-progress-'.length)] = readArray<string>(key);
    } else if (key.startsWith('academy-prog-')) {
      programming[key.slice('academy-prog-'.length)] = readArray<string>(key);
    }
  }

  let lastActivity: unknown | null = null;
  try {
    const raw = localStorage.getItem('academy-last-activity');
    lastActivity = raw ? JSON.parse(raw) : null;
  } catch {
    lastActivity = null;
  }

  return {
    programming,
    osModules,
    networking: readArray<string>('academy-net'),
    enrolledPaths: readArray<string>('academy-paths-enrolled'),
    points: getTotalPoints(),
    lastActivity,
  };
}

let progressTimer: ReturnType<typeof setTimeout> | null = null;

export function queueProgressPush(): void {
  if (!syncEnabled) return;
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(async () => {
    try {
      await api.put('/progress', collectProgressSnapshot());
    } catch (err) {
      console.warn('[sync] failed to push progress:', err);
    }
  }, 800);
}

/* ── hydration ── */

function setUnion(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/** Progress only ever grows — merge as a union so offline work is never lost. */
function mergeProgress(server: ProgressSnapshot | null): void {
  if (!server) return;

  for (const [lang, ids] of Object.entries(server.programming ?? {})) {
    const key = `academy-prog-${lang}`;
    localStorage.setItem(key, JSON.stringify(setUnion(readArray<string>(key), ids)));
  }
  for (const [slug, ids] of Object.entries(server.osModules ?? {})) {
    const key = `academy-progress-${slug}`;
    localStorage.setItem(key, JSON.stringify(setUnion(readArray<string>(key), ids)));
  }
  localStorage.setItem(
    'academy-net',
    JSON.stringify(setUnion(readArray<string>('academy-net'), server.networking ?? []))
  );
  localStorage.setItem(
    'academy-paths-enrolled',
    JSON.stringify(setUnion(readArray<string>('academy-paths-enrolled'), server.enrolledPaths ?? []))
  );

  // Last activity: the newer timestamp wins.
  try {
    const localRaw = localStorage.getItem('academy-last-activity');
    const local = localRaw ? JSON.parse(localRaw) : null;
    const remote = server.lastActivity as { at?: string } | null;
    if (remote && (!local || String(remote.at ?? '') > String(local.at ?? ''))) {
      localStorage.setItem('academy-last-activity', JSON.stringify(remote));
    }
  } catch {
    /* keep local */
  }
}

/** Seed my own creator buckets; first login pushes existing local work UP. */
function seedOwnBuckets(serverBuckets: Record<string, unknown[] | undefined>): void {
  const pairs: Array<[string, string]> = Object.entries(SERVER_BUCKET_BY_STORAGE_KEY);
  for (const [storageKey, bucket] of pairs) {
    const serverItems = serverBuckets[bucket];
    if (serverItems !== undefined) {
      // Server is the source of truth once a bucket exists there.
      localStorage.setItem(storageKey, JSON.stringify(serverItems));
    } else {
      // Never synced: migrate any existing local content up.
      const local = readArray(storageKey);
      if (local.length > 0) queueContentPush(storageKey, local);
    }
  }
}

/**
 * Full hydration after authentication. Failures are non-fatal: the app keeps
 * working from the local cache.
 */
export async function hydrateFromServer(): Promise<void> {
  setSyncEnabled(true);

  // Everyone's published content → published-* caches (all roles).
  try {
    const { buckets } = await api.get<{ buckets: Record<string, unknown[]> }>(
      '/content/published'
    );
    localStorage.setItem(
      PUBLISHED_CACHE_KEYS.NETWORKING_LESSONS,
      JSON.stringify(buckets['networking-lessons'] ?? [])
    );
    localStorage.setItem(
      PUBLISHED_CACHE_KEYS.PROGRAMMING_PATCHES,
      JSON.stringify(buckets['programming-patches'] ?? [])
    );
    localStorage.setItem(
      PUBLISHED_CACHE_KEYS.OS_MODULES,
      JSON.stringify(buckets['os-modules'] ?? [])
    );
    localStorage.setItem(
      PUBLISHED_CACHE_KEYS.STANDALONE_MODULES,
      JSON.stringify(buckets['standalone-modules'] ?? [])
    );
    localStorage.setItem(PUBLISHED_CACHE_KEYS.PATHS, JSON.stringify(buckets['paths'] ?? []));
  } catch (err) {
    console.warn('[sync] could not hydrate published content:', err);
  }

  // My progress (all roles).
  try {
    const { progress } = await api.get<{ progress: ProgressSnapshot | null }>('/progress');
    const localSnap = collectProgressSnapshot();
    const hadLocal =
      localSnap.networking.length > 0 ||
      localSnap.enrolledPaths.length > 0 ||
      Object.values(localSnap.programming).some((ids) => ids.length > 0) ||
      Object.values(localSnap.osModules).some((ids) => ids.length > 0);
    mergeProgress(progress);
    // Push the merged union back so the server catches up with offline work.
    if (hadLocal || progress) queueProgressPush();
  } catch (err) {
    console.warn('[sync] could not hydrate progress:', err);
  }

  // My creator buckets (creators/admins only — 403 for students is expected).
  try {
    const { buckets } = await api.get<{ buckets: Record<string, unknown[]> }>('/content/mine');
    seedOwnBuckets(buckets ?? {});
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 403)) {
      console.warn('[sync] could not hydrate own content:', err);
    }
  }

  window.dispatchEvent(new Event(PROGRESS_EVENT));
}
