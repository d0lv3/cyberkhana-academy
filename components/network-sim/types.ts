/* ─── Network Simulation Data Types ─── */

import type { QuizQuestion } from '../../data/linuxQuizData';

/* ── Localized text ──
 * Every string a student reads, from a lesson body down to a one-word device
 * label, can be authored in both languages. Legacy content is a bare string,
 * so reads tolerate both shapes and fall back to English.
 *
 * Structurally the same union as `LocalizedMarkdown` in services/creatorTypes,
 * and deliberately not imported from there: that module already imports this
 * one, and `tFor` is a runtime value, so borrowing it would close a cycle. */
export type LocalizedText = string | { en: string; ar: string };

export function tFor(value: LocalizedText | undefined | null, lang: 'en' | 'ar'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.ar || '';
}

export function toLocalizedText(
  value: LocalizedText | undefined | null
): { en: string; ar: string } {
  if (!value) return { en: '', ar: '' };
  if (typeof value === 'string') return { en: value, ar: '' };
  return { en: value.en || '', ar: value.ar || '' };
}

export type DeviceType =
  | 'pc'
  | 'laptop'
  | 'server'
  | 'router'
  | 'switch'
  | 'firewall'
  | 'cloud'
  | 'dns-server'
  | 'phone';

export type NetworkNode = {
  id: string;
  type: DeviceType;
  label: LocalizedText;
  /** Position in the simulation viewport (0–100 range) */
  x: number;
  y: number;
  /** An address is the same in every language, so it stays a plain string. */
  ip?: string;
  sublabel?: LocalizedText;
};

export type NetworkEdge = {
  id: string;
  from: string;
  to: string;
  label?: LocalizedText;
  style?: 'solid' | 'dashed';
};

export type Packet = {
  from: string;
  to: string;
  label: LocalizedText;
  color?: string;
  sublabel?: LocalizedText;
};

export type SimulationStep = {
  title: LocalizedText;
  description: LocalizedText;
  packets: Packet[];
  highlights?: string[];
  /** Optional per-step annotations shown next to nodes, keyed by node id */
  annotations?: Record<string, LocalizedText>;
};

/** A labeled network region (LAN, DMZ, Internet…) drawn behind the nodes. */
export type SimulationZone = {
  id: string;
  /** e.g. "Home Network" */
  label: LocalizedText;
  /** e.g. "192.168.1.0/24" */
  sublabel?: LocalizedText;
  /** Rect in the same 0–100 coordinate space as nodes */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Tint color (defaults to neutral steel) */
  color?: string;
};

export type NetworkSimulation = {
  id: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  steps: SimulationStep[];
  /** Optional network boundary regions rendered behind everything */
  zones?: SimulationZone[];
};

export type NetworkingLesson = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  order: number;
  estimatedMinutes: number;
  tags: string[];
  /** The lesson body, bilingual. */
  markdownContent: LocalizedText;
  /** Optional creator-supplied cover art (raw SVG markup). Falls back to built-in art. */
  coverSvg?: string;
  /**
   * Optional packet-flow simulation. A lesson without one is a normal lesson,
   * not a broken one: the author decides in the studio, and the reading pane
   * takes the whole screen when there is nothing to sit beside it.
   */
  simulation?: NetworkSimulation;
  /** Optional end-of-lesson comprehension check — passing it completes the lesson. */
  quiz?: QuizQuestion[];
};

/**
 * Is there a simulation worth rendering?
 *
 * A simulation object with no devices draws an empty canvas, so an empty one
 * counts as absent. Lessons saved before simulations became optional carry
 * exactly that shape, which is why the check is on the contents rather than on
 * the field being present.
 */
export const hasSimulation = (
  sim: NetworkSimulation | undefined | null
): sim is NetworkSimulation => !!sim && sim.nodes.length > 0;

/** Step count for the badges, safe on a lesson with no simulation. */
export const simulationStepCount = (sim: NetworkSimulation | undefined | null): number =>
  hasSimulation(sim) ? sim.steps.length : 0;
