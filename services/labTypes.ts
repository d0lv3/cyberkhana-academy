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
 * Everything a student reads here comes in two languages, the way a lesson
 * does (services/contentLang.ts): the brief is { en, ar }, and each short text
 * has an Arabic sibling beside it (`title` and `titleAr`). What is not prose
 * is said once: addresses, filenames, and the answers themselves.
 */

import type { NetworkSimulation } from '../components/network-sim/types';
import { hasSimulation } from '../components/network-sim/types';
import { flagPlaceholder as placeholderFor } from '../backend/src/shared/checks';

/** A way out to where the lab actually runs. */
export interface LabLink {
  id: string;
  /** e.g. "Open the room on TryHackMe" */
  label: string;
  labelAr?: string;
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
  labelAr?: string;
  /** The expected value. Kept on the server, which checks each flag
   *  (backend/src/routes/progress.ts): what students are sent has none, and
   *  a placeholder worked out from it instead. Only the author's own copy, and
   *  the studio's preview, carry it. */
  answer?: string;
  /** Optional nudge, revealed on request. */
  hint?: string;
  hintAr?: string;
  /** Off by default: most flags are strings where case is noise. */
  caseSensitive?: boolean;
  /** What the empty box should suggest, when the shape of the answer is not
   *  hint enough on its own. Optional: see flagPlaceholder(). */
  placeholder?: string;
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
  /** Shown in the course sidebar, like a lesson's title. */
  title: string;
  titleAr?: string;
  /** The task, in markdown. A lesson body, so bilingual. */
  brief: { en: string; ar: string };
  /** Ticked off in the page while the work happens elsewhere. */
  objectives: string[];
  /** The same objectives in Arabic, one for one with `objectives`. */
  objectivesAr?: string[];
  /** What to have ready first, e.g. "Wireshark and a TryHackMe account". */
  setupNotes?: string;
  setupNotesAr?: string;
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
 * Marked on the server, one at a time, against answers students are never
 * sent (backend/src/shared/checks.ts, utils/redact.ts), through
 * services/completionService.ts submitLabFlag. The studio's preview takes no
 * answers at all.
 *
 * What the empty box suggests is derived from the answer the creator wrote,
 * since not every value a lab asks for is a flag: the source IP, the name of
 * the process, the port it was listening on. The server works it out before
 * the answer is taken away, and sends it as the placeholder.
 */

export function flagPlaceholder(flag: LabFlag): string {
  return placeholderFor(flag);
}

/** How many answers one lab can ask for. Generous on purpose: a lab that
 *  walks through an investigation can ask a question at every step. */
export const MAX_LAB_FLAGS = 100;

/** The flags on a lab, empty when it completes by button. */
export function labFlags(lab: ModuleLab): LabFlag[] {
  return lab.completion.mode === 'flags' ? lab.completion.flags : [];
}

/* ── Files ── */

/** Extensions the backend accepts. Kept here so the picker and the error copy agree. */
export const LAB_FILE_EXTENSIONS = [
  'pdf', 'zip', 'gz', 'tar', 'txt', 'md', 'csv', 'json', 'log',
  'pcap', 'pcapng', 'cap', 'yaml', 'yml', 'conf', 'sh', 'py', 'sql',
  'ovpn',
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
    (lab.objectivesAr ?? []).some((o) => o.trim()) ||
    lab.links.some((l) => l.url.trim()) ||
    lab.files.length ||
    hasSimulation(lab.simulation)
  );
}

/** Drop the empty rows an editor leaves behind, and any link that isn't safe.
 *  A row counts as written when either language has it, and the two lists of
 *  objectives stay in step with each other. */
export function cleanLab(lab: ModuleLab): ModuleLab {
  const links = lab.links.filter((l) => isSafeLabUrl(l.url));
  const rows = lab.objectives
    .map((en, i) => ({ en: en.trim(), ar: (lab.objectivesAr?.[i] ?? '').trim() }))
    .filter((row) => row.en || row.ar);
  const completion: LabCompletion =
    lab.completion.mode === 'flags'
      ? {
          mode: 'flags',
          flags: lab.completion.flags.filter(
            (f) => (f.label.trim() || (f.labelAr ?? '').trim()) && (f.answer ?? '').trim()
          ),
        }
      : { mode: 'self' };
  const title = lab.title.trim();
  const titleAr = (lab.titleAr ?? '').trim();

  return {
    ...lab,
    title: title || (titleAr ? '' : 'Lab'),
    titleAr: titleAr || undefined,
    objectives: rows.map((row) => row.en),
    objectivesAr: rows.some((row) => row.ar) ? rows.map((row) => row.ar) : undefined,
    setupNotes: lab.setupNotes?.trim() || undefined,
    setupNotesAr: lab.setupNotesAr?.trim() || undefined,
    links,
    completion:
      completion.mode === 'flags' && completion.flags.length === 0 ? { mode: 'self' } : completion,
    simulation: hasSimulation(lab.simulation) ? lab.simulation : undefined,
  };
}

/**
 * The lab as someone reading in `lang` gets it: every short text in their
 * language, or in the other one where theirs was never written. The page that
 * shows a lab reads the plain fields of what this returns, so it has one rule
 * for both languages instead of a choice at every label.
 */
export function labInLanguage(lab: ModuleLab, lang: 'en' | 'ar'): ModuleLab {
  const say = (en?: string, ar?: string): string => {
    const [own, other] = lang === 'ar' ? [ar, en] : [en, ar];
    return own?.trim() ? own : other ?? '';
  };
  return {
    ...lab,
    title: say(lab.title, lab.titleAr),
    setupNotes: say(lab.setupNotes, lab.setupNotesAr) || undefined,
    objectives: lab.objectives.map((o, i) => say(o, lab.objectivesAr?.[i])),
    links: lab.links.map((l) => ({ ...l, label: say(l.label, l.labelAr) })),
    completion:
      lab.completion.mode === 'flags'
        ? {
            mode: 'flags',
            flags: lab.completion.flags.map((f) => ({
              ...f,
              label: say(f.label, f.labelAr),
              hint: say(f.hint, f.hintAr) || undefined,
            })),
          }
        : lab.completion,
  };
}

/** Labs worth publishing, cleaned. */
export function cleanLabs(labs: ModuleLab[] | undefined): ModuleLab[] {
  return (labs ?? []).map(cleanLab).filter(labHasContent);
}
