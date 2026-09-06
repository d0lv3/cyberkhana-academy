/* ─── Landing shell ───
 *
 * One width for every band on the landing page.
 *
 * They used to disagree: the nav and the hero ran to 1280px, the features,
 * the preview and the footer to 1152, the stats band to 1024. Stacked, that
 * is a ragged left and right edge down the whole page, which is invisible on
 * a laptop (where the window is narrower than any of them) and impossible to
 * miss on a large monitor, where all three limits are visible at once.
 *
 * The step at 2xl is for those monitors specifically. A 27in screen is wide
 * enough that a 1280px column reads as a narrow strip down the middle, so the
 * page is allowed a little more room before it stops growing. It does stop:
 * body text that runs the full width of a 27in display is not readable, it is
 * just wide.
 */
export const SHELL = 'mx-auto w-full max-w-7xl 2xl:max-w-[90rem]';
