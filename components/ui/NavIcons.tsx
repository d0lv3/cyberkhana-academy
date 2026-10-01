import React from 'react';

/* ─── The navigation's own icons ───
 *
 * One family, drawn for the sidebar and the phone's bar: a 24 unit grid, one stroke weight, round
 * caps and joins. Each glyph is two layers. The LINE layer is the outline. The
 * TONE layer is one closed shape inside it, the part of the picture that
 * matters most: the page you have open, the top of the podium, the place a
 * path leads to.
 *
 * At rest the tone is a faint wash, so every glyph has some weight without
 * shouting. On the selected row it turns solid. That is what lets an icon look
 * "filled" without filling the whole outline, which turns anything drawn from
 * open paths into a blob: a book becomes a lump and a pencil loses its tip.
 */

export interface NavIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
  /** The row this icon sits in is the page being shown. */
  active?: boolean;
}

const REST_TONE = 0.3;
const ACTIVE_TONE = 0.92;

function glyph(name: string, draw: (tone: React.SVGProps<SVGPathElement>) => React.ReactNode) {
  const Icon: React.FC<NavIconProps> = ({ size = 24, active = false, ...props }) => (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {draw({ fill: 'currentColor', stroke: 'none', opacity: active ? ACTIVE_TONE : REST_TONE })}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

/** Dashboard: one panel split into three, the wide column lit. */
export const DashboardIcon = glyph('DashboardIcon', (tone) => (
  <>
    <path {...tone} d="M7.5 3.5h3v17h-3a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M10.5 3.5v17M10.5 10.5h10" />
  </>
));

/** Fundamentals: an open book, the page being read lit. */
export const FundamentalsIcon = glyph('FundamentalsIcon', (tone) => (
  <>
    <path {...tone} d="M12 6.5c1.6-1.35 3.9-2 7-2a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1c-3.1 0-5.4.65-7 2z" />
    <path d="M12 6.5c-1.6-1.35-3.9-2-7-2a1 1 0 0 0-1 1V17a1 1 0 0 0 1 1c3.1 0 5.4.65 7 2 1.6-1.35 3.9-2 7-2a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1c-3.1 0-5.4.65-7 2z" />
    <path d="M12 6.5V20" />
  </>
));

/** Modules: a single unit, seen as a cube, its top face lit. The hexagon it
 *  makes is the shape of the level emblems. */
export const ModulesIcon = glyph('ModulesIcon', (tone) => (
  <>
    <path {...tone} d="M12 2.75l8 4.6L12 12 4 7.35z" />
    <path d="M12 2.75l8 4.6v9.3l-8 4.6-8-4.6v-9.3z" />
    <path d="M4 7.35L12 12l8-4.65M12 12v9.25" />
  </>
));

/** Paths: a route from where you are to where it leads, the destination lit. */
export const PathsIcon = glyph('PathsIcon', (tone) => (
  <>
    <circle {...(tone as React.SVGProps<SVGCircleElement>)} cx="18.4" cy="5" r="2.4" />
    <path d="M7 19h8.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="18.4" cy="5" r="2.4" />
  </>
));

/** Leaderboard: the podium from the top of the board, first place lit. */
export const LeaderboardIcon = glyph('LeaderboardIcon', (tone) => (
  <>
    <path {...tone} d="M9 20.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v15z" />
    <path d="M3.5 20.5v-8A1.5 1.5 0 0 1 5 11h4V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v8h4a1.5 1.5 0 0 1 1.5 1.5v5.5z" />
    <path d="M9 11v9.5M15 13.5v7" />
  </>
));

/** Content Studio: a pencil on the line it is writing, its tip lit. */
export const StudioIcon = glyph('StudioIcon', (tone) => (
  <>
    <path {...tone} d="M4 20l1.3-4.3 3 3z" />
    <path d="M4 20l1.3-4.3L16.2 4.8a2.12 2.12 0 0 1 3 3L8.3 18.7z" />
    <path d="M14 7l3 3M13 20h7.5" />
  </>
));

/** Profile: one person, the face lit. */
export const ProfileIcon = glyph('ProfileIcon', (tone) => (
  <>
    <circle {...(tone as React.SVGProps<SVGCircleElement>)} cx="12" cy="8" r="3.75" />
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.75 20.25c0-3.6 3.2-6 7.25-6s7.25 2.4 7.25 6" />
  </>
));

/** More: the destinations that do not fit on the phone's bar, one of them lit. */
export const MoreIcon = glyph('MoreIcon', (tone) => (
  <>
    <rect {...(tone as React.SVGProps<SVGRectElement>)} x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
    <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
  </>
));

/** Members: the person in front, and one more behind. */
export const MembersIcon = glyph('MembersIcon', (tone) => (
  <>
    <circle {...(tone as React.SVGProps<SVGCircleElement>)} cx="9" cy="8.5" r="3.25" />
    <circle cx="9" cy="8.5" r="3.25" />
    <path d="M2.75 20.25c0-3.2 2.8-5.5 6.25-5.5s6.25 2.3 6.25 5.5" />
    <path d="M15.75 5.4a3.25 3.25 0 0 1 0 6.2M18 15.2c1.95.9 3.25 2.7 3.25 5.05" />
  </>
));
