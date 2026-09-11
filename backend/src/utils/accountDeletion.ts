import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import Progress from '../models/Progress';
import Feedback from '../models/Feedback';
import ContentBucket from '../models/ContentBucket';
import ContentGrant from '../models/ContentGrant';
import { UPLOADS_DIR } from '../routes/uploads';
import type { ContentBucketKey } from '../types';
import { isPlainObject, isPublishedItem, type AnyItem } from './contentStatus';
import { logger } from './logger';

/* ── Account deletion ──
 *
 * Two ways an account ends, and one way it is taken apart.
 *
 * A member can ask for their own account to be deleted. Nothing is deleted
 * then: every session is refused from that moment (middleware/auth.ts), other
 * members stop seeing the account, and a deadline is set DELETION_GRACE_DAYS
 * out. Signing in before the deadline withdraws the request. Otherwise the
 * sweep below deletes the account once the deadline has passed.
 *
 * An admin can delete an account straight away (routes/admin.ts).
 *
 * Both end in purgeAccount, so what goes and what stays is the same either
 * way, and is what section 9 of the Privacy Policy promises: the account, its
 * progress and its unpublished work go; published content stays under the
 * Creator Agreement's licence; feedback stays without a name.
 */

/** How long a request waits. The Terms and the Privacy Policy both state this
 *  number, in both languages, so change them with it. */
export const DELETION_GRACE_DAYS = 7;
const DELETION_GRACE_MS = DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

/** How often the sweep looks for requests that have come due. */
const SWEEP_EVERY_MS = 15 * 60 * 1000;

/** What a deleted member's feedback is signed with. The studio shows its own
 *  translated label for these rows (they carry `anonymisedAt`); this is what
 *  any other reader sees. */
const FORMER_MEMBER = 'Former member';

export type DeletionCause = 'request' | 'admin';

/** Record a member's request. Mutates only; the caller saves. */
export function scheduleDeletion(user: IUser, now = new Date()): void {
  user.deletionRequestedAt = now;
  user.deletionScheduledFor = new Date(now.getTime() + DELETION_GRACE_MS);
}

/**
 * What signing in does to a pending request.
 *
 * Before the deadline, it withdraws it. The update only matches while the
 * deadline is still ahead, so a sign-in and the sweep cannot both win: once
 * the deadline passes, the sweep's query stops matching a withdrawn account
 * and this one stops matching a due one.
 *
 * After the deadline it is too late to withdraw. The account is deleted here,
 * exactly as the sweep would have deleted it, and the caller carries on as
 * for someone signing in for the first time. The deadline is the same whether
 * or not the sweep has reached this account yet.
 */
export async function settleDeletionAtSignIn(
  user: IUser
): Promise<'none' | 'cancelled' | 'deleted'> {
  const due = user.deletionScheduledFor;
  if (!due) return 'none';

  const now = new Date();
  const { matchedCount } = await User.updateOne(
    { _id: user._id, deletionScheduledFor: { $gt: now } },
    { $unset: { deletionRequestedAt: 1, deletionScheduledFor: 1 } }
  );
  if (matchedCount === 0 && due <= now) {
    await purgeAccount(user, 'request');
    return 'deleted';
  }
  // Withdrawn, here or by another sign-in a moment ago. Keep this copy in step
  // so the caller's save does not write the request back.
  user.set('deletionRequestedAt', undefined);
  user.set('deletionScheduledFor', undefined);
  return 'cancelled';
}

/**
 * Take an account apart.
 *
 * Every step can be run twice without harm, and the account itself goes last:
 * if anything fails part way, the account is still there with its deadline
 * passed, so the next sweep (or the admin trying again) finishes the job,
 * rather than leaving pieces behind that nothing points to any more.
 */
export async function purgeAccount(user: IUser, cause: DeletionCause, by?: string): Promise<void> {
  const userId = user._id as Types.ObjectId;

  // Learning record.
  const progress = await Progress.deleteMany({ userId });

  /* Feedback stays with the creators it was written for, but as nobody's. The
     name comes off, and each answer gets a fresh id of its own, so they cannot
     be traced to the account or put back together as one person's answers. */
  const answers = await Feedback.find({ userId }).select('_id').lean();
  if (answers.length) {
    const anonymisedAt = new Date();
    await Feedback.bulkWrite(
      answers.map((a) => ({
        updateOne: {
          filter: { _id: a._id },
          update: { $set: { userId: new Types.ObjectId(), userName: FORMER_MEMBER, anonymisedAt } },
        },
      }))
    );
  }

  // Sharing, both ways: what they shared with others, and what others shared with them.
  const grants = await ContentGrant.deleteMany({ $or: [{ ownerId: userId }, { granteeId: userId }] });

  const content = await keepOnlyPublished(user);

  await User.deleteOne({ _id: userId });

  logger.warn('account.deleted', {
    userId: String(userId),
    cause,
    ...(by ? { by } : {}),
    progressRemoved: progress.deletedCount,
    feedbackAnonymised: answers.length,
    grantsRemoved: grants.deletedCount,
    ...content,
  });
}

/* ── Creator content ──
 *
 * Published work stays: the Creator Agreement licenses it to CyberKhana for
 * good, and other creators' paths and students' progress are built on it.
 * With the account gone it is credited to the name saved on each item.
 * Everything else in the buckets was never anyone's but theirs (drafts, and
 * work waiting for review), so it goes, and with it any uploaded file that
 * nothing else uses. */

