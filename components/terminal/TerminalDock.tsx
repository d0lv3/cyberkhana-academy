import React, { useCallback, useEffect, useRef } from 'react';
import { TerminalSquare, PanelLeft, PanelRight, ExternalLink, X } from 'lucide-react';
import CourseTerminal from './CourseTerminal';

export type DockSide = 'left' | 'right';

const MIN_W = 300;
const MAX_W = 860;

interface TerminalDockProps {
  user: string;
  side: DockSide;
  width: number;
  onSide: (side: DockSide) => void;
  onWidth: (width: number) => void;
  onClose: () => void;
  onPopOut: () => void;
}

/**
 * A resizable terminal panel docked to the left or right edge of the viewport,
 * with controls to switch sides, pop out to a new tab, or close.
 */
const TerminalDock: React.FC<TerminalDockProps> = ({ user, side, width, onSide, onWidth, onClose, onPopOut }) => {
  const dragging = useRef(false);

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const w = side === 'right' ? window.innerWidth - e.clientX : e.clientX;
      onWidth(Math.max(MIN_W, Math.min(MAX_W, w)));
    },
    [side, onWidth]
  );
  const stop = useCallback(() => {
    dragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [onMove, stop]);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const btn = 'flex h-7 w-7 items-center justify-center rounded-md text-[#8b98ae] hover:bg-[#1a2332] hover:text-[#e5e9f0] transition-colors';
  const activeBtn = 'flex h-7 w-7 items-center justify-center rounded-md text-[#00c766] bg-[#00a859]/10';

  return (
    <div
      className="fixed top-0 bottom-0 z-40 flex flex-col border-[#263248] bg-[#0a0e14] shadow-2xl shadow-black/50"
      style={{ [side]: 0, width, borderLeftWidth: side === 'right' ? 1 : 0, borderRightWidth: side === 'left' ? 1 : 0 }}
    >
      {/* Resize handle on the inner edge */}
      <div
        onPointerDown={startResize}
        className="absolute top-0 bottom-0 z-10 w-1.5 cursor-col-resize hover:bg-[#00a859]/40"
        style={side === 'right' ? { left: -1 } : { right: -1 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#263248] bg-[#0d1117] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#c9d3e0]">
          <TerminalSquare size={15} className="flex-shrink-0 text-[#00c766]" />
          <span className="truncate" dir="ltr">{user}@cyberkhana</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5" dir="ltr">
          <button className={side === 'left' ? activeBtn : btn} title="Dock left" aria-label="Dock left" onClick={() => onSide('left')}>
            <PanelLeft size={15} />
          </button>
          <button className={side === 'right' ? activeBtn : btn} title="Dock right" aria-label="Dock right" onClick={() => onSide('right')}>
            <PanelRight size={15} />
          </button>
          <button className={btn} title="Open in new tab" aria-label="Open in new tab" onClick={onPopOut}>
            <ExternalLink size={14} />
          </button>
          <button className={btn} title="Close" aria-label="Close terminal" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <CourseTerminal user={user} onExit={onClose} />
      </div>
    </div>
  );
};

export default TerminalDock;
