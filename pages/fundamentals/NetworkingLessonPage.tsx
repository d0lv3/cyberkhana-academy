import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Activity, Clock, Tag, CheckCircle2 } from 'lucide-react';
import { getNetworkingLesson } from '../../data/networking';
import { NetworkSimulator } from '../../components/network-sim';
import Button from '../../components/ui/EnhancedButton';
import LessonMarkdown from '../../components/ui/LessonMarkdown';
import LessonQuiz from '../../components/ui/LessonQuiz';
import { useLang } from '../../contexts/LangContext';
import { isNetworkingDone, markNetworkingDone, recordActivity } from '../../services/progressService';

type Tab = 'content' | 'simulation';

const NetworkingLessonPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const lesson = getNetworkingLesson(slug || '');

  const [mobileTab, setMobileTab] = useState<Tab>('content');
  const [done, setDone] = useState(() => (lesson ? isNetworkingDone(lesson.id) : false));

  const handleComplete = () => {
    if (!lesson) return;
    markNetworkingDone(lesson.id);
    setDone(true);
  };

  // Remember this as the learner's most recent activity (dashboard "Jump back in").
  useEffect(() => {
    if (lesson) {
      recordActivity({
        kind: 'networking',
        route: `/fundamentals/networking/lesson/${lesson.slug}`,
        title: lesson.title,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Lesson not found</h2>
          <Button variant="outline" onClick={() => navigate('/fundamentals/networking')}>
            Back to Networking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0d1117] text-[#d2d7e3]">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-14 border-b border-[#263248] bg-[#121a2a] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-[#f3f6ff] truncate max-w-[260px]">
              {lesson.title[lang]}
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-2" dir="ltr">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <Clock size={10} /> {lesson.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
              <Activity size={10} /> {lesson.simulation.steps.length} steps
            </span>
          </div>
        </div>

        {/* Tags (desktop) */}
        <div className="hidden md:flex items-center gap-1.5">
          {lesson.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0e1522] border border-[#263248] text-[#6e7a94]"
            >
              <Tag size={8} /> {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ── MOBILE TAB SWITCHER ── */}
      <div className="md:hidden flex border-b border-[#263248] bg-[#121a2a]">
        <button
          onClick={() => setMobileTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'content'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#6e7a94]'
          }`}
        >
          <BookOpen size={14} /> Content
        </button>
        <button
          onClick={() => setMobileTab('simulation')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mobileTab === 'simulation'
              ? 'text-[#00a859] border-b-2 border-[#00a859]'
              : 'text-[#6e7a94]'
          }`}
        >
          <Activity size={14} /> Simulation
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Markdown Content ── */}
        <div
          className={`
            md:w-1/2 md:border-r md:border-[#263248] overflow-y-auto custom-scrollbar
            ${mobileTab === 'content' ? 'w-full' : 'hidden md:block'}
          `}
        >
          <article className="max-w-2xl mx-auto px-6 py-8 md:px-8 md:py-10">
            <LessonMarkdown content={lesson.markdownContent} />

            {/* ── Completion — quiz-gated when the lesson has one ── */}
            <div className="mt-10 pt-6 border-t border-[#263248] space-y-4">
              {done && (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#00a859]">
                  <CheckCircle2 size={18} /> {lang === 'ar' ? 'تم إكمال الدرس' : 'Lesson completed'}
                </div>
              )}
              {(lesson.quiz?.length ?? 0) > 0 ? (
                <LessonQuiz questions={lesson.quiz!} onPass={handleComplete} passed={done} />
              ) : (
                !done && (
                  <Button variant="primary" onClick={handleComplete} leftIcon={<CheckCircle2 size={16} />}>
                    {lang === 'ar' ? 'وضع علامة كمكتمل' : 'Mark as complete'}
                  </Button>
                )
              )}
            </div>
          </article>
        </div>

        {/* ── RIGHT: Simulation ── */}
        <div
          className={`
            md:w-1/2 flex flex-col overflow-hidden
            ${mobileTab === 'simulation' ? 'w-full' : 'hidden md:flex'}
          `}
        >
          <div className="flex-1 p-4 md:p-6 min-h-0">
            <NetworkSimulator simulation={lesson.simulation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkingLessonPage;
