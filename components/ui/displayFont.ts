import type { CSSProperties } from 'react';

/* ─── Display type ───
 *
 * The face for headings and for the labels drawn inside diagrams, in both
 * languages.
 *
 * It has to be picked per language rather than left to font fallback. A stack
 * that names Poppins first does render Arabic, because Poppins carries no
 * Arabic glyphs and the browser falls through to the next family that does,
 * but what it falls through to is decided per glyph and never asked for: the
 * weight the fallback happens to ship, its metrics, its idea of where a line
 * sits. Naming the Arabic face first is the difference between choosing a
 * typeface and being handed one.
 *
 * The tracking matters more than it looks. Arabic is a joined script, and
 * negative letter-spacing pulls letters into each other until the joins break;
 * the tight display tracking that flatters a Latin headline damages an Arabic
 * one. So it is spent on Latin only.
 *
 * SVG needs the family on its own, because a <text> element takes it as an
 * attribute rather than as a style object.
 */

export const DISPLAY_LATIN = "'Poppins', 'IBM Plex Sans Arabic', sans-serif";
export const DISPLAY_ARABIC = "'IBM Plex Sans Arabic', 'Poppins', sans-serif";

/** The display family for a language, for an SVG `font-family` attribute. */
export const displayFamily = (isArabic: boolean): string =>
  isArabic ? DISPLAY_ARABIC : DISPLAY_LATIN;

/**
 * The monospace label face: step numbers, counters, the small capitalised
 * runs. Arabic has no Plex mono to fall back on, so an Arabic label takes the
 * Arabic sans rather than a mono that cannot draw it.
 */
export const labelFamily = (isArabic: boolean): string =>
  isArabic ? DISPLAY_ARABIC : "'JetBrains Mono', 'Consolas', monospace";

/** Letter-spacing for a label, in SVG user units. Arabic keeps its joins. */
export const labelTracking = (isArabic: boolean, latin: number): number =>
  isArabic ? 0 : latin;

/** Display heading style, for a DOM heading. */
export const displayStyle = (isArabic: boolean): CSSProperties => ({
  fontFamily: displayFamily(isArabic),
  letterSpacing: isArabic ? 'normal' : '-0.02em',
});
