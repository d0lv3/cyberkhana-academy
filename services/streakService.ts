/**
 * Study streak & weekly goal.
 *
 * Stores the set of days the learner was active, as local 'YYYY-MM-DD'
 * strings in localStorage (`academy-study-days`). Days are recorded by
 * recordActivity() in progressService, so opening any lesson counts.
 *
 * Dates are handled in the LEARNER'S local timezone on purpose: a streak is a
 * human habit, so "today" has to mean their today, not UTC's.
 */

const STUDY_DAYS_KEY = 'academy-study-days';
const WEEKLY_GOAL_KEY = 'academy-weekly-goal';

/** How many study days a week counts as hitting the goal. */
export const DEFAULT_WEEKLY_GOAL = 5;
/** Keep roughly a year of history; enough for any streak, bounded storage. */
const MAX_DAYS_KEPT = 400;

/** Local calendar day as 'YYYY-MM-DD' (not UTC — see module note). */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `offset` days before today, as a day key. */
function dayKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return dayKey(d);
}

function readDays(): Set<string> {
  try {
    const raw = localStorage.getItem(STUDY_DAYS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((d): d is string => typeof d === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeDays(days: Set<string>): void {
  try {
    // Newest first, trimmed — sorting lexicographically works on ISO dates.
    const trimmed = [...days].sort().reverse().slice(0, MAX_DAYS_KEPT);
    localStorage.setItem(STUDY_DAYS_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota — non-critical */
  }
}

/** Mark today as a study day. Idempotent, so it's safe to call on every lesson. */
export function recordStudyDay(): void {
  const days = readDays();
  const today = dayKey(new Date());
  if (days.has(today)) return;
  days.add(today);
  writeDays(days);
}

export function getWeeklyGoal(): number {
  try {
    const raw = Number(localStorage.getItem(WEEKLY_GOAL_KEY));
    return Number.isFinite(raw) && raw >= 1 && raw <= 7 ? raw : DEFAULT_WEEKLY_GOAL;
  } catch {
    return DEFAULT_WEEKLY_GOAL;
  }
}

export function setWeeklyGoal(goal: number): void {
  try {
    localStorage.setItem(WEEKLY_GOAL_KEY, String(Math.min(7, Math.max(1, Math.round(goal)))));
  } catch {
    /* quota */
  }
}

export interface StreakInfo {
  /** Consecutive days up to today (or yesterday, if today isn't done yet). */
  current: number;
  /** Best run ever recorded. */
  longest: number;
  /** Has the learner studied today? */
  todayDone: boolean;
  /** Distinct study days in the current week. */
  daysThisWeek: number;
  weeklyGoal: number;
  /** Mon→Sun flags for the current week, for the little day pips. */
  week: { key: string; done: boolean; isToday: boolean; isFuture: boolean }[];
}

export function getStreak(): StreakInfo {
  const days = readDays();
  const todayKey = dayKey(new Date());
  const todayDone = days.has(todayKey);

  /* Current streak — walk backwards from today. A day that hasn't happened
     yet shouldn't break the run, so if today isn't done we start at yesterday
     and today simply doesn't count toward the total. */
  let current = 0;
  let offset = todayDone ? 0 : 1;
  while (days.has(dayKeyOffset(offset))) {
    current++;
    offset++;
  }

  /* Longest run across all recorded days. */
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (prev) {
      const gapDays = Math.round((date.getTime() - prev.getTime()) / 86_400_000);
      run = gapDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = date;
  }

  /* Current week, Monday-first (getDay(): Sunday is 0). */
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const week: StreakInfo['week'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() - mondayOffset + i);
    const key = dayKey(d);
    week.push({
      key,
      done: days.has(key),
      isToday: key === todayKey,
      isFuture: i > mondayOffset,
    });
  }

  return {
    current,
    longest,
    todayDone,
    daysThisWeek: week.filter((d) => d.done).length,
    weeklyGoal: getWeeklyGoal(),
    week,
  };
}
