import { useState } from "react";
import { Search, Sparkles, ChevronRight, X, BookOpen, Clock, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useAthletes } from "@/hooks/useAthletes";
import { cn } from "@/lib/utils";

const EXAMPLE_QUERIES_EN = [
  "Show top 10 athletes by vertical jump",
  "Find underweight athletes with high sprint ability",
  "Which athletes are best suited for cycling?",
  "Show athletes with high potential but low endurance",
  "Compare male vs female average performance",
  "Find athletes aged 14–16 with above-average composite score",
];

const EXAMPLE_QUERIES_HI = [
  "वर्टिकल जंप में शीर्ष 10 खिलाड़ी दिखाएं",
  "कम वजन वाले लेकिन तेज दौड़ने वाले खिलाड़ी खोजें",
  "साइकिलिंग के लिए सबसे उपयुक्त खिलाड़ी कौन हैं?",
  "उच्च क्षमता लेकिन कम सहनशक्ति वाले खिलाड़ी",
  "पुरुष बनाम महिला औसत प्रदर्शन की तुलना करें",
];

const SAVED_TEMPLATES = [
  { id: 1, name: "Top sprinters", query: "Show top 10 athletes by 30m sprint time (fastest)", lastUsed: "2 days ago" },
  { id: 2, name: "High potential cohort", query: "Athletes with composite score above 75 and age under 16", lastUsed: "1 week ago" },
  { id: 3, name: "Underweight alert", query: "Find underweight athletes (BMI < 18.5) across all schools", lastUsed: "3 weeks ago" },
];

const MOCK_RESULT_ROWS = [
  { rank: 1, name: "Ravi Kumar", school: "Patna Sports Academy", score: 58, metric: 72 },
  { rank: 2, name: "Arjun Verma", school: "Nalanda Institute", score: 55, metric: 69 },
  { rank: 3, name: "Deepak Yadav", school: "Gaya Sports Center", score: 54, metric: 68 },
  { rank: 4, name: "Mohan Lal", school: "Muzaffarpur Academy", score: 53, metric: 66 },
  { rank: 5, name: "Sanjay Gupta", school: "Bhagalpur Institute", score: 51, metric: 64 },
];

const FOLLOW_UP = [
  "Show their full profiles",
  "Filter by school district",
  "Export this list to CSV",
  "Compare with female cohort",
  "Show trend over last 6 months",
];

type QueryState = "idle" | "interpreting" | "results";

export default function AIQueryPage() {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<QueryState>("idle");
  const [interpretedFilters, setInterpretedFilters] = useState<string[]>([]);

  const examples = language === "hi" ? EXAMPLE_QUERIES_HI : EXAMPLE_QUERIES_EN;

  const handleQuery = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setState("interpreting");
    setInterpretedFilters(["Metric: Vertical Jump", "Sort: Descending", "Limit: 10", "Gender: All"]);
    setTimeout(() => setState("results"), 1200);
  };

  const removeFilter = (f: string) => {
    setInterpretedFilters(prev => prev.filter(x => x !== f));
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
          <p className="text-muted-foreground text-sm mt-1">Ask questions about your athletes in plain English or Hindi.</p>
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
                placeholder={lang === "hi" ? "खिलाड़ियों के बारे में कुछ भी पूछें..." : "Ask anything about your athletes..."}
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
                <p className="text-xs text-muted-foreground">Extracting filters and building the analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {state === "results" && (
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
                    <button className="text-xs text-primary hover:underline">+ Add filter</button>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" /> Re-run
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Results — {MOCK_RESULT_ROWS.length} athletes</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 text-xs"><Copy className="w-3 h-3" /> Copy</Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs">Export CSV</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Rank</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">School</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Composite</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">V. Jump (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MOCK_RESULT_ROWS.map((r) => (
                    <tr key={r.rank} className="hover:bg-muted/30 cursor-pointer">
                      <td className="py-2 pr-4 font-bold text-muted-foreground">#{r.rank}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{r.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{r.school}</td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="outline" className="text-xs">{r.score}</Badge>
                      </td>
                      <td className="py-2 text-right font-semibold text-primary">{r.metric} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1.5">
              <p>I ranked athletes by their vertical jump performance, sorted highest to lowest. The top 5 athletes shown here all scored above the 70th percentile in their respective cohorts.</p>
              <p className="text-xs italic">This analysis is based on the current dataset of 82 athletes. Results reflect cohort-relative performance, not absolute sports science benchmarks.</p>
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
            {SAVED_TEMPLATES.map((t) => (
              <div key={t.id} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.query}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t.lastUsed}
                  </span>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuery(t.query)}>Run</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
