/* ─── Where this learner actually is ───
 *
 * The dashboard asks two questions before it can decide what to show: has
 * this person started, and what is the one thing they should open next. Both
 * are answered here, from the progress the browser already holds (the same
 * store the header, the sidebar and every course page read), so nothing on
 * the dashboard is invented and nothing needs a request of its own.
 *
 * Two answers, deliberately different:
 *
 *   resume       where they were last, whatever track it was on. This is the
 *                "Continue learning" card, and it is only ever the lesson
 *                they actually opened.
 *
 *   recommended  what to take up next: the step their path is waiting on, a
 *                module already underway, or the first Fundamentals stop they
 *                have not finished. Never the same thing as `resume`, so the
 *                two cards do not repeat each other.
 */

import { useEffect, useState } from 'react';
import { getAllModules } from '../data/modulesData';
import {
  getFundamentalBySlug,
  getMergedFundamentalModules,
  modulePath,
  moduleLearnPath,
  type FundamentalModule,
} from '../data/fundamentalsData';
import { getProgrammingLanguages } from '../data/programming';
import { stepPath } from '../data/programming/courseMap';
import { getNetworkingPath } from '../data/networking';
import { getPublishedCreatorPaths } from './creatorDataService';
import type { CreatorPath } from './creatorTypes';
import {
  getEnrolledPaths,
  getLastActivity,
  getNetworkingDone,
  getOSModuleDoneCount,
  getPathProgress,
  getProgrammingDone,
  getTrackProgress,
  PROGRESS_EVENT,
  type PathProgress,
  type TrackProgress,
} from './progressService';
import { getXpState } from './xpService';

export type Localized = { en: string; ar: string };

export interface JourneyTarget {
  /** Where the button goes. */
  route: string;
  title: Localized;
  /** The course, language or unit this stop belongs to. */
  context?: Localized;
  /** How far through that container the learner is, when it is known. */
  progress?: { done: number; total: number; pct: number };
  /** Which part of the Academy this is, for the icon and the colour. */
  kind: 'programming' | 'networking' | 'module' | 'path' | 'fundamentals';
}

export interface EnrolledPath {
  path: CreatorPath;
  progress: PathProgress;
  /** The step the path is waiting on, when there is one left. */
  nextRoute: string | null;
}

export interface Journey {
  /** Has this learner done anything at all yet? */
  started: boolean;
  /** Finished stops across every track, and what they are worth. */
  stopsDone: number;
  xp: number;
  /** Per-track completion, for the progress strip. */
  tracks: TrackProgress[];
  resume: JourneyTarget | null;
  recommended: JourneyTarget | null;
  path: EnrolledPath | null;
}

const plain = (value: string): Localized => ({ en: value, ar: value });

/* ── Reading a route back ──
 * `recordActivity` stores where the learner was as a route, which is all the
 * viewers need to reopen it. To say how far through the surrounding course
 * they are, the container has to be found again, and the route is what names
 * it. These read one shape each and give up quietly on anything else, so an
 * activity stored by an older version of the app costs a progress bar, never
 * the card. */

const matchRoute = (route: string, pattern: RegExp): string[] | null => {
  const path = route.split('?')[0].replace(/\/+$/, '');
  const m = pattern.exec(path);
  return m ? m.slice(1) : null;
};

function moduleBySlug(slug: string): FundamentalModule | undefined {
  return (
    getFundamentalBySlug(slug) ??
    getMergedFundamentalModules().find((m) => m.slug === slug) ??
    getAllModules().find((m) => m.slug === slug)
  );
}

function moduleTarget(mod: FundamentalModule, title?: Localized): JourneyTarget {
  const done = Math.min(getOSModuleDoneCount(mod.slug), mod.totalLessons);
  return {
    route: moduleLearnPath(mod),
    title: title ?? mod.title,
    context: title ? mod.title : undefined,
    progress:
      mod.totalLessons > 0
        ? { done, total: mod.totalLessons, pct: Math.round((done / mod.totalLessons) * 100) }
        : undefined,
    kind: 'module',
  };
}

