import express, { Router, type RequestHandler } from 'express';
import mongoose from 'mongoose';
import ContentBucket from '../models/ContentBucket';
import ContentItemVersion from '../models/ContentItemVersion';
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
import { scheduleXpRestate } from '../utils/xpMigration';
import { forStudents } from '../utils/redact';
import { certificateProblem, examProblem } from '../shared/exam';
import { addedTargets, examGateProblem } from '../utils/examGate';
import { changeItem, itemKeyOf, itemRevisions } from '../utils/contentStore';
import builtinAnswers from '../data/builtinAnswerKey.json';

const router = Router();

/* XP is scored against the published content, so any successful write here
   drops the server's cached catalog (utils/xpCatalog.ts), and schedules the
   restating of every account whose figures it changed (utils/xpMigration.ts). */
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        invalidateXpCatalog();
        scheduleXpRestate();
      }
    });
  }
  next();
});

const MAX_ITEMS_PER_BUCKET = 300;

/* ── How big a save may be ──
 * A bucket is one MongoDB document, which cannot pass 16 MB, and an author who
 * reaches that should hear it while the work can still be saved somewhere. The
 * figure leaves room for what the database adds around the JSON. */
const MAX_ITEM_SIZE = '4mb';
const MAX_BUCKET_BYTES = 14 * 1024 * 1024;

/** An image pasted into lesson text rather than uploaded travels inside every
 *  save of the lesson. The Studio's own inline art stays far under this. */
