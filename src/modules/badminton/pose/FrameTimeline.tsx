// ─── Frame Timeline — Visual strip of extracted frames ────────────────────
import React from "react";
import { cn } from "@/lib/utils";
import type { ExtractedFrame } from "./videoExtractor";

interface FrameTimelineProps {
  frames: ExtractedFrame[];
  selectedIndex: number;
  onSelectFrame: (index: number) => void;
}

export function FrameTimeline({ frames, selectedIndex, onSelectFrame }: FrameTimelineProps) {
  if (frames.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          Frame Timeline ({frames.length} frames)
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Hit Frame
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pose OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> No Pose
          </span>
        </div>
      </div>

      {/* Wrist speed graph */}
      <div className="relative h-8 bg-muted/30 rounded overflow-hidden">
        {frames.map((f, i) => {
          const maxSpeed = Math.max(...frames.map((fr) => fr.wristSpeed), 1);
          const barH = (f.wristSpeed / maxSpeed) * 100;
          return (
            <button
              key={i}
              onClick={() => onSelectFrame(i)}
              className={cn(
                "absolute bottom-0 transition-all hover:opacity-80",
                i === selectedIndex ? "opacity-100" : "opacity-60"
              )}
              style={{
                left: `${(i / frames.length) * 100}%`,
                width: `${Math.max(100 / frames.length - 0.5, 2)}%`,
                height: `${Math.max(barH, 4)}%`,
                backgroundColor: f.isHitFrame
                  ? "#ef4444"
                  : f.pose && f.pose.score > 0.3
                  ? "#22c55e"
                  : "#9ca3af40",
              }}
              title={`${f.timestamp.toFixed(1)}s${f.isHitFrame ? " (Hit)" : ""}`}
            />
          );
        })}
        {/* Selection indicator */}
        <div
          className="absolute top-0 bottom-0 border-2 border-primary rounded pointer-events-none transition-all"
          style={{
            left: `${(selectedIndex / frames.length) * 100}%`,
            width: `${Math.max(100 / frames.length, 3)}%`,
          }}
        />
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-thin">
        {frames.map((f, i) => (
          <button
            key={i}
            onClick={() => onSelectFrame(i)}
            className={cn(
              "flex-shrink-0 relative rounded overflow-hidden transition-all border-2",
              i === selectedIndex
                ? "border-primary ring-1 ring-primary/30 scale-105"
                : "border-transparent hover:border-muted-foreground/30"
            )}
            style={{ width: 48, height: 36 }}
          >
            <img
              src={f.imageSrc}
              alt={`Frame ${i}`}
              className="w-full h-full object-cover"
            />
            {/* Hit frame indicator */}
            {f.isHitFrame && (
              <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white" />
            )}
            {/* No pose indicator */}
            {(!f.pose || f.pose.score < 0.3) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[8px] text-white/80">✕</span>
              </div>
            )}
            {/* Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[7px] text-white text-center leading-tight py-px">
              {f.timestamp.toFixed(1)}s
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
