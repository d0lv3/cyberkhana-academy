import type { CreatorNetworkingLesson } from '../../services/creatorTypes';

/**
 * Where the networking list stashes a foreign published lesson an admin chose
 * to edit. The lesson body comes from an admin-only endpoint, so the editor
 * can't re-fetch it from the creator's own bucket — the list hands it over.
 *
 * Built-in lessons need no stash: they're in the bundle, so `?builtin=1` is
 * enough for the editor to resolve them itself.
 */
export const ADMIN_NETWORKING_STASH = 'academy-admin-networking-edit';

export interface AdminNetworkingStash {
  id: string;
  ownerId: string;
  ownerName: string;
  lesson: CreatorNetworkingLesson;
}
