/* ─── Lab working state ───
 *
 * Whether a lab is *finished* is ordinary lesson progress: a lab is a stop in
 * the course, so it lands in `academy-progress-<slug>` beside every other
 * lecture id and counts toward the same bar.
 *
 * What lives here is the state of a lab while it is being worked on, which
 * lesson progress has no shape for: when the student first opened the
 * destination, which objectives they have ticked off, which flags they have
 * already got. That matters because the work happens on another site. Someone
 * who comes back two days later should find the page as they left it, not
 * reset to a fresh brief that gives no sign they ever started.
 *
 * Reads and writes are guarded the same way useStoredState guards its own:
 * private browsing and blocked site data both throw, and losing a tick box is
 * not worth an error.
 */

export interface LabProgress {
  /** ISO timestamp of the first launch, absent until they open the lab. */
  openedAt?: string;
  /** Indexes into lab.objectives. */
  objectivesDone: number[];
  /** Ids of flags already accepted. */
  flagsSolved: string[];
}

export const emptyLabProgress = (): LabProgress => ({ objectivesDone: [], flagsSolved: [] });

const key = (moduleSlug: string, labId: string) => `academy-lab-${moduleSlug}-${labId}`;

export function getLabProgress(moduleSlug: string, labId: string): LabProgress {
  try {
    const raw = localStorage.getItem(key(moduleSlug, labId));
    if (!raw) return emptyLabProgress();
    const parsed = JSON.parse(raw) as Partial<LabProgress>;
    return {
      openedAt: typeof parsed.openedAt === 'string' ? parsed.openedAt : undefined,
      objectivesDone: Array.isArray(parsed.objectivesDone)
        ? parsed.objectivesDone.filter((n): n is number => typeof n === 'number')
        : [],
      flagsSolved: Array.isArray(parsed.flagsSolved)
        ? parsed.flagsSolved.filter((s): s is string => typeof s === 'string')
        : [],
    };
  } catch {
    return emptyLabProgress();
  }
}

export function saveLabProgress(moduleSlug: string, labId: string, progress: LabProgress): void {
  try {
    localStorage.setItem(key(moduleSlug, labId), JSON.stringify(progress));
  } catch {
    /* Quota, private mode. The lab still works, it just forgets. */
  }
}

/**
 * "Started 2 days ago", so a returning student can see at a glance that this
 * is a lab they are in the middle of. Deliberately coarse: the exact minute
 * they clicked a link is not information anyone needs.
 */
export function formatStartedAgo(iso: string, lang: 'en' | 'ar'): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));

  if (mins < 60) {
    if (lang === 'ar') return mins < 5 ? 'بدأت للتو' : `بدأت قبل ${mins} دقيقة`;
    return mins < 5 ? 'Started just now' : `Started ${mins} min ago`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 24) {
    if (lang === 'ar') return `بدأت قبل ${hours} ساعة`;
    return `Started ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.round(hours / 24);
  if (lang === 'ar') return `بدأت قبل ${days} يوم`;
  return `Started ${days} ${days === 1 ? 'day' : 'days'} ago`;
}
