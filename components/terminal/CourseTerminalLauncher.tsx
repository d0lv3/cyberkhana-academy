import React, { useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import TerminalDock, { type DockSide } from './TerminalDock';
import { useLang } from '../../contexts/LangContext';
import BrandLogo from '../ui/BrandLogo';

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
  // Cursor spotlight for the open button (same treatment as the Google sign-in card).
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });
  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, active: true });
  };

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
        onMouseMove={onMove}
        onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
        title="Open your practice terminal"
        aria-label="Open your practice terminal"
        className={`fixed bottom-5 z-30 rounded-full p-px shadow-lg shadow-black/40 transition-all duration-300 ${isArabic ? 'left-5' : 'right-5'}`}
        style={{
          background: spot.active
            ? `radial-gradient(120px circle at ${spot.x}% ${spot.y}%, rgba(159,239,0,0.6), rgba(38,50,72,0.65) 70%)`
            : 'rgba(38,50,72,0.65)',
        }}
      >
        <span className="relative flex items-center gap-2.5 overflow-hidden rounded-full bg-[#0d1117]/95 px-4 py-2.5 backdrop-blur-sm">
          {/* inner green glow following the cursor */}
          <span
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: spot.active ? 1 : 0,
              background: `radial-gradient(140px circle at ${spot.x}% ${spot.y}%, rgba(0,168,89,0.18), transparent 65%)`,
            }}
          />
          <BrandLogo variant="mark" className="relative h-5 w-5 object-contain" loading="eager" />
          <span className="relative h-4 w-px bg-[#263248]" aria-hidden />
          <TerminalSquare size={17} className="relative text-[#00c766]" />
        </span>
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
