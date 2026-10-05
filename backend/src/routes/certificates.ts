import { Router } from 'express';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';
import Certificate, { type ICertificate } from '../models/Certificate';
import ExamAttempt from '../models/ExamAttempt';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { isPlainObject } from '../utils/contentStatus';
import { oneAtATime } from '../utils/serial';
import { logger } from '../utils/logger';
import { EXAM_DEFAULTS, cleanCertificateName, shownPercent } from '../shared/exam';
import { findPublishedPath } from './exams';

/* ─── Certificates of achievement ───
 *
 * Awarded for one thing: passing the final exam of a learning path, which
 * only someone who finished the path can sit (routes/exams.ts). The learner
 * claims it, confirming the name to print, and from then on it is a public
 * page: anyone holding its link can see who it was issued to, for what, and
 * whether it still stands.
 *
 * That page is the one place the Academy shows anything to someone who is
 * not signed in, so what it shows is an allowlist (publicCertificate): no
 * account id, no score, nothing that leads to another record.
 */

const router = Router();

/** 128 random bits as hex: unguessable, and safe in a URL. */
const certificateCode = () => randomBytes(16).toString('hex');

/** Stored on a profile when its owner is not at a university (data/iraqUniversities.ts). */
const NOT_ENROLLED = '__not_enrolled__';

/** The only certificate fields that ever leave the server for the public. */
export function publicCertificate(certificate: Pick<ICertificate, keyof ICertificate>) {
  return {
    code: certificate.code,
    name: certificate.name,
    username: certificate.username ?? null,
    university: certificate.university ?? null,
    pathTitle: certificate.pathTitle,
    difficulty: certificate.difficulty,
    stepCount: certificate.stepCount,
    lessonCount: certificate.lessonCount,
    hours: Math.max(1, Math.round(certificate.minutes / 60)),
    syllabus: certificate.syllabus ?? [],
    practical: certificate.practical === true,
    distinction: certificate.distinction === true,
    pathCompletedAt: certificate.pathCompletedAt,
    issuedAt: certificate.issuedAt,
    revoked: Boolean(certificate.revokedAt),
  };
}

/* The public lookup. Codes cannot be guessed, and this keeps anyone from
   trying at a rate that would matter. */
const verifyLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

const claimLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String((req as AuthRequest).user?._id ?? 'anonymous'),
  message: { error: 'Too many requests, slow down.', code: 'RATE_LIMITED' },
});

/* ── GET /api/certificates/verify/:code ── anyone, signed in or not. */
router.get('/verify/:code', verifyLimiter, async (req, res) => {
  const code = String(req.params.code ?? '').toLowerCase();
  if (!/^[a-f\d]{32}$/.test(code)) {
    res.status(404).json({ error: 'Certificate not found' });
    return;
  }
  try {
    const certificate = await Certificate.findOne({ code }).lean();
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    res.json({ certificate: publicCertificate(certificate as unknown as ICertificate) });
  } catch (err) {
    logger.error('certificate.verify_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not verify the certificate' });
  }
});

/* ── GET /api/certificates/mine ── what I hold, and what I have earned and
 * not yet claimed. */
router.get('/mine', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const [certificates, passed] = await Promise.all([
      Certificate.find({ userId }).sort({ issuedAt: -1 }).lean(),
      ExamAttempt.find({ userId, status: 'submitted', passed: true }).select('ownerId pathId award earned total').lean(),
    ]);
    const held = new Set(certificates.map((c) => `${String(c.ownerId)}:${c.pathId}`));
    res.json({
      certificates: certificates.map((c) => ({
        ...publicCertificate(c as unknown as ICertificate),
        // The holder's own view: their score, and why it was withdrawn if it was.
        scorePercent: c.scorePercent,
        revokedReason: c.revokedAt ? c.revokedReason ?? null : null,
      })),
      claimable: passed
        .filter((a) => a.award?.certificate && !held.has(`${String(a.ownerId)}:${a.pathId}`))
        .map((a) => ({ pathId: a.pathId, pathTitle: a.award!.pathTitle, pathSlug: a.award!.pathSlug })),
      /** The name printed last time, offered again for the next one. */
      name: req.user!.certificateName ?? null,
    });
  } catch (err) {
    logger.error('certificate.mine_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load your certificates' });
  }
});

const claimSchema = z
  .object({
    pathId: z.string().min(1).max(160),
    name: z.string().max(200),
    /** Print my university under my name. Off unless asked for. */
    showUniversity: z.boolean().optional(),
  })
  .strict();

/* ── POST /api/certificates/claim ── issue my certificate for a path whose
 * exam I passed, with the name I confirm. Claiming twice gives the same one. */
