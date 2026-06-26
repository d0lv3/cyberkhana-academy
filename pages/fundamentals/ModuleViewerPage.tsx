import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Menu,
  X,
  Clock,
  Layers,
  Video,
  ClipboardCheck,
  ChevronRight,
  RotateCcw,
  Award,
  Flag,
  Zap,
  FileText,
} from 'lucide-react';
import { getViewableModuleBySlug } from '../../data/modulesData';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import quizBank, { QuizQuestion } from '../../data/linuxQuizData';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/EnhancedButton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import CourseViewerSidebar, { SidebarModule } from '../../components/CourseViewerSidebar';
import { useLang } from '../../contexts/LangContext';
import { emitProgressChange, recordActivity } from '../../services/progressService';

type Lecture = {
  id: string;
  title: string;
  subtitle: string;
  videoId: string;
  duration: string;
  quiz: string | null;
  /** Creator-authored quiz embedded on the lecture (static Linux uses quizBank). */
  quizQuestions?: QuizQuestion[];
  notes?: string[];
  resource?: string;
  /** Creator section markdown body (rendered below any video) */
  markdownContent?: string;
};

type CourseModule = {
  id: string;
  title: string;
  lectures: Lecture[];
};

type QuizState = {
  started: boolean;
  completed: boolean;
  currentIndex: number;
  selectedOption: number | null;
  answers: Record<number, { selected: number; correct: boolean }>;
  showExplanation: boolean;
  /** Per-attempt question set with options shuffled. */
  questions: QuizQuestion[];
};

const LETTERS = ['A', 'B', 'C', 'D'];

const emptyQuizState = (): QuizState => ({
  started: false,
  completed: false,
  currentIndex: 0,
  selectedOption: null,
  answers: {},
  showExplanation: false,
  questions: [],
});

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

/** The hands-on capstone (e.g. "Linux Final Cyber Challenge") gets a flag field. */
const isFinalChallenge = (title: string) => /final.*challenge/i.test(title);

