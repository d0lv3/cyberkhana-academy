import React from 'react';
import { motion } from 'framer-motion';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

interface PacketAnimationProps {
  /** Route waypoints (SVG coords) — straight line = 2 points, elbow = 4 */
  points: { x: number; y: number }[];
  label: string;
  color: string;
  sublabel?: string;
  /** Duration in seconds */
  duration?: number;
  /** Delay before starting (seconds) */
  delay?: number;
  onComplete?: () => void;
}

/** Darken a hex colour so light text/pills keep contrast. */
function darken(hex: string, amount = 0.78): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return '#06121a';
  const r = Math.round(parseInt(m.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(m.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(m.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Cumulative-distance keyframe times so speed stays constant along the route. */
function routeTimes(points: { x: number; y: number }[]): number[] {
  const dists: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    dists.push(total);
  }
  if (total === 0) return points.map((_, i) => i / Math.max(1, points.length - 1));
  return dists.map((d) => d / total);
}

/**
 * A packet that travels along its connection route as a bright capsule.
 * Label rides inside the capsule in high-contrast ink; the src/dst sublabel
 * trails below in mono.
 */
const PacketAnimation: React.FC<PacketAnimationProps> = ({
  points,
  label,
  color,
  sublabel,
  duration = 1.5,
  delay = 0,
  onComplete,
}) => {
  const pillH = 27;
  const pillW = Math.max(label.length * 8.4 + 30, 80);
  const r = pillH / 2;
  const ink = darken(color, 0.82);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const times = routeTimes(points);

  return (
    <motion.g
      initial={{ x: xs[0], y: ys[0], opacity: 0, scale: 0.55 }}
      animate={{
        x: xs,
        y: ys,
        opacity: [0, 1, 1, 0],
        scale: [0.55, 1, 1, 0.92],
      }}
      transition={{
        x: { duration, delay, times, ease: 'easeInOut' },
        y: { duration, delay, times, ease: 'easeInOut' },
        opacity: { duration, delay, times: [0, 0.12, 0.88, 1] },
        scale: { duration, delay, times: [0, 0.12, 0.88, 1] },
      }}
      onAnimationComplete={onComplete}
    >
      {/* Soft travelling glow */}
      <rect
        x={-pillW / 2 - 5}
        y={-r - 5}
        width={pillW + 10}
        height={pillH + 10}
        rx={r + 5}
        fill={color}
        opacity={0.3}
        filter="url(#edge-glow)"
      />

      {/* Solid capsule */}
      <rect x={-pillW / 2} y={-r} width={pillW} height={pillH} rx={r} fill={color} />
      {/* Glossy top highlight */}
      <rect
        x={-pillW / 2 + 3}
        y={-r + 2.5}
        width={pillW - 6}
        height={r - 1}
        rx={r - 3}
        fill="#ffffff"
        opacity={0.16}
      />

      {/* Label */}
      <text
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={ink}
        fontSize={13.5}
        fontWeight={800}
        fontFamily="'Poppins', sans-serif"
        letterSpacing="0.2"
      >
        {label}
      </text>

      {/* Sublabel (src/dst) below the capsule */}
      {sublabel && (
        <>
          <rect
            x={-(sublabel.length * 3.6) - 8}
            y={r + 5}
            width={sublabel.length * 7.2 + 16}
            height={17}
            rx={4}
            fill="#0b1019"
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={0.8}
          />
          <text
            y={r + 16.5}
            textAnchor="middle"
            fill="#9aa7c0"
            fontSize={9.5}
            fontFamily={MONO}
            fontWeight={600}
          >
            {sublabel}
          </text>
        </>
      )}
    </motion.g>
  );
};

export default PacketAnimation;
