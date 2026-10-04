import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { LangProvider } from './contexts/LangContext';
import { PwaProvider } from './contexts/PwaContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ConfirmHost from './components/ui/ConfirmHost';
import FeedbackHost from './components/feedback/FeedbackHost';
import AccountNoticeHost from './components/account/AccountNoticeHost';
import LevelUpHost from './components/levels/LevelUpHost';
import StreakMilestoneHost from './components/levels/StreakMilestoneHost';
import TourGate from './components/tour/TourGate';
import ErrorBoundary from './components/ErrorBoundary';

import { FullscreenLiquidLoader } from './components/ui/LiquidLogoLoader';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import { loginPath, safeLoginDestination } from './services/loginDestination';
import { ConnectionRecovery, SyncNoticeHost } from './components/ConnectionRecovery';
import { useSyncStatus } from './hooks/useSyncStatus';
import { CACHE_OWNER_KEY } from './services/syncService';
import { getPublishedPathBySlug } from './services/creatorDataService';
import { getViewableModuleBySlug } from './data/modulesData';
import { getNetworkingLesson } from './data/networking';
import { getConcept, getLanguage } from './data/programming';
import DashboardPage from './pages/DashboardPage';
import FundamentalsPage from './pages/fundamentals/FundamentalsPage';
import ProgrammingPage from './pages/fundamentals/ProgrammingPage';
import NetworkingPage from './pages/fundamentals/NetworkingPage';
import OperatingSystemsPage from './pages/fundamentals/OperatingSystemsPage';
import ModulesPage from './pages/modules/ModulesPage';
import PathsPage from './pages/paths/PathsPage';
import LeaderboardPage from './pages/LeaderboardPage';

/* ── Out of the first download ──
 * Each of these was in the bundle every visit begins with, and none of them is
 * what a visit begins with: the landing page is for someone signed out and the
 * rest of that bundle for someone signed in, the legal texts are read from a
 * link, and the Creator Agreement is put to a creator at the Studio's door.
 *
 * A browser no account has ever used is almost certainly here for the landing
 * page, so that one is asked for straight away, while the session is still
 * being checked, rather than once the answer is back. */
const loadLanding = () => import('./pages/LandingPage');
const LandingPage = lazy(loadLanding);
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));
const CreatorAgreementGate = lazy(() => import('./components/legal/CreatorAgreementGate'));
const loadProfile = () => import('./pages/ProfilePage');
const ProfilePage = lazy(loadProfile);

try {
  if (localStorage.getItem(CACHE_OWNER_KEY) === null) void loadLanding();
} catch {
  /* storage unavailable: the landing page is fetched when it is shown */
}

/* ── Lazy-loaded heavy pages (CodeMirror, react-markdown, Pyodide) ── */
const ModuleViewerPage = lazy(() => import('./pages/fundamentals/ModuleViewerPage'));
const ModuleOverviewPage = lazy(() => import('./pages/fundamentals/ModuleOverviewPage'));
const NetworkingLessonPage = lazy(() => import('./pages/fundamentals/NetworkingLessonPage'));
const ProgrammingLanguagePage = lazy(() => import('./pages/fundamentals/ProgrammingLanguagePage'));
const ProgrammingLessonPage = lazy(() => import('./pages/fundamentals/ProgrammingLessonPage'));

