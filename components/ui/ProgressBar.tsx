import React, { useLayoutEffect, useRef, useState } from 'react';

/* ─── Progress ───
 *
 * The module bar: a slanted track cut into a strip of triangles that light up
 * as you go. Used on a module's own page and inside the module viewer, and
 * deliberately not elsewhere, so that a path, a dashboard tile and a module do
 * not all shout in the same voice. Every part of the shape comes off two
 * numbers, the height and the triangle base, so a bar reads the same whether it
 * is 90px wide in a sidebar or 400px wide on a module page.
 *
 * It is drawn in SVG against a measured width rather than in CSS, because the
 * triangles have to stay the same size as the bar grows: a percentage-based
 * pattern would stretch them, and stretched triangles are what make a repeated
 * motif look like a mistake. A ResizeObserver keeps that measurement honest
 * through sidebar collapses and window resizes.
 *
 * The slant of the two ends is not decoration for its own sake: it is the same
 * angle as one family of diagonals, which is what makes the ends read as part
 * of the pattern rather than as a box drawn around it. The filled/unfilled
 * boundary is cut on that angle too.
 */

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'green' | 'neon' | 'blue' | 'gold';
  /** Render the percentage beside the bar, on its trailing end. */
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FILL: Record<NonNullable<ProgressBarProps['color']>, string> = {
  green: '#00a859',
  neon: '#9fef00',
  blue: '#60a5fa',
  gold: '#f3a43a',
};

/** Bar height, the gap the separators cut, and the label beside it. */
const SIZES = {
  sm: { h: 11, stroke: 1.6, label: 'text-[10px]' },
  md: { h: 16, stroke: 2.2, label: 'text-xs' },
  lg: { h: 22, stroke: 2.8, label: 'text-sm' },
} as const;

/** Triangles are a shade wider than they are tall, as in the reference art. */
const BASE_RATIO = 1.35;

/** The unlit track, and the dark the separators and the outline are cut in. */
const TRACK = '#101725';
const CUT = '#0a0f18';

/** The shape of a bar, given a width, a height and a percentage. */
function progressShapes(w: number, h: number, pct: number) {
  const base = h * BASE_RATIO;
  const slant = base / 2;
  /* The bottom edge is the short one, and it is what the fill sweeps along. */
  const span = Math.max(0, w - slant);
  const fx = (span * Math.max(0, Math.min(pct, 100))) / 100;

  /* Separators: one zigzag between the two edges, its corners alternating top
     and bottom half a triangle apart. It runs past both ends so that, once
     clipped, the first and last shapes are cut by the slant rather than
     stopping short of it. */
  const zig: string[] = [];
  for (let k = -1; slant + k * base <= w + base; k += 1) {
    zig.push(`${slant + k * base},0`, `${(k + 1) * base},${h}`);
  }

  return {
    outline: `${slant},0 ${w},0 ${w - slant},${h} 0,${h}`,
    fill: `${slant},0 ${slant + fx},0 ${fx},${h} 0,${h}`,
    zig: zig.join(' '),
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  color = 'green',
  showLabel = false,
  size = 'md',
}) => {
  const pct = Math.max(0, Math.min(Math.round((value / max) * 100), 100));
  const { h, stroke, label } = SIZES[size];

  const hostRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setW(el.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { outline, fill, zig } = progressShapes(w, h, pct);
  const clipId = React.useId();

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`} dir="ltr">
      <div ref={hostRef} className="min-w-0 flex-1">
        {w > 0 && (
          <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className="block overflow-visible"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <defs>
              <clipPath id={clipId}>
                <polygon points={outline} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <polygon points={outline} fill={TRACK} />
              <polygon points={fill} fill={FILL[color]} />
              <polyline
                points={zig}
                fill="none"
                stroke={CUT}
                strokeWidth={stroke}
                strokeLinejoin="round"
              />
            </g>
            {/* Drawn outside the clip and at double weight, so half of it sits
                on the shape and the corners come back rounded. */}
            <polygon
              points={outline}
              fill="none"
              stroke={CUT}
              strokeWidth={stroke * 2}
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {showLabel && (
        <span className={`flex-shrink-0 font-bold tabular-nums ${label}`} style={{ color: FILL[color] }}>
          {pct}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
