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
  updatedAt: Date;
  createdAt: Date;
}

const ContentBucketSchema = new Schema<IContentBucket>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bucket: { type: String, enum: [...CONTENT_BUCKETS], required: true },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false }
);

ContentBucketSchema.index({ ownerId: 1, bucket: 1 }, { unique: true });
ContentBucketSchema.index({ bucket: 1 });

export default mongoose.model<IContentBucket>('ContentBucket', ContentBucketSchema);
