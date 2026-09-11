/* ─── XP: how learning is scored ───
 *
 * One file for both halves of the Academy. The browser scores what it has
 * cached, so a finished lesson shows at once (services/xpService.ts). The
 * server scores the same completions against the published content, and its
 * number is the one the leaderboard and public profiles use
 * (utils/xpCatalog.ts). The two must agree, so the formula, the way content is
 * measured and the level ladder live here and nowhere else. It imports
 * nothing and touches no browser or Node API, because both builds compile it.
 *
 * Every stop in a course (a lecture, a section, a lesson, a challenge, a lab)
 * earns
 *
 *     XP = 10 × D × (learn + 1.5 × guided + 3 × independent)
 *
 * counted in minutes of effort and measured from the content itself, never
 * from a number an author types in:
 *   learn        reading (words ÷ 180), video, runnable examples, simulations,
 *                and hands-on work nobody checks
 *   guided       quiz questions: checked, but asked straight after the lesson
 *   independent  work nobody walks you through that the platform checks:
 *                coding challenges and flag labs
 *   D            difficulty, from Beginner 1.0 to Expert 2.0 in equal steps
 *
 * Finishing every stop in a module adds a quarter of their XP, kept once
 * earned. Level n (0x1 to 0xD) starts at 2^(n+7) XP, so each level takes
 * twice as long to reach as the one before.
 *
 * Anything that changes a score needs XP_FORMULA_VERSION bumped: the server
 * then restates every account once (utils/xpMigration.ts) instead of booking
 * the difference as XP earned this month.
 */

export const XP_FORMULA_VERSION = 1;

export const XP_PER_MINUTE = 10;
export const WORDS_PER_MINUTE = 180;
/** Quiz questions count half as much again as reading. */
export const GUIDED_WEIGHT = 1.5;
/** Unguided, checked work counts three times reading, after TryHackMe paying
 *  four times as much for challenge rooms and Hack The Box paying only for flags. */
export const INDEPENDENT_WEIGHT = 3;
/** Share of a module's stop XP added for finishing all of it. */
export const FINISH_BONUS = 0.25;

/** Minutes for the parts of a stop a word count cannot see. */
export const EFFORT = {
  mcqQuestion: 1,
  typedQuestion: 1.5,
  runnableExample: 3,
  simulation: 5,
  challengeBase: 10,
  challengePerTest: 2,
  /** A studio video whose length was never entered, as the studio's own estimate assumes. */
  unknownVideo: 4,
} as const;

/** The most one stop can count for, so a single oversized stop cannot run away. */
export const CAPS = { readingMinutes: 30, videoMinutes: 60, handsOnMinutes: 120 } as const;

export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

/** Equal steps, as Hack The Box pays its machines. The top stays at double
 *  because authors choose the difficulty of their own content. */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  Beginner: 1,
  Easy: 1.25,
  Medium: 1.5,
  Hard: 1.75,
  Expert: 2,
};

export function difficultyWeight(difficulty: unknown): number {
  return typeof difficulty === 'string' && Object.prototype.hasOwnProperty.call(DIFFICULTY_WEIGHT, difficulty)
    ? DIFFICULTY_WEIGHT[difficulty as Difficulty]
    : 1;
}

/* ── Measuring a stop ──
 * Content reaches the server as stored JSON, so every reader here takes
 * `unknown` and treats a missing or malformed field as absent. */

/** What a stop asks of a learner, before any weighting. */
export interface StopMeasure {
  /** Words of prose, to the nearest 10 so fixing a typo does not move a score. */
  words: number;
  videoMinutes: number;
  /** Fixed minutes for a runnable example or a simulation. */
  extraMinutes: number;
  mcq: number;
  typed: number;
  /** Checked work done without guidance: a coding challenge, a flag lab. */
  independentMinutes: number;
  /** Hands-on work nobody checks: a self-check lab, a challenge done off the page. */
  handsOnMinutes: number;
}

const EMPTY: StopMeasure = {
  words: 0,
  videoMinutes: 0,
  extraMinutes: 0,
  mcq: 0,
  typed: 0,
  independentMinutes: 0,
  handsOnMinutes: 0,
};

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const positive = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

const roundWords = (n: number) => Math.round(n / 10) * 10;

/** A body is `{ en, ar }`, or a plain string in older content. English is
 *  measured when there is any, the way the studio estimates a section. */
function bodyText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (isRec(value)) return text(value.en) || text(value.ar);
  return '';
}

function quizCounts(questions: unknown): { mcq: number; typed: number } {
  let mcq = 0;
  let typed = 0;
  if (Array.isArray(questions)) {
    for (const q of questions) {
      if (!isRec(q)) continue;
      if (q.kind === 'text') typed++;
      else mcq++;
    }
  }
  return { mcq, typed };
}

