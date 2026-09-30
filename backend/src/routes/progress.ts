import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Progress, { type IProgress } from '../models/Progress';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkSafeJson } from '../utils/sanitize';
import { currentMonthKey } from '../utils/time';
import { logger } from '../utils/logger';
import {
  findStop,
  getXpCatalog,
  scoreProgress,
  type ServerStop,
  type StopRef,
  type XpCatalog,
} from '../utils/xpCatalog';
import { isXpStale, restateUserXp } from '../utils/xpMigration';
import type { IUser } from '../models/User';
import { streakFrom } from '../shared/streak';
import { flagMatches, gradeQuiz, isQuestionCorrect, outputMatches, revealAnswer } from '../shared/checks';
import { spendPace } from '../utils/pace';
import { awardStreakBreakpoints, creditDay, resolveStudyDay, trimStudyDays } from '../utils/studyDays';

/* ─── Progress ───
 *
 * The server keeps the record of what each learner has finished, and it is
 * the only thing that adds to it. A stop is recorded one at a time, through
 * POST /complete or, for a lab's flags, POST /flag, and only once its work
 * checks out: a quiz's answers are marked here against answers the browser is
 * never sent, a challenge's test outputs are compared, and the flags are
 * checked one by one. Work with nothing to check is paced to real time
 * (utils/pace.ts). The snapshot the browser still pushes (PUT /) carries its
 * bookmarks and where it left off, and nothing that earns XP.
 */

const router = Router();

/** The member's own board standing, so their profile can say what the board
 *  counts when it differs from their lifetime XP: after an admin reset, it
 *  counts from the reset. */
function boardOf(user: IUser) {
  return {
    xp: user.points ?? 0,
    since: (user.pointsBaseline ?? 0) > 0 ? user.pointsResetAt ?? null : null,
  };
}

/* One learner's writes happen one at a time. Each reads the record, decides,
   and writes it back, and two at once (a double click, two tabs) would each
   write over the other's completion. The server runs as one process, so a
   queue per account is enough. */
const queues = new Map<string, Promise<void>>();

async function oneAtATime<T>(userId: string, work: () => Promise<T>): Promise<T> {
  const before = queues.get(userId) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const mine = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = before.then(() => mine);
  queues.set(userId, tail);
  await before;
  try {
    return await work();
  } finally {
    release();
    if (queues.get(userId) === tail) queues.delete(userId);
  }
}

/* Marking is cheap to ask for and a short answer is cheap to guess, so
   attempts are counted per account, well above what anyone taking a quiz or
   typing flags would reach. */
const perAccount = (limit: number) =>
  rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => String((req as AuthRequest).user?._id ?? 'anonymous'),
    message: { error: 'Too many attempts, slow down.', code: 'RATE_LIMITED' },
  });
const attemptLimiter = perAccount(20);
const completeLimiter = perAccount(30);

const idArray = z.array(z.string().min(1).max(160)).max(2000);
const id = z.string().min(1).max(160);

const stopRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('module'), slug: id, stopId: id }).strict(),
  z.object({ kind: z.literal('programming'), language: z.string().min(1).max(80), stopId: id }).strict(),
  z.object({ kind: z.literal('networking'), stopId: id }).strict(),
]);

const answerSchema = z.union([z.number().int().min(0).max(100), z.string().max(500)]);
/** The pusher's own calendar day, so a streak turns over at their midnight
 *  rather than UTC's. Held to a day either side of the server's in
 *  resolveStudyDay, and absent from an older client, which then just gets
 *  the server's day. */
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

