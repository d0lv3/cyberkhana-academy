import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import MobileSheet from './ui/MobileSheet';
import { LogOut, X } from 'lucide-react';
import {
  DashboardIcon,
  FundamentalsIcon,
  ModulesIcon,
  PathsIcon,
  LeaderboardIcon,
  StudioIcon,
  ProfileIcon,
  MembersIcon,
  MoreIcon,
  type NavIconProps,
} from './ui/NavIcons';
import LevelEmblem from './levels/LevelEmblem';
import { levelColor } from './ui/LevelBadge';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { useXp } from '../services/xpService';

/* ─── The phone's navigation ───
 *
 * A bar across the bottom of the screen, four destinations and a More sheet,
 * in place of the drawer that used to slide out from behind a menu button.
 *
 * The drawer cost two taps for every move — open it, then choose — and while
 * it was shut the app showed nothing at all about where you were. It also put
 * the only way to navigate in the top corner, which is the one part of a tall
 * phone a thumb cannot reach while holding it. A bar at the bottom is one tap,
 * always visible, always in reach, and it answers "where am I" without being
 * asked.
 *
 * Which four is not an arbitrary pick. The tour walks a new member through
 * Dashboard, Fundamentals, Modules and Paths, one lit row at a time, and each
 * of those steps waits for the row itself to be clicked. Those four rows are
 * the ones the product already treats as the way in, so they are the four that
 * are always on screen — and the tour needs no help to find them on a phone.
 *
 * Everything else lives in the More sheet, which the bar's fifth cell opens.
 * The bar is chrome, so it stays below every prompt and dialog in the app
 * (z-40, against z-60 and up); the sheet sits above the bar and the header
 * (z-50) but still below them.
 */

interface NavItem {
  to: string;
  icon: React.FC<NavIconProps>;
  label: string;
  /** Shorter wording for the bar, where a cell is a fifth of a phone. */
  short?: string;
  /** Matches the sidebar's, so a tour step finds whichever one is on screen. */
  tour: string;
}

/* How far a route has to match for its tab to light up. A section and
   everything under it counts as that section: a module's page is still
   Modules. */
const holds = (pathname: string, to: string): boolean =>
  pathname === to || pathname.startsWith(`${to}/`);

