/* ─── Content store ───
 * Where the app reads course content from: memory, as JSON text, under the same
 * keys localStorage used to hold it. A read parses its own copy, so the pages
 * and the services built on them can change what they are given.
 *
 *  - published-*: everyone's published content. Kept on this device as well, in
 *    IndexedDB (services/localCache.ts), so the next visit can open from it. It
 *    can always be fetched again, so losing it costs one slower visit.
 *  - creator-*: a creator's own work. Never written down whole: the server has
 *    it, and a copy on the device could only go stale. Each visit's pull brings
 *    it, and what has not reached the server yet is backed up item by item
 *    (services/syncService.ts).
 *
 * This is why a full localStorage no longer matters to any of this. It used to
 * hold all of it, in about 5 MB shared with everything else on the site.
 */

import { CATALOG_ENTRY, cacheDelete, cacheGet, cacheSet } from './localCache';
import { PUBLISHED_CACHE_KEYS, STORAGE_KEYS } from './creatorTypes';

const memory = new Map<string, string>();

const CATALOG_KEYS: string[] = Object.values(PUBLISHED_CACHE_KEYS);

/* Where the catalog used to be kept. It goes as soon as this code runs: it is
   what filled the store up, and the next pull brings it back. */
try {
  for (const key of CATALOG_KEYS) localStorage.removeItem(key);
} catch {
  /* storage unavailable: nothing was kept there */
}

export function readContent<T>(key: string): T[] {
  const raw = memory.get(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

/** Replace what a key holds. Answers whether that changed anything. */
export function writeContent(key: string, json: string): boolean {
  if (memory.get(key) === json) return false;
  memory.set(key, json);
  if (CATALOG_KEYS.includes(key)) catalogOnDisk = false;
  return true;
}

export function forgetStudioContent(): void {
  for (const key of Object.values(STORAGE_KEYS)) memory.delete(key);
}

/* ── The catalog copy ──
 * All six lists are one entry, so a visit either finds a whole copy or none. */

let catalogOnDisk = false;

/** Bring the copy on this device into memory. Answers whether there was one.
 *  Anything a pull has already brought is newer, and stays. */
export async function loadCatalogCopy(): Promise<boolean> {
  const copy = await cacheGet<Record<string, string>>(CATALOG_ENTRY);
  if (!copy) return false;
  for (const key of CATALOG_KEYS) {
    if (typeof copy[key] !== 'string') return false;
  }
  for (const key of CATALOG_KEYS) {
    if (!memory.has(key)) memory.set(key, copy[key]);
  }
  catalogOnDisk = true;
  return true;
}

/** Keep what a pull brought for the next visit. Nobody waits on this and nobody
 *  hears about a failure: the next visit just waits for its pull. */
export function saveCatalogCopy(): void {
  if (catalogOnDisk) return;
  const copy: Record<string, string> = {};
  for (const key of CATALOG_KEYS) copy[key] = memory.get(key) ?? '[]';
  catalogOnDisk = true;
  void cacheSet(CATALOG_ENTRY, copy).then((kept) => {
    if (kept) return;
    catalogOnDisk = false;
    console.warn('[content] could not keep the catalog on this device; the next visit will fetch it.');
  });
}

/* ── A module preview ──
 * The Studio hands the draft being edited to a new tab, which has no memory in
 * common with it, so this one has to go through the device. */

const PREVIEW_ENTRY = 'module-preview';
const PREVIEW_FALLBACK_KEY = 'academy-module-preview';
let preview: string | null = null;

/** Answers whether the new tab will be able to read it. */
export async function setModulePreview(json: string): Promise<boolean> {
  preview = json;
  if (await cacheSet(PREVIEW_ENTRY, json)) return true;
  try {
    localStorage.setItem(PREVIEW_FALLBACK_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export async function loadModulePreview(): Promise<void> {
  const kept = await cacheGet<string>(PREVIEW_ENTRY);
  if (kept) {
    preview = kept;
    return;
  }
  try {
    preview = localStorage.getItem(PREVIEW_FALLBACK_KEY);
  } catch {
    preview = null;
  }
}

/** The draft being previewed, or null. Loaded before the page renders. */
export function readModulePreview<T>(): T | null {
  try {
    return preview ? (JSON.parse(preview) as T) : null;
  } catch {
    return null;
  }
}

export function clearModulePreview(): void {
  preview = null;
  void cacheDelete(PREVIEW_ENTRY);
}
