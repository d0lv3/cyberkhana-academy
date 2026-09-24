import type { ProgrammingLanguage } from '../types';

const cpp: ProgrammingLanguage = {
  id: 'cpp',
  slug: 'cpp',
  name: 'C++',
  color: '#f34b7d',
  available: true,
  description: {
    en: 'Build on C with streams and objects, the language behind most desktop software, game engines, and the binaries you reverse engineer.',
    ar: 'وسّع ما تعلمته في C باستخدام تدفقات الإدخال والإخراج والكائنات. تُستخدم C++ في كثير من برامج سطح المكتب ومحركات الألعاب والملفات التنفيذية التي تحللها بالهندسة العكسية.',
  },
  /* No built-in modules: C++ content is authored through the creator tools
     and merged in by getProgrammingLanguages(). */
  modules: [],
};

export default cpp;
