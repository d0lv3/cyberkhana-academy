import { Router } from 'express';
import { randomInt } from 'crypto';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import ContentBucket from '../models/ContentBucket';
import ContentGrant from '../models/ContentGrant';
import Progress from '../models/Progress';
import User, { type IUser } from '../models/User';
import ExamAttempt, { type AttemptSection, type AttemptTask, type IExamAttempt } from '../models/ExamAttempt';
import Certificate from '../models/Certificate';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { isPlainObject, isPublishedItem, type AnyItem } from '../utils/contentStatus';
import { getXpCatalog } from '../utils/xpCatalog';
import { pathStanding, stepKeyOf, type PathStanding } from '../utils/pathCompletion';
import { oneAtATime } from '../utils/serial';
import { logger } from '../utils/logger';
import {
  EXAM_DEFAULTS,
  examInfoOf,
  isTaskComplete,
  isTaskCorrect,
  passes,
  shownPercent,
  taskPlaceholder,
} from '../shared/exam';

/* ─── A path's final exam ───
 *
 * The last stop of a learning path. It opens to a learner the server has seen
 * finish the path, is sat against the clock, and is marked here against
 * answers the browser is never sent. Passing it is what a certificate is
 * awarded for (routes/certificates.ts).
 *
 * An attempt is dealt when it starts: one version of each section, the tasks
 * drawn and shuffled, the lot copied into the attempt with its answers. From
 * then on the attempt is the only thing read, so editing the exam, pausing it
 * or taking the path down changes nothing for someone already sitting it.
 *
 * Nothing is marked until the whole attempt is handed in, and what comes back
 * is a score and the steps worth going over, never which answers were right.
 * An exam that told you would be one you could sit twice and pass.
 */

const router = Router();

/** How long after the deadline a hand-in is still taken, for the request that
 *  was already on its way when the clock ran out. */
const GRACE_MS = 30_000;

const perAccount = (limit: number, windowMs = 60_000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => String((req as AuthRequest).user?._id ?? 'anonymous'),
    message: { error: 'Too many requests, slow down.', code: 'RATE_LIMITED' },
  });
const startLimiter = perAccount(8, 10 * 60_000);
const saveLimiter = perAccount(90);
const submitLimiter = perAccount(12);

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const localized = (v: unknown): { en: string; ar: string } =>
  isPlainObject(v) ? { en: str(v.en), ar: str(v.ar) } : { en: '', ar: '' };

const pathIdSchema = z.string().min(1).max(160);
const attemptIdSchema = z.string().refine((v) => mongoose.isValidObjectId(v), 'Not an attempt');
const answersSchema = z
  .array(
    z
      .object({
        task: z.string().min(1).max(80),
        /** The option picked, in the order it was shown, or what was typed. */
        value: z.union([z.number().int().min(0).max(20), z.string().max(500)]),
      })
      .strict()
  )
  .max(2000);

/* ── Finding the path ── */

export interface PublishedPath {
  ownerId: string;
  path: AnyItem;
}

/** The published path with this id. Read in creation order, as the feed reads
 *  them, so where two creators' ids collide every side means the same one. */
export async function findPublishedPath(pathId: string): Promise<PublishedPath | null> {
  const docs = await ContentBucket.find({ bucket: 'paths' }).sort({ _id: 1 }).select('ownerId items').lean();
  for (const doc of docs) {
    for (const item of list(doc.items)) {
      if (isPlainObject(item) && item.id === pathId && isPublishedItem(item)) {
        return { ownerId: String(doc.ownerId), path: item };
      }
    }
  }
  return null;
}

const examOf = (path: AnyItem): AnyItem | null =>
  isPlainObject(path.exam) && path.exam.enabled === true ? path.exam : null;

const awardsCertificate = (path: AnyItem): boolean =>
  isPlainObject(path.certificate) && path.certificate.enabled === true;

