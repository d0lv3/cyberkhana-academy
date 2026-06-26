import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole } from '../types';

export interface IUser extends Document {
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  oauthProviders: {
    google?: { id: string; email: string };
    github?: { id: string; username: string };
    discord?: { id: string; username: string };
  };
  university?: string;
  country?: string;
  bio?: string;
  preferredLang: 'en' | 'ar';
  completedModulesCount: number;
  completedLessonsCount: number;
  totalLearningTimeMinutes: number;
  /** All-time leaderboard points (client-computed total, mirrored here on each progress push). */
  points: number;
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
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
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
    preferredLang: { type: String, enum: ['en', 'ar'], default: 'en' },
    completedModulesCount: { type: Number, default: 0 },
    completedLessonsCount: { type: Number, default: 0 },
    totalLearningTimeMinutes: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
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
