/* ─── Path Catalog ───
 * Builds the list of selectable content a creator can sequence into a path.
 * Lives in the data layer (not the service) because it pulls from the merged
 * data modules — importing those into creatorDataService would create a cycle.
 */

import { fundamentalModules, modulePath } from './fundamentalsData';
import { getNetworkingLessons } from './networking';
import { getProgrammingLanguages } from './programming';
import { mergeFundamentalModules } from '../services/creatorDataService';
import type { PathStep, PathStepKind } from '../services/creatorTypes';

export interface CatalogGroup {
  kind: PathStepKind;
  label: string;
  accent: string;
  items: PathStep[];
}

const OS_ACCENT = '#f3a43a';
const NET_ACCENT = '#60a5fa';
const PROG_ACCENT = '#9fef00';
const difficultyAr: Record<string, string> = {
  Beginner: 'مبتدئ', Easy: 'سهل', Medium: 'متوسط', Hard: 'صعب', Expert: 'خبير',
};

/** Every piece of content that can become a step in a learning path. */
export function buildPathCatalog(locale: 'en' | 'ar' = 'en'): CatalogGroup[] {
  /* OS & standalone modules (static + published creator, any topic) */
  const osItems: PathStep[] = mergeFundamentalModules(fundamentalModules).map((m) => ({
    kind: 'os-module',
    refId: m.id,
    title: m.title[locale] || m.title.en,
    subtitle: locale === 'ar'
      ? `${difficultyAr[m.difficulty] ?? m.difficulty} · الدروس: ${m.totalLessons}`
      : `${m.difficulty} · ${m.totalLessons} lessons`,
    route: modulePath(m),
    accent: OS_ACCENT,
    coverImage: m.coverImage,
  }));

  /* Networking lessons (merged) */
  const netItems: PathStep[] = getNetworkingLessons().map((l) => ({
    kind: 'networking',
    refId: l.id,
    title: l.title[locale] || l.title.en,
    subtitle: locale === 'ar' ? `${l.estimatedMinutes} دقيقة` : `${l.estimatedMinutes} min`,
    route: `/fundamentals/networking/lesson/${l.slug}`,
    accent: NET_ACCENT,
  }));

  /* Programming modules (merged) → open at the first concept */
  const progItems: PathStep[] = [];
  for (const lang of getProgrammingLanguages()) {
    for (const mod of lang.modules) {
      const first = mod.concepts[0];
      if (!first) continue;
      progItems.push({
        kind: 'programming-module',
        refId: mod.id,
        title: `${lang.name}: ${mod.title[locale] || mod.title.en}`,
        subtitle: locale === 'ar' ? `المفاهيم: ${mod.concepts.length}` : `${mod.concepts.length} ${mod.concepts.length === 1 ? 'concept' : 'concepts'}`,
        route: `/fundamentals/programming/${lang.slug}/${mod.slug}/${first.slug}`,
        accent: PROG_ACCENT,
      });
    }
  }

  return [
    { kind: 'os-module', label: locale === 'ar' ? 'أنظمة التشغيل والوحدات' : 'OS & Modules', accent: OS_ACCENT, items: osItems },
    { kind: 'networking', label: locale === 'ar' ? 'الشبكات' : 'Networking', accent: NET_ACCENT, items: netItems },
    { kind: 'programming-module', label: locale === 'ar' ? 'البرمجة' : 'Programming', accent: PROG_ACCENT, items: progItems },
  ];
}

/**
 * Lookup of every currently-available (published/live) step, keyed by
 * `kind:refId`. Used to resolve a path's stored steps against live content —
 * a step missing from this index points at unpublished/removed content.
 */
export function buildCatalogIndex(locale: 'en' | 'ar' = 'en'): Map<string, PathStep> {
  const index = new Map<string, PathStep>();
  for (const group of buildPathCatalog(locale)) {
    for (const item of group.items) {
      index.set(`${item.kind}:${item.refId}`, item);
    }
  }
  return index;
}
