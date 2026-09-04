/* ─── Labs ───
 *
 * A lab is the hands-on half of a module: the part a student *does* rather
 * than reads. Almost none of it runs here. The work happens on someone else's
 * range (TryHackMe, Hack The Box, a CTF instance, a VM the creator hosts), so
 * what this platform owns is the brief, the way in, the files you need, and
 * the record that you finished. The one exception is a network simulation,
 * which is ours and runs in the page.
 *
 * The three ingredients are deliberately not a union. "Download this capture,
 * then open the room" is one lab, not two, so a lab carries links, files and
 * an optional simulation together and shows whichever it has.
 *
 * Bilinguality follows the house rule: bodies are { en, ar }, short labels are
 * plain strings (the same split section titles and quiz questions use).
 */

import type { NetworkSimulation } from '../components/network-sim/types';
import { hasSimulation } from '../components/network-sim/types';

/** A way out to where the lab actually runs. */
export interface LabLink {
  id: string;
  /** e.g. "Open the room on TryHackMe" */
  label: string;
  url: string;
}

/** A file the student downloads to do the work: a capture, a worksheet, configs. */
export interface LabFile {
  id: string;
  /** The creator's original filename, kept for display (never used on disk). */
  name: string;
  url: string;
  /** Extension, lowercase and without the dot, shown as the type chip. */
  kind: string;
  bytes: number;
}

/** Something the student has to find in the lab environment and bring back. */
export interface LabFlag {
  id: string;
  /** What to look for, e.g. "The resolver's IP address". */
  label: string;
  /** The expected value. Checked in the browser, see checkFlag(). */
  answer: string;
  /** Optional nudge, revealed on request. */
  hint?: string;
  /** Off by default: most flags are strings where case is noise. */
  caseSensitive?: boolean;
}

/** Where the lab sits in the module's table of contents. */
export type LabPlacement =
  | { at: 'end' }
  | { at: 'after-section'; sectionId: string };

/**
 * How a student records that they are done.
 *   self  → a button. Nothing to verify, and we do not pretend otherwise.
 *   flags → one or more values extracted from the lab environment. All of them
 *           have to be right before the lab counts as finished.
 */
export type LabCompletion =
  | { mode: 'self' }
  | { mode: 'flags'; flags: LabFlag[] };

export interface ModuleLab {
  id: string;
  /** Shown in the course sidebar, so a plain string like a section title. */
  title: string;
  /** The task, in markdown. A lesson body, so bilingual. */
  brief: { en: string; ar: string };
  /** Ticked off in the page while the work happens elsewhere. */
  objectives: string[];
  /** What to have ready first, e.g. "Wireshark and a TryHackMe account". */
  setupNotes?: string;
  estimatedMinutes: number;
  placement: LabPlacement;
  links: LabLink[];
  files: LabFile[];
  /** The half that runs here, when the topic is better shown than described. */
  simulation?: NetworkSimulation;
  completion: LabCompletion;
}

/* ── Ids ── */
let labIdCounter = 0;
export const labUid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(labIdCounter++).toString(36)}`;

export const newLabLink = (): LabLink => ({ id: labUid('link'), label: '', url: '' });

export const newLabFlag = (): LabFlag => ({ id: labUid('flag'), label: '', answer: '' });

export const newLab = (): ModuleLab => ({
  id: labUid('lab'),
  title: 'Lab',
  brief: { en: '', ar: '' },
  objectives: [],
  estimatedMinutes: 30,
  placement: { at: 'end' },
  links: [],
  files: [],
  completion: { mode: 'self' },
});

/* ── Links ──
 *
 * Lab destinations are creator-authored, which makes them untrusted input on
 * a page we render. Only http(s) gets through: `javascript:` and `data:` in an
 * href are script execution, and a relative path would send a student to a
 * route of ours dressed up as an external lab.
 */
export function isSafeLabUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** The host a link actually leads to, shown to students under the button. */
export function labHost(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** True when a link is served over plain http, which is worth flagging. */
export function isInsecureLabUrl(url: string): boolean {
  try {
    return new URL(url.trim()).protocol === 'http:';
  } catch {
    return false;
  }
}

/* ── Flags ──
 *
 * Checked in the browser against a value that ships inside the module, so a
 * student who opens devtools can read it. That is the same trust model the
 * rest of this platform's progress runs on, and the studio says so out loud
 * rather than implying a grade. Every comparison goes through here, so moving
 * to a server check later is one function, not a search.
 */
export function checkFlag(flag: LabFlag, submitted: string): boolean {
  const expected = flag.answer.trim();
  const given = submitted.trim();
  if (!expected) return false;
  return flag.caseSensitive ? expected === given : expected.toLowerCase() === given.toLowerCase();
}

/** The flags on a lab, empty when it completes by button. */
export function labFlags(lab: ModuleLab): LabFlag[] {
  return lab.completion.mode === 'flags' ? lab.completion.flags : [];
}

/* ── Files ── */

/** Extensions the backend accepts. Kept here so the picker and the error copy agree. */
export const LAB_FILE_EXTENSIONS = [
  'pdf', 'zip', 'gz', 'tar', 'txt', 'md', 'csv', 'json', 'log',
  'pcap', 'pcapng', 'cap', 'yaml', 'yml', 'conf', 'sh', 'py', 'sql',
] as const;

export const LAB_FILE_MAX_BYTES = 25 * 1024 * 1024;

export const labFileAccept = LAB_FILE_EXTENSIONS.map((e) => `.${e}`).join(',');

export function labFileKind(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return (LAB_FILE_EXTENSIONS as readonly string[]).includes(ext) ? ext : '';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Shape checks ── */

/**
 * Is there enough here to show a student? A lab with a title and nothing else
 * is a stub, and a stub in the sidebar is worse than no lab at all, so save
 * and preview both drop it.
 */
export function labHasContent(lab: ModuleLab): boolean {
  return !!(
    lab.brief.en.trim() ||
    lab.brief.ar.trim() ||
    lab.objectives.some((o) => o.trim()) ||
    lab.links.some((l) => l.url.trim()) ||
    lab.files.length ||
    hasSimulation(lab.simulation)
  );
}

/** Drop the empty rows an editor leaves behind, and any link that isn't safe. */
export function cleanLab(lab: ModuleLab): ModuleLab {
  const links = lab.links.filter((l) => isSafeLabUrl(l.url));
  const objectives = lab.objectives.map((o) => o.trim()).filter(Boolean);
  const completion: LabCompletion =
    lab.completion.mode === 'flags'
      ? {
          mode: 'flags',
          flags: lab.completion.flags.filter((f) => f.label.trim() && f.answer.trim()),
        }
      : { mode: 'self' };

  return {
    ...lab,
    title: lab.title.trim() || 'Lab',
    objectives,
    setupNotes: lab.setupNotes?.trim() || undefined,
    links,
    completion:
      completion.mode === 'flags' && completion.flags.length === 0 ? { mode: 'self' } : completion,
    simulation: hasSimulation(lab.simulation) ? lab.simulation : undefined,
  };
}

/** Labs worth publishing, cleaned. */
export function cleanLabs(labs: ModuleLab[] | undefined): ModuleLab[] {
  return (labs ?? []).map(cleanLab).filter(labHasContent);
}
