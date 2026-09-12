import React from 'react';

interface PathsIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
  /** Solid checkpoints and target centres for the selected state. */
  filled?: boolean;
}

/** A winding learning route with distinct selected and unselected states. */
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
      {/* The line meets each target behind its ring, so the whole mark reads as
          one continuous route even at the sidebar's smallest size. */}
      <path
        d="M14.5 4.5h-9a3.75 3.75 0 0 0 0 7.5h13a3.75 3.75 0 0 1 0 7.5h-9"
        fill="none"
        stroke="currentColor"
        strokeWidth={filled ? 2.15 : 1.7}
        strokeLinecap="round"
      />

      {/* Checkpoints along the two bends and the middle stretch. */}
      <circle
        cx="1.75"
        cy="8.25"
        r="1.25"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle
        cx="11.5"
        cy="12"
        r="1.25"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle
        cx="22.25"
        cy="15.75"
        r="1.25"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.35"
      />

      {/* Target endpoints echo the supplied reference. */}
      <circle
        cx="18"
        cy="4.5"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={filled ? 1.8 : 1.4}
      />
      <circle
        cx="18"
        cy="4.5"
        r="1.35"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle
        cx="6"
        cy="19.5"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={filled ? 1.8 : 1.4}
      />
      <circle
        cx="6"
        cy="19.5"
        r="1.35"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </svg>
  );
};

export default PathsIcon;
