/* ─── Collaboration ───
 * A creator can hand another creator a whole studio tab to work on. The grant
 * is bucket-shaped because storage is: content lives per (owner, bucket) with
 * no per-item ownership inside it.
 *
 * Edits by a collaborator are written into the OWNER's bucket through the
 * server, never into the collaborator's own local cache, so authorship stays
 * put and revoking a share leaves the work exactly where it was. That is the
 * same path admin moderation already uses; only the authorisation differs.
 */

import { api } from './api';

/** Server bucket names. One studio tab, one bucket, one grant. */
export type CollabBucket =
  | 'networking-lessons'
  | 'programming-patches'
  | 'os-modules'
  | 'standalone-modules'
  | 'paths';

export interface CollabPerson {
  id: string;
  username?: string;
  displayName: string;
}

export interface GrantGiven {
  id: string;
  bucket: CollabBucket;
  grantee: CollabPerson | null;
  createdAt: string;
}

export interface GrantReceived {
  id: string;
  bucket: CollabBucket;
  owner: CollabPerson | null;
  createdAt: string;
}

export interface SharedBucket<T = unknown> {
  grantId: string;
  bucket: CollabBucket;
  owner: CollabPerson | null;
  items: T[];
}

/** Both directions: what I have shared out, and what has been shared with me. */
export async function fetchGrants(): Promise<{ given: GrantGiven[]; received: GrantReceived[] }> {
  return api.get<{ given: GrantGiven[]; received: GrantReceived[] }>('/collab/grants');
}

/**
 * Share a bucket with the holder of `username`.
 *
 * The server does the existence check, so a bad handle comes back as a plain
 * ApiError with a readable message rather than something the UI has to guess at.
 */
export async function shareBucket(
  bucket: CollabBucket,
  username: string
): Promise<GrantGiven> {
  const { grant } = await api.post<{ grant: GrantGiven }>('/collab/grants', {
    bucket,
    username,
  });
  return grant;
}

/** Revoke a share. Allowed for the owner, and for the grantee walking away. */
export async function revokeGrant(grantId: string): Promise<void> {
  await api.delete(`/collab/grants/${grantId}`);
}

/** Every bucket shared with me, items included (drafts too, unlike moderation). */
export async function fetchSharedWithMe<T = unknown>(): Promise<SharedBucket<T>[]> {
  const { shared } = await api.get<{ shared: SharedBucket<T>[] }>('/collab/shared');
  return shared;
}

/** Save one item back into the owner's bucket, in place. */
export async function saveSharedItem(
  ownerId: string,
  bucket: CollabBucket,
  item: unknown
): Promise<void> {
  await api.patch('/content/collab/item', { ownerId, bucket, item });
}

/** Delete one item from the owner's bucket. A collaborator holds the owner's
 *  rights inside a shared tab, and this is as irreversible as it is for them. */
export async function deleteSharedItem(
  ownerId: string,
  bucket: CollabBucket,
  itemId: string
): Promise<void> {
  await api.delete('/content/collab/item', { ownerId, bucket, itemId });
}

/** Save one module / concept / language back into the owner's programming patch. */
export async function saveSharedProgramming(args: {
  ownerId: string;
  languageSlug: string;
  kind: 'module' | 'concept' | 'language';
  moduleSlug?: string;
  item: unknown;
}): Promise<void> {
  await api.patch('/content/collab/programming', args);
}

/** Delete one module / concept / language from the owner's programming patch. */
export async function deleteSharedProgramming(args: {
  ownerId: string;
  languageSlug: string;
  kind: 'module' | 'concept' | 'language';
  moduleSlug?: string;
  itemId?: string;
}): Promise<void> {
  await api.delete('/content/collab/programming', args);
}

/** Human label for a bucket, used in the share panel and the shared sections. */
export const BUCKET_LABEL: Record<CollabBucket, { en: string; ar: string }> = {
  'networking-lessons': { en: 'Networking lessons', ar: 'دروس الشبكات' },
  'programming-patches': { en: 'Programming content', ar: 'المحتوى البرمجي' },
  'os-modules': { en: 'OS modules', ar: 'وحدات أنظمة التشغيل' },
  'standalone-modules': { en: 'Modules', ar: 'الوحدات' },
  paths: { en: 'Learning paths', ar: 'المسارات التعليمية' },
};
