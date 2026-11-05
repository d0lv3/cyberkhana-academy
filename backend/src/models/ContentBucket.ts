import mongoose, { Schema, Document, Types } from 'mongoose';
import { CONTENT_BUCKETS, type ContentBucketKey } from '../types';

/**
 * One document per (owner, bucket) — the server-side mirror of the frontend's
 * five creator-content localStorage buckets. The owner is ALWAYS taken from
 * the authenticated session, never from the request body.
 */
export interface IContentBucket extends Document {
  ownerId: Types.ObjectId;
  bucket: ContentBucketKey;
  items: unknown[];
  /** Goes up with every write to `items`, and nothing writes without checking
   *  it (utils/contentStore.ts). Absent until the first such write. */
  revision?: number;
  /** The revision of each item, by its key. An item not listed here has not
   *  been saved since revisions began. An array rather than a map because an
   *  item's id may hold characters a field name may not. */
  itemRevisions?: { key: string; rev: number }[];
  updatedAt: Date;
  createdAt: Date;
}

const ContentBucketSchema = new Schema<IContentBucket>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bucket: { type: String, enum: [...CONTENT_BUCKETS], required: true },
    items: { type: [Schema.Types.Mixed], default: [] },
    revision: { type: Number },
    itemRevisions: { type: [{ _id: false, key: String, rev: Number }], default: undefined },
  },
  { timestamps: true, minimize: false }
);

ContentBucketSchema.index({ ownerId: 1, bucket: 1 }, { unique: true });
ContentBucketSchema.index({ bucket: 1 });

export default mongoose.model<IContentBucket>('ContentBucket', ContentBucketSchema);
