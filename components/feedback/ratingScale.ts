/* ─── The 1 to 5 scale ───
 * One definition of what each score means, shared by the dialog a learner
 * answers and the studio pages a creator reads.
 */

import type { Rating } from '../../services/feedbackService';

export const RATINGS: Rating[] = [1, 2, 3, 4, 5];

export interface RatingMeta {
  /** Accent for the selected circle, the studio's histogram and its chips. */
  color: string;
  /** One word for the score, used on chips and in the studio list. */
  label: { en: string; ar: string };
  /** The question that replaces the prompt once this score is picked. */
  question: { en: string; ar: string };
  placeholder: { en: string; ar: string };
}

/* Red through the brand gold to the brand greens: the ramp a learner already
   reads elsewhere in the Academy (danger, in review, published). */
export const RATING_META: Record<Rating, RatingMeta> = {
  1: {
    color: '#e5484d',
    label: { en: 'Poor', ar: 'ضعيف' },
    question: {
      en: 'That is a rough score. What went wrong, and how can we put it right?',
      ar: 'هذه نتيجة قاسية. ما الذي لم ينجح، وكيف نصلحه؟',
    },
    placeholder: {
      en: 'The part that failed you was...',
      ar: 'الجزء الذي خذلك هو...',
    },
  },
  2: {
    color: '#ef7c3c',
    label: { en: 'Weak', ar: 'دون المتوقع' },
    question: {
      en: 'What made this frustrating? Tell us the first thing to change.',
      ar: 'ما الذي سبّب لك الإحباط؟ أخبرنا بأول شيء يجب تغييره.',
    },
    placeholder: {
      en: 'The first thing to fix is...',
      ar: 'أول ما يجب إصلاحه هو...',
    },
  },
  3: {
    color: '#f3a43a',
    label: { en: 'Fine', ar: 'مقبول' },
    question: {
      en: 'It did the job. What would have pushed it to a 5?',
      ar: 'أدّى الغرض. ما الذي كان سيرفعه إلى 5؟',
    },
    placeholder: {
      en: 'It would have been a 5 if...',
      ar: 'كان سيصبح 5 لو...',
    },
  },
  4: {
    color: '#00a859',
    label: { en: 'Good', ar: 'جيد' },
    question: {
      en: 'Close to great. What is the one thing still missing?',
      ar: 'قريب جدًا من الممتاز. ما الشيء الوحيد الناقص؟',
    },
    placeholder: {
      en: 'The one thing missing is...',
      ar: 'الشيء الناقص الوحيد هو...',
    },
  },
  5: {
    color: '#9fef00',
    label: { en: 'Excellent', ar: 'ممتاز' },
    question: {
      en: 'Glad it landed. What worked best for you here?',
      ar: 'يسعدنا أنه نال إعجابك. ما الذي أفادك أكثر هنا؟',
    },
    placeholder: {
      en: 'What worked best was...',
      ar: 'أكثر ما أفادني هو...',
    },
  },
};

/** Ends of the scale, shown under the circles. */
export const SCALE_ENDS = {
  worst: { en: 'Worst', ar: 'الأسوأ' },
  best: { en: 'Best', ar: 'الأفضل' },
};

/** Colour for an average, so a 4.6 card reads green and a 1.8 reads red. */
export function toneForAverage(average: number): string {
  if (average <= 0) return '#6e7a94';
  return RATING_META[Math.min(5, Math.max(1, Math.round(average))) as Rating].color;
}
