/* ─── XP in the browser ───
 *
 * The server scores XP (backend/src/utils/xpCatalog.ts), and its figure is
 * the one shown everywhere: here, on the leaderboard and on public profiles.
 * This browser only adds what it has completed since the server last scored
 * it, so the header, sidebar and dashboard still move the moment a lesson is
 * finished, and the next push replaces that estimate with the server's own
 * figure. The rules are backend/src/shared/xp.ts on both sides.
 *
 * Everything else in the app reads XP and levels through this file rather
 * than reaching into the backend folder.
 */

import { useEffect, useState } from 'react';
import quizBank from '../data/linuxQuizData';
import { getMergedFundamentalModules } from '../data/fundamentalsData';
import { getScoredProgrammingLanguages } from '../data/programming';
import { getNetworkingLessons } from '../data/networking';
import {
  getFinishedModules,
  getNetworkingDone,
  getOSModuleDone,
  getProgrammingDone,
  PROGRESS_EVENT,
} from './progressService';
import { getServerXp, type ScoredCompletions } from './serverXp';
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
  /** A module's slug, which its completions are stored under. */
  slug?: string;
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
      slug: mod.slug,
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

  // Hidden languages included: hiding is temporary, and earned XP stays earned.
  for (const language of getScoredProgrammingLanguages()) {
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
  /** Lifetime XP, which the level is read from. */
  xp: number;
  level: LevelProgress;
  /** The all-time leaderboard's figure, and the reset it counts from (null
   *  when it counts everything). Null until the server has been heard from. */
  board: { xp: number; since: string | null } | null;
  stopsDone: number;
  stopsTotal: number;
}

/* ── XP an admin awarded ──
 *
 * Only for when the server's figure is not in (the pull failed): then the
 * content this browser holds is all there is to score, and an award is in no
 * content. The session carries the figure and AuthContext hands it over, and
 * it is added to whatever the content came to.
 *
 * It lives in a module variable rather than in storage because it belongs to
 * the session, not the device. Signing out clears it, so the next account does
 * not inherit it. */
let awardedXp = 0;

/** Set from the session. Tells anything showing XP to read it again. */
export function setAwardedXp(value: unknown): void {
  const next = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  if (next === awardedXp) return;
  awardedXp = next;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function getAwardedXp(): number {
  return awardedXp;
}

/* ── XP the streak has paid ──
 *
 * Held here for the same reason as an award, and carried the same way: the
 * server decides when a streak breakpoint is reached, because it is the only
 * side that can vouch for the days behind it (backend/src/utils/studyDays.ts).
 * No content scores it, so the session hands it over. */
let streakXp = 0;

/** Set from the session. Tells anything showing XP to read it again. */
export function setStreakXp(value: unknown): void {
  const next = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  if (next === streakXp) return;
  streakXp = next;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function getStreakXp(): number {
  return streakXp;
}

const NONE: ReadonlySet<string> = new Set();

/** A group's completions as the server last scored them. */
function scoredIn(group: ClientXpGroup, scored: ScoredCompletions): ReadonlySet<string> {
  if (group.track === 'module') return scored.osModules.get(group.slug ?? '') ?? NONE;
  if (group.track === 'programming') return scored.programming.get(group.language ?? '') ?? NONE;
  return scored.networking;
}

export function getXpState(): XpState {
  const groups = getXpGroups();
  const finished = getFinishedModules();
  const score = scoreGroups(groups, (group) => group.done, finished);
  const server = getServerXp();

  if (!server) {
    /* Not heard from the server (signed out, or the pull failed): the content
       this browser holds, plus what was awarded and what the streak paid. */
    const xp = Math.max(0, score.xp + awardedXp + streakXp);
    return { xp, level: levelFor(xp), board: null, stopsDone: score.stopsDone, stopsTotal: score.stopsTotal };
  }

  /* The server's figure, plus what has been completed here since the
     completions it scored. Both sides of that difference are valued here,
     against the same content, so wherever this browser's copy of the content
     differs from the server's the two cancel, and only the new work counts
     early. With nothing new it is exactly the server's figure, the one the
     leaderboard shows. */
  const since = score.xp - scoreGroups(groups, (group) => scoredIn(group, server.scored), finished).xp;
  const xp = Math.max(0, server.xp + since);
  return {
    xp,
    level: levelFor(xp),
    board: { xp: Math.max(0, server.board.xp + since), since: server.board.since },
    stopsDone: score.stopsDone,
    stopsTotal: score.stopsTotal,
  };
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
