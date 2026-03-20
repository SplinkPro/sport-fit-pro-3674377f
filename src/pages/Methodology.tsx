import { useState } from "react";
import { BookOpen, FlaskConical, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type Section = "composite" | "percentile" | "zscore" | "sportfit" | "bands" | "assumptions" | "refs";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "composite", label: "Composite Score", icon: FlaskConical },
  { id: "percentile", label: "Percentile Ranking", icon: BarChartIcon },
  { id: "zscore", label: "Z-Score Normalization", icon: TrendIcon },
  { id: "sportfit", label: "Sport-Fit Model", icon: TrophyIcon },
  { id: "bands", label: "Benchmark Bands", icon: CheckCircle },
  { id: "assumptions", label: "Assumptions & Limitations", icon: AlertTriangle },
  { id: "refs", label: "References", icon: BookOpen },
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
  "Athletics": { speed: 30, power: 25, endurance: 25, agility: 10, bodyComposition: 10 },
  "Football": { speed: 25, power: 20, endurance: 25, agility: 20, bodyComposition: 10 },
  "Kabaddi": { speed: 20, power: 25, endurance: 20, agility: 25, bodyComposition: 10 },
  "Cycling": { speed: 15, power: 25, endurance: 40, agility: 5, bodyComposition: 15 },
  "Volleyball": { speed: 20, power: 30, endurance: 15, agility: 20, bodyComposition: 15 },
};

