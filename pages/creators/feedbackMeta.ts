/* ─── Feedback tracks, as the studio presents them ───
 * One definition of the three cards, shared by the overview and the per-track
 * page so a track cannot be called one thing on one screen and another on the
 * next.
 */

import { Code, Wifi, Monitor } from 'lucide-react';
import type { FeedbackTrack } from '../../services/feedbackService';

export interface TrackMeta {
  icon: typeof Code;
  color: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  /** What a learner had just finished when the dialog asked them. */
  source: { en: string; ar: string };
}

export const FEEDBACK_TRACK_META: Record<FeedbackTrack, TrackMeta> = {
  programming: {
    icon: Code,
    color: '#9fef00',
    title: { en: 'Programming Feedback', ar: 'ملاحظات البرمجة' },
    description: {
      en: 'Left on finishing a module in any language.',
      ar: 'تُترك عند إنهاء وحدة في أي لغة.',
    },
    source: { en: 'Module', ar: 'الوحدة' },
  },
  networking: {
    icon: Wifi,
    color: '#60a5fa',
    title: { en: 'Networking Feedback', ar: 'ملاحظات الشبكات' },
    description: {
      en: 'Left on finishing a networking lesson.',
      ar: 'تُترك عند إنهاء درس شبكات.',
    },
    source: { en: 'Lesson', ar: 'الدرس' },
  },
  'os-modules': {
    icon: Monitor,
    color: '#f3a43a',
    title: { en: 'OS / Modules Feedback', ar: 'ملاحظات الوحدات وأنظمة التشغيل' },
    description: {
      en: 'Left on finishing an OS module or a standalone one.',
      ar: 'تُترك عند إنهاء وحدة نظام تشغيل أو وحدة مستقلة.',
    },
    source: { en: 'Module', ar: 'الوحدة' },
  },
};

/** Relative time, matching the Content Studio's own phrasing. */
export function feedbackTimeAgo(iso: string, lang: 'en' | 'ar'): string {
  if (!iso) return '-';
  const ar = lang === 'ar';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return ar ? 'الآن' : 'just now';
  if (mins < 60) return ar ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ar ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return ar ? `منذ ${days} ي` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(ar ? 'ar' : 'en-US');
}