const snapshotSchema = z
  .object({
    /** Sent by clients from before completions were recorded one by one.
     *  Accepted so they still validate, and ignored: the server records what
     *  it has checked, never a list it is handed. */
    programming: z.record(z.string().min(1).max(80), idArray).optional(),
    osModules: z.record(z.string().min(1).max(160), idArray).optional(),
    networking: idArray.optional(),
    enrolledPaths: idArray,
    /* Optional: a client cached from before module enrolment existed still
       validates, and an absent key is left alone by the $set below rather
       than clearing what the server already holds. */
    enrolledModules: idArray.optional(),
    /** Also from older clients, and ignored for the same reason. */
    points: z.number().int().min(0).max(100_000_000).optional(),
    day: daySchema,
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

const checkSchema = z
  .object({
    stop: stopRefSchema,
    /** Which question, in the order the author wrote them. */
    question: z.number().int().min(0).max(500),
    /** How many questions the learner was shown, so an answer to a quiz that
     *  has changed since is caught rather than marked against another one. */
    count: z.number().int().min(1).max(500),
    answer: answerSchema,
  })
  .strict();

const completeSchema = z
  .object({
    stop: stopRefSchema,
    /** A quiz: one answer per question, in the order the author wrote them. */
    answers: z.array(answerSchema).max(500).optional(),
    /** A challenge: what the code printed for each test, in the tests' order. */
    outputs: z.array(z.string().max(100_000)).max(100).optional(),
    day: daySchema,
  })
  .strict();

const flagSchema = z
  .object({
    stop: z.object({ kind: z.literal('module'), slug: id, stopId: id }).strict(),
    flagId: id,
    value: z.string().max(500),
    day: daySchema,
  })
  .strict();

/* ── The record ── */

type ProgressDoc = IProgress;

function completionsOf(progress: ProgressDoc | null) {
  return {
    programming: progress?.programming ?? {},
    osModules: progress?.osModules ?? {},
    networking: progress?.networking ?? [],
  };
}

function idsIn(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function isRecorded(progress: ProgressDoc, ref: StopRef): boolean {
  if (ref.kind === 'networking') return idsIn(progress.networking).includes(ref.stopId);
  const record = ref.kind === 'module' ? progress.osModules : progress.programming;
  const container = ref.kind === 'module' ? ref.slug : ref.language;
  const own = record && Object.prototype.hasOwnProperty.call(record, container) ? record[container] : [];
  return idsIn(own).includes(ref.stopId);
}

/** Add one stop to the record, and a day's activity with it. The record is
 *  replaced rather than edited, because Mongoose does not see a mutated Mixed. */
function record(progress: ProgressDoc, ref: StopRef, studyDay: string): void {
  if (ref.kind === 'networking') {
    progress.networking = [...new Set([...idsIn(progress.networking), ref.stopId])];
  } else {
    const field = ref.kind === 'module' ? 'osModules' : 'programming';
    const container = ref.kind === 'module' ? ref.slug : ref.language;
    const current = { ...(progress[field] ?? {}) };
    const own = Object.prototype.hasOwnProperty.call(current, container) ? current[container] : [];
    current[container] = [...new Set([...idsIn(own), ref.stopId])];
    progress[field] = current;
    progress.markModified(field);
  }
  progress.studyDays = trimStudyDays(creditDay(progress.studyDays, studyDay, 1), studyDay);
  progress.markModified('studyDays');
}

async function progressFor(user: IUser): Promise<ProgressDoc> {
  return (
    (await Progress.findOne({ userId: user._id })) ??
    (await Progress.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true, new: true }
    ))!
  );
}

/**
 * Score the stored completions and settle the account's figures from them:
 * lifetime XP, the board, this month's gains and the streak's rungs. Every
 * write here ends with this, so the answer always says where the account
 * stands now.
 */
async function settle(user: IUser, progress: ProgressDoc, catalog: XpCatalog, studyDay: string) {
  const studyDays = progress.studyDays ?? {};

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

  /* Scored from the completions against published content only, so an id
     that is no longer published counts for nothing. A module seen complete is
     remembered, which keeps its finishing bonus when a lesson is added. */
  const finishedBefore = progress.finishedModules ?? [];
  const { xp, finishedNow } = await scoreProgress(progress, finishedBefore, catalog);
  const added = finishedNow.filter((key) => !finishedBefore.includes(key));
  if (added.length) {
    await Progress.updateOne({ _id: progress._id }, { $addToSet: { finishedModules: { $each: added } } });
  }

  /* Book any gain into the current month. The month key rolls over on the
     1st, which "resets" everyone's monthly standing with no scheduled job.

     The score is the whole history, not a running total, so it cannot be
     taken as the board standing directly. An admin reset works by raising
     the baseline to whatever had been earned; the board shows the distance
     travelled since, and the next write, restating the same history, adds
     nothing. The level reads `pointsRaw`, which a reset leaves alone.

     Total XP is what the content scored, plus what an admin awarded, plus
     what the streak has paid. Both of those are re-added here rather than
     left in the stored total, because this line restates that total from the
     content every time and would wipe them otherwise. */
  const month = currentMonthKey();
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

  return {
    ok: true,
    /* The whole total, award and streak included, scored from exactly the
       completions below: the browser shows this, and keeps the completions
       as its copy of the record. */
    xp: total,
    board: boardOf(user),
    completions: completionsOf(progress),
    finishedModules: [...finishedBefore, ...added],
    studyDays,
    streak: streak.current,
    /* Named so the client can throw the card for a rung the moment it is
       paid, rather than waiting to notice on the next dashboard. */
    streakAwarded: award.reached.map((b) => b.days),
    streakXpGained: award.gained,
  };
}

/** The catalog every write scores against, with the account brought into it
 *  first when the content or formula changed since it was last scored: then
 *  only this write's own gains are booked as this month's. */
async function catalogFor(user: IUser): Promise<XpCatalog> {
  const catalog = await getXpCatalog();
  if (isXpStale(user, catalog)) await restateUserXp(user, { catalog });
  return catalog;
}

function solvedIn(progress: ProgressDoc | null, slug: string, labId: string): string[] {
  return (progress?.solvedFlags ?? []).filter((s) => s.module === slug && s.lab === labId).map((s) => s.flag);
}

/* ── GET /api/progress ── my record. */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    // Content changed since this account was scored: restate it first, so the
    // XP below is what the stored completions come to now.
    await catalogFor(user);
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
            solvedFlags: (doc.solvedFlags ?? []).map(({ module, lab, flag }) => ({ module, lab, flag })),
            lastActivity: doc.lastActivity ?? null,
          }
        : null,
      /** Lifetime XP as the server scored it, from exactly the completions
       *  above: the browser shows this. */
      xp: user.pointsRaw ?? 0,
      board: boardOf(user),
      /** The streak ladder, so the card can draw before the first push. */
      streakGoal: user.streakGoal ?? null,
      streakAwarded: user.streakAwarded ?? [],
    });
  } catch (err) {
    logger.error('progress.get_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not load progress' });
  }
});