const MAX_INLINE_IMAGE_BYTES = 256 * 1024;
const INLINE_IMAGE = /data:image\/[^"'\s)]*/gi;

function inlineImageBytes(item: unknown): number {
  let total = 0;
  for (const match of JSON.stringify(item ?? null).matchAll(INLINE_IMAGE)) total += match[0].length;
  return total;
}

function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

const CONFLICT = {
  error: 'This was changed somewhere else after you opened it. Open it again to see the latest version.',
  code: 'VERSION_CONFLICT',
} as const;

/** The JSON body of a save of one item, parsed only once the session has been
 *  checked, with a reason an author can act on when it is too large. */
const itemBody: RequestHandler = (req, res, next) => {
  express.json({ limit: MAX_ITEM_SIZE })(req, res, (err?: unknown) => {
    if ((err as { type?: string } | undefined)?.type === 'entity.too.large') {
      res.status(413).json({
        error: `This is too large to save, over ${MAX_ITEM_SIZE.replace('mb', ' MB')}. Split it into smaller parts, and upload images as files.`,
        code: 'ITEM_TOO_LARGE',
      });
      return;
    }
    next(err as Error | undefined);
  });
};

/** Buckets an admin may moderate across all authors. These all store a flat,
 * id-keyed array, so one list/patch pair serves them. `programming-patches` is
 * nested (language → modules/concepts) and has its own pair further down. */
const ADMIN_ITEM_BUCKETS: ContentBucketKey[] = [
  'os-modules',
  'standalone-modules',
  'networking-lessons',
  'networking-units',
  // Paths too: a path's final exam awards a certificate in CyberKhana's name,
  // and its target addresses are an admin's to set (utils/examGate.ts).
  'paths',
];

/** The languages that ship in the bundle (data/programming/index.ts on the
 *  client) — kept in sync here since only an admin may redefine or hide one
 *  of these through a patch, never a permitted creator. */
const BUILTIN_PROGRAMMING_SLUGS = new Set(['python', 'c', 'cpp', 'bash']);

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

/** A built-in language's own name/color/description and its visibility are an
 *  admin's call, never a permitted creator's: the same permission that lets a
 *  creator add a module to Python does not let them rewrite Python. */
function builtinLanguageProblem(user: { role: string }, bucket: ContentBucketKey, item: AnyItem): string | null {
  if (bucket !== 'programming-patches' || user.role === 'admin') return null;
  const slug = item.languageSlug;
  return typeof slug === 'string' &&
    BUILTIN_PROGRAMMING_SLUGS.has(slug) &&
    (item.newLanguage !== undefined || item.languageHidden !== undefined)
    ? 'Only an admin may redefine or hide a built-in language'
    : null;
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
    /* A path's final exam and certificate. Their shape is always checked; a
       published path's exam also has to be one that can be sat. */
    if (bucket === 'paths') {
      const live = isPublishedItem(item);
      const awards = isPlainObject(item.certificate) && item.certificate.enabled === true;
      const examIssue =
        examProblem(item.exam, { complete: live, certificate: awards }) ??
        certificateProblem(item.certificate, item.exam, live);
      if (examIssue) return examIssue;
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
 * in the flat buckets carries `_author`, its owner's public credit, and none
 * carries an answer (utils/redact.ts). */
router.get('/published', authenticate, async (_req: AuthRequest, res) => {
  try {
    /* In creation order, as the XP catalog reads them (utils/xpCatalog.ts), so
       where two creators' items collide both sides pick the same one. */
    const docs = await ContentBucket.find({}).sort({ _id: 1 }).lean();
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
        languageHidden?: boolean;
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
          // Creator-defined language: published ones reach every student. An
          // admin's override of a BUILT-IN one is different: it reuses the
          // built-in's own slug rather than defining a new one, and applies
          // as soon as it is saved, with no draft stage of its own — the
          // same reasoning as the cover art just below.
          const isBuiltinSlug = BUILTIN_PROGRAMMING_SLUGS.has(patch.languageSlug);
          const publishedLanguage =
            isPlainObject(patch.newLanguage) && (isBuiltinSlug || isPublishedItem(patch.newLanguage))
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
          // Admin-only, and travels the same unconditional way: a patch whose
          // only content is "hide Python" still has to reach every student.
          const hiddenFlag = isBuiltinSlug && typeof patch.languageHidden === 'boolean'
            ? patch.languageHidden
            : undefined;

          if (
            !publishedModules.length &&
            !Object.keys(publishedConcepts).length &&
            !publishedLanguage &&
            !coverTravels &&
            hiddenFlag === undefined
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
          if (merged.languageHidden === undefined && hiddenFlag !== undefined) {
            merged.languageHidden = hiddenFlag;
          }
          patchByLang.set(patch.languageSlug, merged);
        }
      } else {
        // Quiz answers and lab flags stay here: the server marks them itself.
        result[doc.bucket].push(
          ...items
            .filter((i) => isPlainObject(i) && isPublishedItem(i))
            .map((i) => forStudents(doc.bucket, credited(i, author)))
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
    const revisions: Partial<Record<ContentBucketKey, ReturnType<typeof itemRevisions>>> = {};
    for (const doc of docs) {
      buckets[doc.bucket] = doc.items ?? [];
      revisions[doc.bucket] = itemRevisions(doc);
    }
    res.json({ buckets, revisions });
  } catch (err) {
    logger.error('content.mine_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load your content' });
  }
});

/* ── PUT /api/content/:bucket ── what saving used to be: a whole bucket, replaced
 * by whatever one browser held. A tab still running that code is told to reload
 * rather than being allowed to write, because the copy it holds may be out of
 * date. Its unsaved work stays on its device, and the reload offers it back. */
router.put('/:bucket', authenticate, requireRole('creator', 'admin'), (req: AuthRequest, res) => {
  if (!isBucketKey(req.params.bucket)) {
    res.status(404).json({ error: 'Unknown bucket' });
    return;
  }
  res.status(409).json({ error: 'The Academy was updated. Reload this page to keep saving.', code: 'RELOAD_REQUIRED' });
});

/* ── PUT /api/content/:bucket/item ── save one of MY items. Ownership comes from
 * the session; a creator can never write another creator's documents.
 * `baseRevision` is the revision this copy was made from, 0 for a new item: if
 * the item has moved on since, the save is refused rather than undoing whatever
 * moved it, and the author decides. */
router.put('/:bucket/item', authenticate, requireRole('creator', 'admin'), itemBody, async (req: AuthRequest, res) => {
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

  const { item, baseRevision, account, overwriting } = (req.body ?? {}) as {
    item?: unknown;
    baseRevision?: unknown;
    account?: unknown;
    overwriting?: unknown;
  };

  /* The session decides whose bucket this is, so a tab left open across a change
     of account would otherwise save the last person's work into the next one's. */
  if (account !== undefined && account !== String(req.user!._id)) {
    res.status(409).json({ error: 'You are signed in as someone else now. Reload this page.', code: 'ACCOUNT_CHANGED' });
    return;
  }
  if (!isRevision(baseRevision)) {
    res.status(400).json({ error: 'A baseRevision is required' });
    return;
  }

  const problem = validateBucketItems(bucket, [item]);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }
  const incoming = item as AnyItem;

  const language = builtinLanguageProblem(req.user!, bucket, incoming);
  if (language) {
    res.status(403).json({ error: language });
    return;
  }

  // Credit is assigned on the way out; a stored copy would only go stale.
  const clean = withoutCredit(incoming);
  const key = itemKeyOf(bucket, clean) as string;

  try {
    const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
      { ownerId: req.user!._id as mongoose.Types.ObjectId, bucket, key, savedBy: req.user!._id as mongoose.Types.ObjectId },
      ({ item: before, revision, items }) => {
        /* Already saved: the answer to an earlier try never arrived. */
        if (before && JSON.stringify(before) === JSON.stringify(clean)) return { item: clean };
        if (revision !== baseRevision) {
          return { refuse: { status: 409, body: { ...CONFLICT, revision } } };
        }
        if (!before && items.length >= MAX_ITEMS_PER_BUCKET) {
          return { refuse: { status: 400, body: { error: `Too many items (max ${MAX_ITEMS_PER_BUCKET})` } } };
        }

        /* An image already in the item does not block the fix of a typo: this
           only refuses a save that adds more of them. */
        const pasted = inlineImageBytes(clean);
        if (pasted > MAX_INLINE_IMAGE_BYTES && pasted > inlineImageBytes(before)) {
          return {
            refuse: {
              status: 413,
              body: {
                error: `This has ${Math.round(pasted / 1024)} KB of images pasted into its text. Upload them as files instead, then save again.`,
                code: 'INLINE_IMAGES_TOO_LARGE',
              },
            },
          };
        }

        const others = items.filter((i) => itemKeyOf(bucket, i) !== key);
        if (Buffer.byteLength(JSON.stringify([...others, clean])) > MAX_BUCKET_BYTES) {
          return {
            refuse: {
              status: 413,
              body: {
                error: 'This section of your Studio is full. Move or delete something in it, then save again.',
                code: 'BUCKET_FULL',
              },
            },
          };
        }

        /* A path's exam is a separate permission, and its targets an admin's: each
           path is held against the copy already stored (utils/examGate.ts). */
        if (bucket === 'paths') {
          const gate = examGateProblem(req.user!, before, clean);
          if (gate) return { refuse: { status: 403, body: { error: gate, code: 'EXAM_PERMISSION' } } };
          const targets = addedTargets(before, clean);
          if (targets.length) {
            logger.info('exam.targets_set', { by: String(req.user!._id), pathId: String(clean.id), targets });
          }
        }

        return { item: clean, keepVersion: overwriting === true };
      }
    );

    if ('refused' in outcome) {
      res.status(outcome.refused.status).json(outcome.refused.body);
      return;
    }
    res.json({ ok: true, revision: outcome.revision, sequence: outcome.sequence });
  } catch (err) {
    logger.error('content.item_save_failed', { bucket, error: String(err) });
    res.status(500).json({ error: 'Could not save content' });
  }
});

/* ── GET /api/content/history/:bucket/:key ── the earlier versions of one of MY
 * items, newest first, without their content. */
router.get('/history/:bucket/:key', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const { bucket, key } = req.params;
  if (!isBucketKey(bucket)) {
    res.status(404).json({ error: 'Unknown bucket' });
    return;
  }
  try {
    const versions = await ContentItemVersion.find({ ownerId: req.user!._id, bucket, itemKey: key })
      .sort({ createdAt: -1 })
      .select('createdAt replacedBy')
      .lean();
    res.json({
      versions: versions.map((v) => ({ id: String(v._id), createdAt: v.createdAt, replacedBy: String(v.replacedBy) })),
    });
  } catch (err) {
    logger.error('content.history_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load earlier versions' });
  }
});

