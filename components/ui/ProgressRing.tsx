import React from 'react';

/**
 * A ring that fills clockwise, with whatever belongs in the middle of it.
 *
 * Used for the level emblem on the dashboard and for how far through a course
 * a learner is. The track is always drawn, so an empty ring still reads as a
 * measurement rather than a missing one.
 */
const ProgressRing: React.FC<{
  /** 0 to 100. Anything above is clamped, so a finished course is a full ring. */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ progress, size = 110, stroke = 9, color = '#00a859', className = '', children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(progress, 0), 100) / 100) * c;

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Drawn from the top: the SVG is rotated, not the maths. */}
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2332" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

export default ProgressRing;
