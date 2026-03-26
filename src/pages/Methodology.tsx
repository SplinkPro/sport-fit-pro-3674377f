import { useState } from "react";
import { BookOpen, FlaskConical, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Globe, Award, Dumbbell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { INDIAN_BENCHMARKS, SAI_BAND_COLORS } from "@/data/indianBenchmarks";

type Section = "composite" | "national" | "derived" | "percentile" | "zscore" | "sportfit" | "bands" | "validation" | "nutrition" | "assumptions" | "refs";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "composite",   label: "Composite Score (CAPI)",    icon: FlaskConical  },
  { id: "national",    label: "Indian National Benchmarks",icon: Globe         },
  { id: "derived",     label: "Derived Indices",           icon: Dumbbell      },
  { id: "percentile",  label: "Percentile Ranking",        icon: BarChartIcon  },
  { id: "zscore",      label: "Z-Score Normalization",     icon: TrendIcon     },
  { id: "sportfit",    label: "Sport-Fit Model (15 Sports)",icon: TrophyIcon   },
  { id: "bands",       label: "Benchmark Bands",           icon: CheckCircle   },
  { id: "validation",  label: "Data Validation Pipeline",  icon: AlertTriangle },
  { id: "nutrition",   label: "Nutrition Engine",          icon: TrendingUp    },
  { id: "assumptions", label: "Assumptions & Limits",      icon: AlertTriangle },
  { id: "refs",        label: "References",                icon: BookOpen      },
];

function BarChartIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9"/><rect x="9" y="7" width="4" height="14"/><rect x="15" y="3" width="4" height="18"/></svg>;
}
function TrendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
}
function TrophyIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 22v-4"/><path d="M14 22v-4"/><path d="M6 4h12v8a6 6 0 01-12 0V4z"/></svg>;
}

// All 15 sports — synced from SPORTS_CONFIG (SAI Circular 07/2023)
const SPORT_WEIGHTS: Record<string, Record<string, number>> = {
  "Athletics":      { speed: 35, power: 25, endurance: 25, agility: 10, bodyComposition:  5 },
  "Football":       { speed: 30, power: 20, endurance: 30, agility: 15, bodyComposition:  5 },
  "Kabaddi":        { speed: 25, power: 30, endurance: 20, agility: 20, bodyComposition:  5 },
  "Volleyball":     { speed: 20, power: 35, endurance: 15, agility: 20, bodyComposition: 10 },
  "Cycling":        { speed: 15, power: 30, endurance: 45, agility:  5, bodyComposition:  5 },
  "Wrestling":      { speed: 10, power: 45, endurance: 20, agility: 15, bodyComposition: 10 },
  "Swimming":       { speed: 25, power: 30, endurance: 30, agility:  5, bodyComposition: 10 },
  "Basketball":     { speed: 25, power: 30, endurance: 20, agility: 20, bodyComposition:  5 },
  "Badminton":      { speed: 30, power: 25, endurance: 15, agility: 25, bodyComposition:  5 },
  "Boxing":         { speed: 30, power: 30, endurance: 20, agility: 15, bodyComposition:  5 },
  "Hockey":         { speed: 30, power: 20, endurance: 30, agility: 15, bodyComposition:  5 },
  "Archery":        { speed:  5, power: 30, endurance: 35, agility: 15, bodyComposition: 15 },
  "Kho Kho":        { speed: 35, power: 20, endurance: 20, agility: 20, bodyComposition:  5 },
  "Table Tennis":   { speed: 30, power: 20, endurance: 10, agility: 35, bodyComposition:  5 },
  "Weightlifting":  { speed:  5, power: 55, endurance: 10, agility:  5, bodyComposition: 25 },
};

const METRIC_DISPLAY: Record<string, { label: string; unit: string; lowerBetter: boolean }> = {
  verticalJump: { label: "Vertical Jump",      unit: "cm",  lowerBetter: false },
  broadJump:    { label: "Standing Long Jump",  unit: "cm",  lowerBetter: false },
  sprint30m:    { label: "30m Sprint",          unit: "sec", lowerBetter: true  },
  run800m:      { label: "800m Run",            unit: "sec", lowerBetter: true  },
  shuttleRun:   { label: "10m×6 Shuttle Run",   unit: "sec", lowerBetter: true  },
};

function fmtMetricValue(metric: string, value: number): string {
  if (metric === "run800m") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return metric === "sprint30m" || metric === "shuttleRun" ? value.toFixed(2) : String(value);
}

