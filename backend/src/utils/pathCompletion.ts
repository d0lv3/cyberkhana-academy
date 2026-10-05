/* ─── Has this learner finished the path? ───
 *
 * A path is a list of steps pointing at content that lives elsewhere, and the
 * browser has always worked out for itself how far along one somebody is
 * (services/progressService.ts getPathProgress). That is fine for drawing a
 * progress bar and no good for a gate: the final exam opens only to someone
 * who has finished the path, and the server is the one who has to say so.
 *
 * So the same answer is worked out here, from the completions the server
 * recorded itself (routes/progress.ts) against the catalog it scores them
 * with. The rules are the page's own, so the two never disagree about whether
 * the last stop is unlocked:
 *
 *   a step whose content is no longer published is not counted at all;
 *   a module is done when every one of its lessons is;
 *   a path is finished when it has at least one step left and all are done.
 */

import { isPlainObject, type AnyItem } from './contentStatus';
import type { ProgressLike, ServerXpGroup, XpCatalog } from './xpCatalog';

export interface PathStanding {
  complete: boolean;
  /** Steps that still point at published content. */
  available: number;
  done: number;
  /** Lessons across those steps, and the minutes they are expected to take:
   *  measured from the content, not from what its author typed. */
  lessons: number;
  minutes: number;
  /** The available steps, in order, as the certificate lists them. */
  steps: { key: string; title: string }[];
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const idsOf = (value: unknown): Set<string> =>
  new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

const own = (record: unknown, key: string): unknown =>
  isPlainObject(record) && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

/** `kind:refId`, the way a path step is named on both sides. */
export const stepKeyOf = (step: AnyItem): string => `${str(step.kind)}:${str(step.refId)}`;

export function pathStanding(path: AnyItem, progress: ProgressLike | null | undefined, catalog: XpCatalog): PathStanding {
  const moduleById = new Map<string, ServerXpGroup>();
  const programmingById = new Map<string, ServerXpGroup>();
  let networking: ServerXpGroup | undefined;
  for (const group of catalog.groups) {
    if (group.source.kind === 'networking') networking = group;
    else if (!group.contentId) continue;
    else if (group.source.kind === 'module') {
      if (!moduleById.has(group.contentId)) moduleById.set(group.contentId, group);
    } else if (!catalog.hiddenLanguages.has(group.source.language)) {
      if (!programmingById.has(group.contentId)) programmingById.set(group.contentId, group);
    }
  }
  const lessonById = new Map((networking?.stops ?? []).map((stop) => [stop.id, stop]));
  const lessonsDone = idsOf(progress?.networking);

  const standing: PathStanding = { complete: false, available: 0, done: 0, lessons: 0, minutes: 0, steps: [] };
  const steps = Array.isArray(path.steps) ? path.steps.filter(isPlainObject) : [];

  for (const step of steps) {
    const refId = str(step.refId);
    let stops: { id: string; minutes: number }[] | null = null;
    let finished: Set<string> | null = null;

    if (step.kind === 'networking') {
      const lesson = lessonById.get(refId);
      if (lesson) {
        stops = [lesson];
        finished = lessonsDone;
      }
    } else if (step.kind === 'os-module') {
      const group = moduleById.get(refId);
      if (group && group.source.kind === 'module') {
        stops = group.stops;
        finished = idsOf(own(progress?.osModules, group.source.slug));
      }
    } else if (step.kind === 'programming-module') {
      const group = programmingById.get(refId);
      if (group && group.source.kind === 'programming') {
        stops = group.stops;
        finished = idsOf(own(progress?.programming, group.source.language));
      }
    }

    // Unpublished, removed or hidden: the page shows it locked and leaves it out.
    if (!stops || !finished) continue;
    standing.available += 1;
    standing.lessons += stops.length;
    standing.minutes += stops.reduce((sum, stop) => sum + stop.minutes, 0);
    standing.steps.push({ key: stepKeyOf(step), title: str(step.title) });
    const done = finished;
    if (stops.length > 0 && stops.every((stop) => done.has(stop.id))) standing.done += 1;
  }

  standing.complete = standing.available > 0 && standing.done === standing.available;
  return standing;
}
