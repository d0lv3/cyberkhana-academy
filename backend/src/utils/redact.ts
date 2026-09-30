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
 * and in `courseData` (what the viewer reads), and a lab once more in `labs`,
 * so all three are covered.
 */

import { answerMask, flagPlaceholder, isTypedQuestion } from '../shared/checks';
import { isPlainObject, type AnyItem } from './contentStatus';

function question(q: unknown): unknown {
  if (!isPlainObject(q)) return q;
  const { correctIndex: _index, answer, ...rest } = q;
  return isTypedQuestion(q) ? { ...rest, mask: answerMask(typeof answer === 'string' ? answer : '') } : rest;
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
  const out: AnyItem = { ...item };
  if ('chapters' in item) {
    out.chapters = mapList(item.chapters, (chapter) => ({
      ...chapter,
      sections: mapList(chapter.sections, (section) => ('quiz' in section ? { ...section, quiz: quiz(section.quiz) } : section)),
    }));
  }
  if ('labs' in item) out.labs = Array.isArray(item.labs) ? item.labs.map(lab) : item.labs;
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

/** An item of a flat bucket, ready for the published feed. */
export function forStudents(bucket: string, item: AnyItem): AnyItem {
  if (bucket === 'os-modules' || bucket === 'standalone-modules') return moduleItem(item);
  if (bucket === 'networking-lessons' && 'quiz' in item) return { ...item, quiz: quiz(item.quiz) };
  return item;
}
