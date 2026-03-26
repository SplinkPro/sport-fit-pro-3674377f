import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload, FileText, CheckCircle, Download,
  ChevronRight, RotateCcw, CheckCircle2, ArrowRight,
  Info, AlertTriangle, AlertCircle, Wrench, Users, GitMerge,
  Loader2, Search, ChevronDown, ChevronUp,
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
  { detected: "Gender",                 altName: "M / F / Mixed",    platform: "Gender — set at batch level or per-row",        required: false },
  { detected: "Age",                    altName: "years",            platform: "Age — set at batch level or per-row",            required: false },
  { detected: "Height",                 altName: "Height_cm",        platform: "Height (cm) — auto-corrects meters",            required: false },
  { detected: "Weight",                 altName: "Weight_kg",        platform: "Weight (kg)",                                   required: false },
  { detected: "Thirty mflingstarts",    altName: "Sprint_30m",       platform: "30m Sprint (seconds)",                         required: false },
  { detected: "Standinggbroadjump",     altName: "Broad_Jump",       platform: "Standing Broad Jump (cm)",                     required: false },
  { detected: "Shuttlerun10Mx6",        altName: "Shuttle_Run",      platform: "Shuttle Run 10m×6 (seconds)",                  required: false },
  { detected: "Verticaljump",           altName: "V_Jump",           platform: "Vertical Jump (cm) — auto-corrects wall-reach", required: false },
  { detected: "Footballballthrow5No",   altName: "Football_Throw",   platform: "Football Throw best of 5 (metres)",            required: false },
  { detected: "Eighthundredmetersrun",  altName: "Run_800m",         platform: "800m Run — all formats auto-detected",          required: false },
  { detected: "School",                 altName: "school name",      platform: "School Name",                                  required: false },
  { detected: "District",              altName: "district",         platform: "District",                                     required: false },
];

const AGE_GROUPS: BatchMeta["ageGroup"][] = ["U10", "U12", "U14", "U16", "U18", "Open"];
const GENDERS: { value: BatchMeta["gender"]; label: string; desc: string }[] = [
  { value: "M",      label: "All Male",   desc: "Apply male norms to all athletes" },
  { value: "F",      label: "All Female", desc: "Apply female norms to all athletes" },
  { value: "Mixed",  label: "Mixed",      desc: "Use gender column in file (M/F per row)" },
];

