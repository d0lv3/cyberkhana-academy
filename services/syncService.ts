/* ─── Sync Service ───
 * Bridges the localStorage cache layer with the backend API:
 *  - hydrateFromServer(): on login, pulls everyone's PUBLISHED content into
 *    the published-* caches, takes in the server's record of my progress, and
 *    seeds my own creator-* buckets (first login migrates existing local
 *    content UP to the server instead of wiping it).
 *  - queueContentPush()/queueProgressPush(): debounced write-through called
 *    by creatorDataService/progressService on every local write. Progress
 *    pushes carry bookmarks only; completions go through completionService.
 *  - applyServerRecord(): takes in the server's answer to any progress write.
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
import { dayKeyOf } from '../backend/src/shared/streak';
import { forgetServerXp, nextScoreTicket, setServerXp } from './serverXp';
import { getLabProgress, saveLabProgress } from './labProgress';

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

/** Streak breakpoints this device has already celebrated, as a JSON array of
 *  day counts. The server decides what has been PAID; this only decides what
 *  has been SHOWN, so a card is not thrown twice for the same rung. */
export const STREAK_SEEN_KEY = 'academy-streak-seen';

/** The days the server has recorded, as 'YYYY-MM-DD' → activity count. Only
 *  ever written from the server's answers here, because the server is the one
 *  that records a day (backend/src/utils/studyDays.ts); streakService reads it
 *  as a cache so the card draws before the first pull lands. */
export const STUDY_DAYS_KEY = 'academy-study-days';

/** Fired when a push comes back having been paid for a breakpoint, so the
 *  celebration lands on whatever page the learner is on. */
export const STREAK_AWARD_EVENT = 'academy-streak-awarded';

export interface StreakAwardDetail {
  /** Breakpoints paid by that push, in days. */
  days: number[];
  /** XP they came to. */
  xp: number;
  /** The streak that earned them. */
  streak: number;
}

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

/* ── progress write-through ──
 *
 * The server keeps the record of what has been finished, and only the server
 * adds to it: each stop goes to it on its own, with its work, and is recorded
 * once that checks out (services/completionService.ts). The completions cached
 * here are a copy of its answer, never sent back. What this device still
 * pushes is what only it can know: which paths and modules were bookmarked,
 * and where the learner left off. */

/** The completions the server has recorded, per container. */
export interface Completions {
  programming: Record<string, string[]>;
  osModules: Record<string, string[]>;
  networking: string[];
}

/** A flag the server has accepted, in a lab of a module. */
export interface SolvedFlag {
  module: string;
  lab: string;
  flag: string;
}

/** The learner's record as the server returns it. */
export interface ProgressSnapshot extends Completions {
  enrolledPaths: string[];
  /** Optional so a client still validates against a server that predates it. */
  enrolledModules?: string[];
  /** The server records it, so it is never pushed. */
  finishedModules?: string[];
  /** The server records the days, so a client cannot claim one. Kept locally
   *  as a cache so the streak card draws before the pull. */
  studyDays?: Record<string, number>;
  solvedFlags?: SolvedFlag[];
  lastActivity: unknown | null;
}

/** What this device pushes: its bookmarks, and where it left off. */
export interface BookmarkSnapshot {
  enrolledPaths: string[];
  enrolledModules?: string[];
  /** The pusher's own calendar day, so the streak turns over at their
   *  midnight. The server holds it to a day either side of its own. */
  day?: string;
  lastActivity: unknown | null;
}

/** What the server answers any progress write with: where the account stands
 *  now, scored from exactly the completions it names. */
export interface ServerRecord {
  /** Lifetime XP, award and streak included. */
  xp?: number;
  /** The all-time board's figure, and the reset it counts from. */
  board?: { xp: number; since: string | null };
  completions?: Completions;
  finishedModules?: string[];
  studyDays?: Record<string, number>;
  streak?: number;
  /** Breakpoints this write paid for, in days, so the card can celebrate them. */
  streakAwarded?: number[];
  streakXpGained?: number;
}

/** Completions waiting on the server's pace clock (services/completionService.ts). */
export const PENDING_COMPLETIONS_KEY = 'academy-pending-completions';

/** Fired once a sign-in has pulled the account down, so work that was waiting
 *  on it (completions held by the pace clock) can carry on. */
export const HYDRATED_EVENT = 'academy-sync-hydrated';

export function isSyncEnabled(): boolean {
  return syncEnabled;
}

const PROG_PREFIX = 'academy-prog-';
const OS_PREFIX = 'academy-progress-';
const NET_KEY = 'academy-net';

/** Replace the cached completions with the server's. Nothing the server has
 *  not recorded stays ticked: a tick only ever comes from its answer. */