/* ── GET /api/content/history/:bucket/:key/:versionId ── one earlier version in
 * full. It holds answers and drafts, so it only ever goes back to its owner.
 * Bringing it back is an ordinary save of what this returns. */
router.get(
  '/history/:bucket/:key/:versionId',
  authenticate,
  requireRole('creator', 'admin'),
  async (req: AuthRequest, res) => {
    const { bucket, key, versionId } = req.params;
    if (!isBucketKey(bucket) || !mongoose.isValidObjectId(versionId)) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    try {
      const version = await ContentItemVersion.findOne({
        _id: versionId,
        ownerId: req.user!._id,
        bucket,
        itemKey: key,
      }).lean();
      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }
      res.json({ id: String(version._id), createdAt: version.createdAt, item: version.data });
    } catch (err) {
      logger.error('content.history_failed', { error: String(err) });
      res.status(500).json({ error: 'Could not load this version' });
    }
  }
);

/** A bucket's revisions for someone other than its owner to save against. */
function ownedRevisions(doc: Parameters<typeof itemRevisions>[0] & { ownerId: unknown }) {
  return itemRevisions(doc).map((r) => ({ ownerId: String(doc.ownerId), bucket: doc.bucket, ...r }));
}

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
    const revisions = docs.flatMap(ownedRevisions);
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
    res.json({ items, revisions });
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
    const { ownerId, bucket, item, baseRevision } = (req.body ?? {}) as {
      ownerId?: unknown;
      bucket?: unknown;
      item?: unknown;
      baseRevision?: unknown;
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
      const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
        { ownerId, bucket, key: item.id, savedBy: req.user!._id as mongoose.Types.ObjectId },
        ({ item: before, revision }) => {
          if (!before) return { refuse: { status: 404, body: { error: 'Content not found' } } };
          if (isRevision(baseRevision) && baseRevision !== revision) {
            return { refuse: { status: 409, body: { ...CONFLICT, revision } } };
          }
          if (bucket === 'paths') {
            const gate = examGateProblem(req.user!, before, item);
            if (gate) return { refuse: { status: 403, body: { error: gate, code: 'EXAM_PERMISSION' } } };
            const targets = addedTargets(before, item);
            if (targets.length) {
              logger.info('exam.targets_set', { by: String(req.user!._id), owner: ownerId, pathId: item.id, targets });
            }
          }
          return { item: withoutCredit(item) };
        }
      );
      if ('refused' in outcome) {
        res.status(outcome.refused.status).json(outcome.refused.body);
        return;
      }

      logger.info('content.delegated_item_edited', {
        by: String(req.user!._id),
        owner: ownerId,
        bucket,
        itemId: item.id,
      });
      res.json({ ok: true, revision: outcome.revision });
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
    const { ownerId, bucket, itemId, baseRevision } = (req.body ?? {}) as {
      ownerId?: unknown;
      bucket?: unknown;
      itemId?: unknown;
      baseRevision?: unknown;
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
      const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
        { ownerId, bucket, key: itemId, savedBy: req.user!._id as mongoose.Types.ObjectId },
        ({ item: before, revision }) => {
          if (!before) return { refuse: { status: 404, body: { error: 'Content not found' } } };
          if (isRevision(baseRevision) && baseRevision !== revision) {
            return { refuse: { status: 409, body: { ...CONFLICT, revision } } };
          }
          return { item: null };
        }
      );
      if ('refused' in outcome) {
        res.status(outcome.refused.status).json(outcome.refused.body);
        return;
      }

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

