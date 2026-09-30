import type { ProgrammingLanguage } from '../types';

const python: ProgrammingLanguage = {
  id: 'python',
  slug: 'python',
  name: 'Python',
  color: '#3572A5',
  available: true,
  description: {
    en: 'The most popular language in cybersecurity, used for scripting, automation, exploit development, and tool building.',
    ar: 'اللغة الأكثر شيوعًا في الأمن السيبراني، تُستخدم في البرمجة النصية والأتمتة وتطوير استغلالات الثغرات وبناء الأدوات.',
  },
  /* No built-in modules: Python content is authored through the creator tools
     and merged in by getProgrammingLanguages(). */
  modules: [],
};

export default python;