/* ── Flag submission (validation intentionally not wired up yet) ── */
const FlagSubmission: React.FC = () => {
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'pending'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) {
      setMessage({ type: 'error', text: 'Please enter a flag.' });
      return;
    }
    setMessage({
      type: 'pending',
      text: 'Flag received — automatic validation will be enabled soon.',
    });
  };

  return (
    <div className="rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#263248] flex items-center gap-2">
        <Flag className="w-4 h-4 text-[#9fef00]" />
        <h3 className="text-sm font-semibold text-[#f3f6ff]">Flag Submission</h3>
      </div>
      <div className="p-6">
        <p className="text-sm text-[#9aa5bf] mb-5">
          Completed the challenge? Capture the flag and submit it below to finish the course.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" dir="ltr">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6e7a94] group-focus-within:text-[#9fef00] transition-colors">
              <Zap size={18} />
            </div>
            <input
              type="text"
              placeholder="khana{...}"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#0d1117] border border-[#263248] focus:border-[#9fef00]/50 focus:outline-none rounded-xl text-[#f3f6ff] font-mono text-sm placeholder:text-[#3d4a63] transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#007a42] hover:bg-[#006737] text-white text-base font-black tracking-wide transition-all shadow-lg shadow-[#00a859]/10"
          >
            SUBMIT FLAG
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-5 p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-[#9fef00]/10 text-[#9fef00] border border-[#9fef00]/20'
              }`}
            >
              {message.type === 'error' ? (
                <X size={18} className="flex-shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="flex-shrink-0" />
              )}
              <span className="text-sm font-semibold">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ModuleViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();

  const fundamentalModule = getViewableModuleBySlug(slug || '');
  const course = fundamentalModule?.courseData as {
    id: string; title: string; description: string; modules: CourseModule[];
  } | undefined;

  const allLectures = useMemo(
    () => course?.modules.flatMap((mod) => mod.lectures.map((lecture) => ({ module: mod, lecture }))) ?? [],
    [course]
  );

  const [completedLectures, setCompletedLectures] = useState<string[]>(() => {
    const saved = localStorage.getItem(`academy-progress-${slug}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeLectureId, setActiveLectureId] = useState<string>(allLectures[0]?.lecture.id || '');
  const [tocMobileOpen, setTocMobileOpen] = useState(false);
  const [quizStates, setQuizStates] = useState<Record<string, QuizState>>({});

  // Build sidebar module data (generic shape for the reusable component)
  const sidebarModules: SidebarModule[] = useMemo(
    () =>
      course?.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        lectures: mod.lectures.map((l) => ({
          id: l.id,
          title: l.title,
          duration: l.duration,
          hasQuiz: !!l.quiz || !!(l.quizQuestions && l.quizQuestions.length),
        })),
      })) ?? [],
    [course]
  );

  // Remember this as the learner's most recent activity (dashboard "Jump back in").
  useEffect(() => {
    if (fundamentalModule) {
      recordActivity({
        kind: 'os',
        route: `/fundamentals/module/${fundamentalModule.slug}`,
        title: fundamentalModule.title,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundamentalModule?.id]);

  if (!fundamentalModule || !course) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Module not found</h2>
          <Button variant="outline" onClick={() => navigate('/fundamentals')}>Back to Fundamentals</Button>
        </div>
      </div>
    );
  }

  const isCompleted = (id: string) => completedLectures.includes(id);

  const persistProgress = (next: string[]) => {
    setCompletedLectures(next);
    localStorage.setItem(`academy-progress-${slug}`, JSON.stringify(next));
    emitProgressChange();
  };

  const markComplete = (id: string) => {
    if (isCompleted(id)) return;
    persistProgress([...completedLectures, id]);
  };

  const handleSelectLecture = (lectureId: string) => {
    setActiveLectureId(lectureId);
    setTocMobileOpen(false);
  };

  const getQuestions = (lecture: Lecture): QuizQuestion[] => {
    // Creator modules embed their own questions; static Linux looks them up by id.
    if (lecture.quizQuestions && lecture.quizQuestions.length) return lecture.quizQuestions;
    if (!lecture.quiz) return [];
    return quizBank[lecture.id] || [];
  };

  const getQuizState = (lectureId: string): QuizState =>
    quizStates[lectureId] || emptyQuizState();

  const updateQuiz = useCallback((lectureId: string, update: Partial<QuizState>) => {
    setQuizStates((prev) => ({
      ...prev,
      [lectureId]: { ...(prev[lectureId] || emptyQuizState()), ...update },
    }));
  }, []);

  const startQuiz = (lectureId: string, base: QuizQuestion[]) => {
    setQuizStates((prev) => ({
      ...prev,
      [lectureId]: { ...emptyQuizState(), started: true, questions: base.map(shuffleOptions) },
    }));
  };

  const submitAnswer = (lecture: Lecture) => {
    const qs = getQuizState(lecture.id);
    const questions = qs.questions.length ? qs.questions : getQuestions(lecture);
    const question = questions[qs.currentIndex];
    if (qs.selectedOption === null || !question) return;

    const correct = qs.selectedOption === question.correctIndex;
    const nextAnswers = { ...qs.answers, [qs.currentIndex]: { selected: qs.selectedOption, correct } };

    updateQuiz(lecture.id, { answers: nextAnswers, showExplanation: true });
  };

  const nextQuestion = (lecture: Lecture) => {
    const qs = getQuizState(lecture.id);
    const questions = qs.questions.length ? qs.questions : getQuestions(lecture);
    const isLast = qs.currentIndex >= questions.length - 1;

    if (isLast) {
      const score = Object.values(qs.answers).filter((a) => a.correct).length;
      const allCorrect = score === questions.length;
      if (allCorrect) markComplete(lecture.id);
      updateQuiz(lecture.id, { completed: true, started: false, showExplanation: false });
    } else {
      updateQuiz(lecture.id, {
        currentIndex: qs.currentIndex + 1,
        selectedOption: null,
        showExplanation: false,
      });
    }
  };

  const activeLectureInfo = allLectures.find((l) => l.lecture.id === activeLectureId);
  const activeLecture = activeLectureInfo?.lecture;
  const activeModule = activeLectureInfo?.module;

  const totalLectures = allLectures.length;
  const completedCount = completedLectures.length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const goToNext = () => {
    const idx = allLectures.findIndex((l) => l.lecture.id === activeLectureId);
    if (idx < allLectures.length - 1) setActiveLectureId(allLectures[idx + 1].lecture.id);
  };

  const isLastLecture = allLectures.findIndex((l) => l.lecture.id === activeLectureId) === allLectures.length - 1;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0d1117] text-[#d2d7e3]">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-14 border-b border-[#263248] bg-[#121a2a] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors">
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </button>
          <button className="md:hidden text-[#9aa5bf] hover:text-[#f3f6ff]" onClick={() => setTocMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-[#f3f6ff] truncate max-w-[260px]">
              {fundamentalModule.title[lang]}
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-2" dir="ltr">
            <DifficultyBadge difficulty={fundamentalModule.difficulty} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              {fundamentalModule.contentType === 'text' ? (
                <><FileText size={10} /> Text</>
              ) : fundamentalModule.contentType === 'mixed' ? (
                <><Layers size={10} /> Mixed</>
              ) : (
                <><Video size={10} /> Video</>
              )}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <Clock size={10} /> {fundamentalModule.estimatedHours}h
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <Layers size={10} /> {fundamentalModule.totalLessons} lessons
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3" dir="ltr">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-[#6e7a94] font-semibold uppercase tracking-wider">Progress</p>
            <p className="text-sm font-bold text-[#f3f6ff]">{completedCount}<span className="text-[#6e7a94]">/{totalLectures}</span></p>
          </div>
          <div className="w-28"><ProgressBar value={progressPct} color="neon" size="sm" /></div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── SIDEBAR TOC (reusable component) ── */}
        <CourseViewerSidebar
          modules={sidebarModules}
          activeLectureId={activeLectureId}
          completedLectures={completedLectures}
          onSelectLecture={handleSelectLecture}
          mobileOpen={tocMobileOpen}
          onMobileClose={() => setTocMobileOpen(false)}
        />

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117]">
          {activeLecture && activeModule ? (
            <motion.div
              key={activeLecture.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto p-4 md:p-8 space-y-6"
            >
              {/* Lesson header */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#00a859] mb-1.5">
                  {activeModule.title}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-[#f3f6ff] mb-1">
                  {activeLecture.title}
                </h2>
                <p className="text-sm text-[#9aa5bf]">{activeLecture.subtitle}</p>
              </div>

              {/* Video */}
              {activeLecture.videoId && (
                <div className="rounded-xl overflow-hidden border border-[#263248] bg-[#0e1522]">
                  <div className="aspect-video w-full">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${activeLecture.videoId}`}
                      title={activeLecture.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Section markdown (creator modules) */}
              {activeLecture.markdownContent && (
                <div className="rounded-xl border border-[#263248] bg-[#121a2a] p-6 md:p-8">
                  <LessonMarkdown content={activeLecture.markdownContent} />
                </div>
              )}

              {/* Notes */}
              {activeLecture.notes && activeLecture.notes.length > 0 && (
                <div className="rounded-xl border border-[#263248] bg-[#121a2a] p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#263248]">
                    <BookOpen className="w-4 h-4 text-[#60a5fa]" />
                    <h3 className="text-sm font-semibold text-[#f3f6ff]">Key Takeaways</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {activeLecture.notes.map((note, i) => (
                      <li key={i} className="text-sm text-[#d2d7e3] flex items-start gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#60a5fa] flex-shrink-0" />
                        <span className="leading-relaxed">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── FINAL CHALLENGE FLAG SUBMISSION ── */}
              {isFinalChallenge(activeLecture.title) && <FlagSubmission />}

              {/* ── QUIZ SECTION ── */}
              {(() => {
                const baseQuestions = getQuestions(activeLecture);
                if (baseQuestions.length === 0) {
                  // No quiz — just mark complete / next
                  return (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-[#263248]">
                      {isCompleted(activeLecture.id) ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1f15] border border-[#00a859]/20 text-[#00a859]">
                          <CheckCircle2 size={16} /><span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : (
                        <Button onClick={() => markComplete(activeLecture.id)} leftIcon={<CheckCircle2 size={16} />}>Mark as Complete</Button>
                      )}
                      {!isLastLecture && (
                        <Button variant="secondary" onClick={() => { if (!isCompleted(activeLecture.id)) markComplete(activeLecture.id); goToNext(); }} leftIcon={<PlayCircle size={16} />}>
                          Next Lesson
                        </Button>
                      )}
                    </div>
                  );
                }

                const qs = getQuizState(activeLecture.id);
                const questions = qs.questions.length ? qs.questions : baseQuestions;
                const currentQuestion = questions[qs.currentIndex];

                return (
                  <div className="rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden">
                    {/* Quiz header */}
                    <div className="px-6 py-4 border-b border-[#263248] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#00a859]" />
                        <h3 className="text-sm font-semibold text-[#f3f6ff]">Knowledge Check</h3>
                      </div>
                      <span className="text-xs text-[#6e7a94]">
                        {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                      </span>
                    </div>

                    <div className="p-6">
                      {/* Not started */}
                      {!qs.started && !qs.completed && (
                        <div className="text-center py-6">
                          <div className="w-14 h-14 rounded-full bg-[#1a2332] border border-[#263248] flex items-center justify-center mx-auto mb-4">
                            <ClipboardCheck className="w-6 h-6 text-[#00a859]" />
                          </div>
                          <h4 className="text-base font-semibold text-[#f3f6ff] mb-1">Lesson Assessment</h4>
                          <p className="text-sm text-[#9aa5bf] mb-6 max-w-sm mx-auto">
                            Test your understanding of this lesson with {questions.length} question{questions.length > 1 ? 's' : ''}.
                          </p>
                          <Button onClick={() => startQuiz(activeLecture.id, baseQuestions)}>Begin Assessment</Button>
                        </div>
                      )}

                      {/* In progress */}
                      {qs.started && currentQuestion && (
                        <div className="space-y-5">
                          {/* Progress indicator */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#9aa5bf]">
                              Question {qs.currentIndex + 1} of {questions.length}
                            </span>
                            <ProgressBar
                              value={qs.currentIndex + 1}
                              max={questions.length}
                              color="green"
                              size="sm"
                              className="w-24"
                            />
                          </div>

                          {/* Question */}
                          <p className="text-[#f3f6ff] font-medium leading-relaxed">
                            {currentQuestion.question}
                          </p>

                          {/* Options */}
                          <div className="space-y-2">
                            {currentQuestion.options.map((option, idx) => {
                              const isSelected = qs.selectedOption === idx;
                              const isCorrect = idx === currentQuestion.correctIndex;
                              const showResult = qs.showExplanation;

                              let borderColor = 'border-[#263248]';
                              let bgColor = 'bg-[#0d1117]';
                              let textColor = 'text-[#d2d7e3]';

                              if (showResult && isCorrect) {
                                borderColor = 'border-[#00a859]/50';
                                bgColor = 'bg-[#0f1f15]';
                                textColor = 'text-[#00a859]';
                              } else if (showResult && isSelected && !isCorrect) {
                                borderColor = 'border-red-500/40';
                                bgColor = 'bg-red-950/30';
                                textColor = 'text-red-400';
                              } else if (isSelected) {
                                borderColor = 'border-[#00a859]/40';
                                bgColor = 'bg-[#0f1f15]';
                                textColor = 'text-[#f3f6ff]';
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={qs.showExplanation}
                                  onClick={() => updateQuiz(activeLecture.id, { selectedOption: idx })}
                                  dir="ltr"
                                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${borderColor} ${bgColor} ${
                                    !showResult ? 'hover:border-[#00a859]/30 hover:bg-[#0f1f15]' : ''
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                    isSelected ? 'border-[#00a859]/50 bg-[#00a859]/10 text-[#00a859]' : 'border-[#263248] text-[#6e7a94]'
                                  }`}>
                                    {LETTERS[idx]}
                                  </span>
                                  <span className={`text-sm font-medium ${textColor}`}>{option}</span>
                                  {showResult && isCorrect && <CheckCircle2 size={16} className="ml-auto text-[#00a859] flex-shrink-0" />}
                                  {showResult && isSelected && !isCorrect && <X size={16} className="ml-auto text-red-400 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Submit / Next */}
                          {!qs.showExplanation ? (
                            <Button
                              onClick={() => submitAnswer(activeLecture)}
                              disabled={qs.selectedOption === null}
                              fullWidth
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              {qs.answers[qs.currentIndex]?.correct ? (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#0f1f15] border border-[#00a859]/20 text-[#00a859]">
                                  <CheckCircle2 size={16} />
                                  <span className="text-sm font-medium">Correct</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400">
                                  <X size={16} />
                                  <span className="text-sm font-medium">
                                    Incorrect — the correct answer is {LETTERS[currentQuestion.correctIndex]}
                                  </span>
                                </div>
                              )}
                              <Button
                                onClick={() => nextQuestion(activeLecture)}
                                fullWidth
                                rightIcon={<ChevronRight size={16} />}
                              >
                                {qs.currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Completed */}
                      {qs.completed && (
                        <div className="space-y-5">
                          {(() => {
                            const score = Object.values(qs.answers).filter((a) => a.correct).length;
                            const total = questions.length;
                            const pct = Math.round((score / total) * 100);
                            const passed = score === total;

                            return (
                              <>
                                <div className="text-center py-4">
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                    passed ? 'bg-[#0f1f15] border-2 border-[#00a859]/30' : 'bg-[#1a2332] border-2 border-[#263248]'
                                  }`}>
                                    <Award size={28} className={passed ? 'text-[#00a859]' : 'text-[#6e7a94]'} />
                                  </div>
                                  <h4 className="text-lg font-bold text-[#f3f6ff] mb-1">
                                    {passed ? 'Assessment Passed' : 'Assessment Complete'}
                                  </h4>
                                  <p className="text-2xl font-bold text-[#f3f6ff] mb-1">
                                    {score}/{total}
                                    <span className="text-sm text-[#6e7a94] ml-2">({pct}%)</span>
                                  </p>
                                  {passed ? (
                                    <p className="text-sm text-[#00a859]">All answers correct. This lesson is now complete.</p>
                                  ) : (
                                    <p className="text-sm text-[#9aa5bf]">You need a perfect score to complete this lesson. Review and try again.</p>
                                  )}
                                </div>

                                {/* Results breakdown */}
                                <div className="space-y-2" dir="ltr">
                                  {questions.map((q, idx) => {
                                    const ans = qs.answers[idx];
                                    return (
                                      <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                                        ans?.correct ? 'border-[#00a859]/20 bg-[#0f1f15]' : 'border-red-500/15 bg-red-950/10'
                                      }`}>
                                        {ans?.correct ? (
                                          <CheckCircle2 size={15} className="text-[#00a859] flex-shrink-0" />
                                        ) : (
                                          <X size={15} className="text-red-400 flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-[#d2d7e3] truncate">{q.question}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                  {!passed && (
                                    <Button variant="outline" onClick={() => startQuiz(activeLecture.id, baseQuestions)} leftIcon={<RotateCcw size={15} />} fullWidth>
                                      Retry Assessment
                                    </Button>
                                  )}
                                  {!isLastLecture && (
                                    <Button onClick={goToNext} leftIcon={<PlayCircle size={15} />} fullWidth>
                                      Next Lesson
                                    </Button>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Mark complete (for quiz lessons, shown below quiz when already done) */}
              {getQuestions(activeLecture).length > 0 && !isCompleted(activeLecture.id) && !getQuizState(activeLecture.id).started && !getQuizState(activeLecture.id).completed && null}

            </motion.div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default ModuleViewerPage;
