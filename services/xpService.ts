/* ─── XP in the browser ───
 *
 * Scores the learner's completions against the content this browser holds,
 * with the rules in backend/src/shared/xp.ts, so the header, sidebar and
 * dashboard move the moment a lesson is finished. The server scores the same
 * completions itself (backend/src/utils/xpCatalog.ts) and its number is the
 * one the leaderboard and public profiles show. The two agree as long as the
 * content cache is current, which signing in refreshes.
 *
 * Everything else in the app reads XP and levels through this file rather
 * than reaching into the backend folder.
 */

import { useEffect, useState } from 'react';
import quizBank from '../data/linuxQuizData';
import { getMergedFundamentalModules } from '../data/fundamentalsData';
import { getProgrammingLanguages } from '../data/programming';
import { getNetworkingLessons } from '../data/networking';
import {
  getFinishedModules,
  getNetworkingDone,
  getOSModuleDone,
  getProgrammingDone,
  PROGRESS_EVENT,
} from './progressService';
import {
  groupKey,
  levelFor,
  measureConcept,
  measureModuleStop,
  measureNetworkingLesson,
  scoreGroups,
  stopXp,
  type LevelProgress,
  type XpGroup,
} from '../backend/src/shared/xp';

export { LEVELS, LEADERBOARD_MIN_XP, levelFor } from '../backend/src/shared/xp';
export type { Level, LevelProgress } from '../backend/src/shared/xp';

export interface ClientXpGroup extends XpGroup {
  track: 'module' | 'programming' | 'networking';
  /** A module's pillar placement and security domain, which the Skill Matrix routes by. */
  category?: string;
  domain?: string;
  /** A programming module's language. */
  language?: string;
  /** Ids completed in this group's container. */
  done: ReadonlySet<string>;
}

const idOf = (lecture: unknown): string => {
  const id = (lecture as { id?: unknown } | null)?.id;
  return typeof id === 'string' ? id : id == null ? '' : String(id);
};

/** Everything a learner can complete, grouped and scored, as the server groups it. */
export function getXpGroups(): ClientXpGroup[] {
  const groups: ClientXpGroup[] = [];

  // One set of completions per slug, so two modules sharing one never count it twice.
  const seenSlugs = new Set<string>();
  for (const mod of getMergedFundamentalModules()) {
    if (!mod.slug || seenSlugs.has(mod.slug)) continue;
    seenSlugs.add(mod.slug);
    const chapters = (mod.courseData?.modules ?? []) as { lectures?: unknown[] }[];
    const lectures = chapters.flatMap((chapter) => (Array.isArray(chapter.lectures) ? chapter.lectures : []));
    groups.push({
      key: groupKey.module(mod.slug),
      track: 'module',
      category: mod.category,
      domain: mod.domain ?? 'general',
      finishBonus: true,
      stops: lectures.map((lecture) => ({
        id: idOf(lecture),
        xp: stopXp(measureModuleStop(lecture, quizBank), mod.difficulty),
      })),
      done: new Set(getOSModuleDone(mod.slug)),
    });
  }

  for (const language of getProgrammingLanguages()) {
    const done = getProgrammingDone(language.slug);
    for (const mod of language.modules) {
      groups.push({
        key: groupKey.programming(language.slug, mod.slug),
        track: 'programming',
        language: language.slug,
        finishBonus: true,
        stops: mod.concepts.map((concept) => ({ id: concept.id, xp: stopXp(measureConcept(concept)) })),
        done,
      });
    }
  }

  groups.push({
    key: groupKey.networking,
    track: 'networking',
    finishBonus: false,
    stops: getNetworkingLessons().map((lesson) => ({ id: lesson.id, xp: stopXp(measureNetworkingLesson(lesson)) })),
    done: getNetworkingDone(),
  });

  return groups;
}

export interface XpState {
  xp: number;
  level: LevelProgress;
  stopsDone: number;
  stopsTotal: number;
}

export function getXpState(): XpState {
  const score = scoreGroups(getXpGroups(), (group) => group.done, getFinishedModules());
  return { xp: score.xp, level: levelFor(score.xp), stopsDone: score.stopsDone, stopsTotal: score.stopsTotal };
}

/**
 * Live XP for UI that stays mounted (header, sidebar). Refreshes on any
 * progress write (same tab via PROGRESS_EVENT, other tabs via storage).
 */
export function useXp(): XpState {
  const [state, setState] = useState<XpState>(getXpState);
  useEffect(() => {
    const refresh = () => setState(getXpState());
    refresh(); // catch any change between first render and effect
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return state;
}

/** What a programming lesson or challenge is worth. */
export const conceptXp = (concept: unknown): number => stopXp(measureConcept(concept));

/** XP earned in one programming language, finishing bonuses included. */
export function languageXp(languageSlug: string): number {
  const groups = getXpGroups().filter((g) => g.language === languageSlug);
  return scoreGroups(groups, (group) => group.done, getFinishedModules()).xp;
}
