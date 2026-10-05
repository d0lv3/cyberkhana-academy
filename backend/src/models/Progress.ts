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
  /** enrolled module slugs */
  enrolledModules: string[];
  /** XP group keys of the modules this learner has finished, recorded by the
   *  server when it first sees one complete. The finishing bonus stays once
   *  earned, so a lesson added to a module later takes nothing away. */
  finishedModules: string[];
  /** Local 'YYYY-MM-DD' → how many activities the server saw finished that
   *  day. Written only when a push brings completions the server had not seen
   *  before, never because a client said so: streak points are XP, and XP has
   *  to be earned in front of the server. Three in a day makes it a study day
   *  (shared/streak.ts), and the count is what shades the heat map. */
  studyDays: Record<string, number>;
  /** Lab flags the server has accepted, one entry per flag. A flag lab is
   *  recorded complete once all of its flags are here (routes/progress.ts). */
  solvedFlags: { module: string; lab: string; flag: string }[];
  /** How far the learner's unchecked work has been credited up to
   *  (utils/pace.ts). Absent until the first paced stop. */
  paceClock?: Date;
  /** Paths the server has seen this learner finish, and when it first did
   *  (utils/pathCompletion.ts). Kept once earned: a lesson added to the path
   *  later does not lock its final exam again. `owner` is the account whose
   *  bucket the path lives in. */
  completedPaths: { owner: string; path: string; at: Date }[];
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
    enrolledModules: { type: [String], default: [] },
    finishedModules: { type: [String], default: [] },
    studyDays: { type: Schema.Types.Mixed, default: {} },
    solvedFlags: {
      type: [{ module: String, lab: String, flag: String, _id: false }],
      default: [],
    },
    paceClock: { type: Date },
    completedPaths: {
      type: [{ owner: String, path: String, at: Date, _id: false }],
      default: [],
    },
    lastActivity: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model<IProgress>('Progress', ProgressSchema);
