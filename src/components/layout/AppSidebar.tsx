import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users, BarChart3, Search, Upload, FileText, Settings, BookOpen, Shield,
  ChevronLeft, ChevronRight, Zap,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useT } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { key: "explorer", path: "/explorer", icon: Users, labelKey: "nav.explorer" },
  { key: "analytics", path: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
  { key: "aiQuery", path: "/ai-query", icon: Search, labelKey: "nav.aiQuery" },
  { key: "import", path: "/import", icon: Upload, labelKey: "nav.import" },
  { key: "reports", path: "/reports", icon: FileText, labelKey: "nav.reports" },
];

const BOTTOM_NAV = [
  { key: "settings", path: "/settings", icon: Settings, labelKey: "nav.settings" },
  { key: "methodology", path: "/methodology", icon: BookOpen, labelKey: "nav.methodology" },
  { key: "license", path: "/license", icon: Shield, labelKey: "nav.license" },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { dict } = useT();
  const location = useLocation();

  function getLabel(key: string): string {
    const parts = key.split(".");
    let obj: Record<string, unknown> = dict as Record<string, unknown>;
    for (const p of parts) {
      if (obj == null) return key;
      obj = obj[p] as Record<string, unknown>;
    }
    return (obj as unknown as string) ?? key;
  }

  const NavItem = ({ item }: { item: (typeof NAV_ITEMS)[0] }) => {
    const isActive = location.pathname.startsWith(item.path);
    const label = getLabel(item.labelKey);
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-4 border-b border-sidebar-border shrink-0",
          collapsed && "justify-center"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent shrink-0">
          <Zap size={16} className="text-accent-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-sidebar-foreground leading-tight">
              {dict.brand}
            </div>
            <div className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">
              {dict.brandBy}
            </div>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} />
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.key} item={item} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "flex items-center justify-center p-2 border-t border-sidebar-border",
          "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
          collapsed ? "mx-auto w-full" : ""
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : (
          <div className="flex items-center gap-2 text-xs px-1">
            <ChevronLeft size={16} />
            <span>Collapse</span>
          </div>
        )}
      </button>
    </aside>
  );
}
