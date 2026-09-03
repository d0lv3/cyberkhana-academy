import mongoose, { Schema, Document, Types } from 'mongoose';

/** The three surfaces a learner can be asked about, and the three cards the
 *  Content Studio groups them under. */
export const FEEDBACK_TRACKS = ['programming', 'networking', 'os-modules'] as const;
export type FeedbackTrack = (typeof FEEDBACK_TRACKS)[number];

/**
 * One learner's rating of one finished piece of content.
 *
 * The content title is denormalised on purpose: a creator reading feedback six
 * months from now needs to know what was being rated even if the module has
 * since been renamed, unpublished or deleted.
 */
export interface IFeedback extends Document {
  userId: Types.ObjectId;
  /** Snapshot of the author's name at submission time. */
  userName: string;
  track: FeedbackTrack;
  rating: number;
  comment: string;
  /** Id of the module / lesson that was completed. */
  contextId: string;
  contextTitle: string;
  /** Short qualifier, e.g. the language name or the pillar the module sits in. */
  contextSub?: string;
  /** Interface language the learner answered in. */
  lang: 'en' | 'ar';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true, maxlength: 160 },
    track: { type: String, enum: [...FEEDBACK_TRACKS], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 2000 },
    contextId: { type: String, required: true, maxlength: 200 },
    contextTitle: { type: String, default: '', maxlength: 300 },
    contextSub: { type: String, maxlength: 200 },
    lang: { type: String, enum: ['en', 'ar'], default: 'en' },
  },
  { timestamps: true }
);

/* The studio reads newest-first, either across a track or across everything. */
FeedbackSchema.index({ track: 1, createdAt: -1 });
FeedbackSchema.index({ createdAt: -1 });
/* One rating per learner per piece of content — a re-submission overwrites. */
FeedbackSchema.index({ userId: 1, track: 1, contextId: 1 }, { unique: true });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
