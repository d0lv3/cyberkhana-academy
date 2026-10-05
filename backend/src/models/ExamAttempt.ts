import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * One sitting of a path's final exam.
 *
 * Everything the attempt was dealt is copied in when it starts: which version
 * of each section, which tasks, the order the options were shown in, and the
 * answers they are marked against. The exam can be edited the moment after
 * and this attempt is still marked against what its learner was actually
 * asked. None of the answer fields ever leave the server (routes/exams.ts
 * builds what the browser is sent field by field).
 */

export interface AttemptTask {
  /** The authored task's id. */
  id: string;
  kind: 'mcq' | 'text' | 'flag';
  prompt: string;
  points: number;
  /** A pick: the options in the order this attempt shows them. */
  options?: string[];
  /** A pick: the right option's place in that order. */
  correctIndex?: number;
  answer?: string;
  caseSensitive?: boolean;
  /** A flag: the hint in its empty box. */
  placeholder?: string;
  stepKey?: string;
}

export interface AttemptSection {
  id: string;
  title: string;
  kind: 'theory' | 'practical';
  versionId: string;
  brief: { en: string; ar: string };
  targets: { label: string; address: string; port?: number }[];
  links: { label: string; url: string }[];
  files: { name: string; url: string; kind: string; bytes: number }[];
  tasks: AttemptTask[];
}

/** What a passed attempt entitles its learner to print, fixed when it passed:
 *  the path may be edited, unpublished or deleted before they claim it. */
export interface AttemptAward {
  certificate: boolean;
  pathTitle: string;
  pathSlug: string;
  difficulty: string;
  stepCount: number;
  lessonCount: number;
  minutes: number;
  syllabus: string[];
  pathCompletedAt: Date;
}

export interface IExamAttempt extends Document {
  userId: Types.ObjectId;
  /** The account whose bucket the path lives in. A path id is minted in a
   *  browser, so on its own it does not say whose path it is. */
  ownerId: Types.ObjectId;
  pathId: string;
  /** 1 for the first sitting, counting voided ones too. */
  number: number;
  status: 'active' | 'submitted' | 'voided';
  startedAt: Date;
  deadline: Date;
  submittedAt?: Date;
  /** Marked by the server once its time ran out, on what had been saved. */
  timedOut?: boolean;
  passPercent: number;
  practical: boolean;
  sections: AttemptSection[];
  answers: { task: string; value: number | string }[];
  earned?: number;
  total?: number;
  passed?: boolean;
  /** Which tasks were right, for the author's figures. */
  results?: { task: string; ok: boolean }[];
  /** Path steps whose tasks lost points, for the learner to go back over. */
  review?: { key: string; title: string; earned: number; total: number }[];
  award?: AttemptAward;
  /** The learner said the target or the files were broken. */
  report?: { at: Date; note: string };
  voidedAt?: Date;
  voidedBy?: Types.ObjectId;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    pathId: { type: String, required: true },
    number: { type: Number, required: true },
    status: { type: String, enum: ['active', 'submitted', 'voided'], required: true },
    startedAt: { type: Date, required: true },
    deadline: { type: Date, required: true },
    submittedAt: Date,
    timedOut: Boolean,
    passPercent: { type: Number, required: true },
    practical: { type: Boolean, default: false },
    sections: { type: Schema.Types.Mixed, default: [] },
    answers: { type: Schema.Types.Mixed, default: [] },
    earned: Number,
    total: Number,
    passed: Boolean,
    results: { type: Schema.Types.Mixed },
    review: { type: Schema.Types.Mixed },
    award: { type: Schema.Types.Mixed },
    report: { type: new Schema({ at: Date, note: String }, { _id: false }) },
    voidedAt: Date,
    voidedBy: Schema.Types.ObjectId,
    voidReason: String,
  },
  { timestamps: true, minimize: false }
);

// One sitting per number: two starts at once cannot both become attempt 3.
ExamAttemptSchema.index({ userId: 1, ownerId: 1, pathId: 1, number: 1 }, { unique: true });
ExamAttemptSchema.index({ ownerId: 1, pathId: 1, status: 1 });

export default mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
