import type { ProgrammingLanguage } from '../types';
import gettingStarted from './01-getting-started';

const bash: ProgrammingLanguage = {
  id: 'bash',
  slug: 'bash',
  name: 'Bash',
  color: '#4EAA25',
  available: true,
  description: {
    en: 'Shell scripting for automating security tasks, log analysis, and system administration.',
    ar: 'برمجة الشيل لأتمتة مهام الأمن، تحليل السجلات، وإدارة النظام.',
  },
  modules: [gettingStarted].sort((a, b) => a.order - b.order),
};

export default bash;
