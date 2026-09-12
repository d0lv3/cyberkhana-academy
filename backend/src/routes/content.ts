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
import { canEditOthersBucket } from '../utils/grants';
import { isPlainObject, isPublishedItem, type AnyItem } from '../utils/contentStatus';
import { logger } from '../utils/logger';
import { invalidateXpCatalog } from '../utils/xpCatalog';

const router = Router();

/* XP is scored against the published content, so any successful write here
   drops the server's cached catalog (utils/xpCatalog.ts). */
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode < 400) invalidateXpCatalog();
    });
  }
  next();
});

const MAX_ITEMS_PER_BUCKET = 300;

/** Buckets an admin may moderate across all authors. These all store a flat,
 * id-keyed array, so one list/patch pair serves them. `programming-patches` is
 * nested (language → modules/concepts) and has its own pair further down. */
const ADMIN_ITEM_BUCKETS: ContentBucketKey[] = [
  'os-modules',
  'standalone-modules',
  'networking-lessons',
  'networking-units',
];

function isAdminItemBucket(value: string): value is ContentBucketKey {
  return (ADMIN_ITEM_BUCKETS as readonly string[]).includes(value);
}

/** Which creator permission a bucket write requires. */
const PERMISSION_BY_BUCKET: Record<ContentBucketKey, CreatorPermission> = {
  'networking-lessons': 'networking',
  'networking-units': 'networking',
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

/** What an admin may see and edit across every author: live content plus the
 * review queue. Drafts stay private to their author — 'in_review' is the point
 * at which a creator hands the work over, so it is also the point at which it
 * becomes visible to a moderator. Never use this for the student-facing
 * /published feed, which must stay published-only. */
function isModeratableItem(item: AnyItem): boolean {
  if (typeof item.status === 'string') return item.status === 'published' || item.status === 'in_review';
  return item.isPublished === true;
}

/* ── Author credit ──
 * Published content goes out credited to the account that owns its bucket,
 * read fresh on every request so a renamed creator or a new picture shows up
 * everywhere at once. The credit is never taken from the item itself: items
 * are written by their author, so a stored credit would let anyone sign their
 * work with someone else's name. Only public profile fields leave the server. */
interface PublicAuthor {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
}

async function publicAuthorsFor(ownerIds: string[]): Promise<Map<string, PublicAuthor>> {
  if (ownerIds.length === 0) return new Map();
  // An owner waiting to be deleted has no profile to link to, so their work
  // goes out as it will once they are gone: under the name saved on it.
  const owners = await User.find({ _id: { $in: ownerIds }, deletionScheduledFor: { $exists: false } })
    .select('displayName username avatarUrl')
    .lean();
  return new Map(
    owners.map((u) => [
      String(u._id),
      {
        id: String(u._id),
        displayName: u.displayName,
        ...(u.username ? { username: u.username } : {}),
        ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
      },
    ])
  );
}

/** A copy of the item with no `_author` of its own. */
function withoutCredit(item: AnyItem): AnyItem {
  if (!('_author' in item)) return item;
  const copy = { ...item };
  delete copy._author;
  return copy;
}

/** The item as students receive it: credited to its owner, or to nobody when
 * the owning account no longer exists or is waiting to be deleted (the client
 * then falls back to the name saved on the item). */
function credited(item: AnyItem, author: PublicAuthor | undefined): AnyItem {
  const clean = withoutCredit(item);
  return author ? { ...clean, _author: author } : clean;
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
    // A unit is a list of lesson ids. Anything else in that slot would reach
    // every student's Networking page, so its shape is checked, not assumed.
    if (bucket === 'networking-units') {
      const ids = item.lessonIds;
      if (
        !Array.isArray(ids) ||
        ids.length > 200 ||
        ids.some((id) => typeof id !== 'string' || !id || id.length > 160)
      ) {
        return 'A unit lists its lessons as an array of lesson ids';
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
 * drafts and in-review content never leave their author's account. Every item
 * in the flat buckets carries `_author`, its owner's public credit. */
router.get('/published', authenticate, async (_req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({}).lean();
    const authors = await publicAuthorsFor([...new Set(docs.map((d) => String(d.ownerId)))]);

    const result: Record<ContentBucketKey, unknown[]> = {
      'networking-lessons': [],
      'networking-units': [],
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
      const author = authors.get(String(doc.ownerId));

      if (doc.bucket === 'programming-patches') {
        /* Patches from several creators merge into one per language below,
           so each module, lesson and language is credited on its own, to the
           owner of the patch it came from. */
        for (const patch of items) {
          if (!isPlainObject(patch) || typeof patch.languageSlug !== 'string') continue;
          const publishedModules = (Array.isArray(patch.newModules) ? patch.newModules : [])
            .filter((m): m is AnyItem => isPlainObject(m) && isPublishedItem(m))
            .map((m) => credited(m, author));
          const publishedConcepts: Record<string, AnyItem[]> = {};
          if (isPlainObject(patch.newConcepts)) {
            for (const [modSlug, concepts] of Object.entries(patch.newConcepts)) {
              const pub = (Array.isArray(concepts) ? concepts : [])
                .filter((c): c is AnyItem => isPlainObject(c) && isPublishedItem(c))
                .map((c) => credited(c, author));
              if (pub.length) publishedConcepts[modSlug] = pub;
            }
          }
          // Creator-defined language: published ones reach every student.
          const publishedLanguage =
            isPlainObject(patch.newLanguage) && isPublishedItem(patch.newLanguage)
              ? credited(patch.newLanguage as AnyItem, author)
              : undefined;
          /* ── Cover art ──
             A language's cover belongs to the language, and travels when the
             language does. A patch with no `newLanguage` of its own is a patch
             ON A BUILT-IN one, which every student can already see, so its
             cover reaches them even when the patch adds no lessons: that is
             exactly the shape of a patch whose only purpose is the artwork,
             and dropping it left Python, C and Bash drawn as placeholders for
             everyone but the creator who uploaded them. A creator-defined
             language is different: its cover waits for the language itself to
             be published, along with the rest of the draft. */
          const cover =
            typeof patch.languageCoverSvg === 'string' && patch.languageCoverSvg
              ? patch.languageCoverSvg
              : undefined;
          const coverTravels = !!cover && (!isPlainObject(patch.newLanguage) || !!publishedLanguage);

          if (
            !publishedModules.length &&
            !Object.keys(publishedConcepts).length &&
            !publishedLanguage &&
            !coverTravels
          ) {
            continue;
          }

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
          if (!merged.languageCoverSvg && coverTravels) merged.languageCoverSvg = cover;
          patchByLang.set(patch.languageSlug, merged);
        }
      } else {
        result[doc.bucket].push(
          ...items
            .filter((i) => isPlainObject(i) && isPublishedItem(i))
            .map((i) => credited(i, author))
        );
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
    // Credit is assigned on the way out; a stored copy would only go stale.
    const clean = (items as unknown[]).map((i) => (isPlainObject(i) ? withoutCredit(i) : i));
    await ContentBucket.findOneAndUpdate(
      { ownerId: req.user!._id, bucket },
      { $set: { items: clean } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, count: (items as unknown[]).length });
  } catch (err) {
    logger.error('content.put_failed', { bucket, error: String(err) });
    res.status(500).json({ error: 'Could not save content' });
  }
});

/* ── GET /api/content/admin/items ── every PUBLISHED or IN-REVIEW item across
 * ALL authors in the flat, id-keyed buckets (OS modules, standalone modules,
 * networking lessons), each annotated with its owner. Admin-only: the studio
 * surfaces these so an admin can moderate/fix any creator's live content, and
 * review what has been submitted for approval. Drafts never appear.
 * `/admin/modules` is the original path, kept so an older client keeps working. */
router.get(['/admin/items', '/admin/modules'], authenticate, requireRole('admin'), async (_req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({ bucket: { $in: ADMIN_ITEM_BUCKETS } }).lean();

    const ownerIds = [...new Set(docs.map((d) => String(d.ownerId)))];
    const owners = await User.find({ _id: { $in: ownerIds } }).select('displayName').lean();
    const nameById = new Map(owners.map((u) => [String(u._id), u.displayName as string]));

    const items: AnyItem[] = [];
    for (const doc of docs) {
      for (const item of ((doc.items as AnyItem[]) ?? [])) {
        if (!isPlainObject(item) || !isModeratableItem(item)) continue;
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
    logger.error('content.admin_items_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load content' });
  }
});

/* ── PATCH /api/content/admin/item ── replace a single item in its author's
 * bucket, IN PLACE (ownership preserved). Admin-only. The item must already
 * exist in the named owner's bucket — admins edit existing content, they never
 * inject new items into another account. A wrong/forged ownerId simply 404s.
 * `/admin/module` is the original path, kept for older clients. */
router.patch(
  ['/collab/item', '/admin/item', '/admin/module'],
  authenticate,
  requireRole('creator', 'admin'),
  async (req: AuthRequest, res) => {
    const { ownerId, bucket, item } = (req.body ?? {}) as {
      ownerId?: unknown;
      bucket?: unknown;
      item?: unknown;
    };

    if (typeof bucket !== 'string' || !isAdminItemBucket(bucket)) {
      res.status(404).json({ error: 'Unknown content bucket' });
      return;
    }
    if (typeof ownerId !== 'string' || !mongoose.isValidObjectId(ownerId)) {
      res.status(400).json({ error: 'Invalid owner' });
      return;
    }
    if (!isPlainObject(item) || typeof item.id !== 'string' || !item.id) {
      res.status(400).json({ error: 'An item with an id is required' });
      return;
    }
    if (!canWriteBucket(req.user!, bucket)) {
      res.status(403).json({ error: 'You do not have permission to author this content type' });
      return;
    }
    if (!(await canEditOthersBucket(req.user!, ownerId, bucket))) {
      res.status(403).json({ error: 'This content has not been shared with you' });
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
        res.status(404).json({ error: 'Content not found' });
        return;
      }
      const list = doc.items as AnyItem[];
      const idx = list.findIndex((i) => isPlainObject(i) && i.id === item.id);
      if (idx < 0) {
        res.status(404).json({ error: 'Content not found' });
        return;
      }

      list[idx] = withoutCredit(item);
      doc.markModified('items');
      await doc.save();

      logger.info('content.delegated_item_edited', {
        by: String(req.user!._id),
        owner: ownerId,
        bucket,
        itemId: item.id,
      });
      res.json({ ok: true });
    } catch (err) {
      logger.error('content.admin_item_patch_failed', { error: String(err) });
      res.status(500).json({ error: 'Could not save content' });
    }
  }
);

/* ── DELETE /api/content/collab/item ── remove one item from a bucket that is
 * not yours. A collaborator holds the same rights as the owner inside a shared
 * bucket, deletion included, so this is authorised exactly like the edit above
 * and is equally irreversible. */
router.delete(
  '/collab/item',
  authenticate,
  requireRole('creator', 'admin'),
  async (req: AuthRequest, res) => {
    const { ownerId, bucket, itemId } = (req.body ?? {}) as {
      ownerId?: unknown;
      bucket?: unknown;
      itemId?: unknown;
    };

    if (typeof bucket !== 'string' || !isAdminItemBucket(bucket)) {
      res.status(404).json({ error: 'Unknown content bucket' });
      return;
    }
    if (typeof ownerId !== 'string' || !mongoose.isValidObjectId(ownerId)) {
      res.status(400).json({ error: 'Invalid owner' });
      return;
    }
    if (typeof itemId !== 'string' || !itemId) {
      res.status(400).json({ error: 'An itemId is required' });
      return;
    }
    if (!canWriteBucket(req.user!, bucket)) {
      res.status(403).json({ error: 'You do not have permission to author this content type' });
      return;
    }
    if (!(await canEditOthersBucket(req.user!, ownerId, bucket))) {
      res.status(403).json({ error: 'This content has not been shared with you' });
      return;
    }

    try {
      const doc = await ContentBucket.findOne({ ownerId, bucket });
      if (!doc) {
        res.status(404).json({ error: 'Content not found' });
        return;
      }
      const list = doc.items as AnyItem[];
      const idx = list.findIndex((i) => isPlainObject(i) && i.id === itemId);
      if (idx < 0) {
        res.status(404).json({ error: 'Content not found' });
        return;
      }

      list.splice(idx, 1);
      doc.markModified('items');
      await doc.save();

      logger.info('content.delegated_item_deleted', {
        by: String(req.user!._id),
        owner: ownerId,
        bucket,
        itemId,
      });
      res.json({ ok: true });
    } catch (err) {
      logger.error('content.delegated_item_delete_failed', { error: String(err) });
      res.status(500).json({ error: 'Could not delete this content' });
    }
  }
);

/* ── GET /api/content/admin/programming ── every author's PUBLISHED programming
 * content, patch by patch. Programming lives in a nested shape (language →
 * newModules / newConcepts / newLanguage), so it cannot ride the flat item
 * endpoints above. Drafts are stripped out, not merely flagged; published and
 * in-review entries both come through, since in_review IS the moderation queue. */
router.get('/admin/programming', authenticate, requireRole('admin'), async (_req: AuthRequest, res) => {
  try {
    const docs = await ContentBucket.find({ bucket: 'programming-patches' }).lean();

    const ownerIds = [...new Set(docs.map((d) => String(d.ownerId)))];
    const owners = await User.find({ _id: { $in: ownerIds } }).select('displayName').lean();
    const nameById = new Map(owners.map((u) => [String(u._id), u.displayName as string]));

    const items: AnyItem[] = [];
    for (const doc of docs) {
      for (const patch of ((doc.items as AnyItem[]) ?? [])) {
        if (!isPlainObject(patch) || typeof patch.languageSlug !== 'string') continue;

        const newModules = (Array.isArray(patch.newModules) ? patch.newModules : []).filter(
          (m): m is AnyItem => isPlainObject(m) && isModeratableItem(m)
        );
        const newConcepts: Record<string, AnyItem[]> = {};
        if (isPlainObject(patch.newConcepts)) {
          for (const [modSlug, concepts] of Object.entries(patch.newConcepts)) {
            const visible = (Array.isArray(concepts) ? concepts : []).filter(
              (c): c is AnyItem => isPlainObject(c) && isModeratableItem(c)
            );
            if (visible.length) newConcepts[modSlug] = visible;
          }
        }
        const newLanguage =
          isPlainObject(patch.newLanguage) && isModeratableItem(patch.newLanguage)
            ? patch.newLanguage
            : undefined;

        if (!newModules.length && !Object.keys(newConcepts).length && !newLanguage) continue;

        items.push({
          languageSlug: patch.languageSlug,
          newModules,
          newConcepts,
          ...(newLanguage ? { newLanguage } : {}),
          _ownerId: String(doc.ownerId),
          _ownerName: nameById.get(String(doc.ownerId)) ?? 'Unknown',
        });
      }
    }
    res.json({ items });
  } catch (err) {
    logger.error('content.admin_programming_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load programming content' });
  }
});

/* ── PATCH /api/content/admin/programming ── replace one module, concept or
 * language definition inside its author's patch, IN PLACE. Admin-only, and
 * strictly an edit: the target patch and the entry itself must already exist. */
router.patch(
  ['/collab/programming', '/admin/programming'],
  authenticate,
  requireRole('creator', 'admin'),
  async (req: AuthRequest, res) => {
  const { ownerId, languageSlug, kind, moduleSlug, item } = (req.body ?? {}) as {
    ownerId?: unknown;
    languageSlug?: unknown;
    kind?: unknown;
    moduleSlug?: unknown;
    item?: unknown;
  };

  if (typeof ownerId !== 'string' || !mongoose.isValidObjectId(ownerId)) {
    res.status(400).json({ error: 'Invalid owner' });
    return;
  }
  if (typeof languageSlug !== 'string' || !languageSlug || languageSlug.length > 80) {
    res.status(400).json({ error: 'A languageSlug is required' });
    return;
  }
  if (kind !== 'module' && kind !== 'concept' && kind !== 'language') {
    res.status(400).json({ error: 'kind must be module, concept or language' });
    return;
  }
  if (kind === 'concept' && (typeof moduleSlug !== 'string' || !moduleSlug)) {
    res.status(400).json({ error: 'A moduleSlug is required for a concept' });
    return;
  }
  if (!isPlainObject(item)) {
    res.status(400).json({ error: 'An item is required' });
    return;
  }
  if (kind !== 'language' && (typeof item.id !== 'string' || !item.id)) {
    res.status(400).json({ error: 'An item with an id is required' });
    return;
  }
  const safety = checkSafeJson(item);
  if (!safety.ok) {
    res.status(400).json({ error: safety.reason ?? 'Unsafe payload' });
    return;
  }
  if (!canWriteBucket(req.user!, 'programming-patches')) {
    res.status(403).json({ error: 'You do not have permission to author this content type' });
    return;
  }
  if (!(await canEditOthersBucket(req.user!, ownerId, 'programming-patches'))) {
    res.status(403).json({ error: 'This content has not been shared with you' });
    return;
  }

  try {
    const doc = await ContentBucket.findOne({ ownerId, bucket: 'programming-patches' });
    if (!doc) {
      res.status(404).json({ error: 'Programming content not found' });
      return;
    }
    const patches = doc.items as AnyItem[];
    const patch = patches.find((p) => isPlainObject(p) && p.languageSlug === languageSlug);
    if (!patch || !isPlainObject(patch)) {
      res.status(404).json({ error: 'Programming content not found' });
      return;
    }

    if (kind === 'language') {
      if (!isPlainObject(patch.newLanguage)) {
        res.status(404).json({ error: 'Language definition not found' });
        return;
      }
      patch.newLanguage = item;
    } else if (kind === 'module') {
      const list = Array.isArray(patch.newModules) ? (patch.newModules as AnyItem[]) : [];
      const idx = list.findIndex((m) => isPlainObject(m) && m.id === item.id);
      if (idx < 0) {
        res.status(404).json({ error: 'Module not found' });
        return;
      }
      list[idx] = item;
    } else {
      const byModule = isPlainObject(patch.newConcepts)
        ? (patch.newConcepts as Record<string, AnyItem[]>)
        : null;
      const list = byModule?.[moduleSlug as string];
      const idx = Array.isArray(list) ? list.findIndex((c) => isPlainObject(c) && c.id === item.id) : -1;
      if (idx < 0 || !list) {
        res.status(404).json({ error: 'Concept not found' });
        return;
      }
      list[idx] = item;
    }

    doc.markModified('items');
    await doc.save();

    logger.info('content.delegated_programming_edited', {
      by: String(req.user!._id),
      owner: ownerId,
      languageSlug,
      kind,
      itemId: typeof item.id === 'string' ? item.id : languageSlug,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('content.delegated_programming_patch_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save programming content' });
  }
});

/* ── DELETE /api/content/collab/programming ── remove one module, concept or
 * language definition from its author's patch. Same rights and same
 * irreversibility as the owner has. */
router.delete(
  '/collab/programming',
  authenticate,
  requireRole('creator', 'admin'),
  async (req: AuthRequest, res) => {
    const { ownerId, languageSlug, kind, moduleSlug, itemId } = (req.body ?? {}) as {
      ownerId?: unknown;
      languageSlug?: unknown;
      kind?: unknown;
      moduleSlug?: unknown;
      itemId?: unknown;
    };

    if (typeof ownerId !== 'string' || !mongoose.isValidObjectId(ownerId)) {
      res.status(400).json({ error: 'Invalid owner' });
      return;
    }
    if (typeof languageSlug !== 'string' || !languageSlug) {
      res.status(400).json({ error: 'A languageSlug is required' });
      return;
    }
    if (kind !== 'module' && kind !== 'concept' && kind !== 'language') {
      res.status(400).json({ error: 'kind must be module, concept or language' });
      return;
    }
    if (kind !== 'language' && (typeof itemId !== 'string' || !itemId)) {
      res.status(400).json({ error: 'An itemId is required' });
      return;
    }
    if (kind === 'concept' && (typeof moduleSlug !== 'string' || !moduleSlug)) {
      res.status(400).json({ error: 'A moduleSlug is required for a concept' });
      return;
    }
    if (!canWriteBucket(req.user!, 'programming-patches')) {
      res.status(403).json({ error: 'You do not have permission to author this content type' });
      return;
    }
    if (!(await canEditOthersBucket(req.user!, ownerId, 'programming-patches'))) {
      res.status(403).json({ error: 'This content has not been shared with you' });
      return;
    }

    try {
      const doc = await ContentBucket.findOne({ ownerId, bucket: 'programming-patches' });
      if (!doc) {
        res.status(404).json({ error: 'Programming content not found' });
        return;
      }
      const patches = doc.items as AnyItem[];
      const patch = patches.find((p) => isPlainObject(p) && p.languageSlug === languageSlug);
      if (!patch || !isPlainObject(patch)) {
        res.status(404).json({ error: 'Programming content not found' });
        return;
      }

      if (kind === 'language') {
        // Dropping the definition takes the whole patch with it: its modules
        // and lessons have no language left to belong to.
        doc.items = patches.filter((p) => !(isPlainObject(p) && p.languageSlug === languageSlug));
      } else if (kind === 'module') {
        const list = Array.isArray(patch.newModules) ? (patch.newModules as AnyItem[]) : [];
        const idx = list.findIndex((m) => isPlainObject(m) && m.id === itemId);
        if (idx < 0) {
          res.status(404).json({ error: 'Module not found' });
          return;
        }
        const [removed] = list.splice(idx, 1);
        // Its lessons are keyed by the module's slug, so they go too.
        const slug = isPlainObject(removed) ? removed.slug : undefined;
        if (typeof slug === 'string' && isPlainObject(patch.newConcepts)) {
          delete (patch.newConcepts as Record<string, unknown>)[slug];
        }
      } else {
        const byModule = isPlainObject(patch.newConcepts)
          ? (patch.newConcepts as Record<string, AnyItem[]>)
          : null;
        const list = byModule?.[moduleSlug as string];
        const idx = Array.isArray(list) ? list.findIndex((c) => isPlainObject(c) && c.id === itemId) : -1;
        if (idx < 0 || !list) {
          res.status(404).json({ error: 'Concept not found' });
          return;
        }
        list.splice(idx, 1);
      }

      doc.markModified('items');
      await doc.save();

      logger.info('content.delegated_programming_deleted', {
        by: String(req.user!._id),
        owner: ownerId,
        languageSlug,
        kind,
      });
      res.json({ ok: true });
    } catch (err) {
      logger.error('content.delegated_programming_delete_failed', { error: String(err) });
      res.status(500).json({ error: 'Could not delete this content' });
    }
  }
);

export default router;
