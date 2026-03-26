// App.tsx — root router with Supabase auth
import React, { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteProvider } from "@/hooks/AthleteProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BadmintonRouter } from "@/modules/badminton/BadmintonRouter";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────
const LandingPage        = lazy(() => import("./pages/Landing"));
const LoginPage          = lazy(() => import("./pages/Login"));
const AuthCallbackPage   = lazy(() => import("./pages/AuthCallback"));
const ExplorerPage       = lazy(() => import("./pages/Explorer"));
const AthleteProfilePage = lazy(() => import("./pages/AthleteProfile"));
const AnalyticsPage      = lazy(() => import("./pages/Analytics"));
const ImportPage         = lazy(() => import("./pages/Import"));
const AIQueryPage        = lazy(() => import("./pages/AIQuery"));
const SettingsPage       = lazy(() => import("./pages/Settings"));
const MethodologyPage    = lazy(() => import("./pages/Methodology"));
const LicensePage        = lazy(() => import("./pages/License"));
const ReportsPage        = lazy(() => import("./pages/Reports"));
const NotFound           = lazy(() => import("./pages/NotFound"));
const ProposalPage       = lazy(() => import("./pages/Proposal"));
const AdminPage          = lazy(() => import("./pages/Admin"));

function PageLoader() {
  return (
    <div className="p-6 space-y-4 w-full">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Auth guard — redirects to /login if not signed in ──────────────────
function RequireAuth() {
  const location = useLocation();
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// ─── Admin guard ─────────────────────────────────────────────────────────
function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/explorer" replace />;
  return <Outlet />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AthleteProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/proposal" element={<ProposalPage />} />

                {/* Admin panel */}
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>

                {/* Protected app routes */}
                <Route element={<RequireAuth />}>
                  <Route element={<AppShell />}>
                    <Route path="/explorer"    element={<ExplorerPage />} />
                    <Route path="/athlete/:id" element={<AthleteProfilePage />} />
                    <Route path="/analytics"   element={<AnalyticsPage />} />
                    <Route path="/import"      element={<ImportPage />} />
                    <Route path="/ai-query"    element={<AIQueryPage />} />
                    <Route path="/reports"     element={<ReportsPage />} />
                    <Route path="/settings"    element={<SettingsPage />} />
                    <Route path="/methodology" element={<MethodologyPage />} />
                    <Route path="/license"     element={<LicensePage />} />
                    <Route path="/sports/badminton/*" element={<BadmintonRouter />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AthleteProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
