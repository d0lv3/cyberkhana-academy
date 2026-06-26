import type { ProgrammingLanguage } from '../types';
import gettingStarted from './01-getting-started';
import variables from './02-variables';

const python: ProgrammingLanguage = {
  id: 'python',
  slug: 'python',
  name: 'Python',
  color: '#3572A5',
  available: true,
  description: {
    en: 'The most popular language in cybersecurity — used for scripting, automation, exploit development, and tool building.',
    ar: 'اللغة الأكثر شيوعا في الأمن السيبراني — تستخدم في البرمجة النصية، الأتمتة، تطوير الاستغلالات، وبناء الأدوات.',
  },
  modules: [gettingStarted, variables].sort((a, b) => a.order - b.order),
};

export default python;
