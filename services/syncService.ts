/* ─── Sync Service ───
 * Bridges the localStorage cache layer with the backend API:
 *  - hydrateFromServer(): on login, pulls everyone's PUBLISHED content into
 *    the published-* caches, merges server progress with local progress, and
 *    seeds my own creator-* buckets (first login migrates existing local
 *    content UP to the server instead of wiping it).
 *  - queueContentPush()/queueProgressPush(): debounced write-through called
 *    by creatorDataService/progressService on every local write.
 *  - claimCachesFor() / flushPendingSync() / forgetServerBackedCaches(): keep
 *    the caches to one account at a time (see "Whose caches these are").
 *
 * All pushes are no-ops until a session exists, so the app still works fully
 * offline against the local cache.
 */

import { api, ApiError } from './api';
import { PUBLISHED_CACHE_KEYS, SERVER_BUCKET_BY_STORAGE_KEY, STORAGE_KEYS } from './creatorTypes';
import { TOUR_SEEN_KEY } from './tourService';
import { LANG_CHOSEN_KEY } from './languageChoice';
import { levelFor } from '../backend/src/shared/xp';

/* Mirrors progressService's event name (defined locally to avoid an import
 * cycle — progressService imports this module for write-through). */
const PROGRESS_EVENT = 'academy-progress-changed';

/** Modules the server has recorded as finished, so their XP bonus stays when a
 *  lesson is added later. Only ever written from the server's answers here;
 *  progressService reads it. */
export const FINISHED_MODULES_KEY = 'academy-finished-modules';

/** The highest level this device has celebrated. The level-up card
 *  (components/levels/LevelUpHost.tsx) shows only when the level passes it. */
export const LEVEL_SEEN_KEY = 'academy-level-seen';

/** Levels the account already had are not news on this device: signing in
 *  on a new one counts the server's level as celebrated, so pulling progress
 *  down never throws a card for a level reached somewhere else. */
function rememberLevelReached(xp: unknown): void {
  if (typeof xp !== 'number') return;
  try {
    const level = levelFor(xp).level.number;
    const seen = Number(localStorage.getItem(LEVEL_SEEN_KEY)) || 0;
    if (level > seen) localStorage.setItem(LEVEL_SEEN_KEY, String(level));
  } catch {
    /* storage unavailable: at worst the card shows once */
  }
}

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
  bucketTimer = setTimeout(() => {
    bucketTimer = null;
    // Signed out in the meantime: sign-out already pushed what was waiting.
    if (syncEnabled) void flushBuckets();
    else pendingBuckets.clear();
  }, 800);
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
  /** Optional so a client still validates against a server that predates it. */
  enrolledModules?: string[];
  /** Sent by the server only: never pushed, because the server records it. */
  finishedModules?: string[];
  lastActivity: unknown | null;
}

/** What the server answers a push with, scored from the completions it was sent. */
interface PushResult {
  xp?: number;
  finishedModules?: string[];
}

