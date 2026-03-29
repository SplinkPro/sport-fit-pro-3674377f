// ─── Pose Results v3 — Coach-First + Technical Deep-Dive ─────────────────
import React, { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BiomechanicsResult } from "./biomechanics";
import type { ClassificationResult, ShotPhase } from "./shotClassifier";
import type { ReferenceModel } from "./referenceModels";
import { CoachSummary } from "./CoachSummary";
import { cn } from "@/lib/utils";

interface PoseResultsProps {
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
  playerLabel?: string;
}

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

type Tab = "coach" | "technical" | "comparison";

export function PoseResults({ classification, biomechanics, reference, playerLabel }: PoseResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("coach");
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
              <div className="text-xs opacity-90 font-medium">Form Score / 100</div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-lg">{reference?.icon ?? "🏸"}</span>
                <span className="text-base font-bold">{shotType}</span>
              </div>
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
                  <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${cat.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
        {[
          { key: "coach" as Tab, label: "📋 Coach View", desc: "Summary & drills" },
          { key: "technical" as Tab, label: "📐 Technical", desc: "Angles & data" },
          { key: "comparison" as Tab, label: "📊 Analysis", desc: "Charts & scores" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-md transition-all",
              activeTab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div>{t.label}</div>
            <div className="text-[9px] font-normal opacity-70">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* COACH VIEW — Plain language, actionable */}
      {activeTab === "coach" && (
        <CoachSummary
          classification={classification}
          biomechanics={biomechanics}
          reference={reference}
          playerLabel={playerLabel}
        />
      )}

      {/* TECHNICAL VIEW — Angle measurements by body group */}
      {activeTab === "technical" && (
        <div className="space-y-2">
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

          {/* Shot classification transparency */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">🔬 Classification Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-muted-foreground">{reasoning}</p>
              {allScores.length > 1 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground">All shot probabilities:</p>
                  {allScores.slice(0, 5).map((s, i) => (
                    <div key={s.type} className="flex items-center gap-2 text-[10px]">
                      <div className="w-20 text-right font-medium">{s.type}</div>
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", i === 0 ? "bg-primary" : "bg-muted-foreground/30")}
                          style={{ width: `${s.score * 100}%` }}
                        />
                      </div>
                      <span className="w-8 tabular-nums text-muted-foreground">{Math.round(s.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidence */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
            <span>📏</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${metricConfidence * 100}%` }} />
            </div>
            <span className="tabular-nums">{Math.round(metricConfidence * 100)}%</span>
            <span>({metrics.length}/9 joints)</span>
          </div>
        </div>
      )}

      {/* ANALYSIS VIEW — Radar chart + reference */}
      {activeTab === "comparison" && (
        <div className="space-y-3">
          {radarData.length >= 3 && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold">Biomechanical Profile vs Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
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

          {/* Metric heat map */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">📊 Metric Heat Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1.5">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className={cn(
                      "p-2 rounded-lg text-center border transition-colors",
                      m.severity === "excellent" ? "bg-emerald-500/10 border-emerald-200" :
                      m.severity === "good" ? "bg-lime-500/10 border-lime-200" :
                      m.severity === "needs-work" ? "bg-amber-500/10 border-amber-200" :
                      "bg-red-500/10 border-red-200"
                    )}
                  >
                    <div className={cn("text-lg font-black tabular-nums", SEVERITY_COLORS[m.severity])}>{m.value}</div>
                    <div className="text-[9px] text-muted-foreground font-medium mt-0.5">{m.shortLabel}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reference model key points */}
          {reference && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">
                  📖 {reference.label} — Pro Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground mb-2">{reference.description}</p>
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
