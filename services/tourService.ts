/* ─── The Academy tour ───
 *
 * Whether this account has been shown around.
 *
 * The flag is written only when the learner finishes the tour or says no to
 * it. Closing the tab, reloading, or wandering off mid-tour leaves it unset,
 * so an interrupted tour is offered again rather than counted as taken.
 *
 * It lives on the device beside the other per-account interface state (the
 * level last celebrated, the study streak): syncService clears it when a
 * different account signs in here, which is what makes it per learner.
 */

export const TOUR_SEEN_KEY = 'academy-tour-seen';

/** How the tour ended. Both mean "do not open this by itself again". */
export type TourOutcome = 'finished' | 'skipped';

export function getTourOutcome(): TourOutcome | null {
  try {
    const raw = localStorage.getItem(TOUR_SEEN_KEY);
    return raw === 'finished' || raw === 'skipped' ? raw : null;
  } catch {
    /* private mode, or storage disabled */
    return null;
  }
}

/** Has this learner already been shown around on this device? */
export function hasSeenTour(): boolean {
  return getTourOutcome() !== null;
}

export function markTourSeen(outcome: TourOutcome): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, outcome);
  } catch {
    /* At worst the tour offers itself once more. */
  }
}

/** Forget the tour was taken, so it opens by itself again (used by tests and
 *  by anything that resets an account's first-run state). */
export function forgetTour(): void {
  try {
    localStorage.removeItem(TOUR_SEEN_KEY);
  } catch {
    /* nothing to forget */
  }
}

/* ── Asking for the tour ──
 * The tour's own code is fetched only for someone who is going to see it
 * (components/tour/TourGate.tsx), so the buttons that ask for it cannot call
 * into it. They say so here, and whatever is listening brings it up. */

const TOUR_REQUEST_EVENT = 'academy-tour-requested';

/** Show the learner around, from wherever. */
export function startTour(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TOUR_REQUEST_EVENT));
}

/** Hear every request for the tour. Returns the way to stop listening. */
export function onTourRequested(listener: () => void): () => void {
  window.addEventListener(TOUR_REQUEST_EVENT, listener);
  return () => window.removeEventListener(TOUR_REQUEST_EVENT, listener);
}

/* There used to be a window event here for opening the phone's navigation
   drawer, because a step about Fundamentals had nothing to point at until it
   was open. The phone's navigation is now a bar along the bottom carrying the
   same four rows the tour walks, so every one of those steps has its target on
   screen already and the shell has nothing to be asked for. */

/** Does this visitor prefer less movement? Read at the moment it matters
 *  rather than cached, so a change of system setting takes effect. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
