/* ─── Points Service ───
 * Turns completed content into leaderboard points.
 *
 * Modules are the headline: a module's worth scales with BOTH its difficulty
 * and its estimated time —
 *     points = round( difficultyMultiplier × (BASE + estimatedHours × PER_HOUR) )
 * Networking lessons and programming concepts contribute smaller amounts so the
 * leaderboard reflects all learning, not only modules.
 *
 * The total is derived deterministically from the same completion sets the rest
 * of progressService reads, so it is always recomputable — which makes it safe
 * to merge across devices. The server stores each push's total and books the
 * positive delta into the current month for the monthly leaderboard.
 */

import { getMergedFundamentalModules } from '../data/fundamentalsData';
import { getNetworkingLessons } from '../data/networking';
import { getProgrammingLanguages } from '../data/programming';
import { getOSModuleDoneCount, getProgrammingDone, getNetworkingDone } from './progressService';
import type { Difficulty } from '../types';

/* ── Module points: difficulty × time ── */

/** How much harder content is worth, multiplicatively. */
const DIFFICULTY_MULT: Record<Difficulty, number> = {
  Beginner: 1,
  Easy: 1.3,
  Medium: 1.8,
  Hard: 2.5,
  Expert: 3.5,
};

const MODULE_BASE = 40; // every module is worth at least this (× difficulty)
const MODULE_PER_HOUR = 15; // plus this per estimated hour (× difficulty)

/**
 * Points awarded for completing a module.
 * e.g. Beginner 2h → 70 · Medium 3h → 153 · Hard 8h → 400 · Expert 10h → 665.
 */
export function modulePoints(difficulty: Difficulty, estimatedHours: number): number {
  const mult = DIFFICULTY_MULT[difficulty] ?? 1;
  const hours = Math.max(0, Number.isFinite(estimatedHours) ? estimatedHours : 0);
  return Math.round(mult * (MODULE_BASE + hours * MODULE_PER_HOUR));
}

/* ── Other tracks (lighter weights) ── */

const NET_BASE = 12;
const NET_PER_MIN = 1;
export function networkingLessonPoints(estimatedMinutes: number): number {
  const mins = Math.max(0, Number.isFinite(estimatedMinutes) ? estimatedMinutes : 10);
  return Math.round(NET_BASE + mins * NET_PER_MIN);
}

const CONCEPT_LESSON_POINTS = 18;
const CONCEPT_CHALLENGE_POINTS = 35;

/** Points a single programming concept is worth (challenges are worth more). */
export function conceptPoints(type: 'lesson' | 'challenge' | string): number {
  return type === 'challenge' ? CONCEPT_CHALLENGE_POINTS : CONCEPT_LESSON_POINTS;
}

/** A module counts once it is fully complete (all of its lectures done). */
export function isModuleComplete(slug: string, totalLessons: number): boolean {
  return totalLessons > 0 && getOSModuleDoneCount(slug) >= totalLessons;
}

export interface PointsBreakdown {
  total: number;
  modules: number;
  networking: number;
  programming: number;
}

/** Recompute the learner's points from their completion sets. */
export function getPointsBreakdown(): PointsBreakdown {
  let modules = 0;
  for (const m of getMergedFundamentalModules()) {
    if (isModuleComplete(m.slug, m.totalLessons)) {
      modules += modulePoints(m.difficulty, m.estimatedHours);
    }
  }

  let networking = 0;
  const netDone = getNetworkingDone();
  for (const lesson of getNetworkingLessons()) {
    if (netDone.has(lesson.id)) networking += networkingLessonPoints(lesson.estimatedMinutes);
  }

  let programming = 0;
  for (const lang of getProgrammingLanguages()) {
    const done = getProgrammingDone(lang.slug);
    for (const mod of lang.modules) {
      for (const concept of mod.concepts) {
        if (done.has(concept.id)) {
          programming += conceptPoints(concept.type);
        }
      }
    }
  }

  return { total: modules + networking + programming, modules, networking, programming };
}

/** The learner's total leaderboard points. */
export function getTotalPoints(): number {
  return getPointsBreakdown().total;
}
