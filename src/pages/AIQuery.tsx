import { useState } from "react";
import { Search, Sparkles, ChevronRight, X, BookOpen, Clock, Copy, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useAthletes } from "@/hooks/useAthletes";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import { cn } from "@/lib/utils";

// ─── Query Engine ─────────────────────────────────────────────────────────

interface QueryResult {
  results: EnrichedAthlete[];
  filters: string[];
  reasoning: string;
  metricLabel: string;
  metricFn: (a: EnrichedAthlete) => string;
}

function parseTopN(q: string): number {
  const m = q.match(/top\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 10;
}

function parseAgeRange(q: string): [number, number] | null {
  // "aged 14-16" | "age 14–16" | "14 to 16"
  const m = q.match(/(?:age[ds]?\s*)?(\d{1,2})\s*[-–to]+\s*(\d{1,2})/i);
  return m ? [parseInt(m[1]), parseInt(m[2])] : null;
}

function parseScoreThreshold(q: string): number | null {
  const m = q.match(/(?:composite\s+score\s+above|score\s*>|above)\s*(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

function formatRunTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function queryAthletes(query: string, athletes: EnrichedAthlete[]): QueryResult {
  const q = query.toLowerCase();
  const filters: string[] = [];
  let pool = [...athletes];
  let limit = parseTopN(q);
  let sortFn: ((a: EnrichedAthlete) => number) | null = null;
  let metricLabel = "Composite Score";
  let metricFn: (a: EnrichedAthlete) => string = (a) => String(a.compositeScore);

  // ── Gender filter ──
  if (/\b(male|boys?|men)\b/i.test(q)) {
    pool = pool.filter((a) => a.gender === "M");
    filters.push("Gender: Male");
  } else if (/\b(female|girls?|women)\b/i.test(q)) {
    pool = pool.filter((a) => a.gender === "F");
    filters.push("Gender: Female");
  }

  // ── Age range filter ──
  const ageRange = parseAgeRange(q);
  if (ageRange) {
    pool = pool.filter((a) => a.age >= ageRange[0] && a.age <= ageRange[1]);
    filters.push(`Age: ${ageRange[0]}–${ageRange[1]}`);
  } else if (/under\s*12/i.test(q)) {
    pool = pool.filter((a) => a.age < 12);
    filters.push("Age: Under 12");
  } else if (/18\+|eighteen\s*plus|adult/i.test(q)) {
    pool = pool.filter((a) => a.age >= 18);
    filters.push("Age: 18+");
  }

  // ── BMI / body flags ──
  if (/underweight|bmi\s*<\s*18/i.test(q)) {
    pool = pool.filter((a) => a.flags?.some((f) => f.type === "underweight"));
    filters.push("Flag: Underweight");
    metricLabel = "BMI";
    metricFn = (a) => a.bmi != null ? a.bmi.toFixed(1) : "—";
  } else if (/overweight|bmi\s*>\s*25/i.test(q)) {
    pool = pool.filter((a) => a.bmi != null && a.bmi > 25);
    filters.push("Flag: Overweight");
    metricLabel = "BMI";
    metricFn = (a) => a.bmi != null ? a.bmi.toFixed(1) : "—";
  }

  // ── High potential ──
  if (/high\s*potential|top\s*talent|elite/i.test(q)) {
    pool = pool.filter((a) => a.isHighPotential);
    filters.push("Filter: High Potential");
  }

  // ── Composite score threshold ──
  const threshold = parseScoreThreshold(q);
  if (threshold !== null) {
    pool = pool.filter((a) => a.compositeScore >= threshold);
    filters.push(`Composite Score ≥ ${threshold}`);
  }

  // ── Metric sorts ──
  if (/vertical\s*jump/i.test(q)) {
    sortFn = (a) => -(a.verticalJump ?? 0);
    metricLabel = "Vertical Jump (cm)";
    metricFn = (a) => a.verticalJump != null ? `${a.verticalJump} cm` : "—";
    filters.push("Metric: Vertical Jump");
  } else if (/broad\s*jump/i.test(q)) {
    sortFn = (a) => -(a.broadJump ?? 0);
    metricLabel = "Broad Jump (cm)";
    metricFn = (a) => a.broadJump != null ? `${a.broadJump} cm` : "—";
    filters.push("Metric: Broad Jump");
  } else if (/sprint|30\s*m/i.test(q)) {
    sortFn = (a) => (a.sprint30m ?? 999);
    metricLabel = "30m Sprint (sec)";
    metricFn = (a) => a.sprint30m != null ? `${a.sprint30m.toFixed(2)}s` : "—";
    filters.push("Metric: 30m Sprint");
  } else if (/800\s*m|run|endurance/i.test(q)) {
    sortFn = (a) => (a.run800m ?? 999999);
    metricLabel = "800m Run";
    metricFn = (a) => a.run800m != null ? formatRunTime(a.run800m) : "—";
    filters.push("Metric: 800m Run");
  } else if (/shuttle/i.test(q)) {
    sortFn = (a) => (a.shuttleRun ?? 999);
    metricLabel = "Shuttle Run (sec)";
    metricFn = (a) => a.shuttleRun != null ? `${a.shuttleRun.toFixed(2)}s` : "—";
    filters.push("Metric: Shuttle Run");
  } else if (/throw/i.test(q)) {
    sortFn = (a) => -(a.footballThrow ?? 0);
    metricLabel = "Football Throw (m)";
    metricFn = (a) => a.footballThrow != null ? `${a.footballThrow} m` : "—";
    filters.push("Metric: Football Throw");
  } else if (/cycling|cycle/i.test(q)) {
    pool = pool.filter((a) => a.sportFit?.some((s) => s.sport.nameEn.toLowerCase().includes("cycl")));
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("cycl"));
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Cycling Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("cycl"));
      return fit ? `${fit.matchScore}` : "—";
    };
    filters.push("Sport Fit: Cycling");
  } else if (/football/i.test(q) && !/throw/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("football"));
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Football Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("football"));
      return fit ? `${fit.matchScore}` : "—";
    };
    filters.push("Sport Fit: Football");
  } else if (/kabaddi/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("kabaddi"));
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Kabaddi Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.nameEn.toLowerCase().includes("kabaddi"));
      return fit ? `${fit.matchScore}` : "—";
    };
    filters.push("Sport Fit: Kabaddi");
  } else if (/best suit|recommend|which sport/i.test(q)) {
    // Sort by top sport score
    sortFn = (a) => -(a.topSportScore ?? 0);
    metricLabel = "Top Sport Fit";
    metricFn = (a) => `${a.topSport} (${a.topSportScore ?? 0})`;
    filters.push("Sort: Top Sport Fit");
  }

  // Default sort: composite score descending
  if (!sortFn) {
    sortFn = (a) => -a.compositeScore;
    filters.push("Sort: Composite Score (desc)");
  }

  pool.sort((a, b) => sortFn!(a) - sortFn!(b));

  if (!filters.some((f) => f.startsWith("Limit"))) {
    filters.push(`Limit: ${limit}`);
  }

  const results = pool.slice(0, limit);

  // Build reasoning
  const genderStr = filters.find((f) => f.startsWith("Gender:"))?.replace("Gender: ", "") ?? "all genders";
  const ageStr = filters.find((f) => f.startsWith("Age:"))?.replace("Age: ", "ages ") ?? "";
  const metricStr = filters.find((f) => f.startsWith("Metric:"))?.replace("Metric: ", "") ?? "composite score";
  const flagStr = filters.find((f) => f.startsWith("Flag:"))?.replace("Flag: ", "") ?? "";

  let reasoning = `Found ${results.length} athletes`;
  if (genderStr !== "all genders") reasoning += ` (${genderStr})`;
  if (ageStr) reasoning += ` aged ${ageStr.replace("ages ", "")}`;
  reasoning += ` from a pool of ${pool.length} matching athletes`;
  if (flagStr) reasoning += `, filtered by ${flagStr.toLowerCase()} flag`;
  reasoning += `, ranked by ${metricStr.toLowerCase()}.`;
  if (threshold !== null) reasoning += ` Only athletes with composite score ≥ ${threshold} included.`;
  reasoning += ` Results are from the currently active dataset (${athletes.length} athletes total).`;

  return { results, filters, reasoning, metricLabel, metricFn };
}