/* ── GET /api/content/admin/builtin-answers ── the built-in courses' quiz
 * answers. They never ship in the bundle (data/linuxQuizAnswers.ts), so an
 * admin turning a built-in module into an editable copy fetches them here,
 * and the copy keeps every question's answer. */
router.get('/admin/builtin-answers', authenticate, requireRole('admin'), (_req: AuthRequest, res) => {
  res.json({ quizzes: builtinAnswers.quizzes });
});

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
    const revisions = docs.flatMap(ownedRevisions);
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
    res.json({ items, revisions });
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
  const { ownerId, languageSlug, kind, moduleSlug, item, baseRevision } = (req.body ?? {}) as {
    ownerId?: unknown;
    languageSlug?: unknown;
    kind?: unknown;
    moduleSlug?: unknown;
    item?: unknown;
    baseRevision?: unknown;
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
    const refuse = (status: number, error: string) => ({ refuse: { status, body: { error } } });
    const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
      { ownerId, bucket: 'programming-patches', key: languageSlug, savedBy: req.user!._id as mongoose.Types.ObjectId },
      ({ item: before, revision }) => {
        if (!before) return refuse(404, 'Programming content not found');
        if (isRevision(baseRevision) && baseRevision !== revision) {
          return { refuse: { status: 409, body: { ...CONFLICT, revision } } };
        }
        // A copy: what was read is also what goes into the item's history.
        const patch = structuredClone(before);

        if (kind === 'language') {
          if (!isPlainObject(patch.newLanguage)) return refuse(404, 'Language definition not found');
          patch.newLanguage = item;
        } else if (kind === 'module') {
          const list = Array.isArray(patch.newModules) ? (patch.newModules as AnyItem[]) : [];
          const idx = list.findIndex((m) => isPlainObject(m) && m.id === item.id);
          if (idx < 0) return refuse(404, 'Module not found');
          list[idx] = item;
        } else {
          const byModule = isPlainObject(patch.newConcepts)
            ? (patch.newConcepts as Record<string, AnyItem[]>)
            : null;
          const list = byModule?.[moduleSlug as string];
          const idx = Array.isArray(list) ? list.findIndex((c) => isPlainObject(c) && c.id === item.id) : -1;
          if (idx < 0 || !list) return refuse(404, 'Concept not found');
          list[idx] = item;
        }
        return { item: patch };
      }
    );
    if ('refused' in outcome) {
      res.status(outcome.refused.status).json(outcome.refused.body);
      return;
    }

    logger.info('content.delegated_programming_edited', {
      by: String(req.user!._id),
      owner: ownerId,
      languageSlug,
      kind,
      itemId: typeof item.id === 'string' ? item.id : languageSlug,
    });
    res.json({ ok: true, revision: outcome.revision });
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
    const { ownerId, languageSlug, kind, moduleSlug, itemId, baseRevision } = (req.body ?? {}) as {
      ownerId?: unknown;
      languageSlug?: unknown;
      kind?: unknown;
      moduleSlug?: unknown;
      itemId?: unknown;
      baseRevision?: unknown;
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
      const refuse = (status: number, error: string) => ({ refuse: { status, body: { error } } });
      const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
        { ownerId, bucket: 'programming-patches', key: languageSlug, savedBy: req.user!._id as mongoose.Types.ObjectId },
        ({ item: before, revision }) => {
          if (!before) return refuse(404, 'Programming content not found');
          if (isRevision(baseRevision) && baseRevision !== revision) {
            return { refuse: { status: 409, body: { ...CONFLICT, revision } } };
          }
          // Dropping the definition takes the whole patch with it: its modules
          // and lessons have no language left to belong to.
          if (kind === 'language') return { item: null };

          // A copy: what was read is also what goes into the item's history.
          const patch = structuredClone(before);
          if (kind === 'module') {
            const list = Array.isArray(patch.newModules) ? (patch.newModules as AnyItem[]) : [];
            const idx = list.findIndex((m) => isPlainObject(m) && m.id === itemId);
            if (idx < 0) return refuse(404, 'Module not found');
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
            if (idx < 0 || !list) return refuse(404, 'Concept not found');
            list.splice(idx, 1);
          }
          return { item: patch };
        }
      );
      if ('refused' in outcome) {
        res.status(outcome.refused.status).json(outcome.refused.body);
        return;
      }

      logger.info('content.delegated_programming_deleted', {
        by: String(req.user!._id),
        owner: ownerId,
        languageSlug,
        kind,
      });
      res.json({ ok: true, revision: outcome.revision });
    } catch (err) {
      logger.error('content.delegated_programming_delete_failed', { error: String(err) });
      res.status(500).json({ error: 'Could not delete this content' });
    }
  }
);

