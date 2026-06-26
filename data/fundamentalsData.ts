import linuxCourse from './linuxCourseData';
import linuxQuizzes from './linuxQuizData';
import { mergeFundamentalModules } from '../services/creatorDataService';

/**
 * Security domain a module covers — the student-facing category shown as a tag
 * and used by the Modules-hub filter. Distinct from `category` below, which is
 * internal pillar placement (programming / networking / operating-systems).
 */
export type ModuleDomain = 'offensive' | 'defensive' | 'general';

export const MODULE_DOMAINS: ModuleDomain[] = ['offensive', 'defensive', 'general'];

/** Label + tag styling per domain. `badgeCls` works over both dark cards and image scrims. */
export const MODULE_DOMAIN_META: Record<
  ModuleDomain,
  { label: { en: string; ar: string }; badgeCls: string }
> = {
  offensive: {
    label: { en: 'Offensive', ar: 'هجومي' },
    badgeCls: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  defensive: {
    label: { en: 'Defensive', ar: 'دفاعي' },
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  general: {
    label: { en: 'General', ar: 'عام' },
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};

export type FundamentalModule = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  /** Pillar placement; 'general' = standalone module not tied to a fundamentals pillar. */
  category: 'programming' | 'networking' | 'operating-systems' | 'general';
  /** Security domain shown as the module's category tag. Missing → treated as 'general'. */
  domain?: ModuleDomain;
  /** Optional uploaded cover image (absolute URL) shown on the module tile. */
  coverImage?: string;
  contentType: 'video' | 'text' | 'mixed';
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  tags: string[];
  author: string;
  estimatedHours: number;
  totalLessons: number;
  totalModules: number;
  totalQuizzes: number;
  iconColor: string;
  courseData: any;
};

/** Calculate total course hours from video durations + quiz time (~1 min/question) */
const calcLinuxHours = () => {
  let videoMinutes = 0;
  let quizQuestions = 0;

  for (const mod of linuxCourse.modules) {
    for (const lecture of mod.lectures) {
      // Video time
      const parts = lecture.duration.split(':');
      videoMinutes += parseInt(parts[0]) + parseInt(parts[1] || '0') / 60;

      // Quiz time — count questions for this lecture
      if (lecture.quiz) {
        const quiz = linuxQuizzes[lecture.id];
        if (quiz) quizQuestions += quiz.length;
      }
    }
  }

  const quizMinutes = quizQuestions * 1; // ~1 minute per MCQ question
  const totalMinutes = videoMinutes + quizMinutes;
  return Math.round(totalMinutes / 60 * 10) / 10;
};

const countQuizzes = () => {
  let count = 0;
  for (const mod of linuxCourse.modules) {
    for (const lecture of mod.lectures) {
      if (lecture.quiz && linuxQuizzes[lecture.id]) count++;
    }
  }
  return count;
};

const totalLinuxLessons = linuxCourse.modules.reduce((sum, mod) => sum + mod.lectures.length, 0);

export const fundamentalModules: FundamentalModule[] = [
  {
    id: 'linux-for-cybersecurity',
    slug: 'linux-for-cybersecurity',
    title: {
      en: 'Linux for Cybersecurity',
      ar: 'لينكس للأمن السيبراني',
    },
    description: {
      en: 'A comprehensive course covering Linux administration, terminal proficiency, networking, scripting, and cybersecurity applications — designed for aspiring security professionals.',
      ar: 'دورة شاملة تغطي إدارة لينكس، إتقان الطرفية، الشبكات، البرمجة النصية، وتطبيقات الأمن السيبراني — مصممة لمحترفي الأمن الطموحين.',
    },
    category: 'operating-systems',
    domain: 'general',
    contentType: 'video',
    difficulty: 'Beginner',
    tags: ['Linux', 'Terminal', 'Bash', 'Networking', 'Kali Linux', 'Scripting', 'Permissions', 'systemd'],
    author: 'CyberKhana',
    estimatedHours: calcLinuxHours(),
    totalLessons: totalLinuxLessons,
    totalModules: linuxCourse.modules.length,
    totalQuizzes: countQuizzes(),
    iconColor: '#9fef00',
    courseData: linuxCourse,
  },
];

/** A module's security domain, defaulting legacy/unset modules to 'general'. */
export const moduleDomain = (m: Pick<FundamentalModule, 'domain'>): ModuleDomain =>
  m.domain ?? 'general';

export const getFundamentalsByCategory = (category: FundamentalModule['category']) =>
  mergeFundamentalModules(fundamentalModules).filter((m) => m.category === category);

/** Every viewable module regardless of category (static + published creator). */
export const getMergedFundamentalModules = () => mergeFundamentalModules(fundamentalModules);

export const getFundamentalBySlug = (slug: string) =>
  mergeFundamentalModules(fundamentalModules).find((m) => m.slug === slug);
