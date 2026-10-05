/* ─── A path's final exam ───
 *
 * The last stop of a learning path, and what stands between finishing it and
 * holding its certificate. An exam is a run of sections. A theory section is
 * a bank of questions; a practical section is a scenario: a brief, the address
 * of something to work against, files to work from, and the tasks answered
 * from them. A section may be written in several versions, each with its own
 * target, files and answers, and an attempt is dealt one of them.
 *
 * Nothing here runs a lab. A target is an address somebody typed in, shown to
 * the learner once their attempt starts; the Academy never connects to it.
 *
 * The server marks every attempt (routes/exams.ts) against answers the
 * browser is never sent (utils/redact.ts). The browser compiles this file too,
 * for the studio's own checks and a creator's preview of an unsaved draft.
 * Like shared/checks.ts it touches no browser or Node API.
 */

import { flagMatches, flagPlaceholder, isQuestionCorrect } from './checks';

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/* ── Shape ── */

/** How a task is answered: a pick, a typed answer marked loosely, or a value
 *  brought back from the environment and marked as a flag is. */
export type ExamTaskKind = 'mcq' | 'text' | 'flag';

export interface ExamTask {
  id: string;
  kind: ExamTaskKind;
  prompt: string;
  /** What a right answer is worth. The pass mark is a share of the total. */
  points: number;
  /** A pick only. */
  options?: string[];
  correctIndex?: number;
  /** A typed answer or a flag. */
  answer?: string;
  /** A flag only: off unless the author says case matters. */
  caseSensitive?: boolean;
  /** A flag only: what the empty box suggests, when the answer's own shape is
   *  not hint enough. */
  placeholder?: string;
  /** `kind:refId` of the path step this task examines, so a learner who gets
   *  it wrong is told what to go back over. */
  stepKey?: string;
}

/** Something to work against. An address, never a link: it is pasted into a
 *  terminal, not clicked. */
export interface ExamTarget {
  id: string;
  label: string;
  /** An IPv4 address or range, an IPv6 address, or a hostname. */
  address: string;
  port?: number;
}

export interface ExamLink {
  id: string;
  label: string;
  url: string;
}

export interface ExamFile {
  id: string;
  name: string;
  url: string;
  kind: string;
  bytes: number;
}

export interface ExamVersion {
  id: string;
  brief: { en: string; ar: string };
  targets: ExamTarget[];
  /** Ticked by whoever set the targets: CyberKhana controls them, or has
   *  permission to have them tested. A version with targets is not published
   *  without it. */
  targetsConfirmed?: boolean;
  links: ExamLink[];
  files: ExamFile[];
  tasks: ExamTask[];
}

export type ExamSectionKind = 'theory' | 'practical';

export interface ExamSection {
  id: string;
  title: string;
  kind: ExamSectionKind;
  /** Theory only: deal this many of the bank's questions to each attempt.
   *  Unset deals all of them. */
  drawCount?: number;
  /** At least one. Theory keeps one; a practical section may keep several. */
  versions: ExamVersion[];
}

export interface PathExam {
  enabled: boolean;
  /** Closed for now, whatever else says it is open: the target is down. */
  paused?: boolean;
  /** ISO times an attempt may start between. Either may be absent. */
  opensAt?: string;
  closesAt?: string;
  /** Share of the points that passes, as a whole percentage. */
  passPercent: number;
  timeLimitMinutes: number;
  /** How long after an attempt the next may start. */
  cooldownHours: number;
  /** Unset is as many as it takes. */
  maxAttempts?: number;
  rules: { en: string; ar: string };
  sections: ExamSection[];
}

export interface PathCertificate {
  enabled: boolean;
  /** Printed in place of the path's English title, when set. */
  title?: string;
}

