import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  X,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import { useLang } from '../contexts/LangContext';

/* ─── Course contents ───
 *
 * The table of contents for a module, and the only map a student has while
 * they are inside one. It is read far more often than it is clicked, so it is
 * built to be scanned: where am I, what is behind me, what is left.
 *
 * The stops hang off a single rail that fills in behind you, the same shape
 * the Fundamentals roadmap uses one level up, so "the road so far" means the
 * same thing in both places. Everything that competed with that got cut. Per
 * lesson timings are gone (the module's own estimate covers the question of
 * how long this takes, and a run of "8:00 / 6:00 / 11:00" answered a question
 * nobody was asking); the quiz and lab pills lost their frames and their
 * labels and are now just their glyph. What is left per row is the node, the
 * title, and at most one mark saying what kind of work it is.
 */

export type SidebarLecture = {
  id: string;
  title: string;
  hasQuiz: boolean;
  /** A lab is a stop like any other, marked so it reads as hands-on work. */
  kind?: 'lesson' | 'lab';
};

export type SidebarModule = {
  id: string;
  title: string;
  lectures: SidebarLecture[];
};

interface CourseViewerSidebarProps {
  modules: SidebarModule[];
  activeLectureId: string;
  completedLectures: string[];
  onSelectLecture: (lectureId: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** Hide the sidebar on desktop (the mobile drawer is unaffected). */
  collapsed?: boolean;
}

/** Where the rail is lit, and where it is still ahead of you. */
const RAIL_DONE = '#00a859';
const RAIL_AHEAD = '#22304a';

/* ─── Component ─── */

const CourseViewerSidebar: React.FC<CourseViewerSidebarProps> = ({
  modules,
  activeLectureId,
  completedLectures,
  onSelectLecture,
  mobileOpen,
  onMobileClose,
  collapsed = false,
}) => {
  const { lang, isArabic } = useLang();
  const ar = lang === 'ar';

  // Which module contains the active lecture?
  const activeModuleId = useMemo(() => {
    for (const mod of modules) {
      if (mod.lectures.some((l) => l.id === activeLectureId)) return mod.id;
    }
    return modules[0]?.id;
  }, [modules, activeLectureId]);

  // Expanded modules — default: the one containing the active lecture
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    modules.forEach((mod) => {
      init[mod.id] = mod.id === activeModuleId;
    });
    return init;
  });

  // Auto-expand when active lecture changes to a different module
  useEffect(() => {
    if (activeModuleId && !expanded[activeModuleId]) {
      setExpanded((prev) => ({ ...prev, [activeModuleId]: true }));
    }
  }, [activeModuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleModule = (modId: string) => {
    setExpanded((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const isCompleted = (id: string) => completedLectures.includes(id);

  // Course-level stats
  const totalLectures = modules.reduce((sum, m) => sum + m.lectures.length, 0);
  const completedCount = completedLectures.length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const sidebarContent = (
    <>
      {/* ── Course progress summary ── */}
      <div className="p-4 border-b border-[#263248]">
        <div className="mb-2.5 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#00a859]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8592ad]">
            {ar ? 'تقدّمك' : 'Course progress'}
          </span>
        </div>
        <ProgressBar value={progressPct} color="neon" size="sm" showLabel />
        <p className="text-[11px] text-[#8592ad] mt-2">
          {ar
            ? `${completedCount} من ${totalLectures} دروس مكتملة`
            : `${completedCount} of ${totalLectures} lessons completed`}
        </p>
      </div>

      {/* ── Chapters ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {modules.map((mod, modIdx) => {
          const isExpanded = expanded[mod.id] ?? false;
          const modCompleted = mod.lectures.filter((l) => isCompleted(l.id)).length;
          const modTotal = mod.lectures.length;
          const isModComplete = modTotal > 0 && modCompleted === modTotal;
          const isActiveModule = mod.id === activeModuleId;

          return (
            <div key={mod.id} className="border-b border-[#263248]/60">
              {/* Chapter header — toggle expand */}
              <button
                onClick={() => toggleModule(mod.id)}
                aria-expanded={isExpanded}
                className={`group w-full flex items-start gap-2.5 px-4 py-3.5 text-start transition-colors hover:bg-[#182235] ${
                  isActiveModule ? 'bg-[#121a2a]' : ''
                }`}
              >
                <span className="mt-0.5 flex-shrink-0 text-[#8592ad] transition-colors group-hover:text-[#9aa5bf]">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4 rtl-flip" />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8592ad]">
                      {ar ? `الفصل ${modIdx + 1}` : `Chapter ${modIdx + 1}`}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-semibold tabular-nums ${
                        isModComplete ? 'text-[#00a859]' : 'text-[#8592ad]'
                      }`}
                      dir="ltr"
                    >
                      {isModComplete && <CheckCircle2 className="w-3 h-3" />}
                      {modCompleted}/{modTotal}
                    </span>
                  </div>
                  <h3
                    className={`mt-1 text-[13px] font-semibold leading-snug ${
                      isActiveModule ? 'text-[#f3f6ff]' : 'text-[#d2d7e3]'
                    }`}
                  >
                    {mod.title.replace(/^Module \d+:\s*/, '')}
                  </h3>
                </div>
              </button>

              {/* ── The rail ──
                  Each stop draws its own two half-segments, so a row can be one
                  line or three and the line between the nodes still meets. A
                  segment is lit when the stop above it is done, which is what
                  makes the rail fill in behind you as you go. */}
              {isExpanded && (
                <ul className="pb-2.5 ps-3 pe-2">
                  {mod.lectures.map((lecture, lectureIdx) => {
                    const done = isCompleted(lecture.id);
                    const active = lecture.id === activeLectureId;
                    const first = lectureIdx === 0;
                    const last = lectureIdx === mod.lectures.length - 1;
                    const prevDone = !first && isCompleted(mod.lectures[lectureIdx - 1].id);

                    return (
                      <li key={lecture.id}>
                        <button
                          onClick={() => onSelectLecture(lecture.id)}
                          aria-current={active ? 'true' : undefined}
                          className={`group relative flex w-full items-stretch gap-2.5 rounded-lg py-1.5 pe-2.5 text-start transition-colors ${
                            active ? 'bg-[#1a2332]' : 'hover:bg-[#182235]/70'
                          }`}
                        >
                          {/* Rail cell. The negative margin cancels the row's
                              own vertical padding: without it the cell only
                              stretches to the content box and every stop is
                              separated from the next by a 12px break in a line
                              that is supposed to be continuous. */}
                          <span
                            aria-hidden
                            className="relative -my-1.5 flex w-4 flex-shrink-0 justify-center self-stretch"
                          >
                            {!first && (
                              <span
                                className="absolute top-0 h-4 w-[2px]"
                                style={{ backgroundColor: prevDone ? RAIL_DONE : RAIL_AHEAD }}
                              />
                            )}
                            {!last && (
                              <span
                                className="absolute top-4 bottom-0 w-[2px]"
                                style={{ backgroundColor: done ? RAIL_DONE : RAIL_AHEAD }}
                              />
                            )}
                            {/* Node. Done and here are independent: revisiting a
                                finished lesson still has to show where you are,
                                so the halo is drawn on top of whichever mark
                                the stop already carries rather than instead
                                of it. */}
                            <span className="absolute top-[9px] flex h-3.5 w-3.5 items-center justify-center">
                              {active && (
                                <span className="absolute inset-0 rounded-full ring-2 ring-[#9fef00]" />
                              )}
                              {done ? (
                                <span className="h-[9px] w-[9px] rounded-full bg-[#00a859]" />
                              ) : (
                                <span
                                  className={`h-[9px] w-[9px] rounded-full border-[1.5px] bg-[#0f1520] ${
                                    active ? 'border-[#9fef00]' : 'border-[#3a4864]'
                                  }`}
                                />
                              )}
                            </span>
                          </span>

                          {/* Title. Allowed to wrap: a truncated lesson name is
                              not a lesson name. */}
                          <span
                            className={`min-w-0 flex-1 py-0.5 text-[12.5px] leading-snug line-clamp-2 ${
                              active
                                ? 'font-semibold text-[#f3f6ff]'
                                : done
                                ? 'text-[#8592ad]'
                                : 'text-[#c4cad6] group-hover:text-[#d2d7e3]'
                            }`}
                          >
                            {lecture.title}
                          </span>

                          {/* What kind of work this is. The glyph alone: a
                              framed pill sat at the same weight as the title
                              and won, which is backwards. */}
                          <span className="flex flex-shrink-0 items-center gap-1.5 pt-1">
                            {lecture.kind === 'lab' && (
                              <FlaskConical
                                className="w-[13px] h-[13px] text-[#f3a43a]"
                                aria-label={ar ? 'مختبر' : 'Lab'}
                              />
                            )}
                            {lecture.hasQuiz && (
                              <ClipboardCheck
                                className={`w-[13px] h-[13px] ${
                                  done ? 'text-[#00a859]/50' : 'text-[#00a859]/80'
                                }`}
                                aria-label={ar ? 'اختبار' : 'Quiz'}
                              />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-14 bottom-0 start-0 z-50 w-full sm:w-80 bg-[#0f1520] border-e border-[#263248]
          flex flex-col transition-transform duration-300
          md:relative md:top-0 md:translate-x-0 md:w-80 md:flex-shrink-0
          ${mobileOpen ? 'translate-x-0' : isArabic ? 'translate-x-full' : '-translate-x-full'}
          ${collapsed ? 'md:hidden' : ''}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#263248] md:hidden">
          <h2 className="text-xs font-bold text-[#f3f6ff] uppercase tracking-widest">
            {ar ? 'محتويات الوحدة' : 'Course contents'}
          </h2>
          <button
            onClick={onMobileClose}
            className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sidebarContent}
      </aside>
    </>
  );
};

export default CourseViewerSidebar;
