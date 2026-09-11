import { Router } from 'express';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { currentMonthKey } from '../utils/time';
import { logger } from '../utils/logger';
import { LEADERBOARD_MIN_XP } from '../shared/xp';

const router = Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/* ── GET /api/leaderboard ──
 * Ranks learners by XP. Two scopes:
 *   overall  → all-time `points`: lifetime XP since the last admin reset
 *   monthly  → `monthlyPoints` for the current month (older months read as 0,
 *              so the board "resets" on the 1st with no scheduled job)
 * Optional ?university= filters to one institution. Nobody is ranked below
 * level 0x2 (LEADERBOARD_MIN_XP of lifetime XP), so accounts that never
 * really started stay off the board.
 *
 * Returns the top N with each one's lifetime XP (their level), the requesting
 * user's own rank (even if outside the top) and XP, when the all-time board
 * was last reset, and the universities present (for the filter dropdown). */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const scope = req.query.scope === 'monthly' ? 'monthly' : 'overall';
    const university =
      typeof req.query.university === 'string' ? req.query.university.trim().slice(0, 120) : '';
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const month = currentMonthKey();
    const sortField = scope === 'monthly' ? 'monthlyPoints' : 'points';

    // A member waiting to be deleted has left the board already.
    const filter: Record<string, unknown> = {
      isBanned: false,
      deletionScheduledFor: { $exists: false },
      pointsRaw: { $gte: LEADERBOARD_MIN_XP },
    };
    if (university) filter.university = university;
    if (scope === 'monthly') {
      filter.monthlyPointsMonth = month;
      filter.monthlyPoints = { $gt: 0 };
    } else {
      filter.points = { $gt: 0 };
    }

    const docs = await User.find(filter)
      .sort({ [sortField]: -1, updatedAt: 1 })
      .limit(limit)
      .select('displayName username avatarUrl university role points monthlyPoints pointsRaw')
      .lean();

    const entries = docs.map((u, i) => ({
      rank: i + 1,
      userId: String(u._id),
      // The public handle, so a row can link to its profile.
      username: u.username ?? null,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? null,
      university: u.university || null,
      role: u.role,
      points: scope === 'monthly' ? u.monthlyPoints ?? 0 : u.points ?? 0,
      // Lifetime XP, which the row's level badge is read from.
      xp: u.pointsRaw ?? 0,
    }));

    // The requesting user's own standing within the same filtered board.
    const me = req.user!;
    const myXp = me.pointsRaw ?? 0;
    const myScore =
      scope === 'monthly'
        ? me.monthlyPointsMonth === month
          ? me.monthlyPoints
          : 0
        : me.points;
    const inBoard = (!university || me.university === university) && myXp >= LEADERBOARD_MIN_XP;
    let mine: { rank: number; points: number; xp: number } | null = null;
    if (myScore > 0 && inBoard) {
      const higher = await User.countDocuments({ ...filter, [sortField]: { $gt: myScore } });
      mine = { rank: higher + 1, points: myScore, xp: myXp };
    }

    // The all-time board counts from the last reset, which stamps every account at once.
    const lastReset = await User.findOne({ pointsResetAt: { $exists: true } })
      .sort({ pointsResetAt: -1 })
      .select('pointsResetAt')
      .lean();

    const universitiesRaw = await User.distinct('university', {
      isBanned: false,
      deletionScheduledFor: { $exists: false },
      points: { $gt: 0 },
      pointsRaw: { $gte: LEADERBOARD_MIN_XP },
      university: { $type: 'string', $ne: '' },
    });
    const universities = (universitiesRaw as string[])
      .filter((u) => typeof u === 'string' && u.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({
      scope,
      month,
      university: university || null,
      entries,
      me: mine,
      myXp,
      minXp: LEADERBOARD_MIN_XP,
      since: lastReset?.pointsResetAt ?? null,
      universities,
    });
  } catch (err) {
    logger.error('leaderboard.get_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

export default router;
