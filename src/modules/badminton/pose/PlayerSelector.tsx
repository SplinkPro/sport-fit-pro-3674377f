// ─── Player Selector — Pick which player to analyze ───────────────────────
import React from "react";
import { cn } from "@/lib/utils";
import type { DetectedPlayer } from "./poseEngine";

interface PlayerSelectorProps {
  players: DetectedPlayer[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  compareMode: boolean;
  onToggleCompare: () => void;
}

const PLAYER_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500"];
const PLAYER_BORDER = [
  "border-emerald-500",
  "border-blue-500",
  "border-amber-500",
  "border-purple-500",
];
const COURT_ICONS: Record<string, string> = {
  near: "📍",
  far: "🏸",
  unknown: "👤",
};

export function PlayerSelector({
  players,
  selectedIdx,
  onSelect,
  compareMode,
  onToggleCompare,
}: PlayerSelectorProps) {
  if (players.length < 2) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          {players.length} Players Detected
        </p>
        {players.length === 2 && (
          <button
            onClick={onToggleCompare}
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
              compareMode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {compareMode ? "✓ Comparing Both" : "⚔ Compare Players"}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {players.map((player, idx) => (
          <button
            key={player.id}
            onClick={() => onSelect(idx)}
            className={cn(
              "flex-1 flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left",
              idx === selectedIdx
                ? `${PLAYER_BORDER[idx % PLAYER_BORDER.length]} bg-card shadow-sm`
                : "border-transparent bg-muted/30 hover:bg-muted/50"
            )}
          >
            {/* Color indicator */}
            <div
              className={cn(
                "w-3 h-3 rounded-full flex-shrink-0",
                PLAYER_COLORS[idx % PLAYER_COLORS.length]
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate flex items-center gap-1">
                <span>{COURT_ICONS[player.courtPosition]}</span>
                <span>Player {idx + 1}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {player.courtPosition === "near"
                  ? "Near Court"
                  : player.courtPosition === "far"
                  ? "Far Court"
                  : "Detected"}
                {" · "}
                {Math.round(player.pose.score * 100)}% confidence
              </div>
            </div>
            {/* Selected checkmark */}
            {idx === selectedIdx && (
              <span className="text-xs text-primary">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