// ─── Constants ────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES_EN = [
  "Show top 10 athletes by vertical jump",
  "Find underweight athletes with high sprint ability",
  "Which athletes are best suited for cycling?",
  "Show athletes with high potential",
  "Compare male vs female average performance",
  "Find athletes aged 14–16 with composite score above 60",
];

const EXAMPLE_QUERIES_HI = [
  "वर्टिकल जंप में शीर्ष 10 खिलाड़ी दिखाएं",
  "कम वजन वाले लेकिन तेज दौड़ने वाले खिलाड़ी खोजें",
  "साइकिलिंग के लिए सबसे उपयुक्त खिलाड़ी कौन हैं?",
  "उच्च क्षमता लेकिन कम सहनशक्ति वाले खिलाड़ी",
  "पुरुष बनाम महिला औसत प्रदर्शन की तुलना करें",
];

const SAVED_TEMPLATES = [
  { id: 1, name: "Top sprinters", query: "Show top 10 athletes by 30m sprint", lastUsed: "—" },
  { id: 2, name: "High potential cohort", query: "Show athletes with high potential", lastUsed: "—" },
  { id: 3, name: "Underweight alert", query: "Find underweight athletes", lastUsed: "—" },
  { id: 4, name: "Best cycling fit", query: "Which athletes are best suited for cycling", lastUsed: "—" },
];

