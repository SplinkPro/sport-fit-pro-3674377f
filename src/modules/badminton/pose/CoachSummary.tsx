// ─── Coach & Player Summary — Plain-language actionable insights ──────────
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BiomechanicsResult, CorrectionTip } from "./biomechanics";
import type { ClassificationResult } from "./shotClassifier";
import type { ReferenceModel } from "./referenceModels";
import { cn } from "@/lib/utils";

interface CoachSummaryProps {
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
  playerLabel?: string;
}

// ── Drill recommendations mapped to correction areas ──
const DRILL_MAP: Record<string, { drill: string; duration: string; focus: string }[]> = {
  "Racket Arm Elbow": [
    { drill: "Shadow Swing with Resistance Band", duration: "3 × 15 reps", focus: "Full extension at contact" },
    { drill: "Wall Touch Drill", duration: "5 min", focus: "Reaching maximum contact height" },
  ],
  "Racket Shoulder": [
    { drill: "Shoulder Rotation with Towel", duration: "3 × 20 reps", focus: "Opening shoulder angle" },
    { drill: "Overhead Throw Drill", duration: "4 × 10 throws", focus: "Power through rotation" },
  ],
  "Front Knee Bend": [
    { drill: "Lunge & Hold", duration: "3 × 10 each leg, 3s hold", focus: "Deep controlled lunge" },
    { drill: "Split Step to Lunge", duration: "4 × 8 reps", focus: "Speed + depth in lunge" },
  ],
  "Back Knee": [
    { drill: "Rear Leg Drive Drill", duration: "3 × 12 reps", focus: "Push-off power from back leg" },
  ],
  "Torso Lean": [
    { drill: "Core Plank Variations", duration: "3 × 30s each", focus: "Torso stability under movement" },
    { drill: "Medicine Ball Rotation", duration: "3 × 15 reps", focus: "Controlled forward lean" },
  ],
  "Shoulder-Hip Rotation": [
    { drill: "Rotation Band Pulls", duration: "3 × 15 each side", focus: "Upper-lower body separation" },
    { drill: "Shadow Swing with Pause", duration: "5 min", focus: "Feel the rotation sequence" },
  ],
  "Stance Width": [
    { drill: "Lateral Shuffle Drill", duration: "4 × 30s", focus: "Maintaining wide base" },
    { drill: "Cone Touch Drill", duration: "3 × 45s", focus: "Quick feet, stable base" },
  ],
  "Balance Arm Elbow": [
    { drill: "Non-Racket Arm Awareness Drill", duration: "3 × 10 reps", focus: "Balance arm as counterweight" },
  ],
  "Balance Shoulder": [
    { drill: "Single-Arm Balance Reach", duration: "3 × 10 each side", focus: "Shoulder symmetry" },
  ],
};

function getOverallVerdict(score: number): { emoji: string; label: string; detail: string; color: string } {
  if (score >= 85) return { emoji: "🏆", label: "Elite Form", detail: "Technique matches professional standards. Focus on consistency under pressure.", color: "text-emerald-700" };
  if (score >= 70) return { emoji: "✅", label: "Good Technique", detail: "Solid foundation with minor adjustments needed. 2-3 focused sessions can elevate this.", color: "text-lime-700" };
  if (score >= 55) return { emoji: "⚠️", label: "Developing", detail: "Core mechanics present but significant corrections needed. Prioritize the top 2 issues below.", color: "text-amber-700" };
  return { emoji: "🔴", label: "Needs Attention", detail: "Multiple technique areas require structured correction. Start with fundamentals.", color: "text-red-700" };
}

function getPlayerFeedback(score: number, shotType: string): string {
  if (score >= 85) return `Your ${shotType} technique is excellent! You're hitting the same positions as professional players. Keep drilling to make this your default under match pressure.`;
  if (score >= 70) return `Your ${shotType} is looking solid. A few small adjustments (see below) will make a noticeable difference in power and accuracy.`;
  if (score >= 55) return `Your ${shotType} has the right idea but needs refinement. Focus on the top correction first — it'll have the biggest impact on your game.`;
  return `Your ${shotType} needs some work. Don't worry — the corrections below are specific and actionable. Practice these drills consistently for 2 weeks and re-test.`;
}