function writeCompletions(completions: unknown): void {
  if (!completions || typeof completions !== 'object') return;
  const c = completions as Partial<Completions>;
  const lists = (record: unknown): Map<string, string[]> => {
    const out = new Map<string, string[]>();
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      for (const [key, ids] of Object.entries(record)) {
        out.set(key, Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
      }
    }
    return out;
  };
  const programming = lists(c.programming);
  const osModules = lists(c.osModules);
  try {
    // Containers the server has nothing for go, then the rest are rewritten.
    removeKeys(
      (key) =>
        (key.startsWith(OS_PREFIX) && !osModules.has(key.slice(OS_PREFIX.length))) ||
        (!key.startsWith(OS_PREFIX) && key.startsWith(PROG_PREFIX) && !programming.has(key.slice(PROG_PREFIX.length)))
    );
    for (const [lang, ids] of programming) localStorage.setItem(`${PROG_PREFIX}${lang}`, JSON.stringify(ids));
    for (const [slug, ids] of osModules) localStorage.setItem(`${OS_PREFIX}${slug}`, JSON.stringify(ids));
    const net = Array.isArray(c.networking) ? c.networking.filter((id): id is string => typeof id === 'string') : [];
    localStorage.setItem(NET_KEY, JSON.stringify(net));
  } catch {
    /* storage unavailable: the next answer writes it again */
  }
}

/** Keep the flags the server has accepted in each lab's working state, so a
 *  lab reopened on any device shows what was already found, and nothing it
 *  has not accepted. */
function writeSolvedFlags(solved: unknown): void {
  if (!Array.isArray(solved)) return;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('academy-lab-')) continue;
      const state = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      if (Array.isArray(state.flagsSolved) && state.flagsSolved.length) {
        localStorage.setItem(key, JSON.stringify({ ...state, flagsSolved: [] }));
      }
    }
  } catch {
    /* storage unavailable: nothing cached to correct */
  }
  const byLab = new Map<string, { slug: string; lab: string; flags: string[] }>();
  for (const s of solved as Partial<SolvedFlag>[]) {
    if (typeof s?.module !== 'string' || typeof s.lab !== 'string' || typeof s.flag !== 'string') continue;
    const key = `${s.module}\u0000${s.lab}`;
    const entry = byLab.get(key) ?? { slug: s.module, lab: s.lab, flags: [] };
    entry.flags.push(s.flag);
    byLab.set(key, entry);
  }
  for (const { slug, lab, flags } of byLab.values()) {
    saveLabProgress(slug, lab, { ...getLabProgress(slug, lab), flagsSolved: flags });
  }
}

/**
 * Take in the server's answer to a progress write: its record of what is
 * finished, its XP for exactly that, and the days and rungs it counted. Take
 * the ticket (nextScoreTicket) before sending the request, so a slower, older
 * answer cannot land on top of a newer one.
 */