export default function MethodologyPage() {
  const { t, language } = useTranslation();
  const [active, setActive] = useState<Section>("composite");
  const [expanded, setExpanded] = useState<string[]>([]);

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
            Transparent documentation of all scoring models, formulas, assumptions, and limitations.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">v1.0 · March 2024</Badge>
      </div>

      <div className="flex gap-6">
        {/* Nav */}
        <div className="w-52 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                active === s.id ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {active === "composite" && (
            <Card>
              <CardHeader>
                <CardTitle>Composite Athlete Potential Index</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">The Composite Score provides a single summary metric of overall athletic potential. It is a weighted sum of normalized performance scores across key physical attributes.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>Composite = Σ (w<sub>i</sub> × NormalizedScore<sub>i</sub>)</p>
                  <p className="text-xs text-muted-foreground mt-2">where w<sub>i</sub> = metric weight (configurable, default sum = 100)</p>
                  <p className="text-xs text-muted-foreground">NormalizedScore<sub>i</sub> = 100 × (value − cohort_min) / (cohort_max − cohort_min)</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Default Weights (configurable in Settings)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[["30m Sprint", "25%"], ["Vertical Jump", "20%"], ["Broad Jump", "20%"], ["800m Run", "20%"], ["Shuttle Run", "10%"], ["Football Throw", "5%"]].map(([m, w]) => (
                      <div key={m} className="flex justify-between text-xs bg-muted/30 rounded px-3 py-2">
                        <span className="text-muted-foreground">{m}</span>
                        <span className="font-semibold text-primary">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-muted-foreground">
                  <strong className="text-warning">Important:</strong> Sprint and Shuttle Run are inverted (lower time = better performance) before normalization.
                </div>
              </CardContent>
            </Card>
          )}

          {active === "percentile" && (
            <Card>
              <CardHeader><CardTitle>Percentile Ranking</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Percentile rank indicates how an athlete compares to their peer cohort (same gender, similar age band).</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>Percentile = (N values below athlete / N total in cohort) × 100</p>
                  <p className="text-xs text-muted-foreground mt-2">Cohort: same gender + age band (±1 year), minimum 5 athletes required</p>
                </div>
                <p className="text-muted-foreground">If cohort size is below 5, percentiles are computed across the full gender cohort. A confidence warning is displayed when this fallback is used.</p>
              </CardContent>
            </Card>
          )}

          {active === "zscore" && (
            <Card>
              <CardHeader><CardTitle>Z-Score Normalization</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Z-scores express each metric in standard deviation units relative to the cohort mean. They are used for outlier detection and cohort-relative comparisons.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>z = (x − μ) / σ</p>
                  <p className="text-xs text-muted-foreground mt-2">x = athlete's value, μ = cohort mean, σ = cohort standard deviation</p>
                </div>
                <p className="text-muted-foreground">Athletes with |z| &gt; 3 are flagged as statistical outliers. This may indicate either exceptional talent or a data quality issue — coaches should verify flagged values.</p>
              </CardContent>
            </Card>
          )}

          {active === "sportfit" && (
            <Card>
              <CardHeader><CardTitle>Sport-Fit Model</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Sport suitability is scored by matching the athlete's physical profile (5 dimensions) against each sport's configurable trait requirement weights.</p>
                <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm">
                  <p className="font-semibold text-foreground mb-2">Formula:</p>
                  <p>SportFit(sport) = Σ (trait_weight<sub>sport</sub> × athlete_dimension_score) / 100</p>
                  <p className="text-xs text-muted-foreground mt-2">Dimensions: Speed, Power, Endurance, Agility, Body Composition</p>
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
                <p className="text-xs text-muted-foreground">All weights are configurable per client in Settings → Sport Taxonomy.</p>
              </CardContent>
            </Card>
          )}

          {active === "bands" && (
            <Card>
              <CardHeader><CardTitle>Benchmark Bands</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Benchmark bands classify athletes relative to their peer cohort. They are used for display and filtering — not for selection or exclusion decisions.</p>
                <div className="space-y-2">
                  {[
                    { band: "Excellent", range: "> 85th percentile", color: "text-success bg-success/10 border-success/20" },
                    { band: "Above Average", range: "70th – 85th percentile", color: "text-primary bg-primary/10 border-primary/20" },
                    { band: "Average", range: "40th – 70th percentile", color: "text-foreground bg-muted/40 border-border" },
                    { band: "Below Average", range: "20th – 40th percentile", color: "text-warning bg-warning/10 border-warning/20" },
                    { band: "Development Needed", range: "< 20th percentile", color: "text-destructive bg-destructive/10 border-destructive/20" },
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

          {active === "assumptions" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" /> Assumptions & Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  { title: "Not a medical tool", body: "Pratibha does not provide medical diagnoses, clinical assessments, or medically validated growth charts. All health and nutrition content is general guidance only. Always consult qualified medical professionals for health decisions." },
                  { title: "Relative ranking, not absolute standards", body: "All percentiles and benchmark bands are relative to the current dataset cohort, not national or international standards. A score of 'Excellent' means the athlete is in the top 15% of their local cohort — not that they meet elite standards." },
                  { title: "Data quality dependency", body: "Model outputs are only as reliable as the input data. Outlier detection flags suspicious values, but all flagged data should be verified by coaches. Missing data reduces confidence and is reflected in the Completeness Score." },
                  { title: "Sport-fit is indicative, not prescriptive", body: "Sport suitability scores are exploratory tools to identify potential directions. They must be combined with coach observation, family context, athlete preferences, and practical access to sports infrastructure." },
                  { title: "AI summaries require critical evaluation", body: "AI-generated narrative summaries (when enabled) are based on structured rules outputs, not independent analysis. They should be reviewed by coaches before being shared with athletes or parents." },
                  { title: "Age and gender normalization", body: "Cohort comparisons are normalized by gender and ±1 year age band. Smaller cohorts may reduce statistical reliability. Minimum cohort size of 5 is enforced; smaller cohorts fall back to gender-wide comparisons." },
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

          {active === "refs" && (
            <Card>
              <CardHeader><CardTitle>Research References</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">The scoring models and sport-fit weights in Pratibha are informed by published sports science literature. Specific configurations should be validated by qualified sports scientists for each deployment context.</p>
                {[
                  { citation: "Vaeyens et al. (2008)", title: "Talent identification and development programmes in sport", journal: "Sports Medicine, 38(9), 703–714" },
                  { citation: "Elferink-Gemser et al. (2011)", title: "Multidimensional performance characteristics and standard of performance in talented youth field hockey players", journal: "Journal of Sports Sciences, 29(11), 1217–1224" },
                  { citation: "Hoare & Warr (2000)", title: "Talent identification and women's soccer: An Australian experience", journal: "Journal of Sports Sciences, 18(9), 751–758" },
                  { citation: "Lidor et al. (2009)", title: "Measurement of talent in team handball: The questionable use of motor and physical tests", journal: "Journal of Strength and Conditioning Research, 19(2), 318–325" },
                  { citation: "SAI National Sports Talent Contest (India)", title: "Assessment battery guidelines for youth athlete identification", journal: "Sports Authority of India" },
                ].map((r) => (
                  <div key={r.citation} className="border border-border rounded-lg p-3">
                    <div className="font-medium">{r.citation}</div>
                    <div className="text-muted-foreground mt-0.5">{r.title}</div>
                    <div className="text-xs text-muted-foreground italic mt-0.5">{r.journal}</div>
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
