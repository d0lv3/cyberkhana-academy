/* ─── Streaks: how turning up is scored ───
 *
 * One file for both halves of the Academy, like shared/xp.ts beside it. The
 * browser reads the days it has cached so the card draws at once; the server
 * records the days itself and is the one that pays for them. The two must
 * agree on what a streak is, so the arithmetic lives here and nowhere else.
 * It imports nothing and touches no browser or Node API, because both builds
 * compile it.
 *
 * A day counts once three activities are finished on it. Days are kept as a
 * map of local 'YYYY-MM-DD' to how many activities landed, which is what lets
 * the heat map shade a busy day darker than a bare one.
 *
 * Why the server holds this at all: streak points are XP, and XP ranks people.
 * A streak kept only in localStorage could be typed into devtools, so the
 * server records a day when it OBSERVES new completions arrive, never because
 * a client claimed one.
 */

/** Activities a day needs before it joins a streak. */
export const DAILY_ACTIVITY_GOAL = 3;

export interface StreakBreakpoint {
  days: number;
  /** XP paid once, the first time the streak reaches `days`. */
  points: number;
}

/** The rungs that pay. A learner picks one as a goal, but every rung reached
 *  pays whether it was the goal or not: aiming at a week and carrying on to a
 *  hundred days should never earn less than aiming high and stopping short. */
export const STREAK_BREAKPOINTS: StreakBreakpoint[] = [
  { days: 7, points: 50 },
  { days: 30, points: 250 },
  { days: 100, points: 1000 },
  { days: 365, points: 5000 },
];

/** The goals a learner may choose between, which are the breakpoints. */
export const STREAK_GOALS = STREAK_BREAKPOINTS.map((b) => b.days);

export type StudyDays = Record<string, number>;

/** A local calendar day as 'YYYY-MM-DD'. */
export function dayKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `delta` days from a day key. Calendar arithmetic is done in UTC on a
 *  date-only value, which has no hours to be shifted by a daylight-saving
 *  change, so this never lands on the wrong day. */
export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** True for a well-formed 'YYYY-MM-DD' that is a real calendar date. */
export function isDayKey(key: unknown): key is string {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export interface StreakState {
  /** Consecutive qualifying days up to today, or up to yesterday when today
   *  is not finished yet. */
  current: number;
  /** The best run ever recorded. */
  longest: number;
  /** Activities finished today. */
  todayCount: number;
  /** Has today reached the daily goal? */
  todayDone: boolean;
}

/** What `days` amounts to, seen from `today` (the learner's local day). */
export function streakFrom(days: StudyDays, today: string): StreakState {
  const qualifies = (key: string) => (days[key] ?? 0) >= DAILY_ACTIVITY_GOAL;

  const todayCount = days[today] ?? 0;
  const todayDone = qualifies(today);

  /* Walk back from today. A day that has not happened yet must not break the
     run, so an unfinished today is stepped over rather than counted. */
  let current = 0;
  let cursor = todayDone ? today : shiftDay(today, -1);
  while (qualifies(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }

  /* The longest run anywhere in the record. Sorting ISO dates as strings puts
     them in calendar order, and two days are adjacent when one is the other
     shifted by a day. */
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of Object.keys(days).filter(qualifies).sort()) {
    run = prev !== null && shiftDay(prev, 1) === key ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = key;
  }

  return { current, longest, todayCount, todayDone };
}

/** Every breakpoint a streak of `streak` days has reached. */
export function breakpointsReached(streak: number): StreakBreakpoint[] {
  return STREAK_BREAKPOINTS.filter((b) => streak >= b.days);
}

/** The next rung above `streak`, or null once they are all behind. */
export function nextBreakpoint(streak: number): StreakBreakpoint | null {
  return STREAK_BREAKPOINTS.find((b) => streak < b.days) ?? null;
}

/** The rung a goal names, if it is one of them. */
export function breakpointFor(days: number): StreakBreakpoint | null {
  return STREAK_BREAKPOINTS.find((b) => b.days === days) ?? null;
}

/** Whether a number is one of the goals a learner may choose. */
export function isStreakGoal(value: unknown): value is number {
  return typeof value === 'number' && STREAK_GOALS.includes(value);
}
