import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteProvider } from "@/hooks/useAthletes";

// Pages
import ExplorerPage from "./pages/Explorer";
import AthleteProfilePage from "./pages/AthleteProfile";
import AnalyticsPage from "./pages/Analytics";
import ImportPage from "./pages/Import";
import AIQueryPage from "./pages/AIQuery";
import SettingsPage from "./pages/Settings";
import MethodologyPage from "./pages/Methodology";
import LicensePage from "./pages/License";
import ReportsPage from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AthleteProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/explorer" replace />} />
            <Route element={<AppShell />}>
              <Route path="/explorer" element={<ExplorerPage />} />
              <Route path="/athlete/:id" element={<AthleteProfilePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/ai-query" element={<AIQueryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="/license" element={<LicensePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AthleteProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
