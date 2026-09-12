import { useEffect, useState } from 'react';
import { getNetworkingDone, getProgrammingDone, PROGRESS_EVENT } from '../services/progressService';

/**
 * Finished stops in a track, kept current.
 *
 * Both a course map and the contents beside a lesson draw the same ticks, and
 * both have to notice the moment one is earned: the lesson the reader is on
 * marks itself complete, and a second tab can mark another. Listening to the
 * progress event covers the first, the storage event the second.
 */
function useDoneSet(read: () => Set<string>, deps: unknown[]): Set<string> {
  const [done, setDone] = useState(read);

  useEffect(() => {
    const refresh = () => setDone(read());
    // Read again on the way in: the dependency that changed may be the course.
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return done;
}

/** Finished networking lessons, across every unit. */
export function useNetworkingDone(): Set<string> {
  return useDoneSet(getNetworkingDone, []);
}

/** Finished concepts in one language, lessons and challenges alike. */
export function useProgrammingDone(langSlug: string): Set<string> {
  return useDoneSet(() => getProgrammingDone(langSlug), [langSlug]);
}
