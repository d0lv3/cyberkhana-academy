import mongoose, { Schema, Document, Types } from 'mongoose';

/** Per-user learning progress — the server-side mirror of the academy-* localStorage keys. */
export interface IProgress extends Document {
  userId: Types.ObjectId;
  /** languageSlug → completed concept ids */
  programming: Record<string, string[]>;
  /** module slug → completed lecture ids */
  osModules: Record<string, string[]>;
  /** completed networking lesson ids */
  networking: string[];
  /** enrolled path ids */
  enrolledPaths: string[];
  lastActivity: {
    kind: 'programming' | 'networking' | 'os';
    route: string;
    title: { en: string; ar: string };
    context?: string;
    at: string;
  } | null;
  updatedAt: Date;
  createdAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    programming: { type: Schema.Types.Mixed, default: {} },
    osModules: { type: Schema.Types.Mixed, default: {} },
    networking: { type: [String], default: [] },
    enrolledPaths: { type: [String], default: [] },
    lastActivity: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model<IProgress>('Progress', ProgressSchema);
