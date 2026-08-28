import React, { useCallback, useEffect, useRef } from 'react';

type Orientation = 'horizontal' | 'vertical';

interface ResizeHandleProps {
  /**
   * A horizontal bar sits between stacked panels and is dragged up and down; a
   * vertical one sits between side-by-side panels and is dragged across.
   * Defaults to horizontal.
   */
  orientation?: Orientation;
  /** Called with the pixels dragged; positive means the panel after the bar should grow. */
  onResize: (delta: number) => void;
  /** Double-click, or Home, restores the panel's default size. */
  onReset: () => void;
  /** Describes the panel being resized, for screen readers. */
  label: string;
}

const KEYBOARD_STEP_PX = 24;

/**
 * A drag bar that resizes the panel directly after it.
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
 *
 * A vertical bar reads its own computed direction rather than assuming
 * left-to-right. Arabic flips the panels around, so the same pixel of movement
 * has to mean the opposite sign, or the panel would shrink when dragged open.
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({
  orientation = 'horizontal',
  onResize,
  onReset,
  label,
}) => {
  const vertical = orientation === 'vertical';
  const last = useRef(0);
  const stopDrag = useRef<(() => void) | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // A drag left running past unmount would keep resizing a panel that is gone.
  useEffect(() => () => stopDrag.current?.(), []);

  /** +1 when growing the following panel means moving towards the origin. */
  const axisSign = useCallback(() => {
    if (!vertical) return 1; // dragging up grows the panel below
    const dir = barRef.current ? getComputedStyle(barRef.current).direction : 'ltr';
    // LTR: the panel after the bar is on the right, so dragging left grows it.
    // RTL: it is on the left, so dragging right does.
    return dir === 'rtl' ? -1 : 1;
  }, [vertical]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Stops the drag from selecting the text of the panels either side.
      e.preventDefault();
      const axis = axisSign();
      last.current = vertical ? e.clientX : e.clientY;

      const move = (ev: PointerEvent) => {
        const pos = vertical ? ev.clientX : ev.clientY;
        onResize((last.current - pos) * axis);
        last.current = pos;
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
      document.body.style.cursor = vertical ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [axisSign, onResize, vertical]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const grow = vertical ? 'ArrowLeft' : 'ArrowUp';
    const shrink = vertical ? 'ArrowRight' : 'ArrowDown';
    if (e.key === grow) {
      e.preventDefault();
      onResize(KEYBOARD_STEP_PX * axisSign());
    } else if (e.key === shrink) {
      e.preventDefault();
      onResize(-KEYBOARD_STEP_PX * axisSign());
    } else if (e.key === 'Home') {
      e.preventDefault();
      onReset();
    }
  };

  return (
    <div
      ref={barRef}
      role="separator"
      /* The orientation of a separator names the axis it lies along, which is
         the opposite of the axis it is dragged on. */
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      title={`${label}, drag to resize, double-click to reset`}
      /* touch-none stops the browser scrolling the page instead of dragging. */
      className={`group relative flex-shrink-0 touch-none bg-[#0b1019] transition-colors hover:bg-[#132033] focus:bg-[#132033] focus:outline-none ${
        vertical
          ? 'w-1.5 cursor-col-resize border-y border-[#151d2e]'
          : 'h-1.5 cursor-row-resize border-x border-[#151d2e]'
      }`}
    >
      {/* The grip: a short bar, brightening on hover so the handle is findable. */}
      <span
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22304a] transition-colors group-hover:bg-[#00a859] group-focus:bg-[#00a859] ${
          vertical ? 'h-8 w-[2px]' : 'h-[2px] w-8'
        }`}
      />
    </div>
  );
};

export default ResizeHandle;