/** The path's owner, and anyone it is shared with, hold its answers. */
async function isAuthor(user: IUser, ownerId: string): Promise<boolean> {
  if (String(user._id) === ownerId) return true;
  return !!(await ContentGrant.exists({ ownerId, granteeId: user._id, bucket: 'paths' }));
}

/* ── Has the learner finished the path ── */

interface Gate {
  complete: boolean;
  standing: PathStanding;
  completedAt: Date | null;
}

/** Whether the path is finished, by the server's own record. The first time it
 *  is seen finished is written down and kept, so a lesson added to the path
 *  afterwards does not lock the exam again. */
async function pathGate(user: IUser, ownerId: string, path: AnyItem): Promise<Gate> {
  const pathId = str(path.id);
  const [catalog, progress] = await Promise.all([getXpCatalog(), Progress.findOne({ userId: user._id }).lean()]);
  const standing = pathStanding(path, progress, catalog);
  const recorded = (progress?.completedPaths ?? []).find((c) => c.owner === ownerId && c.path === pathId);
  if (recorded) return { complete: true, standing, completedAt: recorded.at };
  if (!standing.complete) return { complete: false, standing, completedAt: null };

  const at = new Date();
  await Progress.updateOne(
    { userId: user._id, completedPaths: { $not: { $elemMatch: { owner: ownerId, path: pathId } } } },
    { $push: { completedPaths: { owner: ownerId, path: pathId, at } } }
  );
  return { complete: true, standing, completedAt: at };
}

/* ── Dealing an attempt ── */

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dealTask(task: AnyItem, stepTitles: Map<string, string>): AttemptTask {
  const base: AttemptTask = {
    id: str(task.id),
    kind: task.kind === 'mcq' || task.kind === 'flag' ? task.kind : 'text',
    prompt: str(task.prompt).trim(),
    points: typeof task.points === 'number' ? task.points : 1,
  };
  const stepKey = str(task.stepKey);
  if (stepKey && stepTitles.has(stepKey)) base.stepKey = stepKey;

  if (base.kind === 'mcq') {
    // Shown in an order of this attempt's own; the right one is kept by its place in it.
    const options = list(task.options).map((o) => str(o).trim());
    const order = shuffled(options.map((_, i) => i));
    base.options = order.map((i) => options[i]);
    base.correctIndex = order.indexOf(task.correctIndex as number);
    return base;
  }
  base.answer = str(task.answer).trim();
  if (base.kind === 'flag') {
    base.caseSensitive = task.caseSensitive === true;
    const placeholder = taskPlaceholder(task);
    if (placeholder) base.placeholder = placeholder;
  }
  return base;
}

/** One version of each section, its tasks drawn and ordered for this sitting. */
function dealAttempt(exam: AnyItem, stepTitles: Map<string, string>): AttemptSection[] {
  const sections: AttemptSection[] = [];
  for (const section of list(exam.sections).filter(isPlainObject)) {
    const versions = list(section.versions)
      .filter(isPlainObject)
      .filter((v) => list(v.tasks).some(isTaskComplete));
    if (versions.length === 0) continue;
    const version = versions[randomInt(versions.length)];
    const kind = section.kind === 'practical' ? 'practical' : 'theory';

    let tasks = list(version.tasks).filter(isPlainObject).filter(isTaskComplete);
    if (kind === 'theory') {
      // A bank: asked in a different order each time, and only some of it when it draws.
      tasks = shuffled(tasks);
      if (typeof section.drawCount === 'number' && section.drawCount > 0) tasks = tasks.slice(0, section.drawCount);
    }

    sections.push({
      id: str(section.id),
      title: str(section.title).trim(),
      kind,
      versionId: str(version.id),
      brief: localized(version.brief),
      targets: list(version.targets)
        .filter(isPlainObject)
        .map((t) => ({
          label: str(t.label).trim(),
          address: str(t.address).trim(),
          ...(typeof t.port === 'number' ? { port: t.port } : {}),
        })),
      links: list(version.links)
        .filter(isPlainObject)
        .map((l) => ({ label: str(l.label).trim(), url: str(l.url).trim() })),
      files: list(version.files)
        .filter(isPlainObject)
        .map((f) => ({ name: str(f.name), url: str(f.url), kind: str(f.kind), bytes: typeof f.bytes === 'number' ? f.bytes : 0 })),
      tasks: tasks.map((t) => dealTask(t, stepTitles)),
    });
  }
  return sections;
}

