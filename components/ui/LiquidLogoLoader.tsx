import React from 'react';

interface LiquidLogoLoaderProps {
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
  /** One-shot fill (empty → full, then holds) instead of the endless loop. */
  fill?: boolean;
  /** Duration of the one-shot fill in ms (only used when `fill`). */
  fillMs?: number;
}

/* ── Wave geometry ──
 *
 * The surface is a run of alternating humps that scrolls sideways, and two
 * numbers have to agree about it.
 *
 * The scroll distance must be a whole number of humps, or the pattern jumps
 * when it resets. One up and one down is the period, so that is 80.
 *
 * And the path has to be wider than the mark by at least the distance it
 * travels, on the side it travels toward. It was not: it ran from -40 to 160,
 * 200 wide, and slid 80 to the left, so by the end of every cycle it covered
 * only as far as x=80 and the last 40 units of a 120 wide mark held no liquid
 * at all. The fill drained off the right of the logo and snapped back, once
 * every 2.1 seconds, and it was worst exactly when the mark was fullest,
 * because that is where the mark is widest.
 */
const HUMP = 40;
const PERIOD = HUMP * 2;
/** A hump of slack on the trailing side, and the travel plus a hump on the leading one. */
const WAVE_FROM = -HUMP;
const WAVE_TO = 120 + PERIOD + HUMP;
const HUMPS = (WAVE_TO - WAVE_FROM) / HUMP;

/** The surface line: one quadratic hump, then reflections of it all the way. */
const surface = (y: number, lift: number): string =>
  `M${WAVE_FROM},${y} q${HUMP / 2},${lift} ${HUMP},0${` t${HUMP},0`.repeat(HUMPS - 1)}`;

/** The same line, closed into the body of liquid hanging below it. */
const body = (y: number, lift: number): string =>
  `${surface(y, lift)} L${WAVE_TO},320 L${WAVE_FROM},320 Z`;

/**
 * The CyberKhana mark, animated as if it were a glass being filled with green
 * liquid — a rising, waving level that loops. Used as the app's loading state
 * and as the terminal's boot splash. The logo PNG is used as a luminance mask
 * (white glyph shows, dark badge is hidden), so the liquid only fills the mark.
 */
const LiquidLogoLoader: React.FC<LiquidLogoLoaderProps> = ({ size = 96, className = '', fill = false, fillMs = 900 }) => {
  // Unique ids so multiple loaders on one page don't collide.
  const uid = React.useId().replace(/:/g, '');
  const maskId = `ckliq-mask-${uid}`;
  const gradId = `ckliq-grad-${uid}`;
  const glassId = `ckliq-glass-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Loading"
      style={{ filter: 'drop-shadow(0 0 14px rgba(0,199,102,0.35))', ['--fill-dur' as string]: `${fillMs}ms` }}
    >
      <defs>
        <mask id={maskId}>
          {/* White glyph on dark badge → luminance mask = just the mark */}
          <image
            href="/assets/brand/cyberkhana-icon-512.png"
            x="0"
            y="0"
            width="120"
            height="120"
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cf59a" />
          <stop offset="55%" stopColor="#00c766" />
          <stop offset="100%" stopColor="#008a47" />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2c22" />
          <stop offset="100%" stopColor="#0f1c16" />
        </linearGradient>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Empty "glass" — the un-filled mark */}
        <rect x="0" y="0" width="120" height="120" fill={`url(#${glassId})`} />

        {/* Rising liquid level */}
        <g className={fill ? 'liquid-fill' : 'liquid-rise'}>
          {/* darker back wave for depth, leading with a trough so the two
              surfaces never move as one sheet */}
          <path className="liquid-wave-slow" d={body(30, 7)} fill="#0b7a45" opacity="0.85" />
          {/* bright front wave (the surface) */}
          <path className="liquid-wave" d={body(26, -6)} fill={`url(#${gradId})`} />
          {/* thin highlight line riding the surface */}
          <path
            className="liquid-wave"
            d={surface(26, -6)}
            fill="none"
            stroke="#b6ffd4"
            strokeWidth="1.4"
            opacity="0.55"
          />

          {/* Rising bubbles. Inside the liquid, not beside it: they used to sit
              at a fixed height in the mark while the level moved past them, so
              for most of the loop they were rising through an empty glass. They
              now travel with the level and stay under the surface. */}
          <circle className="liquid-bubble" cx="46" cy="86" r="2.4" fill="#c9ffe1" style={{ animationDelay: '0.2s' }} />
          <circle className="liquid-bubble" cx="70" cy="90" r="1.8" fill="#c9ffe1" style={{ animationDelay: '1.1s' }} />
          <circle className="liquid-bubble" cx="60" cy="82" r="1.4" fill="#c9ffe1" style={{ animationDelay: '1.9s' }} />
        </g>
      </g>
    </svg>
  );
};

/** Full-screen centered loader — drop-in replacement for a spinner fallback. */
export const FullscreenLiquidLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0d1117]">
    <LiquidLogoLoader size={104} />
    {label ? <p className="text-sm tracking-wide text-[#8592ad]">{label}</p> : null}
  </div>
);

export default LiquidLogoLoader;
