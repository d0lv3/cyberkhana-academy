/* ─── Skill Matrix Service ───
 * Rates a learner across cybersecurity pillars, THM-style.
 *
 * Inspiration: TryHackMe's "Skills Matrix" plots you on a handful of broad
 * security categories, scoring each by how much of the content tagged to that
 * category you've completed. We do the same, but route OUR content into pillars
 * deterministically and reuse the very same point weights the leaderboard uses,
 * so a learner's matrix and their points always agree.
 *
 * Per pillar:
 *   available = points of ALL content routed to the pillar
 *   earned    = points of the content the learner has completed
 *   score     = round(100 × earned / available)        // "coverage"
 *   tier      = named band from the score (Novice → Master)
 * Pillars with no content yet report `hasContent: false` and are shown muted —
 * they light up automatically as creators publish offensive/defensive modules.
 *
 * The Overall Skill Index is the average score across pillars that have content,
 * which maps to a single gamified rank (Recruit → Elite).
 */

import { getMergedFundamentalModules } from '../data/fundamentalsData';
import { getNetworkingLessons } from '../data/networking';
import { getProgrammingLanguages } from '../data/programming';
import { getProgrammingDone, getNetworkingDone } from './progressService';
import {
  modulePoints,
  networkingLessonPoints,
  conceptPoints,
  isModuleComplete,
} from './pointsService';

export type PillarId =
  | 'offensive'
  | 'defensive'
  | 'networking'
  | 'programming'
  | 'systems'
  | 'fundamentals';

export interface PillarMeta {
  id: PillarId;
  label: { en: string; ar: string };
  blurb: { en: string; ar: string };
  color: string;
}

/** The six axes of the matrix. Order = clockwise from the top of the radar. */
export const SKILL_PILLARS: PillarMeta[] = [
  {
    id: 'offensive',
    label: { en: 'Offensive Security', ar: 'الأمن الهجومي' },
    blurb: { en: 'Exploitation, pentesting, red-team tradecraft', ar: 'الاستغلال واختبار الاختراق' },
    color: '#ef4444',
  },
  {
    id: 'defensive',
    label: { en: 'Defensive Security', ar: 'الأمن الدفاعي' },
    blurb: { en: 'Blue-team, detection, incident response', ar: 'الفريق الأزرق والكشف والاستجابة' },
    color: '#2dd4bf',
  },
  {
    id: 'networking',
    label: { en: 'Networking', ar: 'الشبكات' },
    blurb: { en: 'Protocols, routing, traffic analysis', ar: 'البروتوكولات والتوجيه وتحليل الحركة' },
    color: '#60a5fa',
  },
  {
    id: 'programming',
    label: { en: 'Programming & Scripting', ar: 'البرمجة والكتابة البرمجية' },
    blurb: { en: 'Automation, tooling, scripting', ar: 'الأتمتة والأدوات والبرمجة النصية' },
    color: '#9fef00',
  },
  {
    id: 'systems',
    label: { en: 'Operating Systems', ar: 'أنظمة التشغيل' },
    blurb: { en: 'Linux & Windows internals, the terminal', ar: 'لينكس وويندوز والطرفية' },
    color: '#f3a43a',
  },
  {
    id: 'fundamentals',
    label: { en: 'Security Fundamentals', ar: 'أساسيات الأمن' },
    blurb: { en: 'Core concepts, CIA triad, Security+', ar: 'المفاهيم الأساسية وSecurity+' },
    color: '#00a859',
  },
];

export const PILLAR_BY_ID: Record<PillarId, PillarMeta> = SKILL_PILLARS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PillarId, PillarMeta>,
);

/* ── Proficiency tiers (per pillar) ──
 * Coverage-based bands. `min` is the inclusive lower bound on the 0-100 score. */
export interface Tier {
  key: string;
  min: number;
  label: { en: string; ar: string };
  color: string;
}

const TIERS: Tier[] = [
  { key: 'master', min: 100, label: { en: 'Master', ar: 'متمكّن' }, color: '#9fef00' },
  { key: 'proficient', min: 75, label: { en: 'Proficient', ar: 'محترف' }, color: '#2dd4bf' },
  { key: 'practitioner', min: 50, label: { en: 'Practitioner', ar: 'ممارس' }, color: '#60a5fa' },
  { key: 'apprentice', min: 25, label: { en: 'Apprentice', ar: 'متدرّب' }, color: '#f3a43a' },
  { key: 'novice', min: 1, label: { en: 'Novice', ar: 'مبتدئ' }, color: '#f3c84b' },
  { key: 'untrained', min: 0, label: { en: 'Untrained', ar: 'غير مُدرّب' }, color: '#6e7a94' },
];