/* ── Marking ── */

/** Mark an attempt on the answers it holds and close it. */
async function finalize(attempt: IExamAttempt, timedOut: boolean, stepTitles?: Map<string, string>): Promise<void> {
  const given = new Map(attempt.answers.map((a) => [a.task, a.value]));
  const titles = stepTitles ?? new Map((attempt.review ?? []).map((r) => [r.key, r.title]));
  let earned = 0;
  let total = 0;
  const results: { task: string; ok: boolean }[] = [];
  const bySteps = new Map<string, { earned: number; total: number }>();

  for (const section of attempt.sections) {
    for (const task of section.tasks) {
      const ok = given.has(task.id) && isTaskCorrect(task, given.get(task.id));
      total += task.points;
      if (ok) earned += task.points;
      results.push({ task: task.id, ok });
      if (task.stepKey) {
        const step = bySteps.get(task.stepKey) ?? { earned: 0, total: 0 };
        step.total += task.points;
        if (ok) step.earned += task.points;
        bySteps.set(task.stepKey, step);
      }
    }
  }

  attempt.earned = earned;
  attempt.total = total;
  attempt.passed = passes(earned, total, attempt.passPercent);
  attempt.results = results;
  attempt.review = [...bySteps.entries()]
    .filter(([, step]) => step.earned < step.total)
    .map(([key, step]) => ({ key, title: titles.get(key) ?? '', ...step }));
  attempt.status = 'submitted';
  attempt.timedOut = timedOut;
  // An attempt left to run out is closed at its deadline, which is when the wait before the next one starts.
  attempt.submittedAt = timedOut ? attempt.deadline : new Date();
  if (!attempt.passed) attempt.award = undefined;
  attempt.markModified('results');
  attempt.markModified('review');
  await attempt.save();

  logger.info('exam.submitted', {
    userId: String(attempt.userId),
    pathId: attempt.pathId,
    number: attempt.number,
    earned,
    total,
    passed: attempt.passed,
    timedOut,
  });
}

/** Close an attempt whose time ran out while nobody was looking. */
async function settleExpired(userId: unknown, ownerId: string, pathId: string): Promise<void> {
  const overdue = await ExamAttempt.findOne({
    userId,
    ownerId,
    pathId,
    status: 'active',
    deadline: { $lt: new Date(Date.now() - GRACE_MS) },
  });
  if (overdue) await finalize(overdue, true, stepTitlesIn(overdue));
}

/** The step titles an attempt was dealt with, kept beside it in `review` until
 *  it is marked (see /start), so marking needs nothing but the attempt. */
function stepTitlesIn(attempt: IExamAttempt): Map<string, string> {
  return new Map((attempt.review ?? []).map((r) => [r.key, r.title]));
}

/* ── What the browser is sent ── */

function attemptView(attempt: IExamAttempt) {
  return {
    id: String(attempt._id),
    number: attempt.number,
    startedAt: attempt.startedAt,
    deadline: attempt.deadline,
    serverNow: new Date(),
    passPercent: attempt.passPercent,
    // Built field by field: nothing an attempt is marked against is in here.
    sections: attempt.sections.map((section) => ({
      id: section.id,
      title: section.title,
      kind: section.kind,
      brief: section.brief,
      targets: section.targets,
      links: section.links,
      files: section.files,
      tasks: section.tasks.map((task) => ({
        id: task.id,
        kind: task.kind,
        prompt: task.prompt,
        points: task.points,
        ...(task.kind === 'mcq' ? { options: task.options ?? [] } : {}),
        ...(task.placeholder ? { placeholder: task.placeholder } : {}),
      })),
    })),
    answers: attempt.answers,
    reported: Boolean(attempt.report),
  };
}

