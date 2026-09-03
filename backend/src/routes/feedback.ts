import { Router } from 'express';
import { z } from 'zod';
import Feedback, { FEEDBACK_TRACKS, type FeedbackTrack } from '../models/Feedback';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

const feedbackSchema = z
  .object({
    track: z.enum(FEEDBACK_TRACKS),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).default(''),
    contextId: z.string().min(1).max(200),
    contextTitle: z.string().max(300).default(''),
    contextSub: z.string().max(200).optional(),
    lang: z.enum(['en', 'ar']).default('en'),
  })
  .strict();

function isTrack(value: unknown): value is FeedbackTrack {
  return typeof value === 'string' && (FEEDBACK_TRACKS as readonly string[]).includes(value);
}

/* ── POST /api/feedback ──
 * Record one learner's rating. Re-rating the same content replaces the earlier
 * answer rather than stacking a second row, so the averages a creator reads
 * are one-per-learner. */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid feedback payload' });
    return;
  }

  const user = req.user!;
  const { track, contextId, ...rest } = parsed.data;

  try {
    await Feedback.findOneAndUpdate(
      { userId: user._id, track, contextId },
      { $set: { ...rest, userName: user.displayName, userId: user._id, track, contextId } },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error('feedback.post_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save feedback' });
  }
});

/* ── GET /api/feedback/summary ──
 * Per-track totals, averages and rating distribution: everything the three
 * overview cards need in one round trip. Creators and admins only. */
router.get('/summary', authenticate, requireRole('creator', 'admin'), async (_req, res) => {
  try {
    const rows = await Feedback.aggregate<{
      _id: { track: string; rating: number };
      count: number;
    }>([{ $group: { _id: { track: '$track', rating: '$rating' }, count: { $sum: 1 } } }]);

    const summary: Record<string, { total: number; sum: number; distribution: number[] }> = {};
    for (const track of FEEDBACK_TRACKS) {
      summary[track] = { total: 0, sum: 0, distribution: [0, 0, 0, 0, 0] };
    }

    for (const row of rows) {
      const bucket = summary[row._id.track];
      if (!bucket) continue;
      bucket.total += row.count;
      bucket.sum += row._id.rating * row.count;
      bucket.distribution[row._id.rating - 1] += row.count;
    }

    res.json({
      summary: Object.fromEntries(
        FEEDBACK_TRACKS.map((track) => {
          const b = summary[track];
          return [
            track,
            {
              total: b.total,
              average: b.total > 0 ? b.sum / b.total : 0,
              distribution: b.distribution,
            },
          ];
        })
      ),
    });
  } catch (err) {
    logger.error('feedback.summary_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load feedback summary' });
  }
});

/* ── GET /api/feedback?track=…&limit=…&skip=… ──
 * Newest-first responses for one track. Creators and admins only. */
router.get('/', authenticate, requireRole('creator', 'admin'), async (req, res) => {
  const track = req.query.track;
  if (!isTrack(track)) {
    res.status(400).json({ error: 'Unknown track' });
    return;
  }

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const skip = Math.max(0, parseInt(String(req.query.skip ?? 0), 10) || 0);

  try {
    const [docs, total] = await Promise.all([
      Feedback.find({ track }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments({ track }),
    ]);

    res.json({
      total,
      entries: docs.map((d) => ({
        id: String(d._id),
        userName: d.userName,
        rating: d.rating,
        comment: d.comment ?? '',
        contextId: d.contextId,
        contextTitle: d.contextTitle ?? '',
        contextSub: d.contextSub,
        lang: d.lang ?? 'en',
        createdAt: (d.createdAt as Date | undefined)?.toISOString() ?? '',
      })),
    });
  } catch (err) {
    logger.error('feedback.list_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load feedback' });
  }
});

export default router;
