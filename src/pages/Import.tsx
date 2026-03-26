import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload, FileText, CheckCircle, Download,
  ChevronRight, RotateCcw, CheckCircle2, ArrowRight,
  Info, AlertTriangle, AlertCircle, Wrench, Users, GitMerge,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useAthletes } from "@/hooks/useAthletes";
import { enrichAthletes } from "@/engine/analyticsEngine";
import {
  parseCSVText, rowsToAthletes, generateCSVTemplate,
  ParseResult, BatchMeta, DataQualityIssue,
} from "@/lib/csvParser";
import { cn } from "@/lib/utils";

type ImportStep = 1 | 2 | 3 | 3.5 | 4 | 5;

const STEPS = [
  { id: 1,   label: "Upload",       num: 1 },
  { id: 2,   label: "Map Fields",   num: 2 },
  { id: 3,   label: "Validate",     num: 3 },
  { id: 3.5, label: "Data Quality", num: 4 },
  { id: 4,   label: "Review",       num: 5 },
  { id: 5,   label: "Done",         num: 6 },
];

const FIELD_MAP = [
  { detected: "studentId",              altName: "ID (optional)",    platform: "Athlete ID",                                    required: false },
  { detected: "Athlete Name",           altName: "name",             platform: "Athlete Name",                                  required: true  },
  { detected: "Height",                 altName: "Height_cm",        platform: "Height (cm)",                                   required: true  },
  { detected: "Weight",                 altName: "Weight_kg",        platform: "Weight (kg)",                                   required: true  },
  { detected: "Gender",                 altName: "M or F",           platform: "Gender — set at batch level in Step 1",         required: false },
  { detected: "Age",                    altName: "years",            platform: "Age — set at batch level in Step 1",            required: false },
  { detected: "Thirty mflingstarts",    altName: "Sprint_30m",       platform: "30m Sprint (seconds)",                         required: false },
  { detected: "Standinggbroadjump",     altName: "Broad_Jump",       platform: "Standing Broad Jump (cm)",                     required: false },
  { detected: "Shuttlerun10Mx6",        altName: "Shuttle_Run",      platform: "Shuttle Run 10m×6 (seconds)",                  required: false },
  { detected: "Verticaljump",           altName: "V_Jump",           platform: "Vertical Jump (cm) — auto-corrects wall-reach", required: false },
  { detected: "Footballballthrow5No",   altName: "Football_Throw",   platform: "Football Throw best of 5 (metres)",            required: false },
  { detected: "Eighthundredmetersrun",  altName: "Run_800m",         platform: "800m Run — Bihar format M:SS:cs auto-detected", required: false },
  { detected: "School",                 altName: "school name",      platform: "School Name",                                  required: false },
  { detected: "District",              altName: "district",         platform: "District",                                     required: false },
];

const AGE_GROUPS: BatchMeta["ageGroup"][] = ["U10", "U12", "U14", "U16", "U18", "Open"];
const GENDERS: { value: BatchMeta["gender"]; label: string; desc: string }[] = [
  { value: "M",      label: "All Male",   desc: "Apply male norms to all athletes" },
  { value: "F",      label: "All Female", desc: "Apply female norms to all athletes" },
  { value: "Mixed",  label: "Mixed",      desc: "Use gender column in file (M/F per row)" },
];

const IMPORT_HISTORY_KEY = "pratibha_import_history";

interface HistoryEntry {
  id: string; date: string; file: string; rows: number;
  valid: number; warnings: number; errors: number;
  status: "success" | "partial"; version: string;
}

