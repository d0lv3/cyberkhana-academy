/* ─── Restating accounts in XP ───
 *
 * An account's stored figures (lifetime XP, the board baseline, this month's
 * gains) are in the units of the formula that produced them. When the formula
 * changes (XP_FORMULA_VERSION in shared/xp.ts), each account is rescored from
 * its stored completions once, here, and the old figures carry over in
 * proportion: the share of the old total an admin reset had set aside, and the
 * share earned this month, become the same shares of the new total. Without
 * that, the first sync after a change would book the whole difference as XP
 * earned this month and hand the monthly board to whoever signed in first.
 */

import User, { type IUser } from '../models/User';
import Progress from '../models/Progress';
import { XP_FORMULA_VERSION } from '../shared/xp';
import { scoreProgress } from './xpCatalog';
import { currentMonthKey } from './time';
import { logger } from './logger';

export async function restateUserXp(user: IUser): Promise<void> {
  const progress = await Progress.findOne({ userId: user._id });
  const finishedBefore = progress?.finishedModules ?? [];
  const { xp, finishedNow } = await scoreProgress(progress, finishedBefore);

  const oldTotal = user.pointsRaw ?? user.points ?? 0;
  const setAside = oldTotal > 0 ? Math.min(1, Math.max(0, (user.pointsBaseline ?? 0) / oldTotal)) : 0;
  const pointsBaseline = Math.round(xp * setAside);
  const points = Math.max(0, xp - pointsBaseline);
  const update: Partial<IUser> = { pointsRaw: xp, pointsBaseline, points, xpVersion: XP_FORMULA_VERSION };
  if (user.monthlyPointsMonth === currentMonthKey()) {
    const monthShare = oldTotal > 0 ? (user.monthlyPoints ?? 0) / oldTotal : 0;
    update.monthlyPoints = Math.min(points, Math.max(0, Math.round(xp * monthShare)));
  }

  // A targeted write, so an old account that no longer passes a newer
  // validation rule is still restated.
  await User.updateOne({ _id: user._id }, { $set: update });
  Object.assign(user, update);

  const added = finishedNow.filter((key) => !finishedBefore.includes(key));
  if (progress && added.length) {
    await Progress.updateOne({ _id: progress._id }, { $addToSet: { finishedModules: { $each: added } } });
  }
}

/** Restate every account still in an older formula's units. Run at startup,
 *  before the server takes requests, so no push meets a stale account. */
export async function restateStaleAccounts(): Promise<void> {
  let restated = 0;
  let failed = 0;
  for await (const user of User.find({ xpVersion: { $ne: XP_FORMULA_VERSION } }).cursor()) {
    try {
      await restateUserXp(user);
      restated++;
    } catch (err) {
      failed++;
      logger.error('xp.restate_failed', { userId: String(user._id), error: String(err) });
    }
  }
  if (restated || failed) logger.info('xp.restated', { version: XP_FORMULA_VERSION, restated, failed });
}
