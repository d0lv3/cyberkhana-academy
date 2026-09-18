/**
 * Study streak & weekly goal.
 *
 * A day joins the streak once the learner FINISHES three activities on it:
 * three programming concepts, three module lectures, three networking
 * lessons, or any mix of them. Opening a lesson is deliberately not enough.
 * progressService credits an activity from inside its mark*Done guards, so
 * only a genuine first-time completion ever counts.
 *
 * Two keys back this:
 *   academy-study-days   → local 'YYYY-MM-DD' strings for days that qualified
 *   academy-day-activity → the running day's distinct activity ids
 *
 * Crediting ids rather than bumping a plain counter is what keeps a day
 * honest: resetting progress and redoing the same lesson cannot pay twice.
 *
 * Dates are handled in the LEARNER'S local timezone on purpose: a streak is a
 * human habit, so "today" has to mean their today, not UTC's.
 */

const STUDY_DAYS_KEY = 'academy-study-days';
const DAY_ACTIVITY_KEY = 'academy-day-activity';
const WEEKLY_GOAL_KEY = 'academy-weekly-goal';

/** How many finished activities a day needs before it joins the streak. */
export const DAILY_ACTIVITY_GOAL = 3;
/** How many study days a week counts as hitting the goal. */
export const DEFAULT_WEEKLY_GOAL = 5;
/** Keep roughly a year of history; enough for any streak, bounded storage. */
const MAX_DAYS_KEPT = 400;
/** Ids remembered for the running day. The day has long since qualified by
 *  the time this bites, so the oldest are dropped rather than grown. */
const MAX_DAY_IDS = 50;

/* ── milestones ──
 * A second ladder beside the XP levels, earned by turning up rather than by
 * finishing content, which is why it is named and coloured separately. The
 * colours climb the same way the level ones do, from mint through the brand
 * greens and blues to gold, so the top of this ladder also looks rare.
 */

export interface StreakTier {
  /** The streak length that earns it. */
  days: number;
  name: { en: string; ar: string };
  color: string;
}

export const STREAK_TIERS: StreakTier[] = [
  { days: 5, name: { en: 'Spark', ar: 'شرارة' }, color: '#6ee7b7' },
  { days: 14, name: { en: 'Steady', ar: 'ثبات' }, color: '#00a859' },
  { days: 30, name: { en: 'Committed', ar: 'ملتزم' }, color: '#9fef00' },
  { days: 60, name: { en: 'Devoted', ar: 'مواظب' }, color: '#2dd4bf' },
  { days: 90, name: { en: 'Unstoppable', ar: 'لا يُوقف' }, color: '#60a5fa' },
  { days: 120, name: { en: 'Iron Will', ar: 'إرادة حديد' }, color: '#a78bfa' },
  { days: 180, name: { en: 'Machine', ar: 'آلة' }, color: '#f472b6' },
  { days: 365, name: { en: 'Immortal', ar: 'خالد' }, color: '#f3c84b' },
];

export interface TierProgress {
  /** Highest tier earned, or null before the first one. */
  current: StreakTier | null;
  /** The one being worked toward, or null once the ladder is finished. */
  next: StreakTier | null;
  /** How far from the current tier to the next, 0 to 1; 1 at the top. */
  fraction: number;
  /** Days still needed for `next`; 0 at the top. */
  toNext: number;
}

/** Where a streak of `days` stands on the ladder. */
export function tierFor(days: number): TierProgress {
  const safe = Math.max(0, Math.floor(Number.isFinite(days) ? days : 0));

  let index = -1;
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (safe >= STREAK_TIERS[i].days) {
      index = i;
      break;
    }
  }

  const current = index >= 0 ? STREAK_TIERS[index] : null;
  const next = STREAK_TIERS[index + 1] ?? null;
  if (!next) return { current, next: null, fraction: 1, toNext: 0 };

  // Progress runs from the tier just earned, so each span fills from empty.
  const from = current ? current.days : 0;
  const span = next.days - from;
  return {
    current,
    next,
    fraction: span > 0 ? Math.min(1, Math.max(0, (safe - from) / span)) : 0,
    toNext: Math.max(0, next.days - safe),
  };
}

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

/* ── the running day's tally ── */

interface DayActivity {
  /** The day these ids belong to. Anything older is spent. */
  day: string;
  ids: string[];
}

function readDayActivity(): DayActivity {
  const today = dayKey(new Date());
  try {
    const raw = localStorage.getItem(DAY_ACTIVITY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DayActivity> | null) : null;
    // Yesterday's tally does not carry over: a new day starts at zero.
    if (parsed && parsed.day === today && Array.isArray(parsed.ids)) {
      return { day: today, ids: parsed.ids.filter((id): id is string => typeof id === 'string') };
    }
  } catch {
    /* unreadable — start the day over */
  }
  return { day: today, ids: [] };
}

function writeDayActivity(activity: DayActivity): void {
  try {
    localStorage.setItem(DAY_ACTIVITY_KEY, JSON.stringify(activity));
  } catch {
    /* quota — non-critical */
  }
}

/** Today's count, treating an already-qualified day as full. Days logged
 *  before this tally existed carry no ids, and must not read as empty. */
function countToday(days: Set<string>): number {
  const count = readDayActivity().ids.length;
  if (count >= DAILY_ACTIVITY_GOAL) return count;
  return days.has(dayKey(new Date())) ? DAILY_ACTIVITY_GOAL : count;
}

/** Distinct activities finished today. */
export function getTodayActivityCount(): number {
  return countToday(readDays());
}

/**
 * Credit one finished activity toward today, logging the day as a study day
 * once the goal is met.
 *
 * `id` identifies the item ('net:tcp-handshake'), so calling this twice for
 * the same lesson is a no-op. Returns true only on the call that completes
 * the day, which lets a caller celebrate the moment the streak ticks over.
 */
export function recordActivityCredit(id: string): boolean {
  const activity = readDayActivity();
  if (activity.ids.includes(id)) return false;

  activity.ids.push(id);
  if (activity.ids.length > MAX_DAY_IDS) activity.ids.shift();
  writeDayActivity(activity);

  if (activity.ids.length < DAILY_ACTIVITY_GOAL) return false;

  const days = readDays();
  if (days.has(activity.day)) return false;
  days.add(activity.day);
  writeDays(days);
  return true;
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
  /** Has the learner hit today's activity goal? */
  todayDone: boolean;
  /** Activities finished today, toward `dailyGoal`. */
  todayCount: number;
  /** Activities a day needs before it counts. */
  dailyGoal: number;
  /** Where the current streak stands on the milestone ladder. */
  tier: TierProgress;
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
    todayCount: countToday(days),
    dailyGoal: DAILY_ACTIVITY_GOAL,
    tier: tierFor(current),
    daysThisWeek: week.filter((d) => d.done).length,
    weeklyGoal: getWeeklyGoal(),
    week,
  };
}
