import { Router } from 'express';
import { z } from 'zod';
import Progress from '../models/Progress';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkSafeJson } from '../utils/sanitize';
import { currentMonthKey } from '../utils/time';
import { logger } from '../utils/logger';
import { scoreProgress } from '../utils/xpCatalog';
import { restateUserXp } from '../utils/xpMigration';
import { XP_FORMULA_VERSION } from '../shared/xp';
import { streakFrom } from '../shared/streak';
import {
  awardStreakBreakpoints,
  creditDay,
  newCompletionCount,
  resolveStudyDay,
  trimStudyDays,
} from '../utils/studyDays';

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
    /** Sent by clients from before server-side scoring. Accepted so they still
     *  validate, and ignored: the server scores the completions itself. */
    points: z.number().int().min(0).max(100_000_000).optional(),
    /** The pusher's own calendar day, so a streak turns over at their
     *  midnight rather than UTC's. Held to a day either side of the server's
     *  in resolveStudyDay, and absent from an older client, which then just
     *  gets the server's day. */
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
    const user = req.user!;
    if (user.xpVersion !== XP_FORMULA_VERSION) await restateUserXp(user);
    const doc = await Progress.findOne({ userId: user._id }).lean();
    res.json({
      progress: doc
        ? {
            programming: doc.programming ?? {},
            osModules: doc.osModules ?? {},
            networking: doc.networking ?? [],
            enrolledPaths: doc.enrolledPaths ?? [],
            enrolledModules: doc.enrolledModules ?? [],
            finishedModules: doc.finishedModules ?? [],
            studyDays: doc.studyDays ?? {},
            lastActivity: doc.lastActivity ?? null,
          }
        : null,
      /** Lifetime XP as the server scored it. */
      xp: user.pointsRaw ?? 0,
      /** The streak ladder, so the card can draw before the first push. */
      streakGoal: user.streakGoal ?? null,
      streakAwarded: user.streakAwarded ?? [],
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

  // A total from an older client is dropped here: see `points` above. The
  // day is not part of the snapshot either; it only says which day to credit.
  const { points: _clientTotal, day: claimedDay, ...snapshot } = parsed.data;

  try {
    const user = req.user!;
    // Still in an older formula's units: restate from what was stored before
    // this push, so the push's own gains are still booked below.
    if (user.xpVersion !== XP_FORMULA_VERSION) await restateUserXp(user);

    /* What the server already had, read before the write so this push's own
       completions can be told apart from the ones it has seen before. */
    const existing = await Progress.findOne({ userId: user._id }).lean();
    const studyDay = resolveStudyDay(claimedDay);
    const fresh = newCompletionCount(
      existing && {
        programming: existing.programming,
        osModules: existing.osModules,
        networking: existing.networking,
      },
      snapshot
    );
    const studyDays = trimStudyDays(
      fresh > 0 ? creditDay(existing?.studyDays, studyDay, fresh) : existing?.studyDays ?? {},
      studyDay
    );

    const progress = await Progress.findOneAndUpdate(
      { userId: user._id },
      { $set: { ...snapshot, studyDays } },
      { upsert: true, new: true }
    );
    if (!progress) throw new Error('progress upsert returned nothing');

    /* The streak the server can vouch for, and whatever rungs it just paid. */
    const streak = streakFrom(studyDays, studyDay);
    const award = awardStreakBreakpoints(user, streak.current);
    if (award.gained) {
      logger.info('streak.breakpoints_paid', {
        userId: String(user._id),
        streak: streak.current,
        days: award.reached.map((b) => b.days),
        xp: award.gained,
      });
    }

    /* Scored here from the completions, against published content only, so
       unknown or unpublished ids count for nothing. A module seen complete is
       remembered, which keeps its finishing bonus when a lesson is added. */
    const finishedBefore = progress.finishedModules ?? [];
    const { xp, finishedNow } = await scoreProgress(progress, finishedBefore);
    const added = finishedNow.filter((key) => !finishedBefore.includes(key));
    if (added.length) {
      await Progress.updateOne({ _id: progress._id }, { $addToSet: { finishedModules: { $each: added } } });
    }

    /* Book any gain into the current month. The month key rolls over on the
       1st, which "resets" everyone's monthly standing with no scheduled job.

       The score is the whole history, not a running total, so it cannot be
       taken as the board standing directly. An admin reset works by raising
       the baseline to whatever had been earned; the board shows the distance
       travelled since, and the next push, restating the same history, adds
       nothing. Without that subtraction the first sync after a reset would
       undo it. The level reads `pointsRaw`, which a reset leaves alone. */
    const month = currentMonthKey();
    /* Total XP is what the content scored, plus what an admin awarded, plus
       what the streak has paid. Both of those have to be re-added here rather
       than left in the stored total, because this line restates that total
       from the content on every sync and would wipe them otherwise. One
       total: the level, the profile and the board all read it, and the board
       subtracts the reset baseline. */
    const total = xp + (user.pointsAdjustment ?? 0) + (user.streakPoints ?? 0);
    const standing = Math.max(0, total - (user.pointsBaseline ?? 0));
    const delta = Math.max(0, standing - (user.points ?? 0));
    user.pointsRaw = total;
    user.points = standing;
    if (user.monthlyPointsMonth !== month) {
      user.monthlyPointsMonth = month;
      user.monthlyPoints = 0;
    }
    user.monthlyPoints += delta;
    await user.save();

    res.json({
      ok: true,
      xp,
      finishedModules: [...finishedBefore, ...added],
      studyDays,
      streak: streak.current,
      /* Named so the client can throw the card for a rung the moment it is
         paid, rather than waiting to notice on the next dashboard. */
      streakAwarded: award.reached.map((b) => b.days),
      streakXpGained: award.gained,
    });
  } catch (err) {
    logger.error('progress.put_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save progress' });
  }
});

export default router;
