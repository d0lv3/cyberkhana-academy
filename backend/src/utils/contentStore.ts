import type { Types } from 'mongoose';
import ContentBucket from '../models/ContentBucket';
import ContentItemVersion from '../models/ContentItemVersion';
import type { ContentBucketKey } from '../types';
import { isPlainObject, type AnyItem } from './contentStatus';
import { logger } from './logger';

/* ── Writing one item of a bucket ──
 *
 * Every write to a ContentBucket's items comes through changeItem. It does three
 * things no route should have to remember:
 *
 *  - It gives the item a new revision, which is how a save based on an older
 *    copy is told apart from one based on the latest (routes/content.ts).
 *  - It keeps the version being replaced (see "Earlier versions").
 *  - It writes only if nothing else has written the bucket since it was read,
 *    and otherwise reads it again. A bucket is one document holding many items,
 *    so two saves of different items would otherwise undo each other.
 */

/* Each round of a race has one winner, so this many attempts sees off that many
   saves landing on one bucket at once, which is far more than a few people and
   tabs can produce. The pause keeps the losers from all coming back together. */
const MAX_ATTEMPTS = 16;
const pauseAfter = (attempt: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * 40 * (attempt + 1)));

/** The revision of an item saved before revisions existed. Every later write
 *  numbers from above it. */
const FIRST_REVISION = 1;

/** The field that names an item within its bucket. */
export function itemKeyOf(bucket: ContentBucketKey, item: unknown): string | null {
  if (!isPlainObject(item)) return null;
  const key = bucket === 'programming-patches' ? item.languageSlug : item.id;
  return typeof key === 'string' && key ? key : null;
}

interface RevisionEntry {
  key: string;
  rev: number;
}

/** Each item of a bucket document with its revision, for handing to a client
 *  that may save it later. */
export function itemRevisions(doc: {
  bucket: ContentBucketKey;
  items?: unknown[];
  itemRevisions?: RevisionEntry[];
}): { key: string; revision: number }[] {
  const stored = new Map((doc.itemRevisions ?? []).map((e) => [e.key, e.rev]));
  const out: { key: string; revision: number }[] = [];
  for (const item of doc.items ?? []) {
    const key = itemKeyOf(doc.bucket, item);
    if (key) out.push({ key, revision: stored.get(key) ?? FIRST_REVISION });
  }
  return out;
}

export interface CurrentItem {
  /** The item as stored, or undefined when the bucket has no such item. */
  item: AnyItem | undefined;
  /** Its revision, 0 when there is no such item. */
  revision: number;
  /** Every item in the bucket, for checks across them. Not to be changed. */
  items: readonly unknown[];
}

/** What to do about the item: refuse with an answer for the caller, or write
 *  it (null deletes it). `keepVersion` keeps the replaced copy even if one was
 *  kept moments ago, for a save known to be replacing someone else's work. */
export type ItemPlan<R> = { refuse: R } | { item: AnyItem | null; keepVersion?: boolean };

export type ItemOutcome<R> =
  | { refused: R }
  /** `revision` is the item's own, and `sequence` the bucket's, which only ever
   *  goes up: it says which of two answers about one item is the later. */
  | { revision: number; sequence: number; changed: boolean };

/**
 * Change one item of `ownerId`'s bucket. `plan` is called with the item as it
 * stands, and is called again if another write gets in first, so it must only
 * decide: it must not change what it is given or do anything else.
 */
