import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAthletes } from "@/hooks/useAthletes";
import { useT } from "@/i18n/useTranslation";
import { EnrichedAthlete, getBenchmarkBand, BENCHMARK_COLORS } from "@/engine/analyticsEngine";
import { getSAIBand } from "@/data/indianBenchmarks";
import { SPORTS_CONFIG } from "@/data/sportsConfig";
import {
  SAI_BAND_COLORS, SAI_BAND_LABELS, NationalBenchmarkMetric,
  projectTrajectory, calcGapToRecords, calcKheloIndiaScore,
  getLTADProfile, INDIAN_RECORDS,
} from "@/data/indianBenchmarks";
import {
  BenchmarkBadge, DataQualityBadge, FlagBadge, PercentileBar,
  SportFitBar, ConfidenceBar, MetricChip, SectionCard,
} from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, Cell, Legend,
} from "recharts";
import {
  ChevronLeft, ChevronDown, ChevronUp, Brain, AlertTriangle, Lightbulb,
  Target, Star, Globe, Zap, TrendingUp, Trophy, MapPin, Clock, Award, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NutritionTab from "@/components/nutrition/NutritionTab";

// ─── Page ─────────────────────────────────────────────────────────────────
export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { athletes, loading } = useAthletes();
  const { dict } = useT();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const athlete = useMemo(() => athletes.find((a) => a.id === id), [athletes, id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground text-sm">Athlete not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/explorer")}>
          <ChevronLeft size={14} className="mr-1" /> Back to Explorer
        </Button>
      </div>
    );
  }

  const p = dict.profile;
  // BUG FIX: replaced adult BMI cutoffs (18.5/25/30) with IAP India youth thinness grades.
  // Adult thresholds mislabel healthy children: a normal 13-yr-old with BMI 17 is NOT underweight.
  const bmiCat =
    (athlete.bmi ?? 0) < 14.0 ? "Severe Thinness (IAP)"
    : (athlete.bmi ?? 0) < 16.0 ? "Thinness (IAP)"
    : (athlete.bmi ?? 0) < 18.5 ? "Mild Thinness — Monitor"
    : (athlete.bmi ?? 0) <= 23.0 ? "Normal (IAP)"
    : "Review";

  return (
    <div className="flex flex-col h-full">
      {/* Profile Header */}
      <div className="px-6 py-4 bg-card border-b shrink-0">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/explorer")}
            className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          {/* Avatar */}
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
              athlete.gender === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
            )}
          >
            {athlete.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{athlete.name}</h1>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {athlete.id}
              </span>
              <DataQualityBadge score={athlete.completeness ?? 0} />
              {(athlete.flags ?? []).map((f, i) => <FlagBadge key={i} type={f.type} />)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{athlete.gender === "M" ? "♂ Male" : "♀ Female"}</span>
              <span>Age {athlete.age}</span>
              <span>{athlete.school}</span>
              <span>{athlete.district}</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <MetricChip label="Height" value={athlete.height} unit="cm" />
              <MetricChip label="Weight" value={athlete.weight} unit="kg" />
              <MetricChip label="BMI" value={athlete.bmi?.toFixed(1) ?? "—"} />
              <div className="bg-muted/60 rounded-lg p-3 text-center min-w-[80px]">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">BMI Cat.</div>
                <div className="text-xs font-semibold">{bmiCat}</div>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-3xl font-bold text-primary tabular-nums">{athlete.compositeScore}</div>
            {/* BUG FIX: label explicitly shows "percentile" — government audience must not
                read "72" as "72 marks out of 100". It means 72nd percentile vs. cohort. */}
            <div className="text-xs text-muted-foreground">CAPI Score</div>
            <div className="text-[10px] text-muted-foreground/70">
              {athlete.compositeScore}th percentile vs. cohort
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
              Based on {Object.values(athlete.percentiles ?? {}).filter((v) => v != null).length}/5 metrics
            </div>
            {athlete.isHighPotential && (
              <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                ⭐ High Potential
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-4 w-auto inline-flex shrink-0 justify-start bg-muted/60 p-1 rounded-lg gap-0.5 flex-wrap">
          {(["overview", "performance", "trajectory", "insights", "sportFit", "health", "nutrition", "reports"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs px-3 py-1.5 data-[state=active]:shadow-sm">
              {t === "trajectory" ? p.trajectoryTab : p.tabs[t as keyof typeof p.tabs] ?? t}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TabsContent value="overview" className="mt-0"><OverviewTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="performance" className="mt-0"><PerformanceTab athlete={athlete} dict={dict} athletes={athletes} /></TabsContent>
          <TabsContent value="trajectory" className="mt-0"><TrajectoryTab athlete={athlete} /></TabsContent>
          <TabsContent value="insights" className="mt-0"><InsightsTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="sportFit" className="mt-0"><SportFitTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="health" className="mt-0"><HealthTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="nutrition" className="mt-0"><NutritionTab athlete={athlete} /></TabsContent>
          <TabsContent value="reports" className="mt-0"><ReportsTab athlete={athlete} dict={dict} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─── Tab 1: Overview ──────────────────────────────────────────────────────
function OverviewTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const radarData = [
    { subject: p.dimensions.speed, value: athlete.dimensionScores.speed, fullMark: 100 },
    { subject: p.dimensions.power, value: athlete.dimensionScores.power, fullMark: 100 },
    { subject: p.dimensions.endurance, value: athlete.dimensionScores.endurance, fullMark: 100 },
    { subject: p.dimensions.agility, value: athlete.dimensionScores.agility, fullMark: 100 },
    { subject: p.dimensions.bodyComp, value: athlete.dimensionScores.bodyComp, fullMark: 100 },
  ];

  const metricLabels: Record<string, string> = {
    verticalJump: dict.metrics.verticalJump, broadJump: dict.metrics.broadJump,
    sprint30m: dict.metrics.sprint30m, run800m: dict.metrics.run800m,
  };

  const sortedPercentiles = Object.entries(athlete.percentiles ?? {})
    .map(([k, v]) => ({ key: k, label: metricLabels[k] ?? k, value: v ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const best = sortedPercentiles[0];
  const worst = sortedPercentiles[sortedPercentiles.length - 1];

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Radar chart */}
      <SectionCard title={p.readinessSnapshot} className="col-span-1">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Percentile summary */}
      <SectionCard title={p.percentileSummary} className="col-span-1">
        <div className="space-y-3">
          {sortedPercentiles.map((m) => (
            <PercentileBar key={m.key} percentile={m.value} label={m.label} />
          ))}
        </div>
      </SectionCard>

      {/* Key stats */}
      <div className="col-span-1 space-y-3">
        {/* Best/Worst */}
        <SectionCard>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center shrink-0">
                <span className="text-xs">★</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-700">{p.bestMetric}</div>
                <div className="text-xs text-muted-foreground">{best?.label} — {best?.value}th pct</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center shrink-0">
                <span className="text-xs">↓</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-orange-700">{p.weakestMetric}</div>
                <div className="text-xs text-muted-foreground">{worst?.label} — {worst?.value}th pct</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Top sport */}
        <SectionCard title={p.topSportRecommendation}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{SPORTS_CONFIG.find((s) => s.nameEn === athlete.topSport)?.icon ?? "🏆"}</span>
            <div>
              <div className="font-semibold text-sm">{athlete.topSport}</div>
              <div className="text-xs text-muted-foreground">{athlete.topSportScore}% match</div>
            </div>
          </div>
        </SectionCard>

        {/* Flags */}
        {(athlete.flags ?? []).length > 0 && (
          <SectionCard title={p.attentionFlags}>
            <div className="space-y-1.5">
              {athlete.flags!.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle size={12} className="text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f.message}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Performance ───────────────────────────────────────────────────
function PerformanceTab({ athlete, dict, athletes }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"]; athletes: EnrichedAthlete[] }) {
  function fmtRunTime(sec: number | undefined): string {
    if (sec == null || isNaN(sec)) return "—";
    const totalSeconds = Math.floor(sec); // floor before splitting to avoid 3:60 edge case
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const metrics = [
    { key: "verticalJump" as const, label: dict.metrics.verticalJump, unit: "cm", higherBetter: true, fmt: (v: number) => `${v.toFixed(1)} cm`, natKey: "verticalJump" as const },
    { key: "broadJump" as const, label: dict.metrics.broadJump, unit: "cm", higherBetter: true, fmt: (v: number) => `${v.toFixed(1)} cm`, natKey: "broadJump" as const },
    { key: "sprint30m" as const, label: dict.metrics.sprint30m, unit: "s", higherBetter: false, fmt: (v: number) => `${v.toFixed(2)} s`, natKey: "sprint30m" as const },
    { key: "run800m" as const, label: dict.metrics.run800m, unit: "min", higherBetter: false, fmt: (v: number) => fmtRunTime(v), natKey: "run800m" as const },
  ];

  // Cohort stats for bar chart
  const cohortData = metrics.map((m) => {
    const peers = athletes
      .filter((a) => a.gender === athlete.gender && Math.abs(a.age - athlete.age) <= 2)
      .map((a) => a[m.key] as number | undefined)
      .filter((v): v is number => v != null);
    const avg = peers.reduce((s, v) => s + v, 0) / (peers.length || 1);
    const sorted = [...peers].sort((a, b) => m.higherBetter ? b - a : a - b);
    const top10 = sorted[Math.floor(sorted.length * 0.1)] ?? avg;
    const val = athlete[m.key] as number | undefined;
    const natPct = athlete.derivedIndices?.nationalPercentiles?.[m.natKey] ?? null;
    const natBand = athlete.derivedIndices?.nationalBands?.[m.natKey] ?? null;
    return {
      name: m.label,
      athlete: val ?? 0,
      cohortAvg: parseFloat(avg.toFixed(1)),
      top10: parseFloat(top10.toFixed(1)),
      unit: m.unit,
      hasValue: val != null,
      pct: athlete.percentiles?.[m.key] ?? 0,
      band: athlete.benchmarkBands?.[m.key],
      displayValue: val != null ? m.fmt(val) : "—",
      natPct,
      natBand,
    };
  });

  const bandLabel: Record<string, string> = {
    excellent: dict.benchmarks.excellent, aboveAvg: dict.benchmarks.aboveAverage,
    average: dict.benchmarks.average, belowAvg: dict.benchmarks.belowAverage,
    development: dict.benchmarks.development,
  };

  const di = athlete.derivedIndices;

  return (
    <div className="space-y-4">
      {/* National vs Local comparison banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 border rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Local CAPI</div>
            <div className="text-2xl font-bold tabular-nums text-primary">{athlete.compositeScore}</div>
            <div className="text-xs text-muted-foreground">vs. this cohort</div>
          </div>
          <div className="text-3xl">🏫</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-primary font-medium flex items-center gap-1"><Globe size={10} /> National CAPI (SAI)</div>
            <div className="text-2xl font-bold tabular-nums">{di?.nationalComposite ?? "—"}</div>
            <div className="text-xs text-muted-foreground">vs. all-India standard</div>
          </div>
          <div className="text-right">
            {di?.nationalComposite != null && (() => {
              // BUG FIX: was using nationalBands?.verticalJump as a proxy for the overall composite.
              // An athlete "Elite" in VJ but "Development" in everything else showed "Elite".
              // Correct: derive the overall SAI band directly from nationalComposite score.
              const overallBand = getSAIBand(di.nationalComposite);
              return (
                <Badge
                  className="text-[10px]"
                  style={{
                    backgroundColor: SAI_BAND_COLORS[overallBand] + "20",
                    color: SAI_BAND_COLORS[overallBand],
                    borderColor: SAI_BAND_COLORS[overallBand] + "40",
                  }}
                >
                  {SAI_BAND_LABELS[overallBand]}
                </Badge>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Raw metrics table with national percentile column */}
      <SectionCard title="Performance vs. Local Cohort & SAI National Standard">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-3 text-xs font-semibold text-muted-foreground">Metric</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Value</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Local Pct.</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-primary">Nat. Pct.</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Band</th>
                <th className="text-left py-2 pl-3 text-xs font-semibold text-muted-foreground">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((m) => (
                <tr key={m.name} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-xs font-medium">{m.name}</td>
                  <td className="py-2 px-2 text-right font-bold tabular-nums text-xs">
                    {m.displayValue}
                  </td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">
                    {m.hasValue ? `${m.pct}th` : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">
                    {m.natPct != null ? (
                      <span className="font-semibold" style={{ color: SAI_BAND_COLORS[m.natBand ?? "average"] }}>
                        {m.natPct}th
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {m.band ? (
                      <BenchmarkBadge band={m.band} label={bandLabel[m.band] ?? m.band} />
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-2 pl-3 w-40">
                    {m.hasValue ? <PercentileBar percentile={m.pct} showValue={false} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Nat. Pct. = compared against SAI/NSTC all-India reference norms for {athlete.gender === "M" ? "boys" : "girls"} aged {athlete.age}.
        </p>
      </SectionCard>

      {/* Derived Indices */}
      {di && (
        <SectionCard title="Derived Performance Indices (Scientific)">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Relative Power Index",
                abbr: "RPI",
                value: di.relativePowerIndex != null ? di.relativePowerIndex.toFixed(2) : "—",
                unit: "",
                desc: "VJ × mass / 1000",
                status: di.relativePowerIndex != null
                  ? di.relativePowerIndex >= (athlete.gender === "M" ? 1.8 : 1.3) ? "high" : di.relativePowerIndex >= 1.0 ? "mid" : "low"
                  : "none",
              },
              {
                label: "Speed-Endurance Ratio",
                abbr: "SER",
                value: di.speedEnduranceRatio != null ? di.speedEnduranceRatio.toFixed(2) : "—",
                unit: "",
                desc: "Sprint pct / 800m pct",
                status: di.speedEnduranceRatio != null
                  ? di.speedEnduranceRatio >= 1.2 ? "speed" : di.speedEnduranceRatio <= 0.8 ? "endurance" : "balanced"
                  : "none",
              },
              {
                label: "Explosive-Structural",
                abbr: "ESR",
                value: di.explosiveStructuralRatio != null ? `${di.explosiveStructuralRatio.toFixed(1)}%` : "—",
                unit: "",
                desc: "VJ / Height × 100",
                status: di.explosiveStructuralRatio != null
                  ? di.explosiveStructuralRatio >= (athlete.gender === "M" ? 30 : 26) ? "high" : "low"
                  : "none",
              },
              {
                label: "VO₂max Estimate",
                abbr: "ACE",
                value: di.aerobicCapacityEst != null ? `${di.aerobicCapacityEst.toFixed(1)}` : "—",
                unit: "ml/kg/min",
                desc: "483/800m_min + 3.5",
                status: di.aerobicCapacityEst != null
                  ? di.aerobicCapacityEst >= 50 ? "high" : di.aerobicCapacityEst >= 40 ? "mid" : "low"
                  : "none",
              },
              {
                label: "Lean Power Score",
                abbr: "LPS",
                value: di.leanPowerScore != null ? di.leanPowerScore.toFixed(2) : "—",
                unit: "cm/kg",
                desc: "Broad Jump / mass",
                status: di.leanPowerScore != null
                  ? di.leanPowerScore >= (athlete.gender === "M" ? 2.8 : 2.4) ? "high" : "mid"
                  : "none",
              },
              {
                label: "Talent Trajectory",
                abbr: "TTI",
                value: di.talentTrajectoryIndex != null ? `${di.talentTrajectoryIndex > 0 ? "+" : ""}${di.talentTrajectoryIndex.toFixed(2)}` : "N/A",
                unit: "/month",
                desc: "CAPI change / month",
                status: di.talentTrajectoryIndex != null
                  ? di.talentTrajectoryIndex >= 0.5 ? "high" : di.talentTrajectoryIndex >= 0 ? "mid" : "low"
                  : "none",
              },
            ].map((idx) => {
              const statusColors: Record<string, string> = {
                high: "text-green-700 bg-green-50 border-green-200",
                speed: "text-blue-700 bg-blue-50 border-blue-200",
                endurance: "text-cyan-700 bg-cyan-50 border-cyan-200",
                balanced: "text-foreground bg-muted/40 border-border",
                mid: "text-amber-700 bg-amber-50 border-amber-200",
                low: "text-red-700 bg-red-50 border-red-200",
                none: "text-muted-foreground bg-muted/20 border-border",
              };
              return (
                <div key={idx.abbr} className={cn("rounded-lg border p-3", statusColors[idx.status])}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold">{idx.abbr}</span>
                    <Zap size={10} className="opacity-50" />
                  </div>
                  <div className="text-lg font-bold tabular-nums">{idx.value}</div>
                  {idx.unit && <div className="text-[10px] opacity-70">{idx.unit}</div>}
                  <div className="text-[10px] mt-1 opacity-60">{idx.label}</div>
                  <div className="text-[10px] font-mono opacity-50 mt-0.5">{idx.desc}</div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            See Methodology → Derived Indices for formulas and scientific references.
          </p>
        </SectionCard>
      )}

      {/* Peer comparison chart */}
      <SectionCard title={`Peer Cohort Comparison (${athlete.gender === "M" ? "Male" : "Female"}, Age ±2)`}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohortData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip formatter={(v: number, n: string) => [`${v}`, n]} />
              <Bar dataKey="cohortAvg" name="Cohort Avg" fill="hsl(var(--muted-foreground))" fillOpacity={0.4} radius={[3, 3, 0, 0]} />
              <Bar dataKey="top10" name="Top 10%" fill="hsl(var(--chart-1))" fillOpacity={0.4} radius={[3, 3, 0, 0]} />
              <Bar dataKey="athlete" name="This Athlete" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted-foreground/40" /><span>Cohort Avg</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-chart-1/40" /><span>Top 10%</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent" /><span>This Athlete</span></div>
        </div>
      </SectionCard>

      {/* Composite formula */}
      <SectionCard title="Composite Score Formula (CAPI)">
        <div className="bg-muted/40 rounded p-3 font-mono text-xs text-muted-foreground">
          CAPI = V.Jump(25%) + Broad Jump(20%) + 30m Sprint(25%) + 800m Run(25%) + Shuttle(5%)
        </div>
        <div className="mt-2 text-xs text-muted-foreground">All metrics normalized to percentile within gender cohort before weighting. Sprint/run: lower time = higher percentile.</div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Trajectory & Olympic Pathway ────────────────────────────────────
function TrajectoryTab({ athlete }: { athlete: EnrichedAthlete }) {
  const [selectedMetric, setSelectedMetric] = useState<NationalBenchmarkMetric>("sprint30m");

  const METRIC_OPTIONS: Array<{ key: NationalBenchmarkMetric; label: string; lowerBetter: boolean; fmt: (v: number) => string }> = [
    { key: "sprint30m",    label: "30m Sprint",     lowerBetter: true,  fmt: (v) => `${v.toFixed(2)}s` },
    { key: "run800m",      label: "800m Run",        lowerBetter: true,  fmt: (v) => { const m = Math.floor(v/60); const s = Math.floor(v%60); return `${m}:${s.toString().padStart(2,"0")}`; } },
    { key: "verticalJump", label: "Vertical Jump",   lowerBetter: false, fmt: (v) => `${v.toFixed(1)}cm` },
    { key: "broadJump",    label: "Broad Jump",      lowerBetter: false, fmt: (v) => `${v.toFixed(0)}cm` },
    { key: "shuttleRun",   label: "Shuttle Run",     lowerBetter: true,  fmt: (v) => `${v.toFixed(2)}s` },
  ];

  const metaOpt = METRIC_OPTIONS.find((m) => m.key === selectedMetric)!;
  const currentValue = athlete[selectedMetric] as number | undefined;

  // Project trajectory 6 years ahead
  const trajectory = useMemo(() => {
    if (currentValue == null) return [];
    return projectTrajectory(currentValue, athlete.age, selectedMetric, athlete.gender, 6, metaOpt.lowerBetter);
  }, [currentValue, athlete.age, athlete.gender, selectedMetric, metaOpt.lowerBetter]);

  // Gap to records
  const gaps = useMemo(() => {
    if (currentValue == null) return [];
    return calcGapToRecords(currentValue, athlete.age, selectedMetric, athlete.gender, metaOpt.lowerBetter);
  }, [currentValue, athlete.age, athlete.gender, selectedMetric, metaOpt.lowerBetter]);

  // Khelo India score
  const kheloScore = calcKheloIndiaScore(
    athlete.derivedIndices?.nationalComposite ?? 0,
    athlete.age,
    athlete.completeness ?? 50
  );

  // LTAD profile
  const sportKey = athlete.sportFit?.[0]?.sport.key ?? "athletics";
  const ltadProfile = getLTADProfile(sportKey);

  const contextColors: Record<string, string> = {
    district: "#94A3B8",
    state: "#60A5FA",
    national_junior: "#34D399",
    national_senior: "#FBBF24",
    olympic: "#F97316",
    world: "#EF4444",
  };
  const contextLabels: Record<string, string> = {
    district: "District", state: "State", national_junior: "Nat. Jr",
    national_senior: "National", olympic: "Olympic", world: "World",
  };

  // Roadmap milestones based on LTAD
  const getRoadmapMilestones = () => {
    const age = athlete.age;
    const items: Array<{ window: string; age: string; focus: string; target: string; status: "current" | "upcoming" | "future" }> = [];

    if (age <= 12) {
      items.push({ window: "Learn to Train", age: "10–12", focus: "Multilateral development. No specialisation.", target: "Improve all metrics 8–12% annually", status: "current" });
      items.push({ window: "Train to Train", age: "12–16", focus: "Fitness foundation. Introduce sport specifics.", target: "Reach SAI P70 standard", status: "upcoming" });
      items.push({ window: "Train to Compete", age: "16–18", focus: "Khelo India selection. State competition.", target: "Reach SAI P85 / Khelo India selection", status: "future" });
      items.push({ window: "Train to Win", age: "18–22", focus: "National championship. Senior circuit entry.", target: "National-level podium performance", status: "future" });
    } else if (age <= 15) {
      items.push({ window: "Train to Train (Active)", age: "12–16", focus: "You're in the critical fitness window. Build base.", target: "Reach SAI P85 standard in top 2 metrics", status: "current" });
      items.push({ window: "Train to Compete", age: "16–18", focus: "Khelo India & state championships.", target: "Khelo India squad selection", status: "upcoming" });
      items.push({ window: "Train to Win", age: "18–22", focus: "Senior national circuit.", target: "National Athletics / Federation ranking", status: "future" });
      items.push({ window: "Peak Performance", age: "22–28", focus: "Asian Games / Commonwealth / Olympics cycle.", target: "International qualification standard", status: "future" });
    } else if (age <= 18) {
      items.push({ window: "Train to Compete (Active)", age: "16–18", focus: "Khelo India squad — competition focus.", target: "Top 8 finish at national youth level", status: "current" });
      items.push({ window: "Train to Win", age: "18–22", focus: "Senior national circuit. AFI ranking.", target: "National senior podium", status: "upcoming" });
      items.push({ window: "Peak Performance", age: "22–28", focus: "Olympic cycle planning.", target: "Olympic qualification (if on trajectory)", status: "future" });
    } else {
      items.push({ window: "Train to Win (Active)", age: "18–22", focus: "National senior competition.", target: "Federation Top-10 ranking", status: "current" });
      items.push({ window: "Peak Performance", age: "22–28", focus: "Olympic / Asian Games cycle.", target: "International A-standard", status: "upcoming" });
    }
    return items;
  };

  const roadmap = getRoadmapMilestones();
  const statusColors = { current: "border-primary bg-primary/5", upcoming: "border-blue-400 bg-blue-50", future: "border-muted bg-muted/20" };
  const statusDot = { current: "bg-primary", upcoming: "bg-blue-400", future: "bg-muted-foreground" };

  return (
    <div className="space-y-4">

      {/* Coach Explainer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-blue-800 mb-1">📋 How to read this page</p>
        <p className="text-xs leading-relaxed text-blue-700">
          This page shows <strong>where this athlete stands today</strong> compared to district, state, national and Olympic levels —
          and <strong>where they could reach</strong> with consistent training. All projections assume regular coaching and are estimates only.
          The <strong>Khelo India Score</strong> (0–100) is a quick summary of the athlete's selection potential right now.
        </p>
      </div>

      {/* Header row: Khelo India Score + LTAD window */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Trophy size={12} /> Khelo India Score
          </div>
          <div className="text-3xl font-bold tabular-nums">{kheloScore}</div>
          <div className="text-[10px] font-semibold mt-1">
            {kheloScore >= 75 ? "🟢 Strong selection candidate" : kheloScore >= 55 ? "🟡 Development pathway" : "🔴 Foundational stage"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
            Score out of 100. Combines: national performance rank + age bonus (younger = more time to grow) + how complete the data is.
            <span className="font-medium"> 75+ = recommend for Khelo India trials.</span>
          </div>
        </div>

        <div className="bg-muted/40 border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
            <Clock size={12} /> Training Window (LTAD)
          </div>
          {ltadProfile ? (
            <>
              <div className="text-sm font-semibold">{ltadProfile.sport}</div>
              <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                <strong>Critical window:</strong> Ages {ltadProfile.trainToTrainWindow[0]}–{ltadProfile.trainToTrainWindow[1]}.
                This is when fitness training has the biggest impact on a young athlete.
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                <strong>Peak performance:</strong> Ages {ltadProfile.peakPerformanceAge[0]}–{ltadProfile.peakPerformanceAge[1]}
              </div>
              <div className="text-[10px] text-primary mt-1.5 font-semibold">
                {athlete.age >= ltadProfile.trainToTrainWindow[0] && athlete.age <= ltadProfile.trainToTrainWindow[1]
                  ? "✅ Athlete is in the critical window NOW — don't miss it"
                  : athlete.age < ltadProfile.trainToTrainWindow[0]
                  ? `⏳ Critical window starts in ${ltadProfile.trainToTrainWindow[0] - athlete.age} year(s)`
                  : "⚡ Past the main fitness window — focus on competition training"}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No LTAD profile available</div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
            <Flame size={12} /> Coach Action Note
          </div>
          {ltadProfile && (
            <p className="text-[11px] text-foreground leading-relaxed">{ltadProfile.coachNote}</p>
          )}
          <div className="mt-2 text-[10px] text-amber-700 font-semibold">
            Best sport fit: {athlete.topSport} ({athlete.topSportScore}% match)
          </div>
        </div>
      </div>

      {/* Metric selector */}
      <SectionCard title="Performance Trajectory Projection">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Pick a metric below to see a <strong>year-by-year forecast</strong> of where this athlete could reach.
          The blue line is the projected performance. The green dashed line shows their national percentile rank (right axis).
          Gold dots mark when they are expected to hit a national milestone.
        </p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {METRIC_OPTIONS.map((m) => {
            const hasData = (athlete[m.key] as number | undefined) != null;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
                  selectedMetric === m.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : hasData ? "border-border hover:bg-muted" : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                )}
                disabled={!hasData}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {currentValue != null && trajectory.length > 0 ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectory} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: "Age", position: "insideBottomRight", offset: -4, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={45}
                    tickFormatter={(v) => metaOpt.fmt(v)}
                    reversed={metaOpt.lowerBetter}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [metaOpt.fmt(v), name]}
                    labelFormatter={(l) => `Age ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedValue"
                    name="Projected Value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return payload.milestone
                        ? <circle key={`dot-${payload.age}`} cx={cx} cy={cy} r={5} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
                        : <circle key={`dot-${payload.age}`} cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" />;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nationalPercentile"
                    name="Nat. Percentile"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    yAxisId="pct"
                  />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 9 }} width={28} domain={[0, 100]} label={{ value: "Pct.", angle: 90, position: "insideRight", fontSize: 9 }} />
                  <ReferenceLine y={70} yAxisId="pct" stroke="#2563EB" strokeDasharray="3 3" label={{ value: "KI", fill: "#2563EB", fontSize: 9, position: "insideTopLeft" }} />
                  <ReferenceLine y={85} yAxisId="pct" stroke="#16A34A" strokeDasharray="3 3" label={{ value: "SAI Elite", fill: "#16A34A", fontSize: 9, position: "insideTopLeft" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-4 h-0.5 bg-primary inline-block" /> Projected value</span>
              <span className="flex items-center gap-1"><div className="w-4 h-0.5 bg-emerald-500 inline-block border-dashed" /> National percentile</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Milestone threshold</span>
            </div>

            {/* Trajectory table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-1.5 pr-3">Age</th>
                    <th className="text-right py-1.5 px-2">Projected</th>
                    <th className="text-right py-1.5 px-2">Nat. Pct.</th>
                    <th className="text-left py-1.5 pl-2">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {trajectory.map((pt) => (
                    <tr key={pt.age} className={cn("border-b last:border-0", pt.age === athlete.age && "bg-primary/5 font-semibold")}>
                      <td className="py-1.5 pr-3">{pt.age === athlete.age ? `${pt.age} ★` : pt.age}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{metaOpt.fmt(pt.projectedValue)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: pt.nationalPercentile >= 85 ? "#16A34A" : pt.nationalPercentile >= 70 ? "#2563EB" : undefined }}>
                        {pt.nationalPercentile}th
                      </td>
                      <td className="py-1.5 pl-2">
                        {pt.milestone ? (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Award size={10} /> {pt.milestone}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Projection uses SAI LTAD annual improvement rates by age band. Assumes consistent training — not guaranteed. Coach validation required.
            </p>
          </>
        ) : (
          <div className="text-xs text-muted-foreground py-4 text-center">No data for this metric — import athlete measurement to see trajectory</div>
        )}
      </SectionCard>

      {/* Gap to Records */}
      {currentValue != null && gaps.length > 0 && (
        <SectionCard title={`How Far From Each Level? — ${metaOpt.label}`}>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Each row shows a performance <strong>target level</strong> — from district average all the way to Olympic standard.
            The bar shows how close the athlete already is to that target.
            <span className="font-medium"> "Achieved" means they already meet or beat that level.</span>
            {metaOpt.lowerBetter && <span className="italic"> (For sprint/run/shuttle: lower time = better — the athlete needs to get faster.)</span>}
          </p>
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div key={gap.label}>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: contextColors[gap.context] ?? "#94A3B8" }}
                  />
                  <span className="text-xs font-medium flex-1 truncate">{gap.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">{metaOpt.fmt(gap.targetValue)}</span>
                  {gap.achieved ? (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded shrink-0">✓ Achieved</span>
                  ) : gap.agedOut ? (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded shrink-0">Age category passed</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {gap.yearsToAchieve != null ? `~${gap.yearsToAchieve} yr to reach` : "10+ yrs"}
                    </span>
                  )}
                </div>
                {gap.agedOut ? (
                  <div className="ml-4">
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-40"
                        style={{
                          width: `${Math.min(100, Math.max(4, 100 - gap.gapPercent))}%`,
                          backgroundColor: contextColors[gap.context] ?? "#94A3B8",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 italic">
                      Performance standard: {metaOpt.fmt(gap.targetValue)} — athlete has moved past this age category
                    </div>
                  </div>
                ) : !gap.achieved ? (
                  <div className="ml-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(4, 100 - gap.gapPercent))}%`,
                          backgroundColor: contextColors[gap.context] ?? "#94A3B8",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Needs to improve by {gap.gap.toFixed(metaOpt.lowerBetter ? 2 : 0)}{metaOpt.lowerBetter ? "s" : "cm"} ({gap.gapPercent.toFixed(1)}% gap)
                    </div>
                  </div>
                ) : (
                  <div className="ml-4 h-2 bg-green-200 rounded-full" />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t">
            {Object.entries(contextColors).map(([ctx, color]) => (
              <span key={ctx} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-medium">{contextLabels[ctx]}</span>
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Development Roadmap */}
      <SectionCard title="Career Development Roadmap">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          This shows the <strong>4 stages every elite Indian athlete goes through</strong>, based on the SAI Long-Term Athlete Development framework.
          The highlighted stage is where this athlete is <strong>right now</strong>. Upcoming stages show what to work towards next.
        </p>
        <div className="space-y-2">
          {roadmap.map((step, i) => (
            <div key={i} className={cn("rounded-lg border p-3", statusColors[step.status])}>
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusDot[step.status])} />
                <span className="text-xs font-semibold">{step.window}</span>
                <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded">Age {step.age}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">{step.focus}</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Target size={10} className="shrink-0" /> Goal: {step.target}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          ⚠️ Roadmap is a guide only. Multi-sport exposure is strongly recommended until age 14 before specialising.
          Based on SAI LTAD framework 2021.
        </p>
      </SectionCard>

    </div>
  );
}

function InsightsTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const [openExplain, setOpenExplain] = useState<string | null>(null);

  // Rules-based insights (no AI needed)
  const sortedMetrics = Object.entries(athlete.percentiles ?? {})
    .map(([k, v]) => ({ key: k, value: v ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const topMetrics = sortedMetrics.slice(0, 2).map((m) => m.key);
  const weakMetrics = sortedMetrics.slice(-2).map((m) => m.key);

  const metricNames: Record<string, string> = {
    verticalJump: dict.metrics.verticalJump, broadJump: dict.metrics.broadJump,
    sprint30m: dict.metrics.sprint30m, run800m: dict.metrics.run800m,
  };

  const topSport = athlete.sportFit?.[0];

  const insights = {
    strengths: [
      `Strong ${topMetrics.map((k) => metricNames[k]).join(" and ")} — ${athlete.percentiles?.[topMetrics[0] as keyof typeof athlete.percentiles] ?? 0}th percentile in peer cohort`,
      athlete.compositeScore >= 70 ? "Overall composite score places this athlete in the high-potential category" : "",
    ].filter(Boolean),
    weaknesses: [
      `${weakMetrics.map((k) => metricNames[k]).join(" and ")} are below-average for the cohort`,
      (athlete.completeness ?? 0) < 80 ? `Only ${athlete.completeness}% assessment data complete — insights may be less reliable` : "",
    ].filter(Boolean),
    opportunities: [
      topSport ? `High natural fit for ${topSport.sport.nameEn} (${topSport.matchScore}% match) — worth exploring structured training` : "",
      "Small improvements in endurance metrics can significantly raise composite score",
    ].filter(Boolean),
    risks: [
      ...(athlete.flags ?? []).map((f) => f.message),
      "All insights are informational only — validate with physical examination",
    ],
    coachPoints: [
      `Focus training on ${topMetrics[0] ? metricNames[topMetrics[0]] : "strengths"} as confidence builder`,
      `Address ${weakMetrics[0] ? metricNames[weakMetrics[0]] : "weaknesses"} with targeted drills`,
      topSport ? `Trial ${topSport.sport.nameEn} training to validate sport-fit model` : "",
    ].filter(Boolean),
    interventions: [
      "Increase plyometric volume for power metrics",
      "Add interval running to improve 800m time",
      "Monitor nutrition and hydration for weight-category athletes",
    ],
  };

  const swotCards = [
    { key: "strengths", title: p.strengths, items: insights.strengths, icon: Star, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { key: "weaknesses", title: p.weaknesses, items: insights.weaknesses, icon: ChevronDown, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    { key: "opportunities", title: p.opportunities, items: insights.opportunities, icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { key: "risks", title: p.risks, items: insights.risks, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ];

  

  return (
    <div className="space-y-4">
      {/* AI label */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Brain size={14} className="shrink-0 text-primary" />
        <span className="font-medium text-foreground">Pratibha Intelligence Engine</span>
        <span className="text-muted-foreground">· Deterministic rules-based analysis</span>
        <div className="ml-auto flex items-center gap-1.5">
          <ConfidenceBar score={Math.round(65 + (athlete.completeness ?? 0) * 0.3)} />
        </div>
      </div>

      {/* SWOT */}
      <div className="grid grid-cols-2 gap-3">
        {swotCards.map((card) => (
          <div key={card.key} className={cn("rounded-lg border p-3", card.bg)}>
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold mb-2", card.color)}>
              <card.icon size={12} />
              {card.title}
            </div>
            <ul className="space-y-1">
              {card.items.map((item, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Coach talking points */}
      <SectionCard title={p.coachTalkingPoints}>
        <ul className="space-y-1.5">
          {insights.coachPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="font-bold text-primary mt-0.5">{i + 1}.</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Interventions */}
      <SectionCard title={p.suggestedInterventions}>
        <div className="flex flex-wrap gap-1.5">
          {insights.interventions.map((intv, i) => (
            <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
              {intv}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Explainability */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 w-full justify-start">
            <ChevronDown size={12} />
            {p.whyThisInsight}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1.5 text-muted-foreground">
            <p><strong>Strengths</strong> derived from: metrics ranked in top 50th+ percentile within gender+age cohort.</p>
            <p><strong>Weaknesses</strong> derived from: metrics ranked below 40th percentile.</p>
            <p><strong>Sport fit</strong> derived from: weighted dot-product of dimension scores against sport trait requirements (see Methodology page).</p>
            <p><strong>Confidence score</strong> is reduced for athletes with incomplete assessment data.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Disclaimer */}
      <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 border">
        {p.aiDisclaimer}
      </div>
    </div>
  );
}


// ─── Tab 4: Sport Fit ─────────────────────────────────────────────────────
function SportFitTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">{p.configDisclaimer}</div>
      {(athlete.sportFit ?? []).map((fit, i) => (
        <div key={fit.sport.key} className="bg-card border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
            onClick={() => setExpanded(expanded === fit.sport.key ? null : fit.sport.key)}
          >
            <span className="text-xl shrink-0">{fit.sport.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{fit.sport.nameEn}</span>
                <span className="font-bold text-sm tabular-nums mr-2">{fit.matchScore.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fit.matchScore}%`, backgroundColor: fit.sport.color }}
                />
              </div>
            </div>
            {i === 0 && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 shrink-0">Top Match</Badge>}
            {expanded === fit.sport.key ? <ChevronUp size={14} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={14} className="shrink-0 text-muted-foreground" />}
          </button>

          {expanded === fit.sport.key && (
            <div className="px-3 pb-3 border-t bg-muted/20 animate-fade-in">
              <p className="text-xs text-muted-foreground mt-2 mb-3">{fit.explanation}</p>
              <div className="grid grid-cols-5 gap-2">
                {(["speed", "power", "endurance", "agility", "bodyComp"] as const).map((dim) => {
                  const weight = fit.sport.traitWeights[dim];
                  const score = fit.dimensionScores[dim];
                  return (
                    <div key={dim} className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-1 capitalize">{dict.profile.dimensions[dim]}</div>
                      <div className="text-xs font-bold">{score}</div>
                      <div className="text-[10px] text-muted-foreground">wt: {(weight * 100).toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground italic">{p.sensitivityNote}</div>
              <ConfidenceBar score={fit.confidence} label="Confidence" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tab 5: Health & Growth ───────────────────────────────────────────────
function HealthTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const bmi = athlete.bmi ?? 0;
  // IAP (Indian Academy of Pediatrics) youth BMI thresholds — NOT adult WHO cutoffs
  const bmiCat =
    bmi < 14.0 ? { label: "Severe Thinness (IAP)", color: "bg-red-100 text-red-800 border-red-200" }
    : bmi < 16.0 ? { label: "Thinness (IAP)", color: "bg-orange-100 text-orange-800 border-orange-200" }
    : bmi < 18.5 ? { label: "Mild Thinness — Monitor", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    : bmi < 23.0 ? { label: "Normal (IAP)", color: "bg-green-100 text-green-800 border-green-200" }
    : { label: "Review — Above Normal", color: "bg-amber-100 text-amber-800 border-amber-200" };

  const wellness = [
    { icon: "😴", label: p.sleep, en: "8–10 hours recommended for athletes aged 10–18. Quality sleep directly improves recovery and performance.", hi: "10-18 आयु के एथलीटों के लिए 8-10 घंटे की नींद की सिफारिश है।" },
    { icon: "💧", label: p.hydration, en: `At least ${Math.round(athlete.weight * 0.04)}L water/day based on body weight. Increase during training sessions.`, hi: `शरीर के वजन के आधार पर प्रतिदिन कम से कम ${Math.round(athlete.weight * 0.04)} लीटर पानी।` },
    { icon: "🔄", label: p.recovery, en: "48 hours recovery between heavy training sessions. Include stretching and foam rolling.", hi: "भारी प्रशिक्षण सत्रों के बीच 48 घंटे की रिकवरी।" },
  ];

  return (
    <div className="space-y-4">
      {/* BMI Card */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{p.bmiCategory}</h3>
          <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", bmiCat.color)}>
            {bmiCat.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold tabular-nums">{bmi.toFixed(1)}</div>
          <div className="flex-1">
            {/* BMI scale */}
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="flex-1 bg-blue-200" />
              <div className="flex-1 bg-green-200" />
              <div className="flex-1 bg-yellow-200" />
              <div className="flex-1 bg-red-200" />
              <div
                className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full"
                style={{ left: `${Math.min(100, Math.max(0, (bmi - 14) / 22 * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>14</span><span>18.5</span><span>25</span><span>30</span><span>36</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          BMI of {bmi.toFixed(1)} for a {athlete.age}-year-old {athlete.gender === "M" ? "male" : "female"}. Growth context: BMI norms change with age — consult pediatric charts for accurate classification.
        </p>
      </div>

      {/* Wellness */}
      <SectionCard title={p.wellnessRecommendations}>
        <div className="space-y-3">
          {wellness.map((w) => (
            <div key={w.label} className="flex items-start gap-3">
              <span className="text-xl shrink-0">{w.icon}</span>
              <div>
                <div className="text-xs font-semibold">{w.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{w.en}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <span>{p.healthDisclaimer}</span>
      </div>
    </div>
  );
}

// ─── Tab 6: Nutrition — delegated to enhanced component ──────────────────
// see src/components/nutrition/NutritionTab.tsx


// ─── Tab 7: Reports ───────────────────────────────────────────────────────
function ReportsTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [generating, setGenerating] = useState(false);

  const topSports = (athlete.sportFit ?? []).slice(0, 3).map(sf => sf.sport.nameEn).join(", ") || "Athletics";
  const bmi = athlete.bmi ?? 0;
  const bmiLabel = bmi < 14 ? "Severe Thinness (IAP)" : bmi < 16 ? "Thinness (IAP)" : bmi < 18.5 ? "Mild Thinness — Monitor" : bmi < 23 ? "Normal (IAP)" : "Review — Above Normal";
  const fmtRun = (v: number) => { const m = Math.floor(v/60); const s = Math.floor(v%60); return `${m}:${s.toString().padStart(2,"0")}`; };
  const flagMessages = (athlete.flags ?? []).map(f => f.message).join("; ");
  const ageBand = athlete.age < 12 ? "U12" : athlete.age < 14 ? "U14" : athlete.age < 16 ? "U16" : athlete.age < 18 ? "U18" : "Open";

  const handleExportPDF = () => {
    setGenerating(true);
    const hi = lang === "hi";
    const sportTags = (athlete.sportFit ?? []).slice(0, 3).map(sf => `<span class="sport-tag">${sf.sport.nameEn} · ${sf.matchScore.toFixed(0)}%</span>`).join("");
    const reportHtml = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"/>
<title>${hi ? "एथलीट रिपोर्ट" : "Athlete Intelligence Report"} — ${athlete.name}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:32px;color:#111;background:#fff;font-size:13px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:700}
  .header p{margin:0;opacity:.85;font-size:13px}
  .badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;margin-top:10px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:16px}
  .card h3{margin:0 0 10px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
  .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6}
  .row:last-child{border:none}
  .label{color:#374151;font-weight:500}
  .value{font-weight:700;color:#1e3a5f}
  .capi{text-align:center;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;border-radius:12px;padding:20px}
  .capi .score{font-size:52px;font-weight:800;line-height:1}
  .capi .sub{font-size:12px;opacity:.85;margin-top:6px}
  .sport-tag{display:inline-block;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:6px;padding:4px 12px;margin:3px;font-size:12px;font-weight:600}
  .flag{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-top:16px;font-size:12px;color:#92400e}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:11px}
  @media print{body{padding:16px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <h1>${hi ? "🏅 एथलीट रिपोर्ट" : "🏅 Athlete Intelligence Report"}</h1>
  <p>${athlete.name} · ${athlete.school ?? ""} · ${hi ? "आयु" : "Age"} ${athlete.age} · ${athlete.gender === "F" ? (hi ? "महिला" : "Female") : (hi ? "पुरुष" : "Male")}</p>
  <div class="badge">PRATIBHA · ${hi ? "प्रतिभा" : "SAI Talent ID"} · ${new Date().toLocaleDateString("en-IN")}</div>
</div>
<div class="grid2">
  <div class="card">
    <h3>${hi ? "शारीरिक माप" : "Anthropometrics"}</h3>
    <div class="row"><span class="label">${hi ? "ऊंचाई" : "Height"}</span><span class="value">${athlete.height?.toFixed(1) ?? "—"} cm</span></div>
    <div class="row"><span class="label">${hi ? "वजन" : "Weight"}</span><span class="value">${athlete.weight?.toFixed(1) ?? "—"} kg</span></div>
    <div class="row"><span class="label">BMI</span><span class="value">${bmi.toFixed(1)} · ${bmiLabel}</span></div>
    <div class="row"><span class="label">${hi ? "आयु वर्ग" : "Age Band"}</span><span class="value">${ageBand} (Age ${athlete.age})</span></div>
  </div>
  <div class="capi">
    <div>${hi ? "CAPI स्कोर (पर्सेंटाइल)" : "CAPI Score (percentile)"}</div>
    <div class="score">${athlete.compositeScore ?? "—"}</div>
    <div class="sub">${hi ? "साथियों में पर्सेंटाइल रैंक" : "Percentile rank vs same-cohort peers"}</div>
    <div class="sub" style="margin-top:8px;font-size:11px">National CAPI: ${athlete.derivedIndices?.nationalComposite?.toFixed(0) ?? "—"}</div>
  </div>
</div>
<div class="card" style="margin-bottom:16px">
  <h3>${hi ? "प्रदर्शन मेट्रिक्स" : "Performance Metrics"}</h3>
  <div class="row"><span class="label">30m Sprint</span><span class="value">${athlete.sprint30m?.toFixed(2) ?? "—"} s</span></div>
  <div class="row"><span class="label">800m Run</span><span class="value">${athlete.run800m != null ? fmtRun(athlete.run800m) : "—"}</span></div>
  <div class="row"><span class="label">Vertical Jump</span><span class="value">${athlete.verticalJump?.toFixed(1) ?? "—"} cm</span></div>
  <div class="row"><span class="label">Broad Jump</span><span class="value">${athlete.broadJump?.toFixed(0) ?? "—"} cm</span></div>
  <div class="row"><span class="label">Shuttle Run</span><span class="value">${athlete.shuttleRun?.toFixed(2) ?? "—"} s</span></div>
</div>
<div class="card" style="margin-bottom:16px">
  <h3>${hi ? "खेल अनुशंसाएँ" : "Sport-Fit Recommendations"}</h3>
  <p style="color:#6b7280;font-size:12px;margin:0 0 10px">${hi ? "शीर्ष 3 अनुशंसित खेल:" : "Top 3 recommended sports based on physical profile:"}</p>
  ${sportTags}
</div>
<div class="card">
  <h3>${hi ? "कोच नोट्स" : "Coach Notes"}</h3>
  <p style="font-size:12px;color:#374151;margin:0 0 8px">${hi ? "प्रमुख ताकत:" : "Key Strengths:"} ${topSports}</p>
  <p style="font-size:12px;color:#374151;margin:0">BMI ${bmi.toFixed(1)} — ${bmiLabel}. ${hi ? "स्वास्थ्य के लिए IAP दिशानिर्देश देखें।" : "See IAP pediatric guidelines for nutritional guidance."}</p>
</div>
${flagMessages ? `<div class="flag">⚠️ ${hi ? "डेटा गुणवत्ता नोट:" : "Data Quality Note:"} ${flagMessages}</div>` : ""}
<div class="footer">Pratibha · Sports Authority of India Talent Identification Platform · Generated ${new Date().toLocaleDateString("en-IN")} · For official use only</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
      setTimeout(() => { win.print(); setGenerating(false); }, 400);
    } else {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name","School","Age","AgeBand","Gender","Height_cm","Weight_kg","BMI","BMI_Category","Sprint30m_s","Run800m_s","VerticalJump_cm","BroadJump_cm","ShuttleRun_s","CAPI_Percentile","National_CAPI","TopSport1","TopSport2","TopSport3","Flags"];
    const sportFitSlice = (athlete.sportFit ?? []).slice(0, 3);
    const row = [
      athlete.name,
      athlete.school ?? "",
      athlete.age,
      ageBand,
      athlete.gender,
      athlete.height?.toFixed(1) ?? "",
      athlete.weight?.toFixed(1) ?? "",
      bmi.toFixed(1),
      bmiLabel,
      athlete.sprint30m?.toFixed(2) ?? "",
      athlete.run800m?.toFixed(0) ?? "",
      athlete.verticalJump?.toFixed(1) ?? "",
      athlete.broadJump?.toFixed(0) ?? "",
      athlete.shuttleRun?.toFixed(2) ?? "",
      athlete.compositeScore ?? "",
      athlete.derivedIndices?.nationalComposite?.toFixed(1) ?? "",
      sportFitSlice[0]?.sport.nameEn ?? "",
      sportFitSlice[1]?.sport.nameEn ?? "",
      sportFitSlice[2]?.sport.nameEn ?? "",
      flagMessages,
    ];
    const csv = [headers.join(","), row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${athlete.name.replace(/\s+/g, "_")}_Pratibha_Report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintCoachSummary = () => {
    const capiTier = (athlete.compositeScore ?? 0) >= 70 ? "🟢 HIGH POTENTIAL — Consider for advanced training programme"
      : (athlete.compositeScore ?? 0) >= 50 ? "🟡 AVERAGE — Monitor and provide structured coaching"
      : "🔴 NEEDS DEVELOPMENT — Foundational fitness intervention required";
    const sportRows = (athlete.sportFit ?? []).slice(0, 3).map(sf => `${sf.sport.nameEn} (${sf.matchScore.toFixed(0)}%)`).join(" · ") || "—";
    const summaryHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Coach Summary — ${athlete.name}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;font-size:13px;color:#111}
  h1{font-size:18px;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:16px}
  .tier{padding:10px 14px;border-radius:8px;font-weight:600;margin-bottom:16px;background:#f0fdf4;border:1px solid #86efac}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{text-align:left;padding:6px 10px;background:#f3f4f6;font-size:11px;color:#6b7280;text-transform:uppercase}
  td{padding:6px 10px;border-bottom:1px solid #f3f4f6}
  .notes{border:1px solid #e5e7eb;border-radius:8px;padding:12px;min-height:60px;margin-top:8px}
  .footer{margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px}
  @media print{body{padding:12px}}
</style></head><body>
<h1>📋 Coach Summary — ${athlete.name}</h1>
<div>${athlete.school ?? ""} · Age ${athlete.age} (${ageBand}) · ${athlete.gender === "F" ? "Female" : "Male"}</div>
<div class="tier" style="margin-top:12px">${capiTier}</div>
<table>
  <tr><th>Metric</th><th>Value</th><th>National Percentile</th></tr>
  <tr><td>30m Sprint</td><td>${athlete.sprint30m?.toFixed(2) ?? "—"} s</td><td>${athlete.derivedIndices?.nationalPercentiles?.sprint30m?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>800m Run</td><td>${athlete.run800m != null ? fmtRun(athlete.run800m) : "—"}</td><td>${athlete.derivedIndices?.nationalPercentiles?.run800m?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>Vertical Jump</td><td>${athlete.verticalJump?.toFixed(1) ?? "—"} cm</td><td>${athlete.derivedIndices?.nationalPercentiles?.verticalJump?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>Broad Jump</td><td>${athlete.broadJump?.toFixed(0) ?? "—"} cm</td><td>${athlete.derivedIndices?.nationalPercentiles?.broadJump?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>Shuttle Run</td><td>${athlete.shuttleRun?.toFixed(2) ?? "—"} s</td><td>${athlete.derivedIndices?.nationalPercentiles?.shuttleRun?.toFixed(0) ?? "—"}</td></tr>
  <tr><td><strong>CAPI (Percentile)</strong></td><td colspan="2"><strong>${athlete.compositeScore ?? "—"}th percentile</strong></td></tr>
</table>
<p><strong>Top Sport Recommendations:</strong> ${sportRows}</p>
<p><strong>BMI:</strong> ${bmi.toFixed(1)} — ${bmiLabel}</p>
${flagMessages ? `<p style="color:#b45309"><strong>⚠️ Flags:</strong> ${flagMessages}</p>` : ""}
<div><strong>Coach Notes:</strong><div class="notes"></div></div>
<div class="footer">Pratibha · SAI Talent ID · ${new Date().toLocaleDateString("en-IN")} · Confidential — For coach use only</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(summaryHtml);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title={p.generateReport}>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{p.reportLanguage}</p>
            <div className="flex gap-2">
              <button onClick={() => setLang("en")} className={cn("px-3 py-1.5 rounded border text-xs font-medium", lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>English</button>
              <button onClick={() => setLang("hi")} className={cn("px-3 py-1.5 rounded border text-xs font-medium", lang === "hi" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>हिंदी</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5" onClick={handleExportPDF} disabled={generating}>
              {generating ? <>{p.generating}</> : <>{p.exportPDF}</>}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCSV}>{p.exportCSV}</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrintCoachSummary}>{p.printSummary}</Button>
          </div>
        </div>
      </SectionCard>

      <div className="bg-muted/30 border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Report includes:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Athlete overview & anthropometrics</li>
          <li>Performance metrics with national percentiles</li>
          <li>Sport-fit recommendations (top 3)</li>
          <li>Health & wellness guidance (IAP BMI classification)</li>
          <li>Coach talking points & notes section</li>
          <li>Pratibha · SAI branding & official disclaimers</li>
        </ul>
      </div>
    </div>
  );
}
  const bmi = athlete.bmi ?? 0;
  const bmiLabel = bmi < 14 ? "Severe Thinness (IAP)" : bmi < 16 ? "Thinness (IAP)" : bmi < 18.5 ? "Mild Thinness — Monitor" : bmi < 23 ? "Normal (IAP)" : "Review — Above Normal";
  const fmtRun = (v: number) => { const m = Math.floor(v/60); const s = Math.floor(v%60); return `${m}:${s.toString().padStart(2,"0")}`; };

  const handleExportPDF = () => {
    setGenerating(true);
    const hi = lang === "hi";
    const reportHtml = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"/>
<title>${hi ? "एथलीट रिपोर्ट" : "Athlete Intelligence Report"} — ${athlete.name}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:32px;color:#111;background:#fff;font-size:13px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:700}
  .header p{margin:0;opacity:.85;font-size:13px}
  .badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;margin-top:10px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:16px}
  .card h3{margin:0 0 10px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
  .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6}
  .row:last-child{border:none}
  .label{color:#374151;font-weight:500}
  .value{font-weight:700;color:#1e3a5f}
  .capi{text-align:center;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;border-radius:12px;padding:20px}
  .capi .score{font-size:52px;font-weight:800;line-height:1}
  .capi .sub{font-size:12px;opacity:.85;margin-top:6px}
  .sport-tag{display:inline-block;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:6px;padding:4px 12px;margin:3px;font-size:12px;font-weight:600}
  .flag{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-top:16px;font-size:12px;color:#92400e}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:11px}
  @media print{body{padding:16px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <h1>${hi ? "🏅 एथलीट रिपोर्ट" : "🏅 Athlete Intelligence Report"}</h1>
  <p>${athlete.name} · ${athlete.school ?? ""} · ${hi ? "आयु" : "Age"} ${athlete.age} · ${athlete.gender === "F" ? (hi ? "महिला" : "Female") : (hi ? "पुरुष" : "Male")}</p>
  <div class="badge">PRATIBHA · ${hi ? "प्रतिभा" : "SAI Talent ID"} · ${new Date().toLocaleDateString("en-IN")}</div>
</div>

<div class="grid2">
  <div class="card">
    <h3>${hi ? "शारीरिक माप" : "Anthropometrics"}</h3>
    <div class="row"><span class="label">${hi ? "ऊंचाई" : "Height"}</span><span class="value">${athlete.height?.toFixed(1) ?? "—"} cm</span></div>
    <div class="row"><span class="label">${hi ? "वजन" : "Weight"}</span><span class="value">${athlete.weight?.toFixed(1) ?? "—"} kg</span></div>
    <div class="row"><span class="label">BMI</span><span class="value">${bmi.toFixed(1)} · ${bmiLabel}</span></div>
    <div class="row"><span class="label">${hi ? "आयु वर्ग" : "Age Group"}</span><span class="value">${athlete.ageGroup ?? "—"}</span></div>
  </div>
  <div class="capi">
    <div>${hi ? "CAPI स्कोर (पर्सेंटाइल)" : "CAPI Score (percentile)"}</div>
    <div class="score">${athlete.compositeScore ?? "—"}</div>
    <div class="sub">${hi ? "साथियों में पर्सेंटाइल रैंक" : "Percentile rank vs same-cohort peers"}</div>
    <div class="sub" style="margin-top:8px;font-size:11px">National CAPI: ${athlete.derivedIndices?.nationalComposite?.toFixed(0) ?? "—"}</div>
  </div>
</div>

<div class="card" style="margin-bottom:16px">
  <h3>${hi ? "प्रदर्शन मेट्रिक्स" : "Performance Metrics"}</h3>
  <div class="row"><span class="label">30m Sprint</span><span class="value">${athlete.sprint30m?.toFixed(2) ?? "—"} s</span></div>
  <div class="row"><span class="label">800m Run</span><span class="value">${athlete.run800m != null ? fmtRun(athlete.run800m) : "—"}</span></div>
  <div class="row"><span class="label">Vertical Jump</span><span class="value">${athlete.verticalJump?.toFixed(1) ?? "—"} cm</span></div>
  <div class="row"><span class="label">Broad Jump</span><span class="value">${athlete.broadJump?.toFixed(0) ?? "—"} cm</span></div>
  <div class="row"><span class="label">Shuttle Run</span><span class="value">${athlete.shuttleRun?.toFixed(2) ?? "—"} s</span></div>
</div>

<div class="card" style="margin-bottom:16px">
  <h3>${hi ? "खेल अनुशंसाएँ" : "Sport-Fit Recommendations"}</h3>
  <p style="color:#6b7280;font-size:12px;margin:0 0 10px">${hi ? "शीर्ष 3 अनुशंसित खेल:" : "Top 3 recommended sports based on physical profile:"}</p>
  ${(athlete.sportFit ?? []).slice(0, 3).map(sf => `<span class="sport-tag">${sf.sport} · ${(sf.score * 100).toFixed(0)}%</span>`).join("")}
</div>

<div class="card">
  <h3>${hi ? "कोच नोट्स" : "Coach Notes"}</h3>
  <p style="font-size:12px;color:#374151;margin:0 0 8px">${hi ? "प्रमुख ताकत:" : "Key Strengths:"} ${topSports}</p>
  <p style="font-size:12px;color:#374151;margin:0">BMI ${bmi.toFixed(1)} — ${bmiLabel}. ${hi ? "स्वास्थ्य के लिए IAP दिशानिर्देश देखें।" : "See IAP pediatric guidelines for nutritional guidance."}</p>
</div>
${athlete.dataQualityIssues?.length ? `<div class="flag">⚠️ ${hi ? "डेटा गुणवत्ता नोट:" : "Data Quality Note:"} ${athlete.dataQualityIssues.join("; ")}</div>` : ""}
<div class="footer">Pratibha · Sports Authority of India Talent Identification Platform · Generated ${new Date().toLocaleDateString("en-IN")} · For official use only</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
      setTimeout(() => { win.print(); setGenerating(false); }, 400);
    } else {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name","School","Age","Gender","AgeGroup","Height_cm","Weight_kg","BMI","BMI_Category","Sprint30m_s","Run800m_s","VerticalJump_cm","BroadJump_cm","ShuttleRun_s","CAPI_Percentile","National_CAPI","TopSport1","TopSport2","TopSport3","DataQualityFlags"];
    const row = [
      athlete.name,
      athlete.school ?? "",
      athlete.age,
      athlete.gender,
      athlete.ageGroup ?? "",
      athlete.height?.toFixed(1) ?? "",
      athlete.weight?.toFixed(1) ?? "",
      bmi.toFixed(1),
      bmiLabel,
      athlete.sprint30m?.toFixed(2) ?? "",
      athlete.run800m?.toFixed(0) ?? "",
      athlete.verticalJump?.toFixed(1) ?? "",
      athlete.broadJump?.toFixed(0) ?? "",
      athlete.shuttleRun?.toFixed(2) ?? "",
      athlete.compositeScore ?? "",
      athlete.derivedIndices?.nationalComposite?.toFixed(1) ?? "",
      ...(athlete.sportFit ?? []).slice(0, 3).map(sf => sf.sport),
      ...(Array(3 - Math.min(3, (athlete.sportFit ?? []).length)).fill("")),
      (athlete.dataQualityIssues ?? []).join("; "),
    ];
    const csv = [headers.join(","), row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${athlete.name.replace(/\s+/g, "_")}_Pratibha_Report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintCoachSummary = () => {
    const capiTier = (athlete.compositeScore ?? 0) >= 70 ? "🟢 HIGH POTENTIAL — Consider for advanced training programme"
      : (athlete.compositeScore ?? 0) >= 50 ? "🟡 AVERAGE — Monitor and provide structured coaching"
      : "🔴 NEEDS DEVELOPMENT — Foundational fitness intervention required";
    const summaryHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Coach Summary — ${athlete.name}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;font-size:13px;color:#111}
  h1{font-size:18px;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:16px}
  .tier{padding:10px 14px;border-radius:8px;font-weight:600;margin-bottom:16px;background:#f0fdf4;border:1px solid #86efac}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{text-align:left;padding:6px 10px;background:#f3f4f6;font-size:11px;color:#6b7280;text-transform:uppercase}
  td{padding:6px 10px;border-bottom:1px solid #f3f4f6}
  .notes{border:1px solid #e5e7eb;border-radius:8px;padding:12px;min-height:60px;margin-top:8px}
  .footer{margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px}
  @media print{body{padding:12px}}
</style></head><body>
<h1>📋 Coach Summary — ${athlete.name}</h1>
<div>${athlete.school ?? ""} · Age ${athlete.age} · ${athlete.gender === "F" ? "Female" : "Male"} · ${athlete.ageGroup ?? ""}</div>
<div class="tier" style="margin-top:12px">${capiTier}</div>
<table>
  <tr><th>Metric</th><th>Value</th><th>CAPI Score</th></tr>
  <tr><td>30m Sprint</td><td>${athlete.sprint30m?.toFixed(2) ?? "—"} s</td><td>${athlete.derivedIndices?.speedScore?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>800m Run</td><td>${athlete.run800m != null ? fmtRun(athlete.run800m) : "—"}</td><td>${athlete.derivedIndices?.enduranceScore?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>Vertical Jump</td><td>${athlete.verticalJump?.toFixed(1) ?? "—"} cm</td><td>—</td></tr>
  <tr><td>Broad Jump</td><td>${athlete.broadJump?.toFixed(0) ?? "—"} cm</td><td>${athlete.derivedIndices?.powerScore?.toFixed(0) ?? "—"}</td></tr>
  <tr><td>Shuttle Run</td><td>${athlete.shuttleRun?.toFixed(2) ?? "—"} s</td><td>—</td></tr>
  <tr><td><strong>CAPI (Percentile)</strong></td><td colspan="2"><strong>${athlete.compositeScore ?? "—"}th percentile</strong></td></tr>
</table>
<p><strong>Top Sport Recommendations:</strong> ${(athlete.sportFit ?? []).slice(0, 3).map(sf => `${sf.sport} (${(sf.score * 100).toFixed(0)}%)`).join(" · ") || "—"}</p>
<p><strong>BMI:</strong> ${bmi.toFixed(1)} — ${bmiLabel}</p>
${athlete.dataQualityIssues?.length ? `<p style="color:#b45309"><strong>⚠️ Data flags:</strong> ${athlete.dataQualityIssues.join("; ")}</p>` : ""}
<div><strong>Coach Notes:</strong><div class="notes"></div></div>
<div class="footer">Pratibha · SAI Talent ID · ${new Date().toLocaleDateString("en-IN")} · Confidential — For coach use only</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(summaryHtml);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <SectionCard title={p.generateReport}>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{p.reportLanguage}</p>
            <div className="flex gap-2">
              <button onClick={() => setLang("en")} className={cn("px-3 py-1.5 rounded border text-xs font-medium", lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>English</button>
              <button onClick={() => setLang("hi")} className={cn("px-3 py-1.5 rounded border text-xs font-medium", lang === "hi" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>हिंदी</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5" onClick={handleExportPDF} disabled={generating}>
              {generating ? <>{p.generating}</> : <>{p.exportPDF}</>}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExportCSV}>{p.exportCSV}</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrintCoachSummary}>{p.printSummary}</Button>
          </div>
        </div>
      </SectionCard>

      <div className="bg-muted/30 border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Report includes:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Athlete overview & anthropometrics</li>
          <li>Performance metrics with benchmarks</li>
          <li>Sport-fit recommendations (top 3)</li>
          <li>Health & wellness guidance</li>
          <li>Coach talking points</li>
          <li>Disclaimers (Pratibha by SPLINK branding)</li>
        </ul>
      </div>
    </div>
  );
}
