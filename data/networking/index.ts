import { NetworkingLesson } from '../../components/network-sim/types';
import {
  mergeNetworkingLessons,
  getPublishedNetworkingUnits,
} from '../../services/creatorDataService';
import type { NetworkingUnit } from '../../services/creatorTypes';

/* No built-in lessons: networking content is authored through the creator
   tools and merged in by getNetworkingLessons() once it is published. */
const staticLessons: NetworkingLesson[] = [];

/** All networking lessons: static + creator-authored (published) */
export const getNetworkingLessons = (): NetworkingLesson[] =>
  mergeNetworkingLessons(staticLessons);

/** Backwards-compatible named export (used by several pages) */
export const networkingLessons: NetworkingLesson[] = staticLessons;

export const getNetworkingLesson = (slug: string): NetworkingLesson | undefined =>
  getNetworkingLessons().find((l) => l.slug === slug);

/* ── The Networking path ── */

export interface NetworkingUnitStop {
  unit: NetworkingUnit;
  /** The unit's lessons that are live right now, in the unit's order. */
  lessons: NetworkingLesson[];
}

export interface NetworkingPath {
  units: NetworkingUnitStop[];
  /** Published lessons that no unit lists, in lesson order. */
  loose: NetworkingLesson[];
  /** Every lesson exactly once, in the order the path takes them. */
  ordered: NetworkingLesson[];
}

/**
 * The Networking page's path: the published units in order, each resolved to
 * the lessons in it that are live, followed by every lesson no unit lists.
 *
 * Units come from different creators, so two of them can list the same
 * lesson. The first unit to list it keeps it, which means a lesson is never
 * shown or counted twice. A unit whose lessons have all been unpublished is
 * left out rather than drawn as an empty row.
 */
export function getNetworkingPath(): NetworkingPath {
  const lessons = getNetworkingLessons();
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const claimed = new Set<string>();
  const units: NetworkingUnitStop[] = [];

  for (const unit of getPublishedNetworkingUnits()) {
    const own: NetworkingLesson[] = [];
    for (const id of unit.lessonIds) {
      const lesson = byId.get(id);
      if (!lesson || claimed.has(id)) continue;
      claimed.add(id);
      own.push(lesson);
    }
    if (own.length > 0) units.push({ unit, lessons: own });
  }

  const loose = lessons.filter((l) => !claimed.has(l.id));
  return { units, loose, ordered: [...units.flatMap((u) => u.lessons), ...loose] };
}
