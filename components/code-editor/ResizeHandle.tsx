import React, { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  /** Called with the pixels dragged; positive means the panel below should grow. */
  onResize: (deltaY: number) => void;
  /** Double-click, or Home, restores the panel's default height. */
  onReset: () => void;
  /** Describes the panel being resized, for screen readers. */
  label: string;
}

const KEYBOARD_STEP_PX = 24;

/**
 * A drag bar that resizes the panel directly beneath it.
 *
 * Pointer events rather than mouse events, so a finger on a phone drags it as
 * well as a mouse does. The move and release listeners live on the window,
 * not the bar: a 6px target is left behind the moment the drag gets going, and
 * the pointer has to be followed wherever it goes — including outside the
 * browser window, which is where a release would otherwise be missed and leave
 * the bar stuck to the cursor.
 *
 * It is also a real `separator` widget: focusable, and movable with the arrow
 * keys, because a control that only answers to dragging is unusable to anyone
 * working from the keyboard.
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, onReset, label }) => {
  const lastY = useRef(0);
  const stopDrag = useRef<(() => void) | null>(null);

  // A drag left running past unmount would keep resizing a panel that is gone.
  useEffect(() => () => stopDrag.current?.(), []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Stops the drag from selecting the text of the panels either side.
      e.preventDefault();
      lastY.current = e.clientY;

      const move = (ev: PointerEvent) => {
        // Dragging upwards gives the panel below more room, so the delta inverts.
        onResize(lastY.current - ev.clientY);
        lastY.current = ev.clientY;
      };
      const end = () => stopDrag.current?.();

      stopDrag.current = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
        stopDrag.current = null;
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      // Hold the resize cursor even when the pointer strays off the thin bar.
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [onResize]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onResize(KEYBOARD_STEP_PX);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onResize(-KEYBOARD_STEP_PX);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onReset();
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      title={`${label} — drag to resize, double-click to reset`}
      /* touch-none stops the browser scrolling the page instead of dragging. */
      className="group relative h-1.5 flex-shrink-0 cursor-row-resize touch-none border-x border-[#151d2e] bg-[#0b1019] transition-colors hover:bg-[#132033] focus:bg-[#132033] focus:outline-none"
    >
      {/* The grip: a short bar, brightening on hover so the handle is findable. */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22304a] transition-colors group-hover:bg-[#00a859] group-focus:bg-[#00a859]" />
    </div>
  );
};

export default ResizeHandle;
