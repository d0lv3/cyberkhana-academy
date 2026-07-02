export interface AcademyUser {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'creator' | 'admin';
  /** Effective creator capabilities, resolved by the server (admins get all). */
  permissions?: string[];
  preferredLang: 'en' | 'ar';
  university?: string;
  country?: string;
  bio?: string;
  completedModulesCount: number;
  completedLessonsCount: number;
  totalLearningTimeMinutes: number;
  createdAt: string;
}

export interface BilingualText {
  en: string;
  ar: string;
}

export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type ModuleCategory =
  | 'web-security'
  | 'network-security'
  | 'cryptography'
  | 'forensics'
  | 'reverse-engineering'
  | 'malware-analysis'
  | 'soc-operations'
  | 'penetration-testing'
  | 'osint'
  | 'cloud-security'
  | 'general';

export type FundamentalCategory = 'programming' | 'networking' | 'operating-systems';

export interface Module {
  _id: string;
  title: BilingualText;
  slug: string;
  description: BilingualText;
  category: ModuleCategory;
  difficulty: Difficulty;
  estimatedTimeMinutes: number;
  contentType: 'video' | 'text' | 'mixed';
  thumbnailUrl?: string;
  author: string;
  tags: string[];
  lessons: Lesson[];
  isFundamental: boolean;
  fundamentalCategory?: FundamentalCategory;
  isPublished: boolean;
  enrollmentCount: number;
  completionCount: number;
}

export interface Lesson {
  _id: string;
  moduleId: string;
  title: BilingualText;
  order: number;
  contentType: 'video' | 'text' | 'mixed';
  videoUrl?: string;
  videoProvider?: 'bunny' | 'youtube';
  videoDurationMinutes?: number;
  textContent?: BilingualText;
  estimatedTimeMinutes: number;
  isPublished: boolean;
}

export interface LearningPath {
  _id: string;
  title: BilingualText;
  slug: string;
  description: BilingualText;
  iconName: string;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTotalHours: number;
  modules: { moduleId: string; order: number; isRequired: boolean }[];
  careerTrack: string;
  skills: string[];
  isPublished: boolean;
  enrollmentCount: number;
  completionCount: number;
}
