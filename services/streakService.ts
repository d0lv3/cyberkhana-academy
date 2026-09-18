/**
 * The study streak, as the browser sees it.
 *
 * The server is the one that records a day: it credits the learner's local
 * day when a push brings completions it had not seen, and it pays the
 * breakpoints (backend/src/utils/studyDays.ts). That is deliberate, because
 * breakpoints pay XP and XP ranks people, so a streak typed into devtools
 * must not buy anything.
 *
 * What lives here is the cache of the server's record, plus the arithmetic
 * for drawing it. The arithmetic itself is in backend/src/shared/streak.ts,
 * compiled by both halves so neither can drift from the other about what a
 * streak is.
 *
 * Dates are the learner's local ones on purpose: a streak is a human habit,
 * so "today" has to mean their today, not UTC's.
 */

import { useEffect, useState } from 'react';
import {
  DAILY_ACTIVITY_GOAL,
  breakpointsReached,
  dayKeyOf,
  nextBreakpoint,
  streakFrom,
  type StreakBreakpoint,
  type StudyDays,
} from '../backend/src/shared/streak';
import { STUDY_DAYS_KEY } from './syncService';

export {
  DAILY_ACTIVITY_GOAL,
  STREAK_BREAKPOINTS,
  STREAK_GOALS,
  breakpointFor,
  type StreakBreakpoint,
} from '../backend/src/shared/streak';

const PROGRESS_EVENT = 'academy-progress-changed';

/** The days the server has recorded, as this device last heard them. */
export function getStudyDays(): StudyDays {
  try {
    const raw = localStorage.getItem(STUDY_DAYS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const days: StudyDays = {};
    for (const [key, count] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof count === 'number' && count > 0) days[key] = count;
    }
    return days;
  } catch {
    return {};
  }
}

/**
 * Count an activity against today in the cache, right away.
 *
 * Only so the card moves the moment a lesson is finished instead of waiting
 * out the debounced push. The server recounts from the completions it
 * receives and its answer replaces this, so an inflated local number buys
 * nothing and does not survive the next push.
 */
export function creditLocalDay(): void {
  const days = getStudyDays();
  const today = dayKeyOf(new Date());
  days[today] = (days[today] ?? 0) + 1;
  try {
    localStorage.setItem(STUDY_DAYS_KEY, JSON.stringify(days));
  } catch {
    /* quota: the push will put it right */
  }
}

export interface StreakInfo {
  /** Consecutive days up to today, or up to yesterday if today is unfinished. */
  current: number;
  /** The best run recorded. */
  longest: number;
  /** Activities finished today. */
  todayCount: number;
  /** Has today reached the daily goal? */
  todayDone: boolean;
  /** Activities a day needs before it counts. */
  dailyGoal: number;
  /** The next breakpoint above the current streak, or null at the top. */
  next: StreakBreakpoint | null;
  /** Every breakpoint this streak has reached. */
  reached: StreakBreakpoint[];
  /** Day → activity count, for the heat map. */
  days: StudyDays;
  /** Mon→Sun flags for the current week, for the day pips. */
  week: { key: string; count: number; done: boolean; isToday: boolean; isFuture: boolean }[];
}

export function getStreak(): StreakInfo {
  const days = getStudyDays();
  const now = new Date();
  const todayKey = dayKeyOf(now);
  const state = streakFrom(days, todayKey);

  /* Current week, Monday-first (getDay(): Sunday is 0). */
  const mondayOffset = (now.getDay() + 6) % 7;
  const week: StreakInfo['week'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() - mondayOffset + i);
    const key = dayKeyOf(d);
    const count = days[key] ?? 0;
    week.push({
      key,
      count,
      done: count >= DAILY_ACTIVITY_GOAL,
      isToday: key === todayKey,
      isFuture: i > mondayOffset,
    });
  }

  return {
    current: state.current,
    longest: state.longest,
    todayCount: state.todayCount,
    todayDone: state.todayDone,
    dailyGoal: DAILY_ACTIVITY_GOAL,
    next: nextBreakpoint(state.current),
    reached: breakpointsReached(state.current),
    days,
    week,
  };
}

/**
 * The streak, kept current. The days arrive from the server after a push, so
 * a card that read them once at mount would sit on a stale number.
 */
export function useStreak(): StreakInfo {
  const [state, setState] = useState<StreakInfo>(getStreak);
  useEffect(() => {
    const refresh = () => setState(getStreak());
    refresh(); // catch anything that landed between first render and effect
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return state;
}

/** How far a streak has come toward a goal, 0 to 1. */
export function goalFraction(streak: number, goal: number | null | undefined): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(1, Math.max(0, streak / goal));
}
