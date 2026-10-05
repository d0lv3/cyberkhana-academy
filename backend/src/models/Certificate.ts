import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A certificate of achievement: one learner, one path, its final exam passed.
 *
 * Everything printed on it is copied in when it is issued, so a later rename,
 * a path that is edited or taken down, or a profile change cannot alter a
 * certificate that has already been handed out. `code` is the public
 * verification handle: 128 random bits, so it cannot be guessed, or worked
 * out from another certificate's code.
 *
 * The same design as the event certificates on the CyberKhana platform, which
 * this is modelled on.
 */
export interface ICertificate extends Document {
  code: string;
  userId: Types.ObjectId;
  /** Whose bucket the path lives in, with `pathId`: see ExamAttempt. */
  ownerId: Types.ObjectId;
  pathId: string;
  pathSlug: string;
  /** The name its holder asked to have printed. */
  name: string;
  username?: string;
  /** Printed only when the holder asked for it to be. */
  university?: string;
  pathTitle: string;
  difficulty: string;
  stepCount: number;
  lessonCount: number;
  /** Expected minutes of the path's content, as the catalog measures it. */
  minutes: number;
  /** The path's steps, by title, as they stood when it was finished. */
  syllabus: string[];
  /** Whether the exam had a practical section. */
  practical: boolean;
  distinction: boolean;
  /** Kept for the holder and for admins. Never on the public page. */
  scorePercent: number;
  attemptId: Types.ObjectId;
  pathCompletedAt: Date;
  issuedAt: Date;
  /** Set when it is withdrawn: obtained by cheating, or issued by mistake. */
  revokedAt?: Date;
  revokedReason?: string;
  revokedBy?: Types.ObjectId;
}

const CertificateSchema = new Schema<ICertificate>({
  code: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true },
  pathId: { type: String, required: true },
  pathSlug: { type: String, default: '' },
  name: { type: String, required: true },
  username: String,
  university: String,
  pathTitle: { type: String, required: true },
  difficulty: { type: String, default: '' },
  stepCount: { type: Number, default: 0 },
  lessonCount: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
  syllabus: { type: [String], default: [] },
  practical: { type: Boolean, default: false },
  distinction: { type: Boolean, default: false },
  scorePercent: { type: Number, default: 0 },
  attemptId: { type: Schema.Types.ObjectId, required: true },
  pathCompletedAt: { type: Date, required: true },
  issuedAt: { type: Date, required: true },
  revokedAt: Date,
  revokedReason: String,
  revokedBy: Schema.Types.ObjectId,
});

// One certificate per learner per path, however many times it is claimed.
CertificateSchema.index({ userId: 1, ownerId: 1, pathId: 1 }, { unique: true });
CertificateSchema.index({ ownerId: 1, pathId: 1 });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
