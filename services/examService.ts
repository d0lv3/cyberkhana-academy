/* ─── A path's final exam, from the browser's side ───
 *
 * Two halves. The first is for the Studio: blank sections and tasks, and the
 * tidying an authored exam gets before it is saved. The second is for the
 * learner: where they stand, starting an attempt, keeping their answers, and
 * handing it in. Everything that decides anything is on the server
 * (backend/src/routes/exams.ts); what is here asks, and shows the answer.
 *
 * The exam's shape and its checks are shared with the server
 * (backend/src/shared/exam.ts), so the Studio refuses exactly what a save
 * would be refused for.
 */

import { api } from './api';
import {
  EXAM_DEFAULTS,
  examProblem,
  certificateProblem,
  isTargetAddress,
  type ExamAnswer,
  type ExamInfo,
  type ExamSection,
  type ExamSectionKind,
  type ExamTask,
  type ExamTaskKind,
  type ExamVersion,
  type PathCertificate,
  type PathExam,
} from '../backend/src/shared/exam';

export {
  EXAM_DEFAULTS,
  EXAM_LIMITS,
  examInfoOf,
  isTargetAddress,
  isTaskComplete,
  targetText,
  cleanCertificateName,
} from '../backend/src/shared/exam';
export type {
  ExamAnswer,
  ExamFile,
  ExamInfo,
  ExamLink,
  ExamSection,
  ExamSectionKind,
  ExamTarget,
  ExamTask,
  ExamTaskKind,
  ExamVersion,
  PathCertificate,
  PathExam,
} from '../backend/src/shared/exam';

/* ── For the Studio ── */

let counter = 0;
/** An id for a new section, version, task or target. Letters, digits and
 *  dashes only: the server refuses anything else. */
export const examUid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const newExamTask = (kind: ExamTaskKind = 'mcq'): ExamTask => ({
  id: examUid('task'),
  kind,
  prompt: '',
  points: kind === 'flag' ? 5 : 1,
  options: ['', ''],
  correctIndex: 0,
  answer: '',
});

export const newExamVersion = (): ExamVersion => ({
  id: examUid('ver'),
  brief: { en: '', ar: '' },
  targets: [],
  links: [],
  files: [],
  tasks: [],
});

export const newExamSection = (kind: ExamSectionKind): ExamSection => ({
  id: examUid('sec'),
  title: kind === 'theory' ? 'Knowledge check' : 'Practical',
  kind,
  versions: [newExamVersion()],
});

export const blankExam = (): PathExam => ({
  enabled: false,
  passPercent: EXAM_DEFAULTS.passPercent,
  timeLimitMinutes: EXAM_DEFAULTS.timeLimitMinutes,
  cooldownHours: EXAM_DEFAULTS.cooldownHours,
  rules: { en: '', ar: '' },
  sections: [],
});

export const blankCertificate = (): PathCertificate => ({ enabled: false });

/** Has the author put anything into this exam yet? An untouched blank form is
 *  left out of the path altogether, so saving a path never looks like setting
 *  an exam on it. */
export function examHasContent(exam: PathExam | undefined | null): boolean {
  return !!exam && (exam.enabled || exam.sections.length > 0);
}

function cleanTask(task: ExamTask): ExamTask | null {
  const prompt = task.prompt.trim();
  const points = Number.isInteger(task.points) && task.points >= 1 ? task.points : 1;
  const stepKey = task.stepKey || undefined;

  if (task.kind === 'mcq') {
    const picked = (task.options ?? [])[task.correctIndex ?? 0];
    const options = (task.options ?? []).map((o) => o.trim()).filter(Boolean);
    if (!prompt && options.length === 0) return null;
    // The right answer follows its text, wherever dropping the blanks moved it.
    const correctIndex = Math.max(0, picked !== undefined ? options.indexOf(picked.trim()) : 0);
    return { id: task.id, kind: 'mcq', prompt, points, options, correctIndex, stepKey };
  }

  const answer = (task.answer ?? '').trim();
  if (!prompt && !answer) return null;
  if (task.kind === 'flag') {
    return {
      id: task.id,
      kind: 'flag',
      prompt,
      points,
      answer,
      caseSensitive: task.caseSensitive === true ? true : undefined,
      placeholder: task.placeholder?.trim() || undefined,
      stepKey,
    };
  }
  return { id: task.id, kind: 'text', prompt, points, answer, stepKey };
}