/* ── DELETE /api/content/:bucket/item ── delete one of MY items. Held to the same
 * check as saving: a copy that is out of date cannot delete what it has not seen. */
router.delete('/:bucket/item', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const bucket = req.params.bucket;
  if (!isBucketKey(bucket)) {
    res.status(404).json({ error: 'Unknown bucket' });
    return;
  }
  if (!canWriteBucket(req.user!, bucket)) {
    res.status(403).json({ error: 'You do not have permission to author this content type' });
    return;
  }

  const { key, baseRevision, account } = (req.body ?? {}) as {
    key?: unknown;
    baseRevision?: unknown;
    account?: unknown;
  };
  if (account !== undefined && account !== String(req.user!._id)) {
    res.status(409).json({ error: 'You are signed in as someone else now. Reload this page.', code: 'ACCOUNT_CHANGED' });
    return;
  }
  if (typeof key !== 'string' || !key || !isRevision(baseRevision)) {
    res.status(400).json({ error: 'A key and a baseRevision are required' });
    return;
  }

  try {
    const outcome = await changeItem<{ status: number; body: Record<string, unknown> }>(
      { ownerId: req.user!._id as mongoose.Types.ObjectId, bucket, key, savedBy: req.user!._id as mongoose.Types.ObjectId },
      ({ item: before, revision }) =>
        // Already gone: the answer to an earlier try never arrived.
        before && revision !== baseRevision
          ? { refuse: { status: 409, body: { ...CONFLICT, revision } } }
          : { item: null }
    );
    if ('refused' in outcome) {
      res.status(outcome.refused.status).json(outcome.refused.body);
      return;
    }
    res.json({ ok: true, revision: 0, sequence: outcome.sequence });
  } catch (err) {
    logger.error('content.item_delete_failed', { bucket, error: String(err) });
    res.status(500).json({ error: 'Could not delete content' });
  }
});

export default router;
