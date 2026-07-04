import React, { useCallback, useEffect, useRef } from 'react';
import { TerminalSquare, PanelLeft, PanelRight, ExternalLink, RotateCcw, X } from 'lucide-react';
import CourseTerminal, { type CourseTerminalHandle } from './CourseTerminal';
import { confirmDialog } from '../ui/ConfirmHost';
import { useLang } from '../../contexts/LangContext';

export type DockSide = 'left' | 'right';

const MIN_W = 300;
const MAX_W = 860;

interface TerminalDockProps {
  user: string;
  /** Physical side of the viewport the panel sits on (works in LTR and RTL). */
  side: DockSide;
  width: number;
  onSide: (side: DockSide) => void;
  onWidth: (width: number) => void;
  onClose: () => void;
  onPopOut: () => void;
}

/**
 * A resizable terminal panel that lives *in the page flow* beside the course
 * content — it pushes the lesson aside rather than covering it. It can dock to
 * the left or right edge and mirrors correctly under RTL.
 */
const TerminalDock: React.FC<TerminalDockProps> = ({ user, side, width, onSide, onWidth, onClose, onPopOut }) => {
  const { isArabic } = useLang();
  const dragging = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<CourseTerminalHandle>(null);

  const physicalLeft = side === 'left';
  // Flex `order` that pins the panel to `side` regardless of the row's direction.
  const order = physicalLeft !== isArabic ? -1 : 1;

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: 'Reset terminal?',
      message: 'This clears the sandbox filesystem, variables, and history back to the starting state.',
      confirmLabel: 'Reset',
    });
    if (ok) termRef.current?.reset();
  };

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Width measured from the panel's outer (viewport-facing) edge to the pointer.
      const w = physicalLeft ? e.clientX - rect.left : rect.right - e.clientX;
      onWidth(Math.max(MIN_W, Math.min(MAX_W, w)));
    },
    [physicalLeft, onWidth]
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
      ref={panelRef}
      className="relative flex h-full flex-shrink-0 flex-col border-[#263248] bg-[#0a0e14] shadow-2xl shadow-black/40"
      style={{
        width,
        order,
        borderRightWidth: physicalLeft ? 1 : 0,
        borderLeftWidth: physicalLeft ? 0 : 1,
      }}
    >
      {/* Resize handle on the inner edge (the one facing the lesson content) */}
      <div
        onPointerDown={startResize}
        className="absolute top-0 bottom-0 z-10 w-1.5 cursor-col-resize hover:bg-[#00a859]/40"
        style={physicalLeft ? { right: -3 } : { left: -3 }}
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
          <button className={btn} title="Reset sandbox" aria-label="Reset sandbox" onClick={handleReset}>
            <RotateCcw size={14} />
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
        <CourseTerminal ref={termRef} user={user} onExit={onClose} />
      </div>
    </div>
  );
};

export default TerminalDock;
