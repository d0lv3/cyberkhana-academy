import React from 'react';
import { Plus, Trash2, HelpCircle, CheckCircle2, Circle, Keyboard, ListChecks } from 'lucide-react';
import type { LocalizedQuizQuestion, QuizKind } from '../../services/creatorTypes';
import { answerMask } from '../../data/linuxQuizData';
import { useLang } from '../../contexts/LangContext';
import { hasText, otherLang, type Lang } from '../../services/contentLang';
import { MissingMark, Reference, type EditingLanguage } from './module-editor/fields';

interface QuizEditorProps {
  value: LocalizedQuizQuestion[];
  onChange: (quiz: LocalizedQuizQuestion[]) => void;
  /** The language being written, when the quiz belongs to something written in
   *  two (services/contentLang.ts). Left out, the quiz is written once, in the
   *  first slot, the way a networking lesson's still is. */
  editing?: EditingLanguage;
}

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

const MAX_OPTIONS = 6;

const KINDS: { value: QuizKind; label: string; labelAr: string; icon: React.ElementType }[] = [
  { value: 'mcq', label: 'MCQ', labelAr: 'اختيار من متعدد', icon: ListChecks },
  { value: 'text', label: 'Written answer', labelAr: 'إجابة مكتوبة', icon: Keyboard },
];

/** Drop blank questions and options, keeping the right answer on the option it
 *  was marked on. A question or an option counts as written when either
 *  language has it, and the two lists of options stay in step. A written-answer
 *  question is kept on its answer alone: options it may have carried before
 *  the author switched its kind are dropped with it. */
export function cleanQuiz(quiz?: LocalizedQuizQuestion[]): LocalizedQuizQuestion[] {
  if (!quiz) return [];
  const cleaned: LocalizedQuizQuestion[] = [];
  for (const q of quiz) {
    const question = q.question.trim();
    const questionAr = (q.questionAr ?? '').trim();
    if (!question && !questionAr) continue;
    const wording = { question, ...(questionAr ? { questionAr } : {}) };

    if (q.kind === 'text') {
      const answer = (q.answer ?? '').trim();
      const answerAr = (q.answerAr ?? '').trim();
      if (!answer && !answerAr) continue;
      cleaned.push({ ...wording, kind: 'text', answer, ...(answerAr ? { answerAr } : {}), options: [], correctIndex: 0 });
      continue;
    }

    const rows = q.options
      .map((option, i) => ({ en: option.trim(), ar: (q.optionsAr?.[i] ?? '').trim(), wasCorrect: i === q.correctIndex }))
      .filter((row) => row.en || row.ar);
    if (rows.length < 2) continue;
    const correctIndex = Math.max(0, rows.findIndex((row) => row.wasCorrect));
    cleaned.push({
      ...wording,
      kind: 'mcq',
      options: rows.map((row) => row.en),
      ...(rows.some((row) => row.ar) ? { optionsAr: rows.map((row) => row.ar) } : {}),
      correctIndex,
    });
  }
  return cleaned;
}

/**
 * Authoring UI for an end-of-section quiz.
 *
 * A question is asked one of two ways, chosen per question:
 *   MCQ            — a prompt, 2–6 options and exactly one correct answer. The
 *                    student-side runner shuffles options per attempt, so the
 *                    order they are written in here is free.
 *   Written answer — a prompt and the answer itself, typed out by the student
 *                    and marked case-insensitively.
 *
 * In a module written in two languages the wording is written once per
 * language, in the language the editor is on. Which option is right is said
 * once, for both, and a written answer is accepted in either.
 */
