import React from 'react';
import { LogOut, Globe, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import Avatar from './ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useXp } from '../services/xpService';
import { levelColor } from './ui/LevelBadge';
import { startTour } from './tour/TourHost';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const { xp, level } = useXp();

  return (
    <header className="app-header flex-shrink-0 bg-[#0d1117]/95 border-b border-[#1e293b] backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: the logo. No menu button any more — the phone's navigation
            is a bar along the bottom, always out and always in reach, so there
            is nothing here to open. */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" aria-label="CyberKhana Academy" className="md:hidden inline-flex items-center justify-center touch:min-h-tap touch:min-w-tap">
            <BrandLogo variant="mark" loading="eager" className="h-7 w-7 object-contain" />
          </Link>
        </div>

        {/* Spacer on desktop */}
        <div className="hidden md:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Profile — matches the platform's header control.
              One thing to press, not two: the name/level block and the icon
              button sat next to each other and both stood for the same person.
              They are now the single control that reaches the profile, which is
              also where the picture is chosen, so this is where you see that
              choice took effect. Below sm the text drops and the avatar carries
              it on its own. */}
          <Link
            to="/profile"
            aria-label={lang === 'ar' ? 'الملف الشخصي' : 'My profile'}
            className="group flex h-10 touch:h-11 items-center gap-2.5 rounded-lg border border-[#263248] bg-[#121a2a] p-1 pe-1 sm:pe-3 transition-colors hover:border-[#00a859]/40 hover:bg-[#182235]"
          >
            <Avatar
              avatarUrl={user?.avatarUrl}
              name={user?.displayName}
              className="w-7 h-7 touch:w-8 touch:h-8 rounded-md"
              initialClassName="text-sm"
            />
            {user && (
              <span className="hidden sm:flex min-w-0 flex-col leading-tight">
                <span
                  className="truncate max-w-[140px] text-xs font-semibold text-[#d2d7e3] transition-colors group-hover:text-[#f3f6ff]"
                  title={user.displayName}
                >
                  {user.displayName}
                </span>
                <span
                  className="flex items-center gap-1 text-[11px] font-bold"
                  style={{ color: levelColor(level.level) }}
                >
                  <span dir="ltr" className="font-mono">
                    {level.level.hex}
                  </span>
                  <span>{level.level.name[lang]}</span>
                  <span className="text-[#4d5a73]" aria-hidden>
                    ·
                  </span>
                  <span className="font-semibold text-[#8592ad]" dir="ltr">
                    {xp.toLocaleString('en-US')} XP
                  </span>
                </span>
              </span>
            )}
          </Link>

          {/* Show me around. The tour opens by itself once for a new member;
              this is how anyone else asks for it, and how they ask again. */}
          <button
            onClick={startTour}
            data-tour-id="header-help"
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
            aria-label={lang === 'ar' ? 'جولة في الأكاديمية' : 'Tour the Academy'}
            title={lang === 'ar' ? 'جولة في الأكاديمية' : 'Tour the Academy'}
          >
            <HelpCircle size={16} />
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
            aria-label="Toggle language"
            title={lang === 'en' ? 'العربية' : 'English'}
          >
            <Globe size={16} />
          </button>

          {/* Logout. Desktop only: a phone's header was carrying four 44px
              controls across 375px, and this one is the only destructive thing
              among them. On a phone it lives at the foot of the More sheet,
              a deliberate step away from anything it could be mistaken for. */}
          <button
            onClick={logout}
            aria-label="Log out"
            className="hidden md:flex w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] items-center justify-center text-[#8390ac] hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={16} className="rtl-flip" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
