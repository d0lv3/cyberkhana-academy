import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Trophy,
  User,
  Pencil,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import BrandLogo from './ui/BrandLogo';
import PathsIcon from './ui/PathsIcon';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { useXp } from '../services/xpService';
import { levelColor } from './ui/LevelBadge';
import LevelEmblem from './levels/LevelEmblem';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { xp, level } = useXp();
  /** Route whose icon is mid-nudge, cleared when the animation ends. */
  const [nudging, setNudging] = useState<string | null>(null);

  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  /* `tour` is what the Academy tour points at. It is a name given on purpose,
     not a class name borrowed from the styling, so moving a row or restyling
     it never quietly breaks the tour. */
  const learnItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), tour: 'nav-dashboard' },
    { to: '/fundamentals', icon: GraduationCap, label: t('sidebar.fundamentals'), tour: 'nav-fundamentals' },
    { to: '/modules', icon: Layers, label: t('sidebar.modules'), tour: 'nav-modules' },
    { to: '/paths', icon: PathsIcon, label: t('sidebar.paths'), tour: 'nav-paths' },
    { to: '/leaderboard', icon: Trophy, label: t('sidebar.leaderboard'), tour: 'nav-leaderboard' },
    ...(isCreator
      ? [{ to: '/creators', icon: Pencil, label: lang === 'ar' ? 'استوديو المحتوى' : 'Content Studio', tour: 'nav-creators' }]
      : []),
  ];

  const accountItems = [
    { to: '/profile', icon: User, label: t('sidebar.profile'), tour: 'nav-profile' },
    ...(user?.role === 'admin'
      ? [{ to: '/admin/members', icon: Users, label: lang === 'ar' ? 'الأعضاء' : 'Members', tour: 'nav-members' }]
      : []),
  ];

  const renderNavItems = (items: typeof learnItems) =>
    items.map(({ to, icon: Icon, label, tour }) => (
      <NavLink
        key={to}
        to={to}
        data-tour-id={tour}
        onClick={() => {
          setNudging(to);
          onMobileClose();
        }}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
            collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5',
            isActive
              ? 'bg-[#00a859]/12 text-[#00a859] border border-[#00a859]/20'
              : 'text-[#9aa5bf] hover:bg-[#182235] hover:text-[#d2d7e3] border border-transparent',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute start-0 w-0.5 h-6 bg-[#00a859] rounded-e" />
            )}
            <Icon
              /* The chosen tab's glyph fills in, in its own colour: the fill
                 is currentColor at full strength, so the icon reads as one
                 solid shape rather than a paler wash sitting inside a brighter
                 outline.

                 That constrains which glyphs can live here at all. These are
                 stroked outlines, and filling one built from open paths closes
                 it into a blob: BookOpen became a lump and PenTool lost its nib.
                 Paths therefore has a custom two-state glyph; Fundamentals and
                 the Studio use a cap and pencil, shapes that survive being
                 filled. Profile is User rather than UserCircle for the same
                 reason: filling a glyph that encloses itself in a circle only
                 produces a disc behind the person. */
              fill={isActive ? 'currentColor' : 'none'}
              onAnimationEnd={() => setNudging(null)}
              className={`flex-shrink-0 transition-colors ${
                nudging === to ? 'nav-nudge' : ''
              } ${isActive ? 'text-[#00a859]' : 'text-[#8592ad] group-hover:text-[#9aa5bf]'}`}
              size={collapsed ? 20 : 17}
            />
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && isActive && <ChevronRight size={13} className="text-[#00a859]/60 rtl-flip" />}
          </>
        )}
      </NavLink>
    ));

  const sidebarContent = (
    <>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-[#1e293b] ${collapsed ? 'px-2 py-5 justify-center' : 'px-5 py-5 justify-between'}`}>
        {collapsed ? (
          <BrandLogo
            variant="collapsed"
            loading="eager"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <BrandLogo
            variant="full"
            loading="eager"
            className="h-8 w-auto max-w-[140px] object-contain"
          />
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden w-7 h-7 touch:w-11 touch:h-11 flex items-center justify-center rounded-md text-[#8592ad] hover:text-[#d2d7e3] hover:bg-[#182235] transition-all"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-5 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold tracking-[0.15em] text-[#8592ad] uppercase">
            {t('sidebar.learn')}
          </p>
        )}
        {renderNavItems(learnItems)}

        {!collapsed && (
          <p className="px-3 mb-3 mt-6 text-[10px] font-bold tracking-[0.15em] text-[#8592ad] uppercase">
            {t('sidebar.account')}
          </p>
        )}
        {collapsed && <div className="my-4 border-t border-[#1e293b]" />}
        {renderNavItems(accountItems)}
      </nav>

      {/* User mini-card */}
      {user && (
        <div className="px-2 py-4 border-t border-[#1e293b]">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center">
                <span className="text-sm font-black text-[#9fef00]">
                  {(user.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div
              data-tour-id="sidebar-level"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#121a2a] border border-[#263248]"
            >
              <div className="w-8 h-8 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-[#9fef00]">
                  {(user.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#d2d7e3] truncate">
                  {user.displayName}
                </p>
                <p className="flex items-center gap-1 text-[10px] font-bold" style={{ color: levelColor(level.level) }}>
                  <LevelEmblem level={level.level} lang={lang} decorative eager className="-my-1 h-4 w-4 flex-shrink-0" />
                  <span dir="ltr" className="font-mono">
                    {level.level.hex}
                  </span>
                  <span className="truncate">{level.level.name[lang]}</span>
                </p>
                {/* How far through the level, toward the next one. */}
                <div
                  className="mt-1 h-1 rounded-full bg-[#0a0f18] overflow-hidden"
                  dir="ltr"
                  title={
                    level.next
                      ? `${xp.toLocaleString('en-US')} / ${level.next.minXp.toLocaleString('en-US')} XP`
                      : `${xp.toLocaleString('en-US')} XP`
                  }
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(level.fraction * 100)}%`, backgroundColor: levelColor(level.level) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={`
          fixed top-0 start-0 h-screen z-50 flex flex-col bg-[#0d1117] border-e border-[#1e293b]
          transition-transform duration-300 ease-in-out w-64
          md:hidden
          ${mobileOpen ? 'translate-x-0' : lang === 'ar' ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-20 bg-[#0d1117] border-e border-[#1e293b]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[68px]' : 'w-60'}
        `}
      >
        {sidebarContent}

        {/* Floating collapse/expand toggle — rides the sidebar's inner
            (content-facing) edge, overhanging the page by half its width. That
            overhang is why the <aside> carries a z-index: `sticky` makes it a
            stacking context, so this button's own z-index is spent inside the
            sidebar, and without one the page's background paints over it. */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-[68px] -end-3 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-[#263248] bg-[#121a2a] text-[#8592ad] shadow-md shadow-black/40 transition-all duration-200 hover:scale-110 hover:border-[#00a859]/60 hover:bg-[#0e1626] hover:text-[#00a859] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50"
        >
          {collapsed ? <ChevronRight size={14} className="rtl-flip" /> : <ChevronLeft size={14} className="rtl-flip" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