/** The exam as it is saved: the empty rows an editor leaves behind dropped,
 *  and nothing in it the server would turn away for its shape. */
export function cleanExam(exam: PathExam): PathExam {
  const int = (value: number, fallback: number) => (Number.isFinite(value) ? Math.round(value) : fallback);
  return {
    enabled: exam.enabled,
    paused: exam.paused ? true : undefined,
    opensAt: exam.opensAt || undefined,
    closesAt: exam.closesAt || undefined,
    passPercent: int(exam.passPercent, EXAM_DEFAULTS.passPercent),
    timeLimitMinutes: int(exam.timeLimitMinutes, EXAM_DEFAULTS.timeLimitMinutes),
    cooldownHours: int(exam.cooldownHours, EXAM_DEFAULTS.cooldownHours),
    maxAttempts: exam.maxAttempts ? int(exam.maxAttempts, 1) : undefined,
    rules: { en: exam.rules?.en ?? '', ar: exam.rules?.ar ?? '' },
    sections: exam.sections.map((section) => ({
      id: section.id,
      title: section.title.trim(),
      kind: section.kind,
      drawCount: section.kind === 'theory' && section.drawCount ? int(section.drawCount, 1) : undefined,
      versions: section.versions.map((version) => {
        const targets = version.targets
          .map((t) => ({
            id: t.id,
            label: t.label.trim(),
            address: t.address.trim(),
            ...(t.port ? { port: int(t.port, 0) } : {}),
          }))
          .filter((t) => t.address);
        return {
          id: version.id,
          brief: { en: version.brief?.en ?? '', ar: version.brief?.ar ?? '' },
          targets,
          // A tick with nothing to vouch for means nothing.
          targetsConfirmed: targets.length > 0 && version.targetsConfirmed === true ? true : undefined,
          links: version.links
            .map((l) => ({ id: l.id, label: l.label.trim(), url: l.url.trim() }))
            .filter((l) => /^https?:\/\/\S+$/i.test(l.url)),
          files: version.files,
          tasks: version.tasks.map(cleanTask).filter((t): t is ExamTask => t !== null),
        };
      }),
    })),
  };
}

/** Why this exam and certificate cannot go live as they are, or null. The
 *  same check the server makes when the path is published. */
export function publishProblem(exam: PathExam | undefined, certificate: PathCertificate | undefined): string | null {
  const awards = certificate?.enabled === true;
  return (
    examProblem(exam, { complete: true, certificate: awards }) ?? certificateProblem(certificate, exam, true)
  );
}

/** Why this exam cannot be saved at all, even as a draft, or null: a value out
 *  of range, or a target that is not an address. */
export function shapeProblem(exam: PathExam | undefined, certificate: PathCertificate | undefined): string | null {
  return examProblem(exam, { complete: false, certificate: false }) ?? certificateProblem(certificate, exam, false);
}

/** A target address the author has typed that is not one. */
export const badTargetAddress = (address: string): boolean => address.trim() !== '' && !isTargetAddress(address);

/* ── For the learner ── */

export type ExamState =
  | 'author'
  | 'locked'
  | 'paused'
  | 'not-open'
  | 'closed'
  | 'exhausted'
  | 'cooldown'
  | 'ready'
  | 'active'
  | 'passed';

