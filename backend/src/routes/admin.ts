import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CREATOR_PERMISSIONS, effectivePermissions } from '../types';
import { verifyStepUp } from '../middleware/reauth';
import { currentMonthKey } from '../utils/time';

const router = Router();

// Every route here is admin-only.
router.use(authenticate, requireAdmin);

function adminUserShape(user: IUser) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    permissions: effectivePermissions(user),
    isBanned: user.isBanned,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Escape regex metacharacters so a search query can't be a regex injection. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ── GET /api/admin/users?q=<search> ── newest first, capped at 100. */
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    const filter = q
      ? {
          $or: [
            { email: { $regex: escapeRegex(q), $options: 'i' } },
            { username: { $regex: escapeRegex(q), $options: 'i' } },
            { displayName: { $regex: escapeRegex(q), $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ users: users.map(adminUserShape) });
  } catch (err) {
    logger.error('admin.users_list_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load users' });
  }
});

/* ── PATCH /api/admin/users/:id/role ── promote/demote a member. */
const roleSchema = z
  .object({
    role: z.enum(['user', 'creator', 'admin']),
    /* Fresh Google ID token. Promoting someone to admin is the single biggest
       privilege escalation available here, so it needs step-up auth at least as
       much as a permissions tweak does. */
    credential: z.string().min(20).max(4096),
  })
  .strict();

router.patch('/users/:id/role', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  // Safety rail: admins cannot change their own role (prevents locking
  // yourself out of the last admin account).
  if (id === String(req.user!._id)) {
    res.status(400).json({ error: 'You cannot change your own role' });
    return;
  }

  // Step-up auth BEFORE touching anything.
  const reauth = await verifyStepUp(parsed.data.credential, req.user!);
  if (!reauth.ok) {
    logger.warn('admin.role_reauth_failed', { by: String(req.user!._id), target: id });
    res.status(reauth.status ?? 401).json({ error: reauth.error ?? 'Re-authentication required' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const previous = target.role;
    target.role = parsed.data.role;
    await target.save();

    logger.info('admin.role_changed', {
      by: String(req.user!._id),
      target: id,
      from: previous,
      to: parsed.data.role,
    });
    res.json({ user: adminUserShape(target) });
  } catch (err) {
    logger.error('admin.role_change_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not update role' });
  }
});

/* ── PATCH /api/admin/users/:id/ban ── ban/unban a member.
 * Banned users are rejected by `authenticate` on their next request. */
const banSchema = z.object({ banned: z.boolean() }).strict();

router.patch('/users/:id/ban', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = banSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  if (id === String(req.user!._id)) {
    res.status(400).json({ error: 'You cannot ban yourself' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // Admins must be demoted before they can be banned.
    if (target.role === 'admin' && parsed.data.banned) {
      res.status(400).json({ error: 'Demote this admin before banning them' });
      return;
    }
    target.isBanned = parsed.data.banned;
    await target.save();

    logger.info('admin.ban_changed', {
      by: String(req.user!._id),
      target: id,
      banned: parsed.data.banned,
    });
    res.json({ user: adminUserShape(target) });
  } catch (err) {
    logger.error('admin.ban_change_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not update ban status' });
  }
});

/* ── PATCH /api/admin/users/:id/permissions ── set a creator's capabilities.
 * Only meaningful for creators (admins implicitly hold everything; students
 * hold nothing). The stored set is exactly what the admin toggled. */
const permissionsSchema = z
  .object({
    permissions: z.array(z.enum(CREATOR_PERMISSIONS)).max(CREATOR_PERMISSIONS.length),
    /* Fresh Google ID token proving the admin is still at the keyboard.
       Granting capabilities is privilege escalation, so a live session alone
       is not enough — see middleware/reauth.ts. */
    credential: z.string().min(20).max(4096),
  })
  .strict();

router.patch('/users/:id/permissions', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = permissionsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid permissions' });
    return;
  }

  // Step-up auth BEFORE touching anything.
  const reauth = await verifyStepUp(parsed.data.credential, req.user!);
  if (!reauth.ok) {
    logger.warn('admin.permissions_reauth_failed', {
      by: String(req.user!._id),
      target: id,
    });
    res.status(reauth.status ?? 401).json({ error: reauth.error ?? 'Re-authentication required' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (target.role !== 'creator') {
      res.status(400).json({ error: 'Permissions apply to creators only' });
      return;
    }

    target.creatorPermissions = [...new Set(parsed.data.permissions)];
    await target.save();

    logger.info('admin.permissions_changed', {
      by: String(req.user!._id),
      target: id,
      permissions: target.creatorPermissions,
    });
    res.json({ user: adminUserShape(target) });
  } catch (err) {
    logger.error('admin.permissions_change_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not update permissions' });
  }
});

/* ── POST /api/admin/points/reset ── clear the leaderboard.
 *
 * Everyone's standing goes to zero. Nobody's learning does: a completed module
 * stays completed, and the certificates, progress bars and skill matrix built
 * on those completions are untouched. This empties the board, it does not
 * un-teach anyone.
 *
 * It works by moving each learner's baseline up to what they had earned rather
 * than by writing a zero, because a zero would not survive. Points are derived
 * on the client from the learner's completions and pushed on every sync, so the
 * next sync would restate the same history and hand the whole total back within
 * seconds — for every learner with a tab open, silently, and only for them.
 * Measuring against a baseline is what makes the reset hold: the board then
 * shows the distance travelled since it was cleared.
 *
 * Irreversible: the old standings are not kept anywhere, so a reset by mistake
 * cannot be walked back. Hence the step-up confirmation, same as a promotion. */
const resetPointsSchema = z
  .object({
    /* Fresh Google ID token. This touches every account at once and cannot be
       undone, which is reason enough on its own. */
    credential: z.string().min(20).max(4096),
  })
  .strict();

router.post('/points/reset', async (req: AuthRequest, res) => {
  const parsed = resetPointsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const reauth = await verifyStepUp(parsed.data.credential, req.user!);
  if (!reauth.ok) {
    logger.warn('admin.points_reset_reauth_failed', { by: String(req.user!._id) });
    res.status(reauth.status ?? 401).json({ error: reauth.error ?? 'Re-authentication required' });
    return;
  }

  try {
    /* One pipeline update rather than a read-then-write per account: the
       baseline each learner needs is a function of what that document already
       holds, and every expression in a single $set stage sees the document as
       it was, so `pointsRaw` can be read and written in the same breath.

       `pointsRaw` is unset on accounts that have not synced since it was
       introduced. For those, `points` IS the raw total — nothing had been
       subtracted from it yet — so it is the right baseline to fall back to. */
    const raw = { $ifNull: ['$pointsRaw', { $ifNull: ['$points', 0] }] };
    const result = await User.updateMany({}, [
      {
        $set: {
          pointsRaw: raw,
          pointsBaseline: raw,
          points: 0,
          monthlyPoints: 0,
          monthlyPointsMonth: currentMonthKey(),
          pointsResetAt: '$$NOW',
        },
      },
    ]);

    logger.warn('admin.points_reset', {
      by: String(req.user!._id),
      affected: result.modifiedCount,
    });
    res.json({ ok: true, affected: result.modifiedCount });
  } catch (err) {
    logger.error('admin.points_reset_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not reset points' });
  }
});

export default router;
