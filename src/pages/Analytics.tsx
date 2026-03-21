import React, { useState, useMemo } from "react";
import { useAthletes } from "@/hooks/useAthletes";
import { useT } from "@/i18n/useTranslation";
import { buildCohortStats, METRIC_KEYS, detectOutliers } from "@/engine/analyticsEngine";
import { KPICard, PageHeader, SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { Users, TrendingUp, Star, CheckCircle2, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsPage() {
  const { athletes, loading, datasetMeta } = useAthletes();
  const { dict } = useT();
  const [view, setView] = useState<"executive" | "analyst">("executive");

  const a = dict.analytics;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={a.title}
        actions={
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setView("executive")}
              className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors", view === "executive" ? "bg-background shadow-sm" : "hover:bg-background/50")}
            >
              {a.executiveView}
            </button>
            <button
              onClick={() => setView("analyst")}
              className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors", view === "analyst" ? "bg-background shadow-sm" : "hover:bg-background/50")}
            >
              {a.analystView}
            </button>
          </div>
        }
      />

      {view === "executive" ? (
        <ExecutiveDashboard athletes={athletes} dict={dict} />
      ) : (
        <AnalystDashboard athletes={athletes} dict={dict} />
      )}
    </div>
  );
}

// ─── Executive Dashboard ───────────────────────────────────────────────────
function ExecutiveDashboard({ athletes, dict }: { athletes: ReturnType<typeof useAthletes>["athletes"]; dict: ReturnType<typeof useT>["dict"] }) {
  const a = dict.analytics;

  const maleCount = athletes.filter((a) => a.gender === "M").length;
  const femaleCount = athletes.filter((a) => a.gender === "F").length;
  const highPotential = athletes.filter((a) => a.isHighPotential).length;
  const avgComp = Math.round(athletes.reduce((s, a) => s + (a.completeness ?? 0), 0) / Math.max(athletes.length, 1));

  // Derive "assessments this month" — falls back to total athlete count when no assessmentDate field is present.
  const now = new Date();
  const thisMonthCount = athletes.filter((at) => {
    const raw = (at as unknown as Record<string, unknown>).assessmentDate;
    if (!raw) return false;
    const d = new Date(raw as string);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const assessmentsValue = thisMonthCount > 0 ? thisMonthCount : athletes.length;
  const assessmentsLabel = thisMonthCount > 0 ? a.kpis.assessmentsThisMonth : a.kpis.totalAthletes;

  const genderData = [
    { name: dict.common.male, value: maleCount },
    { name: dict.common.female, value: femaleCount },
  ];

  const ageBandData = [
    { name: a.ageBands.under12, count: athletes.filter((at) => at.age < 12).length },
    { name: a.ageBands.twelve14, count: athletes.filter((at) => at.age >= 12 && at.age <= 14).length },
    { name: a.ageBands.fifteen17, count: athletes.filter((at) => at.age >= 15 && at.age <= 17).length },
    { name: a.ageBands.eighteenPlus, count: athletes.filter((at) => at.age >= 18).length },
  ];

  // Top sports
  const sportCounts: Record<string, number> = {};
  athletes.forEach((at) => {
    if (at.topSport) sportCounts[at.topSport] = (sportCounts[at.topSport] ?? 0) + 1;
  });
  const topSportsData = Object.entries(sportCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // School leaderboard
  const schoolScores: Record<string, number[]> = {};
  athletes.forEach((at) => {
    if (!schoolScores[at.school]) schoolScores[at.school] = [];
    schoolScores[at.school].push(at.compositeScore);
  });
  const schoolData = Object.entries(schoolScores)
    .map(([name, scores]) => ({ name: name.split(" ").slice(-2).join(" "), avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length), count: scores.length }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label={a.kpis.totalAthletes} value={athletes.length} icon={Users} iconColor="hsl(var(--chart-1))" />
        <KPICard label={a.kpis.maleFemale} value={`${maleCount}/${femaleCount}`} icon={Users} iconColor="hsl(var(--chart-2))" />
        <KPICard label={a.kpis.highPotential} value={`${Math.round(highPotential / athletes.length * 100)}%`} icon={Star} iconColor="hsl(var(--chart-3))" sub={`${highPotential} athletes`} />
        <KPICard label={a.kpis.dataCompleteness} value={`${avgComp}%`} icon={CheckCircle2} iconColor="hsl(var(--chart-4))" />
        <KPICard label={assessmentsLabel} value={assessmentsValue} icon={Activity} iconColor="hsl(var(--chart-5))" />
        <KPICard label={a.kpis.sportFitDist} value={Object.keys(sportCounts).length} icon={BarChart3} iconColor="hsl(var(--primary))" sub="sports covered" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Gender Pie */}
        <SectionCard title={a.charts.genderSplit}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 0.5 }}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Age distribution */}
        <SectionCard title={a.charts.ageDistribution}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBandData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Athletes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Top sports */}
        <SectionCard title={a.charts.topSports}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSportsData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* School Leaderboard */}
      <SectionCard title={a.charts.schoolLeaderboard}>
        <div className="space-y-2">
          {schoolData.map((school, i) => (
            <div key={school.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-medium truncate">{school.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{school.count} athletes · avg {school.avg}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${school.avg}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Analyst Dashboard ─────────────────────────────────────────────────────
function AnalystDashboard({ athletes, dict }: { athletes: ReturnType<typeof useAthletes>["athletes"]; dict: ReturnType<typeof useT>["dict"] }) {
  const a = dict.analytics;
  const [selectedMetric, setSelectedMetric] = useState<"verticalJump" | "broadJump" | "sprint30m" | "run800m">("verticalJump");
  const [xMetric, setXMetric] = useState<"height" | "weight" | "bmi">("height");

  const metricOptions = [
    { key: "verticalJump" as const, label: dict.metrics.verticalJump },
    { key: "broadJump" as const, label: dict.metrics.broadJump },
    { key: "sprint30m" as const, label: dict.metrics.sprint30m },
    { key: "run800m" as const, label: dict.metrics.run800m },
  ];

  // Distribution data for selected metric
  const values = athletes
    .map((at) => at[selectedMetric] as number | undefined)
    .filter((v): v is number => v != null);

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const buckets = 10;
  // Guard against division by zero when all values are identical
  const rawStep = (max - min) / buckets;
  const step = rawStep === 0 ? 1 : rawStep;
  const distData = Array.from({ length: buckets }, (_, i) => {
    const lo = min + i * step;
    const hi = lo + step;
    const maleCount = athletes.filter((at) => {
      const v = at[selectedMetric] as number | undefined;
      return at.gender === "M" && v != null && v >= lo && v < hi;
    }).length;
    const femaleCount = athletes.filter((at) => {
      const v = at[selectedMetric] as number | undefined;
      return at.gender === "F" && v != null && v >= lo && v < hi;
    }).length;
    return { range: `${lo.toFixed(0)}–${hi.toFixed(0)}`, male: maleCount, female: femaleCount };
  });

  // Gender comparison
  const genderCompData = metricOptions.map((m) => {
    const maleVals = athletes.filter((at) => at.gender === "M" && at[m.key] != null).map((at) => at[m.key] as number);
    const femaleVals = athletes.filter((at) => at.gender === "F" && at[m.key] != null).map((at) => at[m.key] as number);
    const maleAvg = maleVals.reduce((s, v) => s + v, 0) / (maleVals.length || 1);
    const femaleAvg = femaleVals.reduce((s, v) => s + v, 0) / (femaleVals.length || 1);
    return { name: m.label.split(" ")[0], male: parseFloat(maleAvg.toFixed(1)), female: parseFloat(femaleAvg.toFixed(1)) };
  });

  // Top 10 performers
  const top10 = [...athletes]
    .filter((at) => at[selectedMetric] != null)
    .sort((a, b) => {
      const va = a[selectedMetric] as number;
      const vb = b[selectedMetric] as number;
      const lowerBetter = selectedMetric === "sprint30m" || selectedMetric === "run800m";
      return lowerBetter ? va - vb : vb - va;
    })
    .slice(0, 10);

  // Scatter: potential vs performance
  const scatterData = athletes.map((at) => ({
    x: at.compositeScore,
    y: at.dimensionScores.speed,
    name: at.name,
    gender: at.gender,
  }));

  // Correlation: xMetric vs selectedMetric
  const correlationData = athletes
    .filter((at) => at[xMetric] != null && at[selectedMetric] != null)
    .map((at) => ({
      x: at[xMetric] as number,
      y: at[selectedMetric] as number,
      gender: at.gender,
    }));

  // Outliers
  const cohortStats: Record<string, ReturnType<typeof buildCohortStats>> = {};
  for (const mk of METRIC_KEYS) {
    cohortStats[mk] = buildCohortStats(athletes, mk);
  }
  const outliers = detectOutliers(athletes, cohortStats as Parameters<typeof detectOutliers>[1]);

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{a.selectMetric}:</span>
        {metricOptions.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              selectedMetric === m.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Distribution */}
        <SectionCard title={a.charts.metricDistribution}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} margin={{ left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="male" name={dict.common.male} stackId="a" fill="hsl(var(--chart-1))" />
                <Bar dataKey="female" name={dict.common.female} stackId="a" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Gender comparison */}
        <SectionCard title={a.charts.genderComparison}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderCompData} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="male" name={dict.common.male} fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="female" name={dict.common.female} fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Composite quadrant scatter */}
        <SectionCard title={a.charts.compositeQuadrant}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: -15, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="x" name="Composite Score" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: "Composite", position: "insideBottom", offset: -5, style: { fontSize: 10 } }} />
                <YAxis type="number" dataKey="y" name="Speed" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <ZAxis range={[20, 20]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [v, n]} />
                <Scatter
                  data={scatterData.filter((d) => d.gender === "M")}
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.7}
                />
                <Scatter
                  data={scatterData.filter((d) => d.gender === "F")}
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Correlation */}
        <SectionCard title={a.charts.correlationExplorer}>
          <div className="flex gap-2 mb-2">
            {(["height", "weight", "bmi"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setXMetric(m)}
                className={cn("px-2 py-1 rounded text-xs border transition-colors", xMetric === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}
              >
                {dict.metrics[m]}
              </button>
            ))}
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: -15, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="x" name={xMetric} tick={{ fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name={selectedMetric} tick={{ fontSize: 10 }} />
                <ZAxis range={[16, 16]} />
                <Tooltip formatter={(v: number, n: string) => [v, n]} />
                <Scatter data={correlationData} fill="hsl(var(--chart-3))" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Top 10 table */}
      <SectionCard title={`${a.charts.topPerformers} — ${metricOptions.find((m) => m.key === selectedMetric)?.label}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">#</th>
                <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">School</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-muted-foreground">Value</th>
                <th className="text-right py-1.5 font-semibold text-muted-foreground">Composite</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((at, i) => (
                <tr key={at.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-1.5 pr-3 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 pr-3 font-medium">{at.name}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{at.school.split(" ").slice(-2).join(" ")}</td>
                  <td className="py-1.5 pr-3 text-right font-bold tabular-nums">{(at[selectedMetric] as number)?.toFixed(1)}</td>
                  <td className="py-1.5 text-right">
                    <span className={cn("font-bold tabular-nums", at.compositeScore >= 70 ? "text-green-600" : "text-yellow-600")}>{at.compositeScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Outlier detection */}
      <SectionCard title={a.charts.outlierDetection}>
        <div className="text-xs text-muted-foreground mb-2">{a.outlierNote}</div>
        {outliers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No outliers detected in current dataset.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Athlete ID</th>
                  <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Metric</th>
                  <th className="text-right py-1.5 pr-3 font-semibold text-muted-foreground">Value</th>
                  <th className="text-right py-1.5 pr-3 font-semibold text-muted-foreground">Z-Score</th>
                  <th className="text-left py-1.5 font-semibold text-muted-foreground">Direction</th>
                </tr>
              </thead>
              <tbody>
                {outliers.map((o, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 font-mono">{o.athleteId}</td>
                    <td className="py-1.5 pr-3">{o.metric}</td>
                    <td className="py-1.5 pr-3 text-right font-bold tabular-nums">{o.value.toFixed(1)}</td>
                    <td className="py-1.5 pr-3 text-right text-orange-600 font-bold tabular-nums">{o.zScore}</td>
                    <td className="py-1.5">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", o.direction === "high" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-blue-100 text-blue-700 border-blue-200")}>
                        {o.direction === "high" ? "↑ High" : "↓ Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
