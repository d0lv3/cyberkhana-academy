import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LangProvider } from './contexts/LangContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ConfirmHost from './components/ui/ConfirmHost';
import ErrorBoundary from './components/ErrorBoundary';

import { FullscreenLiquidLoader } from './components/ui/LiquidLogoLoader';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import LegalPage from './pages/legal/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/DashboardPage';
import FundamentalsPage from './pages/fundamentals/FundamentalsPage';
import ProgrammingPage from './pages/fundamentals/ProgrammingPage';
import NetworkingPage from './pages/fundamentals/NetworkingPage';
import OperatingSystemsPage from './pages/fundamentals/OperatingSystemsPage';
import ModulesPage from './pages/modules/ModulesPage';
import PathsPage from './pages/paths/PathsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

/* ── Lazy-loaded heavy pages (CodeMirror, react-markdown, Pyodide) ── */
const ModuleViewerPage = lazy(() => import('./pages/fundamentals/ModuleViewerPage'));
const NetworkingLessonPage = lazy(() => import('./pages/fundamentals/NetworkingLessonPage'));
const ProgrammingLanguagePage = lazy(() => import('./pages/fundamentals/ProgrammingLanguagePage'));
const ProgrammingLessonPage = lazy(() => import('./pages/fundamentals/ProgrammingLessonPage'));

/* ── Creator Studio (lazy — markdown, CodeMirror, simulation builder) ── */
const CreatorDashboard = lazy(() => import('./pages/creators/CreatorDashboard'));
const NetworkingCreator = lazy(() => import('./pages/creators/NetworkingCreator'));
const NetworkingEditor = lazy(() => import('./pages/creators/NetworkingEditor'));
const ProgrammingCreator = lazy(() => import('./pages/creators/ProgrammingCreator'));
const ProgrammingConceptEditor = lazy(() => import('./pages/creators/ProgrammingConceptEditor'));
const ProgrammingModuleEditor = lazy(() => import('./pages/creators/ProgrammingModuleEditor'));
const ProgrammingLanguageEditor = lazy(() => import('./pages/creators/ProgrammingLanguageEditor'));
const OSModulesCreator = lazy(() => import('./pages/creators/OSModulesCreator'));
const ModulesCreator = lazy(() => import('./pages/creators/ModulesCreator'));
const ModuleEditor = lazy(() => import('./pages/creators/ModuleEditor'));
const PathsCreator = lazy(() => import('./pages/creators/PathsCreator'));
const PathEditor = lazy(() => import('./pages/creators/PathEditor'));
const PathDetailPage = lazy(() => import('./pages/paths/PathDetailPage'));
const MembersPage = lazy(() => import('./pages/admin/MembersPage'));
const CyberSecurity101Page = lazy(() => import('./pages/fundamentals/CyberSecurity101Page'));
const TerminalPage = lazy(() => import('./pages/TerminalPage'));

function LazyFallback() {
  return <FullscreenLiquidLoader />;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LazyFallback />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LazyFallback />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Content Studio is for creators/admins only. */
function CreatorGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LazyFallback />;
  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

/** Admin-only area (member management). */
function AdminGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LazyFallback />;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <PublicGate>
              <LandingPage />
            </PublicGate>
          }
        />
        <Route
          path="/login"
          element={
            <PublicGate>
              <LoginPage />
            </PublicGate>
          }
        />

        {/* Legal — public, accessible signed-in or out */}
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />

        {/* Module viewer — full-screen, outside AppLayout.
         * Standalone (Modules-hub) modules use /modules/:slug; fundamentals
         * modules use /fundamentals/module/:slug. Both render the same page,
         * and the fundamentals path stays a working alias for old links. */}
        <Route
          path="/modules/:slug"
          element={
            <AuthGate>
              <ModuleViewerPage />
            </AuthGate>
          }
        />
        <Route
          path="/fundamentals/module/:slug"
          element={
            <AuthGate>
              <ModuleViewerPage />
            </AuthGate>
          }
        />

        {/* Networking lesson viewer — full-screen, outside AppLayout */}
        <Route
          path="/fundamentals/networking/lesson/:slug"
          element={
            <AuthGate>
              <NetworkingLessonPage />
            </AuthGate>
          }
        />

        {/* Programming lesson/challenge viewer — full-screen, outside AppLayout */}
        <Route
          path="/fundamentals/programming/:langSlug/:moduleSlug/:conceptSlug"
          element={
            <AuthGate>
              <ProgrammingLessonPage />
            </AuthGate>
          }
        />

        {/* Popped-out practice terminal — full-screen, outside AppLayout */}
        <Route
          path="/terminal"
          element={
            <AuthGate>
              <TerminalPage />
            </AuthGate>
          }
        />

        {/* Authenticated — inside AppLayout */}
        <Route
          element={
            <AuthGate>
              <AppLayout />
            </AuthGate>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fundamentals" element={<FundamentalsPage />} />
          <Route path="/fundamentals/programming" element={<ProgrammingPage />} />
          <Route path="/fundamentals/programming/:langSlug" element={<ProgrammingLanguagePage />} />
          <Route path="/fundamentals/networking" element={<NetworkingPage />} />
          <Route path="/fundamentals/operating-systems" element={<OperatingSystemsPage />} />
          <Route path="/fundamentals/cybersecurity-101" element={<CyberSecurity101Page />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/paths" element={<PathsPage />} />
          <Route path="/paths/:slug" element={<PathDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Creator Studio — role-gated */}
          <Route element={<CreatorGate />}>
            <Route path="/creators" element={<CreatorDashboard />} />
            <Route path="/creators/networking" element={<NetworkingCreator />} />
            <Route path="/creators/networking/new" element={<NetworkingEditor />} />
            <Route path="/creators/networking/edit/:id" element={<NetworkingEditor />} />
            <Route path="/creators/programming" element={<ProgrammingCreator />} />
            <Route path="/creators/programming/new-language" element={<ProgrammingLanguageEditor />} />
            <Route path="/creators/programming/edit-language/:slug" element={<ProgrammingLanguageEditor />} />
            <Route path="/creators/programming/new-module/:langSlug" element={<ProgrammingModuleEditor />} />
            <Route path="/creators/programming/edit-module/:langSlug/:moduleId" element={<ProgrammingModuleEditor />} />
            <Route path="/creators/programming/new-concept/:langSlug/:moduleSlug" element={<ProgrammingConceptEditor />} />
            <Route path="/creators/programming/:langSlug/:moduleSlug/:conceptSlug" element={<ProgrammingConceptEditor />} />
            <Route path="/creators/os-modules" element={<OSModulesCreator />} />
            <Route path="/creators/os-modules/new" element={<ModuleEditor kind="os" />} />
            <Route path="/creators/os-modules/edit/:id" element={<ModuleEditor kind="os" />} />
            <Route path="/creators/modules" element={<ModulesCreator />} />
            <Route path="/creators/modules/new" element={<ModuleEditor kind="standalone" />} />
            <Route path="/creators/modules/edit/:id" element={<ModuleEditor kind="standalone" />} />
            <Route path="/creators/paths" element={<PathsCreator />} />
            <Route path="/creators/paths/new" element={<PathEditor />} />
            <Route path="/creators/paths/edit/:id" element={<PathEditor />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminGate />}>
            <Route path="/admin/members" element={<MembersPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <LangProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <ConfirmHost />
        </LangProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