/* ── Creator Studio (lazy — markdown, CodeMirror, simulation builder) ── */
const CreatorDashboard = lazy(() => import('./pages/creators/CreatorDashboard'));
const NetworkingCreator = lazy(() => import('./pages/creators/NetworkingCreator'));
const NetworkingEditor = lazy(() => import('./pages/creators/NetworkingEditor'));
const NetworkingUnitEditor = lazy(() => import('./pages/creators/NetworkingUnitEditor'));
const ProgrammingCreator = lazy(() => import('./pages/creators/ProgrammingCreator'));
const ProgrammingConceptEditor = lazy(() => import('./pages/creators/ProgrammingConceptEditor'));
const ProgrammingModuleEditor = lazy(() => import('./pages/creators/ProgrammingModuleEditor'));
const ProgrammingLanguageEditor = lazy(() => import('./pages/creators/ProgrammingLanguageEditor'));
const OSModulesCreator = lazy(() => import('./pages/creators/OSModulesCreator'));
const ModulesCreator = lazy(() => import('./pages/creators/ModulesCreator'));
const ModuleEditor = lazy(() => import('./pages/creators/ModuleEditor'));
const PathsCreator = lazy(() => import('./pages/creators/PathsCreator'));
const FeedbackCreator = lazy(() => import('./pages/creators/FeedbackCreator'));
const FeedbackTrackPage = lazy(() => import('./pages/creators/FeedbackTrackPage'));
const PathEditor = lazy(() => import('./pages/creators/PathEditor'));
const PathDetailPage = lazy(() => import('./pages/paths/PathDetailPage'));
const MembersPage = lazy(() => import('./pages/admin/MembersPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const CyberSecurity101Page = lazy(() => import('./pages/fundamentals/CyberSecurity101Page'));
const TerminalPage = lazy(() => import('./pages/TerminalPage'));

function LazyFallback() {
  return <FullscreenLiquidLoader />;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, sessionError, retrySession } = useAuth();
  const sync = useSyncStatus();
  if (isLoading) return <LazyFallback />;
  if (sessionError) return <ConnectionRecovery session retry={retrySession} />;
  if (!isAuthenticated) return <Navigate to={loginPath(location.pathname + location.search + location.hash)} replace />;
  if (sync.failedLoads.includes('courses') || sync.failedLoads.includes('progress')) return <ConnectionRecovery />;
  return <>{children}</>;
}

function PublicGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LazyFallback />;
  if (isAuthenticated) {
    const destination = location.pathname === '/login'
      ? safeLoginDestination(new URLSearchParams(location.search).get('next'))
      : '/dashboard';
    return <Navigate to={destination} replace />;
  }
  return <>{children}</>;
}

/* ── Pages that name one thing ──
 * A device that holds the account's copy opens from it while this visit's pull
 * is still on its way (services/syncService.ts, "Opening from this device's
 * copy"). For a page that lists things that is all there is to it. A page that
 * is about ONE thing has a second case: a link to something published since
 * the last visit, which the copy does not have. That page waits for the pull,
 * as every page used to, instead of saying the thing does not exist.
 *
 * Each is also keyed by the revision, as the pages inside the shell are
 * (components/AppLayout.tsx): when the pull brings something the copy did not
 * have, the page starts again from it. */
type RouteParams = Readonly<Record<string, string | undefined>>;

const inCopy = {
  /* A draft preview is read from the Studio's own snapshot, not the catalog. */
  module: ({ slug }: RouteParams) => slug === '__preview__' || !!getViewableModuleBySlug(slug ?? ''),
  lesson: ({ slug }: RouteParams) => !!getNetworkingLesson(slug ?? ''),
  concept: ({ langSlug, moduleSlug, conceptSlug }: RouteParams) =>
    !!getConcept(langSlug ?? '', moduleSlug ?? '', conceptSlug ?? ''),
  language: ({ langSlug }: RouteParams) => !!getLanguage(langSlug ?? ''),
  path: ({ slug }: RouteParams) => !!getPublishedPathBySlug(slug ?? ''),
};

function CatalogRoute({ has, children }: { has: (params: RouteParams) => boolean; children: React.ReactNode }) {
  const params = useParams();
  const { loading, revision } = useSyncStatus();
  if (loading && !has(params)) return <LazyFallback />;
  return <React.Fragment key={revision}>{children}</React.Fragment>;
}

/** Content Studio is for creators/admins only — and creators must additionally
 *  have accepted the Creator Agreement, which is what governs the powers on the
 *  other side of this gate. */
