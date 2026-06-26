import { NetworkingLesson } from '../../components/network-sim/types';
import ipAddressing from './ip-addressing';
import { mergeNetworkingLessons } from '../../services/creatorDataService';

const staticLessons: NetworkingLesson[] = [
  ipAddressing,
].sort((a, b) => a.order - b.order);

/** All networking lessons: static + creator-authored (published) */
export const getNetworkingLessons = (): NetworkingLesson[] =>
  mergeNetworkingLessons(staticLessons);

/** Backwards-compatible named export (used by several pages) */
export const networkingLessons: NetworkingLesson[] = staticLessons;

export const getNetworkingLesson = (slug: string): NetworkingLesson | undefined =>
  getNetworkingLessons().find((l) => l.slug === slug);
