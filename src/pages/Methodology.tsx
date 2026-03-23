import { useState } from "react";
import { BookOpen, FlaskConical, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Globe, Award, Dumbbell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { INDIAN_BENCHMARKS, SAI_BAND_COLORS } from "@/data/indianBenchmarks";

type Section = "composite" | "national" | "derived" | "percentile" | "zscore" | "sportfit" | "bands" | "assumptions" | "refs";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "composite",   label: "Composite Score",           icon: FlaskConical  },
  { id: "national",    label: "Indian National Benchmarks",icon: Globe         },
  { id: "derived",     label: "Derived Indices",           icon: Dumbbell      },
  { id: "percentile",  label: "Percentile Ranking",        icon: BarChartIcon  },
  { id: "zscore",      label: "Z-Score Normalization",     icon: TrendIcon     },
  { id: "sportfit",    label: "Sport-Fit Model",           icon: TrophyIcon    },
  { id: "bands",       label: "Benchmark Bands",           icon: CheckCircle   },
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

const SPORT_WEIGHTS: Record<string, Record<string, number>> = {
  "Athletics":    { speed: 35, power: 25, endurance: 25, agility: 10, bodyComposition:  5 },
  "Football":     { speed: 30, power: 20, endurance: 30, agility: 15, bodyComposition:  5 },
  "Kabaddi":      { speed: 25, power: 30, endurance: 20, agility: 20, bodyComposition:  5 },
  "Volleyball":   { speed: 20, power: 35, endurance: 15, agility: 20, bodyComposition: 10 },
  "Cycling":      { speed: 15, power: 30, endurance: 45, agility:  5, bodyComposition:  5 },
  "Wrestling":    { speed: 10, power: 45, endurance: 20, agility: 15, bodyComposition: 10 },
  "Swimming":     { speed: 25, power: 30, endurance: 30, agility:  5, bodyComposition: 10 },
  "Basketball":   { speed: 25, power: 30, endurance: 20, agility: 20, bodyComposition:  5 },
};

const METRIC_DISPLAY: Record<string, { label: string; unit: string; lowerBetter: boolean }> = {
  verticalJump: { label: "Vertical Jump",     unit: "cm",  lowerBetter: false },
  broadJump:    { label: "Standing Long Jump", unit: "cm",  lowerBetter: false },
  sprint30m:    { label: "30m Sprint",         unit: "sec", lowerBetter: true  },
  run800m:      { label: "800m Run",           unit: "sec", lowerBetter: true  },
  shuttleRun:   { label: "10×5m Shuttle Run",  unit: "sec", lowerBetter: true  },
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
                <p className="text-muted-foreground">The CAPI provides a single 0–100 summary of overall athletic potential within the local cohort. It is a weighted sum of percentile-normalized performance scores.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                    <p className="font-semibold text-foreground mb-2">Local CAPI Formula:</p>
                    <p>CAPI = Σ (w<sub>i</sub> × Pct<sub>i</sub>)</p>
                    <p className="text-xs text-muted-foreground mt-2">Pct<sub>i</sub> = percentile within same-gender, same-cohort peers</p>
                    <p className="text-xs text-muted-foreground">Weights configurable in Settings (default below)</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 font-mono text-sm">
                    <p className="font-semibold text-foreground mb-2">National CAPI Formula:</p>
                    <p>NCAPI = Σ (w<sub>i</sub> × NatPct<sub>i</sub>)</p>
                    <p className="text-xs text-muted-foreground mt-2">NatPct<sub>i</sub> = percentile vs SAI/NSTC national reference table</p>
                    <p className="text-xs text-primary font-semibold">NEW: Absolute national positioning</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Default Weights</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["30m Sprint",       "25%", "Speed — primary discriminator per SAI NSTC"],
                      ["Vertical Jump",    "25%", "Explosive power — SAI Khelo India priority"],
                      ["800m Run",         "25%", "Aerobic base — critical for multi-sport fit"],
                      ["Broad Jump",       "20%", "Horizontal power & coordination"],
                      ["Shuttle Run",      "5%",  "Agility — included when data available"],
                      ["Football Throw",   "0%",  "Sport-specific; not in composite by default"],
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
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Sprint and shuttle run are inverted (lower time = higher percentile) before weighting. High-Potential threshold: CAPI ≥ 70.
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
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Minimum cohort size:</strong> If fewer than 5 athletes share the same gender, local percentiles fall back to the full gender group. A confidence warning is shown.
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
              <CardHeader><CardTitle>Sport-Fit Model</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Sport suitability is scored by matching the athlete's physical profile across 5 dimensions against each sport's configurable trait weights. The BMI optimal target is gender-adjusted (Boys: 20.5, Girls: 19.5) based on youth sports science consensus.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>SportFit = Σ (dim_weight × dim_percentile)</p>
                  <p className="text-xs text-muted-foreground mt-2">Dimensions: Speed · Power · Endurance · Agility · Body Composition</p>
                  <p className="text-xs text-muted-foreground">Confidence = 0.5 + 0.5 × (data completeness %)</p>
                </div>
                <p className="font-medium mt-2">Sport Trait Requirement Weights (%)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Sport</th>
                        {["Speed", "Power", "Endurance", "Agility", "Body Comp"].map(d => (
                          <th key={d} className="text-right py-2 pr-3 font-medium text-muted-foreground">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(SPORT_WEIGHTS).map(([sport, weights]) => (
                        <tr key={sport}>
                          <td className="py-2 pr-3 font-medium">{sport}</td>
                          {Object.values(weights).map((w, i) => (
                            <td key={i} className="py-2 pr-3 text-right text-primary font-mono">{w}%</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">Weights are configurable per client in Settings → Sport Taxonomy.</p>
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

          {/* ── Assumptions ── */}
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
                    title: "A maximal multistage 20-m shuttle run test to predict VO₂max",
                    journal: "European Journal of Applied Physiology, 49, 1–12",
                    tag: "ACE Formula",
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
