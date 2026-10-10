/* ─── Checking a learner's work ───
 *
 * Quiz answers, lab flags and a challenge's test outputs are marked here, and
 * the server is the one that marks them for anything that counts: the answers
 * never leave it (utils/redact.ts takes them out of what students are sent),
 * and it records a stop complete only once the work checks out
 * (routes/progress.ts).
 *
 * The browser compiles this file too, for the one place it still marks on its
 * own: a creator previewing an unsaved draft, which the server has never seen
 * and which earns nothing. Like shared/xp.ts it imports nothing and touches no
 * browser or Node API, because both builds compile it.
 *
 * Content reaches the server as stored JSON, so every reader here takes
 * `unknown` and treats a missing or malformed field as absent.
 */

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/* ── Quiz questions ── */

export type QuizKind = 'mcq' | 'text';

/** What a learner gives for one question: the option they picked, counted in
 *  the order the author wrote the options (not the shuffled order they saw),
 *  or what they typed. */
export type QuizAnswer = number | string;

/** How many right answers pass a quiz. A module section asks for every one,
 *  the way its runner always has; a networking lesson asks for seven in ten. */
export type QuizRule = 'all' | 'most';

export const MOST_RATIO = 0.7;

/** Arabic's vowel marks and its stretching stroke, which change how a word
 *  looks and not which word it is. */
const ARABIC_MARKS = /[\u064B-\u065F\u0670\u0640]/g;

/** The learner is being asked whether they know the answer, not whether they
 *  can reproduce its typography, so case, surrounding space and doubled inner
 *  spaces are all noise: "hello world" answers "Hello World". Arabic gets the
 *  same allowance: vowel marks are dropped, and the letters a keyboard lets
 *  people swap freely are read as one (an alef with or without its hamza, a
 *  final ya with or without its dots). */
export const normalizeAnswer = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(ARABIC_MARKS, '')
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A');

/** The shape of a typed answer, one asterisk per character with the spaces
 *  left standing, shown in the empty box so a stuck learner can see how long
 *  the answer runs and how many words it is. */
export const answerMask = (answer: string): string => answer.trim().replace(/\s+/g, ' ').replace(/\S/g, '*');

export const isTypedQuestion = (q: unknown): boolean => isRec(q) && q.kind === 'text';

/** Is `given` the right answer to this authored question? */
export function isQuestionCorrect(question: unknown, given: unknown): boolean {
  if (!isRec(question)) return false;
  if (question.kind === 'text') {
    if (typeof given !== 'string') return false;
    /* A question asked in two languages has an answer in each, and someone
       reading the English may well type the Arabic: either one is right. */
    const answer = normalizeAnswer(given);
    return [question.answer, question.answerAr].some((accepted) => {
      const expected = normalizeAnswer(text(accepted));
      return expected !== '' && expected === answer;
    });
  }
  const correct = question.correctIndex;
  return typeof given === 'number' && Number.isInteger(given) && typeof correct === 'number' && given === correct;
}

/** The right answer, to show a learner who got it wrong: the option's index
 *  for a pick, the answer itself for a typed one (in Arabic as well when the
 *  question has one, so the page can show the one being read). */
export function revealAnswer(question: unknown): { correctIndex?: number; answer?: string; answerAr?: string } {
  if (!isRec(question)) return {};
  if (question.kind === 'text') {
    const answerAr = text(question.answerAr).trim();
    return { answer: text(question.answer).trim(), ...(answerAr ? { answerAr } : {}) };
  }
  return typeof question.correctIndex === 'number' ? { correctIndex: question.correctIndex } : {};
}

export function passMark(count: number, rule: QuizRule): number {
  return rule === 'all' ? count : Math.ceil(count * MOST_RATIO);
}

/** Mark a whole attempt. `answers` lines up with `questions`, one each. */
export function gradeQuiz(
  questions: unknown[],
  answers: unknown[],
  rule: QuizRule
): { correct: number; total: number; passed: boolean } {
  const total = questions.length;
  let correct = 0;
  questions.forEach((q, i) => {
    if (isQuestionCorrect(q, answers[i])) correct++;
  });
  return { correct, total, passed: total > 0 && answers.length === total && correct >= passMark(total, rule) };
}

/* ── Lab flags ── */

/** A flag proper: some prefix wrapped around a braced body, khana{...} and its
 *  cousins from other platforms. The prefix is captured, because a lab hosted
 *  on someone else's range hands back their token, and telling a student to
 *  type khana{...} when the answer starts HTB{ is a wrong instruction. */
const WRAPPED_TOKEN = /^([A-Za-z0-9_.-]*)\{.+\}$/;

/** Alphanumerics become asterisks; punctuation and spaces stay, because the
 *  dots in an address are the part that tells you it is an address. */
const shapeOf = (answer: string): string => answer.trim().replace(/\s+/g, ' ').replace(/[A-Za-z0-9]/g, '*');

/**
 * What the empty answer box suggests. Not every value a lab asks for is a
 * flag: plenty are answers to questions (the source IP, the port it listened
 * on), and khana{...} in front of those is a wrong instruction. So the hint is
 * derived from the answer the creator wrote, unless they wrote one of their
 * own. The server works it out before the answer is taken away.
 */
export function flagPlaceholder(flag: unknown): string {
  if (!isRec(flag)) return '';
  const own = text(flag.placeholder).trim();
  if (own) return own;
  const answer = text(flag.answer).trim();
  if (!answer) return '';
  const wrapped = WRAPPED_TOKEN.exec(answer);
  return wrapped ? `${wrapped[1]}{...}` : shapeOf(answer);
}

/** Case is ignored unless the creator said it matters. */
export function flagMatches(flag: unknown, submitted: unknown): boolean {
  if (!isRec(flag) || typeof submitted !== 'string') return false;
  const expected = text(flag.answer).trim();
  const given = submitted.trim();
  if (!expected) return false;
  return flag.caseSensitive === true ? expected === given : expected.toLowerCase() === given.toLowerCase();
}

/* ── The built-in courses' answers, for the server ──
 * The built-in courses ship in the browser bundle, so their answers are kept
 * out of it (data/linuxQuizAnswers.ts), and scripts/build-xp-catalog.mjs
 * writes what the server marks against to backend/src/data/builtinAnswerKey.json
 * in this shape. */

/** One question's answer, and nothing a learner would read. */
export type KeyedAnswer = { kind: 'mcq'; correctIndex: number } | { kind: 'text'; answer: string };

export interface BuiltinTest {
  id: string;
  expectedOutput: string;
}

export interface BuiltinAnswerKey {
  /** Built-in module id, then lecture id, to that lecture's quiz. */
  quizzes: Record<string, Record<string, KeyedAnswer[]>>;
  /** Language slug, then concept id, to the tests a challenge is marked against. */
  tests: Record<string, Record<string, BuiltinTest[]>>;
  /** Built-in networking lesson id to its quiz. */
  networking: Record<string, KeyedAnswer[]>;
}

/** An authored question reduced to its answer. */
export function keyedAnswer(question: unknown): KeyedAnswer {
  if (isRec(question) && question.kind === 'text') return { kind: 'text', answer: text(question.answer).trim() };
  const index = isRec(question) && typeof question.correctIndex === 'number' ? question.correctIndex : -1;
  return { kind: 'mcq', correctIndex: index };
}

/* ── Challenge tests ── */

/** Trailing whitespace is forgiven, the way the editor's own test run has
 *  always compared: a final newline from print() is not a wrong answer. */
export function outputMatches(expected: unknown, actual: unknown): boolean {
  return typeof actual === 'string' && text(expected).trimEnd() === actual.trimEnd();
}
