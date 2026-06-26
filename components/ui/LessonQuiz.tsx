import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ChevronRight, Trophy } from 'lucide-react';
import Button from './EnhancedButton';
import { useLang } from '../../contexts/LangContext';
import type { QuizQuestion } from '../../data/linuxQuizData';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PASS_RATIO = 0.7;

/** Return a copy of a question with its answer options shuffled (Fisher–Yates). */
const shuffleOptions = (q: QuizQuestion): QuizQuestion => {
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correctIndex: order.indexOf(q.correctIndex),
  };
};

interface LessonQuizProps {
  questions: QuizQuestion[];
  /** Fired once when the learner reaches the pass threshold (≥70%). */
  onPass: () => void;
  /** True when the lesson is already completed — shows a passed banner instead of the start card. */
  passed?: boolean;
}

/**
 * Compact end-of-lesson quiz runner (start → stepper → results).
 * Used by networking lessons; OS modules have their own richer runner.
 */
const LessonQuiz: React.FC<LessonQuizProps> = ({ questions, onPass, passed = false }) => {
  const { lang } = useLang();
  const ar = lang === 'ar';

  const [started, setStarted] = useState(false);
  const [qs, setQs] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const passNeeded = Math.ceil(questions.length * PASS_RATIO);

  const start = () => {
    setQs(questions.map(shuffleOptions));
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
    setStarted(true);
  };

  const submit = () => {
    if (selected === null || revealed) return;
    if (selected === qs[idx].correctIndex) setCorrectCount((c) => c + 1);
    setRevealed(true);
  };

  const next = () => {
    if (idx + 1 >= qs.length) {
      setFinished(true);
      if (correctCount >= passNeeded) onPass();
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const frame = 'rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden';

  /* ── Already passed (arriving at a completed lesson) ── */
  if (!started && passed) {
    return (
      <div className={`${frame} p-5 flex items-center justify-between gap-4`}>
        <span className="flex items-center gap-2 text-sm font-semibold text-[#00a859]">
          <CheckCircle2 size={18} /> {ar ? 'تم اجتياز الاختبار' : 'Quiz passed'}
        </span>
        <Button variant="ghost" size="sm" onClick={start} leftIcon={<RotateCcw size={13} />}>
          {ar ? 'إعادة المحاولة' : 'Retake'}
        </Button>
      </div>
    );
  }

  /* ── Start card ── */
  if (!started) {
    return (
      <div className={`${frame} p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#9fef00]/10 border border-[#9fef00]/25 flex items-center justify-center flex-shrink-0">
            <HelpCircle size={18} className="text-[#9fef00]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#f3f6ff]">
              {ar ? 'اختبر فهمك' : 'Check your understanding'}
            </h3>
            <p className="text-xs text-[#6e7a94]" dir="ltr">
              {questions.length} {ar ? 'أسئلة' : 'questions'} · {ar ? 'النجاح' : 'pass'} ≥ {passNeeded}
            </p>
          </div>
        </div>
        <p className="text-xs text-[#9aa5bf] mb-4">
          {ar
            ? 'أجب عن الأسئلة لإكمال هذا الدرس.'
            : 'Answer the questions to complete this lesson.'}
        </p>
        <Button variant="primary" size="sm" onClick={start}>
          {ar ? 'ابدأ الاختبار' : 'Start quiz'}
        </Button>
      </div>
    );
  }

  /* ── Results ── */
  if (finished) {
    const didPass = correctCount >= passNeeded;
    return (
      <div className={`${frame} p-6 text-center`}>
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            didPass
              ? 'bg-[#00a859]/10 border border-[#00a859]/30'
              : 'bg-red-500/10 border border-red-500/25'
          }`}
        >
          {didPass ? (
            <Trophy size={24} className="text-[#00a859]" />
          ) : (
            <XCircle size={24} className="text-red-400" />
          )}
        </div>
        <p className="text-lg font-black text-[#f3f6ff]" dir="ltr">
          {correctCount} / {qs.length}
        </p>
        <p className={`text-sm font-semibold mt-1 ${didPass ? 'text-[#00a859]' : 'text-red-400'}`}>
          {didPass
            ? ar
              ? 'أحسنت! تم إكمال الدرس.'
              : 'Well done — lesson completed.'
            : ar
            ? 'لم تصل إلى حد النجاح بعد.'
            : "You didn't reach the pass mark yet."}
        </p>
        {!didPass && (
          <Button
            variant="primary"
            size="sm"
            onClick={start}
            leftIcon={<RotateCcw size={14} />}
            className="mt-4"
          >
            {ar ? 'حاول مجددًا' : 'Try again'}
          </Button>
        )}
      </div>
    );
  }

  /* ── Question stepper ── */
  const q = qs[idx];
  return (
    <div className={frame}>
      <div className="px-5 py-3 border-b border-[#263248] bg-[#0e1626] flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e7a94]">
          {ar ? 'سؤال' : 'Question'} {idx + 1} / {qs.length}
        </span>
        <div className="flex items-center gap-1" dir="ltr">
          {qs.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < idx ? 'bg-[#00a859]' : i === idx ? 'bg-[#9fef00]' : 'bg-[#263248]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-5" dir="ltr">
        <p className="text-sm font-semibold text-[#f3f6ff] mb-4">{q.question}</p>

        <div className="space-y-2 mb-5">
          {q.options.map((opt, oi) => {
            const isSelected = selected === oi;
            const isCorrect = oi === q.correctIndex;
            let cls = 'border-[#263248] bg-[#0d1117] hover:border-[#354562] text-[#d2d7e3]';
            if (revealed) {
              if (isCorrect) cls = 'border-[#00a859] bg-[#00a859]/10 text-[#f3f6ff]';
              else if (isSelected) cls = 'border-red-500/60 bg-red-500/10 text-[#f3f6ff]';
              else cls = 'border-[#263248] bg-[#0d1117] text-[#6e7a94]';
            } else if (isSelected) {
              cls = 'border-[#9fef00]/60 bg-[#9fef00]/10 text-[#f3f6ff]';
            }
            return (
              <button
                key={oi}
                type="button"
                disabled={revealed}
                onClick={() => setSelected(oi)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${cls} ${
                  revealed ? 'cursor-default' : ''
                }`}
              >
                <span className="w-6 h-6 rounded-md bg-[#1a2332] border border-[#263248] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {LETTERS[oi]}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && isCorrect && (
                  <CheckCircle2 size={16} className="text-[#00a859] flex-shrink-0" />
                )}
                {revealed && isSelected && !isCorrect && (
                  <XCircle size={16} className="text-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <Button variant="primary" size="sm" onClick={next} rightIcon={<ChevronRight size={14} />}>
            {idx + 1 >= qs.length ? (ar ? 'النتيجة' : 'See results') : ar ? 'التالي' : 'Next'}
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={submit} disabled={selected === null}>
            {ar ? 'تحقق' : 'Check answer'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;
