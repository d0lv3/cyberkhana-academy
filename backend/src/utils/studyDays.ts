/* ─── Recording the days somebody turned up ───
 *
 * The server keeps the streak because streak breakpoints pay XP, and XP ranks
 * people. Nothing here trusts a client's word for having studied: a day is
 * credited only when a push carries completions the server had not seen
 * before, so the work has to actually reach the server to count.
 */

import {
  breakpointsReached,
  isDayKey,
  shiftDay,
  type StreakBreakpoint,
  type StudyDays,
} from '../shared/streak';

interface CompletionSnapshot {
  programming?: Record<string, string[]>;
  osModules?: Record<string, string[]>;
  networking?: string[];
}

/** Every completion in a snapshot, namespaced by where it came from so the
 *  same lesson id under two languages is two different completions. */
function completionIds(snapshot: CompletionSnapshot | null | undefined): Set<string> {
  const ids = new Set<string>();
  if (!snapshot) return ids;
  for (const [slug, list] of Object.entries(snapshot.programming ?? {})) {
    for (const id of list ?? []) ids.add(`prog:${slug}:${id}`);
  }
  for (const [slug, list] of Object.entries(snapshot.osModules ?? {})) {
    for (const id of list ?? []) ids.add(`os:${slug}:${id}`);
  }
  for (const id of snapshot.networking ?? []) ids.add(`net:${id}`);
  return ids;
}

/** How many completions this push brings that the server had never seen.
 *  Removals count for nothing: unticking a lesson must not refund a day. */
export function newCompletionCount(
  before: CompletionSnapshot | null | undefined,
  after: CompletionSnapshot
): number {
  const seen = completionIds(before);
  let fresh = 0;
  for (const id of completionIds(after)) if (!seen.has(id)) fresh++;
  return fresh;
}

function utcDayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Which day to credit.
 *
 * A streak is a human habit, so it has to run on the learner's midnight, not
 * the server's, and only their browser knows where they are. Their day is
 * taken at face value but held to one day either side of the server's, which
 * covers every real timezone (UTC-12 to UTC+14) while leaving no room to
 * backfill a history.
 */
export function resolveStudyDay(claimed: unknown): string {
  const today = utcDayKey(new Date());
  if (isDayKey(claimed) && [shiftDay(today, -1), today, shiftDay(today, 1)].includes(claimed)) {
    return claimed;
  }
  return today;
}

/** Add today's new activities to the record. Returns a fresh map rather than
 *  editing in place, because Mongoose does not notice a mutated Mixed field. */
export function creditDay(days: StudyDays | undefined, day: string, count: number): StudyDays {
  const next: StudyDays = { ...(days ?? {}) };
  next[day] = (next[day] ?? 0) + count;
  return next;
}

/** Drop anything older than a year and a bit. A heat map shows 53 weeks, and
 *  the longest run worth remembering is inside that. */
export function trimStudyDays(days: StudyDays, today: string): StudyDays {
  const cutoff = shiftDay(today, -400);
  const kept: StudyDays = {};
  for (const [key, count] of Object.entries(days)) {
    if (isDayKey(key) && key >= cutoff && typeof count === 'number' && count > 0) kept[key] = count;
  }
  return kept;
}

export interface StreakAward {
  /** XP added by this push; zero when no new rung was reached. */
  gained: number;
  /** The rungs this push paid for, for the card that celebrates them. */
  reached: StreakBreakpoint[];
}

/** Pay for every breakpoint this streak has reached and not been paid for.
 *  Mutates the user in memory; the caller saves. */
export function awardStreakBreakpoints(
  user: { streakPoints?: number; streakAwarded?: number[] },
  streak: number
): StreakAward {
  const already = user.streakAwarded ?? [];
  const owed = breakpointsReached(streak).filter((b) => !already.includes(b.days));
  if (!owed.length) return { gained: 0, reached: [] };

  const gained = owed.reduce((sum, b) => sum + b.points, 0);
  user.streakPoints = (user.streakPoints ?? 0) + gained;
  user.streakAwarded = [...already, ...owed.map((b) => b.days)];
  return { gained, reached: owed };
}
