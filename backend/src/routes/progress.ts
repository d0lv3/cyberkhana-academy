import { Router } from 'express';
import { z } from 'zod';
import Progress from '../models/Progress';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkSafeJson } from '../utils/sanitize';
import { currentMonthKey } from '../utils/time';
import { logger } from '../utils/logger';

const router = Router();

const idArray = z.array(z.string().min(1).max(160)).max(2000);

const snapshotSchema = z
  .object({
    programming: z.record(z.string().min(1).max(80), idArray).refine(
      (r) => Object.keys(r).length <= 50,
      'Too many languages'
    ),
    osModules: z.record(z.string().min(1).max(160), idArray).refine(
      (r) => Object.keys(r).length <= 200,
      'Too many modules'
    ),
    networking: idArray,
    enrolledPaths: idArray,
    /** Client-computed leaderboard points total (deterministic from completions). */
    points: z.number().int().min(0).max(100_000_000).optional(),
    lastActivity: z
      .object({
        kind: z.enum(['programming', 'networking', 'os']),
        route: z.string().min(1).max(400),
        title: z.object({ en: z.string().max(300), ar: z.string().max(300) }),
        context: z.string().max(200).optional(),
        at: z.string().max(40),
      })
      .nullable(),
  })
  .strict();

/* ── GET /api/progress ── my snapshot. */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const doc = await Progress.findOne({ userId: req.user!._id }).lean();
    res.json({
      progress: doc
        ? {
            programming: doc.programming ?? {},
            osModules: doc.osModules ?? {},
            networking: doc.networking ?? [],
            enrolledPaths: doc.enrolledPaths ?? [],
            lastActivity: doc.lastActivity ?? null,
          }
        : null,
    });
  } catch (err) {
    logger.error('progress.get_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load progress' });
  }
});

/* ── PUT /api/progress ── replace my snapshot (client pushes debounced). */
router.put('/', authenticate, async (req: AuthRequest, res) => {
  const parsed = snapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid progress payload' });
    return;
  }
  const safety = checkSafeJson(parsed.data);
  if (!safety.ok) {
    res.status(400).json({ error: safety.reason ?? 'Unsafe payload' });
    return;
  }

  // `points` lives on the User (for leaderboards), not the Progress snapshot.
  const { points, ...snapshot } = parsed.data;

  try {
    await Progress.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: snapshot },
      { upsert: true, new: true }
    );

    // Mirror the total onto the user and book any gain into the current month.
    // The month key rolls over on the 1st, which "resets" everyone's monthly
    // standing with no scheduled job.
    if (points !== undefined) {
      const user = req.user!;
      const month = currentMonthKey();
      const delta = Math.max(0, points - (user.points ?? 0));
      user.points = points;
      if (user.monthlyPointsMonth !== month) {
        user.monthlyPointsMonth = month;
        user.monthlyPoints = 0;
      }
      user.monthlyPoints += delta;
      await user.save();
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error('progress.put_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save progress' });
  }
});

export default router;
