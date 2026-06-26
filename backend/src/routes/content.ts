import { Router } from 'express';
import ContentBucket from '../models/ContentBucket';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { checkSafeJson } from '../utils/sanitize';
import { CONTENT_BUCKETS, type ContentBucketKey } from '../types';
import { logger } from '../utils/logger';

const router = Router();

const MAX_ITEMS_PER_BUCKET = 300;

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
    const patchByLang = new Map<string, { languageSlug: string; newModules: AnyItem[]; newConcepts: Record<string, AnyItem[]> }>();

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
          if (!publishedModules.length && !Object.keys(publishedConcepts).length) continue;

          const merged = patchByLang.get(patch.languageSlug) ?? {
            languageSlug: patch.languageSlug,
            newModules: [],
            newConcepts: {},
          };
          merged.newModules.push(...publishedModules);
          for (const [slug, concepts] of Object.entries(publishedConcepts)) {
            merged.newConcepts[slug] = [...(merged.newConcepts[slug] ?? []), ...concepts];
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

export default router;