router.post('/claim', authenticate, claimLimiter, async (req: AuthRequest, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const user = req.user!;
  const { pathId, showUniversity } = parsed.data;

  try {
    const outcome = await oneAtATime(`certificate:${String(user._id)}`, async () => {
      const attempt = await ExamAttempt.findOne({ userId: user._id, pathId, status: 'submitted', passed: true })
        .sort({ submittedAt: -1 })
        .select('-sections -answers -results');
      if (!attempt || !attempt.award) {
        return { status: 404, body: { error: 'Pass the final exam to earn this certificate', code: 'NOT_PASSED' } };
      }

      const existing = await Certificate.findOne({ userId: user._id, ownerId: attempt.ownerId, pathId }).lean();
      if (existing) {
        return { status: 200, body: { certificate: publicCertificate(existing as unknown as ICertificate) } };
      }

      /* Entitled if the path awarded one when the exam was sat, or does now:
         a certificate switched on afterwards reaches those who had passed. */
      let entitled = attempt.award.certificate === true;
      if (!entitled) {
        const now = await findPublishedPath(pathId);
        entitled =
          !!now &&
          now.ownerId === String(attempt.ownerId) &&
          isPlainObject(now.path.certificate) &&
          now.path.certificate.enabled === true;
      }
      if (!entitled) {
        return { status: 409, body: { error: 'This path does not award a certificate', code: 'NO_CERTIFICATE' } };
      }

      const name = cleanCertificateName(parsed.data.name);
      if (!name) {
        return {
          status: 400,
          body: { error: 'Enter your name as it should be printed: letters only, 2 to 80 characters.', code: 'BAD_NAME' },
        };
      }

      const percent = shownPercent(attempt.earned ?? 0, attempt.total ?? 0);
      const university =
        showUniversity && user.university && user.university !== NOT_ENROLLED ? user.university : undefined;
      const award = attempt.award;

      const certificate = await Certificate.findOneAndUpdate(
        { userId: user._id, ownerId: attempt.ownerId, pathId },
        {
          $setOnInsert: {
            code: certificateCode(),
            pathSlug: award.pathSlug,
            name,
            ...(user.username ? { username: user.username } : {}),
            ...(university ? { university } : {}),
            pathTitle: award.pathTitle,
            difficulty: award.difficulty,
            stepCount: award.stepCount,
            lessonCount: award.lessonCount,
            minutes: award.minutes,
            syllabus: award.syllabus ?? [],
            practical: attempt.practical === true,
            distinction: percent >= EXAM_DEFAULTS.distinctionPercent,
            scorePercent: percent,
            attemptId: attempt._id,
            pathCompletedAt: award.pathCompletedAt,
            issuedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).lean();

      user.certificateName = name;
      await user.save();

      logger.info('certificate.issued', { userId: String(user._id), pathId, code: certificate!.code });
      return { status: 201, body: { certificate: publicCertificate(certificate as unknown as ICertificate) } };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('certificate.claim_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not issue the certificate' });
  }
});

/* ── Admin ── */

/* ── GET /api/certificates/admin ── every certificate of one path, by name. */
router.get('/admin', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const pathId = typeof req.query.pathId === 'string' ? req.query.pathId.slice(0, 160) : '';
  const owner = typeof req.query.owner === 'string' && mongoose.isValidObjectId(req.query.owner) ? req.query.owner : '';
  if (!pathId) {
    res.status(400).json({ error: 'A pathId is required' });
    return;
  }
  try {
    const certificates = await Certificate.find({ pathId, ...(owner ? { ownerId: owner } : {}) })
      .sort({ issuedAt: -1 })
      .limit(500)
      .lean();
    res.json({
      certificates: certificates.map((c) => ({
        ...publicCertificate(c as unknown as ICertificate),
        userId: String(c.userId),
        scorePercent: c.scorePercent,
        revokedAt: c.revokedAt ?? null,
        revokedReason: c.revokedReason ?? null,
      })),
    });
  } catch (err) {
    logger.error('certificate.admin_list_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load certificates' });
  }
});

const codeOf = (raw: unknown): string | null => {
  const code = String(raw ?? '').toLowerCase();
  return /^[a-f\d]{32}$/.test(code) ? code : null;
};

/* ── POST /api/certificates/admin/:code/revoke ── withdraw it. The page stays,
 * and says so: a link somebody was shown should not quietly start to 404. */
router.post('/admin/:code/revoke', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const code = codeOf(req.params.code);
  const parsed = z.object({ reason: z.string().trim().min(3).max(300) }).strict().safeParse(req.body);
  if (!code || !parsed.success) {
    res.status(400).json({ error: 'A reason is required' });
    return;
  }
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { code },
      { $set: { revokedAt: new Date(), revokedReason: parsed.data.reason, revokedBy: req.user!._id } },
      { new: true }
    ).lean();
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    logger.warn('certificate.revoked', { by: String(req.user!._id), code, userId: String(certificate.userId) });
    res.json({ ok: true });
  } catch (err) {
    logger.error('certificate.revoke_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not revoke the certificate' });
  }
});

/* ── POST /api/certificates/admin/:code/restore ── undo a revocation. */
router.post('/admin/:code/restore', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const code = codeOf(req.params.code);
  if (!code) {
    res.status(404).json({ error: 'Certificate not found' });
    return;
  }
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { code },
      { $unset: { revokedAt: 1, revokedReason: 1, revokedBy: 1 } },
      { new: true }
    ).lean();
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    logger.warn('certificate.restored', { by: String(req.user!._id), code });
    res.json({ ok: true });
  } catch (err) {
    logger.error('certificate.restore_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not restore the certificate' });
  }
});

/* ── POST /api/certificates/admin/:code/reissue ── correct the printed name.
 * The code stays the same, so a link already shared keeps working. */
router.post('/admin/:code/reissue', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const code = codeOf(req.params.code);
  const name = cleanCertificateName((req.body ?? {}).name);
  if (!code || !name) {
    res.status(400).json({ error: 'Enter the name as it should be printed: letters only, 2 to 80 characters.' });
    return;
  }
  try {
    const certificate = await Certificate.findOneAndUpdate({ code }, { $set: { name } }, { new: true }).lean();
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    await User.updateOne({ _id: certificate.userId }, { $set: { certificateName: name } });
    logger.warn('certificate.reissued', { by: String(req.user!._id), code });
    res.json({ certificate: publicCertificate(certificate as unknown as ICertificate) });
  } catch (err) {
    logger.error('certificate.reissue_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not reissue the certificate' });
  }
});

export default router;
