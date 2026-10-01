import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BrandLogo from './ui/BrandLogo';
import {
  DashboardIcon,
  FundamentalsIcon,
  ModulesIcon,
  PathsIcon,
  LeaderboardIcon,
  StudioIcon,
  ProfileIcon,
  MembersIcon,
  type NavIconProps,
} from './ui/NavIcons';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { useXp } from '../services/xpService';
import { levelColor } from './ui/LevelBadge';
import LevelEmblem from './levels/LevelEmblem';

/* ─── The desktop navigation column ───
 *
 * Desktop only, and deliberately so. A phone gets MobileNav, a bar across the
 * bottom of the screen, rather than a narrow copy of this one hidden behind a
 * menu button.
 *
 * It is laid out like an instrument panel: one accent, and it is spent on
 * exactly one thing, the page you are on. That row's icon sits on a solid
 * green tile with a lit marker at the panel's edge; every other row is quiet
 * until the pointer reaches it. The same tile is what is left of a row when
 * the panel is collapsed, so the two states read as one design.
 */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  to: string;
  icon: React.FC<NavIconProps>;
  label: string;
  /** What the Academy tour points at. A name given on purpose, not a class
   *  borrowed from the styling, so restyling a row never breaks the tour. */
  tour: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { xp, level } = useXp();
  const navigate = useNavigate();
  /** Route whose icon is mid-nudge, cleared when the animation ends. */
  const [nudging, setNudging] = useState<string | null>(null);

  const ar = lang === 'ar';
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  const learnItems: NavItem[] = [
    { to: '/dashboard', icon: DashboardIcon, label: t('sidebar.dashboard'), tour: 'nav-dashboard' },
    { to: '/fundamentals', icon: FundamentalsIcon, label: t('sidebar.fundamentals'), tour: 'nav-fundamentals' },
    { to: '/modules', icon: ModulesIcon, label: t('sidebar.modules'), tour: 'nav-modules' },
    { to: '/paths', icon: PathsIcon, label: t('sidebar.paths'), tour: 'nav-paths' },
    { to: '/leaderboard', icon: LeaderboardIcon, label: t('sidebar.leaderboard'), tour: 'nav-leaderboard' },
    ...(isCreator
      ? [{ to: '/creators', icon: StudioIcon, label: ar ? 'استوديو المحتوى' : 'Content Studio', tour: 'nav-creators' }]
      : []),
  ];

  const accountItems: NavItem[] = [
    { to: '/profile', icon: ProfileIcon, label: t('sidebar.profile'), tour: 'nav-profile' },
    ...(user?.role === 'admin'
      ? [{ to: '/admin/members', icon: MembersIcon, label: ar ? 'الأعضاء' : 'Members', tour: 'nav-members' }]
      : []),
  ];

  const renderNavItems = (items: NavItem[]) =>
    items.map(({ to, icon: Icon, label, tour }) => (
      <NavLink
        key={to}
        to={to}
        data-tour-id={tour}
        onClick={() => setNudging(to)}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            'group relative flex h-11 items-center rounded-xl outline-none transition-colors duration-150',
            'focus-visible:ring-2 focus-visible:ring-[#00a859]/60',
            collapsed ? 'justify-center' : 'gap-3 ps-1.5 pe-3',
            isActive ? (collapsed ? '' : 'bg-[#101826]') : collapsed ? '' : 'hover:bg-[#0f1622]',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {/* The lit marker sits on the panel's own edge, outside the row, so
                it lines up down the column whichever row is chosen. */}
            {isActive && (
              <span
                aria-hidden
                className="absolute -start-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-e-full bg-[#9fef00]"
              />
            )}
            <span
              className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[11px] transition-colors duration-150 ${
                isActive
                  ? 'bg-[#00a859] text-[#04140c]'
                  : 'text-[#7f8ca8] group-hover:bg-[#182235] group-hover:text-[#dfe5f2]'
              }`}
            >
              <Icon
                size={20}
                active={isActive}
                onAnimationEnd={() => setNudging(null)}
                className={nudging === to ? 'nav-nudge' : undefined}
              />
            </span>
            {!collapsed && (
              <span
                className={`min-w-0 flex-1 truncate text-[13.5px] transition-colors ${
                  isActive
                    ? 'font-semibold text-[#f3f6ff]'
                    : 'font-medium text-[#9aa5bf] group-hover:text-[#e3e8f4]'
                }`}
              >
                {label}
              </span>
            )}
          </>
        )}
      </NavLink>
    ));

  /* Tracked capitals suit Latin and break Arabic, whose letters join: spacing
     them apart pulls a word into pieces. The gap above the second label is
     padding, because the nav's own row spacing overrides a margin there. */
  const sectionLabel = (text: string, first = false) =>
    collapsed ? (
      first ? null : <div aria-hidden className="mx-auto my-3 h-px w-6 bg-[#1e293b]" />
    ) : (
      <p
        className={`mb-2 flex items-center gap-2.5 ps-2.5 pe-1 text-[10px] font-semibold uppercase text-[#66738f] ${
          first ? '' : 'pt-5'
        }`}
        style={ar ? undefined : { letterSpacing: '0.16em' }}
      >
        <span>{text}</span>
        <span aria-hidden className="h-px flex-1 bg-[#1a2334]" />
      </p>
    );

  const tint = levelColor(level.level);
  const percent = Math.round(level.fraction * 100);
  const xpTitle = level.next
    ? `${xp.toLocaleString('en-US')} / ${level.next.minXp.toLocaleString('en-US')} XP`
    : `${xp.toLocaleString('en-US')} XP`;
  const openLevels = () => navigate('/dashboard', { state: { focus: 'levels' } });
  const levelsLabel = ar ? 'كل المستويات' : 'See all levels';

  /* Collapsed, the level card is its emblem inside a ring that fills as the
     level does: the same reading as the bar, in the space of one tile. */
  const RING = 2 * Math.PI * 19;

  return (
    <aside
      className={`
        hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-20 bg-[#0a0e15] border-e border-[#1a2334]
        transition-[width] duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div
        className={`relative flex h-[72px] flex-shrink-0 items-center border-b border-[#1a2334] ${
          collapsed ? 'justify-center' : 'px-5'
        }`}
      >
        {collapsed ? (
          <BrandLogo variant="collapsed" loading="eager" className="h-8 w-8 object-contain" />
        ) : (
          <BrandLogo variant="full" loading="eager" className="h-8 w-auto max-w-[140px] object-contain" />
        )}
      </div>

      {/* Nav */}
      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {sectionLabel(t('sidebar.learn'), true)}
        {renderNavItems(learnItems)}
        {sectionLabel(t('sidebar.account'))}
        {renderNavItems(accountItems)}
      </nav>

      {/* Level */}
      {user && (
        <div className="relative flex-shrink-0 border-t border-[#1a2334] p-3">
          {collapsed ? (
            <button
              type="button"
              data-tour-id="sidebar-level"
              onClick={openLevels}
              title={`${level.level.hex} ${level.level.name[lang]} · ${xpTitle}`}
              aria-label={levelsLabel}
              className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-full outline-none transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#00a859]/60"
            >
              <svg aria-hidden viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="#1a2334" strokeWidth="2.5" />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke={tint}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - level.fraction)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              </svg>
              <LevelEmblem level={level.level} lang={lang} decorative eager className="h-7 w-7" />
            </button>
          ) : (
            <button
              type="button"
              data-tour-id="sidebar-level"
              onClick={openLevels}
              title={levelsLabel}
              className="group block w-full rounded-2xl border border-[#1c2739] bg-[#0f1622] p-3 text-start outline-none transition-colors duration-150 hover:border-[#2b3a54] hover:bg-[#121b2a] focus-visible:ring-2 focus-visible:ring-[#00a859]/60"
            >
              <span className="flex items-center gap-3">
                <LevelEmblem
                  level={level.level}
                  lang={lang}
                  decorative
                  eager
                  className="h-10 w-10 flex-shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#e8ecf6]">
                    <span dir="auto">{user.displayName}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: tint }}>
                    <span dir="ltr" className="font-mono">
                      {level.level.hex}
                    </span>
                    <span className="truncate">{level.level.name[lang]}</span>
                  </span>
                </span>
              </span>

              {/* How far through the level, toward the next one. */}
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[#070b12]" dir="ltr" title={xpTitle}>
                <span
                  className="block h-full rounded-full transition-all duration-700"
                  style={{ width: `${percent}%`, backgroundColor: tint }}
                />
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-2 text-[10.5px] text-[#7f8ca8]">
                <span>
                  <span dir="ltr" className="font-mono font-semibold text-[#c5cce0]">
                    {xp.toLocaleString('en-US')} XP
                  </span>
                </span>
                {level.next && (
                  <span className="truncate">
                    <span dir="ltr">{level.toNext.toLocaleString('en-US')}</span> {ar ? 'حتى' : 'to'}{' '}
                    <span dir="ltr" className="font-mono">
                      {level.next.hex}
                    </span>
                  </span>
                )}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Floating collapse/expand toggle — rides the sidebar's inner
          (content-facing) edge, overhanging the page by half its width. That
          overhang is why the <aside> carries a z-index: `sticky` makes it a
          stacking context, so this button's own z-index is spent inside the
          sidebar, and without one the page's background paints over it. */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-[60px] -end-3 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-[#263248] bg-[#121a2a] text-[#8592ad] shadow-md shadow-black/40 transition-all duration-200 hover:scale-110 hover:border-[#00a859]/60 hover:bg-[#0e1626] hover:text-[#00a859] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
      >
        {collapsed ? <ChevronRight size={14} className="rtl-flip" /> : <ChevronLeft size={14} className="rtl-flip" />}
      </button>
    </aside>
  );
};

export default Sidebar;
