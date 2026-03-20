import { useState } from "react";
import { FileText, Download, Printer, Users, BarChart2, User, Globe, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type ReportType = "athlete" | "batch" | "analytics" | "coach";

const REPORT_TYPES = [
  { id: "athlete" as ReportType, icon: User, title: "Individual Athlete Report", desc: "Full profile PDF for a single athlete: overview, performance, sport-fit, and guidance.", badge: "PDF" },
  { id: "coach" as ReportType, icon: Users, title: "Coach Summary Report", desc: "Cohort summary for coaches: top performers, attention flags, and batch insights.", badge: "PDF" },
  { id: "analytics" as ReportType, icon: BarChart2, title: "Analytics Snapshot", desc: "Executive and analyst dashboard export: KPIs, charts, and distribution summaries.", badge: "PDF + CSV" },
  { id: "batch" as ReportType, icon: FileText, title: "Batch Export (All Athletes)", desc: "Export all athlete records with metrics, scores, and sport-fit as a structured CSV.", badge: "CSV" },
];

const RECENT_REPORTS = [
  { id: 1, name: "Athlete Report — Ravi Kumar", type: "Individual", lang: "EN", date: "2024-03-18", size: "1.2 MB" },
  { id: 2, name: "Coach Summary — March 2024", type: "Coach Summary", lang: "EN + HI", date: "2024-03-15", size: "2.8 MB" },
  { id: 3, name: "Analytics Snapshot — Q1 2024", type: "Analytics", lang: "EN", date: "2024-03-01", size: "3.5 MB" },
  { id: 4, name: "Full Athlete Export — All", type: "CSV Export", lang: "—", date: "2024-02-28", size: "124 KB" },
];

export default function ReportsPage() {
  const { t, language } = useTranslation();
  const [selectedType, setSelectedType] = useState<ReportType>("coach");
  const [reportLang, setReportLang] = useState<"en" | "hi" | "both">("en");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Reports & Exports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Generate bilingual reports, export athlete data, and download analytics snapshots.</p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => { setSelectedType(rt.id); setGenerated(false); }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
              selectedType === rt.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              selectedType === rt.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <rt.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{rt.title}</span>
                <Badge variant="outline" className="text-xs ml-2 shrink-0">{rt.badge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language selector */}
          <div>
            <label className="text-sm font-medium block mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" /> Report Language
            </label>
            <div className="flex gap-2">
              {(["en", "hi", "both"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setReportLang(l)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm border transition-colors",
                    reportLang === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {l === "en" ? "English" : l === "hi" ? "हिंदी" : "English + हिंदी"}
                </button>
              ))}
            </div>
          </div>

          {/* Athlete selector (for individual) */}
          {selectedType === "athlete" && (
            <div>
              <label className="text-sm font-medium block mb-2">Select Athlete</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>Ravi Kumar (SPL-001)</option>
                <option>Priya Singh (SPL-002)</option>
                <option>Arjun Verma (SPL-003)</option>
              </select>
            </div>
          )}

          {/* Branding note */}
          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            Reports will be branded with: <span className="font-medium text-foreground">Bihar Sports Department · Pratibha by SPLINK</span>. Configure branding in Settings.
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="gap-2 w-full sm:w-auto">
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> Generate Report
              </>
            )}
          </Button>

          {generated && (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Report ready</p>
                <p className="text-xs text-muted-foreground">Coach Summary — March 2024 · {reportLang === "both" ? "EN + HI" : reportLang.toUpperCase()} · 2.8 MB</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                  <Printer className="w-3 h-3" /> Print
                </Button>
                <Button size="sm" className="gap-1 text-xs h-7">
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <CardDescription>Reports generated in the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {RECENT_REPORTS.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.type} · {r.date} · {r.size}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.lang !== "—" && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {r.lang}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                    <Download className="w-3 h-3" />
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