/** "12:27" or "1:02:03" in minutes; 0 when it is not a duration. */
export function parseDuration(value: unknown): number {
  const parts = text(value).split(':').map(Number);
  if (parts.length < 2 || parts.some((p) => !Number.isFinite(p) || p < 0)) return 0;
  const minutes = parts.reduce((total, part) => total * 60 + part, 0) / 60;
  return Math.round(minutes * 100) / 100;
}

/**
 * A stop in a module: a lecture of a built-in course, a section written in the
 * studio, or a lab. `quizBank` holds the built-in courses' questions, which are
 * kept apart from their lectures (data/linuxQuizData.ts).
 */
export function measureModuleStop(lecture: unknown, quizBank?: Record<string, unknown>): StopMeasure {
  if (!isRec(lecture)) return { ...EMPTY };

  if (lecture.kind === 'lab' && isRec(lecture.lab)) {
    const lab = lecture.lab;
    const minutes = positive(lab.estimatedMinutes);
    const completion = isRec(lab.completion) ? lab.completion : {};
    const flagged =
      completion.mode === 'flags' && Array.isArray(completion.flags) && completion.flags.length > 0;
    return flagged ? { ...EMPTY, independentMinutes: minutes } : { ...EMPTY, handsOnMinutes: minutes };
  }

  // Written in the studio. Its `duration` is only the studio's estimate of the
  // reading, so the video is timed from the length the author entered.
  if ('markdownContent' in lecture) {
    const quiz = quizCounts(lecture.quizQuestions);
    return {
      ...EMPTY,
      words: roundWords(countWords(bodyText(lecture.markdownContent))),
      videoMinutes: text(lecture.videoId) ? positive(lecture.videoMinutes) || EFFORT.unknownVideo : 0,
      mcq: quiz.mcq,
      typed: quiz.typed,
    };
  }

  // A built-in lecture: a video of known length with notes beside it.
  const notes = Array.isArray(lecture.notes) ? lecture.notes.map(text).join(' ') : '';
  const banked = quizBank && lecture.quiz ? quizBank[text(lecture.id)] : undefined;
  const quiz = quizCounts(banked ?? lecture.quizQuestions);
  return {
    ...EMPTY,
    words: roundWords(countWords(notes)),
    videoMinutes: text(lecture.videoId) ? parseDuration(lecture.duration) : 0,
    mcq: quiz.mcq,
    typed: quiz.typed,
    handsOnMinutes: positive(lecture.handsOnMinutes),
  };
}

/** A programming lesson or challenge. */
export function measureConcept(concept: unknown): StopMeasure {
  if (!isRec(concept)) return { ...EMPTY };
  const words = roundWords(countWords(bodyText(concept.markdownContent)));
  if (concept.type === 'challenge') {
    const tests = Array.isArray(concept.testCases) ? concept.testCases.length : 0;
    return { ...EMPTY, words, independentMinutes: EFFORT.challengeBase + EFFORT.challengePerTest * tests };
  }
  return { ...EMPTY, words, extraMinutes: text(concept.starterCode).trim() ? EFFORT.runnableExample : 0 };
}

export function measureNetworkingLesson(lesson: unknown): StopMeasure {
  if (!isRec(lesson)) return { ...EMPTY };
  const simulation = isRec(lesson.simulation) && Array.isArray(lesson.simulation.nodes) && lesson.simulation.nodes.length > 0;
  const quiz = quizCounts(lesson.quiz);
  return {
    ...EMPTY,
    words: roundWords(countWords(bodyText(lesson.markdownContent))),
    extraMinutes: simulation ? EFFORT.simulation : 0,
    mcq: quiz.mcq,
    typed: quiz.typed,
  };
}

export function stopXp(m: StopMeasure, difficulty?: unknown): number {
  const learn =
    Math.min(m.words / WORDS_PER_MINUTE, CAPS.readingMinutes) +
    Math.min(m.videoMinutes, CAPS.videoMinutes) +
    m.extraMinutes +
    Math.min(m.handsOnMinutes, CAPS.handsOnMinutes);
  const guided = m.mcq * EFFORT.mcqQuestion + m.typed * EFFORT.typedQuestion;
  const independent = Math.min(m.independentMinutes, CAPS.handsOnMinutes);
  return Math.round(
    XP_PER_MINUTE * difficultyWeight(difficulty) * (learn + GUIDED_WEIGHT * guided + INDEPENDENT_WEIGHT * independent)
  );
}

/* ── Scoring a learner ── */

/** A run of stops scored together: a module, or the loose networking lessons. */
export interface XpGroup {
  /** What a finished module is remembered as. */
  key: string;
  stops: { id: string; xp: number }[];
  /** Modules pay the finishing bonus; loose lessons have nothing to finish. */
  finishBonus: boolean;
}