type AttemptLike = Pick<
  IExamAttempt,
  'number' | 'earned' | 'total' | 'passed' | 'timedOut' | 'submittedAt' | 'review' | 'passPercent'
> & { _id: unknown };

function resultView(attempt: AttemptLike) {
  const earned = attempt.earned ?? 0;
  const total = attempt.total ?? 0;
  const percent = shownPercent(earned, total);
  return {
    id: String(attempt._id),
    number: attempt.number,
    earned,
    total,
    percent,
    passPercent: attempt.passPercent,
    passed: attempt.passed === true,
    distinction: attempt.passed === true && percent >= EXAM_DEFAULTS.distinctionPercent,
    timedOut: attempt.timedOut === true,
    submittedAt: attempt.submittedAt ?? null,
    review: attempt.review ?? [],
  };
}

/* ── Where a learner stands ── */

type ExamState =
  | 'author' /* wrote it, or shares it, and so holds its answers */
  | 'locked' /* the path is not finished */
  | 'paused'
  | 'not-open'
  | 'closed'
  | 'exhausted'
  | 'cooldown'
  | 'ready'
  | 'active'
  | 'passed';

async function standingFor(user: IUser, ownerId: string, path: AnyItem) {
  const pathId = str(path.id);
  const exam = examOf(path)!;
  await settleExpired(user._id, ownerId, pathId);

  const [attempts, certificate, author, gate] = await Promise.all([
    ExamAttempt.find({ userId: user._id, ownerId, pathId }).sort({ number: 1 }).select('-sections -answers -results').lean(),
    Certificate.findOne({ userId: user._id, ownerId, pathId }).select('code revokedAt').lean(),
    isAuthor(user, ownerId),
    pathGate(user, ownerId, path),
  ]);

  const counted = attempts.filter((a) => a.status !== 'voided');
  const active = counted.find((a) => a.status === 'active') ?? null;
  const submitted = counted.filter((a) => a.status === 'submitted');
  const passedAttempt = submitted.find((a) => a.passed) ?? null;
  const last = submitted[submitted.length - 1] ?? null;
  const info = examInfoOf(exam)!;
  const now = Date.now();
  const retryAt =
    last?.submittedAt && info.cooldownHours > 0
      ? new Date(new Date(last.submittedAt).getTime() + info.cooldownHours * 3_600_000)
      : null;

  let state: ExamState = 'ready';
  if (passedAttempt) state = 'passed';
  else if (active) state = 'active';
  else if (author) state = 'author';
  else if (!gate.complete) state = 'locked';
  else if (info.paused) state = 'paused';
  else if (info.opensAt && now < Date.parse(info.opensAt)) state = 'not-open';
  else if (info.closesAt && now > Date.parse(info.closesAt)) state = 'closed';
  else if (info.maxAttempts !== null && submitted.length >= info.maxAttempts) state = 'exhausted';
  else if (retryAt && now < retryAt.getTime()) state = 'cooldown';

  return {
    state,
    gate,
    info,
    exam,
    active,
    nextNumber: attempts.reduce((max, a) => Math.max(max, a.number), 0) + 1,
    view: {
      state,
      exam: { ...info, rules: localized(exam.rules), certificate: awardsCertificate(path) },
      path: { complete: gate.complete, done: gate.standing.done, available: gate.standing.available },
      attemptsUsed: submitted.length,
      retryAt: state === 'cooldown' ? retryAt : null,
      active: active ? { id: String(active._id), deadline: active.deadline } : null,
      last: last ? resultView(last) : null,
      passed: passedAttempt ? resultView(passedAttempt) : null,
      certificate: certificate ? { code: certificate.code, revoked: Boolean(certificate.revokedAt) } : null,
      /** Passed, entitled to a certificate, and not holding one yet. */
      claimable: Boolean(passedAttempt && !certificate && (passedAttempt.award?.certificate || awardsCertificate(path))),
      serverNow: new Date(now),
    },
  };
}

