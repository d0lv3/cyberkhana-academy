/* The answers to the built-in Linux course's quizzes, kept apart from the
 * questions (data/linuxQuizData.ts) so they never reach the browser: nothing in
 * the app imports this file. scripts/build-xp-catalog.mjs copies it into
 * backend/src/data/builtinAnswerKey.json, which the server marks against, and
 * the build fails when the copy is stale or an answer no longer lines up with
 * its question.
 *
 * Each list gives the right option for every question of a lecture, in order,
 * counted in the order the options are written in linuxQuizData.ts. Reordering
 * or adding options there means updating the index here.
 */
const answers: Record<string, number[]> = {
  '2.1': [2, 0, 2, 1],
  '2.2': [1, 1, 0, 0, 1, 0],
  '2.3': [0, 1, 0, 0, 0, 2, 0, 0],
  '2.4': [0, 0, 0, 0, 0, 0],
  '3.1': [0, 0, 0, 0, 1, 0],
  '3.2': [0, 0, 0, 0, 0, 0],
  '3.3': [0, 0, 0, 0],
  '4.1': [0, 0, 0, 0],
  '4.2': [0, 0, 0],
  '5.1': [0, 0, 0],
  '5.2': [0, 0, 0],
  '5.3': [0, 0, 0],
  '6.1': [0, 0, 0, 0],
  '6.2': [0, 0, 0],
  '7.1': [0, 0, 0, 0, 0],
  '7.2': [0, 0, 0],
  '8.1': [0, 0, 0],
  '8.2': [0, 0, 0],
  '8.3': [0, 0, 0],
  '9.1': [0, 1, 0],
  '9.2': [0, 0],
};

export default answers;
