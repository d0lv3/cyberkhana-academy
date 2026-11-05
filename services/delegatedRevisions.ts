/* ─── Revisions of other people's items ───
 * A moderator or collaborator saves into someone else's bucket, and is held to
 * the same check as the owner: a save made from a copy the item has moved on
 * from is refused (backend/src/routes/content.ts). The lists those people open
 * items from say which revision each one is at, and every save says what it
 * became. Kept for the tab, as the item itself is (services/studioStash.ts).
 */

export interface OwnedRevision {
  ownerId: string;
  bucket: string;
  key: string;
  revision: number;
}

const STORE_KEY = 'academy-delegated-revisions';

function read(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function write(known: Record<string, number>): void {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(known));
  } catch {
    /* A save with no revision is checked by nothing, as saves used to be. */
  }
}

const idOf = (ownerId: string, bucket: string, key: string) => `${ownerId}\u0000${bucket}\u0000${key}`;

export function rememberRevisions(list: OwnedRevision[] | undefined): void {
  if (!list?.length) return;
  const known = read();
  for (const { ownerId, bucket, key, revision } of list) known[idOf(ownerId, bucket, key)] = revision;
  write(known);
}

/** The revision to save against, or undefined when this tab was never told. */
export function delegatedBase(ownerId: string, bucket: string, key: string): number | undefined {
  return read()[idOf(ownerId, bucket, key)];
}

export function rememberSaved(ownerId: string, bucket: string, key: string, revision: number | undefined): void {
  if (typeof revision === 'number') rememberRevisions([{ ownerId, bucket, key, revision }]);
}
