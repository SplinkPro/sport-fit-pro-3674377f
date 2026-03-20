import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload, FileText, CheckCircle, Download,
  ChevronRight, RotateCcw, CheckCircle2, ArrowRight,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/i18n/useTranslation";
import { useAthletes } from "@/hooks/useAthletes";
import { enrichAthletes } from "@/engine/analyticsEngine";
import { parseCSVText, rowsToAthletes, generateCSVTemplate, ParseResult } from "@/lib/csvParser";
import { cn } from "@/lib/utils";

type ImportStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Fields" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Review" },
  { id: 5, label: "Done" },
];

/** Column mapping reference — matches Bihar assessment format exactly */
const FIELD_MAP = [
  // ── Standard template names (left) + Bihar format names (right) ──
  { detected: "studentId", altName: "ID (optional)", platform: "Athlete ID", required: false },
  { detected: "Athlete Name", altName: "name", platform: "Athlete Name", required: true },
  { detected: "Height", altName: "Height_cm", platform: "Height (cm)", required: true },
  { detected: "Weight", altName: "Weight_kg", platform: "Weight (kg)", required: true },
  { detected: "Gender", altName: "M or F", platform: "Gender — defaults to M if absent", required: false },
  { detected: "Age", altName: "years", platform: "Age — defaults to 14 if absent", required: false },
  { detected: "Thirty mflingstarts", altName: "Sprint_30m", platform: "30m Sprint (seconds)", required: false },
  { detected: "Standinggbroadjump", altName: "Broad_Jump", platform: "Broad Jump (cm)", required: false },
  { detected: "Shuttlerun10Mx6", altName: "Shuttle_Run", platform: "Shuttle Run (seconds)", required: false },
  { detected: "Verticaljump", altName: "V_Jump", platform: "Vertical Jump (cm)", required: false },
  { detected: "Footballballthrow5No", altName: "Football_Throw", platform: "Football Throw (m)", required: false },
  { detected: "Eighthundredmetersrun", altName: "Run_800m", platform: "800m Run — accepts H:MM:SS or seconds", required: false },
  { detected: "School", altName: "school name", platform: "School Name", required: false },
  { detected: "District", altName: "district", platform: "District", required: false },
];


const IMPORT_HISTORY_KEY = "pratibha_import_history";

interface HistoryEntry {
  id: string;
  date: string;
  file: string;
  rows: number;
  valid: number;
  warnings: number;
  errors: number;
  status: "success" | "partial";
  version: string;
}