export interface ExamResult {
  id: string;
  number: number;
  earned: number;
  total: number;
  percent: number;
  passPercent: number;
  passed: boolean;
  distinction: boolean;
  timedOut: boolean;
  submittedAt: string | null;
  /** Path steps whose tasks lost points. */
  review: { key: string; title: string; earned: number; total: number }[];
}

export interface ExamStatus {
  state: ExamState;
  exam: ExamInfo & { rules: { en: string; ar: string }; certificate: boolean };
  path: { complete: boolean; done: number; available: number };
  attemptsUsed: number;
  retryAt: string | null;
  active: { id: string; deadline: string } | null;
  last: ExamResult | null;
  passed: ExamResult | null;
  certificate: { code: string; revoked: boolean } | null;
  claimable: boolean;
  serverNow: string;
}

export interface AttemptTaskView {
  id: string;
  kind: ExamTaskKind;
  prompt: string;
  points: number;
  options?: string[];
  placeholder?: string;
}

export interface AttemptSectionView {
  id: string;
  title: string;
  kind: ExamSectionKind;
  brief: { en: string; ar: string };
  targets: { label: string; address: string; port?: number }[];
  links: { label: string; url: string }[];
  files: { name: string; url: string; kind: string; bytes: number }[];
  tasks: AttemptTaskView[];
}

export interface AttemptView {
  id: string;
  number: number;
  startedAt: string;
  deadline: string;
  serverNow: string;
  passPercent: number;
  sections: AttemptSectionView[];
  answers: { task: string; value: ExamAnswer }[];
  reported: boolean;
}

const at = (pathId: string) => `/exams/${encodeURIComponent(pathId)}`;

export const fetchExamStatus = (pathId: string) => api.get<ExamStatus>(at(pathId));

export const startExam = (pathId: string) => api.post<{ attempt: AttemptView }>(`${at(pathId)}/start`);

export const fetchAttempt = (pathId: string) => api.get<{ attempt: AttemptView }>(`${at(pathId)}/attempt`);

export const saveExamAnswers = (pathId: string, attemptId: string, answers: { task: string; value: ExamAnswer }[]) =>
  api.put<{ ok: true; serverNow: string; deadline: string }>(`${at(pathId)}/answers`, { attemptId, answers });

export const submitExam = (pathId: string, attemptId: string, answers: { task: string; value: ExamAnswer }[]) =>
  api.post<{ result: ExamResult; certificate: boolean }>(`${at(pathId)}/submit`, { attemptId, answers });

export const reportExamProblem = (pathId: string, attemptId: string, note: string) =>
  api.post<{ ok: true }>(`${at(pathId)}/report`, { attemptId, note });

/* ── For whoever runs the exam ── */

export interface ExamStats {
  attempts: { submitted: number; passed: number; active: number; voided: number; reported: number };
  averagePercent: number | null;
  certificates: { issued: number; revoked: number };
  tasks: { id: string; right: number; seen: number }[];
}

const ownerQuery = (ownerId?: string) => (ownerId ? `?owner=${encodeURIComponent(ownerId)}` : '');

export const fetchExamStats = (pathId: string, ownerId?: string) =>
  api.get<ExamStats>(`${at(pathId)}/stats${ownerQuery(ownerId)}`);

export interface ExamAttemptRow {
  id: string;
  user: { id: string; displayName: string; username: string | null };
  number: number;
  status: 'active' | 'submitted' | 'voided';
  startedAt: string;
  deadline: string;
  submittedAt: string | null;
  percent: number | null;
  passed: boolean;
  timedOut: boolean;
  report: { at: string; note: string } | null;
  voidReason: string | null;
}

export const fetchExamAttempts = (pathId: string, ownerId?: string) =>
  api.get<{ attempts: ExamAttemptRow[] }>(`${at(pathId)}/attempts${ownerQuery(ownerId)}`);

export const voidExamAttempt = (attemptId: string, reason: string) =>
  api.post<{ ok: true }>(`/exams/attempts/${attemptId}/void`, { reason });