export function applyServerRecord(ticket: number, result: ServerRecord | null | undefined): void {
  if (!result) return;
  if (result.completions) writeCompletions(result.completions);
  /* The server's figure for exactly these completions. It is what the app
     shows from now on, plus whatever is completed after they were collected. */
  setServerXp(ticket, result.xp, result.board, result.completions ?? collectCompletions());
  rememberFinishedModules(result.finishedModules);
  /* The server has just recounted the days; its answer replaces the cache
     rather than merging, because it is the record. */
  cacheStudyDays(result.studyDays);
  if (result.streakAwarded?.length) announceStreakAward(result);
  window.dispatchEvent(new Event(PROGRESS_EVENT));
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

/** The device's own calendar day, which is the one a streak turns over on. */
function localDayKey(): string {
  return dayKeyOf(new Date());
}

/** Keep the server's record of the days. It replaces rather than merges: the
 *  server counted them, and a local copy has no standing beside it. */
function cacheStudyDays(days: unknown): void {
  if (!days || typeof days !== 'object' || Array.isArray(days)) return;
  const clean: Record<string, number> = {};
  for (const [key, count] of Object.entries(days as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof count === 'number' && count > 0) clean[key] = count;
  }
  try {
    localStorage.setItem(STUDY_DAYS_KEY, JSON.stringify(clean));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/** Breakpoints the account was already paid for before this device saw it.
 *  Marked as shown without showing anything, the same way a level reached
 *  elsewhere is: arriving on a new browser is not an occasion. */
function rememberStreakAwards(days: unknown): void {
  if (!Array.isArray(days)) return;
  try {
    const seen = readArray<number>(STREAK_SEEN_KEY);
    const merged = setUnion(
      seen,
      days.filter((d): d is number => typeof d === 'number')
    );
    if (merged.length !== seen.length) {
      localStorage.setItem(STREAK_SEEN_KEY, JSON.stringify(merged));
    }
  } catch {
    /* storage unavailable: at worst a card shows once */
  }
}

/** Tell the app a breakpoint was just paid, so its card can be thrown. */
function announceStreakAward(result: ServerRecord): void {
  const detail: StreakAwardDetail = {
    days: result.streakAwarded ?? [],
    xp: result.streakXpGained ?? 0,
    streak: result.streak ?? 0,
  };
  window.dispatchEvent(new CustomEvent<StreakAwardDetail>(STREAK_AWARD_EVENT, { detail }));
}

/** Push the bookmarks, then keep what the server answers with. */
async function pushProgress(): Promise<void> {
  const ticket = nextScoreTicket();
  const result = await api.put<ServerRecord>('/progress', collectBookmarks());
  applyServerRecord(ticket, result);
}

/** The cached copy of the server's completions. */
export function collectCompletions(): Completions {
  const programming: Record<string, string[]> = {};
  const osModules: Record<string, string[]> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // NOTE: check the longer prefix first, 'academy-progress-' also matches 'academy-prog'.
    if (key.startsWith(OS_PREFIX)) {
      osModules[key.slice(OS_PREFIX.length)] = readArray<string>(key);
    } else if (key.startsWith(PROG_PREFIX)) {
      programming[key.slice(PROG_PREFIX.length)] = readArray<string>(key);
    }
  }
  return { programming, osModules, networking: readArray<string>(NET_KEY) };
}

/** What this device pushes, from the academy-* localStorage keys. */
export function collectBookmarks(): BookmarkSnapshot {
  let lastActivity: unknown | null = null;
  try {
    const raw = localStorage.getItem('academy-last-activity');
    lastActivity = raw ? JSON.parse(raw) : null;
  } catch {
    lastActivity = null;
  }

  return {
    enrolledPaths: readArray<string>('academy-paths-enrolled'),
    enrolledModules: readArray<string>('academy-modules-enrolled'),
    day: localDayKey(),
    lastActivity,
  };
}

let progressTimer: ReturnType<typeof setTimeout> | null = null;

export function queueProgressPush(): void {
  if (!syncEnabled) return;
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(async () => {
    progressTimer = null;
    /* The server replaces the bookmarks with what it is sent, so a push made
       after sign-out has cleared the caches would wipe them from the account.
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

/** Learning progress: the server's record of it, and the bookmarks pushed back. */
function isProgressKey(key: string): boolean {
  return (
    key.startsWith('academy-progress-') ||
    key.startsWith('academy-prog-') ||
    key === 'academy-net' ||
    key === 'academy-paths-enrolled' ||
    key === 'academy-modules-enrolled' ||
    key === 'academy-last-activity' ||
    key === FINISHED_MODULES_KEY ||
    /* The server records the days now, so this is its cache like any other
       and is hydrated back on the next sign-in. */
    key === STUDY_DAYS_KEY
  );
}

/** Account caches the server also holds, so dropping them loses nothing: the
 *  next sign-in hydrates them back. The module preview is a creator's
 *  unsaved draft snapshot and goes with their Studio content. */
function isServerBackedKey(key: string): boolean {
  return CREATOR_KEYS.includes(key) || isProgressKey(key) || key === 'academy-module-preview';
}

/** Account state that only ever lives on this device: the study streak, the
 *  day's activity tally feeding it and the weekly goal, a lab's working
 *  state, completions waiting on the pace clock, which feedback prompts were answered
 *  and any answer still waiting to send, the level and streak milestone last
 *  celebrated, whether
 *  the language question was put and the Academy tour taken, where each
 *  module was left, and the practice terminal's files. It stays through its
 *  owner's own sign-out, so
 *  they find their streak again, and goes the moment another account signs
 *  in. */
function isDeviceOnlyAccountKey(key: string): boolean {
  return (
    key.startsWith('academy-lab-') ||
    key === 'academy-feedback-answered' ||
    key === 'academy-feedback-pending' ||
    /* Completions the pace clock is holding: they go to the server as soon
       as it will take them, under the account that finished them. */
    key === PENDING_COMPLETIONS_KEY ||
    key === LEVEL_SEEN_KEY ||
    key === STREAK_SEEN_KEY ||
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
    forgetServerXp();
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
  forgetServerXp();
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

function setUnion<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

/** Take the server's record in. Its completions replace the cache, because
 *  only the server adds to them; the bookmarks merge as a union, so one made
 *  on this device before it synced is not lost. */
function mergeProgress(server: ProgressSnapshot | null): void {
  writeCompletions(server ?? { programming: {}, osModules: {}, networking: [] });
  if (!server) return;
  writeSolvedFlags(server.solvedFlags);

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
    const ticket = nextScoreTicket();
    const { progress, xp, board, streakAwarded } = await api.get<{
      progress: ProgressSnapshot | null;
      xp?: number;
      board?: { xp: number; since: string | null };
      streakAwarded?: number[];
    }>('/progress');
    rememberLevelReached(xp);
    /* Taken in after the level is marked as seen, so the figure arriving is
       never mistaken for a level just reached. It was scored from exactly the
       progress returned, which becomes this browser's copy just below. */
    setServerXp(ticket, xp, board, progress);
    /* The server's days, and the rungs it has already paid. Both are taken as
       old news on arrival, for the reason rememberLevelReached exists: a
       streak earned on another device is not something to celebrate here. */
    cacheStudyDays(progress?.studyDays);
    rememberStreakAwards(streakAwarded);
    const local = collectBookmarks();
    const hadLocal = local.enrolledPaths.length > 0 || (local.enrolledModules?.length ?? 0) > 0;
    mergeProgress(progress);
    // Push the merged bookmarks back so the server has any made here.
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
  window.dispatchEvent(new Event(HYDRATED_EVENT));
}
