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

/* ── Creator permissions ──
 * Fine-grained capabilities an admin grants each creator. Admins implicitly
 * hold every permission; creators without an explicit grant get the default
 * set (everything except whole-language creation, which is catalog-level and
 * must be granted deliberately). */
export const CREATOR_PERMISSIONS = [
  'networking',
  'programming',
  'programming-languages',
  'modules',
  'os-modules',
  'paths',
] as const;

export type CreatorPermission = (typeof CREATOR_PERMISSIONS)[number];

export const DEFAULT_CREATOR_PERMISSIONS: CreatorPermission[] = CREATOR_PERMISSIONS.filter(
  (p) => p !== 'programming-languages'
);

/** Resolve what a user may author. Admin → all; creator → grants ?? default; student → none. */
export function effectivePermissions(user: {
  role: UserRole;
  creatorPermissions?: string[];
}): CreatorPermission[] {
  if (user.role === 'admin') return [...CREATOR_PERMISSIONS];
  if (user.role !== 'creator') return [];
  if (!user.creatorPermissions) return [...DEFAULT_CREATOR_PERMISSIONS];
  return user.creatorPermissions.filter((p): p is CreatorPermission =>
    (CREATOR_PERMISSIONS as readonly string[]).includes(p)
  );
}
