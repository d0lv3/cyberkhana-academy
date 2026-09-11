/* ─── Skill Matrix Service ───
 * How much of each cybersecurity area a learner has covered, TryHackMe-style.
 *
 * TryHackMe's "Skills Matrix" plots you on a handful of broad security
 * categories, scoring each by how much of the content in it you have
 * completed. We do the same, routing our content into pillars and weighting
 * every stop by its XP (services/xpService.ts), so a long lab counts for more
 * of an area than a short reading and the matrix agrees with the XP total.
 *
 * Per pillar:
 *   available = XP of every stop routed to the pillar
 *   earned    = XP of the stops the learner has completed
 *   score     = round(100 × earned / available)        // coverage
 * Coverage is a share of what exists, so it dips when content is added. That
 * is why it is shown only here, as coverage, and the level is read from XP.
 * Pillars with no content yet report `hasContent: false` and are shown muted;
 * they light up as creators publish offensive and defensive modules.
 */

import { getXpGroups } from './xpService';

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

/* ── Content → pillar routing ──
 * A module goes to up to two pillars: a "track" pillar (programming /
 * networking / systems) by its category, and a "domain" pillar (offensive /
 * defensive / fundamentals) by its security domain. Programming lessons and
 * networking lessons go to their single obvious pillar. */

const CATEGORY_PILLAR: Record<string, PillarId | undefined> = {
  programming: 'programming',
  networking: 'networking',
  'operating-systems': 'systems',
};

const DOMAIN_PILLAR: Record<string, PillarId | undefined> = {
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
  /** Stop counts for the "3 / 8 done" subtitle. */
  doneItems: number;
  totalItems: number;
}

export interface SkillMatrix {
  ratings: SkillRating[];
  /** Average coverage across pillars that have content (0 when nothing exists). */
  index: number;
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

/** Recompute the learner's skill matrix from their completions. */
export function getSkillMatrix(): SkillMatrix {
  const buckets = SKILL_PILLARS.reduce(
    (acc, p) => ({ ...acc, [p.id]: { earned: 0, available: 0, doneItems: 0, totalItems: 0 } }),
    {} as Record<PillarId, Bucket>,
  );

  for (const group of getXpGroups()) {
    const pillars: PillarId[] =
      group.track === 'module'
        ? [CATEGORY_PILLAR[group.category ?? ''], DOMAIN_PILLAR[group.domain ?? 'general']].filter(
            (p): p is PillarId => !!p,
          )
        : [group.track === 'programming' ? 'programming' : 'networking'];
    for (const stop of group.stops) {
      const done = group.done.has(stop.id);
      for (const id of pillars) {
        const bucket = buckets[id];
        bucket.available += stop.xp;
        bucket.totalItems += 1;
        if (done) {
          bucket.earned += stop.xp;
          bucket.doneItems += 1;
        }
      }
    }
  }

  const ratings: SkillRating[] = SKILL_PILLARS.map((pillar) => {
    const bucket = buckets[pillar.id];
    const hasContent = bucket.available > 0;
    return {
      pillar,
      earned: bucket.earned,
      available: bucket.available,
      score: hasContent ? Math.round((bucket.earned / bucket.available) * 100) : 0,
      hasContent,
      doneItems: bucket.doneItems,
      totalItems: bucket.totalItems,
    };
  });

  const active = ratings.filter((r) => r.hasContent);
  const index =
    active.length > 0 ? Math.round(active.reduce((s, r) => s + r.score, 0) / active.length) : 0;
  const ranked = [...active].sort((a, b) => b.score - a.score);

  return {
    ratings,
    index,
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
  };
}
