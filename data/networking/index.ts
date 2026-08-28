import { NetworkingLesson } from '../../components/network-sim/types';
import { mergeNetworkingLessons } from '../../services/creatorDataService';

/* No built-in lessons: networking content is authored through the creator
   tools and merged in by getNetworkingLessons() once it is published. */
const staticLessons: NetworkingLesson[] = [];

/** All networking lessons: static + creator-authored (published) */
export const getNetworkingLessons = (): NetworkingLesson[] =>
  mergeNetworkingLessons(staticLessons);

/** Backwards-compatible named export (used by several pages) */
export const networkingLessons: NetworkingLesson[] = staticLessons;

export const getNetworkingLesson = (slug: string): NetworkingLesson | undefined =>
  getNetworkingLessons().find((l) => l.slug === slug);
