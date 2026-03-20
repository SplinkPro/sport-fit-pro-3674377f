import { useState, useMemo } from "react";
import {
  FileText, Download, Printer, Users, BarChart2, User, Globe,
  CheckCircle, AlertTriangle, Star, TrendingUp, Calendar, Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAthletes } from "@/hooks/useAthletes";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import { cn } from "@/lib/utils";

type ReportType = "batch_csv" | "coach_pdf" | "analytics_csv" | "individual_txt";

const REPORT_TYPES = [
  {
    id: "batch_csv" as ReportType,
    icon: Database,
    title: "Batch Export — All Athletes",
    desc: "Export every athlete's metrics, scores, and sport-fit as a structured CSV. Ready for Excel or analysis tools.",
    badge: "CSV",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    borderActive: "border-emerald-400",
  },
  {
    id: "coach_pdf" as ReportType,
    icon: Users,
    title: "Coach Summary Report",
    desc: "Full cohort summary: top performers, athletes needing attention, sport distribution, and key stats — exported as a formatted text report.",
    badge: "TXT",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderActive: "border-blue-400",
  },
  {
    id: "analytics_csv" as ReportType,
    icon: BarChart2,
    title: "Analytics Snapshot",
    desc: "KPI summary, score distributions, gender breakdown, and sport-fit counts in a structured CSV for executive review.",
    badge: "CSV",
    color: "text-violet-600",
    bg: "bg-violet-50",
    borderActive: "border-violet-400",
  },
  {
    id: "individual_txt" as ReportType,
    icon: User,
    title: "Individual Athlete Card",
    desc: "Detailed profile for a single athlete: all metrics, percentiles, sport-fit rankings, flags, and guidance notes.",
    badge: "TXT",
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderActive: "border-amber-400",
  },
];

// ─── CSV / text generators ───────────────────────────────────────────────────