/** Group keys, built the same way on both sides. */
export const groupKey = {
  module: (slug: string) => `os:${slug}`,
  programming: (language: string, moduleSlug: string) => `prog:${language}:${moduleSlug}`,
  networking: 'net',
} as const;

export interface XpScore {
  xp: number;
  /** Modules whose every stop is done now, to be remembered as finished. */
  finishedNow: string[];
  stopsDone: number;
  stopsTotal: number;
}

/**
 * Score a learner. `doneIn` gives the completed ids for a group, and
 * `finishedBefore` the modules they have finished at some point. The bonus is
 * a quarter of the XP of the stops they have done in a finished module, so it
 * stays when a lesson is added later and grows once they do that one too.
 */
export function scoreGroups<G extends XpGroup>(
  groups: G[],
  doneIn: (group: G) => ReadonlySet<string>,
  finishedBefore: ReadonlySet<string> = new Set()
): XpScore {
  let xp = 0;
  let stopsDone = 0;
  let stopsTotal = 0;
  const finishedNow: string[] = [];
  for (const group of groups) {
    const done = doneIn(group);
    let earned = 0;
    let count = 0;
    for (const stop of group.stops) {
      if (!done.has(stop.id)) continue;
      earned += stop.xp;
      count++;
    }
    xp += earned;
    stopsDone += count;
    stopsTotal += group.stops.length;
    if (!group.finishBonus || group.stops.length === 0) continue;
    const complete = count === group.stops.length;
    if (complete) finishedNow.push(group.key);
    if (complete || finishedBefore.has(group.key)) xp += Math.round(earned * FINISH_BONUS);
  }
  return { xp, finishedNow, stopsDone, stopsTotal };
}

/* ── Levels ── */

export interface Level {
  /** 1 to 13. */
  number: number;
  /** '0x1' to '0xD'. */
  hex: string;
  name: { en: string; ar: string };
  /** The XP the level starts at. */
  minXp: number;
}

const LEVEL_NAMES: { en: string; ar: string }[] = [
  { en: 'Newbie', ar: 'مستجدّ' },
  { en: 'Explorer', ar: 'مستكشف' },
  { en: 'Hobbyist', ar: 'هاوٍ' },
  { en: 'Apprentice', ar: 'متدرّب' },
  { en: 'Practitioner', ar: 'ممارس' },
  { en: 'Hacker', ar: 'هاكر' },
  { en: 'Specialist', ar: 'متخصّص' },
  { en: 'Professional', ar: 'محترف' },
  { en: 'Expert', ar: 'خبير' },
  { en: 'Elite', ar: 'نخبة' },
  { en: 'Ghost', ar: 'شبح' },
  { en: 'Legend', ar: 'أسطورة' },
  { en: 'Root', ar: 'روت' },
];

/** Level n starts at 2^(n+7) XP: 0x2 at 512, 0xD at 1,048,576. 0x1 starts at 0. */
export const LEVELS: Level[] = LEVEL_NAMES.map((name, i) => ({
  number: i + 1,
  hex: `0x${(i + 1).toString(16).toUpperCase()}`,
  name,
  minXp: i === 0 ? 0 : 2 ** (i + 8),
}));

/** The leaderboard ranks people from the second level up, as TryHackMe ranks
 *  nobody under 100 points: an account that never started stays off it. */
export const LEADERBOARD_MIN_XP = LEVELS[1].minXp;

export interface LevelProgress {
  level: Level;
  next: Level | null;
  /** How far through the current level, 0 to 1; 1 at the top. */
  fraction: number;
  /** XP still needed for the next level; 0 at the top. */
  toNext: number;
}

export function levelFor(xp: number): LevelProgress {
  const safe = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let index = 0;
  for (let i = LEVELS.length - 1; i > 0; i--) {
    if (safe >= LEVELS[i].minXp) {
      index = i;
      break;
    }
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  return {
    level,
    next,
    fraction: next ? (safe - level.minXp) / (next.minXp - level.minXp) : 1,
    toNext: next ? next.minXp - safe : 0,
  };
}

/* ── The built-in courses, measured for the server ──
 * The server cannot import the frontend's course files, so
 * scripts/build-xp-catalog.mjs measures them into
 * backend/src/data/builtinXpCatalog.json in this shape. */

export interface BuiltinXpCatalog {
  modules: { id: string; slug: string; difficulty: string; stops: { id: string; m: StopMeasure }[] }[];
  languages: {
    slug: string;
    modules: { id: string; slug: string; order: number; concepts: { id: string; order: number; m: StopMeasure }[] }[];
  }[];
  networking: { id: string; order: number; m: StopMeasure }[];
}
