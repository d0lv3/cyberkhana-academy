import type {
  CreatorMeta,
  CreatorProgrammingConcept,
  CreatorProgrammingLanguage,
} from '../../services/creatorTypes';
import type { ProgrammingModule } from '../../data/programming/types';

/**
 * Where the programming list stashes another author's published module or
 * concept that an admin chose to edit.
 *
 * The catalog merge collapses every author's patches into one list, so by the
 * time a row is on screen its owner is gone. The list resolves the owner from
 * the admin-only endpoint and hands it to the editor through here.
 *
 * Built-in content needs no stash: it's in the bundle, so `?builtin=1` is
 * enough for the editor to resolve it itself.
 */
export const ADMIN_PROGRAMMING_STASH = 'academy-admin-programming-edit';

interface AdminProgrammingBase {
  ownerId: string;
  ownerName: string;
  languageSlug: string;
}

export type AdminProgrammingStash =
  | (AdminProgrammingBase & {
      kind: 'module';
      item: ProgrammingModule & Partial<CreatorMeta>;
    })
  | (AdminProgrammingBase & {
      kind: 'concept';
      moduleSlug: string;
      item: CreatorProgrammingConcept;
    })
  | (AdminProgrammingBase & {
      kind: 'language';
      item: CreatorProgrammingLanguage;
    });