function generateBatchCSV(athletes: EnrichedAthlete[]): string {
  const headers = [
    "ID", "Name", "Gender", "Age", "School", "District",
    "Height(cm)", "Weight(kg)", "BMI",
    "VerticalJump(cm)", "BroadJump(cm)", "Sprint30m(s)", "Run800m(s)", "ShuttleRun(s)", "FootballThrow(m)",
    "CompositeScore", "Completeness(%)", "TopSport", "TopSportScore",
    "Speed%", "Power%", "Endurance%", "Agility%",
    "IsHighPotential", "Flags", "AssessmentDate",
  ];

  const rows = athletes.map((a) => [
    a.id,
    `"${a.name}"`,
    a.gender,
    a.age,
    `"${a.school}"`,
    `"${a.district}"`,
    a.height,
    a.weight,
    a.bmi ?? "",
    a.verticalJump ?? "",
    a.broadJump ?? "",
    a.sprint30m ?? "",
    a.run800m ?? "",
    a.shuttleRun ?? "",
    a.footballThrow ?? "",
    a.compositeScore ?? 0,
    a.completeness ?? 0,
    `"${a.topSport ?? ""}"`,
    a.topSportScore ?? 0,
    a.dimensionScores?.speed ?? "",
    a.dimensionScores?.power ?? "",
    a.dimensionScores?.endurance ?? "",
    a.dimensionScores?.agility ?? "",
    a.isHighPotential ? "Yes" : "No",
    `"${(a.flags ?? []).map((f) => f.message).join("; ")}"`,
    a.assessmentDate,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function generateAnalyticsCSV(athletes: EnrichedAthlete[]): string {
  const total = athletes.length;
  const males = athletes.filter((a) => a.gender === "M").length;
  const females = athletes.filter((a) => a.gender === "F").length;
  const highPotential = athletes.filter((a) => a.isHighPotential).length;
  const eligible = athletes.filter((a) => (a.completeness ?? 0) >= 60).length;
  const flagged = athletes.filter((a) => (a.flags?.length ?? 0) > 0).length;
  const avgComposite = Math.round(athletes.reduce((s, a) => s + (a.compositeScore ?? 0), 0) / Math.max(total, 1));
  const avgCompleteness = Math.round(athletes.reduce((s, a) => s + (a.completeness ?? 0), 0) / Math.max(total, 1));

  const sportCounts: Record<string, number> = {};
  athletes.forEach((a) => {
    if (a.topSport) sportCounts[a.topSport] = (sportCounts[a.topSport] ?? 0) + 1;
  });

  const lines = [
    "Section,Metric,Value",
    `Overview,Total Athletes,${total}`,
    `Overview,Male,${males}`,
    `Overview,Female,${females}`,
    `Overview,High Potential,${highPotential}`,
    `Overview,Eligible (completeness ≥60%),${eligible}`,
    `Overview,Flagged,${flagged}`,
    `Scores,Avg Composite Score,${avgComposite}`,
    `Scores,Avg Completeness,${avgCompleteness}%`,
    "",
    "Sport Distribution,Sport,Athlete Count",
    ...Object.entries(sportCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([sport, count]) => `Sport Distribution,"${sport}",${count}`),
    "",
    "Score Bands,Band,Count",
    `Score Bands,Excellent (≥85),${athletes.filter((a) => (a.compositeScore ?? 0) >= 85).length}`,
    `Score Bands,Above Average (70-84),${athletes.filter((a) => { const s = a.compositeScore ?? 0; return s >= 70 && s < 85; }).length}`,
    `Score Bands,Average (40-69),${athletes.filter((a) => { const s = a.compositeScore ?? 0; return s >= 40 && s < 70; }).length}`,
    `Score Bands,Below Average (20-39),${athletes.filter((a) => { const s = a.compositeScore ?? 0; return s >= 20 && s < 40; }).length}`,
    `Score Bands,Development (<20),${athletes.filter((a) => (a.compositeScore ?? 0) < 20).length}`,
  ];

  return lines.join("\n");
}

function generateCoachSummary(athletes: EnrichedAthlete[], datasetName: string): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const total = athletes.length;
  const males = athletes.filter((a) => a.gender === "M").length;
  const females = athletes.filter((a) => a.gender === "F").length;
  const highPotential = athletes.filter((a) => a.isHighPotential).sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
  const flagged = athletes.filter((a) => (a.flags?.length ?? 0) > 0);
  const avgScore = Math.round(athletes.reduce((s, a) => s + (a.compositeScore ?? 0), 0) / Math.max(total, 1));

  const sportCounts: Record<string, number> = {};
  athletes.forEach((a) => { if (a.topSport) sportCounts[a.topSport] = (sportCounts[a.topSport] ?? 0) + 1; });
  const topSports = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sep = "=".repeat(60);
  const dash = "-".repeat(60);

  const lines = [
    sep,
    "PRATIBHA ATHLETE INTELLIGENCE PLATFORM",
    "Coach Summary Report",
    `Dataset: ${datasetName}`,
    `Generated: ${today}`,
    sep,
    "",
    "COHORT OVERVIEW",
    dash,
    `Total Athletes       : ${total}`,
    `Male                 : ${males} (${Math.round(males / Math.max(total, 1) * 100)}%)`,
    `Female               : ${females} (${Math.round(females / Math.max(total, 1) * 100)}%)`,
    `High Potential       : ${highPotential.length} (${Math.round(highPotential.length / Math.max(total, 1) * 100)}%)`,
    `Average Score        : ${avgScore}/100`,
    `Athletes Flagged     : ${flagged.length}`,
    "",
    "TOP SPORT FIT DISTRIBUTION",
    dash,
    ...topSports.map(([sport, count]) => `${sport.padEnd(25)}: ${count} athletes`),
    "",
    "HIGH POTENTIAL ATHLETES (Top 15)",
    dash,
    ...highPotential.slice(0, 15).map((a, i) =>
      `${String(i + 1).padStart(2)}. ${a.name.padEnd(25)} Score: ${a.compositeScore ?? 0}/100  Sport: ${a.topSport ?? "—"}  ${a.school}`
    ),
    "",
    "ATHLETES REQUIRING ATTENTION",
    dash,
    flagged.length === 0
      ? "No athletes flagged."
      : flagged.slice(0, 20).map((a) =>
          `• ${a.name} (${a.id}) — ${(a.flags ?? []).map((f) => f.message).join("; ")}`
        ).join("\n"),
    "",
    "METRIC COMPLETENESS",
    dash,
    `Athletes with full data (≥60%): ${athletes.filter((a) => (a.completeness ?? 0) >= 60).length}/${total}`,
    `Athletes missing key metrics  : ${athletes.filter((a) => (a.completeness ?? 0) < 40).length}/${total}`,
    "",
    sep,
    "Powered by Pratibha · SPLINK Sports Intelligence",
    sep,
  ];

  return lines.join("\n");
}

function generateIndividualCard(athlete: EnrichedAthlete): string {
  const sep = "=".repeat(50);
  const dash = "-".repeat(50);
  const fmt = (v: number | undefined, unit = "") => v != null ? `${v}${unit}` : "—";

  const sportFitTop5 = (athlete.sportFit ?? []).slice(0, 5);

  const lines = [
    sep,
    "PRATIBHA ATHLETE PROFILE CARD",
    sep,
    `Name         : ${athlete.name}`,
    `ID           : ${athlete.id}`,
    `Gender       : ${athlete.gender === "M" ? "Male" : "Female"}`,
    `Age          : ${athlete.age} years`,
    `School       : ${athlete.school}`,
    `District     : ${athlete.district}`,
    `Assessment   : ${athlete.assessmentDate}`,
    "",
    "ANTHROPOMETRY",
    dash,
    `Height       : ${fmt(athlete.height, " cm")}`,
    `Weight       : ${fmt(athlete.weight, " kg")}`,
    `BMI          : ${fmt(athlete.bmi)}`,
    "",
    "PERFORMANCE METRICS",
    dash,
    `Vertical Jump  : ${fmt(athlete.verticalJump, " cm")}`,
    `Broad Jump     : ${fmt(athlete.broadJump, " cm")}`,
    `30m Sprint     : ${fmt(athlete.sprint30m, " s")}`,
    `800m Run       : ${fmt(athlete.run800m, " s")}`,
    `Shuttle Run    : ${fmt(athlete.shuttleRun, " s")}`,
    `Football Throw : ${fmt(athlete.footballThrow, " m")}`,
    "",
    "SCORES",
    dash,
    `Composite Score  : ${athlete.compositeScore ?? 0}/100`,
    `Completeness     : ${athlete.completeness ?? 0}%`,
    `High Potential   : ${athlete.isHighPotential ? "YES ★" : "No"}`,
    "",
    "DIMENSION SCORES",
    dash,
    `Speed       : ${athlete.dimensionScores?.speed ?? "—"}th percentile`,
    `Power       : ${athlete.dimensionScores?.power ?? "—"}th percentile`,
    `Endurance   : ${athlete.dimensionScores?.endurance ?? "—"}th percentile`,
    `Agility     : ${athlete.dimensionScores?.agility ?? "—"}th percentile`,
    "",
    "SPORT FIT RANKING (Top 5)",
    dash,
    ...sportFitTop5.map((sf, i) => `${i + 1}. ${sf.sport.nameEn.padEnd(20)} ${sf.matchScore}/100`),
    "",
    ...(athlete.flags && athlete.flags.length > 0
      ? ["FLAGS", dash, ...(athlete.flags.map((f) => `⚠ ${f.message}`)), ""]
      : []),
    sep,
    "Powered by Pratibha · SPLINK Sports Intelligence",
    sep,
  ];

  return lines.join("\n");
}

function downloadText(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { athletes, datasetMeta } = useAthletes();
  const [selectedType, setSelectedType] = useState<ReportType>("batch_csv");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{ filename: string; size: string } | null>(null);
  const [lastContent, setLastContent] = useState<string>("");
  const [lastMime, setLastMime] = useState<string>("text/plain");
  const [lastFilename, setLastFilename] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);
  const totalAthletes = athletes.length;
  const highPotential = athletes.filter((a) => a.isHighPotential).length;
  const flagged = athletes.filter((a) => (a.flags?.length ?? 0) > 0).length;

  const sortedAthletes = useMemo(
    () => [...athletes].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0)),
    [athletes]
  );

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId) ?? athletes[0];

  const handleGenerate = () => {
    if (athletes.length === 0) return;
    setGenerating(true);
    setLastGenerated(null);

    setTimeout(() => {
      let content = "";
      let filename = "";
      let mime = "text/plain";

      if (selectedType === "batch_csv") {
        content = generateBatchCSV(athletes);
        filename = `pratibha_athletes_${today}.csv`;
        mime = "text/csv";
      } else if (selectedType === "analytics_csv") {
        content = generateAnalyticsCSV(athletes);
        filename = `pratibha_analytics_${today}.csv`;
        mime = "text/csv";
      } else if (selectedType === "coach_pdf") {
        content = generateCoachSummary(athletes, datasetMeta.name);
        filename = `pratibha_coach_summary_${today}.txt`;
        mime = "text/plain";
      } else if (selectedType === "individual_txt") {
        const target = selectedAthlete ?? athletes[0];
        if (!target) return;
        content = generateIndividualCard(target);
        filename = `pratibha_${target.name.replace(/\s+/g, "_").toLowerCase()}_${today}.txt`;
        mime = "text/plain";
      }

      const sizeKb = (new Blob([content]).size / 1024).toFixed(1);
      setLastContent(content);
      setLastMime(mime);
      setLastFilename(filename);
      setLastGenerated({ filename, size: `${sizeKb} KB` });
      setGenerating(false);
    }, 600);
  };

  const handleDownload = () => {
    if (lastContent && lastFilename) downloadText(lastContent, lastFilename, lastMime);
  };

  const handlePrint = () => {
    if (!lastContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap;padding:20px">${lastContent.replace(/</g, "&lt;")}</pre>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Reports & Exports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate and download athlete reports, batch exports, and analytics snapshots.
          </p>
        </div>
        {/* Live KPIs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 px-2.5 py-1.5 bg-muted rounded-lg">
            <Users className="w-3.5 h-3.5" /> {totalAthletes} athletes
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <Star className="w-3.5 h-3.5" /> {highPotential} high potential
          </span>
          {flagged > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" /> {flagged} flagged
            </span>
          )}
        </div>
      </div>

      {/* Active dataset banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
        <Database className="w-4 h-4 text-primary shrink-0" />
        <span className="font-medium text-foreground">{datasetMeta.name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{datasetMeta.count} athletes · {datasetMeta.version}</span>
        {datasetMeta.source === "seed" && (
          <Badge variant="outline" className="text-xs ml-1 text-amber-700 border-amber-300 bg-amber-50">DEMO DATA</Badge>
        )}
      </div>

      {athletes.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>No athletes loaded. Go to <strong>Data Import</strong> to load a dataset first.</span>
        </div>
      )}

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => { setSelectedType(rt.id); setLastGenerated(null); }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
              selectedType === rt.id
                ? `border-primary bg-primary/5 shadow-sm`
                : "border-border hover:border-primary/30 hover:bg-muted/20"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              selectedType === rt.id ? "bg-primary text-primary-foreground" : `${rt.bg} ${rt.color}`
            )}>
              <rt.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{rt.title}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{rt.badge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Options + Generate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Options</CardTitle>
          <CardDescription>Configure and generate your selected report type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Athlete selector for individual report */}
          {selectedType === "individual_txt" && (
            <div>
              <label className="text-sm font-medium block mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-muted-foreground" /> Select Athlete
              </label>
              <Select value={selectedAthleteId || sortedAthletes[0]?.id} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an athlete…" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {sortedAthletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span>{a.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {a.id} · Score: {a.compositeScore ?? 0}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* What will be exported */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs text-muted-foreground">
            {selectedType === "batch_csv" && (
              <>
                <p className="font-medium text-foreground">What's included in the CSV:</p>
                <p>All {totalAthletes} athletes · ID, name, gender, age, school, district, all metrics, composite score, completeness, sport-fit, dimension scores, flags, assessment date.</p>
              </>
            )}
            {selectedType === "analytics_csv" && (
              <>
                <p className="font-medium text-foreground">What's included in the Analytics CSV:</p>
                <p>Cohort KPIs, gender split, high potential count, score band distribution, top sport counts, and completeness stats.</p>
              </>
            )}
            {selectedType === "coach_pdf" && (
              <>
                <p className="font-medium text-foreground">What's included in the Coach Summary:</p>
                <p>Cohort overview, top sport distribution, top 15 high-potential athletes ranked by score, flagged athletes list, and completeness summary.</p>
              </>
            )}
            {selectedType === "individual_txt" && selectedAthlete && (
              <>
                <p className="font-medium text-foreground">Profile card for: <span className="text-primary">{(selectedAthlete ?? sortedAthletes[0])?.name}</span></p>
                <p>Full metrics, percentile scores, all dimension scores, sport-fit top 5, flags, and school details.</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleGenerate}
              disabled={generating || athletes.length === 0}
              className="gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" /> Generate Report
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 inline mr-1" />
              {today}
            </span>
          </div>

          {/* Download panel */}
          {lastGenerated && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Report ready to download</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastGenerated.filename} · {lastGenerated.size}
                </p>
              </div>
              <div className="flex gap-2">
                {(selectedType === "coach_pdf" || selectedType === "individual_txt") && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handlePrint}>
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                )}
                <Button size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Export Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Exports</CardTitle>
          <CardDescription>One-click exports directly from the current dataset.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quick: All athletes CSV */}
            <button
              onClick={() => {
                const csv = generateBatchCSV(athletes);
                downloadText(csv, `pratibha_athletes_${today}.csv`, "text/csv");
              }}
              disabled={athletes.length === 0}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left disabled:opacity-40"
            >
              <Database className="w-8 h-8 text-emerald-600 bg-emerald-50 rounded-lg p-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">All Athletes</p>
                <p className="text-[11px] text-muted-foreground">{totalAthletes} records → CSV</p>
              </div>
            </button>

            {/* Quick: High potential CSV */}
            <button
              onClick={() => {
                const hp = athletes.filter((a) => a.isHighPotential);
                const csv = generateBatchCSV(hp);
                downloadText(csv, `pratibha_high_potential_${today}.csv`, "text/csv");
              }}
              disabled={highPotential === 0}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left disabled:opacity-40"
            >
              <Star className="w-8 h-8 text-amber-600 bg-amber-50 rounded-lg p-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">High Potential</p>
                <p className="text-[11px] text-muted-foreground">{highPotential} athletes → CSV</p>
              </div>
            </button>

            {/* Quick: Flagged athletes CSV */}
            <button
              onClick={() => {
                const fl = athletes.filter((a) => (a.flags?.length ?? 0) > 0);
                const csv = generateBatchCSV(fl);
                downloadText(csv, `pratibha_flagged_${today}.csv`, "text/csv");
              }}
              disabled={flagged === 0}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left disabled:opacity-40"
            >
              <AlertTriangle className="w-8 h-8 text-red-600 bg-red-50 rounded-lg p-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Flagged Athletes</p>
                <p className="text-[11px] text-muted-foreground">{flagged} records → CSV</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
