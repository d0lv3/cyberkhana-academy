import { Router } from 'express';
import mongoose from 'mongoose';
import ContentBucket from '../models/ContentBucket';
import ContentGrant from '../models/ContentGrant';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import {
  CONTENT_BUCKETS,
  effectivePermissions,
  type ContentBucketKey,
  type CreatorPermission,
} from '../types';
import { logger } from '../utils/logger';

const router = Router();

/** How many people one creator may share a single bucket with. */
const MAX_GRANTEES_PER_BUCKET = 25;

/** Which creator permission a bucket write requires. Mirrors content.ts. */
const PERMISSION_BY_BUCKET: Record<ContentBucketKey, CreatorPermission> = {
  'networking-lessons': 'networking',
  'programming-patches': 'programming',
  'os-modules': 'os-modules',
  'standalone-modules': 'modules',
  paths: 'paths',
};

function isBucketKey(value: unknown): value is ContentBucketKey {
  return typeof value === 'string' && (CONTENT_BUCKETS as readonly string[]).includes(value);
}

function canAuthorBucket(
  user: { role: string; creatorPermissions?: string[] },
  bucket: ContentBucketKey
): boolean {
  if (user.role === 'admin') return true;
  const perms = effectivePermissions(
    user as { role: 'user' | 'creator' | 'admin'; creatorPermissions?: string[] }
  );
  if (perms.includes(PERMISSION_BY_BUCKET[bucket])) return true;
  return bucket === 'programming-patches' && perms.includes('programming-languages');
}

interface PersonView {
  id: string;
  username?: string;
  displayName: string;
}

function personView(u: { _id: unknown; username?: string; displayName: string }): PersonView {
  return { id: String(u._id), username: u.username, displayName: u.displayName };
}

/* ── GET /api/collab/grants ──
 * Both directions: who I have shared with, and who has shared with me. The
 * studio needs the first for its share panel and the second to know which
 * "shared with me" sections to render. */
router.get('/grants', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  try {
    const me = req.user!._id;
    const [given, received] = await Promise.all([
      ContentGrant.find({ ownerId: me }).lean(),
      ContentGrant.find({ granteeId: me }).lean(),
    ]);

    const peopleIds = [
      ...new Set([
        ...given.map((g) => String(g.granteeId)),
        ...received.map((g) => String(g.ownerId)),
      ]),
    ];
    const people = await User.find({ _id: { $in: peopleIds } })
      .select('username displayName')
      .lean();
    const byId = new Map(people.map((u) => [String(u._id), personView(u as never)]));

    res.json({
      given: given.map((g) => ({
        id: String(g._id),
        bucket: g.bucket,
        grantee: byId.get(String(g.granteeId)) ?? null,
        createdAt: g.createdAt,
      })),
      received: received.map((g) => ({
        id: String(g._id),
        bucket: g.bucket,
        owner: byId.get(String(g.ownerId)) ?? null,
        createdAt: g.createdAt,
      })),
    });
  } catch (err) {
    logger.error('collab.grants_list_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load sharing' });
  }
});

/* ── POST /api/collab/grants ── share one of my buckets with another creator.
 *
 * The username lookup only ever confirms or denies one name the caller already
 * typed, returns nothing but a display name, and is limited to signed-in
 * creators, so it is not a usable directory of the platform's accounts. */
