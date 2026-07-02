/* ─── Creator permissions (client mirror) ───
 * The server resolves each user's effective permission set (admins → all,
 * creators → admin-granted set or the default) and sends it on the session
 * user as `permissions`. The client only ever reads that resolved list — the
 * server independently enforces writes per content bucket.
 */

import type { AcademyUser } from '../types';

export const CREATOR_PERMISSIONS = [
  'networking',
  'programming',
  'programming-languages',
  'modules',
  'os-modules',
  'paths',
] as const;

export type CreatorPermission = (typeof CREATOR_PERMISSIONS)[number];

export const PERMISSION_META: Record<
  CreatorPermission,
  { label: { en: string; ar: string }; hint: { en: string; ar: string } }
> = {
  networking: {
    label: { en: 'Networking lessons', ar: 'دروس الشبكات' },
    hint: { en: 'Create interactive networking lessons', ar: 'إنشاء دروس شبكات تفاعلية' },
  },
  programming: {
    label: { en: 'Programming content', ar: 'محتوى برمجي' },
    hint: { en: 'Add modules & coding lessons to languages', ar: 'إضافة وحدات ودروس برمجة إلى اللغات' },
  },
  'programming-languages': {
    label: { en: 'Programming languages', ar: 'لغات البرمجة' },
    hint: { en: 'Create whole new languages in the catalog', ar: 'إنشاء لغات جديدة كاملة في الكتالوج' },
  },
  modules: {
    label: { en: 'Modules', ar: 'الوحدات' },
    hint: { en: 'Create standalone modules for the Modules hub', ar: 'إنشاء وحدات مستقلة لمركز الوحدات' },
  },
  'os-modules': {
    label: { en: 'OS modules', ar: 'وحدات أنظمة التشغيل' },
    hint: { en: 'Create modules under OS Fundamentals', ar: 'إنشاء وحدات ضمن أساسيات أنظمة التشغيل' },
  },
  paths: {
    label: { en: 'Learning paths', ar: 'المسارات التعليمية' },
    hint: { en: 'Sequence content into guided paths', ar: 'ترتيب المحتوى في مسارات موجّهة' },
  },
};

/** Can this user author the given content type? (Admins always can.) */
export function hasPerm(user: AcademyUser | null | undefined, perm: CreatorPermission): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return !!user.permissions?.includes(perm);
}
