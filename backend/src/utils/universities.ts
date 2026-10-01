import University from '../models/University';
import { NOT_ENROLLED, builtinUniversity } from '../shared/universities';

/**
 * May a profile hold this value? It may be empty (no choice yet), the "not
 * enrolled" marker, a built-in university or one an admin has added, and in
 * each case exactly as the list spells it: the stored name is what the
 * leaderboard groups members by, so a second spelling would be a second board.
 */
export async function isOfferedUniversity(value: string): Promise<boolean> {
  if (value === '' || value === NOT_ENROLLED) return true;
  if (builtinUniversity(value)?.name === value) return true;
  return (await University.exists({ name: value })) !== null;
}
