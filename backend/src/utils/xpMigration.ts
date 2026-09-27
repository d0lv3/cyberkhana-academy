/* ─── Restating accounts in XP ───
 *
 * An account's stored figures (lifetime XP, the board baseline, this month's
 * gains) are what its completions came to in one catalog: the formula
 * (XP_FORMULA_VERSION in shared/xp.ts) applied to the content published at the
 * time. When either changes, so does the catalog's stamp (utils/xpCatalog.ts),
 * and each account is rescored from its stored completions once, here. The old
 * figures carry over in proportion: the share of the old total an admin reset
 * had set aside, and the share earned this month, become the same shares of
 * the new total.
 *
 * Without that, an account nobody signs in to would keep a board figure that
 * no longer matches its profile, and the first sync after a change would book
 * the whole difference as XP earned this month, handing the monthly board to
 * whoever signed in first.
 */

import User, { type IUser } from '../models/User';
import Progress from '../models/Progress';
import { XP_FORMULA_VERSION } from '../shared/xp';
import { getXpCatalog, scoreProgress, type XpCatalog } from './xpCatalog';
import { currentMonthKey } from './time';
import { logger } from './logger';

export interface RestateOptions {
  /** The catalog to restate against; the current one when absent. */
  catalog?: XpCatalog;
  /** Write only if the account has not been saved since it was read. The
   *  background sweep passes this, so it never overwrites a push that landed
   *  while it was working; that push restated the account itself. */
  onlyIfUntouched?: boolean;
}

/** Are this account's figures from another catalog than `catalog`? */
export function isXpStale(user: IUser, catalog: XpCatalog): boolean {
  return user.xpStamp !== catalog.stamp;
}

/** Restate one account. Resolves false when `onlyIfUntouched` found it saved
 *  in the meantime, and nothing was written. */
export async function restateUserXp(user: IUser, options: RestateOptions = {}): Promise<boolean> {
  const catalog = options.catalog ?? (await getXpCatalog());
  const progress = await Progress.findOne({ userId: user._id });
  const finishedBefore = progress?.finishedModules ?? [];
  const { xp, finishedNow } = await scoreProgress(progress, finishedBefore, catalog);

  /* An admin's award and the streak's payouts are XP, and rescoring the
     content cannot see either: both are held on the account for this. */
  const total = xp + (user.pointsAdjustment ?? 0) + (user.streakPoints ?? 0);
  const update: Partial<IUser> = { xpVersion: XP_FORMULA_VERSION, xpStamp: catalog.stamp };

  /* Most edits leave most accounts' totals where they were. Then only the
     stamp moves, so a restate never nudges figures it has no reason to. */
  if (total !== user.pointsRaw) {
    const oldTotal = user.pointsRaw ?? user.points ?? 0;
    /* Shares of the whole total, award and streak included: both are inside
       the old total, and inside whatever baseline a reset took from it. */
    const setAside = oldTotal > 0 ? Math.min(1, Math.max(0, (user.pointsBaseline ?? 0) / oldTotal)) : 0;
    const pointsBaseline = Math.round(total * setAside);
    const points = Math.max(0, total - pointsBaseline);
    update.pointsRaw = total;
    update.pointsBaseline = pointsBaseline;
    update.points = points;
    if (user.monthlyPointsMonth === currentMonthKey()) {
      const monthShare = oldTotal > 0 ? (user.monthlyPoints ?? 0) / oldTotal : 0;
      update.monthlyPoints = Math.min(points, Math.max(0, Math.round(total * monthShare)));
    }
  }

  // A targeted write, so an old account that no longer passes a newer
  // validation rule is still restated.
  const filter = options.onlyIfUntouched ? { _id: user._id, updatedAt: user.updatedAt } : { _id: user._id };
  const result = await User.updateOne(filter, { $set: update });
  if (result.matchedCount === 0) return false;
  Object.assign(user, update);

  const added = finishedNow.filter((key) => !finishedBefore.includes(key));
  if (progress && added.length) {
    await Progress.updateOne({ _id: progress._id }, { $addToSet: { finishedModules: { $each: added } } });
  }
  return true;
}

/** Restate every account whose figures are from another catalog. Run at
 *  startup before the server takes requests, and in the background after
 *  content changes (scheduleXpRestate). */
export async function restateStaleAccounts(options: { background?: boolean } = {}): Promise<void> {
  const catalog = await getXpCatalog();
  let restated = 0;
  let skipped = 0;
  let failed = 0;
  for await (const user of User.find({ xpStamp: { $ne: catalog.stamp } }).cursor()) {
    try {
      if (await restateUserXp(user, { catalog, onlyIfUntouched: options.background })) restated++;
      else skipped++;
    } catch (err) {
      failed++;
      logger.error('xp.restate_failed', { userId: String(user._id), error: String(err) });
    }
  }
  if (restated || skipped || failed) {
    logger.info('xp.restated', { stamp: catalog.stamp, restated, skipped, failed });
  }
}

/* ── After content changes ──
 * Any content write can change what completions are worth, so a sweep
 * follows it. Debounced, because a creator's editor autosaves as they type
 * and one sweep after they pause is enough. Most writes (drafts, reordering)
 * leave the stamp alone, and then the sweep finds nobody to restate. */
const SWEEP_DELAY_MS = 30_000;
let sweepTimer: NodeJS.Timeout | null = null;
let sweeping = false;
let sweepAgain = false;

export function scheduleXpRestate(): void {
  if (sweepTimer) clearTimeout(sweepTimer);
  sweepTimer = setTimeout(() => {
    sweepTimer = null;
    void sweep();
  }, SWEEP_DELAY_MS);
  sweepTimer.unref();
}

async function sweep(): Promise<void> {
  if (sweeping) {
    sweepAgain = true;
    return;
  }
  sweeping = true;
  try {
    await restateStaleAccounts({ background: true });
  } catch (err) {
    logger.error('xp.restate_sweep_failed', { error: String(err) });
  } finally {
    sweeping = false;
    if (sweepAgain) {
      sweepAgain = false;
      void sweep();
    }
  }
}