/** The path and its exam, or the reason there is nothing to sit. */
async function examPath(pathId: string) {
  const found = await findPublishedPath(pathId);
  if (!found || !examOf(found.path)) return null;
  return found;
}

const queueKey = (user: IUser) => `exam:${String(user._id)}`;

/* ── GET /api/exams/:pathId ── where I stand with this path's exam. */
router.get('/:pathId', authenticate, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  if (!pathId.success) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  try {
    const found = await examPath(pathId.data);
    if (!found) {
      res.status(404).json({ error: 'This path has no exam', code: 'NO_EXAM' });
      return;
    }
    const standing = await oneAtATime(queueKey(req.user!), () => standingFor(req.user!, found.ownerId, found.path));
    res.json(standing.view);
  } catch (err) {
    logger.error('exam.status_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load the exam' });
  }
});

/* ── POST /api/exams/:pathId/start ── deal an attempt and start its clock. */
router.post('/:pathId/start', authenticate, startLimiter, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  if (!pathId.success) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  const user = req.user!;
  try {
    const found = await examPath(pathId.data);
    if (!found) {
      res.status(404).json({ error: 'This path has no exam', code: 'NO_EXAM' });
      return;
    }

    const outcome = await oneAtATime(queueKey(user), async () => {
      const standing = await standingFor(user, found.ownerId, found.path);

      // Already sitting it: the same attempt again, never a second one.
      if (standing.state === 'active' && standing.active) {
        const attempt = await ExamAttempt.findById(standing.active._id);
        if (attempt) return { status: 200, body: { attempt: attemptView(attempt) } };
      }
      if (standing.state !== 'ready') {
        return { status: 409, body: { error: 'This exam cannot be started right now', code: 'NOT_READY', ...standing.view } };
      }

      const stepTitles = new Map(standing.gate.standing.steps.map((s) => [s.key, s.title]));
      // Every step the path lists is fair to point a task at, published or not.
      for (const step of list(found.path.steps).filter(isPlainObject)) {
        if (!stepTitles.has(stepKeyOf(step))) stepTitles.set(stepKeyOf(step), str(step.title));
      }
      const sections = dealAttempt(standing.exam, stepTitles);
      if (sections.every((s) => s.tasks.length === 0)) {
        return { status: 409, body: { error: 'This exam has no tasks yet', code: 'EXAM_EMPTY' } };
      }

      const now = new Date();
      const title = isPlainObject(found.path.title) ? found.path.title : {};
      const certificateTitle = isPlainObject(found.path.certificate) ? str(found.path.certificate.title).trim() : '';
      const attempt = await ExamAttempt.create({
        userId: user._id,
        ownerId: found.ownerId,
        pathId: pathId.data,
        number: standing.nextNumber,
        status: 'active',
        startedAt: now,
        deadline: new Date(now.getTime() + standing.info.minutes * 60_000),
        passPercent: standing.info.passPercent,
        practical: sections.some((s) => s.kind === 'practical'),
        sections,
        answers: [],
        /* The titles of the steps its tasks point at, parked here until the
           attempt is marked, when this becomes the steps to go back over. */
        review: [...new Set(sections.flatMap((s) => s.tasks.map((t) => t.stepKey).filter((k): k is string => !!k)))].map(
          (key) => ({ key, title: stepTitles.get(key) ?? '', earned: 0, total: 0 })
        ),
        /* What passing this sitting earns, as the path stands now. */
        award: {
          certificate: awardsCertificate(found.path),
          pathTitle: certificateTitle || str(title.en).trim() || str(title.ar).trim() || 'Learning path',
          pathSlug: str(found.path.slug),
          difficulty: str(found.path.difficulty),
          stepCount: standing.gate.standing.available,
          lessonCount: standing.gate.standing.lessons,
          minutes: Math.round(standing.gate.standing.minutes),
          syllabus: standing.gate.standing.steps.map((s) => s.title).filter(Boolean).slice(0, 60),
          pathCompletedAt: standing.gate.completedAt ?? now,
        },
      });

      logger.info('exam.started', { userId: String(user._id), pathId: pathId.data, number: attempt.number });
      return { status: 201, body: { attempt: attemptView(attempt) } };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('exam.start_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not start the exam' });
  }
});

