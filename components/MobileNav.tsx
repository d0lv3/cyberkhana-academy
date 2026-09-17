import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Trophy,
  User,
  Pencil,
  Users,
  MoreHorizontal,
  LogOut,
  X,
} from 'lucide-react';
import PathsIcon from './ui/PathsIcon';
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
  icon: React.ElementType;
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
  const closeRef = useRef<HTMLButtonElement>(null);

  const ar = lang === 'ar';
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  const primary: NavItem[] = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: t('sidebar.dashboard'),
      short: ar ? 'الرئيسية' : 'Home',
      tour: 'nav-dashboard',
    },
    {
      to: '/fundamentals',
      icon: GraduationCap,
      label: t('sidebar.fundamentals'),
      short: ar ? undefined : 'Basics',
      tour: 'nav-fundamentals',
    },
    { to: '/modules', icon: Layers, label: t('sidebar.modules'), tour: 'nav-modules' },
    { to: '/paths', icon: PathsIcon, label: t('sidebar.paths'), tour: 'nav-paths' },
  ];

  const overflow: NavItem[] = [
    { to: '/leaderboard', icon: Trophy, label: t('sidebar.leaderboard'), tour: 'nav-leaderboard' },
    { to: '/profile', icon: User, label: t('sidebar.profile'), tour: 'nav-profile' },
    ...(isCreator
      ? [
          {
            to: '/creators',
            icon: Pencil,
            label: ar ? 'استوديو المحتوى' : 'Content Studio',
            tour: 'nav-creators',
          },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          {
            to: '/admin/members',
            icon: Users,
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

  useEffect(() => {
    if (!moreOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  /* More is the current tab whenever the page you are on came out of it, so
     the bar is never showing nothing selected. */
  const moreIsCurrent = moreOpen || overflow.some((item) => holds(pathname, item.to));

  const rowIcon = (Icon: React.ElementType, active: boolean, size: number) => (
    /* The chosen glyph fills in, the same signature the desktop column uses.
       See Sidebar for why only certain glyphs can live in a navigation that
       does this: filling one built from open paths closes it into a blob. */
    <Icon size={size} fill={active ? 'currentColor' : 'none'} className="flex-shrink-0" />
  );

  return (
    <>
      {/* ── More ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={ar ? 'المزيد' : 'More'}
        >
          {/* The page behind is covered rather than locked. Nothing scrolls
              the document here — the shell is exactly one screen tall and the
              page scrolls inside <main> — so a backdrop that eats the touch
              is the whole of what a scroll lock would have bought. */}
          <button
            type="button"
            aria-label={ar ? 'إغلاق' : 'Close'}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 w-full bg-black/60 backdrop-blur-sm animate-fade-in"
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-[#263248] bg-[#0d1117] pb-safe animate-sheet-rise">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-[#f3f6ff]">{ar ? 'المزيد' : 'More'}</p>
              <button
                ref={closeRef}
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
                  data-tour-id={tour}
                  className={({ isActive }) =>
                    [
                      'flex min-h-tap items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors select-none',
                      isActive
                        ? 'bg-[#00a859]/12 text-[#00a859]'
                        : 'text-[#9aa5bf] hover:bg-[#182235] hover:text-[#d2d7e3]',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {rowIcon(Icon, isActive, 18)}
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              <button
                type="button"
                onClick={logout}
                className="flex w-full min-h-tap items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-400 transition-colors select-none hover:bg-red-500/10"
              >
                <LogOut size={18} className="flex-shrink-0 rtl-flip" />
                <span className="truncate">{ar ? 'تسجيل الخروج' : 'Log out'}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ── The bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1e293b] bg-[#0d1117]/95 pb-safe backdrop-blur-md md:hidden"
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
                  isActive ? 'text-[#00a859]' : 'text-[#8592ad]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* The desktop column marks the chosen row with a rule down
                      its leading edge. Along a bar, that edge is the top. */}
                  {isActive && (
                    <span className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-b-full bg-[#00a859]" />
                  )}
                  {rowIcon(Icon, isActive, 20)}
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
              moreIsCurrent ? 'text-[#00a859]' : 'text-[#8592ad]',
            ].join(' ')}
          >
            {moreIsCurrent && (
              <span className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-b-full bg-[#00a859]" />
            )}
            <MoreHorizontal size={20} className="flex-shrink-0" />
            <span className="max-w-full truncate">{ar ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