export function tierForScore(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

/* ── Overall rank from the skill index ── */
export interface Rank {
  key: string;
  min: number;
  label: { en: string; ar: string };
  color: string;
}

const RANKS: Rank[] = [
  { key: 'elite', min: 100, label: { en: 'Elite', ar: 'نخبة' }, color: '#9fef00' },
  { key: 'expert', min: 75, label: { en: 'Expert', ar: 'خبير' }, color: '#2dd4bf' },
  { key: 'specialist', min: 50, label: { en: 'Specialist', ar: 'متخصّص' }, color: '#60a5fa' },
  { key: 'operative', min: 25, label: { en: 'Operative', ar: 'عامل ميداني' }, color: '#f3a43a' },
  { key: 'recruit', min: 1, label: { en: 'Recruit', ar: 'مُجنَّد' }, color: '#f3c84b' },
  { key: 'initiate', min: 0, label: { en: 'Initiate', ar: 'مبتدئ' }, color: '#6e7a94' },
];

export function rankForIndex(index: number): Rank {
  return RANKS.find((r) => index >= r.min) ?? RANKS[RANKS.length - 1];
}

/* ── Content → pillar routing ──
 * Every piece of content is routed to up to two pillars: a "track" pillar
 * (programming / networking / systems) by its category, and a "domain" pillar
 * (offensive / defensive / fundamentals) by its security domain. Concepts and
 * networking lessons route to their single obvious pillar. */

const CATEGORY_PILLAR: Record<string, PillarId | undefined> = {
  programming: 'programming',
  networking: 'networking',
  'operating-systems': 'systems',
};

const DOMAIN_PILLAR: Record<string, PillarId> = {
  offensive: 'offensive',
  defensive: 'defensive',
  general: 'fundamentals',
};

export interface SkillRating {
  pillar: PillarMeta;
  earned: number;
  available: number;
  /** 0-100 coverage; 0 when no content exists yet. */
  score: number;
  hasContent: boolean;
  tier: Tier;
  /** Item counts for the "3 / 8 done" subtitle. */
  doneItems: number;
  totalItems: number;
}

export interface SkillMatrix {
  ratings: SkillRating[];
  /** Average score across pillars that have content (0 when nothing exists). */
  index: number;
  rank: Rank;
  /** Pillars the learner is strongest / weakest in (content-bearing only). */
  strongest?: SkillRating;
  weakest?: SkillRating;
}

interface Bucket {
  earned: number;
  available: number;
  doneItems: number;
  totalItems: number;
}

function emptyBuckets(): Record<PillarId, Bucket> {
  return SKILL_PILLARS.reduce(
    (acc, p) => ({ ...acc, [p.id]: { earned: 0, available: 0, doneItems: 0, totalItems: 0 } }),
    {} as Record<PillarId, Bucket>,
  );
}

/** Recompute the learner's skill matrix from their completion sets. */
export function getSkillMatrix(): SkillMatrix {
  const b = emptyBuckets();

  const add = (id: PillarId | undefined, pts: number, done: boolean) => {
    if (!id) return;
    const bucket = b[id];
    bucket.available += pts;
    bucket.totalItems += 1;
    if (done) {
      bucket.earned += pts;
      bucket.doneItems += 1;
    }
  };

  /* Modules → track pillar (category) + domain pillar (domain). */
  for (const m of getMergedFundamentalModules()) {
    const pts = modulePoints(m.difficulty, m.estimatedHours);
    const done = isModuleComplete(m.slug, m.totalLessons);
    add(CATEGORY_PILLAR[m.category], pts, done);
    add(DOMAIN_PILLAR[m.domain ?? 'general'], pts, done);
  }

  /* Networking lessons → Networking. */
  const netDone = getNetworkingDone();
  for (const lesson of getNetworkingLessons()) {
    add('networking', networkingLessonPoints(lesson.estimatedMinutes), netDone.has(lesson.id));
  }

  /* Programming concepts → Programming. */
  for (const lang of getProgrammingLanguages()) {
    const done = getProgrammingDone(lang.slug);
    for (const mod of lang.modules) {
      for (const concept of mod.concepts) {
        add('programming', conceptPoints(concept.type), done.has(concept.id));
      }
    }
  }

  const ratings: SkillRating[] = SKILL_PILLARS.map((pillar) => {
    const bucket = b[pillar.id];
    const hasContent = bucket.available > 0;
    const score = hasContent ? Math.round((bucket.earned / bucket.available) * 100) : 0;
    return {
      pillar,
      earned: bucket.earned,
      available: bucket.available,
      score,
      hasContent,
      tier: tierForScore(score),
      doneItems: bucket.doneItems,
      totalItems: bucket.totalItems,
    };
  });

  const active = ratings.filter((r) => r.hasContent);
  const index =
    active.length > 0 ? Math.round(active.reduce((s, r) => s + r.score, 0) / active.length) : 0;

  const ranked = [...active].sort((a, b2) => b2.score - a.score);

  return {
    ratings,
    index,
    rank: rankForIndex(index),
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
  };
}
