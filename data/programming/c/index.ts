import type { ProgrammingLanguage } from '../types';
import gettingStarted from './01-getting-started';

const c: ProgrammingLanguage = {
  id: 'c',
  slug: 'c',
  name: 'C',
  color: '#6a9fb5',
  available: true,
  description: {
    en: 'Understand memory, pointers, and low-level concepts essential for reverse engineering and exploit development.',
    ar: 'فهم الذاكرة، المؤشرات، والمفاهيم المنخفضة المستوى الأساسية للهندسة العكسية وتطوير الاستغلالات.',
  },
  modules: [gettingStarted].sort((a, b) => a.order - b.order),
};

export default c;
