// ─── Badminton Module Router ─────────────────────────────────────────────────
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { BadmintonShell } from "./BadmintonShell";

const BadmintonDashboard = lazy(() => import("./pages/Dashboard"));
const BadmintonExplorer  = lazy(() => import("./pages/Explorer"));
const BadmintonProfile   = lazy(() => import("./pages/AthleteProfile"));
const BadmintonImport    = lazy(() => import("./pages/Import"));
const BadmintonAnalytics = lazy(() => import("./pages/Analytics"));

function ModuleLoader() {
  return (
    <div className="p-6 space-y-4 w-full">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function BadmintonRouter() {
  return (
    <BadmintonShell>
      <Suspense fallback={<ModuleLoader />}>
        <Routes>
          <Route index element={<BadmintonDashboard />} />
          <Route path="explorer" element={<BadmintonExplorer />} />
          <Route path="athlete/:id" element={<BadmintonProfile />} />
          <Route path="import" element={<BadmintonImport />} />
          <Route path="analytics" element={<BadmintonAnalytics />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Suspense>
    </BadmintonShell>
  );
}