/** The lesson the learner last opened, with the course it sits in. */
function resolveResume(): JourneyTarget | null {
  const last = getLastActivity();
  if (!last?.route) return null;
  const title = last.title ?? plain('');

  // A programming concept: /fundamentals/programming/:lang/:module/:concept
  const prog = matchRoute(last.route, /^\/fundamentals\/programming\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (prog) {
    const [langSlug, moduleSlug] = prog;
    const language = getProgrammingLanguages().find((l) => l.slug === langSlug);
    const mod = language?.modules.find((m) => m.slug === moduleSlug);
    if (language && mod) {
      const done = getProgrammingDone(langSlug);
      const finished = mod.concepts.filter((c) => done.has(c.id)).length;
      return {
        route: last.route,
        title,
        context: { en: `${language.name} · ${mod.title.en}`, ar: `${language.name} · ${mod.title.ar || mod.title.en}` },
        progress: mod.concepts.length
          ? {
              done: finished,
              total: mod.concepts.length,
              pct: Math.round((finished / mod.concepts.length) * 100),
            }
          : undefined,
        kind: 'programming',
      };
    }
  }

  // A networking lesson: /fundamentals/networking/lesson/:slug
  const net = matchRoute(last.route, /^\/fundamentals\/networking\/lesson\/([^/]+)$/);
  if (net) {
    const path = getNetworkingPath();
    const lesson = path.ordered.find((l) => l.slug === net[0]);
    if (lesson) {
      const unit = path.units.find((u) => u.lessons.some((l) => l.id === lesson.id));
      const done = getNetworkingDone();
      const inUnit = unit ? unit.lessons : path.ordered;
      const finished = inUnit.filter((l) => done.has(l.id)).length;
      return {
        route: last.route,
        title: lesson.title,
        context: unit ? unit.unit.title : { en: 'Networking', ar: 'الشبكات' },
        progress: inUnit.length
          ? { done: finished, total: inUnit.length, pct: Math.round((finished / inUnit.length) * 100) }
          : undefined,
        kind: 'networking',
      };
    }
  }

  // A module, from either hub: /modules/:slug/learn or /fundamentals/module/:slug/learn
  const mod = matchRoute(last.route, /^\/(?:modules|fundamentals\/module)\/([^/]+)\/learn$/);
  if (mod) {
    const found = moduleBySlug(mod[0]);
    if (found) return { ...moduleTarget(found, title.en || title.ar ? title : undefined), route: last.route };
  }

  // Something older or one-off: still worth resuming, just without a bar.
  return { route: last.route, title, context: last.context ? plain(last.context) : undefined, kind: 'fundamentals' };
}

/** The enrolled path the learner is furthest through but has not finished;
 *  failing that, any enrolled path, so the card still says where they are. */
function resolvePath(): EnrolledPath | null {
  const enrolled = getEnrolledPaths();
  if (enrolled.size === 0) return null;

  const mine = getPublishedCreatorPaths()
    .filter((p) => enrolled.has(p.id))
    .map((path) => {
      const progress = getPathProgress(path.steps);
      const next = progress.nextIndex >= 0 ? progress.states[progress.nextIndex] : null;
      return { path, progress, nextRoute: next?.route ?? null } satisfies EnrolledPath;
    });
  if (mine.length === 0) return null;

  const unfinished = mine.filter((p) => p.progress.pct < 100);
  const pool = unfinished.length > 0 ? unfinished : mine;
  return pool.sort((a, b) => b.progress.pct - a.progress.pct)[0];
}

/** The first Fundamentals stop the learner has not finished, following the
 *  order the Fundamentals page itself lays out: programming, then networking,
 *  then the operating-systems modules.
 *
 *  `except` is the lesson already on offer above this card. Skipping it is
 *  what makes this a recommendation rather than an echo: somebody sitting on
 *  the first lesson of Python is told what comes after it, not handed the
 *  same lesson twice. */
function nextFundamentalsStop(except?: string): JourneyTarget | null {
  for (const language of getProgrammingLanguages()) {
    const done = getProgrammingDone(language.slug);
    for (const mod of language.modules) {
      const concept = mod.concepts.find(
        (c) => !done.has(c.id) && stepPath(language.slug, { module: mod, concept: c }) !== except
      );
      if (concept) {
        return {
          route: stepPath(language.slug, { module: mod, concept }),
          title: concept.title,
          context: { en: `${language.name} · ${mod.title.en}`, ar: `${language.name} · ${mod.title.ar || mod.title.en}` },
          kind: 'programming',
        };
      }
    }
  }

  const netPath = getNetworkingPath();
  const netDone = getNetworkingDone();
  const lesson = netPath.ordered.find(
    (l) => !netDone.has(l.id) && `/fundamentals/networking/lesson/${l.slug}` !== except
  );
  if (lesson) {
    return {
      route: `/fundamentals/networking/lesson/${lesson.slug}`,
      title: lesson.title,
      context: { en: 'Networking', ar: 'الشبكات' },
      kind: 'networking',
    };
  }

  const mod = getMergedFundamentalModules()
    .filter((m) => m.category === 'operating-systems' && m.totalLessons > 0)
    .find((m) => getOSModuleDoneCount(m.slug) < m.totalLessons && moduleLearnPath(m) !== except);
  return mod ? moduleTarget(mod) : null;
}

/** A module already underway, other than the one being resumed. */
function moduleInProgress(exceptRoute?: string): JourneyTarget | null {
  const candidates = getAllModules()
    .map((mod) => ({ mod, done: Math.min(getOSModuleDoneCount(mod.slug), mod.totalLessons) }))
    .filter((x) => x.done > 0 && x.done < x.mod.totalLessons)
    .sort((a, b) => b.done / b.mod.totalLessons - a.done / a.mod.totalLessons);

  for (const { mod } of candidates) {
    const target = moduleTarget(mod);
    if (target.route !== exceptRoute) return target;
  }
  return null;
}

/**
 * Everything the dashboard needs to decide what to put first, read fresh.
 * Cheap enough to call on a progress change: it walks the same in-memory
 * content the rest of the app already has loaded.
 */
export function getJourney(): Journey {
  const { xp, stopsDone } = getXpState();
  const resume = resolveResume();
  const path = resolvePath();

  /* The recommendation, in the order a learner would want it: the step their
     path is waiting on, then a module they left part-finished, then the next
     thing in Fundamentals. Whatever they are already resuming is skipped, so
     the two cards never point at one lesson twice. */
  let recommended: JourneyTarget | null = null;
  if (path?.nextRoute && path.nextRoute !== resume?.route) {
    const step = path.progress.states[path.progress.nextIndex];
    const label = path.path.steps[path.progress.nextIndex];
    recommended = {
      route: step.route,
      // A step's title is one denormalized string, the same in both languages.
      title: label ? plain(label.title) : path.path.title,
      context: path.path.title,
      progress: { done: path.progress.completed, total: path.progress.total, pct: path.progress.pct },
      kind: 'path',
    };
  }
  if (!recommended) recommended = moduleInProgress(resume?.route);
  if (!recommended) recommended = nextFundamentalsStop(resume?.route);

  return {
    started: stopsDone > 0 || resume !== null,
    stopsDone,
    xp,
    tracks: getTrackProgress(),
    resume,
    recommended,
    path,
  };
}

/**
 * The same answer, kept current. Finishing a lesson anywhere in the app, or
 * in another tab, moves the dashboard's cards without a reload.
 */
export function useJourney(): Journey {
  const [journey, setJourney] = useState<Journey>(getJourney);
  useEffect(() => {
    const refresh = () => setJourney(getJourney());
    refresh(); // anything finished between the first render and this effect
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return journey;
}

/** Where a module's overview lives, for cards that link to it rather than
 *  straight into the viewer. */
export { modulePath };