const FOLLOW_UP = [
  "Show top 10 athletes by vertical jump",
  "Find underweight athletes",
  "Show athletes with high potential",
  "Which athletes are best suited for cycling?",
  "Show top 10 athletes by 30m sprint",
];

type QueryState = "idle" | "interpreting" | "results";

// ─── Page Component ────────────────────────────────────────────────────────

export default function AIQueryPage() {
  const { t, language } = useTranslation();
  const { athletes, datasetMeta } = useAthletes();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<QueryState>("idle");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [interpretedFilters, setInterpretedFilters] = useState<string[]>([]);

  const examples = language === "hi" ? EXAMPLE_QUERIES_HI : EXAMPLE_QUERIES_EN;

  const handleQuery = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setState("interpreting");
    setTimeout(() => {
      const result = queryAthletes(q, athletes);
      setQueryResult(result);
      setInterpretedFilters(result.filters);
      setState("results");
    }, 800);
  };

  const removeFilter = (f: string) => {
    setInterpretedFilters((prev) => prev.filter((x) => x !== f));
  };

  const handleExportCSV = () => {
    if (!queryResult) return;
    const headers = ["Rank", "Name", "Gender", "Age", "School", "Composite Score", queryResult.metricLabel];
    const rows = queryResult.results.map((r, i) => [
      i + 1,
      r.name,
      r.gender,
      r.age,
      r.school,
      r.compositeScore,
      queryResult.metricFn(r),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            AI Query Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ask questions about your athletes in plain English or Hindi.{" "}
            <span className="text-xs text-primary font-medium">
              Active: {datasetMeta.name} · {athletes.length} athletes
            </span>
          </p>
        </div>
      </div>

      {/* Query Input */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery(query)}
                placeholder={language === "hi" ? "खिलाड़ियों के बारे में कुछ भी पूछें..." : "Ask anything about your athletes..."}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Button onClick={() => handleQuery(query)} disabled={!query.trim()} className="gap-2 px-5">
              <Sparkles className="w-4 h-4" /> Ask
            </Button>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {examples.slice(0, 4).map((ex) => (
              <button
                key={ex}
                onClick={() => handleQuery(ex)}
                className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-colors text-muted-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interpreting state */}
      {state === "interpreting" && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Interpreting your query...</p>
                <p className="text-xs text-muted-foreground">Filtering and ranking {athletes.length} athletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {state === "results" && queryResult && (
        <div className="space-y-4">
          {/* Interpreted query */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Interpreted as</p>
                  <p className="text-sm font-medium text-foreground">"{query}"</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {interpretedFilters.map((f) => (
                      <Badge key={f} variant="secondary" className="gap-1 text-xs">
                        {f}
                        <button onClick={() => removeFilter(f)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => handleQuery(query)}>
                  <Sparkles className="w-3 h-3" /> Re-run
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Results — {queryResult.results.length} athletes
                  {queryResult.results.length === 0 && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">(no matches found)</span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 text-xs"
                    onClick={() => {
                      const text = queryResult.results.map((r, i) => `${i + 1}. ${r.name} — ${queryResult.metricFn(r)}`).join("\n");
                      navigator.clipboard?.writeText(text);
                    }}>
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleExportCSV}>
                    <Download className="w-3 h-3" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {queryResult.results.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No athletes matched this query in the current dataset.</p>
                  <p className="text-xs mt-1">Try broadening your filters or check a different dataset.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">School</th>
                      <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Composite</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">{queryResult.metricLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {queryResult.results.map((r, i) => (
                      <tr key={r.id} className="hover:bg-muted/30 cursor-pointer">
                        <td className="py-2 pr-4 font-bold text-muted-foreground">#{i + 1}</td>
                        <td className="py-2 pr-4 font-medium text-foreground">
                          {r.name}
                          <span className="ml-2 text-xs text-muted-foreground">{r.gender} · {r.age}y</span>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground text-xs">{r.school}</td>
                        <td className="py-2 pr-4 text-right">
                          <Badge variant="outline" className="text-xs">{r.compositeScore}</Badge>
                        </td>
                        <td className="py-2 text-right font-semibold text-primary">{queryResult.metricFn(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Query Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1.5">
              <p>{queryResult.reasoning}</p>
              <p className="text-xs italic">
                Results are based on the active dataset: <strong>{datasetMeta.name}</strong> ({athletes.length} athletes).
                Rankings reflect cohort-relative performance within this dataset.
              </p>
            </CardContent>
          </Card>

          {/* Follow-up prompts */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggested follow-ups</p>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UP.map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuery(f)}
                  className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-colors text-muted-foreground flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Saved Query Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {SAVED_TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{tpl.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tpl.query}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {tpl.lastUsed}
                  </span>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuery(tpl.query)}>
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
