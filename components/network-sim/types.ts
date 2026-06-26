/* ─── Network Simulation Data Types ─── */

import type { QuizQuestion } from '../../data/linuxQuizData';

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
  label: string;
  /** Position in the simulation viewport (0–100 range) */
  x: number;
  y: number;
  ip?: string;
  sublabel?: string;
};

export type NetworkEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
};

export type Packet = {
  from: string;
  to: string;
  label: string;
  color?: string;
  sublabel?: string;
};

export type SimulationStep = {
  title: string;
  description: string;
  packets: Packet[];
  highlights?: string[];
  /** Optional per-step annotations shown next to nodes */
  annotations?: Record<string, string>;
};

/** A labeled network region (LAN, DMZ, Internet…) drawn behind the nodes. */
export type SimulationZone = {
  id: string;
  /** e.g. "Home Network" */
  label: string;
  /** e.g. "192.168.1.0/24" */
  sublabel?: string;
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
  markdownContent: string;
  /** Optional creator-supplied cover art (raw SVG markup). Falls back to built-in art. */
  coverSvg?: string;
  simulation: NetworkSimulation;
  /** Optional end-of-lesson comprehension check — passing it completes the lesson. */
  quiz?: QuizQuestion[];
};
