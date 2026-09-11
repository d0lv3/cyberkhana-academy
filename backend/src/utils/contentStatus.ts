/* ── What counts as published ──
 *
 * One definition, shared by the student feed (routes/content.ts) and account
 * deletion (utils/accountDeletion.ts), which keeps exactly the part of a
 * deleted creator's work that the feed was serving. */

export type AnyItem = Record<string, unknown>;

export function isPlainObject(v: unknown): v is AnyItem {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Lifecycle check mirroring the frontend's statusOf(): status wins, isPublished is legacy. */
export function isPublishedItem(item: AnyItem): boolean {
  if (typeof item.status === 'string') return item.status === 'published';
  return item.isPublished === true;
}
