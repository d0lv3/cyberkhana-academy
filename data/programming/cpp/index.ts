import type { ProgrammingLanguage } from '../types';
import gettingStarted from './01-getting-started';

const cpp: ProgrammingLanguage = {
  id: 'cpp',
  slug: 'cpp',
  name: 'C++',
  color: '#f34b7d',
  available: true,
  description: {
    en: 'Build on C with streams and objects — the language behind most desktop software, game engines, and the binaries you reverse engineer.',
    ar: 'ابنِ على لغة C بالمجاري والكائنات — اللغة وراء معظم برامج سطح المكتب، محركات الألعاب، والملفات التنفيذية التي تحللها عكسيا.',
  },
  modules: [gettingStarted].sort((a, b) => a.order - b.order),
};

export default cpp;
