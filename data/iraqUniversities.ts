/* ─── Universities, as the browser sees them ───
 *
 * The built-in Iraqi list and the rules for a name live in
 * backend/src/shared/universities.ts, which the server reads too. This file
 * joins that list with the universities an admin has added
 * (services/universities.ts fetches them and hands them over), and holds the
 * two lookups every page uses: the search behind the picker, and the label to
 * show for a value stored on a profile.
 *
 * Students PICK from the list; they don't type their own. Every entry is
 * searchable by its English name, and by its Arabic one where it has one.
 */

import {
  BUILTIN_UNIVERSITIES,
  NOT_ENROLLED,
  universityKey,
  type University,
} from '../backend/src/shared/universities';

export { NOT_ENROLLED };
export type { University };

/* ── The whole list: built-in, then added ── */

let all: University[] = BUILTIN_UNIVERSITIES;
let byName = new Map(all.map((u) => [u.name, u]));

/** Replace the admin-added part of the list. A built-in always wins: an added
 *  entry under the same name would only shadow it. */
export function setAddedUniversities(added: University[]): void {
  const builtin = new Set(BUILTIN_UNIVERSITIES.map((u) => universityKey(u.name)));
  all = [...BUILTIN_UNIVERSITIES, ...added.filter((u) => !builtin.has(universityKey(u.name)))];
  byName = new Map(all.map((u) => [u.name, u]));
}

/** Case-insensitive substring search over English + Arabic names. An empty
 *  query is the whole list, so an added university is always there to find. */
export function searchUniversities(query: string): University[] {
  const raw = query.trim();
  const q = raw.toLowerCase();
  if (!q) return all;
  return all.filter((u) => u.name.toLowerCase().includes(q) || (u.ar && u.ar.includes(raw)));
}

/** How to display a stored university value in a given language. A value no
 *  longer on the list (an admin removed it) still shows, as it was stored. */
export function universityLabel(
  value: string | null | undefined,
  lang: 'en' | 'ar'
): { text: string; isNotEnrolled: boolean; isSet: boolean } {
  if (!value) return { text: '', isNotEnrolled: false, isSet: false };
  if (value === NOT_ENROLLED) {
    return { text: lang === 'ar' ? 'غير مسجّل' : 'Not enrolled', isNotEnrolled: true, isSet: true };
  }
  const match = byName.get(value);
  return { text: lang === 'ar' && match?.ar ? match.ar : value, isNotEnrolled: false, isSet: true };
}