/** What a path says about its exam before anyone starts it. */
export interface ExamInfo {
  tasks: number;
  points: number;
  minutes: number;
  passPercent: number;
  cooldownHours: number;
  maxAttempts: number | null;
  practical: boolean;
  paused: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

/* ── Limits ── */

export const EXAM_LIMITS = {
  sections: 12,
  versions: 6,
  tasks: 150,
  options: 6,
  targets: 8,
  links: 8,
  files: 12,
  prompt: 2000,
  option: 400,
  answer: 400,
  label: 160,
  brief: 30_000,
  rules: 12_000,
  points: 100,
  passMin: 50,
  passMax: 100,
  minutesMin: 5,
  /** Seven days: a practical exam is worked at over several sittings. */
  minutesMax: 7 * 24 * 60,
  cooldownMax: 30 * 24,
  attemptsMax: 20,
  /** What an attempt has to ask before a certificate may hang on it. */
  certificateMinTasks: 5,
} as const;

export const EXAM_DEFAULTS = {
  passPercent: 70,
  timeLimitMinutes: 30,
  cooldownHours: 24,
  /** At or above this share of the points a pass is one with distinction. */
  distinctionPercent: 90,
} as const;

/* ── Target addresses ── */

const HOSTNAME = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const IPV6 = /^(?=.*:.*:)[0-9a-f:]{2,39}$/i;

function isIpv4(value: string): boolean {
  const [address, prefix, ...rest] = value.split('/');
  if (rest.length) return false;
  if (prefix !== undefined && !(/^\d{1,2}$/.test(prefix) && Number(prefix) <= 32)) return false;
  const parts = address.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** An IPv4 address (a /prefix after it names a range), an IPv6 address, or a
 *  hostname. Never a URL: a scheme, a path or a space fails. */
export function isTargetAddress(value: unknown): boolean {
  const v = text(value).trim();
  if (!v || v.length > 253) return false;
  // Four dotted numbers are an address or nothing: 10.10.10.999 is a typo,
  // not a hostname that happens to look like one.
  if (/^[\d./]+$/.test(v)) return isIpv4(v);
  return IPV6.test(v) || HOSTNAME.test(v);
}

export const isTargetPort = (value: unknown): boolean =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535;

/** A target as it is typed into a terminal. */
export function targetText(target: { address: string; port?: number }): string {
  const address = target.address.trim();
  if (!target.port) return address;
  return address.includes(':') ? `[${address}]:${target.port}` : `${address}:${target.port}`;
}

/** Every target an exam names, as `address|port`, for telling which are new. */
export function examTargets(exam: unknown): string[] {
  const out: string[] = [];
  for (const section of list(isRec(exam) ? exam.sections : null)) {
    for (const version of list(isRec(section) ? section.versions : null)) {
      for (const target of list(isRec(version) ? version.targets : null)) {
        if (isRec(target) && text(target.address).trim()) {
          out.push(`${text(target.address).trim().toLowerCase()}|${typeof target.port === 'number' ? target.port : ''}`);
        }
      }
    }
  }
  return out;
}

/* ── Reading an authored exam ── */

const ID = /^[A-Za-z0-9_-]{1,80}$/;
const isHttpUrl = (value: unknown): boolean => /^https?:\/\/\S+$/i.test(text(value).trim()) && text(value).length <= 2000;

/** Is this task ready to be asked? */
export function isTaskComplete(task: unknown): boolean {
  if (!isRec(task) || !text(task.prompt).trim()) return false;
  if (!(typeof task.points === 'number' && Number.isInteger(task.points) && task.points >= 1)) return false;
  if (task.kind === 'mcq') {
    const options = list(task.options).map((o) => text(o).trim());
    return (
      options.length >= 2 &&
      options.every(Boolean) &&
      typeof task.correctIndex === 'number' &&
      Number.isInteger(task.correctIndex) &&
      task.correctIndex >= 0 &&
      task.correctIndex < options.length
    );
  }
  return text(task.answer).trim() !== '';
}

/** How many tasks, and how many points, one attempt at this section holds. */
function sectionSize(section: Rec): { tasks: number; points: number } {
  const versions = list(section.versions).filter(isRec);
  const first = versions[0];
  const tasks = list(first?.tasks).filter(isRec);
  const draw =
    section.kind === 'theory' && typeof section.drawCount === 'number' && section.drawCount > 0
      ? Math.min(section.drawCount, tasks.length)
      : tasks.length;
  const total = tasks.reduce((sum, t) => sum + (typeof t.points === 'number' ? t.points : 0), 0);
  // A draw takes some of the bank: the points it carries are the bank's share.
  const points = draw === tasks.length || tasks.length === 0 ? total : Math.round((total * draw) / tasks.length);
  return { tasks: draw, points };
}

export function examInfoOf(exam: unknown): ExamInfo | null {
  if (!isRec(exam) || exam.enabled !== true) return null;
  let tasks = 0;
  let points = 0;
  let practical = false;
  for (const section of list(exam.sections).filter(isRec)) {
    const size = sectionSize(section);
    tasks += size.tasks;
    points += size.points;
    if (section.kind === 'practical') practical = true;
  }
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  return {
    tasks,
    points,
    minutes: num(exam.timeLimitMinutes, EXAM_DEFAULTS.timeLimitMinutes),
    passPercent: num(exam.passPercent, EXAM_DEFAULTS.passPercent),
    cooldownHours: num(exam.cooldownHours, EXAM_DEFAULTS.cooldownHours),
    maxAttempts: typeof exam.maxAttempts === 'number' ? exam.maxAttempts : null,
    practical,
    paused: exam.paused === true,
    opensAt: text(exam.opensAt) || null,
    closesAt: text(exam.closesAt) || null,
  };
}

/**
 * What is wrong with an authored exam, or null.
 *
 * The shape is always checked: an exam is stored and sent on, so a field of
 * the wrong type or a list without end is refused whatever state it is in.
 * `complete` adds what it takes to be sat: it is asked for once the exam is
 * switched on and its path published, and a draft is left to be unfinished.
 */
export function examProblem(exam: unknown, options: { complete: boolean; certificate: boolean }): string | null {
  if (exam === undefined || exam === null) return null;
  if (!isRec(exam)) return 'The exam is not in a shape that can be saved';

  const intIn = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (!intIn(exam.passPercent, EXAM_LIMITS.passMin, EXAM_LIMITS.passMax)) {
    return `The pass mark is a whole percentage from ${EXAM_LIMITS.passMin} to ${EXAM_LIMITS.passMax}`;
  }
  if (!intIn(exam.timeLimitMinutes, EXAM_LIMITS.minutesMin, EXAM_LIMITS.minutesMax)) {
    return `The time limit is from ${EXAM_LIMITS.minutesMin} minutes to ${EXAM_LIMITS.minutesMax / 1440} days`;
  }
  if (!intIn(exam.cooldownHours, 0, EXAM_LIMITS.cooldownMax)) return 'The wait between attempts is not valid';
  if (exam.maxAttempts !== undefined && !intIn(exam.maxAttempts, 1, EXAM_LIMITS.attemptsMax)) {
    return `The attempt cap is from 1 to ${EXAM_LIMITS.attemptsMax}`;
  }
  for (const key of ['opensAt', 'closesAt'] as const) {
    if (exam[key] !== undefined && (typeof exam[key] !== 'string' || Number.isNaN(Date.parse(exam[key] as string)))) {
      return 'The exam window has a date that cannot be read';
    }
  }
  if (text(exam.opensAt) && text(exam.closesAt) && Date.parse(text(exam.opensAt)) >= Date.parse(text(exam.closesAt))) {
    return 'The exam window closes before it opens';
  }
  const rules = isRec(exam.rules) ? exam.rules : {};
  if (text(rules.en).length > EXAM_LIMITS.rules || text(rules.ar).length > EXAM_LIMITS.rules) {
    return 'The exam rules are too long';
  }

  const sections = list(exam.sections);
  if (sections.length > EXAM_LIMITS.sections) return `An exam has at most ${EXAM_LIMITS.sections} sections`;
  const seen = new Set<string>();
  const fresh = (id: unknown): boolean => {
    if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  };

  for (const section of sections) {
    if (!isRec(section) || !fresh(section.id)) return 'Every exam section needs an id of its own';
    const name = text(section.title).trim() || 'A section';
    if (text(section.title).length > EXAM_LIMITS.label) return 'A section title is too long';
    if (section.kind !== 'theory' && section.kind !== 'practical') return `${name} is neither theory nor practical`;
    const versions = list(section.versions);
    if (versions.length > EXAM_LIMITS.versions) return `${name} has more than ${EXAM_LIMITS.versions} versions`;
    if (section.drawCount !== undefined && !intIn(section.drawCount, 1, EXAM_LIMITS.tasks)) {
      return `${name} draws a number of questions that is not valid`;
    }

    for (const version of versions) {
      if (!isRec(version) || !fresh(version.id)) return `${name} has a version without an id of its own`;
      const brief = isRec(version.brief) ? version.brief : {};
      if (text(brief.en).length > EXAM_LIMITS.brief || text(brief.ar).length > EXAM_LIMITS.brief) {
        return `The brief of ${name} is too long`;
      }

      const targets = list(version.targets);
      if (targets.length > EXAM_LIMITS.targets) return `${name} names more than ${EXAM_LIMITS.targets} targets`;
      for (const target of targets) {
        if (!isRec(target) || !fresh(target.id)) return `${name} has a target without an id of its own`;
        if (text(target.label).length > EXAM_LIMITS.label) return `A target label in ${name} is too long`;
        if (!isTargetAddress(target.address)) {
          return `"${text(target.address).slice(0, 60)}" is not an IP address or a hostname`;
        }
        if (target.port !== undefined && !isTargetPort(target.port)) return `A target in ${name} has a port that is not valid`;
      }

      const links = list(version.links);
      if (links.length > EXAM_LIMITS.links) return `${name} has more than ${EXAM_LIMITS.links} links`;
      for (const link of links) {
        if (!isRec(link) || !fresh(link.id) || !isHttpUrl(link.url) || text(link.label).length > EXAM_LIMITS.label) {
          return `${name} has a link that is not an http or https address`;
        }
      }

      const files = list(version.files);
      if (files.length > EXAM_LIMITS.files) return `${name} has more than ${EXAM_LIMITS.files} files`;
      for (const file of files) {
        // Uploaded through the lab uploader, which is the only thing that mints these paths.
        if (!isRec(file) || !fresh(file.id) || !/^(https?:\/\/\S+|\/uploads\/\S+)$/.test(text(file.url)) || text(file.name).length > 255) {
          return `${name} has a file that was not uploaded here`;
        }
      }

      const tasks = list(version.tasks);
      if (tasks.length > EXAM_LIMITS.tasks) return `${name} has more than ${EXAM_LIMITS.tasks} tasks`;
      for (const task of tasks) {
        if (!isRec(task) || !fresh(task.id)) return `${name} has a task without an id of its own`;
        if (task.kind !== 'mcq' && task.kind !== 'text' && task.kind !== 'flag') return `${name} has a task of an unknown kind`;
        if (text(task.prompt).length > EXAM_LIMITS.prompt) return `A task in ${name} is too long`;
        if (!intIn(task.points, 1, EXAM_LIMITS.points)) return `A task in ${name} is worth a number of points that is not valid`;
        const opts = list(task.options);
        if (opts.length > EXAM_LIMITS.options || opts.some((o) => typeof o !== 'string' || o.length > EXAM_LIMITS.option)) {
          return `A task in ${name} has options that cannot be saved`;
        }
        if (text(task.answer).length > EXAM_LIMITS.answer || text(task.placeholder).length > EXAM_LIMITS.answer) {
          return `An answer in ${name} is too long`;
        }
        if (task.stepKey !== undefined && (typeof task.stepKey !== 'string' || task.stepKey.length > 240)) {
          return `A task in ${name} points at a step that cannot be read`;
        }
      }

      if (options.complete && exam.enabled === true) {
        if (tasks.length === 0) return `${name} has a version with no tasks`;
        if (!tasks.every(isTaskComplete)) return `${name} has a task without a prompt, an answer or its points`;
        if (targets.length > 0 && version.targetsConfirmed !== true) {
          return `Confirm that the targets in ${name} may be tested before publishing`;
        }
      }
    }

    if (options.complete && exam.enabled === true) {
      if (versions.length === 0) return `${name} is empty`;
      if (section.kind === 'theory' && typeof section.drawCount === 'number') {
        const smallest = Math.min(...versions.map((v) => list(isRec(v) ? v.tasks : null).length));
        if (section.drawCount > smallest) return `${name} draws more questions than its bank holds`;
      }
    }
  }

  if (options.complete && exam.enabled === true) {
    const info = examInfoOf(exam);
    if (!info || info.tasks === 0) return 'An exam needs at least one section with a task in it';
    if (options.certificate && info.tasks < EXAM_LIMITS.certificateMinTasks) {
      return `An exam that awards a certificate asks at least ${EXAM_LIMITS.certificateMinTasks} tasks per attempt`;
    }
  }
  return null;
}

export function certificateProblem(certificate: unknown, exam: unknown, complete: boolean): string | null {
  if (certificate === undefined || certificate === null) return null;
  if (!isRec(certificate) || typeof certificate.enabled !== 'boolean') return 'The certificate setting is not in a shape that can be saved';
  if (certificate.title !== undefined && (typeof certificate.title !== 'string' || certificate.title.length > EXAM_LIMITS.label)) {
    return 'The certificate title is too long';
  }
  if (complete && certificate.enabled && !(isRec(exam) && exam.enabled === true)) {
    return 'A certificate is awarded for passing the final exam, so the path needs one';
  }
  return null;
}

/* ── Marking ── */

/** What a learner gives for one task: the option picked, counted as it was
 *  shown to them, or what they typed. */
export type ExamAnswer = number | string;

/** Is `given` right? `task` is the attempt's own copy, with its answer. */
export function isTaskCorrect(task: unknown, given: unknown): boolean {
  if (!isRec(task)) return false;
  if (task.kind === 'mcq') {
    return typeof given === 'number' && Number.isInteger(given) && typeof task.correctIndex === 'number' && given === task.correctIndex;
  }
  if (task.kind === 'flag') return flagMatches({ answer: task.answer, caseSensitive: task.caseSensitive }, given);
  return isQuestionCorrect({ kind: 'text', answer: task.answer }, given);
}

/** The hint in a flag's empty box, worked out before its answer is taken away. */
export function taskPlaceholder(task: unknown): string {
  return isRec(task) && task.kind === 'flag' ? flagPlaceholder(task) : '';
}

/** Does this share of the points pass? Compared exactly, never after rounding:
 *  69.6% is not 70%. */
export function passes(earned: number, total: number, passPercent: number): boolean {
  return total > 0 && earned * 100 >= passPercent * total;
}

/** The whole percentage shown for a score, rounded down for the same reason. */
export const shownPercent = (earned: number, total: number): number =>
  total > 0 ? Math.floor((earned * 100) / total) : 0;

/* ── The name on a certificate ── */

const NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;

/** The name as it will be printed, or null when it cannot be: letters of any
 *  script with the marks names carry, from two to eighty characters. */
export function cleanCertificateName(raw: unknown): string | null {
  const name = text(raw).normalize('NFC').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80 || !NAME.test(name)) return null;
  return name;
}
