import React from 'react';
import { LogOut, Globe, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import Avatar from './ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useOverallProgress } from '../services/progressService';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const progress = useOverallProgress();

  return (
    <header className="flex-shrink-0 bg-[#0d1117]/95 border-b border-[#1e293b] backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#d2d7e3] transition-all"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
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
                <span className="text-[11px] font-bold text-[#9fef00]" dir="ltr">
                  {lang === 'ar'
                    ? `المستوى ${progress.level} · ${progress.completedUnits} درس`
                    : `Level ${progress.level} · ${progress.completedUnits} lessons`}
                </span>
              </span>
            )}
          </Link>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
            aria-label="Toggle language"
            title={lang === 'en' ? 'العربية' : 'English'}
          >
            <Globe size={16} />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Log out"
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={16} className="rtl-flip" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