/* ── GET /api/exams/:pathId/attempt ── the attempt I am sitting, to carry on
 * with after a reload or on another device. */
router.get('/:pathId/attempt', authenticate, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  if (!pathId.success) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  try {
    const attempt = await ExamAttempt.findOne({ userId: req.user!._id, pathId: pathId.data, status: 'active' });
    if (!attempt || attempt.deadline.getTime() + GRACE_MS < Date.now()) {
      res.status(404).json({ error: 'No attempt in progress', code: 'NO_ATTEMPT' });
      return;
    }
    res.json({ attempt: attemptView(attempt) });
  } catch (err) {
    logger.error('exam.attempt_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load the attempt' });
  }
});

/** Lay new answers over the ones an attempt holds. Only its own tasks count. */
function mergeAnswers(attempt: IExamAttempt, incoming: { task: string; value: number | string }[]): void {
  const own = new Set(attempt.sections.flatMap((s) => s.tasks.map((t) => t.id)));
  const merged = new Map(attempt.answers.map((a) => [a.task, a.value]));
  for (const { task, value } of incoming) {
    if (own.has(task)) merged.set(task, value);
  }
  attempt.answers = [...merged.entries()].map(([task, value]) => ({ task, value }));
  attempt.markModified('answers');
}

const saveSchema = z.object({ attemptId: attemptIdSchema, answers: answersSchema }).strict();

/** My attempt at this path's exam, still open, or null. */
async function myActiveAttempt(user: IUser, pathId: string, attemptId: string): Promise<IExamAttempt | null> {
  return ExamAttempt.findOne({ _id: attemptId, userId: user._id, pathId, status: 'active' });
}

/* ── PUT /api/exams/:pathId/answers ── keep what I have answered so far, so a
 * closed tab or a flat battery costs nothing. Marks nothing. */
router.put('/:pathId/answers', authenticate, saveLimiter, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  const parsed = saveSchema.safeParse(req.body);
  if (!pathId.success || !parsed.success) {
    res.status(400).json({ error: 'Invalid answers' });
    return;
  }
  const user = req.user!;
  try {
    const outcome = await oneAtATime(queueKey(user), async () => {
      const attempt = await myActiveAttempt(user, pathId.data, parsed.data.attemptId);
      if (!attempt) return { status: 404, body: { error: 'No attempt in progress', code: 'NO_ATTEMPT' } };
      if (attempt.deadline.getTime() + GRACE_MS < Date.now()) {
        await finalize(attempt, true, stepTitlesIn(attempt));
        return { status: 409, body: { error: 'Time is up', code: 'TIME_UP', result: resultView(attempt) } };
      }
      mergeAnswers(attempt, parsed.data.answers);
      await attempt.save();
      return { status: 200, body: { ok: true, serverNow: new Date(), deadline: attempt.deadline } };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('exam.save_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save your answers' });
  }
});

const submitSchema = z.object({ attemptId: attemptIdSchema, answers: answersSchema.optional() }).strict();

