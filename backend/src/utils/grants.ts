import ContentGrant from '../models/ContentGrant';
import type { ContentBucketKey } from '../types';

/**
 * May this user write into someone else's content bucket?
 *
 * Three ways in, and only three:
 *   - it is their own bucket;
 *   - they are an admin (platform moderation);
 *   - the owner has granted them that bucket.
 *
 * This answers "whose content may you touch". It deliberately does NOT answer
 * "may you author this content type at all" — callers pair it with
 * canWriteBucket(), so a creator whose 'networking' permission is revoked
 * loses access to shared networking buckets at the same moment, without
 * anyone having to hunt down and delete their grants.
 */
export async function canEditOthersBucket(
  user: { _id: unknown; role: string },
  ownerId: string,
  bucket: ContentBucketKey
): Promise<boolean> {
  if (String(user._id) === String(ownerId)) return true;
  if (user.role === 'admin') return true;
  return !!(await ContentGrant.exists({ ownerId, granteeId: user._id, bucket }));
}