/** Keep the server's list of finished modules, adding to what is cached. */
function rememberFinishedModules(keys: unknown): void {
  if (!Array.isArray(keys)) return;
  const current = readArray<string>(FINISHED_MODULES_KEY);
  const merged = setUnion(current, keys.filter((k): k is string => typeof k === 'string'));
  if (merged.length === current.length) return;
  try {
    localStorage.setItem(FINISHED_MODULES_KEY, JSON.stringify(merged));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/** Push the snapshot, then keep what the server worked out from it. */
async function pushProgress(): Promise<void> {
  const result = await api.put<PushResult>('/progress', collectProgressSnapshot());
  rememberFinishedModules(result?.finishedModules);
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
    enrolledModules: readArray<string>('academy-modules-enrolled'),
    lastActivity,
  };
}

let progressTimer: ReturnType<typeof setTimeout> | null = null;

export function queueProgressPush(): void {
  if (!syncEnabled) return;
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(async () => {
    progressTimer = null;
    /* The server replaces the whole snapshot, points included, so a push
       made after sign-out has cleared the caches would wipe the account.
       Sign-out pushes what was waiting itself; a late timer stands down. */
    if (!syncEnabled) return;
    try {
      await pushProgress();
    } catch (err) {
      console.warn('[sync] failed to push progress:', err);
    }
  }, 800);
}

/* ── Whose caches these are ──
 *
 * Everything above lives under fixed localStorage keys, not per account, and
 * is pushed to whichever account is signed in. So the caches must belong to
 * exactly one account at a time. `academy-cache-owner` records which: it is
 * claimed on every sign-in before anything reads or pushes, and nothing
 * cached under one account is ever merged into, or pushed as, another.
 *
 * Device preferences are not account data and are never touched: the
 * interface language, collapsed panels, the terminal dock, `ck.*` layout
 * choices, and the published-* caches, which hold public content that
 * hydration refreshes anyway.
 */

export const CACHE_OWNER_KEY = 'academy-cache-owner';

/** The creator-* keys: my own Studio content, mirrored from my buckets. */
const CREATOR_KEYS: string[] = Object.keys(SERVER_BUCKET_BY_STORAGE_KEY);

/** Learning progress: exactly what collectProgressSnapshot() pushes. */
function isProgressKey(key: string): boolean {
  return (
    key.startsWith('academy-progress-') ||
    key.startsWith('academy-prog-') ||
    key === 'academy-net' ||
    key === 'academy-paths-enrolled' ||
    key === 'academy-modules-enrolled' ||
    key === 'academy-last-activity' ||
    key === FINISHED_MODULES_KEY
  );
}

/** Account caches the server also holds, so dropping them loses nothing: the
 *  next sign-in hydrates them back. The module preview is a creator's
 *  unsaved draft snapshot and goes with their Studio content. */
function isServerBackedKey(key: string): boolean {
  return CREATOR_KEYS.includes(key) || isProgressKey(key) || key === 'academy-module-preview';
}

/** Account state that only ever lives on this device: the study streak and
 *  weekly goal, a lab's working state, which feedback prompts were answered
 *  and any answer still waiting to send, the level last celebrated, whether
 *  the language question was put and the Academy tour taken, where each
 *  module was left, and the practice terminal's files. It stays through its
 *  owner's own sign-out, so
 *  they find their streak again, and goes the moment another account signs
 *  in. */
function isDeviceOnlyAccountKey(key: string): boolean {
  return (
    key === 'academy-study-days' ||
    key === 'academy-weekly-goal' ||
    key.startsWith('academy-lab-') ||
    key === 'academy-feedback-answered' ||
    key === 'academy-feedback-pending' ||
    key === LEVEL_SEEN_KEY ||
    key === TOUR_SEEN_KEY ||
    key === LANG_CHOSEN_KEY ||
    key.startsWith('academy-lecture-') ||
    (key.startsWith('academy-shell-') && key !== 'academy-shell-dock')
  );
}

function removeKeys(match: (key: string) => boolean): void {
  // Collected first: removing while walking the keys would skip some.
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && match(key)) doomed.push(key);
  }
  for (const key of doomed) localStorage.removeItem(key);
}

/** Queued pushes belong to the session that queued them. */
function discardPendingPushes(): void {
  if (bucketTimer) clearTimeout(bucketTimer);
  bucketTimer = null;
  pendingBuckets.clear();
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = null;
}

/** The names a Studio cache's items are credited to. Programming patches
 *  carry theirs on the modules, lessons and language inside each patch. */
function creditedNames(storageKey: string, items: unknown[]): string[] {
  const names: string[] = [];
  const take = (item: unknown) => {
    const name = (item as { authorName?: unknown } | null)?.authorName;
    names.push(typeof name === 'string' ? name : '');
  };
  for (const item of items) {
    if (storageKey === STORAGE_KEYS.PROGRAMMING_PATCHES) {
      const patch = (item ?? {}) as {
        newModules?: unknown[];
        newConcepts?: Record<string, unknown[]>;
        newLanguage?: unknown;
      };
      (Array.isArray(patch.newModules) ? patch.newModules : []).forEach(take);
      for (const list of Object.values(patch.newConcepts ?? {})) {
        (Array.isArray(list) ? list : []).forEach(take);
      }
      if (patch.newLanguage) take(patch.newLanguage);
    } else {
      take(item);
    }
  }
  return names;
}

/** Is everything in this Studio cache credited to this person? For content
 *  cached before owners were recorded, that is the only evidence there is. */
function creditedTo(storageKey: string, displayName: string): boolean {
  const names = creditedNames(storageKey, readArray(storageKey));
  return !!displayName && names.length > 0 && names.every((name) => name === displayName);
}

