import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';
import PwaInstallBanner from './PwaInstallBanner';
import UniversityPrompt from './university/UniversityPrompt';
import UsernamePrompt from './account/UsernamePrompt';
import LanguagePrompt, { useLanguageFirstRun } from './account/LanguagePrompt';
import { skyFor, skyStyle } from './ui/sky';

const SIDEBAR_KEY = 'academy-sidebar-collapsed';

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  });
  const { pathname } = useLocation();
  const sky = skyFor(pathname);
  /* Which language to say everything else in. Asked first, and on its own. */
  const language = useLanguageFirstRun();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, left: 0 }); }, [pathname]);

  return (
    <div className="flex app-shell text-[#d2d7e3] bg-[#0d1117]">
      {/* Two navigations, one per pointer. The column belongs to a mouse and a
          wide screen; the bar belongs to a thumb. Neither is a smaller copy of
          the other, and only one is ever mounted with a size. */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        {/* overflow-x-hidden, not auto: a child that outgrows the phone should
            scroll inside its own box, never pan the whole shell sideways and
            take the header with it. */}
        {/* A route with a sky paints it as this element's own background, so
            it covers the whole scroll area and sits behind the sidebar's
            collapse handle. See ui/sky.ts for why it is not a layer. */}
        <main
          ref={mainRef}
          className={`app-main relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-contain p-4 sm:p-6 md:p-8 ${
            sky ? `page-sky ${sky.ground} ${sky.desktopOnly ? 'page-sky-desktop' : ''}` : ''
          }`}
          style={sky ? skyStyle(sky) : undefined}
        >
          {/* Room at the foot for the phone's nav bar, which is fixed and
              would otherwise sit on top of the last thing on the page. The
              home indicator's inset is inside that reservation on a phone and
              is all of it on a desktop, where there is no bar. */}
          <div className="max-w-7xl mx-auto min-w-0 mobile-nav-clearance md:pb-[env(safe-area-inset-bottom,0px)]">
            {!language.needed && <PwaInstallBanner className="mb-5" />}
            <Outlet />
          </div>
        </main>
      </div>

      {/* First-run prompts, in the order they are put to a new member. The
          language comes before the rest because the rest is written in it; a
          username is then mandatory, and the university question waits until
          one is claimed. One at a time, never stacked. */}
      {language.needed ? (
        <LanguagePrompt choose={language.choose} current={language.current} />
      ) : (
        <>
          <UsernamePrompt />
          <UniversityPrompt />
        </>
      )}

      <MobileNav />
    </div>
  );
};

export default AppLayout;
