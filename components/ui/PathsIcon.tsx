import React from 'react';

interface PathsIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
  /** Solid waypoints and destination flag for the selected state. */
  filled?: boolean;
}

/** A compact learning-path mark with distinct selected and unselected states. */
const PathsIcon: React.FC<PathsIconProps> = ({
  size = 24,
  filled: filledProp,
  fill = 'none',
  ...props
}) => {
  // Sidebar icons receive their selected state through the same fill prop used
  // by Lucide icons; `filled` also makes the two states available elsewhere.
  const filled = filledProp ?? fill !== 'none';

  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 19.25c0-3.2 6.5-1.85 6.5-5.75s6-2 6-5"
        stroke="currentColor"
        strokeWidth={filled ? 2.35 : 1.85}
        strokeLinecap="round"
      />

      <circle
        cx="4.5"
        cy="19.25"
        r="2.25"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="11"
        cy="13.5"
        r="2"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path d="M17 8.5V3.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M17 3.5h4l-1.35 2L21 7.5h-4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="17"
        cy="8.5"
        r="2"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
};

export default PathsIcon;
