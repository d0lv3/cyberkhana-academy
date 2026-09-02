import { useEffect, useState } from 'react';

/**
 * State that survives a reload, for the small preferences a reader sets by
 * hand: how wide they like a pane, whether they keep it open at all.
 *
 * Those are not decisions anyone should have to restate on every lesson, and
 * they are also not worth an error if the browser will not cooperate — private
 * browsing and blocked site data both throw on plain `localStorage` access — so
 * every read and write is guarded and simply falls back to the default.
 *
 * `parse` returns null for anything it does not recognise, which covers a value
 * left behind by an older version of the app as well as outright junk.
 */
export function useStoredState<T>(key: string, fallback: T, parse: (raw: string) => T | null) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw === null ? null : parse(raw);
      return parsed === null ? fallback : parsed;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Not being able to remember a panel size is not worth interrupting anyone over. */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** Parses a remembered number, keeping it inside the range that still makes sense. */
export const storedNumber = (clamp: (n: number) => number) => (raw: string) => {
  const n = Number(raw);
  return Number.isFinite(n) ? clamp(n) : null;
};

/** Parses a remembered boolean. */
export const storedBoolean = (raw: string) => (raw === 'true' ? true : raw === 'false' ? false : null);

export default useStoredState;
