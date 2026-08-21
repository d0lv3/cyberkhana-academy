import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UniversityPrompt from './university/UniversityPrompt';
import UsernamePrompt from './account/UsernamePrompt';

const SIDEBAR_KEY = 'academy-sidebar-collapsed';

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex app-shell text-[#d2d7e3] bg-[#0d1117]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        {/* overflow-x-hidden, not auto: a child that outgrows the phone should
            scroll inside its own box, never pan the whole shell sideways and
            take the header with it. */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-contain p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto min-w-0 pb-[env(safe-area-inset-bottom,0px)]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* First-run prompts. A username is mandatory and comes first; the
          university prompt waits until one is claimed. */}
      <UsernamePrompt />
      <UniversityPrompt />
    </div>
  );
};

export default AppLayout;
