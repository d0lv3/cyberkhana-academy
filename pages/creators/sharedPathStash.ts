import type { CreatorPath } from '../../services/creatorTypes';

/**
 * Where the paths list hands a shared path to the editor.
 *
 * A path shared with you lives in its owner's bucket, not your own cache, so
 * `getPathById` cannot find it. The list already has the full path from the
 * shared-content endpoint and passes it through here.
 */
export const SHARED_PATH_STASH = 'academy-shared-path-edit';

export interface SharedPathStash {
  id: string;
  ownerId: string;
  ownerName: string;
  path: CreatorPath;
}