/* ── POST /api/exams/:pathId/submit ── hand the attempt in and have it marked. */
router.post('/:pathId/submit', authenticate, submitLimiter, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  const parsed = submitSchema.safeParse(req.body);
  if (!pathId.success || !parsed.success) {
    res.status(400).json({ error: 'Invalid submission' });
    return;
  }
  const user = req.user!;
  try {
    const outcome = await oneAtATime(queueKey(user), async () => {
      const attempt = await myActiveAttempt(user, pathId.data, parsed.data.attemptId);
      if (!attempt) {
        // Handed in already (a double click, a second tab): the same result, not a second marking.
        const done = await ExamAttempt.findOne({
          _id: parsed.data.attemptId,
          userId: user._id,
          pathId: pathId.data,
          status: 'submitted',
        }).select('-sections -answers -results');
        if (done) return { status: 200, body: { result: resultView(done), certificate: Boolean(done.award?.certificate) } };
        return { status: 404, body: { error: 'No attempt in progress', code: 'NO_ATTEMPT' } };
      }

      const late = attempt.deadline.getTime() + GRACE_MS < Date.now();
      // Past the deadline only what was saved in time counts.
      if (!late && parsed.data.answers) mergeAnswers(attempt, parsed.data.answers);
      await finalize(attempt, late, stepTitlesIn(attempt));
      return { status: 200, body: { result: resultView(attempt), certificate: Boolean(attempt.award?.certificate) } };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('exam.submit_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not submit the exam' });
  }
});

const reportSchema = z.object({ attemptId: attemptIdSchema, note: z.string().trim().min(3).max(1000) }).strict();

/* ── POST /api/exams/:pathId/report ── the target is down, or a file will not
 * open. An admin reads it, and can cancel the attempt so it does not count. */
router.post('/:pathId/report', authenticate, submitLimiter, async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  const parsed = reportSchema.safeParse(req.body);
  if (!pathId.success || !parsed.success) {
    res.status(400).json({ error: 'Say in a few words what is wrong' });
    return;
  }
  try {
    const attempt = await ExamAttempt.findOne({
      _id: parsed.data.attemptId,
      userId: req.user!._id,
      pathId: pathId.data,
      status: { $ne: 'voided' },
    }).select('report');
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found', code: 'NO_ATTEMPT' });
      return;
    }
    attempt.report = { at: new Date(), note: parsed.data.note };
    await attempt.save();
    logger.warn('exam.problem_reported', { userId: String(req.user!._id), pathId: pathId.data, attemptId: String(attempt._id) });
    res.json({ ok: true });
  } catch (err) {
    logger.error('exam.report_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not send the report' });
  }
});

/* ── For the people who run the exam ── */

/** Whose path this is, when the caller may see how its exam is going: the
 *  owner, someone it is shared with, or an admin. */
async function ownerForStats(req: AuthRequest): Promise<string | null> {
  const asked = typeof req.query.owner === 'string' ? req.query.owner : '';
  const ownerId = asked && mongoose.isValidObjectId(asked) ? asked : String(req.user!._id);
  if (req.user!.role === 'admin') return ownerId;
  return (await isAuthor(req.user!, ownerId)) ? ownerId : null;
}

/* ── GET /api/exams/:pathId/stats ── how the exam is going, in figures. No
 * names: who sat an exam and what they scored is theirs, and an admin's. */
