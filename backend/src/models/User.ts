import mongoose, { Schema, Document } from 'mongoose';
import type { MemberTag } from '../shared/tags';
import type { UserRole } from '../types';
import { SOCIAL_PLATFORMS, type SocialLinks } from '../utils/socials';

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
  /** Whether other members see the bio on the public profile. Bios were
   *  written when the Privacy Policy said they were private, so showing one
   *  is the member's choice, never a default: absent means hidden. */
  showBio?: boolean;
  /** Accounts elsewhere, shown on the public profile. Stored normalised by
   *  utils/socials.ts: a handle, or a checked URL for the platforms without a
   *  fixed profile address. */
  socials?: SocialLinks;
  /** Explicit creator capability grants (admin-managed). Unset → default set. */
  creatorPermissions?: string[];
  preferredLang: 'en' | 'ar';
  completedModulesCount: number;
  completedLessonsCount: number;
  totalLearningTimeMinutes: number;
  /** All-time leaderboard standing, in XP: `pointsRaw` minus `pointsBaseline`,
   *  never below zero. */
  points: number;
  /** Lifetime XP, scored by the server from the learner's completions
   *  (utils/xpCatalog.ts); whatever total a client sends is ignored. The level
   *  comes from this, so a leaderboard reset never lowers it. */
  pointsRaw?: number;
  /** The XP formula the figures above are in. Absent or older than
   *  XP_FORMULA_VERSION means the account has not been restated yet
   *  (utils/xpMigration.ts). */
  xpVersion?: number;
  /** Where the board counts from. An admin reset moves this up to whatever the
   *  learner had earned, which zeroes the board without touching a single
   *  completion — and, because every later push is measured against it, without
   *  the next sync handing the old total straight back. */
  pointsBaseline: number;
  /** When the baseline was last moved. */
  pointsResetAt?: Date;
  /** XP an admin gave or took by hand, signed and cumulative, for the things
   *  the Academy cannot see: running a workshop, winning a CTF, helping in the
   *  channel.
   *
   *  It is XP like any other, so it is INSIDE `pointsRaw` and counts toward the
   *  level and the profile total, not only the board. It is also kept here on
   *  its own, because `pointsRaw` is restated from the content on every sync
   *  and the award has to be added back each time. A leaderboard reset leaves
   *  it alone: resetting the board must not take XP off anyone. */
  pointsAdjustment: number;
  /** XP paid for reaching streak breakpoints (shared/streak.ts). Like an
   *  admin's award it is XP like any other, INSIDE `pointsRaw`, and kept on
   *  its own because that total is restated from the content on every sync
   *  and would otherwise wipe it. A leaderboard reset leaves it alone. */
  streakPoints: number;
  /** Breakpoints already paid for, in days, so each one pays once ever. A
   *  streak that breaks and is rebuilt past the same rung is not paid twice. */
  streakAwarded: number[];
  /** The breakpoint this learner is aiming at, one of STREAK_GOALS. Unset
   *  until they choose, which is what the card asks them to do. */
  streakGoal?: number;
  /** Labels an admin put on this account, shown on its public profile. */
  tags?: MemberTag[];
  /** Points earned during `monthlyPointsMonth`; the monthly leaderboard reads these. */
  monthlyPoints: number;
  /** Month bucket for `monthlyPoints`, as 'YYYY-MM' (UTC). Stale months count as 0. */
  monthlyPointsMonth: string;
  isBanned: boolean;
  lastLoginAt: Date;
  /** When the member asked for this account to be deleted. Set and cleared
   *  together with `deletionScheduledFor`. */
  deletionRequestedAt?: Date;
  /** When the account goes if its owner does not come back. While this is set
   *  every session is refused and other members cannot see the account;
   *  signing in again before it passes clears both fields, which is how a
   *  request is withdrawn. See utils/accountDeletion.ts. */
  deletionScheduledFor?: Date;
  /** When this user last passed the sign-in notice under the current Terms.
   *  Stamped at sign-in, not through a dialog — see config/legal.ts. */
  termsAcceptedAt?: Date;
  termsVersion?: string;
  /** When this creator explicitly accepted the Creator Agreement. Absent means
   *  the Content Studio stays locked for role 'creator'. */
  creatorAgreementAcceptedAt?: Date;
  creatorAgreementVersion?: string;
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
    showBio: { type: Boolean },
    socials: {
      type: new Schema(
        Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, { type: String, maxlength: 200 }])),
        { _id: false }
      ),
      default: undefined,
    },
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
    // No default either: absent is what "never restated" means.
    xpVersion: { type: Number },
    pointsBaseline: { type: Number, default: 0 },
    pointsResetAt: { type: Date },
    pointsAdjustment: { type: Number, default: 0 },
    streakPoints: { type: Number, default: 0 },
    streakAwarded: { type: [Number], default: [] },
    streakGoal: { type: Number },
    // `_id: false`: a tag is a value, not a thing with an identity. Mongoose
    // would otherwise mint an ObjectId for every chip on every profile.
    tags: {
      type: [new Schema({ label: String, color: String }, { _id: false })],
      default: undefined,
    },
    monthlyPoints: { type: Number, default: 0 },
    monthlyPointsMonth: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: Date.now },
    // No defaults: absent means nobody has asked.
    deletionRequestedAt: { type: Date },
    deletionScheduledFor: { type: Date },
    // No defaults: an absent value is exactly what "has not accepted" means,
    // and every account predating these fields reads that way correctly.
    termsAcceptedAt: { type: Date },
    termsVersion: { type: String },
    creatorAgreementAcceptedAt: { type: Date },
    creatorAgreementVersion: { type: String },
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

// The deletion sweep: accounts whose deadline has passed.
UserSchema.index({ deletionScheduledFor: 1 }, { sparse: true });

export default mongoose.model<IUser>('User', UserSchema);