/**
 * Make the local caches this account's, before anything reads or pushes them.
 * Called on every sign-in and session restore, ahead of hydration.
 *
 *  - Same owner: nothing to do.
 *  - Another owner: none of it is this person's. Every account cache goes,
 *    device-only state included.
 *  - No owner yet: caches from before owners were recorded, left by whoever
 *    used this browser last. Their progress is already on their account, so
 *    it is dropped rather than merged into this one, and so are a lab's
 *    working state (it can complete a lesson) and feedback still waiting to
 *    send (it would go out under this name). Studio content stays only where
 *    every item is credited to this person, for the first-login migration in
 *    seedOwnBuckets.
 */
export function claimCachesFor(account: { id: string; displayName: string }): void {
  try {
    const owner = localStorage.getItem(CACHE_OWNER_KEY);
    if (owner === account.id) return;

    discardPendingPushes();
    if (owner) {
      removeKeys((key) => isServerBackedKey(key) || isDeviceOnlyAccountKey(key));
    } else {
      removeKeys(
        (key) =>
          isProgressKey(key) ||
          key === 'academy-module-preview' ||
          key.startsWith('academy-lab-') ||
          key === 'academy-feedback-pending'
      );
      for (const key of CREATOR_KEYS) {
        if (!creditedTo(key, account.displayName)) localStorage.removeItem(key);
      }
    }
    localStorage.setItem(CACHE_OWNER_KEY, account.id);
  } catch {
    /* Storage unavailable: nothing is cached, so nothing can cross over. */
  }
}

/**
 * Before signing out, while the session can still save: push whatever is
 * still waiting, so it lands on the account that made it. Must run before
 * the caches are cleared (see queueProgressPush for why the order matters).
 */
export async function flushPendingSync(): Promise<void> {
  if (bucketTimer) clearTimeout(bucketTimer);
  bucketTimer = null;
  const progressWaiting = progressTimer !== null;
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = null;

  await flushBuckets();
  if (progressWaiting && syncEnabled) {
    try {
      await pushProgress();
    } catch (err) {
      console.warn('[sync] failed to push progress:', err);
    }
  }
}

/**
 * After signing out: drop the account caches the server holds, and the
 * Studio's per-tab stashes of other creators' items. Device-only state and
 * the owner mark stay, so the same person finds their streak again, and
 * anyone else's sign-in clears them (claimCachesFor).
 */
export function forgetServerBackedCaches(): void {
  discardPendingPushes();
  try {
    removeKeys(isServerBackedKey);
    const stashes: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('academy-')) stashes.push(key);
    }
    for (const key of stashes) sessionStorage.removeItem(key);
  } catch {
    /* Storage unavailable: nothing was cached. */
  }
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
  localStorage.setItem(
    'academy-modules-enrolled',
    JSON.stringify(setUnion(readArray<string>('academy-modules-enrolled'), server.enrolledModules ?? []))
  );
  localStorage.setItem(
    FINISHED_MODULES_KEY,
    JSON.stringify(setUnion(readArray<string>(FINISHED_MODULES_KEY), server.finishedModules ?? []))
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
      /* Never synced: migrate any existing local content up. Whatever is
         still cached here got through claimCachesFor, so it is this
         account's own work and nobody else's. */
      const local = readArray(storageKey);
      if (local.length > 0) queueContentPush(storageKey, local);
    }
  }
}

/**
 * Full hydration after authentication. Failures are non-fatal: the app keeps
 * working from the local cache.
 */
export async function hydrateFromServer(account: { id: string; displayName: string }): Promise<void> {
  /* The caller claims the caches before showing the session; confirming it
     here means no path can merge or seed another account's leftovers. */
  claimCachesFor(account);
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
      PUBLISHED_CACHE_KEYS.NETWORKING_UNITS,
      JSON.stringify(buckets['networking-units'] ?? [])
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
    const { progress, xp } = await api.get<{ progress: ProgressSnapshot | null; xp?: number }>('/progress');
    rememberLevelReached(xp);
    const localSnap = collectProgressSnapshot();
    const hadLocal =
      localSnap.networking.length > 0 ||
      localSnap.enrolledPaths.length > 0 ||
      (localSnap.enrolledModules?.length ?? 0) > 0 ||
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
