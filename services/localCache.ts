/* ─── Local cache ───
 * A small key-value store in IndexedDB, for what is too large for localStorage:
 * the catalog copy a visit opens from, a creator's unsaved items, and a module
 * preview. Everything here is a convenience on top of the server, so nothing
 * here throws. A browser that refuses (private mode, storage blocked, disk full)
 * just answers "nothing" or "not saved", and the app carries on without it.
 */

const DB_NAME = 'academy-local';
const STORE = 'entries';
/** Some browsers never answer an open at all. Nothing may wait on this for long. */
const OPEN_TIMEOUT_MS = 1500;

/** The one entry that can always be fetched again, so it is what gives way
 *  when a write finds the disk full. */
export const CATALOG_ENTRY = 'catalog';

let opening: Promise<IDBDatabase | null> | null = null;

/** Asked once a visit. A browser that refuses, or has not answered in time, is
 *  not asked again, so only the first caller ever waits. If it does answer in
 *  the end, everything after that uses it. */
function openDb(): Promise<IDBDatabase | null> {
  if (opening) return opening;
  opening = new Promise<IDBDatabase | null>((resolve) => {
    let settled = false;
    const settle = (db: IDBDatabase | null) => {
      if (settled) {
        if (db) opening = Promise.resolve(db);
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(db);
    };
    const timer = setTimeout(() => settle(null), OPEN_TIMEOUT_MS);
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => {
        const db = request.result;
        const forget = () => {
          opening = null;
        };
        db.onclose = forget;
        db.onversionchange = () => {
          db.close();
          forget();
        };
        settle(db);
      };
      request.onerror = () => settle(null);
      request.onblocked = () => settle(null);
    } catch {
      settle(null);
    }
  });
  return opening;
}

/** Run one transaction, answering `fallback` if the browser refuses it. */
async function withStore<T>(
  mode: IDBTransactionMode,
  fallback: T,
  run: (store: IDBObjectStore, done: (value: T) => void) => void
): Promise<T> {
  const db = await openDb();
  if (!db) return fallback;
  return new Promise<T>((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      let answer = fallback;
      tx.oncomplete = () => resolve(answer);
      tx.onabort = () => resolve(fallback);
      tx.onerror = () => resolve(fallback);
      run(tx.objectStore(STORE), (value) => {
        answer = value;
      });
    } catch {
      resolve(fallback);
    }
  });
}

export function cacheGet<T>(key: string): Promise<T | undefined> {
  return withStore<T | undefined>('readonly', undefined, (store, done) => {
    const request = store.get(key);
    request.onsuccess = () => done(request.result as T | undefined);
  });
}

function attemptSet(key: string, value: unknown): Promise<boolean> {
  return withStore('readwrite', false, (store, done) => {
    store.put(value, key).onsuccess = () => done(true);
  });
}

/** Whether it was kept. A write that fails frees the catalog copy and tries
 *  once more, in that order: losing the copy costs one slower visit. */
export async function cacheSet(key: string, value: unknown): Promise<boolean> {
  if (await attemptSet(key, value)) return true;
  await cacheDelete(CATALOG_ENTRY);
  return attemptSet(key, value);
}

export function cacheDelete(key: string): Promise<void> {
  return withStore<void>('readwrite', undefined, (store) => {
    store.delete(key);
  });
}

/** Every entry whose key starts with `prefix`. */
export function cacheEntries<T>(prefix: string): Promise<[string, T][]> {
  return withStore<[string, T][]>('readonly', [], (store, done) => {
    const found: [string, T][] = [];
    const request = store.openCursor(IDBKeyRange.bound(prefix, `${prefix}￿`));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        done(found);
        return;
      }
      found.push([String(cursor.key), cursor.value as T]);
      cursor.continue();
    };
  });
}

export function cacheClear(prefix: string): Promise<void> {
  return withStore<void>('readwrite', undefined, (store) => {
    store.delete(IDBKeyRange.bound(prefix, `${prefix}￿`));
  });
}
