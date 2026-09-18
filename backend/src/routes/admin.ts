import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CREATOR_PERMISSIONS, effectivePermissions } from '../types';
import { verifyStepUp } from '../middleware/reauth';
import { currentMonthKey } from '../utils/time';
import { cleanTags, TAG_MAX } from '../shared/tags';
import { purgeAccount } from '../utils/accountDeletion';

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
    deletionRequestedAt: user.deletionRequestedAt,
    deletionScheduledFor: user.deletionScheduledFor,
    xp: user.pointsRaw ?? 0,
    points: user.points ?? 0,
    pointsAdjustment: user.pointsAdjustment ?? 0,
    tags: user.tags ?? [],
  };
}

/** Escape regex metacharacters so a search query can't be a regex injection. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ── GET /api/admin/users?q=<search> ── newest first, capped at 100.
 * Members who have asked to be deleted come first, soonest due first, and are
 * never cut off by the cap: they are the rows an admin most needs to see. */
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

    const [leaving, others] = await Promise.all([
      User.find({ ...filter, deletionScheduledFor: { $exists: true } })
        .sort({ deletionScheduledFor: 1 })
        .limit(100),
      User.find({ ...filter, deletionScheduledFor: { $exists: false } })
        .sort({ createdAt: -1 })
        .limit(100),
    ]);
    res.json({ users: [...leaving, ...others].map(adminUserShape) });
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

/* ── DELETE /api/admin/users/:id ── delete a member's account, now.
 *
 * Takes the account apart exactly as an expired deletion request does
 * (utils/accountDeletion.ts), so what goes and what stays matches the Privacy
 * Policy either way: published content and anonymised feedback stay, the rest
 * goes. Immediate and irreversible, so it needs a fresh Google confirmation,
 * like a promotion or a points reset. Admins must be demoted first, as for a
 * ban. Nothing stops the person signing up again: keeping someone out is what
 * a ban is for. */
const deleteUserSchema = z
  .object({
    credential: z.string().min(20).max(4096),
  })
  .strict();

router.delete('/users/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = deleteUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  if (id === String(req.user!._id)) {
    res.status(400).json({ error: 'You cannot delete your own account here' });
    return;
  }

  // Step-up auth BEFORE touching anything.
  const reauth = await verifyStepUp(parsed.data.credential, req.user!);
  if (!reauth.ok) {
    logger.warn('admin.delete_reauth_failed', { by: String(req.user!._id), target: id });
    res.status(reauth.status ?? 401).json({ error: reauth.error ?? 'Re-authentication required' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (target.role === 'admin') {
      res.status(400).json({ error: 'Demote this admin before deleting their account' });
      return;
    }
    await purgeAccount(target, 'admin', String(req.user!._id));
    res.json({ ok: true });
  } catch (err) {
    logger.error('admin.user_delete_failed', { target: id, error: String(err) });
    res.status(500).json({ error: 'Could not delete this account' });
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
 * on those completions are untouched. Levels do not move either, and an award
 * an admin handed out stays in the member's XP. This empties the board, it
 * does not un-teach anyone or take anything back.
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

/* ── POST /api/admin/users/:id/points ── give or take points by hand.
 *
 * For what the Academy cannot see: running a workshop, winning a CTF, helping
 * in the channel. A negative amount takes them back, which is also how a
 * mistake is undone, so this needs no separate correction route.
 *
 * It is XP like any other: it counts toward the level, the profile total and
 * the board, not the board alone. It is recorded in `pointsAdjustment` as well
 * as added to the total, because the total is restated from the member's
 * completions on every sync and the award has to be added back each time; a
 * number written only into the total would survive until that member next
 * opened a tab and no longer.
 *
 * No step-up confirmation, unlike a promotion. This is targeted at one
 * account, is undone by sending the negative, and hands out no capability the
 * member did not have. Banning, which is closer in weight, does not ask for
 * one either. */
const awardSchema = z
  .object({
    /* Whole points. Bounded well inside what the leaderboard can hold, so a
       slipped keyboard cannot put someone at the top for ever. */
    amount: z.number().int().min(-100_000).max(100_000).refine((n) => n !== 0, 'Nothing to award'),
    /** Why, for the log. Never shown to the member. */
    reason: z.string().max(200).optional(),
  })
  .strict();

router.post('/users/:id/points', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = awardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid award' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const before = target.points ?? 0;
    target.pointsAdjustment = (target.pointsAdjustment ?? 0) + parsed.data.amount;
    /* Into the total as well, so the level and the profile move now rather
       than at this member's next sync. The sync recomputes the same figure. */
    target.pointsRaw = Math.max(0, (target.pointsRaw ?? 0) + parsed.data.amount);
    target.points = Math.max(0, target.pointsRaw - (target.pointsBaseline ?? 0));

    /* A gain counts toward this month as any other gain does. A deduction is
       not taken back out of the monthly board: that board is a record of what
       happened during the month, and it resets on its own on the 1st. */
    const month = currentMonthKey();
    if (target.monthlyPointsMonth !== month) {
      target.monthlyPointsMonth = month;
      target.monthlyPoints = 0;
    }
    target.monthlyPoints += Math.max(0, target.points - before);

    await target.save();

    logger.info('admin.points_awarded', {
      by: String(req.user!._id),
      target: id,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      standing: target.points,
    });
    res.json({ user: adminUserShape(target) });
  } catch (err) {
    logger.error('admin.points_award_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not award points' });
  }
});

/* ── PUT /api/admin/users/:id/tags ── set the labels on an account.
 *
 * The whole set at once rather than add/remove, because that is how the studio
 * edits them and it makes the request idempotent: what you send is what the
 * profile shows. An empty array clears them.
 *
 * The body is passed through `cleanTags` rather than validated and stored: the
 * colour is snapped to the palette, labels are trimmed and de-duplicated, and
 * the set is capped. The schema below is only there to keep something
 * enormous from reaching it. */
const tagsSchema = z
  .object({
    tags: z
      .array(z.object({ label: z.string().max(200), color: z.string().max(40) }).strict())
      .max(TAG_MAX * 4),
  })
  .strict();

router.put('/users/:id/tags', async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const parsed = tagsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid tags' });
    return;
  }

  try {
    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const tags = cleanTags(parsed.data.tags);
    target.tags = tags.length ? tags : undefined;
    await target.save();

    logger.info('admin.tags_changed', {
      by: String(req.user!._id),
      target: id,
      tags: tags.map((t) => t.label),
    });
    res.json({ user: adminUserShape(target) });
  } catch (err) {
    logger.error('admin.tags_change_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not update tags' });
  }
});

export default router;