/** The part of one bucket that students can see: what the /published feed
 *  serves from it, before credit is added. */
function publishedPart(bucket: ContentBucketKey, items: unknown[]): unknown[] {
  if (bucket !== 'programming-patches') {
    return items.filter((item) => isPlainObject(item) && isPublishedItem(item));
  }

  const kept: AnyItem[] = [];
  for (const patch of items) {
    if (!isPlainObject(patch) || typeof patch.languageSlug !== 'string') continue;
    const newModules = (Array.isArray(patch.newModules) ? patch.newModules : []).filter(
      (m) => isPlainObject(m) && isPublishedItem(m)
    );
    const newConcepts: Record<string, unknown[]> = {};
    if (isPlainObject(patch.newConcepts)) {
      for (const [moduleSlug, concepts] of Object.entries(patch.newConcepts)) {
        const published = (Array.isArray(concepts) ? concepts : []).filter(
          (c) => isPlainObject(c) && isPublishedItem(c)
        );
        if (published.length) newConcepts[moduleSlug] = published;
      }
    }
    const language =
      isPlainObject(patch.newLanguage) && isPublishedItem(patch.newLanguage) ? patch.newLanguage : undefined;
    if (!newModules.length && !Object.keys(newConcepts).length && !language) continue;

    const { newLanguage: _unpublished, ...rest } = patch;
    kept.push({ ...rest, newModules, newConcepts, ...(language ? { newLanguage: language } : {}) });
  }
  return kept;
}

async function keepOnlyPublished(user: IUser) {
  const docs = await ContentBucket.find({ ownerId: user._id }).lean();
  let bucketsTrimmed = 0;
  let bucketsRemoved = 0;

  for (const doc of docs) {
    const items = Array.isArray(doc.items) ? doc.items : [];
    const kept = publishedPart(doc.bucket, items);
    // By id rather than through a loaded document: a second purge of the same
    // account running alongside this one then finds nothing to trip over.
    if (kept.length === 0) {
      await ContentBucket.deleteOne({ _id: doc._id });
      bucketsRemoved++;
    } else if (JSON.stringify(kept) !== JSON.stringify(items)) {
      await ContentBucket.updateOne({ _id: doc._id }, { $set: { items: kept } });
      bucketsTrimmed++;
    }
  }

  const filesRemoved = await removeUnusedUploads(
    uploadRefs([docs.map((d) => d.items), user.avatarUrl]),
    user._id as Types.ObjectId
  );
  return { bucketsTrimmed, bucketsRemoved, filesRemoved };
}

/** Uploaded files a value points at, as paths under UPLOADS_DIR. Stored names
 *  are 32 random hex characters and an extension (routes/uploads.ts), so this
 *  cannot match anything else, and nothing it matches can leave the folder. */
const UPLOAD_PATH = /\/uploads\/((?:lab-resources\/)?[a-f0-9]{32}\.[a-z0-9]{1,8})\b/g;

function uploadRefs(value: unknown): Set<string> {
  const found = new Set<string>();
  for (const match of JSON.stringify(value ?? null).matchAll(UPLOAD_PATH)) found.add(match[1]);
  return found;
}

/** Delete the files among `candidates` that no content and no other member's
 *  picture still uses. Run after the buckets are trimmed, so published work
 *  that stays keeps its files. A file that will not go is left and logged. */
async function removeUnusedUploads(candidates: Set<string>, owner: Types.ObjectId): Promise<number> {
  if (candidates.size === 0) return 0;

  const [buckets, pictures] = await Promise.all([
    ContentBucket.find({}).select('items').lean(),
    User.find({ _id: { $ne: owner }, avatarUrl: /\/uploads\// }).select('avatarUrl').lean(),
  ]);
  const inUse = uploadRefs([buckets.map((b) => b.items), pictures.map((p) => p.avatarUrl)]);

  let removed = 0;
  for (const file of candidates) {
    if (inUse.has(file)) continue;
    try {
      await fs.promises.unlink(path.join(UPLOADS_DIR, file));
      removed++;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('account.upload_remove_failed', { file, error: String(err) });
      }
    }
  }
  return removed;
}

/* ── The sweep ── */

let sweeping = false;

/** Delete every account whose deadline has passed. Returns how many went. */
export async function sweepDueDeletions(now = new Date()): Promise<number> {
  if (sweeping) return 0;
  sweeping = true;
  try {
    // A bounded batch; anything beyond it is picked up on the next pass.
    const due = await User.find({ deletionScheduledFor: { $lte: now } }).limit(50);
    let deleted = 0;
    for (const user of due) {
      try {
        await purgeAccount(user, 'request');
        deleted++;
      } catch (err) {
        logger.error('account.purge_failed', { userId: String(user._id), error: String(err) });
      }
    }
    return deleted;
  } finally {
    sweeping = false;
  }
}

/** Run the sweep now, to catch up on anything that came due while the server
 *  was down, and then every SWEEP_EVERY_MS. */
export function startDeletionSweep(): void {
  const run = () => {
    sweepDueDeletions().catch((err) => logger.error('account.sweep_failed', { error: String(err) }));
  };
  run();
  setInterval(run, SWEEP_EVERY_MS).unref();
}
