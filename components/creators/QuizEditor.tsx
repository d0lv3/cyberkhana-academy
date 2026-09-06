import React from 'react';
import { Plus, Trash2, HelpCircle, CheckCircle2, Circle, Keyboard, ListChecks } from 'lucide-react';
import type { QuizQuestion, QuizKind } from '../../services/creatorTypes';
import { answerMask } from '../../data/linuxQuizData';

interface QuizEditorProps {
  value: QuizQuestion[];
  onChange: (quiz: QuizQuestion[]) => void;
}

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#7c8aa6]';

const MAX_OPTIONS = 6;

const KINDS: { value: QuizKind; label: string; icon: React.ElementType }[] = [
  { value: 'mcq', label: 'MCQ', icon: ListChecks },
  { value: 'text', label: 'Written answer', icon: Keyboard },
];

/** Drop blank questions/options and re-anchor the correct answer by its text.
 *  A written-answer question is kept on its answer alone — options it may have
 *  carried before the author switched its kind are dropped with it. */
export function cleanQuiz(quiz?: QuizQuestion[]): QuizQuestion[] {
  if (!quiz) return [];
  const cleaned: QuizQuestion[] = [];
  for (const q of quiz) {
    const question = q.question.trim();
    if (!question) continue;

    if (q.kind === 'text') {
      const answer = (q.answer ?? '').trim();
      if (!answer) continue;
      cleaned.push({ question, kind: 'text', answer, options: [], correctIndex: 0 });
      continue;
    }

    const correctText = q.options[q.correctIndex];
    const options = q.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) continue;
    let correctIndex = correctText !== undefined ? options.indexOf(correctText.trim()) : 0;
    if (correctIndex < 0) correctIndex = 0;
    cleaned.push({ question, kind: 'mcq', options, correctIndex });
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
 */
const QuizEditor: React.FC<QuizEditorProps> = ({ value, onChange }) => {
  const quiz = value ?? [];

  const addQuestion = () =>
    onChange([...quiz, { question: '', kind: 'mcq', options: ['', ''], correctIndex: 0 }]);

  /* Switching kind keeps whatever the other kind had written, so flipping to
     see the alternative and back does not cost the author their work. */
  const setKind = (qi: number, kind: QuizKind) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, kind } : q)));

  const updateQuestion = (qi: number, patch: Partial<QuizQuestion>) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const removeQuestion = (qi: number) => onChange(quiz.filter((_, i) => i !== qi));

  const addOption = (qi: number) =>
    onChange(
      quiz.map((q, i) =>
        i === qi && q.options.length < MAX_OPTIONS ? { ...q, options: [...q.options, ''] } : q
      )
    );

  const updateOption = (qi: number, oi: number, val: string) =>
    onChange(
      quiz.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q
      )
    );

  const removeOption = (qi: number, oi: number) =>
    onChange(
      quiz.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        let correctIndex = q.correctIndex;
        if (oi === q.correctIndex) correctIndex = 0;
        else if (oi < q.correctIndex) correctIndex -= 1;
        return { ...q, options, correctIndex };
      })
    );

  const setCorrect = (qi: number, oi: number) =>
    onChange(quiz.map((q, i) => (i === qi ? { ...q, correctIndex: oi } : q)));

  return (
    <div className="space-y-4">
      {quiz.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#263248] bg-[#0d1420] py-6 text-center">
          <HelpCircle size={20} className="mx-auto text-[#7c8aa6] mb-2" />
          <p className="text-xs text-[#8592ad]">No quiz on this section yet.</p>
        </div>
      ) : (
        quiz.map((q, qi) => {
          const kind: QuizKind = q.kind === 'text' ? 'text' : 'mcq';
          const mask = answerMask(q);
          return (
          <div key={qi} className="rounded-lg border border-[#263248] bg-[#0d1117] p-3.5" dir="ltr">
            <div className="flex items-start gap-2 mb-3">
              <span className="mt-2 text-[11px] font-bold text-[#8592ad] w-5 flex-shrink-0">
                Q{qi + 1}
              </span>
              <input
                value={q.question}
                onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                placeholder="Question prompt…"
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="mt-1 w-7 h-7 flex items-center justify-center rounded text-[#7c8aa6] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                title="Remove question"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* How this one is asked. Per question, not per quiz: a section can
                mix a couple of recall questions in among the options. */}
            <div className="mb-3 flex items-center gap-1 pl-7">
              {KINDS.map(({ value, label, icon: KindIcon }) => (
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
                  <KindIcon size={12} /> {label}
                </button>
              ))}
            </div>

            {kind === 'text' ? (
              <div className="space-y-1.5 pl-7">
                <input
                  value={q.answer ?? ''}
                  onChange={(e) => updateQuestion(qi, { answer: e.target.value })}
                  placeholder="The answer, e.g. Hello World"
                  className={`${inputCls} ${q.answer?.trim() ? 'border-[#00a859]/40' : ''}`}
                />
                <p className="text-[11px] leading-relaxed text-[#7c8aa6]">
                  Marked case-insensitively, and extra spaces are ignored, so “hello world”
                  passes for “Hello World”.
                  {mask && (
                    <>
                      {' '}The student sees{' '}
                      <span className="font-mono text-[#9aa5bf]">{mask}</span> in the empty
                      box as a hint.
                    </>
                  )}
                </p>
              </div>
            ) : (
            <div className="space-y-1.5 pl-7">
              {q.options.map((opt, oi) => {
                const correct = oi === q.correctIndex;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrect(qi, oi)}
                      title={correct ? 'Correct answer' : 'Mark as correct'}
                      className={`flex-shrink-0 transition-colors ${
                        correct ? 'text-[#00a859]' : 'text-[#7c8aa6] hover:text-[#9aa5bf]'
                      }`}
                    >
                      {correct ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={`${inputCls} flex-1 ${correct ? 'border-[#00a859]/40' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qi, oi)}
                      disabled={q.options.length <= 2}
                      className="w-7 h-7 flex items-center justify-center rounded text-[#7c8aa6] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[#7c8aa6]"
                      title="Remove option"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {q.options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#8592ad] hover:text-[#00a859] transition-colors"
                >
                  <Plus size={12} /> Add option
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
        <Plus size={13} /> Add Question
      </button>
    </div>
  );
};

export default QuizEditor;
