import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProductPreviewSection from '../components/landing/ProductPreviewSection';
import StatsBand from '../components/landing/StatsBand';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import BrandLogo from '../components/ui/BrandLogo';
import Button from '../components/ui/EnhancedButton';
import { useLang } from '../contexts/LangContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => navigate('/login');

  return (
    <div className="app-min-shell bg-[#0d1117] overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0d1117]/90 backdrop-blur-xl border-b border-[#263248]/50'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo
            variant="full"
            loading="eager"
            className="hidden sm:block h-8 w-auto max-w-[170px] object-contain"
          />

          <div className="flex items-center gap-1.5 sm:gap-3 ms-auto">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9aa5bf] hover:text-[#9fef00] hover:bg-[#182235] transition-all"
            >
              <Globe size={14} />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Login (text) */}
            <button
              onClick={handleLogin}
              className="inline-flex items-center px-2 text-sm font-medium text-[#d2d7e3] hover:text-[#00a859] transition-colors whitespace-nowrap"
            >
              {t('nav.login')}
            </button>

            {/* Opts out of the touch size bump: this one sits in a 64px bar
                beside two other controls, where a full 44px pill dominates the
                row. 38px still clears the WCAG 2.2 target size. */}
            <Button
              variant="neon"
              size="sm"
              onClick={handleLogin}
              className="whitespace-nowrap touch:!min-h-[38px] touch:!px-3.5 touch:!py-1.5"
            >
              {t('nav.getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero with live product showcase */}
      <HeroSection onGetStarted={handleLogin} onLogin={handleLogin} />

      {/* Three pillars */}
      <FeaturesSection />

      {/* See the interactive surfaces in action */}
      <ProductPreviewSection />

      {/* Numbers */}
      <StatsBand />

      {/* Closing CTA */}
      <CTASection onGetStarted={handleLogin} />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
