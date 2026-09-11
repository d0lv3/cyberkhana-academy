/* ─── Public profiles ───
 * What one member can see of another (GET /api/users/:handle). The server
 * assembles this from a fixed list of public fields; nothing private, such as
 * an email address, is ever part of it. */

import { api } from './api';
import type { SocialLinks } from './socials';

export interface PublicProfile {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  /** Present only when its owner has chosen to show it. */
  bio: string | null;
  university: string | null;
  socials: SocialLinks;
  /** All-time board score: XP since the last leaderboard reset. */
  points: number;
  /** Lifetime XP, which the level is read from. Absent from servers before XP. */
  xp?: number;
  /** All-time leaderboard position; null when not ranked. */
  rank: number | null;
}

/** Where a member's profile lives: by handle when they have one, otherwise by
 *  account id. Null when there is nobody to link to (built-in content). */
export function profilePath(person: { id?: string | null; username?: string | null } | null | undefined): string | null {
  if (!person) return null;
  if (person.username) return `/u/${person.username}`;
  if (person.id) return `/u/${person.id}`;
  return null;
}

export function fetchPublicProfile(handle: string): Promise<PublicProfile> {
  return api
    .get<{ profile: PublicProfile }>(`/users/${encodeURIComponent(handle)}`)
    .then((r) => r.profile);
}
