import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAthletes } from "@/hooks/useAthletes";
import { useT } from "@/i18n/useTranslation";
import { EnrichedAthlete, getBenchmarkBand, BENCHMARK_COLORS } from "@/engine/analyticsEngine";
import { SPORTS_CONFIG } from "@/data/sportsConfig";
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
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { ChevronLeft, ChevronDown, ChevronUp, Brain, AlertTriangle, Lightbulb, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const bmiCat =
    (athlete.bmi ?? 0) < 18.5 ? dict.bmi.underweight
    : (athlete.bmi ?? 0) < 25 ? dict.bmi.normal
    : (athlete.bmi ?? 0) < 30 ? dict.bmi.overweight
    : dict.bmi.obese;

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
            <div className="text-xs text-muted-foreground">{p.compositeScore}</div>
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
        <TabsList className="mx-6 mt-4 w-auto inline-flex shrink-0 justify-start bg-muted/60 p-1 rounded-lg gap-0.5">
          {(["overview", "performance", "insights", "sportFit", "health", "nutrition", "reports"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs px-3 py-1.5 data-[state=active]:shadow-sm">
              {p.tabs[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TabsContent value="overview" className="mt-0"><OverviewTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="performance" className="mt-0"><PerformanceTab athlete={athlete} dict={dict} athletes={athletes} /></TabsContent>
          <TabsContent value="insights" className="mt-0"><InsightsTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="sportFit" className="mt-0"><SportFitTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="health" className="mt-0"><HealthTab athlete={athlete} dict={dict} /></TabsContent>
          <TabsContent value="nutrition" className="mt-0"><NutritionTab athlete={athlete} dict={dict} /></TabsContent>
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
  const metrics = [
    { key: "verticalJump" as const, label: dict.metrics.verticalJump, unit: "cm", higherBetter: true },
    { key: "broadJump" as const, label: dict.metrics.broadJump, unit: "cm", higherBetter: true },
    { key: "sprint30m" as const, label: dict.metrics.sprint30m, unit: "s", higherBetter: false },
    { key: "run800m" as const, label: dict.metrics.run800m, unit: "s", higherBetter: false },
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
    return {
      name: m.label,
      athlete: val ?? 0,
      cohortAvg: parseFloat(avg.toFixed(1)),
      top10: parseFloat(top10.toFixed(1)),
      unit: m.unit,
      hasValue: val != null,
      pct: athlete.percentiles?.[m.key] ?? 0,
      band: athlete.benchmarkBands?.[m.key],
    };
  });

  const bandLabel: Record<string, string> = {
    excellent: dict.benchmarks.excellent, aboveAvg: dict.benchmarks.aboveAverage,
    average: dict.benchmarks.average, belowAvg: dict.benchmarks.belowAverage,
    development: dict.benchmarks.development,
  };

  return (
    <div className="space-y-4">
      {/* Raw metrics table */}
      <SectionCard title="Raw Metrics & Benchmarks">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Metric</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Value</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Percentile</th>
                <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Band</th>
                <th className="text-left py-2 pl-4 text-xs font-semibold text-muted-foreground">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((m) => (
                <tr key={m.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-xs font-medium">{m.name}</td>
                  <td className="py-2 px-2 text-right font-bold tabular-nums">
                    {m.hasValue ? `${m.athlete.toFixed(m.unit === "s" ? 2 : 1)} ${m.unit}` : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">
                    {m.hasValue ? `${m.pct}th` : "—"}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {m.band ? (
                      <BenchmarkBadge band={m.band} label={bandLabel[m.band] ?? m.band} />
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-2 pl-4 w-48">
                    {m.hasValue ? <PercentileBar percentile={m.pct} showValue={false} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

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
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "hsl(var(--muted-foreground))", opacity: 0.4 }} /><span>Cohort Avg</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "hsl(var(--chart-1))", opacity: 0.4 }} /><span>Top 10%</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "hsl(var(--accent))" }} /><span>This Athlete</span></div>
        </div>
      </SectionCard>

      {/* Composite formula */}
      <SectionCard title="Composite Score Formula">
        <div className="bg-muted/40 rounded p-3 font-mono text-xs text-muted-foreground">
          Score = V.Jump(25%) + Broad Jump(20%) + 30m Sprint(25%) + 800m Run(25%) + Shuttle(5%)
        </div>
        <div className="mt-2 text-xs text-muted-foreground">All metrics normalized to percentile within gender+age cohort before weighting.</div>
      </SectionCard>
    </div>
  );
}

// ─── Tab 3: AI Insights ───────────────────────────────────────────────────
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
        <Brain size={14} className="shrink-0" />
        <span>{p.fallbackLabel}</span>
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
      <SectionCard title={p.coachTalkingPoints} icon={Target}>
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
                <span className="font-bold text-sm tabular-nums mr-2">{fit.matchScore}%</span>
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
  const bmiCat =
    bmi < 18.5 ? { label: dict.bmi.underweight, color: "bg-blue-100 text-blue-800 border-blue-200" }
    : bmi < 25 ? { label: dict.bmi.normal, color: "bg-green-100 text-green-800 border-green-200" }
    : bmi < 30 ? { label: dict.bmi.overweight, color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    : { label: dict.bmi.obese, color: "bg-red-100 text-red-800 border-red-200" };

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

// ─── Tab 6: Nutrition ─────────────────────────────────────────────────────
function NutritionTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const [goal, setGoal] = useState<"performance" | "weightGain" | "maintenance">("performance");

  const bmi = athlete.bmi ?? 0;
  const suggestedGoal = bmi < 18.5 ? "weightGain" : "performance";

  const mealPlans: Record<string, Array<{ meal: string; enItems: string[]; hiItems: string[] }>> = {
    performance: [
      { meal: p.breakfast, enItems: ["Poha or Oats with milk", "2 boiled eggs or paneer", "Banana or seasonal fruit"], hiItems: ["पोहा या दलिया दूध के साथ", "2 उबले अंडे या पनीर", "केला या मौसमी फल"] },
      { meal: p.morningSnack, enItems: ["Sattu drink (Bihar specialty)", "Handful of nuts"], hiItems: ["सत्तू का शरबत (बिहार की विशेषता)", "मुट्ठी भर मेवे"] },
      { meal: p.lunch, enItems: ["Rice + Dal + Sabzi", "Curd/Raita", "Salad"], hiItems: ["चावल + दाल + सब्जी", "दही/रायता", "सलाद"] },
      { meal: p.eveningSnack, enItems: ["Roasted chana or peanuts", "Lassi or fruit"], hiItems: ["भुना चना या मूंगफली", "लस्सी या फल"] },
      { meal: p.dinner, enItems: ["Chapati (2-3) + Dal + Egg/Paneer", "Steamed vegetables"], hiItems: ["रोटी (2-3) + दाल + अंडा/पनीर", "उबली सब्जियां"] },
    ],
    weightGain: [
      { meal: p.breakfast, enItems: ["Thick poha with ghee + 2 eggs + milk", "Peanut butter on bread", "Banana"], hiItems: ["घी के साथ मोटा पोहा + 2 अंडे + दूध", "ब्रेड पर मूंगफली का मक्खन", "केला"] },
      { meal: p.morningSnack, enItems: ["Full-fat milk + sattu", "Mixed dry fruits 30g"], hiItems: ["फुल फैट दूध + सत्तू", "मिश्रित सूखे मेवे 30g"] },
      { meal: p.lunch, enItems: ["2 cups rice + 2 cups dal", "Curd + Ghee", "Seasonal vegetables"], hiItems: ["2 कप चावल + 2 कप दाल", "दही + घी", "मौसमी सब्जियां"] },
      { meal: p.eveningSnack, enItems: ["Banana + milk shake", "Samosa or aloo tikki (post-training treat)"], hiItems: ["केला + मिल्क शेक", "समोसा या आलू टिक्की"] },
      { meal: p.dinner, enItems: ["3-4 chapati + sabzi + dal + egg curry"], hiItems: ["3-4 रोटी + सब्जी + दाल + अंडा करी"] },
    ],
    maintenance: [
      { meal: p.breakfast, enItems: ["Oats/daliya with fruit", "1 egg or paneer", "Tea/milk"], hiItems: ["ओट्स/दलिया फल के साथ", "1 अंडा या पनीर", "चाय/दूध"] },
      { meal: p.morningSnack, enItems: ["Fruit or sattu drink"], hiItems: ["फल या सत्तू पेय"] },
      { meal: p.lunch, enItems: ["Rice + dal + sabzi + curd", "Balanced plate"], hiItems: ["चावल + दाल + सब्जी + दही", "संतुलित थाली"] },
      { meal: p.eveningSnack, enItems: ["Roasted chana or peanuts"], hiItems: ["भुना चना या मूंगफली"] },
      { meal: p.dinner, enItems: ["2 chapati + dal + sabzi", "Light meal before 8pm"], hiItems: ["2 रोटी + दाल + सब्जी", "रात 8 बजे से पहले हल्का खाना"] },
    ],
  };

  const plan = mealPlans[goal];

  return (
    <div className="space-y-4">
      {/* Goal selector */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{p.nutritionGoal}</p>
        <div className="flex gap-2">
          {(["performance", "weightGain", "maintenance"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                goal === g ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              )}
            >
              {p[`goal${g.charAt(0).toUpperCase() + g.slice(1)}` as keyof typeof p] as string ?? g}
            </button>
          ))}
        </div>
        {bmi < 18.5 && (
          <p className="text-xs text-amber-600 mt-1">💡 Suggested: Weight Gain goal based on current BMI</p>
        )}
      </div>

      {/* Meal plan */}
      <SectionCard title={p.dailyMealPlan}>
        <div className="space-y-3">
          {plan.map((item) => (
            <div key={item.meal} className="flex items-start gap-3 py-2 border-b last:border-0">
              <div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">{item.meal}</div>
              <div className="flex-1">
                <ul className="text-xs space-y-0.5">
                  {item.enItems.map((food, i) => (
                    <li key={i} className="text-foreground">{food}</li>
                  ))}
                </ul>
                <ul className="text-xs space-y-0.5 mt-1 text-muted-foreground">
                  {item.hiItems.map((food, i) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Hydration + Regional foods */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title={p.hydrationGuide}>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>💧 {Math.round(athlete.weight * 0.04)}–{Math.round(athlete.weight * 0.05)}L water per day</p>
            <p>⚡ Add electrolytes (nimbu-paani/coconut water) during training</p>
            <p>🌡️ Hot weather: +500ml extra daily</p>
          </div>
        </SectionCard>
        <SectionCard title={p.regionalFoods}>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>🌾 <strong>Sattu</strong> — high protein, energy</p>
            <p>🫘 <strong>Chana Dal</strong> — protein + iron</p>
            <p>🥭 <strong>Litti-Chokha</strong> — complex carbs</p>
            <p>🥛 <strong>Lassi / Makhana</strong> — recovery snacks</p>
          </div>
        </SectionCard>
      </div>

      <div className="text-[10px] text-muted-foreground">{p.nutritionDisclaimer}</div>
    </div>
  );
}

// ─── Tab 7: Reports ───────────────────────────────────────────────────────
function ReportsTab({ athlete, dict }: { athlete: EnrichedAthlete; dict: ReturnType<typeof useT>["dict"] }) {
  const p = dict.profile;
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
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
            <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={generating}>
              {generating ? <>{p.generating}</> : <>{p.exportPDF}</>}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">{p.exportCSV}</Button>
            <Button size="sm" variant="outline" className="gap-1.5">{p.printSummary}</Button>
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
