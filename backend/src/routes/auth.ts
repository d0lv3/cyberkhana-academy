import { Router, Response } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '../models/User';
import {
  authenticate,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  AuthRequest,
} from '../middleware/auth';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { effectivePermissions } from '../types';
import { isSocialPlatform, normalizeSocial, publicSocials } from '../utils/socials';
import { scheduleDeletion, settleDeletionAtSignIn } from '../utils/accountDeletion';

import {
  CURRENT_TERMS_VERSION,
  CURRENT_CREATOR_AGREEMENT_VERSION,
  hasAcceptedCurrentTerms,
  hasAcceptedCurrentCreatorAgreement,
} from '../config/legal';

const router = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

/** Public-safe projection of a user document. */
function publicUser(user: IUser) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    googlePhotoUrl: user.googlePhotoUrl,
    role: user.role,
    permissions: effectivePermissions(user),
    preferredLang: user.preferredLang,
    university: user.university,
    country: user.country,
    bio: user.bio,
    showBio: Boolean(user.showBio),
    socials: publicSocials(user.socials),
    createdAt: user.createdAt,
    termsAccepted: hasAcceptedCurrentTerms(user),
    creatorAgreementAccepted: hasAcceptedCurrentCreatorAgreement(user),
  };
}

function issueSession(res: Response, user: IUser) {
  const token = signToken(String(user._id));
  setAuthCookie(res, token);
  return { user: publicUser(user) };
}

/**
 * Records agreement to the current Terms on the user document.
 *
 * The login screen states that continuing means agreeing to the Terms and the
 * Privacy Policy, and links both, so passing through it *is* the agreement.
 * This writes down that it happened and against which version — a notice on a
 * page cannot tell you later who saw which revision.
 *
 * Mutates only; every caller already saves the user on the same request, so
 * folding into that write avoids a second round trip. Bumping
 * CURRENT_TERMS_VERSION makes this re-stamp everyone on their next sign-in.
 */
function stampTermsAgreement(user: IUser): void {
  if (hasAcceptedCurrentTerms(user)) return;
  user.termsAcceptedAt = new Date();
  user.termsVersion = CURRENT_TERMS_VERSION;
}

/* ── POST /api/auth/google ──
 * Receives a Google ID token (from Google Identity Services on the frontend),
 * verifies it server-side against our client id, and upserts the user. */
const googleSchema = z.object({ credential: z.string().min(20).max(4096) });

router.post('/google', async (req, res) => {
  if (!googleClient) {
    res.status(503).json({ error: 'Google sign-in is not configured on this server' });
    return;
  }
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      res.status(401).json({ error: 'Google account could not be verified' });
      return;
    }

    let user = await User.findOne({ 'oauthProviders.google.id': payload.sub });
    if (!user) {
      // Link by verified email if the account already exists.
      user = await User.findOne({ email: payload.email.toLowerCase() });
      if (user) user.oauthProviders.google = { id: payload.sub, email: payload.email };
    }
    if (user?.isBanned) {
      res.status(403).json({ error: 'Account unavailable' });
      return;
    }
    /* Signing in withdraws a pending deletion request. One already past its
       deadline is carried out instead, and this becomes a first sign-in. */
    const deletion = user ? await settleDeletionAtSignIn(user) : 'none';
    if (!user || deletion === 'deleted') {
      user = new User({
        email: payload.email,
        displayName: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
        oauthProviders: { google: { id: payload.sub, email: payload.email } },
      });
    }
    /* Keep the Google photo on file, refreshed every sign-in, whatever the
       member is currently displaying. Only `avatarUrl` is theirs to clear, so
       this is what makes removing a picture reversible — and it also means a
       photo changed on the Google account stops going stale here. */
    if (payload.picture) user.googlePhotoUrl = payload.picture;
    user.lastLoginAt = new Date();
    stampTermsAgreement(user);
    await user.save();

    logger.info('auth.google_login', { userId: String(user._id), deletion });
    res.json({ ...issueSession(res, user), deletionCancelled: deletion === 'cancelled' });
  } catch (err) {
    logger.warn('auth.google_failed', { error: String(err) });
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

/* ── POST /api/auth/dev-login ──
 * Development-only session. Double-gated in config: requires
 * ALLOW_DEV_LOGIN=true AND NODE_ENV !== 'production'. */
const devLoginSchema = z.object({
  email: z.string().email().max(120).optional(),
  displayName: z.string().min(1).max(60).optional(),
  role: z.enum(['user', 'creator', 'admin']).optional(),
});

router.post('/dev-login', async (req, res) => {
  if (!env.allowDevLogin) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const parsed = devLoginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const email = (parsed.data.email || 'dev@cyberkhana.local').toLowerCase();

  try {
    let user = await User.findOne({ email });
    // Same rule as a Google sign-in, so the grace period can be tried locally.
    const deletion = user ? await settleDeletionAtSignIn(user) : 'none';
    if (!user || deletion === 'deleted') {
      user = new User({
        email,
        displayName: parsed.data.displayName || 'Dev User',
        role: parsed.data.role || 'admin',
      });
    } else if (parsed.data.role) {
      user.role = parsed.data.role;
    }
    user.lastLoginAt = new Date();
    stampTermsAgreement(user);
    await user.save();

    logger.info('auth.dev_login', { userId: String(user._id), role: user.role, deletion });
    res.json({ ...issueSession(res, user), deletionCancelled: deletion === 'cancelled' });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ── GET /api/auth/me ── */
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

/* ── POST /api/auth/accept-creator-agreement ──
 * Records that a creator explicitly accepted the Creator Agreement.
 *
 * Unlike the Terms, this is never inferred from signing in: sections 9 and 11
 * put a perpetual licence and personal responsibility on the creator, which a
 * login notice cannot carry. Nothing is taken from the request body — the user
 * comes from the session, the version from server config, the time from the
 * server clock.
 */
router.post('/accept-creator-agreement', authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.role !== 'creator' && user.role !== 'admin') {
    res.status(403).json({ error: 'Only creators accept this agreement.' });
    return;
  }

  try {
    // Re-accepting is a no-op rather than an error: two tabs open on the
    // dialog should not produce a failure in one of them.
    if (!hasAcceptedCurrentCreatorAgreement(user)) {
      user.creatorAgreementAcceptedAt = new Date();
      user.creatorAgreementVersion = CURRENT_CREATOR_AGREEMENT_VERSION;
      await user.save();
    }
    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ error: 'Could not record your acceptance' });
  }
});

