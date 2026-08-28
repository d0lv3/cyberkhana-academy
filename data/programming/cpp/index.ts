import type { ProgrammingLanguage } from '../types';

const cpp: ProgrammingLanguage = {
  id: 'cpp',
  slug: 'cpp',
  name: 'C++',
  color: '#f34b7d',
  available: true,
  description: {
    en: 'Build on C with streams and objects, the language behind most desktop software, game engines, and the binaries you reverse engineer.',
    ar: 'ابنِ على لغة C بالمجاري والكائنات، اللغة وراء معظم برامج سطح المكتب، محركات الألعاب، والملفات التنفيذية التي تحللها عكسيا.',
  },
  /* No built-in modules: C++ content is authored through the creator tools
     and merged in by getProgrammingLanguages(). */
  modules: [],
};

export default cpp;
