import type { CSSProperties } from 'react';

/* ─── Page skies ───
 *
 * The ground, glow and stars behind a route that is a place rather than a page
 * of documents.
 *
 * All of it is expressed as the background of the scroll container, not as
 * layers drawn inside the page, and that is the whole point. A page's own box
 * stops at the layout's padding and again at the content's max width, so a
 * background painted inside one ends in visible seams the moment the window is
 * wider than that, and it paints over the sidebar's collapse handle where that
 * overhangs the content area. A background cannot do either: it covers every
 * pixel of the element however far it scrolls, and it is behind everything by
 * definition.
 *
 * It also sidesteps the trap that a layer positioned inside a scroll container
 * cannot get out of. `absolute` sizes to the visible box and scrolls off the
 * top of a long page; `sticky` is clamped to its containing block, so a
 * negative margin meant to reach into the container's padding is simply
 * ignored. A background has none of those constraints.
 */

/** Deterministic PRNG, so the scatter is the same on every render and reload. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Big enough that the repeat is not legible at these dot sizes. */
const TILE = 520;

/** One tile of stars, as background layers that repeat across the whole page. */
function starLayers(count = 26, seed = 20240703): string[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const x = Math.round(rand() * TILE);
    const y = Math.round(rand() * TILE);
    const r = (1 + rand() * 1.1).toFixed(2);
    const o = (0.14 + rand() * 0.34).toFixed(2);
    return `radial-gradient(circle at ${x}px ${y}px, rgba(74,93,130,${o}) 0 ${r}px, rgba(74,93,130,0) ${r}px)`;
  });
}

export interface Sky {
  match: RegExp;
  /** Ground colour, as a class on <main> so it can be responsive. */
  ground: string;
  /** Glow layers, in `background-image` syntax. */
  glow: string[];
  stars?: boolean;
  /** Skip the glow below md, where the page is a plain stacked list. */
  desktopOnly?: boolean;
}

export const SKIES: Sky[] = [
  {
    match: /^\/fundamentals\/?$/,
    ground: 'md:bg-[#0a0f18]',
    glow: [
      'radial-gradient(65vw 45vh at 52% -4%, rgba(0,168,89,0.10), transparent 68%)',
      'radial-gradient(45vw 38vh at 6% 62%, rgba(159,239,0,0.045), transparent 66%)',
      'radial-gradient(42vw 35vh at 96% 88%, rgba(96,165,250,0.045), transparent 66%)',
    ],
    desktopOnly: true,
  },
  {
    match: /^\/paths\/[^/]+\/?$/,
    ground: 'bg-[#070a12]',
    glow: [
      'radial-gradient(70vw 60vh at 72% 2%, rgba(0,168,89,0.13), transparent 62%)',
      'radial-gradient(58vw 50vh at 12% 78%, rgba(0,168,89,0.06), transparent 62%)',
      'radial-gradient(46vw 40vh at 44% 44%, rgba(16,185,129,0.05), transparent 62%)',
    ],
    stars: true,
  },
];

/**
 * The style for one sky, handed over as custom properties rather than as the
 * background properties themselves.
 *
 * That indirection is what lets a sky be switched off below a breakpoint. An
 * inline style cannot carry a media query, and answering the question in
 * JavaScript instead means a resize listener, a re-render, and a state that is
 * wrong on the first paint. The values come from here, and `.page-sky` in the
 * stylesheet decides whether to use them.
 *
 * The glow is anchored to the scroll container and does not travel with the
 * content; the stars tile, so they carry on for as long as the page does.
 */
export function skyStyle(sky: Sky): CSSProperties {
  const stars = sky.stars ? starLayers() : [];
  return {
    '--sky-image': [...sky.glow, ...stars].join(', '),
    '--sky-size': [
      ...sky.glow.map(() => 'auto'),
      ...stars.map(() => `${TILE}px ${TILE}px`),
    ].join(', '),
    '--sky-repeat': [
      ...sky.glow.map(() => 'no-repeat'),
      ...stars.map(() => 'repeat'),
    ].join(', '),
  } as CSSProperties;
}

/** Find the sky for a route, if it has one. */
export function skyFor(pathname: string): Sky | undefined {
  return SKIES.find((s) => s.match.test(pathname));
}
