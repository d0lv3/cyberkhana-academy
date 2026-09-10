import type { NetworkingUnit } from '../../services/creatorTypes';

/**
 * Where the networking list stashes another creator's unit that an admin chose
 * to edit. It came from an admin-only endpoint, so the editor cannot re-read it
 * from its own bucket; the list hands it over. Mirrors ADMIN_NETWORKING_STASH.
 */
export const ADMIN_UNIT_STASH = 'academy-admin-networking-unit-edit';

export interface AdminUnitStash {
  id: string;
  ownerId: string;
  ownerName: string;
  unit: NetworkingUnit;
}
