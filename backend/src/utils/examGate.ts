/* ─── Who may give a path an exam ───
 *
 * Writing a path takes the `paths` permission, and that is not enough to put
 * a final exam on one. The exam decides who is handed a certificate with
 * CyberKhana's name on it, so setting it, or the certificate, takes the
 * `exams` permission, which an admin grants by hand.
 *
 * The address of a target is narrower still: admins only. A learner is told
 * to attack whatever is typed there, so a wrong address sends a class of
 * students at a stranger's machine, and that is not a decision to delegate.
 *
 * A path is saved whole, by its owner and by anyone it is shared with, so the
 * question asked here is never "does this path have an exam" but "did this
 * save change it". Someone without the permission can go on editing a path an
 * admin put an exam on, carrying the exam through untouched.
 */

import { effectivePermissions } from '../types';
import { examTargets } from '../shared/exam';
import { isPlainObject, type AnyItem } from './contentStatus';

type Writer = { role: string; creatorPermissions?: string[] };

/** JSON with its keys in order, so two copies of one thing compare equal
 *  whatever order a browser or the database wrote them in. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** An exam that is off and empty, or a certificate that is off, is the same
 *  as none: an editor that writes its blank form is not setting anything. */
function examOf(item: AnyItem | undefined): unknown {
  const exam = item?.exam;
  if (!isPlainObject(exam)) return undefined;
  const empty = exam.enabled !== true && (!Array.isArray(exam.sections) || exam.sections.length === 0);
  return empty ? undefined : exam;
}

function certificateOf(item: AnyItem | undefined): unknown {
  const certificate = item?.certificate;
  if (!isPlainObject(certificate)) return undefined;
  return certificate.enabled !== true && !certificate.title ? undefined : certificate;
}

/** Versions whose targets somebody has vouched for. */
function confirmedVersions(exam: unknown): Set<string> {
  const out = new Set<string>();
  if (!isPlainObject(exam) || !Array.isArray(exam.sections)) return out;
  for (const section of exam.sections) {
    if (!isPlainObject(section) || !Array.isArray(section.versions)) continue;
    for (const version of section.versions) {
      if (isPlainObject(version) && version.targetsConfirmed === true && typeof version.id === 'string') out.add(version.id);
    }
  }
  return out;
}

/** Targets this save adds, as `address|port`. */
export function addedTargets(before: AnyItem | undefined, after: AnyItem): string[] {
  const known = new Set(examTargets(before?.exam));
  return examTargets(after.exam).filter((target) => !known.has(target));
}

/** Why this user may not save the path as it stands, or null when they may. */
export function examGateProblem(user: Writer, before: AnyItem | undefined, after: AnyItem): string | null {
  if (user.role === 'admin') return null;

  const changed =
    stable(examOf(before)) !== stable(examOf(after)) || stable(certificateOf(before)) !== stable(certificateOf(after));
  if (!changed) return null;

  const perms = effectivePermissions(user as { role: 'user' | 'creator' | 'admin'; creatorPermissions?: string[] });
  if (!perms.includes('exams')) {
    return 'Setting a final exam or a certificate takes the "Exams and certificates" permission, which an admin grants.';
  }
  if (addedTargets(before, after).length > 0) {
    return 'Only an admin can set the address of an exam target.';
  }
  const vouched = confirmedVersions(before?.exam);
  if ([...confirmedVersions(after.exam)].some((id) => !vouched.has(id))) {
    return 'Only an admin can confirm that an exam target may be tested.';
  }
  return null;
}
