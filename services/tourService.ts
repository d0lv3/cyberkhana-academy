/* ─── The Academy tour ───
 *
 * Whether this account has been shown around, and the small amount of
 * cross-component talking the tour needs: opening the phone's sidebar drawer
 * so a navigation step has something to point at.
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

/* ── Talking to the app shell ──
 * On a phone the navigation is a drawer, so a step about Fundamentals has
 * nothing on screen to point at until the drawer is open. The tour asks for
 * it through a window event and AppLayout, which owns that state, answers.
 * An event rather than a context keeps the shell free of tour imports and
 * matches how progress changes already travel (PROGRESS_EVENT). */

export const TOUR_SIDEBAR_EVENT = 'academy-tour-sidebar';

export function requestTourSidebar(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOUR_SIDEBAR_EVENT, { detail: { open } }));
}

/** Is the viewport narrow enough that the navigation is a drawer? Matches the
 *  `md` breakpoint the sidebar itself switches at. */
export function navIsDrawer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

/** Does this visitor prefer less movement? Read at the moment it matters
 *  rather than cached, so a change of system setting takes effect. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
