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
    /* Optional: a client cached from before module enrolment existed still
       validates, and an absent key is left alone by the $set below rather
       than clearing what the server already holds. */
    enrolledModules: idArray.optional(),
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
            enrolledModules: doc.enrolledModules ?? [],
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

    /* Mirror the total onto the user and book any gain into the current month.
       The month key rolls over on the 1st, which "resets" everyone's monthly
       standing with no scheduled job.

       The client sends what it derived from the learner's completions, which is
       the whole history and not a running score — so it cannot be taken as the
       board standing directly. An admin reset works by raising the baseline to
       whatever had been earned; the board shows the distance travelled since,
       and the next push, restating the same history, adds nothing. Without that
       subtraction the first sync after a reset would undo it. */
    if (points !== undefined) {
      const user = req.user!;
      const month = currentMonthKey();
      const standing = Math.max(0, points - (user.pointsBaseline ?? 0));
      const delta = Math.max(0, standing - (user.points ?? 0));
      user.pointsRaw = points;
      user.points = standing;
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
