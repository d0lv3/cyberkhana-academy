/* ─── Universities an admin has added ───
 *
 * The built-in list ships in the bundle. The ones an admin added since are on
 * the server, so they are fetched here, handed to data/iraqUniversities.ts
 * (which every page reads the list through) and kept in localStorage, so the
 * picker and the Arabic names are right from the first paint next time.
 *
 * The cache is public content, like the published-* caches beside it: it is
 * the same for every account, so signing out leaves it alone.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { api } from './api';
import { setAddedUniversities, type University } from '../data/iraqUniversities';

/** An added university as the admin page lists it. */
export interface ManagedUniversity extends University {
  id: string;
  /** Members who have chosen it. */
  members: number;
  createdAt?: string;
}

const CACHE_KEY = 'published-universities';

/** Refetch at most this often for pages that only show a name. The picker and
 *  the admin page ask for a fresh list every time. */
const FRESH_MS = 5 * 60_000;

/* Anything read back from storage or the network is checked before it is
   trusted to be a list of universities. */
function clean(list: unknown): University[] {
  if (!Array.isArray(list)) return [];
  const out: University[] = [];
  for (const item of list) {
    const u = item as { name?: unknown; ar?: unknown; type?: unknown } | null;
    if (!u || typeof u.name !== 'string' || !u.name) continue;
    out.push({
      name: u.name,
      ar: typeof u.ar === 'string' && u.ar ? u.ar : undefined,
      type: u.type === 'private' ? 'private' : 'public',
    });
  }
  return out;
}

function readCache(): University[] {
  try {
    return clean(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

/* The list as of the last visit, in place before anything renders. */
setAddedUniversities(readCache());

let version = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let loadedAt = 0;
let inFlight: Promise<void> | null = null;

/** Fetch the added universities. Quiet on failure (signed out, offline): the
 *  cached list stands, and the built-in one is always there. */
export function refreshUniversities(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && loadedAt && Date.now() - loadedAt < FRESH_MS) return Promise.resolve();
  inFlight = api
    .get<{ universities: unknown }>('/universities')
    .then(({ universities }) => {
      const list = clean(universities);
      loadedAt = Date.now();
      setAddedUniversities(list);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        /* storage unavailable: the list still holds for this visit */
      }
      version++;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * For anything that shows a university: re-renders when the list arrives or
 * changes, and makes sure it has been fetched. Returns a number that changes
 * with the list, for a `useMemo` that depends on it. Pass `fresh` where a
 * member is choosing, so one added a minute ago is there to choose.
 */
export function useUniversities(fresh = false): number {
  const current = useSyncExternalStore(subscribe, () => version);
  useEffect(() => {
    void refreshUniversities(fresh);
  }, [fresh]);
  return current;
}
