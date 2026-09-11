/* ── Versions of the legal documents users are held to ──
 *
 * Bump one when that document changes materially. Mirrored in the frontend's
 * `data/termsContent.ts` and `data/creatorAgreementContent.ts` — the two trees
 * build separately, so the constant is duplicated rather than shared. Bump both
 * halves together.
 *
 * Format is the document's own "Last updated" date, so the value stored on a
 * user record says which text they actually agreed to.
 */

export const CURRENT_TERMS_VERSION = '2026-09-11';

export const CURRENT_CREATOR_AGREEMENT_VERSION = '2026-09-07';

/**
 * Has this user agreed to the Terms as they currently stand?
 *
 * Recorded at sign-in rather than through a dialog: the login screen states
 * that continuing means agreeing, and links both documents, so passing through
 * it *is* the agreement. This just writes down that it happened, and against
 * which version — which a notice on a page cannot do by itself.
 */
export const hasAcceptedCurrentTerms = (user: {
  termsAcceptedAt?: Date | null;
  termsVersion?: string | null;
}): boolean => Boolean(user?.termsAcceptedAt && user.termsVersion === CURRENT_TERMS_VERSION);

/**
 * Has this creator accepted the Creator Agreement as it currently stands?
 *
 * Unlike the Terms, this one is NOT inferred from signing in. Taking a
 * perpetual licence over someone's work and putting personal responsibility on
 * them (sections 9 and 11 of the Agreement) is not something a login notice can
 * carry — it needs a deliberate act, so creators get an explicit dialog.
 */
export const hasAcceptedCurrentCreatorAgreement = (user: {
  creatorAgreementAcceptedAt?: Date | null;
  creatorAgreementVersion?: string | null;
}): boolean =>
  Boolean(
    user?.creatorAgreementAcceptedAt &&
      user.creatorAgreementVersion === CURRENT_CREATOR_AGREEMENT_VERSION
  );
