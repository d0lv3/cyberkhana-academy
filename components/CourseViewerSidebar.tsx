import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  X,
  ClipboardCheck,
  Clock,
  BookOpen,
} from 'lucide-react';
import ProgressBar from './ui/ProgressBar';

/* ─── Types (generic enough for any video-based module) ─── */

export type SidebarLecture = {
  id: string;
  title: string;
  duration: string;
  hasQuiz: boolean;
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

/* ─── Helpers ─── */

const parseDuration = (d: string): number => {
  const parts = d.split(':');
  return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
};

const formatModuleDuration = (lectures: SidebarLecture[]): string => {
  const totalSec = lectures.reduce((sum, l) => sum + parseDuration(l.duration), 0);
  const mins = Math.round(totalSec / 60);
  if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
  return `${mins} min`;
};

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
      <div className="p-4 border-b border-[#263248]" dir="ltr">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#00a859]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6e7a94]">
              Course Progress
            </span>
          </div>
          <span className="text-xs font-semibold text-[#f3f6ff]">
            {progressPct}%
          </span>
        </div>
        <ProgressBar value={progressPct} color="green" size="sm" />
        <p className="text-[11px] text-[#6e7a94] mt-2">
          {completedCount} of {totalLectures} lessons completed
        </p>
      </div>

      {/* ── Module list ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {modules.map((mod, modIdx) => {
          const isExpanded = expanded[mod.id] ?? false;
          const modCompleted = mod.lectures.filter((l) => isCompleted(l.id)).length;
          const modTotal = mod.lectures.length;
          const isModComplete = modCompleted === modTotal;
          const isActiveModule = mod.id === activeModuleId;

          return (
            <div key={mod.id} className="border-b border-[#263248]/60">
              {/* Module header — toggle expand */}
              <button
                onClick={() => toggleModule(mod.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#182235] group ${
                  isActiveModule ? 'bg-[#121a2a]' : ''
                }`}
              >
                {/* Chevron */}
                <span className="flex-shrink-0 text-[#6e7a94] group-hover:text-[#9aa5bf] transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>

                {/* Module info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#6e7a94] bg-[#1a2332] px-1.5 py-0.5 rounded">
                      {modIdx + 1}
                    </span>
                    <h3 className={`text-[13px] font-semibold truncate ${
                      isActiveModule ? 'text-[#f3f6ff]' : 'text-[#d2d7e3]'
                    }`}>
                      {mod.title.replace(/^Module \d+:\s*/, '')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5" dir="ltr">
                    {/* Mini progress dots */}
                    <div className="flex items-center gap-0.5">
                      {mod.lectures.map((l) => (
                        <span
                          key={l.id}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            isCompleted(l.id)
                              ? 'bg-[#00a859]'
                              : l.id === activeLectureId
                              ? 'bg-[#9fef00]'
                              : 'bg-[#263248]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6e7a94]">
                      {modCompleted}/{modTotal}
                    </span>
                    <span className="text-[10px] text-[#6e7a94] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatModuleDuration(mod.lectures)}
                    </span>
                    {isModComplete && (
                      <CheckCircle2 className="w-3 h-3 text-[#00a859] ml-auto flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>

              {/* Lecture list (collapsible) */}
              {isExpanded && (
                <div className="pb-2 px-2">
                  {mod.lectures.map((lecture, lectureIdx) => {
                    const done = isCompleted(lecture.id);
                    const active = lecture.id === activeLectureId;

                    return (
                      <button
                        key={lecture.id}
                        onClick={() => onSelectLecture(lecture.id)}
                        dir="ltr"
                        className={`w-full text-left flex items-center gap-2.5 pl-5 pr-3 py-2.5 rounded-lg transition-all relative ${
                          active
                            ? 'bg-[#1a2332]'
                            : 'hover:bg-[#182235]/60'
                        }`}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <span className="absolute left-1 top-2 bottom-2 w-[3px] rounded-full bg-[#00a859]" />
                        )}

                        {/* Status icon */}
                        <span className="flex-shrink-0">
                          {done ? (
                            <CheckCircle2 className="w-[15px] h-[15px] text-[#00a859]" />
                          ) : (
                            <Circle className={`w-[15px] h-[15px] ${
                              active ? 'text-[#00a859]' : 'text-[#3d4a63]'
                            }`} />
                          )}
                        </span>

                        {/* Lecture number */}
                        <span className={`text-[10px] font-mono w-5 text-right flex-shrink-0 ${
                          active ? 'text-[#00a859]' : 'text-[#4d5a73]'
                        }`}>
                          {lectureIdx + 1}.
                        </span>

                        {/* Lecture info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12.5px] leading-snug truncate ${
                            active
                              ? 'text-[#f3f6ff] font-semibold'
                              : done
                              ? 'text-[#6e7a94]'
                              : 'text-[#c4cad6]'
                          }`}>
                            {lecture.title}
                          </p>
                        </div>

                        {/* Right side: duration + quiz badge */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {lecture.hasQuiz && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#00a859]/10 border border-[#00a859]/20">
                              <ClipboardCheck className="w-2.5 h-2.5 text-[#00a859]" />
                              <span className="text-[9px] font-bold text-[#00a859]">Quiz</span>
                            </span>
                          )}
                          <span className={`text-[10px] tabular-nums ${
                            active ? 'text-[#9aa5bf]' : 'text-[#4d5a73]'
                          }`}>
                            {lecture.duration}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
          fixed top-14 bottom-0 left-0 z-50 w-full sm:w-80 bg-[#0f1520] border-r border-[#263248]
          flex flex-col transition-transform duration-300
          md:relative md:top-0 md:translate-x-0 md:w-80 md:flex-shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'md:hidden' : ''}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#263248] md:hidden">
          <h2 className="text-xs font-bold text-[#f3f6ff] uppercase tracking-widest">
            Course Contents
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