export function CoachSummary({ classification, biomechanics, reference, playerLabel }: CoachSummaryProps) {
  const { shotType, phase, confidence } = classification;
  const { overallScore, tips, metrics, handedness } = biomechanics;
  const verdict = getOverallVerdict(overallScore);

  // Top 3 priority corrections
  const topCorrections = tips.filter(t => t.priority > 0).slice(0, 3);

  // Collect relevant drills
  const drills = topCorrections.flatMap(tip => DRILL_MAP[tip.title] ?? []).slice(0, 4);

  // Strengths (metrics scoring 80+)
  const strengths = metrics.filter(m => m.value >= 80).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      {/* ── Coach Quick Verdict ── */}
      <Card className="border-l-4" style={{ borderLeftColor: reference?.color ?? "hsl(var(--primary))" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              📋 Coach Summary
              {playerLabel && <Badge variant="outline" className="text-[9px]">{playerLabel}</Badge>}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {handedness === "left" ? "🫲" : "🫱"} {handedness}-handed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Verdict */}
          <div className="flex items-start gap-3">
            <span className="text-2xl">{verdict.emoji}</span>
            <div>
              <p className={cn("font-bold text-sm", verdict.color)}>{verdict.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{verdict.detail}</p>
            </div>
          </div>

          {/* Shot + Phase context */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 text-xs">
              <span>{reference?.icon ?? "🏸"}</span>
              <span className="font-semibold">{shotType}</span>
              <span className="text-muted-foreground">· {Math.round(confidence * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 text-xs capitalize">
              <span>⏱️</span>
              <span className="font-semibold">{phase}</span>
              <span className="text-muted-foreground">phase</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 text-xs">
              <span>📊</span>
              <span className="font-bold" style={{ color: reference?.color }}>{overallScore}/100</span>
            </div>
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">✅ Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.slice(0, 4).map(s => (
                  <span key={s.label} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200 font-medium">
                    {s.shortLabel} {s.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Action Items (Coach) ── */}
      {topCorrections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">🎯 Top {topCorrections.length} Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topCorrections.map((tip, i) => {
              const metric = metrics.find(m => m.label === tip.title);
              return (
                <div key={i} className="flex gap-3 items-start p-2.5 rounded-lg bg-muted/30">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold",
                    i === 0 ? "bg-red-100 text-red-700" :
                    i === 1 ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{tip.title}</span>
                      {metric && (
                        <span className="text-[9px] tabular-nums text-muted-foreground">
                          {metric.unit === "ratio"
                            ? `${metric.actual.toFixed(1)}× → ${metric.ideal.toFixed(1)}×`
                            : `${Math.round(metric.actual)}° → ${Math.round(metric.ideal)}°`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tip.detail}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Player Feedback ── */}
      <Card className="bg-primary/[0.03] border-primary/20">
        <CardHeader className="pb-1.5">
          <CardTitle className="text-xs font-bold">💬 Player Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed text-foreground/90">
            {getPlayerFeedback(overallScore, shotType)}
          </p>
          {topCorrections.length > 0 && (
            <div className="mt-2 p-2 rounded bg-background border text-[10px] text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">🔑 Your #1 Focus:</p>
              <p>{topCorrections[0].detail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recommended Drills ── */}
      {drills.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">🏋️ Recommended Drills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {drills.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/20">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{d.drill}</p>
                    <p className="text-[10px] text-muted-foreground">{d.focus}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] flex-shrink-0">{d.duration}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reference comparison note ── */}
      {reference && (
        <div className="text-[10px] text-muted-foreground px-1 flex items-center gap-1.5">
          <span>📖</span>
          <span>Compared against <strong>{reference.label}</strong> professional reference model</span>
        </div>
      )}
    </div>
  );
}
