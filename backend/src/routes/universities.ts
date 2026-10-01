import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import University, { IUniversity } from '../models/University';
import User from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  UNIVERSITY_NAME_MAX,
  UNIVERSITY_NAME_MIN,
  cleanUniversityName,
  universityKey,
  universityNameProblem,
} from '../shared/universities';

/* ─── Universities an admin has added ───
 *
 * The built-in list ships in shared/universities.ts. These are the ones it
 * misses, added from the Members area so that a missing university is a form
 * to fill in and not a code change.
 *
 * No step-up confirmation, unlike a promotion: an entry here grants nothing,
 * reaches nobody until they choose it, and is undone by removing it.
 */

const router = Router();

function shape(u: Pick<IUniversity, '_id' | 'name' | 'ar' | 'type'>) {
  return { id: String(u._id), name: u.name, ar: u.ar || undefined, type: u.type };
}

const PROBLEMS: Record<NonNullable<ReturnType<typeof universityNameProblem>>, string> = {
  short: `A name needs at least ${UNIVERSITY_NAME_MIN} characters`,
  long: `A name can be at most ${UNIVERSITY_NAME_MAX} characters`,
  reserved: 'That name is reserved',
  builtin: 'That university is already on the list',
};

const isDuplicateKey = (err: unknown) => (err as { code?: number }).code === 11000;

/* ── GET /api/universities ── the added ones, for every member's picker. */
router.get('/', authenticate, async (_req: AuthRequest, res) => {
  try {
    const docs = await University.find({}).sort({ name: 1 }).select('name ar type').lean();
    res.json({ universities: docs.map(shape) });
  } catch (err) {
    logger.error('universities.list_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load universities' });
  }
});

/* ── GET /api/universities/manage ── the same list for the admin page, with
 * how many members have chosen each, so removing or renaming one is done
 * knowing who it touches. */
router.get('/manage', authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const docs = await University.find({}).sort({ name: 1 }).select('name ar type createdAt').lean();
    const counts = await User.aggregate<{ _id: string; members: number }>([
      { $match: { university: { $in: docs.map((d) => d.name) } } },
      { $group: { _id: '$university', members: { $sum: 1 } } },
    ]);
    const members = new Map(counts.map((c) => [c._id, c.members]));
    res.json({
      universities: docs.map((d) => ({ ...shape(d), members: members.get(d.name) ?? 0, createdAt: d.createdAt })),
    });
  } catch (err) {
    logger.error('universities.manage_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load universities' });
  }
});

/* The name is checked after tidying (shared/universities.ts), so the limits
   here only bound the request; '' for the Arabic name means "none". */
const createSchema = z
  .object({
    name: z.string().max(300),
    ar: z.string().max(300).optional(),
    type: z.enum(['public', 'private']),
  })
  .strict();

/* ── POST /api/universities ── add one. */
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid university' });
    return;
  }
  const name = cleanUniversityName(parsed.data.name);
  const problem = universityNameProblem(name);
  if (problem) {
    res.status(problem === 'builtin' ? 409 : 400).json({ error: PROBLEMS[problem], field: 'name' });
    return;
  }
  const ar = cleanUniversityName(parsed.data.ar);
  if (ar.length > UNIVERSITY_NAME_MAX) {
    res.status(400).json({ error: PROBLEMS.long, field: 'ar' });
    return;
  }

  try {
    const doc = await University.create({
      name,
      key: universityKey(name),
      ar: ar || undefined,
      type: parsed.data.type,
      addedBy: req.user!._id,
    });
    logger.info('admin.university_added', { by: String(req.user!._id), name });
    res.status(201).json({ university: { ...shape(doc), members: 0, createdAt: doc.createdAt } });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: 'That university has already been added', field: 'name' });
      return;
    }
    logger.error('admin.university_add_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not add the university' });
  }
});

const updateSchema = z
  .object({
    name: z.string().max(300).optional(),
    ar: z.string().max(300).optional(),
    type: z.enum(['public', 'private']).optional(),
  })
  .strict();

/* ── PATCH /api/universities/:id ── correct one.
 * A profile stores the name, so a rename is carried to every member who
 * chose the old one: fixing a typo must not empty a university's board. */
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!mongoose.isValidObjectId(id) || !parsed.success) {
    res.status(parsed.success ? 404 : 400).json({ error: parsed.success ? 'University not found' : 'Invalid university' });
    return;
  }

  try {
    const doc = await University.findById(id);
    if (!doc) {
      res.status(404).json({ error: 'University not found' });
      return;
    }

    const oldName = doc.name;
    if (parsed.data.name !== undefined) {
      const name = cleanUniversityName(parsed.data.name);
      const problem = universityNameProblem(name);
      if (problem) {
        res.status(problem === 'builtin' ? 409 : 400).json({ error: PROBLEMS[problem], field: 'name' });
        return;
      }
      doc.name = name;
      doc.key = universityKey(name);
    }
    if (parsed.data.ar !== undefined) {
      const ar = cleanUniversityName(parsed.data.ar);
      if (ar.length > UNIVERSITY_NAME_MAX) {
        res.status(400).json({ error: PROBLEMS.long, field: 'ar' });
        return;
      }
      doc.set('ar', ar || undefined);
    }
    if (parsed.data.type !== undefined) doc.type = parsed.data.type;
    await doc.save();

    let moved = 0;
    if (doc.name !== oldName) {
      const result = await User.updateMany({ university: oldName }, { $set: { university: doc.name } });
      moved = result.modifiedCount;
      logger.info('admin.university_renamed', { by: String(req.user!._id), from: oldName, to: doc.name, moved });
    }
    const members = await User.countDocuments({ university: doc.name });
    res.json({ university: { ...shape(doc), members, createdAt: doc.createdAt }, moved });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: 'That university has already been added', field: 'name' });
      return;
    }
    logger.error('admin.university_update_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not update the university' });
  }
});

/* ── DELETE /api/universities/:id ── stop offering one.
 * Members who chose it keep it on their profile and their board: taking a
 * university off the list is not a reason to take it off anybody. */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: 'University not found' });
    return;
  }
  try {
    const doc = await University.findByIdAndDelete(id);
    if (!doc) {
      res.status(404).json({ error: 'University not found' });
      return;
    }
    logger.info('admin.university_removed', { by: String(req.user!._id), name: doc.name });
    res.json({ ok: true });
  } catch (err) {
    logger.error('admin.university_remove_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not remove the university' });
  }
});

export default router;
