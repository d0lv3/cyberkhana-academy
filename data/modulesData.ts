/* ─── Modules Page Data ───
 * Aggregates OS fundamental modules (that have showInModules=true)
 * with any future standalone modules.
 */

import { FundamentalModule, fundamentalModules } from './fundamentalsData';
import {
  getModulesPageData,
  getPublishedCreatorOSModules,
  getPublishedStandaloneModules,
} from '../services/creatorDataService';

/**
 * Returns all modules for the /modules page.
 * - Static OS fundamentals (always shown)
 * - Creator OS modules with showInModules = true
 * - Future: standalone modules
 */
export function getAllModules(): FundamentalModule[] {
  // Static OS modules always appear
  const staticOSModules = fundamentalModules.filter((m) => m.category === 'operating-systems');

  // Creator-authored modules for the modules page
  const creatorModules = getModulesPageData();

  // A creator module sharing a built-in's id overrides it (copy-on-write edit).
  const overrideById = new Map(creatorModules.map((m) => [m.id, m]));
  const mergedStatic = staticOSModules.map((m) => overrideById.get(m.id) ?? m);

  const staticIds = new Set(staticOSModules.map((m) => m.id));
  const additional = creatorModules.filter((m) => !staticIds.has(m.id));

  return [...mergedStatic, ...additional];
}

/**
 * Resolve any viewable module by slug for the module viewer:
 * static fundamentals, published creator OS modules, or published standalone
 * modules.
 */
export function getViewableModuleBySlug(slug: string): FundamentalModule | undefined {
  // Creator content first, so a published override of a built-in wins.
  return (
    getPublishedCreatorOSModules().find((m) => m.slug === slug) ||
    getPublishedStandaloneModules().find((m) => m.slug === slug) ||
    fundamentalModules.find((m) => m.slug === slug)
  );
}
