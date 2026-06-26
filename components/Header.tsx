import React from 'react';
import { LogOut, Globe, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
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
            className="md:hidden w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#d2d7e3] transition-all"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <Link to="/dashboard" className="md:hidden">
            <BrandLogo variant="mark" loading="eager" className="h-7 w-7 object-contain" />
          </Link>
        </div>

        {/* Spacer on desktop */}
        <div className="hidden md:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex flex-col items-end mr-1">
              <p className="text-xs font-semibold text-[#d2d7e3] truncate max-w-[140px]">
                {user.displayName}
              </p>
              <p className="text-[10px] text-[#00a859] font-bold" dir="ltr">
                {lang === 'ar'
                  ? `المستوى ${progress.level} · ${progress.completedUnits} درس`
                  : `Level ${progress.level} · ${progress.completedUnits} lessons`}
              </p>
            </div>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
            aria-label="Toggle language"
            title={lang === 'en' ? 'العربية' : 'English'}
          >
            <Globe size={16} />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Log out"
            className="w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
