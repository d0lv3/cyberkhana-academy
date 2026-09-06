import React, { useMemo } from 'react';

/* ─── Star field ───
 *
 * The faint depth behind a page that is meant to read as a place rather than a
 * document. It fills whatever box it is dropped into, so a page can carry one
 * sky from edge to edge instead of each panel drawing its own patch of one.
 *
 * Positions are percentages and sizes are pixels, which is the whole reason
 * this is not an SVG: an SVG stretched to a tall page turns every star into an
 * ellipse, and one drawn at a fixed aspect leaves bands with no stars in them.
 *
 * The scatter is seeded rather than random so it is identical on every render.
 * Stars that reshuffle when a sidebar collapses read as a glitch, and the same
 * seed also means the server and the client agree on where they are.
 */

/** Deterministic PRNG, so the scatter is stable across renders. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarFieldProps {
  /** How many stars to scatter. Density, in practice. */
  count?: number;
  /** Change it to get a different sky; keep it to get the same one back. */
  seed?: number;
  className?: string;
}

const StarField: React.FC<StarFieldProps> = ({ count = 110, seed = 20240703, className = '' }) => {
  const stars = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: 1 + rand() * 1.7,
      opacity: 0.14 + rand() * 0.38,
    }));
  }, [count, seed]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#4a5d82]"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default StarField;
