import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CREATOR_PERMISSIONS, effectivePermissions } from '../types';
import { verifyStepUp } from '../middleware/reauth';

const router = Router();

// Every route here is admin-only.
router.use(authenticate, requireAdmin);

function adminUserShape(user: IUser) {
  return {
    id: String(user._id),
    email: user.email,
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
const roleSchema = z.object({ role: z.enum(['user', 'creator', 'admin']) }).strict();

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

export default router;
