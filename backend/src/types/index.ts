export type UserRole = 'user' | 'creator' | 'admin';

/** Lean JWT payload — fresh user data (role, ban state) is loaded from the DB per request. */
export interface IJWTPayload {
  userId: string;
}

/** The five creator-content buckets, mirroring the frontend storage layout. */
export const CONTENT_BUCKETS = [
  'networking-lessons',
  'programming-patches',
  'os-modules',
  'standalone-modules',
  'paths',
] as const;

export type ContentBucketKey = (typeof CONTENT_BUCKETS)[number];