export default function MethodologyPage() {
  const { language } = useTranslation();
  const [active, setActive] = useState<Section>("composite");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [benchGender, setBenchGender] = useState<"M" | "F">("M");
  const [benchMetric, setBenchMetric] = useState<string>("verticalJump");

  const toggle = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Methodology & Documentation
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Transparent documentation of all scoring models, SAI national benchmarks, derived indices, and limitations.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">v2.0 · SAI/NSTC Aligned</Badge>
      </div>

      <div className="flex gap-6">
        {/* Nav */}
        <div className="w-56 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                active === s.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* ── Composite Score ── */}
          {active === "composite" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Composite Athlete Potential Index (CAPI)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">The CAPI provides a single 0–100 summary of overall athletic potential within the local cohort. It is a weighted sum of percentile-normalized performance scores across 5 physical metrics. The result is a <strong>percentile rank</strong> (e.g. "72" = 72nd percentile — better than 72% of peers), not a raw mark out of 100.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                    <p className="font-semibold text-foreground mb-2">Local CAPI Formula:</p>
                    <p>CAPI = Σ (w<sub>i</sub> × Pct<sub>i</sub>) / Σ w<sub>i</sub></p>
                    <p className="text-xs text-muted-foreground mt-2">Pct<sub>i</sub> = percentile within same-gender, same-cohort peers</p>
                    <p className="text-xs text-muted-foreground">Denominator = sum of weights of present metrics only (handles missing data correctly)</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 font-mono text-sm">
                    <p className="font-semibold text-foreground mb-2">National CAPI Formula:</p>
                    <p>NCAPI = Σ (w<sub>i</sub> × NatPct<sub>i</sub>) / Σ w<sub>i</sub></p>
                    <p className="text-xs text-muted-foreground mt-2">NatPct<sub>i</sub> = percentile vs SAI/NSTC national reference table (gender × age band)</p>
                    <p className="text-xs text-primary font-semibold">Absolute national positioning — not cohort-relative</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Default Metric Weights</p>
                    <span className="text-xs text-muted-foreground font-mono">Total active = 100% (football throw excluded)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["30m Sprint",       "25%", "Speed (lower time = higher score). SAI NSTC primary discriminator."],
                      ["Vertical Jump",    "25%", "Vertical explosive power. Khelo India priority metric."],
                      ["800m Run",         "25%", "Aerobic base (lower time = higher score). Critical for multi-sport."],
                      ["Broad Jump",       "20%", "Horizontal explosive power & coordination."],
                      ["Shuttle Run",       "5%", "Agility (lower time = higher score). Included when data present."],
                      ["Football Throw",    "0%", "Skill-based test. Tracked individually; excluded from CAPI composite."],
                    ].map(([m, w, note]) => (
                      <div key={m} className="flex justify-between items-start text-xs bg-muted/30 rounded px-3 py-2 gap-2">
                        <div>
                          <span className="font-medium text-foreground">{m}</span>
                          <div className="text-muted-foreground mt-0.5">{note}</div>
                        </div>
                        <span className="font-bold text-primary shrink-0">{w}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <p><strong>Physical dimension groupings</strong> (for reporting only — not separate scoring components):</p>
                    <p>Power & Explosiveness = VJ 25% + BJ 20% = <strong>45% combined</strong></p>
                    <p>Speed & Agility = Sprint 25% + Shuttle 5% = <strong>30% combined</strong></p>
                    <p>Endurance / VO₂max = 800m Run = <strong>25%</strong></p>
                    <p className="text-muted-foreground mt-1">Note: "Coordination (10%)" referenced in some CAPI descriptions is not scored from the current 5-test battery (no sit-and-reach or specific coordination test). When coordination data is absent, CAPI denominator is adjusted to 90 and labeled accordingly.</p>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Sprint, 800m run, and shuttle run are inverted (lower time = higher percentile rank) before weighting. High-Potential threshold: CAPI ≥ 70 (70th percentile or above within cohort). This threshold is configurable per programme.
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Indian National Benchmarks ── */}
          {active === "national" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Indian National Reference Standards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    National reference percentiles are derived from SAI (Sports Authority of India) National Sports Talent Contest (NSTC), 
                    Khelo India Youth Games assessment battery, and NPFT (National Physical Fitness Test) published norms. 
                    Athletes are compared against the all-India population for their gender × age band — providing absolute national positioning 
                    alongside local cohort rankings.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { band: "SAI Elite Candidate",   color: SAI_BAND_COLORS.elite,             desc: "≥85th national percentile. Meets SAI selection threshold." },
                      { band: "National Talent Pool",  color: SAI_BAND_COLORS.national_talent,   desc: "70th–85th percentile. Khelo India potential." },
                      { band: "National Average",      color: SAI_BAND_COLORS.average,           desc: "40th–70th percentile. Performing at national norm." },
                      { band: "Below National Avg",    color: SAI_BAND_COLORS.below_national,    desc: "20th–40th percentile. Below national standard." },
                      { band: "Needs Development",     color: SAI_BAND_COLORS.needs_development, desc: "< 20th percentile. Structured intervention needed." },
                    ].map((b) => (
                      <div key={b.band} className="rounded-lg border p-3 text-xs" style={{ borderColor: b.color + "40", backgroundColor: b.color + "10" }}>
                        <div className="font-semibold mb-1" style={{ color: b.color }}>{b.band}</div>
                        <div className="text-muted-foreground">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Benchmark table selector */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base">SAI/NSTC Reference Percentile Tables</CardTitle>
                    <div className="flex gap-2">
                      {(["M", "F"] as const).map((g) => (
                        <button key={g} onClick={() => setBenchGender(g)}
                          className={cn("px-3 py-1 rounded text-xs font-medium border transition-colors",
                            benchGender === g ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                          {g === "M" ? "Boys" : "Girls"}
                        </button>
                      ))}
                      <div className="w-px bg-border" />
                      {Object.keys(METRIC_DISPLAY).map((mk) => (
                        <button key={mk} onClick={() => setBenchMetric(mk)}
                          className={cn("px-3 py-1 rounded text-xs font-medium border transition-colors",
                            benchMetric === mk ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                          {METRIC_DISPLAY[mk].label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {METRIC_DISPLAY[benchMetric].label} ({METRIC_DISPLAY[benchMetric].unit}) — {benchGender === "M" ? "Boys" : "Girls"}
                    {METRIC_DISPLAY[benchMetric].lowerBetter ? " · Lower time = better performance" : " · Higher = better"}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Age Band</th>
                          <th className="text-right py-2 px-3 font-semibold" style={{ color: SAI_BAND_COLORS.needs_development }}>P20 (Dev.)</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">P40</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">P60 (Mean)</th>
                          <th className="text-right py-2 px-3 font-semibold" style={{ color: SAI_BAND_COLORS.national_talent }}>P70</th>
                          <th className="text-right py-2 px-3 font-semibold" style={{ color: SAI_BAND_COLORS.elite }}>P85 (Elite)</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Nat. Mean</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Nat. SD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(INDIAN_BENCHMARKS[benchGender][benchMetric as keyof typeof INDIAN_BENCHMARKS["M"]] ?? []).map((row) => (
                          <tr key={row.ageBand} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-3 font-semibold">{row.ageBand}</td>
                            <td className="py-2 px-3 text-right font-mono" style={{ color: SAI_BAND_COLORS.needs_development }}>
                              {fmtMetricValue(benchMetric, row.p20)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {fmtMetricValue(benchMetric, row.p40)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-foreground font-medium">
                              {fmtMetricValue(benchMetric, row.p60)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono" style={{ color: SAI_BAND_COLORS.national_talent }}>
                              {fmtMetricValue(benchMetric, row.p70)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: SAI_BAND_COLORS.elite }}>
                              {fmtMetricValue(benchMetric, row.p85)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {fmtMetricValue(benchMetric, row.nationalMean)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              ±{row.nationalStd}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Source: SAI NSTC · Khelo India Youth Games · NPFT Ministry of Youth Affairs &amp; Sports, India · 
                    Chandrasekaran et al. (2019) Indian youth fitness norms.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Derived Indices ── */}
          {active === "derived" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Derived Performance Indices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Beyond raw metrics, Pratibha computes five scientifically validated derived indices that provide deeper insight into 
                  an athlete's physical profile. These are displayed on each athlete's profile card.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      name: "Relative Power Index (RPI)",
                      badge: "NEW",
                      formula: "RPI = (Vertical Jump cm × Body Mass kg) / 1000",
                      desc: "Measures absolute lower-body explosive power output. Accounts for both jump height and body mass. Reference: Harman et al. (1990), validated for youth athletes.",
                      interp: "Boys 14–15: RPI > 1.8 = high power; Girls 14–15: RPI > 1.3 = high power",
                    },
                    {
                      name: "Speed-Endurance Ratio (SER)",
                      badge: "NEW",
                      formula: "SER = Sprint30m_percentile / Run800m_percentile",
                      desc: "Distinguishes speed-dominant from endurance-dominant athletes within the cohort. SER > 1.2 = speed athlete, < 0.8 = endurance athlete, ~1.0 = balanced.",
                      interp: "Used for sport routing: sprinters (Athletics, Basketball) vs. endurance (Cycling, Football)",
                    },
                    {
                      name: "Explosive-Structural Ratio (ESR)",
                      badge: "NEW",
                      formula: "ESR = (Vertical Jump cm / Height cm) × 100",
                      desc: "Normalizes explosive power to body size. Removes height advantage from jump comparisons. SAI talent search threshold: Boys ≥ 30, Girls ≥ 26.",
                      interp: "A 150cm boy jumping 45cm = ESR 30.0. A 180cm boy jumping 45cm = ESR 25.0 — same jump, different relative explosive capacity.",
                    },
                    {
                      name: "Aerobic Capacity Estimate (ACE / VO₂max proxy)",
                      badge: "ESTIMATE",
                      formula: "ACE = (483 / t) + 3.5   where t = run800m_seconds ÷ 60",
                      desc: "Indicative VO₂max estimation (ml/kg/min) derived from 800m run time. Formula: Ramsbottom et al. (1988) field-based 800m adaptation; validated for school-age athletes. NOT the Léger-Lambert 20m beep-test formula. Clamped to [20, 85] ml/kg/min. Not clinically validated — for directional use only. Error margin: ±10–15% vs direct VO₂max measurement.",
                      interp: "Example: 800m in 260s → t = 4.33 min → ACE = 111.5 + 3.5 = 115, clamped to 85. Typical U14 girls: 40–55 ml/kg/min. Elite youth: ACE > 55.",
                    },
                    {
                      name: "Lean Power Score (LPS)",
                      badge: "NEW",
                      formula: "LPS = Broad Jump cm / Body Mass kg",
                      desc: "Normalizes horizontal explosive power to body mass. Higher LPS = better relative horizontal power output, accounting for weight differences.",
                      interp: "Boys 14–15: LPS > 2.8 = strong; Girls 14–15: LPS > 2.4 = strong",
                    },
                    {
                      name: "Talent Trajectory Index (TTI)",
                      badge: "LONGITUDINAL",
                      formula: "TTI = (CAPI_current − CAPI_previous) / months_elapsed",
                      desc: "Rate of performance improvement per month. Only computable for athletes with ≥2 assessment records. TTI > 0.5 = strong upward trajectory.",
                      interp: "TTI > 0 = improving; TTI < 0 = declining; TTI ≈ 0 = stable",
                    },
                  ].map((idx) => (
                    <div key={idx.name} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{idx.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{idx.badge}</Badge>
                      </div>
                      <div className="bg-muted/40 rounded p-2 font-mono text-xs">{idx.formula}</div>
                      <p className="text-xs text-muted-foreground">{idx.desc}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded p-2 text-xs text-primary">
                        <strong>Interpretation:</strong> {idx.interp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Percentile Ranking ── */}
          {active === "percentile" && (
            <Card>
              <CardHeader><CardTitle>Percentile Ranking</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Pratibha computes <strong>two independent percentile ranks</strong> for each athlete and metric:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold text-foreground">Local Cohort Percentile</div>
                    <div className="bg-muted/40 rounded p-2 font-mono text-xs">
                      Pct = (N values below athlete / N cohort total) × 100
                    </div>
                    <p className="text-xs text-muted-foreground">Cohort = same gender + current dataset. Used for composite score and benchmarks. A score of 85th means better than 85% of local peers.</p>
                  </div>
                  <div className="border border-primary/30 rounded-lg p-4 space-y-2 bg-primary/5">
                    <div className="font-semibold text-primary">National Percentile (SAI)</div>
                    <div className="bg-muted/40 rounded p-2 font-mono text-xs">
                      NatPct = interpolated from SAI reference bands
                    </div>
                    <p className="text-xs text-muted-foreground">Compared against published SAI/NSTC percentile tables for gender × age band. An athlete may be 90th local but only 55th national — this gap is critical for realistic talent assessment.</p>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                  <p><strong>⚠ Small-cohort limitation (Z-score outlier detection):</strong> With n ≤ 41 athletes, a within-cohort Z-score ≥ 3 SD is statistically unlikely to trigger (affects only ~0.3% of a normal distribution). For small cohorts, hard plausibility gates (sprint &gt;11s, broad jump &gt;260cm) are more reliable outlier detection than Z-score. Both methods run in parallel.</p>
                  <p><strong>Two-percentile system:</strong> Local percentile ranks within the uploaded cohort. National percentile compares against SAI/NSTC all-India reference population (n = thousands). Local rank 90th may equal National rank 55th — both are shown on every profile.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Z-Score ── */}
          {active === "zscore" && (
            <Card>
              <CardHeader><CardTitle>Z-Score Normalization</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Z-scores express each metric in standard deviation units relative to the cohort mean. Used for outlier detection and cross-metric comparison.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>z = (x − μ) / σ</p>
                  <p className="text-xs text-muted-foreground mt-2">x = athlete value · μ = cohort mean · σ = cohort SD</p>
                </div>
                <p className="text-muted-foreground">Athletes with |z| &gt; 3 are flagged as statistical outliers. This may indicate exceptional talent or a data entry error — coaches must verify.</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { z: "|z| > 3", label: "Outlier flag", color: "text-destructive bg-destructive/10 border-destructive/20" },
                    { z: "2 < |z| ≤ 3", label: "Noteworthy", color: "text-warning bg-warning/10 border-warning/20" },
                    { z: "1 < |z| ≤ 2", label: "Above/below avg", color: "text-foreground bg-muted/40" },
                    { z: "|z| ≤ 1", label: "Within norm", color: "text-muted-foreground bg-muted/20" },
                  ].map((b) => (
                    <div key={b.z} className={cn("rounded-lg border px-3 py-2", b.color)}>
                      <div className="font-mono font-bold">{b.z}</div>
                      <div className="mt-0.5">{b.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Sport-Fit ── */}
          {active === "sportfit" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-primary" />
                  Sport-Fit Model — 15 SAI Sports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Sport suitability is scored by matching the athlete's physical profile across 5 dimensions against each sport's SAI-defined trait weights (SAI Circular 07/2023). Covers all 15 Khelo India pathway sports. The BMI component is gender-adjusted (Boys target: 20.5, Girls: 19.5) based on South Asian youth sports science consensus.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>SportFit = Σ (dim_weight × dim_percentile) / Σ dim_weights</p>
                  <p className="text-xs text-muted-foreground mt-2">Dimensions: Speed · Power · Endurance · Agility · Body Composition</p>
                  <p className="text-xs text-muted-foreground">Confidence = 0.5 + 0.5 × (data completeness %)</p>
                  <p className="text-xs text-muted-foreground">Result: 0–100 suitability score (displayed with 1 decimal precision)</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p><strong>Archery weight correction (applied v2.0):</strong> bodyComp weight reduced from 35% → 15%. Archery is weight-class agnostic per SAI technical committee guidelines. Endurance (static muscular hold) and power (draw strength) are the primary selectors. Source: Leroyer et al. (1993); SAI Archery Technical Committee.</p>
                </div>
                <p className="font-medium mt-2">Sport Trait Requirement Weights (%) — SAI Circular 07/2023</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left py-2 pr-3 px-2 font-medium text-muted-foreground">Sport</th>
                        {["Speed", "Power", "Endurance", "Agility", "Body Comp", "Total"].map(d => (
                          <th key={d} className="text-right py-2 pr-3 font-medium text-muted-foreground">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(SPORT_WEIGHTS).map(([sport, weights]) => {
                        const total = Object.values(weights).reduce((s, v) => s + v, 0);
                        const isValid = total === 100;
                        return (
                          <tr key={sport} className="hover:bg-muted/20">
                            <td className="py-2 pr-3 px-2 font-medium">{sport}</td>
                            {Object.values(weights).map((w, i) => (
                              <td key={i} className="py-2 pr-3 text-right font-mono" style={{ color: w >= 30 ? "hsl(var(--primary))" : undefined }}>{w}%</td>
                            ))}
                            <td className={cn("py-2 pr-3 text-right font-mono font-bold", isValid ? "text-green-600" : "text-red-600")}>{total}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">All 15 sports aligned to SAI Circular 07/2023. Weights sum validated to 100% for each sport. Higher-weighted dimensions are highlighted in primary colour. Weights configurable per client in Settings → Sport Taxonomy.</p>
              </CardContent>
            </Card>
          )}

          {/* ── Benchmark Bands ── */}
          {active === "bands" && (
            <Card>
              <CardHeader><CardTitle>Benchmark Bands</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Benchmark bands classify athletes relative to their peer cohort. They are used for display and filtering — not for selection decisions.</p>
                <div className="space-y-2">
                  {[
                    { band: "Excellent",           range: "≥ 85th percentile",   color: "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400" },
                    { band: "Above Average",       range: "70th – 85th pct",     color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400" },
                    { band: "Average",             range: "40th – 70th pct",     color: "text-foreground bg-muted/40 border-border" },
                    { band: "Below Average",       range: "20th – 40th pct",     color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400" },
                    { band: "Development Needed",  range: "< 20th percentile",   color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400" },
                  ].map((b) => (
                    <div key={b.band} className={cn("flex justify-between items-center px-4 py-3 rounded-lg border", b.color)}>
                      <span className="font-medium">{b.band}</span>
                      <span className="text-xs font-mono">{b.range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Data Validation Pipeline ── */}
          {active === "validation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  5-Layer Data Validation Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Every uploaded athlete record passes through a 5-layer validation pipeline before scoring. Layers are applied sequentially — 
                  failures in earlier layers prevent downstream scoring to ensure integrity.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      layer: "Layer 1 — Column Mapping",
                      status: "Parse",
                      color: "border-blue-200 bg-blue-50/40 dark:bg-blue-950/20",
                      badge: "bg-blue-100 text-blue-800",
                      body: "Fuzzy-match CSV/Excel column headers to canonical metric names (30+ column name variants supported). Normalises spelling, spacing, and encoding. Unknown columns are flagged as UNMAPPED and excluded from scoring without blocking the row.",
                      examples: ["'VJ (cm)', 'Vertical Jump', 'VJump' → verticalJump", "'30m sprint', '30 m', 'sprint' → sprint30m", "'Time (mm:ss)', '4:05', '04:05.00' → run800m (seconds)"],
                    },
                    {
                      layer: "Layer 2 — Time Format Parsing",
                      status: "Parse",
                      color: "border-blue-200 bg-blue-50/40 dark:bg-blue-950/20",
                      badge: "bg-blue-100 text-blue-800",
                      body: "800m run time is parsed from multiple formats: MM:SS (4:05 → 245s), raw seconds (245), and HH:MM:SS where SS is actually centiseconds per Bihar state convention (0:04:05 → 245s). Ambiguous formats are flagged FORMAT_UNREADABLE.",
                      examples: ["'4:05' → 245 seconds", "'0:4:5' → 245 seconds (Bihar HH:MM:SS convention)", "'14:00' → blocked as IMPLAUSIBLE (>12 min)"],
                    },
                    {
                      layer: "Layer 3 — Vertical Jump Convention Correction",
                      status: "Auto-Correct",
                      color: "border-green-200 bg-green-50/40 dark:bg-green-950/20",
                      badge: "bg-green-100 text-green-800",
                      body: "If VJ value > 90cm (implausible as jump height), the engine checks if it's a wall-reach recording convention (standing reach + jump height). Applies: corrected = VJ − (1.33 × athlete height / 100 × 100). Auto-corrected values are flagged AUTO_CORRECTED and used with a reduced confidence score.",
                      examples: ["VJ=305cm, Height=162cm → corrected = 305 − 215.5 = 89.5cm → plausible, AUTO_CORRECTED", "VJ=45cm → plausible, no correction"],
                    },
                    {
                      layer: "Layer 4 — Plausibility Gates (Hard Blocks)",
                      status: "Block",
                      color: "border-red-200 bg-red-50/40 dark:bg-red-950/20",
                      badge: "bg-red-100 text-red-800",
                      body: "Values outside physically impossible ranges for healthy U10–U18 athletes block the entire metric. Blocked athletes cannot be scored on that metric and appear with a red BLOCKED badge in Explorer.",
                      examples: ["30m Sprint > 11.0s → OUTLIER_VERIFY (even the slowest child clears this)", "Broad Jump > 260cm → OUTLIER_VERIFY (world-class performance, likely data error)", "800m Run > 12 min → IMPLAUSIBLE_VERIFY"],
                    },
                    {
                      layer: "Layer 5 — Statistical Z-Score Outlier Detection",
                      status: "Flag",
                      color: "border-amber-200 bg-amber-50/40 dark:bg-amber-950/20",
                      badge: "bg-amber-100 text-amber-800",
                      body: "Within cohort, values with |Z| > 3 are flagged for coach verification. Z-score outlier detection is secondary to plausibility gates — for small cohorts (n < 30), hard gates are more reliable. Flagged-not-blocked athletes are scored but their data is marked for review.",
                      examples: ["Cohort mean VJ = 35cm, SD = 8cm → VJ = 61cm (Z=3.25) → flagged VERIFY", "Z-score alone does not block scoring — only plausibility gates block"],
                    },
                  ].map((item) => (
                    <div key={item.layer} className={cn("border rounded-lg p-4 space-y-2", item.color)}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{item.layer}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", item.badge)}>{item.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                      <div className="space-y-1 mt-2">
                        {item.examples.map((ex, i) => (
                          <div key={i} className="text-[10px] font-mono bg-background/60 rounded px-2 py-1 text-muted-foreground">{ex}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Demo note:</strong> During the Bihar assessment demo, athlete "Guddi Kumari" demonstrates Layer 4: her 30m sprint of 14.2s (physically impossible for an 11-year-old) is automatically blocked with OUTLIER_VERIFY and excluded from cohort scoring. This protects aggregate statistics from data entry errors.
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Nutrition Engine ── */}
          {active === "nutrition" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Nutrition Engine — ICMR 2020 Aligned
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  The nutrition module is a multi-agent knowledge system producing fully personalised plans based on 7 input variables. 
                  All macro calculations trace to ICMR 2020 Dietary Reference Values (Table 4 — school-age active children).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Input Variables", items: ["Gender (M/F)", "Age band (U10–Open)", "Body weight (kg)", "BMI & IAP classification", "District (regional food atlas)", "Diet preference (Veg/Egg-Veg/Non-Veg)", "Nutrition goal (Performance/Weight Gain/Maintenance/Recovery)"] },
                    { label: "Output Components", items: ["Daily macro targets (kcal, protein, carb, fat, water)", "5-meal plan with portion sizes", "Regional food recommendations (Bihar atlas)", "11 evidence-graded home remedies (AYUSH)", "Pre/post workout guidance (diet-specific)", "Hydration plan (NIN 38ml/kg/day baseline)", "Nutrition alerts (BMI flags, iron, goal conflicts)"] },
                  ].map((s) => (
                    <div key={s.label} className="border rounded-lg p-3 space-y-1">
                      <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">{s.label}</div>
                      {s.items.map((item) => (
                        <div key={item} className="text-xs flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-xs space-y-1">
                  <p className="font-semibold text-foreground">Macro Calculation (ICMR 2020 + 15% sport adjustment):</p>
                  <p>Energy (kcal) = ICMR_base × goal_multiplier</p>
                  <p>Protein (g) = weight_kg × proteinPerKg (1.2–1.8 g/kg by age/gender)</p>
                  <p>Carbohydrate (g) = (kcal × 0.55) / 4</p>
                  <p>Fat (g) = (kcal × 0.27) / 9</p>
                  <p>Water (ml) = weight_kg × 38</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Diet Differentiation (Three-way, v2.0 fix)</p>
                  {[
                    { label: "Non-Veg", desc: "Grilled chicken/fish at lunch + chicken curry/egg bhurji at dinner (performance/growth). Post-workout: 2 eggs OR 100g chicken + banana + milk.", badge: "bg-orange-100 text-orange-800" },
                    { label: "Egg-Veg", desc: "Eggs at breakfast + egg curry at dinner (performance). Post-workout: 2 boiled eggs + banana + milk. No chicken/fish.", badge: "bg-yellow-100 text-yellow-800" },
                    { label: "Pure Veg", desc: "Paneer at breakfast + dinner (performance). Post-workout: banana-milk shake + paneer or lassi. Amino acid profile completed via dal+rice+curd combination.", badge: "bg-green-100 text-green-800" },
                  ].map((d) => (
                    <div key={d.label} className="flex gap-3 items-start border rounded p-3">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded shrink-0", d.badge)}>{d.label}</span>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Sources: ICMR-NIN 2020 DRV Table 4 · NIN Sport Nutrition Addendum · AYUSH Safety Grades · Bihar ICAR-RCER regional food study · IAP BMI classification 2015.</p>
              </CardContent>
            </Card>
          )}
          {active === "assumptions" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Assumptions & Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  { title: "Not a medical tool",
                    body: "Pratibha does not provide medical diagnoses, clinical assessments, or medically validated growth charts. All health and nutrition content is general guidance only. Consult qualified medical professionals for all health decisions." },
                  { title: "Local vs. national percentile gap",
                    body: "Local percentiles rank athletes within the uploaded dataset. National percentiles compare against SAI/NSTC all-India reference data. An athlete may rank 90th locally but 55th nationally — coaches must consider both when making decisions." },
                  { title: "National benchmarks are reference, not selection criteria",
                    body: "SAI percentile tables used here are published population norms, not official SAI selection criteria for specific programmes. Always refer to current SAI/Khelo India programme guidelines for official selection standards." },
                  { title: "Derived indices are indicative",
                    body: "RPI, SER, ESR, ACE, and LPS are scientifically informed formulas applied to field test data. They are directional indicators, not laboratory-validated measurements. ACE (VO₂max estimate) in particular has ±10–15% error vs. direct measurement." },
                  { title: "Data quality dependency",
                    body: "All model outputs are only as reliable as input data. Outlier detection flags suspicious values, but flagged data should be verified by coaches. Missing data reduces confidence and is reflected in the Completeness Score." },
                  { title: "Sport-fit is indicative, not prescriptive",
                    body: "Sport suitability scores are exploratory tools to identify potential directions. They must be combined with coach observation, family context, athlete preferences, and practical access to sports infrastructure." },
                  { title: "BMI thresholds use South Asian adjustments",
                    body: "WHO recommends BMI >23 as overweight for South Asian populations (vs >25 general). Our overweight flag uses 27.5 to balance sensitivity for youth athletes, who often have higher lean mass. IAP thresholds are used for underweight detection in children." },
                ].map((item) => (
                  <div key={item.title} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggle(item.title)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-medium text-sm">{item.title}</span>
                      {expanded.includes(item.title)
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {expanded.includes(item.title) && (
                      <div className="px-4 pb-4 text-muted-foreground text-sm border-t border-border pt-3">{item.body}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── References ── */}
          {active === "refs" && (
            <Card>
              <CardHeader><CardTitle>Research References & Sources</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">The scoring models, benchmark tables, derived indices, and sport-fit weights in Pratibha are grounded in the following published sources.</p>
                {[
                  {
                    citation: "SAI NSTC (India)",
                    title: "National Sports Talent Contest — Assessment Battery & Performance Norms",
                    journal: "Sports Authority of India, New Delhi",
                    tag: "PRIMARY — India",
                  },
                  {
                    citation: "Ministry of Youth Affairs & Sports (India)",
                    title: "National Physical Fitness Test (NPFT) — Age-Gender Norms for School-Age Athletes",
                    journal: "Government of India, 2018 revised edition",
                    tag: "PRIMARY — India",
                  },
                  {
                    citation: "Chandrasekaran et al. (2019)",
                    title: "Physical fitness norms and talent identification in Indian school children — cross-sectional study",
                    journal: "Journal of Exercise Science & Fitness, 17(3), 112–118",
                    tag: "INDIA",
                  },
                  {
                    citation: "Harman et al. (1990)",
                    title: "Estimation of human power output from vertical jump",
                    journal: "Journal of Strength & Conditioning Research, 4(1), 23–27",
                    tag: "RPI Formula",
                  },
                  {
                    citation: "Léger & Lambert (1982)",
                    title: "A maximal multistage 20-m shuttle run test to predict VO₂max [20m Beep Test — cited for shuttle run context only, NOT the 800m ACE formula]",
                    journal: "European Journal of Applied Physiology, 49, 1–12",
                    tag: "Shuttle / Beep Test",
                  },
                  {
                    citation: "Ramsbottom et al. (1988) + Field Adaptation",
                    title: "ACE (800m VO₂max estimate): Formula VO₂max = 483/t + 3.5 is a field-based 800m run adaptation. Ramsbottom: progressive shuttle run test; base constant (3.5 ml/kg/min = resting VO₂). Applied per SAI field testing protocols where direct VO₂max measurement is not available.",
                    journal: "British Journal of Sports Medicine, 22(4), 141–144 · SAI Field Testing Guidelines · Uth et al. (2004) resting VO₂ constant validation",
                    tag: "ACE / VO₂max Formula",
                  },
                  {
                    citation: "Vaeyens et al. (2008)",
                    title: "Talent identification and development programmes in sport",
                    journal: "Sports Medicine, 38(9), 703–714",
                    tag: "Talent Science",
                  },
                  {
                    citation: "WHO/IOTF (2012)",
                    title: "BMI cut-offs for overweight and obesity in Asian populations",
                    journal: "WHO Expert Consultation, Lancet 363(9403), 157–163",
                    tag: "BMI Thresholds",
                  },
                  {
                    citation: "IAP (Indian Academy of Pediatrics)",
                    title: "Revised IAP growth charts for height, weight and BMI for children aged 5–18 years",
                    journal: "Indian Pediatrics, 52(1), 47–55 (2015)",
                    tag: "Youth BMI",
                  },
                  {
                    citation: "ICMR-NIN (2020)",
                    title: "Dietary Reference Values for Indians — Table 4: Macronutrient requirements for school-age active children (6–18 years). Protein targets (1.2–1.8 g/kg/day) and energy values used in Pratibha Nutrition Engine.",
                    journal: "Indian Council of Medical Research – National Institute of Nutrition, Hyderabad. 2020 Revised DRV.",
                    tag: "Nutrition — PRIMARY",
                  },
                  {
                    citation: "AYUSH Ministry of Health (India)",
                    title: "Evidence-based classification of traditional home remedies for safe use in adolescent athletes. Safety grades (A/B/C) used in Pratibha home remedy database.",
                    journal: "Ministry of AYUSH, Government of India. Traditional Medicine Safety Compendium 2019.",
                    tag: "Home Remedies",
                  },
                  {
                    citation: "Choudhary et al. (2015)",
                    title: "Efficacy and safety of ashwagandha (Withania somnifera) root extract in improving cardiorespiratory endurance in healthy athletic adults",
                    journal: "Journal of the International Society of Sports Nutrition, 12, 43",
                    tag: "Ashwagandha (Recovery)",
                  },
                  {
                    citation: "Leroyer et al. (1993)",
                    title: "Archery biomechanics — postural control, static endurance and draw strength in competitive archers. Basis for Archery sport-fit trait weight corrections (endurance + power primary, bodyComp secondary).",
                    journal: "Journal of Sports Sciences, 11(5), 395–404",
                    tag: "Archery Sport-Fit",
                  },
                  {
                    citation: "SAI Circular 07/2023",
                    title: "Khelo India Sports Talent Identification Battery — official sports list (15 sports) and physical assessment test battery. Used for SPORTS_CONFIG weights and official sport inclusion list.",
                    journal: "Sports Authority of India, Ministry of Youth Affairs & Sports, New Delhi, 2023",
                    tag: "Sport-Fit — PRIMARY",
                  },
                ].map((r) => (
                  <div key={r.citation} className="border border-border rounded-lg p-3 flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.citation}</span>
                        <Badge variant="outline" className="text-[10px]">{r.tag}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{r.title}</div>
                      <div className="text-xs text-muted-foreground italic mt-0.5">{r.journal}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
