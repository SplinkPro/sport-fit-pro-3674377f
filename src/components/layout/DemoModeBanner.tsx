import React, { useState } from "react";
import { X, Zap, Database, BarChart3, Globe } from "lucide-react";
import { CLIENT_CONFIG } from "@/config/clientConfig";
import { cn } from "@/lib/utils";

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!CLIENT_CONFIG.demoMode || dismissed) return null;

  return (
    <div className="bg-accent text-accent-foreground px-4 py-2 flex items-center gap-3 text-xs font-medium shrink-0 border-b border-accent/30">
      <div className="flex items-center gap-1.5">
        <Zap size={12} className="shrink-0" />
        <span className="font-bold">DEMO MODE</span>
      </div>
      <span className="text-accent-foreground/80">·</span>
      <span className="text-accent-foreground/90">
        {CLIENT_CONFIG.demoAthleteCount} sample Bihar athletes loaded
      </span>

      <div className="hidden sm:flex items-center gap-3 ml-2 text-accent-foreground/70">
        <span className="flex items-center gap-1"><Database size={10} />Replace with real CSV data</span>
        <span>·</span>
        <span className="flex items-center gap-1"><BarChart3 size={10} />All analytics are live</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Globe size={10} />EN/HI bilingual</span>
      </div>

      <div className="flex-1" />

      <a
        href="mailto:support@splink.in?subject=Pratibha Platform Enquiry"
        className="hidden sm:inline-flex items-center gap-1.5 bg-accent-foreground/10 hover:bg-accent-foreground/20 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
      >
        Request Live Setup →
      </a>

      <button
        onClick={() => setDismissed(true)}
        className="ml-1 hover:bg-accent-foreground/10 rounded p-0.5 transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
