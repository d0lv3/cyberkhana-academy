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

const router = Router();
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

/** Public-safe projection of a user document. */
function publicUser(user: IUser) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    preferredLang: user.preferredLang,
    university: user.university,
    country: user.country,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

function issueSession(res: Response, user: IUser) {
  const token = signToken(String(user._id));
  setAuthCookie(res, token);
  return { user: publicUser(user) };
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
      // Link by verified email if the account already exists, else create.
      user = await User.findOne({ email: payload.email.toLowerCase() });
      if (user) {
        user.oauthProviders.google = { id: payload.sub, email: payload.email };
      } else {
        user = new User({
          email: payload.email,
          displayName: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture,
          oauthProviders: { google: { id: payload.sub, email: payload.email } },
        });
      }
    }
    if (user.isBanned) {
      res.status(403).json({ error: 'Account unavailable' });
      return;
    }
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('auth.google_login', { userId: String(user._id) });
    res.json(issueSession(res, user));
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
    if (!user) {
      user = new User({
        email,
        displayName: parsed.data.displayName || 'Dev User',
        role: parsed.data.role || 'admin',
      });
    } else if (parsed.data.role) {
      user.role = parsed.data.role;
    }
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('auth.dev_login', { userId: String(user._id), role: user.role });
    res.json(issueSession(res, user));
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ── GET /api/auth/me ── */
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

/* ── PATCH /api/auth/profile ── */
const profileSchema = z
  .object({
    displayName: z.string().min(1).max(60).optional(),
    bio: z.string().max(500).optional(),
    university: z.string().max(120).optional(),
    country: z.string().max(80).optional(),
    preferredLang: z.enum(['en', 'ar']).optional(),
  })
  .strict();

router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid profile data' });
    return;
  }
  try {
    Object.assign(req.user!, parsed.data);
    await req.user!.save();
    res.json({ user: publicUser(req.user!) });
  } catch {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

/* ── POST /api/auth/logout ── */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
