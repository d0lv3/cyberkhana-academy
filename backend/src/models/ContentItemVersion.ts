import mongoose, { Schema, Document, Types } from 'mongoose';
import { CONTENT_BUCKETS, type ContentBucketKey } from '../types';

/** How long an earlier version is kept. The Privacy Policy states this figure
 *  (section 8), so changing it means changing the policy too. */
export const VERSION_RETENTION_DAYS = 90;

/**
 * What an item in a ContentBucket looked like before a save replaced it, so
 * overwritten or deleted work can be brought back whatever overwrote it. These
 * hold quiz answers and lab flags exactly as the bucket does, and drafts too,
 * so they only ever go back to the item's owner, and they go when the owner's
 * account does (utils/accountDeletion.ts).
 */
export interface IContentItemVersion extends Document {
  ownerId: Types.ObjectId;
  bucket: ContentBucketKey;
  /** The item's id, or its languageSlug in `programming-patches`. */
  itemKey: string;
  data: unknown;
  /** Who made the save that replaced this version: the owner or a collaborator. */
  replacedBy: Types.ObjectId;
  createdAt: Date;
}

const ContentItemVersionSchema = new Schema<IContentItemVersion>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bucket: { type: String, enum: [...CONTENT_BUCKETS], required: true },
    itemKey: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    replacedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false }
);

ContentItemVersionSchema.index({ ownerId: 1, bucket: 1, itemKey: 1, createdAt: -1 });
ContentItemVersionSchema.index({ createdAt: 1 }, { expireAfterSeconds: VERSION_RETENTION_DAYS * 24 * 60 * 60 });

export default mongoose.model<IContentItemVersion>('ContentItemVersion', ContentItemVersionSchema);