function CreatorGate() {
  const { user, isLoading } = useAuth();
  const sync = useSyncStatus();
  /* The Studio writes whole buckets back, so it never works from the copy a
     visit opened with: it waits until this visit's pull has brought its own. */
  if (isLoading || sync.loading) return <LazyFallback />;
  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  if (sync.failedLoads.includes('studio')) return <ConnectionRecovery />;
  return (
    <CreatorAgreementGate>
      <Outlet />
    </CreatorAgreementGate>
  );
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

/** The Profile tab is one press away from every page, so its code is fetched
 *  once the app is up and the browser has a moment, and the press finds it. */
function usePrefetchedProfile(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const fetchIt = () => void loadProfile().catch(() => undefined);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(fetchIt, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(fetchIt, 2000);
    return () => clearTimeout(timer);
  }, [enabled]);
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  usePrefetchedProfile(isAuthenticated);
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
        <Route path="/creator-agreement" element={<LegalPage kind="creator-agreement" />} />

        {/* Module viewer — full-screen, outside AppLayout, one level under the
         * module's own page so the overview keeps the app shell around it.
         * Standalone (Modules-hub) modules use /modules/:slug; fundamentals
         * modules use /fundamentals/module/:slug. Both render the same pages,
         * and the fundamentals path stays a working alias for old links. */}
        <Route
          path="/modules/:slug/learn"
          element={
            <AuthGate>
              <CatalogRoute has={inCopy.module}>
                <ModuleViewerPage />
              </CatalogRoute>
            </AuthGate>
          }
        />
        <Route
          path="/fundamentals/module/:slug/learn"
          element={
            <AuthGate>
              <CatalogRoute has={inCopy.module}>
                <ModuleViewerPage />
              </CatalogRoute>
            </AuthGate>
          }
        />

        {/* Networking lesson viewer — full-screen, outside AppLayout */}
        <Route
          path="/fundamentals/networking/lesson/:slug"
          element={
            <AuthGate>
              <CatalogRoute has={inCopy.lesson}>
                <NetworkingLessonPage />
              </CatalogRoute>
            </AuthGate>
          }
        />

        {/* Programming lesson/challenge viewer — full-screen, outside AppLayout */}
        <Route
          path="/fundamentals/programming/:langSlug/:moduleSlug/:conceptSlug"
          element={
            <AuthGate>
              <CatalogRoute has={inCopy.concept}>
                <ProgrammingLessonPage />
              </CatalogRoute>
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
          <Route
            path="/fundamentals/programming/:langSlug"
            element={
              <CatalogRoute has={inCopy.language}>
                <ProgrammingLanguagePage />
              </CatalogRoute>
            }
          />
          <Route path="/fundamentals/networking" element={<NetworkingPage />} />
          <Route path="/fundamentals/operating-systems" element={<OperatingSystemsPage />} />
          <Route path="/fundamentals/cybersecurity-101" element={<CyberSecurity101Page />} />
          <Route path="/modules" element={<ModulesPage />} />
          {/* A module's own page: what it covers and the way in. */}
          <Route
            path="/modules/:slug"
            element={
              <CatalogRoute has={inCopy.module}>
                <ModuleOverviewPage />
              </CatalogRoute>
            }
          />
          <Route
            path="/fundamentals/module/:slug"
            element={
              <CatalogRoute has={inCopy.module}>
                <ModuleOverviewPage />
              </CatalogRoute>
            }
          />
          <Route path="/paths" element={<PathsPage />} />
          <Route
            path="/paths/:slug"
            element={
              <CatalogRoute has={inCopy.path}>
                <PathDetailPage />
              </CatalogRoute>
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Another member's public profile, by username or account id. */}
          <Route path="/u/:handle" element={<PublicProfilePage />} />

          {/* Creator Studio — role-gated */}
          <Route element={<CreatorGate />}>
            <Route path="/creators" element={<CreatorDashboard />} />
            <Route path="/creators/networking" element={<NetworkingCreator />} />
            <Route path="/creators/networking/new" element={<NetworkingEditor />} />
            <Route path="/creators/networking/edit/:id" element={<NetworkingEditor />} />
            <Route path="/creators/networking/units/new" element={<NetworkingUnitEditor />} />
            <Route path="/creators/networking/units/edit/:id" element={<NetworkingUnitEditor />} />
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
            <Route path="/creators/feedback" element={<FeedbackCreator />} />
            <Route path="/creators/feedback/:track" element={<FeedbackTrackPage />} />
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
    /* 31 files animate with framer-motion and none of them checked the user's
       motion preference. reducedMotion="user" makes every motion component in
       the tree honour prefers-reduced-motion: transform and layout animations
       are dropped, opacity fades are kept. The CSS keyframe animations already
       have their own reduced-motion blocks in index.css. */
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AuthProvider>
          <LangProvider>
            <PwaProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <ConfirmHost />
              <FeedbackHost />
              <AccountNoticeHost />
              <SyncNoticeHost />
              <LevelUpHost />
              <StreakMilestoneHost />
              <TourGate />
            </PwaProvider>
          </LangProvider>
        </AuthProvider>
      </HashRouter>
    </MotionConfig>
  );
};

export default App;