function loadHistory(): HistoryEntry[] {
  try {
    const saved = localStorage.getItem(IMPORT_HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  // Return empty array — no fake/hardcoded history
  return [];
}
function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

// ─── Severity config ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  blocked: {
    icon: AlertCircle,
    label: "Will NOT be scored",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    rowClass: "bg-red-50/60 border-l-4 border-l-red-400",
    description: "Critical data issue — CAI cannot be calculated",
  },
  verify: {
    icon: AlertTriangle,
    label: "Verify with coach",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300",
    rowClass: "bg-amber-50/60 border-l-4 border-l-amber-400",
    description: "Implausible value detected — metric excluded from score",
  },
  auto_corrected: {
    icon: Wrench,
    label: "Auto-corrected",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300",
    rowClass: "bg-blue-50/40 border-l-4 border-l-blue-400",
    description: "Value adjusted automatically — review if unexpected",
  },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { t } = useTranslation();
  const { addDataset, addBatchUpdate, athletes: currentAthletes } = useAthletes();
  const navigate = useNavigate();

  const [step, setStep]               = useState<ImportStep>(1);
  const [dragging, setDragging]       = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawRows, setRawRows]         = useState<Record<string, string>[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode]   = useState<"replace" | "append" | "batch_update">("replace");
  const [importHistory, setImportHistory] = useState<HistoryEntry[]>(loadHistory);
  const [batchMeta, setBatchMeta]     = useState<Partial<BatchMeta>>({});
  const [showBmiDetail, setShowBmiDetail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUploaded  = uploadedFile !== null;
  const metaComplete  = !!batchMeta.ageGroup && !!batchMeta.gender;
  const validCount    = parseResult ? parseResult.athletes.length - parseResult.warnings.length : 0;
  const warningCount  = parseResult ? parseResult.warnings.length : 0;
  const errorCount    = parseResult ? parseResult.errors.length : 0;
  const totalRows     = parseResult ? parseResult.athletes.length + parseResult.skipped : 0;

  /** Re-run the parser when batch meta is confirmed */
  const runParse = useCallback((rows: Record<string, string>[], meta: BatchMeta) => {
    const result = rowsToAthletes(rows, meta);
    setParseResult(result);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file) return;
    setUploadedFile(file);
    setParseResult(null);

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: "",
          raw: false,
        });
        setRawRows(rows);
        // Run immediate preview parse (no batch meta yet — just for column detection)
        setParseResult(rowsToAthletes(rows));
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        setRawRows(rows);
        setParseResult(rowsToAthletes(rows));
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  const handleZoneClick = () => { if (!fileUploaded) fileInputRef.current?.click(); };
  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pratibha_athlete_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  /** Advance from step 1 to step 2 — re-parse with confirmed batch meta */
  const handleContinueFromStep1 = () => {
    if (metaComplete && rawRows.length > 0) {
      runParse(rawRows, batchMeta as BatchMeta);
    }
    setStep(2);
  };

  const handleConfirmImport = () => {
    if (!parseResult || !uploadedFile) return;
    const incoming = enrichAthletes(parseResult.athletes);
    const version = `v${importHistory.length + 1}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    if (importMode === "batch_update") {
      addBatchUpdate(
        { name: uploadedFile.name, version, count: incoming.length, importedAt: todayStr, source: "import", isBatchUpdate: true },
        incoming,
      );
    } else {
      const final = importMode === "append" ? [...currentAthletes, ...incoming] : incoming;
      addDataset(
        { name: uploadedFile.name, version, count: final.length, importedAt: todayStr, source: "import" },
        final,
      );
    }

    const entry: HistoryEntry = {
      id: `h${Date.now()}`, date: todayStr, file: uploadedFile.name,
      rows: totalRows, valid: validCount, warnings: warningCount, errors: errorCount,
      status: errorCount > 0 ? "partial" : "success", version,
    };
    const next = [entry, ...importHistory];
    setImportHistory(next); saveHistory(next);
    setStep(5);
  };

  // ── BMI nutrition summary (from parseResult) ──────────────────────────────
  const bmi = parseResult?.bmiSummary;
  const bmiAtRisk = bmi ? bmi.severeThinness + bmi.thinness : 0;
  const showNutritionAlert = bmiAtRisk >= 2;

  // ── Data quality summary ─────────────────────────────────────────────────
  const dqIssues = parseResult?.dataQualityIssues ?? [];
  const blocked       = dqIssues.filter(i => i.severity === "blocked");
  const needsVerify   = dqIssues.filter(i => i.severity === "verify");
  const autoCorrected = dqIssues.filter(i => i.severity === "auto_corrected");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload athlete assessment data via CSV or Excel. Set batch context, validate, and import into Explorer.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <button
              onClick={() => (s.id <= step) && setStep(s.id as ImportStep)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                step === s.id ? "bg-primary text-primary-foreground" :
                s.id < step  ? "text-primary cursor-pointer hover:bg-primary/10" :
                "text-muted-foreground cursor-default"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                step === s.id ? "bg-primary-foreground text-primary border-primary-foreground" :
                s.id < step  ? "bg-primary text-primary-foreground border-primary" :
                "border-muted-foreground text-muted-foreground"
              )}>
                {s.id < step ? <CheckCircle className="w-3.5 h-3.5" /> : Math.ceil(s.id)}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-0.5 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ══════════════ STEP 1: Upload + Batch Meta ══════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          {/* ── Batch context (REQUIRED before scoring) ── */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                Batch Context — Required
              </CardTitle>
              <CardDescription>
                Age group and gender must be set before scores can be calculated against the correct norm table.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Age Group */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Age Group <span className="text-destructive">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((ag) => (
                    <button
                      key={ag}
                      onClick={() => setBatchMeta((p) => ({ ...p, ageGroup: ag }))}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        batchMeta.ageGroup === ag
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "border-border hover:border-primary/60 hover:bg-muted/30"
                      )}
                    >
                      {ag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Gender <span className="text-destructive">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setBatchMeta((p) => ({ ...p, gender: g.value }))}
                      className={cn(
                        "border rounded-xl p-3 text-left transition-all",
                        batchMeta.gender === g.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/10"
                      )}
                    >
                      <div className="font-semibold text-sm">{g.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {!metaComplete && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Age group and gender are required to calculate scores against the correct norm table.
                </div>
              )}
              {metaComplete && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Ready — norms will use <strong>{batchMeta.ageGroup}</strong> / <strong>{batchMeta.gender === "M" ? "Male" : batchMeta.gender === "F" ? "Female" : "Mixed"}</strong> benchmarks.
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── File Upload ── */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Drag &amp; drop a CSV or Excel file, or click to browse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.tsv,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={handleZoneClick}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer select-none",
                  dragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/20"
                )}
              >
                {fileUploaded ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-foreground text-lg">{uploadedFile?.name}</p>
                    {parseResult && (
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 font-medium">{parseResult.athletes.length} athletes detected</span>
                          {parseResult.skipped > 0 && (
                            <span className="text-destructive font-medium">{parseResult.skipped} skipped</span>
                          )}
                        </div>
                        {parseResult.unmappedColumns.filter(c => c && !["sl no","slno","#"].includes(c.toLowerCase())).length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-left max-w-sm">
                            <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Unrecognised columns (will be ignored):</p>
                            <p className="text-xs text-amber-600 font-mono break-all">
                              {parseResult.unmappedColumns.slice(0, 8).join(", ")}
                              {parseResult.unmappedColumns.length > 8 && ` +${parseResult.unmappedColumns.length - 8} more`}
                            </p>
                          </div>
                        )}
                        {parseResult.athletes.length === 0 && parseResult.skipped > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left max-w-sm">
                            <p className="text-xs font-semibold text-red-700 mb-1">❌ All rows skipped — likely cause:</p>
                            <p className="text-xs text-red-600">
                              Column "Athlete Name" (or "Name") was not found.
                              Detected: <span className="font-mono">{parseResult.headerSnapshot?.slice(0, 5).join(", ") ?? "none"}</span>
                            </p>
                            <p className="text-xs text-red-500 mt-1">Download the CSV template to see the expected format.</p>
                          </div>
                        )}
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null); setParseResult(null); setRawRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}>
                      <RotateCcw className="w-3 h-3 mr-1.5" /> Change file
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Drop your CSV or Excel file here</p>
                    <p className="text-muted-foreground text-sm">
                      or <span className="text-primary underline">click to browse</span> · Max 10MB
                    </p>
                    <p className="text-xs text-muted-foreground">Supported: .csv, .xlsx, .xls, .tsv</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-blue-700 space-y-0.5">
                  <p><strong>Bihar assessment format accepted.</strong> 800m times in Bihar H:MM:SS format are auto-corrected. Vertical jump wall-reach values (180–290cm) are auto-corrected using athlete height.</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4" /> Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={!fileUploaded || !parseResult || parseResult.athletes.length === 0 || !metaComplete}
              onClick={handleContinueFromStep1}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2: Map Fields ══════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                Auto-detected column mappings. Bihar assessment format and standard template names are both accepted.
                Batch context: <strong>{batchMeta.ageGroup}</strong> / <strong>{batchMeta.gender === "M" ? "Male" : batchMeta.gender === "F" ? "Female" : "Mixed"}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Bihar Format Column</th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Alt Name</th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Mapped To</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {FIELD_MAP.map((f) => (
                      <tr key={f.detected} className="hover:bg-muted/20">
                        <td className="py-2 pr-3">
                          <code className="bg-muted/50 px-2 py-0.5 rounded text-xs font-mono">{f.detected}</code>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">
                          <code className="bg-muted/30 px-1.5 py-0.5 rounded font-mono">{f.altName}</code>
                        </td>
                        <td className="py-2 pr-3 text-foreground">{f.platform}</td>
                        <td className="py-2">
                          {f.required
                            ? <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Required</Badge>
                            : <Badge variant="outline" className="text-xs">Optional</Badge>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)} className="gap-2">
              Validate Data <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3: Validate ══════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
              <CardDescription>Row-level check. Athletes with errors are skipped; warnings import with flags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{validCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Valid rows</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Warnings (will import)</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Errors (will skip)</div>
                </div>
              </div>

              {parseResult && (
                <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Row</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parseResult.warnings.map((r) => (
                        <tr key={`w${r.row}`} className="bg-amber-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3"><Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">⚠ Warning</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{r.issues.join(", ")}</td>
                        </tr>
                      ))}
                      {parseResult.errors.map((r) => (
                        <tr key={`e${r.row}`} className="bg-red-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3"><Badge className="bg-red-100 text-red-700 border-red-300 text-xs">✗ Error</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{r.issues.join(", ")}</td>
                        </tr>
                      ))}
                      {parseResult.athletes
                        .filter((a) => !parseResult.warnings.some((w) => w.name === a.name))
                        .slice(0, 10)
                        .map((a, i) => (
                          <tr key={`v${i}`}>
                            <td className="py-2 px-3 text-muted-foreground">{i + 2}</td>
                            <td className="py-2 px-3 font-medium">{a.name}</td>
                            <td className="py-2 px-3"><Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">✓ Valid</Badge></td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">—</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {parseResult.athletes.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2 border-t bg-muted/30">
                      + {parseResult.athletes.length - 10} more valid athletes not shown
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button
              disabled={!parseResult || parseResult.athletes.length === 0}
              onClick={() => setStep(3.5)}
              className="gap-2"
            >
              Data Quality Check <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3.5: Data Quality Screen ══════════════ */}
      {step === 3.5 && (
        <div className="space-y-4">
          {/* Summary header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Data Quality Summary
              </CardTitle>
              <CardDescription>
                Review all flagged values before scoring runs. Scores are NOT calculated for blocked athletes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{blocked.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Will not be scored</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{needsVerify.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Needs coach verification</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{autoCorrected.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Auto-corrected</div>
                </div>
              </div>

              {dqIssues.length === 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">All data looks clean!</p>
                    <p className="text-xs mt-0.5">No plausibility issues detected. All athletes are eligible for full scoring.</p>
                  </div>
                </div>
              )}

              {/* Blocked athletes */}
              {blocked.length > 0 && (
                <DataQualityGroup issues={blocked} severity="blocked" />
              )}

              {/* Needs verification */}
              {needsVerify.length > 0 && (
                <DataQualityGroup issues={needsVerify} severity="verify" />
              )}

              {/* Auto-corrected */}
              {autoCorrected.length > 0 && (
                <DataQualityGroup issues={autoCorrected} severity="auto_corrected" />
              )}
            </CardContent>
          </Card>

          {/* BMI Nutrition Alert */}
          {showNutritionAlert && bmi && (
            <Card className="border-orange-300 bg-orange-50/40">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-800 text-sm">
                      Nutrition Alert: {bmiAtRisk} athletes show thinness (BMI &lt; 16)
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Consider nutrition assessment before performance scoring.
                      This does <strong>not</strong> affect CAI scores — informational only.
                    </p>
                    <button
                      onClick={() => setShowBmiDetail(!showBmiDetail)}
                      className="text-xs text-orange-700 underline mt-1"
                    >
                      {showBmiDetail ? "Hide" : "View"} BMI breakdown
                    </button>
                    {showBmiDetail && (
                      <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-red-100 rounded p-2">
                          <div className="font-bold text-red-700">{bmi.severeThinness}</div>
                          <div className="text-muted-foreground">Severe<br/>BMI &lt;14</div>
                        </div>
                        <div className="bg-orange-100 rounded p-2">
                          <div className="font-bold text-orange-700">{bmi.thinness}</div>
                          <div className="text-muted-foreground">Thinness<br/>14–16</div>
                        </div>
                        <div className="bg-amber-100 rounded p-2">
                          <div className="font-bold text-amber-700">{bmi.mildThinness}</div>
                          <div className="text-muted-foreground">Mild<br/>16–18.5</div>
                        </div>
                        <div className="bg-emerald-100 rounded p-2">
                          <div className="font-bold text-emerald-700">{bmi.normal}</div>
                          <div className="text-muted-foreground">Normal<br/>18.5–23</div>
                        </div>
                        <div className="bg-amber-100 rounded p-2">
                          <div className="font-bold text-amber-700">{bmi.review}</div>
                          <div className="text-muted-foreground">Review<br/>&gt;23</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button
              disabled={!parseResult || parseResult.athletes.length === 0}
              onClick={() => setStep(4)}
              className="gap-2"
            >
              Review &amp; Confirm <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 4: Review & Confirm ══════════════ */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review &amp; Confirm</CardTitle>
              <CardDescription>Choose import mode and confirm to load athletes into Explorer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Total rows</div>
                  <div className="text-2xl font-bold">{parseResult?.athletes.length ?? 0}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Will import</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {importMode === "replace"
                      ? parseResult?.athletes.length ?? 0
                      : (currentAthletes.length + (parseResult?.athletes.length ?? 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {importMode === "append"
                      ? `(${currentAthletes.length} existing + ${parseResult?.athletes.length ?? 0} new)`
                      : "athletes total"}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Will skip</div>
                  <div className="text-2xl font-bold text-red-600">{parseResult?.skipped ?? 0}</div>
                  <div className="text-xs text-muted-foreground">error rows</div>
                </div>
              </div>

              {/* Data quality summary on confirm screen */}
              {dqIssues.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{blocked.length}</strong> athletes will not be scored (data flags) · <strong>{needsVerify.length}</strong> need coach verification · <strong>{autoCorrected.length}</strong> auto-corrected.
                  </span>
                </div>
              )}

              {/* Batch context confirm */}
              <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Batch norms: </span>
                <span className="font-semibold">{batchMeta.ageGroup} / {batchMeta.gender === "M" ? "Male" : batchMeta.gender === "F" ? "Female" : "Mixed"}</span>
              </div>

              {/* Import mode */}
              <div>
                <p className="text-sm font-medium mb-2">Import Mode</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setImportMode("replace")}
                    className={cn(
                      "border rounded-xl p-4 text-left transition-all",
                      importMode === "replace"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/20"
                    )}
                  >
                    <div className="font-semibold text-sm mb-0.5">Replace</div>
                    <div className="text-xs text-muted-foreground">
                      Remove all existing athletes and load only this file's data.
                    </div>
                  </button>
                  <button
                    onClick={() => setImportMode("append")}
                    className={cn(
                      "border rounded-xl p-4 text-left transition-all",
                      importMode === "append"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/20"
                    )}
                  >
                    <div className="font-semibold text-sm mb-0.5">Append</div>
                    <div className="text-xs text-muted-foreground">
                      Keep existing athletes and add new ones from this file.
                    </div>
                  </button>
                  <button
                    onClick={() => setImportMode("batch_update")}
                    className={cn(
                      "border rounded-xl p-4 text-left transition-all",
                      importMode === "batch_update"
                        ? "border-emerald-600 bg-emerald-50 shadow-sm"
                        : "border-border hover:border-emerald-400 hover:bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-sm mb-0.5">
                      <GitMerge className="w-3.5 h-3.5" />
                      Batch Update
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Match athletes by name, add new assessment to history. Powers TTI improvement tracking.
                    </div>
                  </button>
                </div>
                {importMode === "batch_update" && (
                  <div className="mt-2 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Athletes are matched by name. A new assessment record will be added to each matched athlete's history, enabling the Talent Trajectory Index (TTI) to track improvement over time.
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dataset label: </span>
                <span className="font-mono font-semibold">{uploadedFile?.name} · v{importHistory.length + 1}</span>
              </div>
            </CardContent>
          </Card>

          {/* BMI alert on review screen too */}
          {showNutritionAlert && bmi && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Nutrition note:</strong> {bmiAtRisk} athletes in this batch have BMI &lt; 16 (thinness). Consider nutrition assessment.
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3.5)}>Back</Button>
            <Button
              onClick={handleConfirmImport}
              className="gap-2 bg-primary text-primary-foreground"
              disabled={!parseResult || parseResult.athletes.length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              Import {parseResult?.athletes.length ?? 0} Athletes
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 5: Done ══════════════ */}
      {step === 5 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Import Successful!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {parseResult?.athletes.length ?? 0} athletes loaded into Explorer.
                {(parseResult?.skipped ?? 0) > 0 && ` ${parseResult?.skipped} rows were skipped.`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md text-sm">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-emerald-600">{parseResult?.athletes.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Athletes loaded</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{warningCount}</div>
                <div className="text-xs text-muted-foreground">With warnings</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">{parseResult?.skipped ?? 0}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/explorer")} className="gap-2">
                View Athletes in Explorer <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => {
                setStep(1); setUploadedFile(null); setParseResult(null); setRawRows([]);
                setBatchMeta({});
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════ Import History ══════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import History</CardTitle>
          <CardDescription>Previous imports for this instance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {importHistory.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center justify-between py-2.5 px-3 rounded-lg border text-sm",
                  i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium">{entry.file}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{entry.date} · {entry.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">{entry.rows} rows</span>
                  {entry.errors > 0
                    ? <Badge className="bg-amber-100 text-amber-700 text-xs">Partial</Badge>
                    : <Badge className="bg-emerald-100 text-emerald-700 text-xs">Success</Badge>
                  }
                  {i === 0 && <Badge className="bg-primary/10 text-primary text-xs border-primary/30">Active</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Data Quality Group Sub-component ────────────────────────────────────────

function DataQualityGroup({
  issues, severity,
}: {
  issues: DataQualityIssue[];
  severity: DataQualityIssue["severity"];
}) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{cfg.description}</span>
        <Badge className={cn("text-xs ml-auto", cfg.badgeClass)}>{issues.length} athletes</Badge>
      </div>
      <div className="space-y-2">
        {issues.map((iss) => (
          <div key={`${iss.rowNum}-${iss.athleteName}`} className={cn("rounded-lg border p-3 text-sm", cfg.rowClass)}>
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold">{iss.athleteName}</span>
              <Badge className={cn("text-xs shrink-0", cfg.badgeClass)}>{cfg.label}</Badge>
            </div>
            <ul className="mt-1.5 space-y-1">
              {iss.issues.map((issue, j) => (
                <li key={j} className="text-xs text-foreground/80 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>
                    <strong>{issue.metric}:</strong> {issue.description}
                    {issue.rawValue && (
                      <span className="text-muted-foreground ml-1 font-mono">
                        [raw: {issue.rawValue}
                        {issue.correctedValue && ` → ${issue.correctedValue}`}]
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
