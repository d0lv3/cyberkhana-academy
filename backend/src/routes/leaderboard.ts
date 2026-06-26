import { Router } from 'express';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { currentMonthKey } from '../utils/time';
import { logger } from '../utils/logger';

const router = Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/* ── GET /api/leaderboard ──
 * Ranks learners by points. Two scopes:
 *   overall  → all-time `points`
 *   monthly  → `monthlyPoints` for the current month (older months read as 0,
 *              so the board "resets" on the 1st with no scheduled job)
 * Optional ?university= filters to one institution.
 *
 * Returns the top N, the requesting user's own rank (even if outside the top),
 * and the list of universities present (for the filter dropdown). */
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

    const filter: Record<string, unknown> = { isBanned: false };
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
      .select('displayName avatarUrl university role points monthlyPoints')
      .lean();

    const entries = docs.map((u, i) => ({
      rank: i + 1,
      userId: String(u._id),
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? null,
      university: u.university || null,
      role: u.role,
      points: scope === 'monthly' ? u.monthlyPoints ?? 0 : u.points ?? 0,
    }));

    // The requesting user's own standing within the same filtered board.
    const me = req.user!;
    const myScore =
      scope === 'monthly'
        ? me.monthlyPointsMonth === month
          ? me.monthlyPoints
          : 0
        : me.points;
    const inBoard = !university || me.university === university;
    let mine: { rank: number; points: number } | null = null;
    if (myScore > 0 && inBoard) {
      const higher = await User.countDocuments({ ...filter, [sortField]: { $gt: myScore } });
      mine = { rank: higher + 1, points: myScore };
    }

    const universitiesRaw = await User.distinct('university', {
      isBanned: false,
      points: { $gt: 0 },
      university: { $type: 'string', $ne: '' },
    });
    const universities = (universitiesRaw as string[])
      .filter((u) => typeof u === 'string' && u.trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({ scope, month, university: university || null, entries, me: mine, universities });
  } catch (err) {
    logger.error('leaderboard.get_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

export default router;
