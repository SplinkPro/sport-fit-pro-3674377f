// ─── Badminton Module Shell — Shared Layout ──────────────────────────────────
// Wraps all 5 badminton screens with a consistent module header + nav tabs.
// Zero dependencies on the main PRATIBHA codebase except shared layout.

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { label: "Dashboard",  path: "/sports/badminton",             exact: true,  icon: "⚡" },
  { label: "Explorer",   path: "/sports/badminton/explorer",    exact: false, icon: "🔍" },
  { label: "Analytics",  path: "/sports/badminton/analytics",   exact: false, icon: "📊" },
  { label: "Import",     path: "/sports/badminton/import",      exact: false, icon: "⬆" },
  { label: "Glossary",   path: "/sports/badminton/glossary",    exact: false, icon: "📖" },
];

export function BadmintonShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string, exact: boolean) =>
    exact ? pathname === path : pathname.startsWith(path);

  // Hide shell nav when on athlete profile (has its own back-nav)
  const onProfile = pathname.includes("/athlete/");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Module Header ───────────────────────────────────────────────── */}
      <div
        className="px-5 pt-5 pb-0 text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #1A5C38 0%, #0d3d25 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏸</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight leading-tight">
                  BADMINTON INTELLIGENCE
                </h1>
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded border"
                  style={{ color: "#D4A017", borderColor: "#D4A01770" }}
                >
                  BETA
                </span>
              </div>
              <p className="text-xs opacity-70 font-medium">
                Gopichand Academy Methodology · PGBA Hyderabad
              </p>
            </div>
          </div>
          {onProfile && (
            <button
              onClick={() => navigate("/sports/badminton/explorer")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              ← Back to Explorer
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        {!onProfile && (
          <div className="flex gap-0.5">
            {NAV_TABS.map((tab) => {
              const active = isActive(tab.path, tab.exact);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Page Content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