const QuizEditor: React.FC<QuizEditorProps> = ({ value, onChange, editing }) => {
  const { isArabic } = useLang();
  const quiz = value ?? [];
  const lang: Lang = editing?.lang ?? 'en';
  const other = otherLang(lang);
  const bilingual = !!editing && editing.languages.length === 2;
  const compare = bilingual && !!editing?.compare;
  const arabicSlot = lang === 'ar';
  // The interface language decides the Studio's own words. What the creator
  // types follows the language being written, when there is one.
  const typed = editing ? { dir: arabicSlot ? ('rtl' as const) : ('ltr' as const), lang } : { dir: 'auto' as const };

  const addQuestion = () =>
    onChange([...quiz, { question: '', kind: 'mcq', options: ['', ''], correctIndex: 0 }]);

  /* Switching kind keeps whatever the other kind had written, so flipping to
     see the alternative and back does not cost the author their work. */
  const setKind = (qi: number, kind: QuizKind) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, kind } : q)));

  const updateQuestion = (qi: number, patch: Partial<LocalizedQuizQuestion>) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const removeQuestion = (qi: number) => onChange(quiz.filter((_, i) => i !== qi));

  /** The Arabic options of a question, padded to line up with the English. */
  const arabicOptions = (q: LocalizedQuizQuestion): string[] => q.options.map((_, i) => q.optionsAr?.[i] ?? '');

  const addOption = (qi: number) =>
    onChange(
      quiz.map((q, i) =>
        i === qi && q.options.length < MAX_OPTIONS
          ? { ...q, options: [...q.options, ''], ...(q.optionsAr ? { optionsAr: [...arabicOptions(q), ''] } : {}) }
          : q
      )
    );

  const updateOption = (qi: number, oi: number, val: string) =>
    onChange(
      quiz.map((q, i) => {
        if (i !== qi) return q;
        if (arabicSlot) return { ...q, optionsAr: arabicOptions(q).map((o, j) => (j === oi ? val : o)) };
        return { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) };
      })
    );

  const removeOption = (qi: number, oi: number) =>
    onChange(
      quiz.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        let correctIndex = q.correctIndex;
        if (oi === q.correctIndex) correctIndex = 0;
        else if (oi < q.correctIndex) correctIndex -= 1;
        return {
          ...q,
          options,
          ...(q.optionsAr ? { optionsAr: arabicOptions(q).filter((_, j) => j !== oi) } : {}),
          correctIndex,
        };
      })
    );

  const setCorrect = (qi: number, oi: number) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, correctIndex: oi } : q)));

  return (
    <div className="space-y-4">
      {quiz.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#263248] bg-[#0d1420] py-6 text-center">
          <HelpCircle size={20} className="mx-auto text-[#7c8aa6] mb-2" />
          <p className="text-xs text-[#8592ad]">{isArabic ? 'لا يوجد اختبار في هذا الدرس بعد.' : 'No quiz on this lesson yet.'}</p>
        </div>
      ) : (
        quiz.map((q, qi) => {
          const kind: QuizKind = q.kind === 'text' ? 'text' : 'mcq';
          const prompt = (arabicSlot ? q.questionAr : q.question) ?? '';
          const promptOther = (arabicSlot ? q.question : q.questionAr) ?? '';
          const answer = (arabicSlot ? q.answerAr : q.answer) ?? '';
          const answerOther = (arabicSlot ? q.answer : q.answerAr) ?? '';
          const mask = answerMask({ answer: answer || answerOther });
          const options = arabicSlot ? arabicOptions(q) : q.options;
          const optionsOther = arabicSlot ? q.options : arabicOptions(q);
          return (
          <div key={qi} className="rounded-lg border border-[#263248] bg-[#0d1117] p-3.5" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex items-start gap-2 mb-3">
              <span className="mt-2 text-[11px] font-bold text-[#8592ad] w-5 flex-shrink-0">
                {isArabic ? 'س' : 'Q'}{qi + 1}
              </span>
              <div className="min-w-0 flex-1">
                <input
                  value={prompt}
                  onChange={(e) => updateQuestion(qi, arabicSlot ? { questionAr: e.target.value } : { question: e.target.value })}
                  placeholder={
                    bilingual && !compare && hasText(promptOther) ? promptOther : isArabic ? 'نص السؤال…' : 'Question prompt…'
                  }
                  {...typed}
                  className={inputCls}
                />
                {bilingual && !hasText(prompt) && hasText(promptOther) && !compare && (
                  <div className="mt-1.5"><MissingMark lang={lang} /></div>
                )}
                {compare && (
                  <Reference
                    text={promptOther}
                    lang={other}
                    onCopy={hasText(prompt) ? undefined : () => updateQuestion(qi, arabicSlot ? { questionAr: promptOther } : { question: promptOther })}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="mt-1 w-7 h-7 flex items-center justify-center rounded text-[#7c8aa6] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                title={isArabic ? 'حذف السؤال' : 'Remove question'}
                aria-label={isArabic ? 'حذف السؤال' : 'Remove question'}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* How this one is asked. Per question, not per quiz: a section can
                mix a couple of recall questions in among the options. */}
            <div className="mb-3 flex items-center gap-1 ps-7">
              {KINDS.map(({ value, label, labelAr, icon: KindIcon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(qi, value)}
                  aria-pressed={kind === value}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    kind === value
                      ? 'border-[#00a859]/45 bg-[#00a859]/10 text-[#00a859]'
                      : 'border-[#263248] bg-[#0a0f18] text-[#7c8aa6] hover:text-[#9aa5bf]'
                  }`}
                >
                  <KindIcon size={12} /> {isArabic ? labelAr : label}
                </button>
              ))}
            </div>

            {kind === 'text' ? (
              <div className="space-y-1.5 ps-7">
                <input
                  value={answer}
                  onChange={(e) => updateQuestion(qi, arabicSlot ? { answerAr: e.target.value } : { answer: e.target.value })}
                  placeholder={isArabic ? 'الإجابة، مثل: مرحبًا بالعالم' : 'The answer, e.g. Hello World'}
                  {...typed}
                  className={`${inputCls} ${answer.trim() ? 'border-[#00a859]/40' : ''}`}
                />
                {compare && <Reference text={answerOther} lang={other} mono />}
                <p className="text-[11px] leading-relaxed text-[#7c8aa6]">
                  {isArabic
                    ? 'لا تؤثر حالة الأحرف الإنجليزية أو المسافات الزائدة في التصحيح؛ مثلًا تُقبل “hello world” بدل “Hello World”.'
                    : 'Marked case-insensitively, and extra spaces are ignored, so “hello world” passes for “Hello World”.'}
                  {bilingual && (
                    <>
                      {' '}
                      {isArabic
                        ? 'تُقبل الإجابة بأي من اللغتين، فيكفي أن تكتبها بإحداهما إن كانت واحدة فيهما.'
                        : 'An answer in either language is accepted, so one is enough when it reads the same in both.'}
                    </>
                  )}
                  {mask && (
                    <>
                      {' '}{isArabic ? 'يرى الطالب ' : 'The student sees '}
                      <span className="font-mono text-[#9aa5bf]" dir="ltr">{mask}</span>
                      {isArabic ? ' تلميحًا في خانة الإجابة الفارغة.' : ' in the empty box as a hint.'}
                    </>
                  )}
                </p>
              </div>
            ) : (
            <div className="space-y-1.5 ps-7">
              {options.map((opt, oi) => {
                const correct = oi === q.correctIndex;
                const optOther = optionsOther[oi] ?? '';
                return (
                  <div key={oi}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrect(qi, oi)}
                        title={correct ? (isArabic ? 'الإجابة الصحيحة' : 'Correct answer') : (isArabic ? 'تحديد إجابة صحيحة' : 'Mark as correct')}
                        aria-label={correct ? (isArabic ? 'الإجابة الصحيحة' : 'Correct answer') : (isArabic ? 'تحديد إجابة صحيحة' : 'Mark as correct')}
                        aria-pressed={correct}
                        className={`flex-shrink-0 transition-colors ${
                          correct ? 'text-[#00a859]' : 'text-[#7c8aa6] hover:text-[#9aa5bf]'
                        }`}
                      >
                        {correct ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={
                          bilingual && !compare && hasText(optOther) ? optOther : isArabic ? `الخيار ${oi + 1}` : `Option ${oi + 1}`
                        }
                        {...typed}
                        className={`${inputCls} flex-1 ${correct ? 'border-[#00a859]/40' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        disabled={q.options.length <= 2}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#7c8aa6] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#7c8aa6]"
                        title={isArabic ? 'حذف الخيار' : 'Remove option'}
                        aria-label={isArabic ? 'حذف الخيار' : 'Remove option'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {compare && (
                      <div className="ps-[26px] pe-9">
                        <Reference text={optOther} lang={other} onCopy={hasText(opt) ? undefined : () => updateOption(qi, oi, optOther)} />
                      </div>
                    )}
                  </div>
                );
              })}

              {q.options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#8592ad] hover:text-[#00a859] transition-colors"
                >
                  <Plus size={12} /> {isArabic ? 'إضافة خيار' : 'Add option'}
                </button>
              )}
            </div>
            )}
          </div>
          );
        })
      )}

      <button
        type="button"
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8592ad] bg-[#0d1420] border border-dashed border-[#263248] hover:border-[#00a859]/40 hover:text-[#00a859] transition-all"
      >
        <Plus size={13} /> {isArabic ? 'إضافة سؤال' : 'Add Question'}
      </button>
    </div>
  );
};

export default QuizEditor;
