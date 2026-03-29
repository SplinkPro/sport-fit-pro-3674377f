// ─── Pose Results v2 — Tabbed Layout + Specific Corrections ──────────────
import React, { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BiomechanicsResult, CorrectionTip } from "./biomechanics";
import type { ClassificationResult, ShotPhase } from "./shotClassifier";
import type { ReferenceModel } from "./referenceModels";
import { cn } from "@/lib/utils";

interface PoseResultsProps {
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
}

const PHASE_BADGES: Record<ShotPhase, { label: string; color: string }> = {
  preparation: { label: "Preparation Phase", color: "bg-amber-500/10 text-amber-700 border-amber-300" },
  contact: { label: "Contact Phase", color: "bg-emerald-500/10 text-emerald-700 border-emerald-300" },
  "follow-through": { label: "Follow-Through", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  ready: { label: "Ready Position", color: "bg-purple-500/10 text-purple-700 border-purple-300" },
  unknown: { label: "Unknown Phase", color: "bg-muted text-muted-foreground border-border" },
};

const SEVERITY_COLORS = {
  excellent: "text-emerald-600",
  good: "text-lime-600",
  "needs-work": "text-amber-600",
  critical: "text-red-600",
};

const SEVERITY_BG = {
  excellent: "[&>div]:bg-emerald-500",
  good: "[&>div]:bg-lime-500",
  "needs-work": "[&>div]:bg-amber-500",
  critical: "[&>div]:bg-red-500",
};

type Tab = "summary" | "angles" | "coaching";

export function PoseResults({ classification, biomechanics, reference }: PoseResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const { shotType, phase, confidence, reasoning, allScores } = classification;
  const { metrics, overallScore, armScore, coreScore, legScore, radarData, tips, handedness, confidence: metricConfidence } = biomechanics;

  const scoreBg =
    overallScore >= 80 ? "from-emerald-500 to-emerald-600"
    : overallScore >= 60 ? "from-amber-500 to-amber-600"
    : "from-red-500 to-red-600";

  return (
    <div className="space-y-3">
      {/* ── Score Hero Card ── */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${scoreBg} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black tabular-nums">{overallScore}</div>
              <div className="text-xs opacity-90 font-medium">
                Form Score / 100
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-lg">{reference?.icon ?? "🏸"}</span>
                <span className="text-base font-bold">{shotType}</span>
              </div>
              <Badge variant="outline" className={cn("text-[9px] border-white/40 text-white/90", PHASE_BADGES[phase].color.includes("bg-") ? "" : "")}>
                {PHASE_BADGES[phase].label}
              </Badge>
              <div className="text-[10px] opacity-80">
                {Math.round(confidence * 100)}% confidence · {handedness}-handed
              </div>
            </div>
          </div>

          {/* Category mini-bars */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Arms", score: armScore, icon: "💪" },
              { label: "Core", score: coreScore, icon: "🏋️" },
              { label: "Legs", score: legScore, icon: "🦵" },
            ].map((cat) => (
              <div key={cat.label} className="text-center">
                <div className="text-[10px] opacity-80">{cat.icon} {cat.label}</div>
                <div className="text-sm font-bold">{cat.score}</div>
                <div className="h-1 rounded-full bg-white/20 mt-0.5">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
        {[
          { key: "summary" as Tab, label: "📊 Summary" },
          { key: "angles" as Tab, label: "📐 Angles" },
          { key: "coaching" as Tab, label: "🎯 Coaching" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              activeTab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "summary" && (
        <div className="space-y-3">
          {/* Shot classification details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Shot Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">{reasoning}</p>

              {/* Alternative classifications */}
              {allScores.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {allScores.slice(0, 4).map((s, i) => (
                    <Badge
                      key={s.type}
                      variant={i === 0 ? "default" : "outline"}
                      className="text-[9px]"
                    >
                      {s.type} {Math.round(s.score * 100)}%
                    </Badge>
                  ))}
                </div>
              )}

              {reference && (
                <div className="mt-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">{reference.label} — Reference</p>
                  <p>{reference.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Radar chart */}
          {radarData.length >= 3 && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold">Biomechanical Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Ideal" dataKey="ideal" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.08} strokeDasharray="4 4" />
                      <Radar name="Athlete" dataKey="athlete" stroke={reference?.color ?? "#1A5C38"} fill={reference?.color ?? "#1A5C38"} fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confidence indicator */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
            <span>📏 Measurement confidence:</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${metricConfidence * 100}%` }} />
            </div>
            <span className="tabular-nums">{Math.round(metricConfidence * 100)}%</span>
            <span>({metrics.length}/9 joints measured)</span>
          </div>
        </div>
      )}

      {activeTab === "angles" && (
        <div className="space-y-2">
          {/* Group by category */}
          {(["arm", "core", "leg"] as const).map((cat) => {
            const catMetrics = metrics.filter((m) => m.category === cat);
            if (catMetrics.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-1.5">
                  <CardTitle className="text-xs font-semibold capitalize flex items-center gap-1.5">
                    {cat === "arm" ? "💪" : cat === "core" ? "🏋️" : "🦵"}
                    {cat === "arm" ? "Upper Body" : cat === "core" ? "Core & Torso" : "Lower Body"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {catMetrics.map((m) => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-semibold text-[11px]", SEVERITY_COLORS[m.severity])}>{m.value}</span>
                          <span className="font-medium text-foreground">{m.label}</span>
                        </div>
                        <span className="text-muted-foreground tabular-nums text-[10px]">
                          {m.unit === "ratio"
                            ? `${m.actual.toFixed(1)}× → ${m.ideal.toFixed(1)}×`
                            : `${Math.round(m.actual)}° → ${Math.round(m.ideal)}°`}
                        </span>
                      </div>
                      <Progress value={m.value} className={`h-1.5 ${SEVERITY_BG[m.severity]}`} />
                      <p className="text-[10px] text-muted-foreground pl-0.5">{m.correction}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "coaching" && (
        <div className="space-y-3">
          {/* Priority corrections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">
                {tips.length === 1 && tips[0].priority === 0 ? "✅ Assessment" : "🎯 Priority Corrections"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5",
                    tip.priority > 80 ? "bg-red-100 text-red-700" :
                    tip.priority > 40 ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {tip.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{tip.title}</span>
                      {tip.angleDiff > 0 && (
                        <Badge variant="outline" className="text-[8px] py-0">
                          {Math.round(tip.angleDiff)}° correction
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tip.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key coaching points from reference model */}
          {reference && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">
                  📖 {reference.label} — Key Technique Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {reference.keyCoachingPoints.map((point, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                      <span className="text-primary font-bold mt-px">{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