export async function changeItem<R>(
  where: {
    ownerId: Types.ObjectId | string;
    bucket: ContentBucketKey;
    key: string;
    savedBy: Types.ObjectId | string;
  },
  plan: (current: CurrentItem) => ItemPlan<R>
): Promise<ItemOutcome<R>> {
  const { ownerId, bucket, key, savedBy } = where;
  let kept: string | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await pauseAfter(attempt);
    const doc = await ContentBucket.findOne({ ownerId, bucket }).lean();
    const items = (doc?.items as AnyItem[] | undefined) ?? [];
    const index = items.findIndex((i) => itemKeyOf(bucket, i) === key);
    const before = index >= 0 ? items[index] : undefined;
    const entries = (doc?.itemRevisions as RevisionEntry[] | undefined) ?? [];
    const revision = before ? entries.find((e) => e.key === key)?.rev ?? FIRST_REVISION : 0;
    const sequence = doc?.revision ?? FIRST_REVISION;

    const decision = plan({ item: before, revision, items });
    if ('refuse' in decision) return { refused: decision.refuse };

    const next = decision.item;
    // Saving what is already there is not a change. A save whose answer never
    // arrived comes back this way, and must not look like a conflict with itself.
    if (next ? before && JSON.stringify(before) === JSON.stringify(next) : !before) {
      return { revision, sequence, changed: false };
    }

    // Once for each state of the item, however many tries the write itself takes.
    const beforeJson = before ? JSON.stringify(before) : null;
    if (before && beforeJson !== kept) {
      await keepVersion({ ownerId, bucket, key, savedBy }, before, next, decision.keepVersion === true);
      kept = beforeJson;
    }

    const nextSequence = sequence + 1;
    const nextEntries = [
      ...entries.filter((e) => e.key !== key),
      ...(next ? [{ key, rev: nextSequence }] : []),
    ];

    if (!doc) {
      if (!next) return { revision: 0, sequence, changed: false };
      try {
        await ContentBucket.create({ ownerId, bucket, items: [next], revision: nextSequence, itemRevisions: nextEntries });
        return { revision: nextSequence, sequence: nextSequence, changed: true };
      } catch (err) {
        if ((err as { code?: number }).code === 11000) continue;
        throw err;
      }
    }

    const update =
      next === null
        ? { $set: { items: items.filter((_, i) => i !== index), revision: nextSequence, itemRevisions: nextEntries } }
        : index >= 0
          ? { $set: { [`items.${index}`]: next, revision: nextSequence, itemRevisions: nextEntries } }
          : { $push: { items: next }, $set: { revision: nextSequence, itemRevisions: nextEntries } };

    // Matches a missing field too, for a bucket no save has numbered yet.
    const { matchedCount } = await ContentBucket.updateOne({ _id: doc._id, revision: doc.revision ?? null }, update);
    if (matchedCount === 1) {
      return { revision: next ? nextSequence : 0, sequence: nextSequence, changed: true };
    }
  }

  throw new Error(`content bucket stayed busy: ${bucket}`);
}

/* ── Earlier versions ──
 *
 * The version a save replaces is kept, at most one every ten minutes while an
 * item is being worked on, so what survives is the state before each stretch of
 * editing rather than every autosave along the way. Deleting an item, cutting it
 * to less than half its size, or replacing someone else's work keeps a copy
 * whatever the clock says: those are the saves someone is most likely to want
 * undone. Only the newest 20 of an item stay, and the database drops anything
 * older than VERSION_RETENTION_DAYS by itself.
 */

const VERSION_INTERVAL_MS = 10 * 60 * 1000;
const MAX_VERSIONS_PER_ITEM = 20;

async function keepVersion(
  where: { ownerId: Types.ObjectId | string; bucket: ContentBucketKey; key: string; savedBy: Types.ObjectId | string },
  before: AnyItem,
  next: AnyItem | null,
  always: boolean
): Promise<void> {
  const { ownerId, bucket, key, savedBy } = where;
  const identity = { ownerId, bucket, itemKey: key };
  /* A save is what someone asked for, and history is a safety net behind it.
     Losing one copy is logged; it does not stop the save. */
  try {
    const shrank = next !== null && JSON.stringify(next).length < JSON.stringify(before).length / 2;
    if (next !== null && !always && !shrank) {
      const latest = await ContentItemVersion.findOne(identity).sort({ createdAt: -1 }).select('createdAt').lean();
      if (latest && Date.now() - new Date(latest.createdAt).getTime() < VERSION_INTERVAL_MS) return;
    }
    await ContentItemVersion.create({ ...identity, data: before, replacedBy: savedBy });
    const surplus = await ContentItemVersion.find(identity)
      .sort({ createdAt: -1 })
      .skip(MAX_VERSIONS_PER_ITEM)
      .select('_id')
      .lean();
    if (surplus.length) await ContentItemVersion.deleteMany({ _id: { $in: surplus.map((v) => v._id) } });
  } catch (err) {
    logger.error('content.version_failed', { bucket, key, error: String(err) });
  }
}