const MobileNav: React.FC = () => {
  const { t, lang } = useLang();
  const { user, logout } = useAuth();
  const { xp, level } = useXp();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const ar = lang === 'ar';
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  const primary: NavItem[] = [
    {
      to: '/dashboard',
      icon: DashboardIcon,
      label: t('sidebar.dashboard'),
      short: ar ? 'الرئيسية' : 'Home',
      tour: 'nav-dashboard',
    },
    {
      to: '/fundamentals',
      icon: FundamentalsIcon,
      label: t('sidebar.fundamentals'),
      short: ar ? undefined : 'Basics',
      tour: 'nav-fundamentals',
    },
    { to: '/modules', icon: ModulesIcon, label: t('sidebar.modules'), tour: 'nav-modules' },
    { to: '/paths', icon: PathsIcon, label: t('sidebar.paths'), tour: 'nav-paths' },
  ];

  const overflow: NavItem[] = [
    { to: '/leaderboard', icon: LeaderboardIcon, label: t('sidebar.leaderboard'), tour: 'nav-leaderboard' },
    { to: '/profile', icon: ProfileIcon, label: t('sidebar.profile'), tour: 'nav-profile' },
    ...(isCreator
      ? [
          {
            to: '/creators',
            icon: StudioIcon,
            label: ar ? 'استوديو المحتوى' : 'Content Studio',
            tour: 'nav-creators',
          },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          {
            to: '/admin/members',
            icon: MembersIcon,
            label: ar ? 'الأعضاء' : 'Members',
            tour: 'nav-members',
          },
        ]
      : []),
  ];

  /* Choosing something closes the sheet. Watching the route rather than the
     click covers every way out of it, including the browser's back button. */
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  /* More is the current tab whenever the page you are on came out of it, so
     the bar is never showing nothing selected. */
  const moreIsCurrent = moreOpen || overflow.some((item) => holds(pathname, item.to));

  /* The desktop column's signature, carried over: the place you are is a
     solid green tile with its glyph in dark ink, and everything else is quiet.
     Along the bar the tile is wider than it is tall, so it reads at a glance
     without making the bar any taller; in the sheet it is the column's own. */
  const tile = (Icon: React.FC<NavIconProps>, active: boolean, shape: 'bar' | 'row') => (
    <span
      className={`flex flex-shrink-0 items-center justify-center transition-colors ${
        shape === 'bar' ? 'h-7 w-11 rounded-[10px]' : 'h-[34px] w-[34px] rounded-[11px]'
      } ${active ? 'bg-[#00a859] text-[#04140c]' : shape === 'row' ? 'text-[#7f8ca8]' : ''}`}
    >
      <Icon size={20} active={active} />
    </span>
  );

  return (
    <>
      {/* ── More ── */}
      <MobileSheet open={moreOpen} onClose={() => setMoreOpen(false)} label={ar ? 'المزيد' : 'More'}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-[#f3f6ff]">{ar ? 'المزيد' : 'More'}</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={ar ? 'إغلاق' : 'Close'}
                className="-me-2 flex min-h-tap min-w-tap items-center justify-center rounded-lg text-[#8592ad] hover:text-[#d2d7e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Where you are up to. It has nowhere else to be on a phone: the
                header's copy of it is hidden below sm, and the column that
                carries it is a desktop thing. */}
            {user && (
              <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-[#263248] bg-[#121a2a] px-3 py-2.5">
                <LevelEmblem
                  level={level.level}
                  lang={lang}
                  decorative
                  eager
                  className="h-9 w-9 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#d2d7e3]">
                    {user.displayName}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[10px] font-bold"
                    style={{ color: levelColor(level.level) }}
                  >
                    <span dir="ltr" className="font-mono">
                      {level.level.hex}
                    </span>
                    <span className="truncate">{level.level.name[lang]}</span>
                  </p>
                  <div
                    className="mt-1 h-1 overflow-hidden rounded-full bg-[#0a0f18]"
                    dir="ltr"
                    title={
                      level.next
                        ? `${xp.toLocaleString('en-US')} / ${level.next.minXp.toLocaleString('en-US')} XP`
                        : `${xp.toLocaleString('en-US')} XP`
                    }
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round(level.fraction * 100)}%`,
                        backgroundColor: levelColor(level.level),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <nav className="px-2 pb-3" aria-label={ar ? 'المزيد' : 'More'}>
              {overflow.map(({ to, icon: Icon, label, tour }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  data-tour-id={tour}
                  className={({ isActive }) =>
                    [
                      'flex min-h-tap items-center gap-3 rounded-xl ps-2 pe-3 text-sm transition-colors select-none',
                      isActive
                        ? 'bg-[#101826] font-semibold text-[#f3f6ff]'
                        : 'font-medium text-[#9aa5bf] hover:bg-[#0f1622] hover:text-[#e3e8f4]',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {tile(Icon, isActive, 'row')}
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              <button
                type="button"
                onClick={logout}
                className="flex w-full min-h-tap items-center gap-3 rounded-xl ps-2 pe-3 text-sm font-semibold text-red-400 transition-colors select-none hover:bg-red-500/10"
              >
                {/* In a box the size of the tiles above, so the labels line up. */}
                <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center">
                  <LogOut size={18} className="rtl-flip" />
                </span>
                <span className="truncate">{ar ? 'تسجيل الخروج' : 'Log out'}</span>
              </button>
            </nav>
      </MobileSheet>

      {/* ── The bar ── */}
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#1e293b] bg-[#0d1117]/95 pb-safe backdrop-blur-md md:hidden"
        aria-label={ar ? 'التنقل الرئيسي' : 'Primary'}
      >
        <div className="grid grid-cols-5">
          {primary.map(({ to, icon: Icon, label, short, tour }) => (
            <NavLink
              key={to}
              to={to}
              data-tour-id={tour}
              aria-label={label}
              className={({ isActive }) =>
                [
                  'relative flex min-h-tap flex-col items-center justify-center gap-1 px-0.5 py-2',
                  'text-[10px] font-semibold leading-none transition-colors select-none',
                  isActive ? 'text-[#f3f6ff]' : 'text-[#8592ad]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* The desktop column marks the chosen row with a rule down
                      its leading edge. Along a bar, that edge is the top. */}
                  {isActive && (
                    <span aria-hidden className="absolute inset-x-0 top-0 mx-auto h-[3px] w-7 rounded-b-full bg-[#9fef00]" />
                  )}
                  {tile(Icon, isActive, 'bar')}
                  <span className="max-w-full truncate">{short ?? label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-label={ar ? 'المزيد' : 'More'}
            className={[
              'relative flex min-h-tap flex-col items-center justify-center gap-1 px-0.5 py-2',
              'text-[10px] font-semibold leading-none transition-colors select-none',
              moreIsCurrent ? 'text-[#f3f6ff]' : 'text-[#8592ad]',
            ].join(' ')}
          >
            {moreIsCurrent && (
              <span aria-hidden className="absolute inset-x-0 top-0 mx-auto h-[3px] w-7 rounded-b-full bg-[#9fef00]" />
            )}
            {tile(MoreIcon, moreIsCurrent, 'bar')}
            <span className="max-w-full truncate">{ar ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
