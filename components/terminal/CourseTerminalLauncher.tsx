import React, { useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import TerminalDock, { type DockSide } from './TerminalDock';
import { useLang } from '../../contexts/LangContext';

const DOCK_KEY = 'academy-shell-dock';

function loadDock(): { side: DockSide; width: number } {
  try {
    const s = JSON.parse(localStorage.getItem(DOCK_KEY) || 'null');
    if (s && (s.side === 'left' || s.side === 'right')) {
      return { side: s.side, width: Math.min(860, Math.max(300, Number(s.width) || 440)) };
    }
  } catch { /* ignore */ }
  return { side: 'right', width: 460 };
}

/**
 * "Terminal" open button + the in-flow dockable terminal panel. Self-contained,
 * so a host page only needs to render `<CourseTerminalLauncher user={firstName} />`
 * *inside its content flex row* — the open panel sits beside the lesson (pushing
 * it aside) rather than floating on top of it.
 */
const CourseTerminalLauncher: React.FC<{ user: string }> = ({ user }) => {
  const { isArabic } = useLang();
  const [open, setOpen] = useState(false);
  const [dock, setDock] = useState(loadDock);

  const save = (side: DockSide, width: number) => {
    setDock({ side, width });
    try { localStorage.setItem(DOCK_KEY, JSON.stringify({ side, width })); } catch { /* quota */ }
  };

  const popOut = () => {
    const base = window.location.href.split('#')[0];
    // No window features → the browser opens a normal new tab, not a popup.
    window.open(`${base}#/terminal`, '_blank');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open your practice terminal"
        className={`fixed bottom-5 z-30 flex items-center gap-2 rounded-full border border-[#00a859]/40 bg-[#0d1117]/95 px-4 py-2.5 text-sm font-semibold text-[#c9d3e0] shadow-lg shadow-black/40 backdrop-blur-sm transition-colors hover:border-[#00a859] hover:text-white ${isArabic ? 'left-5' : 'right-5'}`}
      >
        <TerminalSquare size={16} className="text-[#00c766]" />
        Terminal
      </button>
    );
  }

  return (
    <TerminalDock
      user={user}
      side={dock.side}
      width={dock.width}
      onSide={(s) => save(s, dock.width)}
      onWidth={(w) => save(dock.side, w)}
      onClose={() => setOpen(false)}
      onPopOut={popOut}
    />
  );
};

export default CourseTerminalLauncher;
