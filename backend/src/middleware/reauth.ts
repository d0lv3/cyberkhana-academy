/**
 * Step-up re-authentication for sensitive admin actions.
 *
 * A session cookie proves the browser was logged in at some point. For actions
 * that hand out privileges we want proof that the *person* is still there and
 * is still the account owner — the equivalent of "re-enter your password",
 * except this system authenticates with Google, so there is no password to
 * re-enter. Instead the client obtains a fresh Google ID token and we check:
 *
 *   1. Google actually signed it, and it was issued for OUR client id.
 *   2. The Google subject matches the signed-in admin — you cannot re-auth as
 *      somebody else and act as them.
 *   3. It was issued moments ago, so a token captured earlier can't be replayed.
 *
 * Deliberately fails closed: if Google sign-in isn't configured, the guarded
 * action is refused rather than quietly allowed through.
 */
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import type { IUser } from '../models/User';

const client = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

/** How recently the token must have been issued, in seconds. */
const MAX_TOKEN_AGE_SECONDS = 5 * 60;

export interface ReauthResult {
  ok: boolean;
  /** Safe to show the user; never leaks why verification failed internally. */
  error?: string;
  status?: number;
}

export async function verifyStepUp(
  credential: unknown,
  user: IUser
): Promise<ReauthResult> {
  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 4096) {
    return { ok: false, status: 401, error: 'Re-authentication required', };
  }
  if (!client) {
    return {
      ok: false,
      status: 503,
      error: 'Google sign-in is not configured, so this action cannot be confirmed',
    };
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    return { ok: false, status: 401, error: 'Could not verify that sign-in' };
  }

  if (!payload?.sub || !payload.email_verified) {
    return { ok: false, status: 401, error: 'Could not verify that sign-in' };
  }

  // Must be the SAME human as the session.
  const linked = user.oauthProviders?.google?.id;
  if (!linked || linked !== payload.sub) {
    return {
      ok: false,
      status: 403,
      error: 'That Google account is not the one signed in here',
    };
  }

  // Must be fresh — blocks replay of a token captured earlier.
  const issuedAt = typeof payload.iat === 'number' ? payload.iat : 0;
  const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
  if (!issuedAt || ageSeconds > MAX_TOKEN_AGE_SECONDS || ageSeconds < -60) {
    return { ok: false, status: 401, error: 'That confirmation expired — please try again' };
  }

  return { ok: true };
}