function loadHistory(): HistoryEntry[] {
  try {
    const saved = localStorage.getItem(IMPORT_HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [
    { id: "h1", date: "2024-03-10", file: "athletes_batch_3.csv", rows: 82, valid: 79, warnings: 3, errors: 0, status: "success", version: "v3" },
    { id: "h2", date: "2024-01-15", file: "athletes_batch_2.xlsx", rows: 45, valid: 42, warnings: 2, errors: 1, status: "partial", version: "v2" },
  ];
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

export default function ImportPage() {
  const { t } = useTranslation();
  const { addDataset, athletes: currentAthletes } = useAthletes();
  const navigate = useNavigate();

  const [step, setStep] = useState<ImportStep>(1);
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("replace");
  const [importHistory, setImportHistory] = useState<HistoryEntry[]>(loadHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUploaded = uploadedFile !== null;
  const validCount = parseResult ? parseResult.athletes.length - parseResult.warnings.length : 0;
  const warningCount = parseResult ? parseResult.warnings.length : 0;
  const errorCount = parseResult ? parseResult.errors.length : 0;
  const totalRows = parseResult ? parseResult.athletes.length + parseResult.skipped : 0;

  const processFile = useCallback((file: File) => {
    if (!file) return;
    setUploadedFile(file);

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);

    if (isExcel) {
      // Use SheetJS for binary Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to array of objects (header row → keys)
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: "",
          raw: false, // get formatted strings so H:MM:SS stays intact
        });
        const result = rowsToAthletes(rows);
        setParseResult(result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV / TSV — text reader
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        const result = rowsToAthletes(rows);
        setParseResult(result);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleZoneClick = () => {
    if (!fileUploaded) fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pratibha_athlete_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (!parseResult || !uploadedFile) return;

    // Build final athlete list
    const incoming = enrichAthletes(parseResult.athletes);
    const final = importMode === "append"
      ? [...currentAthletes, ...incoming]
      : incoming;

    const version = `v${importHistory.length + 1}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Register dataset globally → Explorer will switch to it immediately
    addDataset(
      {
        name: uploadedFile.name,
        version,
        count: final.length,
        importedAt: todayStr,
        source: "import",
      },
      final,
    );

    // Persist history entry
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      date: todayStr,
      file: uploadedFile.name,
      rows: totalRows,
      valid: validCount,
      warnings: warningCount,
      errors: errorCount,
      status: errorCount > 0 ? "partial" : "success",
      version,
    };
    const next = [entry, ...importHistory];
    setImportHistory(next);
    saveHistory(next);

    setStep(5);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload athlete assessment data via CSV or Excel. Map fields, validate, and import into Explorer.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => s.id <= step && setStep(s.id as ImportStep)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                step === s.id ? "bg-primary text-primary-foreground" :
                s.id < step ? "text-primary cursor-pointer hover:bg-primary/10" :
                "text-muted-foreground cursor-default"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                step === s.id ? "bg-primary-foreground text-primary border-primary-foreground" :
                s.id < step ? "bg-primary text-primary-foreground border-primary" :
                "border-muted-foreground text-muted-foreground"
              )}>
                {s.id < step ? <CheckCircle className="w-4 h-4" /> : s.id}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Drag &amp; drop a CSV or Excel file, or click to browse.
                Download the template for the exact required format.
              </CardDescription>
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
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer select-none",
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
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-600 font-medium">
                          {parseResult.athletes.length} athletes parsed
                        </span>
                        {parseResult.skipped > 0 && (
                          <span className="text-destructive font-medium">
                            {parseResult.skipped} skipped
                          </span>
                        )}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setParseResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
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

              {/* Format hint */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-blue-700 space-y-0.5">
                  <p><strong>Accepted format:</strong> Same as the Bihar assessment spreadsheet.</p>
                  <p>Columns: <code className="bg-blue-100 px-1 rounded text-xs">Athlete Name, Height, Weight, Thirty mflingstarts, Standinggbroadjump, Shuttlerun10Mx6, Verticaljump, Footballballthrow5No, Eighthundredmetersrun</code></p>
                  <p className="text-xs mt-1">800m run accepts <strong>H:MM:SS</strong> time format or plain seconds. Gender and Age default to M / 14 if not present.</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-4 h-4" /> Download CSV Template
                </Button>
                <a href="/sample_data.xlsx" download="Sample_data_12.xlsx">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Download Sample Excel
                  </Button>
                </a>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              disabled={!fileUploaded || !parseResult || parseResult.athletes.length === 0}
              onClick={() => setStep(2)}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Map Fields ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                The platform auto-detects column names. Both the Bihar assessment format
                and the standard template names are accepted — case-insensitive.
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


      {/* ── Step 3: Validate ── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
              <CardDescription>
                Row-level check for your uploaded file. Athletes with errors will be skipped.
              </CardDescription>
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
                      {/* Valid with warnings */}
                      {parseResult.warnings.map((r) => (
                        <tr key={`w${r.row}`} className="bg-amber-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3">
                            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">⚠ Warning</Badge>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{r.issues.join(", ")}</td>
                        </tr>
                      ))}
                      {/* Errors */}
                      {parseResult.errors.map((r) => (
                        <tr key={`e${r.row}`} className="bg-red-50/50">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3 font-medium">{r.name}</td>
                          <td className="py-2 px-3">
                            <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">✗ Error</Badge>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{r.issues.join(", ")}</td>
                        </tr>
                      ))}
                      {/* Valid (show first 10 to keep table manageable) */}
                      {parseResult.athletes
                        .filter((a) => !parseResult.warnings.some((w) => w.name === a.name))
                        .slice(0, 10)
                        .map((a, i) => (
                          <tr key={`v${i}`}>
                            <td className="py-2 px-3 text-muted-foreground">{i + 2}</td>
                            <td className="py-2 px-3 font-medium">{a.name}</td>
                            <td className="py-2 px-3">
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">✓ Valid</Badge>
                            </td>
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
              onClick={() => setStep(4)}
              className="gap-2"
            >
              Review &amp; Confirm <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review &amp; Confirm</CardTitle>
              <CardDescription>Choose import mode and confirm to load athletes into Explorer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
                    {importMode === "append" ? `(${currentAthletes.length} existing + ${parseResult?.athletes.length ?? 0} new)` : "athletes total"}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1 text-xs">Will skip</div>
                  <div className="text-2xl font-bold text-red-600">{parseResult?.skipped ?? 0}</div>
                  <div className="text-xs text-muted-foreground">error rows</div>
                </div>
              </div>

              {/* Import mode */}
              <div>
                <p className="text-sm font-medium mb-2">Import Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["replace", "append"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setImportMode(mode)}
                      className={cn(
                        "border rounded-xl p-4 text-left transition-all",
                        importMode === mode
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/20"
                      )}
                    >
                      <div className="font-semibold capitalize text-sm mb-0.5">{mode}</div>
                      <div className="text-xs text-muted-foreground">
                        {mode === "replace"
                          ? "Remove all existing athletes and load only this file's data. Recommended for fresh batches."
                          : "Keep existing athletes and add new ones from this file. Use for incremental updates."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dataset label: </span>
                <span className="font-mono font-semibold">{uploadedFile?.name} · v{importHistory.length + 1}</span>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
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

      {/* ── Step 5: Done ── */}
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
                {(parseResult?.skipped ?? 0) > 0 && ` ${parseResult?.skipped} rows were skipped due to errors.`}
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
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setUploadedFile(null);
                  setParseResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Import History ── */}
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
                  {i === 0 && (
                    <Badge className="bg-primary/10 text-primary text-xs border-primary/30">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