router.get('/:pathId/stats', authenticate, requireRole('creator', 'admin'), async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  if (!pathId.success) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  try {
    const ownerId = await ownerForStats(req);
    if (!ownerId) {
      res.status(403).json({ error: 'This path has not been shared with you' });
      return;
    }
    const [attempts, issued, revoked] = await Promise.all([
      ExamAttempt.find({ ownerId, pathId: pathId.data }).select('status passed earned total results report').lean(),
      Certificate.countDocuments({ ownerId, pathId: pathId.data, revokedAt: null }),
      Certificate.countDocuments({ ownerId, pathId: pathId.data, revokedAt: { $ne: null } }),
    ]);

    const submitted = attempts.filter((a) => a.status === 'submitted');
    const tasks = new Map<string, { right: number; seen: number }>();
    for (const attempt of submitted) {
      for (const result of attempt.results ?? []) {
        const row = tasks.get(result.task) ?? { right: 0, seen: 0 };
        row.seen += 1;
        if (result.ok) row.right += 1;
        tasks.set(result.task, row);
      }
    }
    const percents = submitted.map((a) => shownPercent(a.earned ?? 0, a.total ?? 0));

    res.json({
      attempts: {
        submitted: submitted.length,
        passed: submitted.filter((a) => a.passed).length,
        active: attempts.filter((a) => a.status === 'active').length,
        voided: attempts.filter((a) => a.status === 'voided').length,
        reported: attempts.filter((a) => a.report && a.status !== 'voided').length,
      },
      averagePercent: percents.length ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length) : null,
      certificates: { issued, revoked },
      /** How often each task was got right, to find the one that is broken. */
      tasks: [...tasks.entries()].map(([id, row]) => ({ id, ...row })),
    });
  } catch (err) {
    logger.error('exam.stats_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load the figures' });
  }
});

/* ── GET /api/exams/:pathId/attempts ── every sitting, by name. Admins only. */
router.get('/:pathId/attempts', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const pathId = pathIdSchema.safeParse(req.params.pathId);
  if (!pathId.success) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  try {
    const ownerId = await ownerForStats(req);
    const attempts = await ExamAttempt.find({ ownerId, pathId: pathId.data })
      .sort({ startedAt: -1 })
      .limit(500)
      .select('-sections -answers -results -award')
      .lean();
    const people = await User.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.userId)))] } })
      .select('displayName username')
      .lean();
    const byId = new Map(people.map((u) => [String(u._id), u]));

    res.json({
      attempts: attempts.map((a) => ({
        id: String(a._id),
        user: {
          id: String(a.userId),
          displayName: byId.get(String(a.userId))?.displayName ?? 'Former member',
          username: byId.get(String(a.userId))?.username ?? null,
        },
        number: a.number,
        status: a.status,
        startedAt: a.startedAt,
        deadline: a.deadline,
        submittedAt: a.submittedAt ?? null,
        percent: a.status === 'submitted' ? shownPercent(a.earned ?? 0, a.total ?? 0) : null,
        passed: a.passed === true,
        timedOut: a.timedOut === true,
        report: a.report ?? null,
        voidReason: a.voidReason ?? null,
      })),
    });
  } catch (err) {
    logger.error('exam.attempts_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load the attempts' });
  }
});

const voidSchema = z.object({ reason: z.string().trim().min(3).max(300) }).strict();

/* ── POST /api/exams/attempts/:id/void ── cancel a sitting that should not
 * count: the target was down, a file was wrong. It stops counting toward the
 * attempt cap and the wait before the next one. Admins only. */
router.post('/attempts/:id/void', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  const parsed = voidSchema.safeParse(req.body);
  if (!mongoose.isValidObjectId(req.params.id) || !parsed.success) {
    res.status(400).json({ error: 'A reason is required' });
    return;
  }
  try {
    const attempt = await ExamAttempt.findById(req.params.id).select('-sections -answers -results');
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }
    if (attempt.status === 'voided') {
      res.json({ ok: true });
      return;
    }
    // A sitting a certificate hangs on is undone by withdrawing the certificate.
    if (await Certificate.exists({ attemptId: attempt._id })) {
      res.status(409).json({ error: 'A certificate was issued for this attempt. Revoke the certificate instead.' });
      return;
    }
    attempt.status = 'voided';
    attempt.voidedAt = new Date();
    attempt.voidedBy = req.user!._id as mongoose.Types.ObjectId;
    attempt.voidReason = parsed.data.reason;
    await attempt.save();
    logger.warn('exam.attempt_voided', {
      by: String(req.user!._id),
      attemptId: String(attempt._id),
      userId: String(attempt.userId),
      pathId: attempt.pathId,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('exam.void_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not cancel the attempt' });
  }
});

export default router;
