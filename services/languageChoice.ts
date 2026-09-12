/* ─── The first question ───
 *
 * Which language a new member wants the Academy in. It is asked before
 * anything else, because everything else, the handle prompt, the university
 * question and the tour, is written in whichever language they pick.
 *
 * The answer is kept in two places on purpose. The account carries
 * `preferredLang`, so it travels with the member; this device carries a note
 * that the question has been put to them, because an account's language can
 * never say whether it was chosen or merely defaulted to.
 *
 * It sits beside the other per-account interface state (the level last
 * celebrated, whether the tour was taken): syncService drops it when a
 * different account signs in here, which is what makes it per member.
 */

export const LANG_CHOSEN_KEY = 'academy-lang-chosen';

/** Has this member already been asked, on this device? */
export function hasChosenLanguage(): boolean {
  try {
    return localStorage.getItem(LANG_CHOSEN_KEY) === '1';
  } catch {
    /* private mode, or storage disabled: better to ask twice than to guess */
    return false;
  }
}

export function rememberLanguageChoice(): void {
  try {
    localStorage.setItem(LANG_CHOSEN_KEY, '1');
  } catch {
    /* At worst the question is put again next time. */
  }
}

/** Forget the answer, so the question is asked again. */
export function forgetLanguageChoice(): void {
  try {
    localStorage.removeItem(LANG_CHOSEN_KEY);
  } catch {
    /* nothing to forget */
  }
}
