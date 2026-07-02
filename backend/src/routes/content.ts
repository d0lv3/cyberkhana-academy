import { Router } from 'express';
import mongoose from 'mongoose';
import ContentBucket from '../models/ContentBucket';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { checkSafeJson } from '../utils/sanitize';
import {
  CONTENT_BUCKETS,
  effectivePermissions,
  type ContentBucketKey,
  type CreatorPermission,
} from '../types';
import { logger } from '../utils/logger';

const router = Router();

const MAX_ITEMS_PER_BUCKET = 300;

/** Buckets an admin may moderate across all authors (the two "module" kinds). */
const MODULE_BUCKETS: ContentBucketKey[] = ['os-modules', 'standalone-modules'];

function isModuleBucket(value: string): value is ContentBucketKey {
  return (MODULE_BUCKETS as readonly string[]).includes(value);
}

/** Which creator permission a bucket write requires. */
const PERMISSION_BY_BUCKET: Record<ContentBucketKey, CreatorPermission> = {
  'networking-lessons': 'networking',
  'programming-patches': 'programming',
  'os-modules': 'os-modules',
  'standalone-modules': 'modules',
  paths: 'paths',
};

/** May this user write this bucket? Admins always; creators per grant. The
 * programming bucket also accepts the language-creation grant, since creator
 * languages live in the same patches. */
function canWriteBucket(user: { role: string; creatorPermissions?: string[] }, bucket: ContentBucketKey): boolean {
  if (user.role === 'admin') return true;
  const perms = effectivePermissions(user as { role: 'user' | 'creator' | 'admin'; creatorPermissions?: string[] });
  if (perms.includes(PERMISSION_BY_BUCKET[bucket])) return true;
  return bucket === 'programming-patches' && perms.includes('programming-languages');
}

type AnyItem = Record<string, unknown>;

/** Lifecycle check mirroring the frontend's statusOf(): status wins, isPublished is legacy. */
function isPublishedItem(item: AnyItem): boolean {
  if (typeof item.status === 'string') return item.status === 'published';
  return item.isPublished === true;
}

function isPlainObject(v: unknown): v is AnyItem {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Structural validation per bucket (deep content is free-form, identity fields are not). */
function validateBucketItems(bucket: ContentBucketKey, items: unknown): string | null {
  if (!Array.isArray(items)) return 'items must be an array';
  if (items.length > MAX_ITEMS_PER_BUCKET) return `Too many items (max ${MAX_ITEMS_PER_BUCKET})`;

  for (const item of items) {
    if (!isPlainObject(item)) return 'Every item must be an object';
    if (bucket === 'programming-patches') {
      if (typeof item.languageSlug !== 'string' || !item.languageSlug || item.languageSlug.length > 80) {
        return 'Each patch needs a languageSlug';
      }
    } else {
      if (typeof item.id !== 'string' || !item.id || item.id.length > 160) {
        return 'Every item needs a string id';
      }
    }
  }

  const safety = checkSafeJson(items);
  if (!safety.ok) return safety.reason ?? 'Unsafe payload';
  return null;
}

function isBucketKey(value: string): value is ContentBucketKey {
  return (CONTENT_BUCKETS as readonly string[]).includes(value);
}

/* ── GET /api/content/published ──
 * Aggregates PUBLISHED items across every creator. This is what students see;
 * drafts and in-review content never leave their author's account. */
router.get('/published', authenticate, async (_req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({}).lean();

    const result: Record<ContentBucketKey, unknown[]> = {
      'networking-lessons': [],
      'programming-patches': [],
      'os-modules': [],
      'standalone-modules': [],
      paths: [],
    };

    // languageSlug → merged patch
    const patchByLang = new Map<
      string,
      {
        languageSlug: string;
        newModules: AnyItem[];
        newConcepts: Record<string, AnyItem[]>;
        newLanguage?: AnyItem;
        languageCoverSvg?: string;
      }
    >();

    for (const doc of docs) {
      const items = (doc.items as AnyItem[]) ?? [];

      if (doc.bucket === 'programming-patches') {
        for (const patch of items) {
          if (!isPlainObject(patch) || typeof patch.languageSlug !== 'string') continue;
          const publishedModules = (Array.isArray(patch.newModules) ? patch.newModules : []).filter(
            (m): m is AnyItem => isPlainObject(m) && isPublishedItem(m)
          );
          const publishedConcepts: Record<string, AnyItem[]> = {};
          if (isPlainObject(patch.newConcepts)) {
            for (const [modSlug, concepts] of Object.entries(patch.newConcepts)) {
              const pub = (Array.isArray(concepts) ? concepts : []).filter(
                (c): c is AnyItem => isPlainObject(c) && isPublishedItem(c)
              );
              if (pub.length) publishedConcepts[modSlug] = pub;
            }
          }
          // Creator-defined language: published ones reach every student.
          const publishedLanguage =
            isPlainObject(patch.newLanguage) && isPublishedItem(patch.newLanguage)
              ? (patch.newLanguage as AnyItem)
              : undefined;
          if (!publishedModules.length && !Object.keys(publishedConcepts).length && !publishedLanguage) continue;

          const merged = patchByLang.get(patch.languageSlug) ?? {
            languageSlug: patch.languageSlug,
            newModules: [],
            newConcepts: {},
          };
          merged.newModules.push(...publishedModules);
          for (const [slug, concepts] of Object.entries(publishedConcepts)) {
            merged.newConcepts[slug] = [...(merged.newConcepts[slug] ?? []), ...concepts];
          }
          if (publishedLanguage && !merged.newLanguage) merged.newLanguage = publishedLanguage;
          if (!merged.languageCoverSvg && typeof patch.languageCoverSvg === 'string' && patch.languageCoverSvg) {
            merged.languageCoverSvg = patch.languageCoverSvg;
          }
          patchByLang.set(patch.languageSlug, merged);
        }
      } else {
        result[doc.bucket].push(...items.filter((i) => isPlainObject(i) && isPublishedItem(i)));
      }
    }

    result['programming-patches'] = [...patchByLang.values()];
    res.json({ buckets: result });
  } catch (err) {
    logger.error('content.published_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load content' });
  }
});

