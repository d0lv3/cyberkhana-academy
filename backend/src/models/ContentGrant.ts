import mongoose, { Schema, Document, Types } from 'mongoose';
import { CONTENT_BUCKETS, type ContentBucketKey } from '../types';

/**
 * One creator letting another work on a whole bucket of their content.
 *
 * Content is stored per (owner, bucket), with no per-item ownership inside it,
 * so a grant is bucket-shaped too: "Layla may work on everything in my
 * Networking tab". The grantee's edits are still written into the OWNER's
 * bucket, so authorship never moves and revoking a grant leaves the work where
 * it was.
 *
 * A grant is deliberately not a permission. The grantee must independently hold
 * the creator permission for that content type, which only an admin can give;
 * the grant just points that existing capability at someone else's bucket.
 */
export interface IContentGrant extends Document {
  /** Whose content this is. */
  ownerId: Types.ObjectId;
  /** Who may work on it. */
  granteeId: Types.ObjectId;
  bucket: ContentBucketKey;
  createdAt: Date;
  updatedAt: Date;
}

const ContentGrantSchema = new Schema<IContentGrant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    granteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bucket: { type: String, enum: [...CONTENT_BUCKETS], required: true },
  },
  { timestamps: true }
);

// One grant per person per bucket; re-sharing is idempotent, not duplicated.
ContentGrantSchema.index({ ownerId: 1, granteeId: 1, bucket: 1 }, { unique: true });
// "What has been shared with me?" is the hot read on every studio tab.
ContentGrantSchema.index({ granteeId: 1 });

export default mongoose.model<IContentGrant>('ContentGrant', ContentGrantSchema);
