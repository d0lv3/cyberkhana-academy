/* ─── A quiz question in the reader's language ───
 *
 * A question written in two languages carries its Arabic beside the English:
 * `questionAr`, and `optionsAr` in the same order as `options` (services/
 * contentLang.ts has the rule, components/creators/QuizEditor.tsx writes them).
 * The page that asks the question reads it through here, so the choice of
 * language is made in one place and a question with no Arabic simply reads in
 * English.
 */

import { answerMask as shapeOfAnswer } from '../backend/src/shared/checks';
import type { Lang } from './contentLang';

/** The Arabic side of a question, as a learner is sent it. */
export interface ArabicWording {
  questionAr?: string;
  optionsAr?: string[];
  /** The shape of the Arabic answer, for a typed question. */
  maskAr?: string;
  /** Present only on a creator's own copy, which is marked in the page. */
  answerAr?: string;
}

type Asked = { question: string; options: string[]; mask?: string; answer?: string } & ArabicWording;

const written = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * The question's own wording in `lang`, or nothing when it has none of its own
 * in that language: the caller then falls back to whatever it showed before.
 * `options` lines up with the question's options as they are on screen.
 */
export function ownWording(q: Asked, lang: Lang): { question: string; options: string[] } | null {
  if (lang !== 'ar') return null;
  const anyOption = (q.optionsAr ?? []).some(written);
  if (!written(q.questionAr) && !anyOption) return null;
  return {
    question: written(q.questionAr) ? q.questionAr : q.question,
    options: q.options.map((option, i) => (written(q.optionsAr?.[i]) ? q.optionsAr![i] : option)),
  };
}

/** The Arabic options put in the order the options were shuffled into, so the
 *  two lists still line up on screen. */
export function arabicOptionsInOrder(q: ArabicWording, order: number[]): { optionsAr?: string[] } {
  return q.optionsAr ? { optionsAr: order.map((i) => q.optionsAr![i] ?? '') } : {};
}

/** What the empty box of a typed question suggests to a reader in `lang`. */
export function maskInLanguage(q: Asked, lang: Lang): string {
  if (lang === 'ar' && (written(q.maskAr) || written(q.answerAr))) return q.maskAr ?? shapeOfAnswer(q.answerAr ?? '');
  return q.mask ?? shapeOfAnswer(q.answer ?? '');
}