router.post('/grants', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const { username, bucket } = (req.body ?? {}) as { username?: unknown; bucket?: unknown };

  if (!isBucketKey(bucket)) {
    res.status(404).json({ error: 'Unknown content bucket' });
    return;
  }
  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'A username is required' });
    return;
  }
  const handle = username.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    res.status(400).json({ error: 'That is not a valid username' });
    return;
  }

  // You can only share what you may author yourself.
  if (!canAuthorBucket(req.user!, bucket)) {
    res.status(403).json({ error: 'You do not have permission to author this content type' });
    return;
  }

  try {
    const target = await User.findOne({ username: handle }).select('username displayName role creatorPermissions');
    if (!target) {
      res.status(404).json({ error: `No user found with the username "${handle}"` });
      return;
    }
    if (String(target._id) === String(req.user!._id)) {
      res.status(400).json({ error: 'That is your own account' });
      return;
    }
    if (target.role !== 'creator' && target.role !== 'admin') {
      res.status(403).json({
        error: `${target.displayName} is not a creator yet, so they cannot be given content to work on.`,
      });
      return;
    }
    // A grant points an existing capability at someone else's bucket; it never
    // creates one. Without the matching permission there is nothing to point.
    if (!canAuthorBucket(target as never, bucket)) {
      res.status(403).json({
        error: `${target.displayName} does not have permission for this content type. An admin needs to grant it first.`,
      });
      return;
    }

    const count = await ContentGrant.countDocuments({ ownerId: req.user!._id, bucket });
    if (count >= MAX_GRANTEES_PER_BUCKET) {
      res.status(400).json({ error: `You can share this with at most ${MAX_GRANTEES_PER_BUCKET} people.` });
      return;
    }

    const grant = await ContentGrant.findOneAndUpdate(
      { ownerId: req.user!._id, granteeId: target._id, bucket },
      { $setOnInsert: { ownerId: req.user!._id, granteeId: target._id, bucket } },
      { upsert: true, new: true }
    );

    logger.info('collab.grant_created', {
      owner: String(req.user!._id),
      grantee: String(target._id),
      bucket,
    });

    res.status(201).json({
      grant: {
        id: String(grant._id),
        bucket,
        grantee: personView(target as never),
        createdAt: grant.createdAt,
      },
    });
  } catch (err) {
    logger.error('collab.grant_create_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not share this content' });
  }
});

/* ── DELETE /api/collab/grants/:id ── revoke. The owner can take access back at
 * any time; the grantee can walk away from a share they no longer want. Either
 * way the content stays where it is, in the owner's bucket. */
router.delete('/grants/:id', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'Grant not found' });
    return;
  }

  try {
    const grant = await ContentGrant.findById(id);
    if (!grant) {
      res.status(404).json({ error: 'Grant not found' });
      return;
    }
    const me = String(req.user!._id);
    const mayRevoke =
      String(grant.ownerId) === me || String(grant.granteeId) === me || req.user!.role === 'admin';
    if (!mayRevoke) {
      res.status(403).json({ error: 'This is not your share to revoke' });
      return;
    }

    await grant.deleteOne();
    logger.info('collab.grant_revoked', {
      by: me,
      owner: String(grant.ownerId),
      grantee: String(grant.granteeId),
      bucket: grant.bucket,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('collab.grant_revoke_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not revoke this share' });
  }
});

/* ── GET /api/collab/shared ──
 * Every bucket shared with me, with its items and its owner. Scoped strictly to
 * my own grants: unlike the admin listing this shows nothing the caller has not
 * been given, and it carries drafts, because a collaborator is working on the
 * content rather than moderating what is already live. */
router.get('/shared', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  try {
    const grants = await ContentGrant.find({ granteeId: req.user!._id }).lean();
    if (grants.length === 0) {
      res.json({ shared: [] });
      return;
    }

    const ownerIds = [...new Set(grants.map((g) => String(g.ownerId)))];
    const owners = await User.find({ _id: { $in: ownerIds } })
      .select('username displayName')
      .lean();
    const ownerById = new Map(owners.map((u) => [String(u._id), personView(u as never)]));

    const docs = await ContentBucket.find({
      $or: grants.map((g) => ({ ownerId: g.ownerId, bucket: g.bucket })),
    }).lean();

    const shared = grants.map((g) => {
      const doc = docs.find(
        (d) => String(d.ownerId) === String(g.ownerId) && d.bucket === g.bucket
      );
      return {
        grantId: String(g._id),
        bucket: g.bucket,
        owner: ownerById.get(String(g.ownerId)) ?? null,
        items: doc?.items ?? [],
      };
    });

    res.json({ shared });
  } catch (err) {
    logger.error('collab.shared_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load shared content' });
  }
});

export default router;