/* ── PATCH /api/auth/profile ── */
const profileSchema = z
  .object({
    displayName: z.string().min(1).max(60).optional(),
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[A-Za-z0-9_]+$/, 'Letters, numbers and underscores only')
      .optional(),
    bio: z.string().max(500).optional(),
    /* Either a built-in avatar id, an https photo URL, or '' to go back to the
     * initial. The shape is checked here because this field is rendered as an
     * <img src> for every member on the leaderboard — an unconstrained string
     * would let one account put an arbitrary URL in front of everyone else. */
    avatarUrl: z
      .string()
      .max(512)
      .refine(
        (v) => v === '' || /^avatar:[a-z0-9-]{1,40}$/.test(v) || /^https:\/\/\S+$/.test(v),
        'Must be a built-in avatar or an https URL'
      )
      .optional(),
    university: z.string().max(120).optional(),
    country: z.string().max(80).optional(),
    preferredLang: z.enum(['en', 'ar']).optional(),
    /* Opt-in: other members see the bio only once this is true. */
    showBio: z.boolean().optional(),
    /* Each platform mapped to what the member typed ('' clears it). Every value goes
     * through normalizeSocial below; the shape is all that is checked here. */
    socials: z.record(z.string().max(20), z.string().max(300)).optional(),
  })
  .strict();

/** Handles nobody may claim — they'd impersonate a route or a role. */
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'support', 'help', 'staff',
  'moderator', 'mod', 'official', 'cyberkhana', 'academy', 'api', 'login',
  'logout', 'profile', 'settings', 'dashboard', 'creators', 'me', 'null',
  'undefined', 'anonymous',
]);

router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile data' });
    return;
  }

  const { username, socials, ...rest } = parsed.data;

  /* Social links: each one normalised, or the whole update refused with the
     reason for the first field that fails, so nothing half-saves. Platforms
     left out of the request keep what they had. */
  let nextSocials: Record<string, string> | undefined;
  if (socials !== undefined) {
    nextSocials = { ...publicSocials(req.user!.socials) };
    for (const [platform, raw] of Object.entries(socials)) {
      if (!isSocialPlatform(platform)) {
        res.status(400).json({ error: 'Unknown social platform', field: platform });
        return;
      }
      const result = normalizeSocial(platform, raw);
      if (!result.ok) {
        res.status(400).json({ error: result.reason, field: platform });
        return;
      }
      if (result.value) nextSocials[platform] = result.value;
      else delete nextSocials[platform];
    }
  }

  if (username !== undefined) {
    const handle = username.toLowerCase();
    if (RESERVED_USERNAMES.has(handle)) {
      res.status(409).json({ error: 'That username is reserved' });
      return;
    }
    // Case-insensitive check so "Sara" can't shadow an existing "sara".
    const clash = await User.findOne({ username: handle, _id: { $ne: req.user!._id } })
      .select('_id')
      .lean();
    if (clash) {
      res.status(409).json({ error: 'That username is already taken' });
      return;
    }
    req.user!.username = handle;
  }

  try {
    Object.assign(req.user!, rest);
    // '' is how the client says "remove my picture". Clear the path outright
    // rather than storing an empty string, so `avatarUrl` is either a real
    // value or absent — never a third, falsy-but-present state to reason about.
    if (rest.avatarUrl === '') req.user!.set('avatarUrl', undefined);
    if (nextSocials !== undefined) {
      req.user!.set('socials', Object.keys(nextSocials).length ? nextSocials : undefined);
    }
    await req.user!.save();
    res.json({ user: publicUser(req.user!) });
  } catch (err) {
    // A racing request can still win the unique index between our check and
    // the save; report it as the conflict it is rather than a 500.
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'That username is already taken' });
      return;
    }
    logger.warn('auth.profile_update_failed', { error: String(err) });
    res.status(500).json({ error: 'Profile update failed' });
  }
});

/* ── POST /api/auth/request-deletion ──
 * The member asks for their own account to be deleted. Nothing is deleted
 * yet: from here on every session this account has is refused, other members
 * stop seeing it, and it is deleted DELETION_GRACE_DAYS later unless they sign
 * in again first, which withdraws the request (utils/accountDeletion.ts).
 *
 * Admins are refused, as they are for a ban in routes/admin.ts: the last admin
 * leaving would leave nobody able to run the Academy, so another admin has to
 * change their role first. */
router.post('/request-deletion', authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === 'admin') {
    res.status(403).json({
      error: 'An admin account cannot be deleted. Ask another admin to change your role first.',
    });
    return;
  }

  try {
    scheduleDeletion(user);
    await user.save();
    clearAuthCookie(res);
    logger.info('auth.deletion_requested', {
      userId: String(user._id),
      scheduledFor: user.deletionScheduledFor,
    });
    res.json({ ok: true, deletionScheduledFor: user.deletionScheduledFor });
  } catch (err) {
    logger.error('auth.deletion_request_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not record your request' });
  }
});

/* ── POST /api/auth/logout ── */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
