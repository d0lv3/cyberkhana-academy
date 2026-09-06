import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole } from '../types';

export interface IUser extends Document {
  email: string;
  /** Unique public handle, lowercase. Optional in the schema so existing
   *  accounts stay valid; the app prompts for one on next sign-in. */
  username?: string;
  displayName: string;
  /** The picture actually shown. A built-in `avatar:<id>`, a photo URL, or
   *  unset for the initial. The member owns this one. */
  avatarUrl?: string;
  /** Last photo Google gave us, refreshed on every Google sign-in and never
   *  cleared by a profile edit. Its only job is to survive `avatarUrl` being
   *  removed, so "use my Google photo" can put it back later. */
  googlePhotoUrl?: string;
  role: UserRole;
  oauthProviders: {
    google?: { id: string; email: string };
    github?: { id: string; username: string };
    discord?: { id: string; username: string };
  };
  university?: string;
  country?: string;
  bio?: string;
  /** Explicit creator capability grants (admin-managed). Unset → default set. */
  creatorPermissions?: string[];
  preferredLang: 'en' | 'ar';
  completedModulesCount: number;
  completedLessonsCount: number;
  totalLearningTimeMinutes: number;
  /** All-time leaderboard standing: `pointsRaw` minus `pointsBaseline`, never below zero. */
  points: number;
  /** The client's derived total, stored as pushed. Points are computed from the
   *  learner's completions, so this is the one figure a push can be trusted to
   *  restate; anything the board shows has to be derived from it. */
  pointsRaw?: number;
  /** Where the board counts from. An admin reset moves this up to whatever the
   *  learner had earned, which zeroes the board without touching a single
   *  completion — and, because every later push is measured against it, without
   *  the next sync handing the old total straight back. */
  pointsBaseline: number;
  /** When the baseline was last moved. */
  pointsResetAt?: Date;
  /** Points earned during `monthlyPointsMonth`; the monthly leaderboard reads these. */
  monthlyPoints: number;
  /** Month bucket for `monthlyPoints`, as 'YYYY-MM' (UTC). Stale months count as 0. */
  monthlyPointsMonth: string;
  isBanned: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
      // `sparse` so the many existing accounts without one don't all collide
      // on null. Uniqueness is still enforced for anyone who sets one.
      unique: true,
      sparse: true,
    },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    googlePhotoUrl: { type: String },
    role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
    oauthProviders: {
      google: {
        id: { type: String },
        email: { type: String },
      },
      github: {
        id: { type: String },
        username: { type: String },
      },
      discord: {
        id: { type: String },
        username: { type: String },
      },
    },
    university: { type: String },
    country: { type: String },
    bio: { type: String, maxlength: 500 },
    creatorPermissions: { type: [String], default: undefined },
    preferredLang: { type: String, enum: ['en', 'ar'], default: 'en' },
    completedModulesCount: { type: Number, default: 0 },
    completedLessonsCount: { type: Number, default: 0 },
    totalLearningTimeMinutes: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    // No default: an account that predates this field must read as "unknown"
    // rather than as zero, or its first reset would take a baseline of nothing
    // and clear nobody.
    pointsRaw: { type: Number },
    pointsBaseline: { type: Number, default: 0 },
    pointsResetAt: { type: Date },
    monthlyPoints: { type: Number, default: 0 },
    monthlyPointsMonth: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.index({ 'oauthProviders.google.id': 1 }, { sparse: true });
UserSchema.index({ 'oauthProviders.github.id': 1 }, { sparse: true });
UserSchema.index({ 'oauthProviders.discord.id': 1 }, { sparse: true });

// Leaderboard queries: overall (points), monthly (month + points), and university filter.
UserSchema.index({ isBanned: 1, points: -1 });
UserSchema.index({ isBanned: 1, monthlyPointsMonth: 1, monthlyPoints: -1 });
UserSchema.index({ university: 1 });

export default mongoose.model<IUser>('User', UserSchema);