/* ── PUT /api/progress ── my bookmarks and where I left off (debounced).
 * Completions in the body are ignored: see the note at the top. */
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

  const { enrolledPaths, enrolledModules, lastActivity, day } = parsed.data;
  const user = req.user!;

  try {
    const body = await oneAtATime(String(user._id), async () => {
      const catalog = await catalogFor(user);
      const progress = await Progress.findOneAndUpdate(
        { userId: user._id },
        { $set: { enrolledPaths, lastActivity, ...(enrolledModules ? { enrolledModules } : {}) } },
        { upsert: true, new: true }
      );
      if (!progress) throw new Error('progress upsert returned nothing');
      return settle(user, progress, catalog, resolveStudyDay(day));
    });
    res.json(body);
  } catch (err) {
    logger.error('progress.put_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save progress' });
  }
});

/* ── POST /api/progress/check ── mark one quiz answer, for the feedback a
 * learner gets after each question. Records nothing: the quiz counts once
 * every answer goes to /complete together. A wrong answer is told what the
 * right one was, which is how the quizzes have always taught. */
router.post('/check', authenticate, attemptLimiter, async (req: AuthRequest, res) => {
  const parsed = checkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid answer' });
    return;
  }
  const { stop: ref, question, count, answer } = parsed.data;
  try {
    const found = findStop(await getXpCatalog(), ref);
    if (!found || found.stop.check.kind !== 'quiz') {
      res.status(404).json({ error: 'This quiz is not published', code: 'UNKNOWN_STOP' });
      return;
    }
    const { questions } = found.stop.check;
    if (questions.length !== count || question >= questions.length) {
      res.status(409).json({ error: 'This quiz has changed. Reload the lesson.', code: 'CONTENT_CHANGED' });
      return;
    }
    const q = questions[question];
    const correct = isQuestionCorrect(q, answer);
    res.json(correct ? { correct } : { correct, ...revealAnswer(q) });
  } catch (err) {
    logger.error('progress.check_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not check the answer' });
  }
});

/** Why a stop's work does not count, or null when it does. */
function proofProblem(
  stop: ServerStop,
  body: z.infer<typeof completeSchema>
): { status: number; error: string; code: string; [extra: string]: unknown } | null {
  const { check } = stop;
  if (check.kind === 'quiz') {
    const answers = body.answers ?? [];
    if (answers.length !== check.questions.length) {
      return { status: 409, error: 'This quiz has changed. Reload the lesson.', code: 'CONTENT_CHANGED' };
    }
    const grade = gradeQuiz(check.questions, answers, check.rule);
    return grade.passed
      ? null
      : { status: 422, error: 'Not enough correct answers', code: 'NOT_PASSED', correct: grade.correct, total: grade.total };
  }
  if (check.kind === 'tests') {
    const outputs = body.outputs ?? [];
    if (outputs.length !== check.tests.length) {
      return { status: 409, error: 'This challenge has changed. Reload the lesson.', code: 'CONTENT_CHANGED' };
    }
    const passed = check.tests.every((test, i) => outputMatches(test.expectedOutput, outputs[i]));
    return passed ? null : { status: 422, error: 'Not every test passes', code: 'TESTS_FAILED' };
  }
  if (check.kind === 'flags') {
    return { status: 400, error: 'A lab with flags is finished by its flags', code: 'USE_FLAGS' };
  }
  return null;
}

