import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteProvider } from "@/hooks/useAthletes";

// ─── Lazy-loaded pages (each becomes its own chunk) ────────────────────────
const ExplorerPage      = lazy(() => import("./pages/Explorer"));
const AthleteProfilePage = lazy(() => import("./pages/AthleteProfile"));
const AnalyticsPage     = lazy(() => import("./pages/Analytics"));
const ImportPage        = lazy(() => import("./pages/Import"));
const AIQueryPage       = lazy(() => import("./pages/AIQuery"));
const SettingsPage      = lazy(() => import("./pages/Settings"));
const MethodologyPage   = lazy(() => import("./pages/Methodology"));
const LicensePage       = lazy(() => import("./pages/License"));
const ReportsPage       = lazy(() => import("./pages/Reports"));
const NotFound          = lazy(() => import("./pages/NotFound"));

// ─── Lightweight page skeleton shown during chunk load ─────────────────────
function PageLoader() {
  return (
    <div className="p-6 space-y-4 w-full">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AthleteProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/explorer" replace />} />
              <Route element={<AppShell />}>
                <Route path="/explorer"     element={<ExplorerPage />} />
                <Route path="/athlete/:id"  element={<AthleteProfilePage />} />
                <Route path="/analytics"    element={<AnalyticsPage />} />
                <Route path="/import"       element={<ImportPage />} />
                <Route path="/ai-query"     element={<AIQueryPage />} />
                <Route path="/reports"      element={<ReportsPage />} />
                <Route path="/settings"     element={<SettingsPage />} />
                <Route path="/methodology"  element={<MethodologyPage />} />
                <Route path="/license"      element={<LicensePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AthleteProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
