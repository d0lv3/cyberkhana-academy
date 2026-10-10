/* ─── Content as students receive it ───
 *
 * A creator's quiz and lab are stored with their answers, because the server
 * marks against them (shared/checks.ts, routes/progress.ts). The student feed
 * takes every answer out on the way past: a quiz question keeps its options but
 * not which one is right, a typed question sends the shape of its answer in
 * its place, and a flag sends only the hint for its empty box. The author, an
 * admin and anyone the author shared the work with still get it whole, through
 * their own routes.
 *
 * A module carries each answer twice, in `chapters` (what the studio edits)
 * and in `courseData` (what the viewer reads), and a lab once more in `labs`.
 * Only `courseData` is sent, with its answers taken out. The other two are the
 * studio's working copy and are left out whole (see moduleItem).
 */

import { answerMask, flagPlaceholder, isTypedQuestion } from '../shared/checks';
import { examInfoOf } from '../shared/exam';
import { isPlainObject, type AnyItem } from './contentStatus';

function question(q: unknown): unknown {
  if (!isPlainObject(q)) return q;
  // The Arabic answer is an answer like the other, and is taken out with it.
  const { correctIndex: _index, answer, answerAr, ...rest } = q;
  if (!isTypedQuestion(q)) return rest;
  const masked: AnyItem = { ...rest, mask: answerMask(typeof answer === 'string' ? answer : '') };
  if (typeof answerAr === 'string' && answerAr.trim()) masked.maskAr = answerMask(answerAr);
  return masked;
}

const quiz = (list: unknown): unknown => (Array.isArray(list) ? list.map(question) : list);

function flag(f: unknown): unknown {
  if (!isPlainObject(f)) return f;
  const { answer: _answer, ...rest } = f;
  const placeholder = flagPlaceholder(f);
  return placeholder ? { ...rest, placeholder } : rest;
}

function lab(l: unknown): unknown {
  if (!isPlainObject(l) || !isPlainObject(l.completion)) return l;
  const { completion } = l;
  return Array.isArray(completion.flags) ? { ...l, completion: { ...completion, flags: completion.flags.map(flag) } } : l;
}

const mapList = (list: unknown, fn: (item: AnyItem) => AnyItem): unknown =>
  Array.isArray(list) ? list.map((item) => (isPlainObject(item) ? fn(item) : item)) : list;

function moduleItem(item: AnyItem): AnyItem {
  /* `chapters` is every lesson a second time, in the shape the studio edits,
     and `labs` is the studio's list of labs, unfinished ones included. The
     viewer reads `courseData` alone, so neither is sent: a browser keeps this
     whole feed in storage that holds about 5 MB, and sending each lesson twice
     was filling it and locking people out at sign-in. */
  const { chapters: _chapters, labs: _labs, ...out } = item;
  if (isPlainObject(item.courseData)) {
    out.courseData = {
      ...item.courseData,
      modules: mapList(item.courseData.modules, (chapter) => ({
        ...chapter,
        lectures: mapList(chapter.lectures, (lecture) => {
          const copy: AnyItem = { ...lecture };
          if ('quizQuestions' in lecture) copy.quizQuestions = quiz(lecture.quizQuestions);
          if ('lab' in lecture) copy.lab = lab(lecture.lab);
          return copy;
        }),
      })),
    };
  }
  return out;
}

/* A path's final exam is not sent at all. Its questions and answers, and also
   its brief, its files and the address of its target, are for someone whose
   attempt has started, and they are handed over then (routes/exams.ts). What
   the feed carries in its place is the handful of figures a path page shows
   beside a locked exam. */
function pathItem(item: AnyItem): AnyItem {
  if (!('exam' in item) && !('examInfo' in item)) return item;
  // `examInfo` is only ever worked out here: one written into the item is dropped.
  const { exam, examInfo: _written, ...rest } = item;
  const info = examInfoOf(exam);
  return info ? { ...rest, examInfo: info } : rest;
}

/** An item of a flat bucket, ready for the published feed. */
export function forStudents(bucket: string, item: AnyItem): AnyItem {
  if (bucket === 'paths') return pathItem(item);
  if (bucket === 'os-modules' || bucket === 'standalone-modules') return moduleItem(item);
  if (bucket === 'networking-lessons' && 'quiz' in item) return { ...item, quiz: quiz(item.quiz) };
  return item;
}