/* ── POST /api/progress/complete ── record one stop, once its work checks out. */
router.post('/complete', authenticate, completeLimiter, async (req: AuthRequest, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid completion' });
    return;
  }
  const body = parsed.data;
  const ref = body.stop as StopRef;
  const user = req.user!;

  try {
    const outcome = await oneAtATime(String(user._id), async () => {
      const catalog = await catalogFor(user);
      const found = findStop(catalog, ref);
      if (!found) {
        return { status: 404, body: { error: 'This lesson is not published', code: 'UNKNOWN_STOP' } };
      }
      const progress = await progressFor(user);
      const studyDay = resolveStudyDay(body.day);

      // Already on the record: nothing to check, and nothing to pace.
      if (isRecorded(progress, ref)) return { status: 200, body: await settle(user, progress, catalog, studyDay) };

      const problem = proofProblem(found.stop, body);
      if (problem) {
        const { status, ...rest } = problem;
        return { status, body: rest };
      }

      const pace = spendPace(progress.paceClock, found.stop.minutes);
      if (!pace.ok) {
        return {
          status: 429,
          body: {
            error: 'Moving faster than the lessons take',
            code: 'PACE',
            retryInSeconds: pace.retryInSeconds,
            readyAt: pace.readyAt.toISOString(),
          },
        };
      }

      progress.paceClock = pace.clock;
      record(progress, ref, studyDay);
      await progress.save();
      return { status: 200, body: await settle(user, progress, catalog, studyDay) };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('progress.complete_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not save progress' });
  }
});

/* ── POST /api/progress/flag ── check one of a lab's flags. The flags a
 * learner has found are kept, so they can stop and come back; the last one
 * records the lab. Nothing is ever said about a wrong one beyond that. */
router.post('/flag', authenticate, attemptLimiter, async (req: AuthRequest, res) => {
  const parsed = flagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid flag' });
    return;
  }
  const { stop: ref, flagId, value, day } = parsed.data;
  const user = req.user!;

  try {
    const outcome = await oneAtATime(String(user._id), async () => {
      const catalog = await catalogFor(user);
      const found = findStop(catalog, ref);
      if (!found || found.stop.check.kind !== 'flags') {
        return { status: 404, body: { error: 'This lab is not published', code: 'UNKNOWN_STOP' } };
      }
      const { flags } = found.stop.check;
      const flag = flags.find((f) => f.id === flagId);
      if (!flag) {
        return { status: 409, body: { error: 'This lab has changed. Reload the lesson.', code: 'CONTENT_CHANGED' } };
      }

      const progress = await progressFor(user);
      const solvedBefore = solvedIn(progress, ref.slug, ref.stopId);
      const already = solvedBefore.includes(flagId);
      if (!already && !flagMatches(flag, value)) {
        return { status: 200, body: { correct: false, solved: solvedBefore } };
      }

      if (!already) {
        progress.solvedFlags.push({ module: ref.slug, lab: ref.stopId, flag: flagId });
      }
      const solved = solvedIn(progress, ref.slug, ref.stopId);
      const allFound = flags.every((f) => solved.includes(String(f.id)));
      const studyDay = resolveStudyDay(day);

      if (!allFound || isRecorded(progress, ref)) {
        if (!already) await progress.save();
        const settled = allFound ? await settle(user, progress, catalog, studyDay) : null;
        return { status: 200, body: { correct: true, solved, ...(settled ?? {}) } };
      }

      // The last flag: the lab is done, and it was proven rather than paced.
      record(progress, ref, studyDay);
      await progress.save();
      return { status: 200, body: { correct: true, solved, ...(await settle(user, progress, catalog, studyDay)) } };
    });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    logger.error('progress.flag_failed', { error: String(err) });
    res.status(500).json({ error: 'Could not check the flag' });
  }
});

export default router;
