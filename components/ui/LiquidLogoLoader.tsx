import React from 'react';

interface LiquidLogoLoaderProps {
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
}

/**
 * The CyberKhana mark, animated as if it were a glass being filled with green
 * liquid — a rising, waving level that loops. Used as the app's loading state
 * and as the terminal's boot splash. The logo PNG is used as a luminance mask
 * (white glyph shows, dark badge is hidden), so the liquid only fills the mark.
 */
const LiquidLogoLoader: React.FC<LiquidLogoLoaderProps> = ({ size = 96, className = '' }) => {
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
      style={{ filter: 'drop-shadow(0 0 14px rgba(0,199,102,0.35))' }}
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
        <g className="liquid-rise">
          {/* darker back wave for depth */}
          <path
            className="liquid-wave-slow"
            d="M-40,30 q20,7 40,0 t40,0 t40,0 t40,0 t40,0 L160,320 L-40,320 Z"
            fill="#0b7a45"
            opacity="0.85"
          />
          {/* bright front wave (the surface) */}
          <path
            className="liquid-wave"
            d="M-40,26 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 L160,320 L-40,320 Z"
            fill={`url(#${gradId})`}
          />
          {/* thin highlight line riding the surface */}
          <path
            className="liquid-wave"
            d="M-40,26 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0"
            fill="none"
            stroke="#b6ffd4"
            strokeWidth="1.4"
            opacity="0.55"
          />
        </g>

        {/* Rising bubbles */}
        <circle className="liquid-bubble" cx="46" cy="86" r="2.4" fill="#c9ffe1" style={{ animationDelay: '0.2s' }} />
        <circle className="liquid-bubble" cx="70" cy="90" r="1.8" fill="#c9ffe1" style={{ animationDelay: '1.1s' }} />
        <circle className="liquid-bubble" cx="60" cy="82" r="1.4" fill="#c9ffe1" style={{ animationDelay: '1.9s' }} />
      </g>
    </svg>
  );
};

/** Full-screen centered loader — drop-in replacement for a spinner fallback. */
export const FullscreenLiquidLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0d1117]">
    <LiquidLogoLoader size={104} />
    {label ? <p className="text-sm tracking-wide text-[#6e7a94]">{label}</p> : null}
  </div>
);

export default LiquidLogoLoader;