const SEVERITY_CONFIG = {
  blocked: {
    icon: AlertCircle,
    label: "Will NOT be scored",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    rowClass: "bg-red-50/60 border-l-4 border-l-red-400",
    description: "Multiple critical metrics flagged — CAI cannot be calculated",
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
  const [batchMeta, setBatchMeta]     = useState<Partial<BatchMeta>>({});
  const [showBmiDetail, setShowBmiDetail] = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [showAllValid, setShowAllValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUploaded  = uploadedFile !== null;
  const metaComplete  = !!batchMeta.ageGroup && !!batchMeta.gender;
  
  // Fixed: count athletes that have NO errors/warnings as truly valid
  const cleanAthletes = parseResult 
    ? parseResult.athletes.filter(a => 
        !parseResult.warnings.some(w => w.name === a.name) &&
        !parseResult.dataQualityIssues.some(d => d.athleteName === a.name && d.severity === "blocked")
      )
    : [];
  const validCount    = cleanAthletes.length;
  const warningCount  = parseResult ? parseResult.warnings.length : 0;
  const errorCount    = parseResult ? parseResult.errors.length : 0;
  const totalRows     = parseResult ? parseResult.totalInputRows ?? (parseResult.athletes.length + parseResult.skipped) : 0;

  const runParse = useCallback((rows: Record<string, string>[], meta: BatchMeta) => {
    setProcessing(true);
    // Use setTimeout to let UI update with loading state
    setTimeout(() => {
      const result = rowsToAthletes(rows, meta);
      setParseResult(result);
      setProcessing(false);
    }, 50);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file) return;
    setUploadedFile(file);
    setParseResult(null);
    setProcessing(true);

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
        const result = rowsToAthletes(rows);
        setParseResult(result);
        setProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        setRawRows(rows);
        const result = rowsToAthletes(rows);
        setParseResult(result);
        setProcessing(false);
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
  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };
  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pratibha_athlete_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinueFromStep1 = () => {
    if (metaComplete && rawRows.length > 0) {
      runParse(rawRows, batchMeta as BatchMeta);
    }
    setStep(2);
  };

  const handleConfirmImport = () => {
    if (!parseResult || !uploadedFile) return;
    setProcessing(true);
    setTimeout(() => {
      const incoming = enrichAthletes(parseResult.athletes);
      const version = `v1`;
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

      setProcessing(false);
      setStep(5);
    }, 100);
  };

  const bmi = parseResult?.bmiSummary;
  const bmiAtRisk = bmi ? bmi.severeThinness + bmi.thinness : 0;
  const showNutritionAlert = bmiAtRisk >= 2;

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
          Upload athlete assessment data via CSV or Excel. No record limit — supports files with 100,000+ athletes.
        </p>
      </div>

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-8 shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-semibold text-foreground">Processing data…</p>
            <p className="text-sm text-muted-foreground">
              {rawRows.length > 0 ? `${rawRows.length.toLocaleString()} rows detected` : "Reading file…"}
            </p>
          </div>
        </div>
      )}

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
                {s.id < step ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
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

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Drag &amp; drop a CSV or Excel file, or click to browse. No record limit.</CardDescription>
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
                          <span className="text-emerald-600 font-medium">{parseResult.athletes.length.toLocaleString()} athletes detected</span>
                          {parseResult.skipped > 0 && (
                            <span className="text-destructive font-medium">{parseResult.skipped.toLocaleString()} skipped</span>
                          )}
                          <span className="text-muted-foreground">{rawRows.length.toLocaleString()} total rows</span>
                        </div>
                        {parseResult.unmappedColumns.filter(c => c && !["sl no","slno","#","sino"].includes(normaliseHeaderSimple(c))).length > 0 && (
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
                    <p className="text-xs text-muted-foreground">Click anywhere to upload a different file</p>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null); setParseResult(null); setRawRows([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                      }
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
                      or <span className="text-primary underline">click to browse</span> · No size or record limit
                    </p>
                    <p className="text-xs text-muted-foreground">Supported: .csv, .xlsx, .xls, .tsv</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-blue-700 space-y-0.5">
                  <p><strong>Smart auto-detection.</strong> Bihar format, Excel serial times, wall-reach VJ, and height in meters are all auto-corrected. Invalid metrics are excluded per-athlete — the athlete is still imported.</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4" /> Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {!metaComplete && fileUploaded && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Select age group &amp; gender above to continue
              </p>
            )}
            {!fileUploaded && metaComplete && (
              <p className="text-xs text-muted-foreground">Upload a file above to continue</p>
            )}
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
                Auto-detected column mappings. Only "Athlete Name" is required — all other fields are optional and will use safe defaults.
                <br />Batch: <strong>{batchMeta.ageGroup}</strong> / <strong>{batchMeta.gender === "M" ? "Male" : batchMeta.gender === "F" ? "Female" : "Mixed"}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show which columns from file were detected */}
              {parseResult && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Detected in file:</span>
                  {parseResult.detectedColumns.map(c => (
                    <Badge key={c} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">{c}</Badge>
                  ))}
                  {parseResult.unmappedColumns.filter(c => c.trim()).map(c => (
                    <Badge key={c} variant="outline" className="text-xs text-muted-foreground">{c} (ignored)</Badge>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Column Name</th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Alt Names</th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Maps To</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {FIELD_MAP.map((f) => {
                      const isDetected = parseResult?.detectedColumns.some(d => {
                        const norm = d.toLowerCase().replace(/[^a-z0-9]/g, "");
                        const fNorm = f.detected.toLowerCase().replace(/[^a-z0-9]/g, "");
                        const altNorm = f.altName.toLowerCase().replace(/[^a-z0-9]/g, "");
                        return norm === fNorm || norm === altNorm;
                      });
                      return (
                        <tr key={f.detected} className={cn("hover:bg-muted/20", isDetected && "bg-emerald-50/50")}>
                          <td className="py-2 pr-3">
                            <code className="bg-muted/50 px-2 py-0.5 rounded text-xs font-mono">{f.detected}</code>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground text-xs">
                            <code className="bg-muted/30 px-1.5 py-0.5 rounded font-mono">{f.altName}</code>
                          </td>
                          <td className="py-2 pr-3 text-foreground text-xs">{f.platform}</td>
                          <td className="py-2">
                            {f.required
                              ? <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Required</Badge>
                              : isDetected
                              ? <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">✓ Found</Badge>
                              : <Badge variant="outline" className="text-xs">Optional</Badge>
                            }
                          </td>
                        </tr>
                      );
                    })}
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
              <CardDescription>
                {totalRows.toLocaleString()} rows processed. Athletes with missing names are skipped. All other issues are handled gracefully — athletes import with warnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{totalRows.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total rows</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{validCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Clean (no issues)</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{warningCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">With warnings</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Skipped</div>
                </div>
              </div>

              {/* Search filter */}
              {parseResult && parseResult.athletes.length > 20 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search athletes by name…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
              )}

              {parseResult && (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground w-16">Row</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* Errors first */}
                      {parseResult.errors
                        .filter(r => !searchFilter || r.name.toLowerCase().includes(searchFilter.toLowerCase()))
                        .map((r) => (
                        <tr key={`e${r.row}`} className="bg-red-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3"><Badge className="bg-red-100 text-red-700 border-red-300 text-xs">✗ Skipped</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{r.issues.join("; ")}</td>
                        </tr>
                      ))}
                      {/* Warnings */}
                      {parseResult.warnings
                        .filter(r => !searchFilter || r.name.toLowerCase().includes(searchFilter.toLowerCase()))
                        .map((r) => (
                        <tr key={`w${r.row}`} className="bg-amber-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3"><Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">⚠ Warning</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground text-xs max-w-sm truncate" title={r.issues.join("; ")}>{r.issues.join("; ")}</td>
                        </tr>
                      ))}
                      {/* Valid athletes */}
                      {(() => {
                        const filtered = cleanAthletes.filter(a => 
                          !searchFilter || a.name.toLowerCase().includes(searchFilter.toLowerCase())
                        );
                        const showCount = showAllValid || searchFilter ? filtered.length : Math.min(50, filtered.length);
                        const displayed = filtered.slice(0, showCount);
                        const remaining = filtered.length - showCount;
                        return (
                          <>
                            {displayed.map((a, i) => (
                              <tr key={`v${i}`}>
                                <td className="py-1.5 px-3 text-muted-foreground text-xs">—</td>
                                <td className="py-1.5 px-3 font-medium text-sm">{a.name}</td>
                                <td className="py-1.5 px-3"><Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">✓ Valid</Badge></td>
                                <td className="py-1.5 px-3 text-muted-foreground text-xs">
                                  {[
                                    a.sprint30m && `30m: ${a.sprint30m}s`,
                                    a.broadJump && `BJ: ${a.broadJump}cm`,
                                    a.run800m && `800m: ${Math.floor(a.run800m/60)}:${String(Math.round(a.run800m%60)).padStart(2,"0")}`,
                                  ].filter(Boolean).join(" · ") || "—"}
                                </td>
                              </tr>
                            ))}
                            {remaining > 0 && !searchFilter && (
                              <tr>
                                <td colSpan={4} className="text-center py-2">
                                  <button 
                                    onClick={() => setShowAllValid(true)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                    Show all {remaining.toLocaleString()} remaining valid athletes
                                  </button>
                                </td>
                              </tr>
                            )}
                            {showAllValid && !searchFilter && filtered.length > 50 && (
                              <tr>
                                <td colSpan={4} className="text-center py-2">
                                  <button 
                                    onClick={() => setShowAllValid(false)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                    Collapse to first 50
                                  </button>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Data Quality Summary
              </CardTitle>
              <CardDescription>
                Athletes with flagged metrics still import — only the specific metric is excluded from scoring. Athletes with 2+ critical flags are marked "blocked" from CAI scoring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{blocked.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">CAI blocked (2+ flags)</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{needsVerify.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Needs verification</div>
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
                    <p className="text-xs mt-0.5">No plausibility issues detected. All {parseResult?.athletes.length.toLocaleString()} athletes are eligible for full scoring.</p>
                  </div>
                </div>
              )}

              {blocked.length > 0 && <DataQualityGroup issues={blocked} severity="blocked" />}
              {needsVerify.length > 0 && <DataQualityGroup issues={needsVerify} severity="verify" />}
              {autoCorrected.length > 0 && <DataQualityGroup issues={autoCorrected} severity="auto_corrected" />}
            </CardContent>
          </Card>

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
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Input rows</div>
                  <div className="text-2xl font-bold">{totalRows.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Athletes to import</div>
                  <div className="text-2xl font-bold text-emerald-600">{parseResult?.athletes.length.toLocaleString() ?? 0}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Total after import</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {importMode === "replace"
                      ? (parseResult?.athletes.length ?? 0).toLocaleString()
                      : ((currentAthletes.length + (parseResult?.athletes.length ?? 0))).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {importMode === "append" && `(${currentAthletes.length} existing + ${parseResult?.athletes.length ?? 0} new)`}
                    {importMode === "batch_update" && "matched by name"}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Skipped rows</div>
                  <div className="text-2xl font-bold text-red-600">{(parseResult?.skipped ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {dqIssues.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{blocked.length}</strong> athletes CAI-blocked · <strong>{needsVerify.length}</strong> need verification · <strong>{autoCorrected.length}</strong> auto-corrected.
                  </span>
                </div>
              )}

              <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Batch norms: </span>
                <span className="font-semibold">{batchMeta.ageGroup} / {batchMeta.gender === "M" ? "Male" : batchMeta.gender === "F" ? "Female" : "Mixed"}</span>
              </div>

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
                    <div className="text-xs text-muted-foreground">Remove existing, load only this file.</div>
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
                    <div className="text-xs text-muted-foreground">Keep existing + add new athletes.</div>
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
                    <div className="text-xs text-muted-foreground">Match by name, add assessment to history (TTI).</div>
                  </button>
                </div>
                {importMode === "batch_update" && (
                  <div className="mt-2 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Athletes are matched by name. A new assessment record will be added to each matched athlete's history.
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">File: </span>
                <span className="font-mono font-semibold">{uploadedFile?.name}</span>
              </div>
            </CardContent>
          </Card>

          {showNutritionAlert && bmi && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Nutrition note:</strong> {bmiAtRisk} athletes with BMI &lt; 16.
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
              Import {(parseResult?.athletes.length ?? 0).toLocaleString()} Athletes
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
                {(parseResult?.athletes.length ?? 0).toLocaleString()} athletes loaded into Explorer.
                {(parseResult?.skipped ?? 0) > 0 && ` ${parseResult?.skipped} rows were skipped.`}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full max-w-lg text-sm">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-emerald-600">{(parseResult?.athletes.length ?? 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Imported</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{warningCount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{autoCorrected.length}</div>
                <div className="text-xs text-muted-foreground">Auto-fixed</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">{(parseResult?.skipped ?? 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/explorer")} className="gap-2">
                View Athletes in Explorer <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => {
                setStep(1); setUploadedFile(null); setParseResult(null); setRawRows([]);
                setBatchMeta({}); setSearchFilter(""); setShowAllValid(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// Helper
function normaliseHeaderSimple(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
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
  const [expanded, setExpanded] = useState(issues.length <= 10);

  const displayIssues = expanded ? issues : issues.slice(0, 5);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{cfg.description}</span>
        <Badge className={cn("text-xs ml-auto", cfg.badgeClass)}>{issues.length} athletes</Badge>
      </div>
      <div className="space-y-2">
        {displayIssues.map((iss) => (
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
        {!expanded && issues.length > 5 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto py-1"
          >
            <ChevronDown className="w-3 h-3" />
            Show all {issues.length} athletes
          </button>
        )}
      </div>
    </div>
  );
}
