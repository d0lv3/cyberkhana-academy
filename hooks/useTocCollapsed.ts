import { useCallback, useState } from 'react';

/**
 * Whether the course contents sit beside the lesson, remembered.
 *
 * One preference for the whole academy rather than one per track: a reader who
 * puts the contents away inside an OS module means it in a networking lesson
 * too, and finding the column back a moment later reads as the setting not
 * having taken. It only ever covers the pinned column, never the drawer: a
 * drawer you opened yourself is a drawer you asked for.
 *
 * The key predates this hook and keeps the shape it was written in, '1' and
 * '0', so nobody who already made the choice is reset by moving it here.
 */
const KEY = 'academy-toc-collapsed';

export function useTocCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      /* private mode, or storage disabled */
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        /* a full quota should not take the lesson down with it */
      }
      return next;
    });
  }, []);

  return [collapsed, toggle] as const;
}

export default useTocCollapsed;