/* ── GET /api/content/mine ── all of MY content, every status (the studio view). */
router.get('/mine', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({ ownerId: req.user!._id }).lean();
    const buckets: Partial<Record<ContentBucketKey, unknown[]>> = {};
    for (const doc of docs) buckets[doc.bucket] = doc.items ?? [];
    res.json({ buckets });
  } catch (err) {
    logger.error('content.mine_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load your content' });
  }
});

/* ── PUT /api/content/:bucket ── replace MY bucket. Ownership comes from the
 * session; a creator can never write another creator's documents. */
router.put('/:bucket', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const bucket = req.params.bucket;
  if (!isBucketKey(bucket)) {
    res.status(404).json({ error: 'Unknown bucket' });
    return;
  }

  // Capability gate: the admin decides which content types each creator may author.
  if (!canWriteBucket(req.user!, bucket)) {
    res.status(403).json({ error: 'You do not have permission to author this content type' });
    return;
  }

  const items = (req.body ?? {}).items;
  const problem = validateBucketItems(bucket, items);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  try {
    await ContentBucket.findOneAndUpdate(
      { ownerId: req.user!._id, bucket },
      { $set: { items } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, count: (items as unknown[]).length });
  } catch (err) {
    logger.error('content.put_failed', { bucket, error: String(err) });
    res.status(500).json({ error: 'Could not save content' });
  }
});

/* ── GET /api/content/admin/modules ── every PUBLISHED module across ALL
 * authors, each annotated with its owner. Admin-only: the studio surfaces
 * these so an admin can moderate/fix any creator's live module. */
router.get('/admin/modules', authenticate, requireRole('admin'), async (_req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({ bucket: { $in: MODULE_BUCKETS } }).lean();

    const ownerIds = [...new Set(docs.map((d) => String(d.ownerId)))];
    const owners = await User.find({ _id: { $in: ownerIds } }).select('displayName').lean();
    const nameById = new Map(owners.map((u) => [String(u._id), u.displayName as string]));

    const items: AnyItem[] = [];
    for (const doc of docs) {
      for (const item of ((doc.items as AnyItem[]) ?? [])) {
        if (!isPlainObject(item) || !isPublishedItem(item)) continue;
        items.push({
          ...item,
          _ownerId: String(doc.ownerId),
          _ownerName: nameById.get(String(doc.ownerId)) ?? 'Unknown',
          _bucket: doc.bucket,
        });
      }
    }
    res.json({ items });
  } catch (err) {
    logger.error('content.admin_modules_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load modules' });
  }
});

/* ── PATCH /api/content/admin/module ── replace a single module in its
 * author's bucket, IN PLACE (ownership preserved). Admin-only. The module must
 * already exist in the named owner's bucket — admins edit existing modules,
 * they never inject new items into another account. A wrong/forged ownerId
 * simply 404s. */
router.patch('/admin/module', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const { ownerId, bucket, item } = (req.body ?? {}) as {
    ownerId?: unknown;
    bucket?: unknown;
    item?: unknown;
  };

  if (typeof bucket !== 'string' || !isModuleBucket(bucket)) {
    res.status(404).json({ error: 'Unknown module bucket' });
    return;
  }
  if (typeof ownerId !== 'string' || !mongoose.isValidObjectId(ownerId)) {
    res.status(400).json({ error: 'Invalid owner' });
    return;
  }
  if (!isPlainObject(item) || typeof item.id !== 'string' || !item.id) {
    res.status(400).json({ error: 'A module with an id is required' });
    return;
  }
  const problem = validateBucketItems(bucket, [item]);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  try {
    const doc = await ContentBucket.findOne({ ownerId, bucket });
    if (!doc) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }
    const list = doc.items as AnyItem[];
    const idx = list.findIndex((i) => isPlainObject(i) && i.id === item.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    list[idx] = item;
    doc.markModified('items');
    await doc.save();

    logger.info('content.admin_module_edited', {
      by: String(req.user!._id),
      owner: ownerId,
      bucket,
      itemId: item.id,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('content.admin_module_patch_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save module' });
  }
});

export default router;
