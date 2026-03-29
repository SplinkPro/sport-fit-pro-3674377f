// ─── Pose Results — Radar Chart + Score Breakdown + Tips ───────────────────
import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BiomechanicsResult } from "./biomechanics";
import type { ClassificationResult } from "./shotClassifier";
import type { ReferenceModel } from "./referenceModels";

interface PoseResultsProps {
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
}

const SHOT_COLORS: Record<string, string> = {
  Smash: "bg-red-500/10 text-red-700 border-red-300",
  "Net Drop": "bg-emerald-500/10 text-emerald-700 border-emerald-300",
  Defense: "bg-blue-500/10 text-blue-700 border-blue-300",
  "Backhand Clear": "bg-purple-500/10 text-purple-700 border-purple-300",
  Unknown: "bg-muted text-muted-foreground border-border",
};

export function PoseResults({ classification, biomechanics, reference }: PoseResultsProps) {
  const { shotType, confidence, reasoning } = classification;
  const { metrics, overallScore, radarData, tips } = biomechanics;

  const scoreColor =
    overallScore >= 80
      ? "text-emerald-600"
      : overallScore >= 60
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-4">
      {/* Shot Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {reference?.icon ?? "🏸"} Shot Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-base px-3 py-1 font-bold ${SHOT_COLORS[shotType] ?? ""}`}
            >
              {shotType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{reasoning}</p>
          {reference && (
            <p className="text-xs text-muted-foreground italic">
              Ref: {reference.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Form Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-black tabular-nums ${scoreColor}`}>
              {overallScore}
            </div>
            <div className="flex-1 space-y-1">
              <Progress value={overallScore} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {overallScore >= 80
                  ? "Excellent technique"
                  : overallScore >= 60
                  ? "Good form, some adjustments needed"
                  : "Significant corrections recommended"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      {radarData.length >= 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Biomechanical Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 9 }}
                  />
                  <Radar
                    name="Ideal"
                    dataKey="ideal"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Athlete"
                    dataKey="athlete"
                    stroke="#1A5C38"
                    fill="#1A5C38"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Joint Angle Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{m.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {m.unit === "ratio"
                    ? `${m.actual.toFixed(1)}× (ideal: ${m.ideal.toFixed(1)}×)`
                    : `${Math.round(m.actual)}° (ideal: ${Math.round(m.ideal)}°)`}
                </span>
              </div>
              <Progress
                value={m.value}
                className={`h-2 ${
                  m.value >= 80
                    ? "[&>div]:bg-emerald-500"
                    : m.value >= 50
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-red-500"
                }`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Coaching Tips */}
      {tips.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">🏋️ Coaching Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className="text-xs flex items-start gap-2 text-muted-foreground"
                >
                  <span className="text-primary mt-0.5">▸</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
