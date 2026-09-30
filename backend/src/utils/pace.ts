/* ─── Pacing the work nobody can check ───
 *
 * A quiz can be marked and a flag compared, but reading a lesson, watching a
 * video, or finishing a lab somewhere else leaves nothing to check, and a
 * challenge's solution is one click away. Recording those one stop at a time
 * is not enough on its own: a script could still claim every one of them in a
 * minute. So the server keeps each learner's pace clock, and credits a stop
 * only if the time it takes fits into the time that has actually passed.
 *
 * The clock is a moment in time. Crediting a stop moves it forward by the
 * stop's expected minutes (shared/xp.ts stopMinutes), divided by
 * PACE_SPEEDUP, so twice the course's own pace is fine. It can never be ahead
 * of now, and it never lags now by more than the head start: time spent away
 * banks up to PACE_HEAD_START_MINUTES and no further. Someone learning at any
 * real speed never sees it; someone skimming lessons they already know gets
 * the head start's worth at once, then has to wait; and a script runs no
 * faster than a person could.
 *
 * Flag labs are not paced: the flags are the proof, and the work that found
 * them happened on another site's clock.
 */

export const PACE_SPEEDUP = 2;
export const PACE_HEAD_START_MINUTES = 45;

const HEAD_START_MS = PACE_HEAD_START_MINUTES * 60_000;

export type PaceResult =
  | { ok: true; clock: Date }
  | { ok: false; retryInSeconds: number; readyAt: Date };

/**
 * Spend a stop's time on the clock, as of `now`. No single stop costs more
 * than the head start, so anything can be finished straight after a break.
 */
export function spendPace(clock: Date | null | undefined, minutes: number, now = Date.now()): PaceResult {
  const cost = Math.min(Math.max(0, minutes) * 60_000 / PACE_SPEEDUP, HEAD_START_MS);
  const floor = now - HEAD_START_MS;
  const start = Math.max(clock instanceof Date && Number.isFinite(clock.getTime()) ? clock.getTime() : floor, floor);
  const end = start + cost;
  if (end <= now) return { ok: true, clock: new Date(end) };
  return { ok: false, retryInSeconds: Math.ceil((end - now) / 1000), readyAt: new Date(end) };
}
