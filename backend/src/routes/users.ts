import { Router } from 'express';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { publicSocials } from '../utils/socials';
import { logger } from '../utils/logger';

const router = Router();

/* ── The public side of a member ──
 *
 * What one member may see of another. Built field by field from this list and
 * nothing else: the database is asked for these fields only, and the response
 * is assembled from them by hand rather than by spreading the document, so a
 * field added to the user model later cannot leak here by accident.
 *
 * Deliberately absent: email, the Google identity and photo on file, country,
 * language, role and permissions, sign-in times, suspension state, and every
 * record of what the member has studied beyond the points the leaderboard
 * already shows. The bio appears only when its owner has switched it on.
 */
const PUBLIC_FIELDS = 'username displayName avatarUrl bio showBio university points socials';

/** 24 hex characters: an account id. A username is at most 20, so the two never collide. */
const OBJECT_ID = /^[a-f0-9]{24}$/i;
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;

/* ── GET /api/users/:handle ──
 * A member's public profile, by username (preferred) or by account id (for
 * the few who have not claimed a username yet). Signed-in members only, the
 * same audience as the leaderboard. A suspended account reads as not found. */
router.get('/:handle', authenticate, async (req: AuthRequest, res) => {
  const handle = String(req.params.handle ?? '').trim();
  const filter = OBJECT_ID.test(handle)
    ? { _id: handle }
    : USERNAME.test(handle)
      ? { username: handle.toLowerCase() }
      : null;
  if (!filter) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  try {
    const user = await User.findOne({ ...filter, isBanned: false }).select(PUBLIC_FIELDS).lean();
    if (!user) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Standing on the all-time board, counted the way the leaderboard counts
    // a member's own rank. No points, no rank.
    const points = typeof user.points === 'number' ? user.points : 0;
    const rank =
      points > 0
        ? (await User.countDocuments({ isBanned: false, points: { $gt: points } })) + 1
        : null;

    res.json({
      profile: {
        id: String(user._id),
        username: user.username ?? null,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.showBio && user.bio ? user.bio : null,
        university: user.university || null,
        socials: publicSocials(user.socials),
        points,
        rank,
      },
    });
  } catch (err) {
    logger.error('users.profile_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load this profile' });
  }
});

export default router;
