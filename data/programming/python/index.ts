import type { ProgrammingLanguage } from '../types';
import gettingStarted from './01-getting-started';
import variables from './02-variables';
import strings from './03-strings';
import numbers from './04-numbers';
import listsTuples from './05-lists-tuples';
import setsDicts from './06-sets-dicts';
import booleansOperators from './07-booleans-operators';
import userInput from './08-input';

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
  modules: [
    gettingStarted,
    variables,
    strings,
    numbers,
    listsTuples,
    setsDicts,
    booleansOperators,
    userInput,
  ].sort((a, b) => a.order - b.order),
};

export default python;
