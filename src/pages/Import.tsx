import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertTriangle, Download, ChevronRight, RotateCcw, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type ImportStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map Fields" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Review" },
  { id: 5, label: "Done" },
];

const DEMO_VALIDATION = [
  { row: 1, name: "Ravi Kumar", status: "valid", issues: [] },
  { row: 2, name: "Priya Singh", status: "valid", issues: [] },
  { row: 3, name: "Arjun Verma", status: "warning", issues: ["Missing 800m run time"] },
  { row: 4, name: "Sunita Devi", status: "valid", issues: [] },
  { row: 5, name: "Mohan Lal", status: "error", issues: ["Invalid height value: 999"] },
  { row: 6, name: "Kavita Rai", status: "valid", issues: [] },
  { row: 7, name: "Sanjay Gupta", status: "warning", issues: ["Missing shuttle run", "Missing football throw"] },
  { row: 8, name: "Anita Kumari", status: "valid", issues: [] },
];

const FIELD_MAP = [
  { detected: "Name", platform: "Athlete Name", required: true },
  { detected: "Gender", platform: "Gender", required: true },
  { detected: "Age", platform: "Age", required: true },
  { detected: "Height_cm", platform: "Height (cm)", required: true },
  { detected: "Weight_kg", platform: "Weight (kg)", required: true },
  { detected: "V_Jump", platform: "Vertical Jump (cm)", required: false },
  { detected: "Broad_Jump", platform: "Broad Jump (cm)", required: false },
  { detected: "Sprint_30m", platform: "30m Sprint (sec)", required: false },
  { detected: "Run_800m", platform: "800m Run (min)", required: false },
  { detected: "School", platform: "School Name", required: false },
  { detected: "District", platform: "District", required: false },
];

const IMPORT_HISTORY = [
  { id: 1, date: "2024-03-10", file: "athletes_batch_3.csv", rows: 82, valid: 79, warnings: 3, errors: 0, status: "success", version: "v3" },
  { id: 2, date: "2024-01-15", file: "athletes_batch_2.xlsx", rows: 45, valid: 42, warnings: 2, errors: 1, status: "partial", version: "v2" },
  { id: 3, date: "2023-11-20", file: "athletes_batch_1.csv", rows: 38, valid: 38, warnings: 0, errors: 0, status: "success", version: "v1" },
];

export default function ImportPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<ImportStep>(1);
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [colCount, setColCount] = useState(0);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUploaded = uploadedFile !== null;

  const validCount = DEMO_VALIDATION.filter(r => r.status === "valid").length;
  const warningCount = DEMO_VALIDATION.filter(r => r.status === "warning").length;
  const errorCount = DEMO_VALIDATION.filter(r => r.status === "error").length;

  const processFile = (file: File) => {
    if (!file) return;
    setUploadedFile(file);
    // Parse CSV to get row/col count
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n").filter(Boolean);
      const headers = lines[0]?.split(",") ?? [];
      setRowCount(Math.max(0, lines.length - 1));
      setColCount(headers.length);
    };
    reader.readAsText(file);
  };

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload athlete assessment data via CSV or Excel. Map fields, validate, and import.</p>
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
                s.id < step ? "text-primary cursor-pointer hover:bg-primary/10" : "text-muted-foreground cursor-default"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
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

      {/* Step Content */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Drag & drop a CSV or Excel file, or click to browse. Download the template for the correct format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={handleFileInput}
              >
                {fileUploaded ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <p className="font-semibold text-foreground">athletes_batch_demo.csv</p>
                    <p className="text-muted-foreground text-sm">8 rows detected · 11 columns</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFileUploaded(false); }}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Change file
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Drop your CSV or Excel file here</p>
                    <p className="text-muted-foreground text-sm">or click to browse · Max 10MB</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" /> Download CSV Template
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="w-4 h-4" /> Download Excel Template
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button disabled={!fileUploaded} onClick={() => setStep(2)} className="gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Map Fields</CardTitle>
              <CardDescription>Review the auto-detected field mapping. Adjust if needed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Detected Column</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Platform Field</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {FIELD_MAP.map((f) => (
                      <tr key={f.detected}>
                        <td className="py-2 pr-4 font-mono text-xs bg-muted/30 rounded px-2">{f.detected}</td>
                        <td className="py-2 pr-4 text-foreground">{f.platform}</td>
                        <td className="py-2">
                          {f.required ? <Badge variant="default" className="text-xs">Required</Badge> : <Badge variant="outline" className="text-xs">Optional</Badge>}
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
            <Button onClick={() => setStep(3)} className="gap-2">Validate Data <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Preview</CardTitle>
              <CardDescription>Row-level validation results. Fix errors before importing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-success">{validCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Valid rows</div>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-warning">{warningCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Warnings</div>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-destructive">{errorCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Errors</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Row</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {DEMO_VALIDATION.map((r) => (
                      <tr key={r.row} className={cn(
                        r.status === "error" ? "bg-destructive/5" : r.status === "warning" ? "bg-warning/5" : ""
                      )}>
                        <td className="py-2 pr-4 text-muted-foreground">{r.row}</td>
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4">
                          {r.status === "valid" && <Badge className="bg-success/10 text-success border-success/20 text-xs">✓ Valid</Badge>}
                          {r.status === "warning" && <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">⚠ Warning</Badge>}
                          {r.status === "error" && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">✗ Error</Badge>}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">{r.issues.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export Error Report</Button>
              <Button onClick={() => setStep(4)} className="gap-2">Review & Confirm <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Choose import mode and confirm to proceed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1">Total rows</div>
                  <div className="text-xl font-bold">8</div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1">Will import</div>
                  <div className="text-xl font-bold text-success">{validCount + warningCount}</div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="text-muted-foreground mb-1">Will skip</div>
                  <div className="text-xl font-bold text-destructive">{errorCount}</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Import Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["append", "replace"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setImportMode(mode)}
                      className={cn(
                        "border rounded-lg p-3 text-left transition-colors",
                        importMode === mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="font-medium capitalize text-sm">{mode}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {mode === "append" ? "Add to existing athletes without removing current data." : "Replace all existing athlete data with this import."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Dataset version label: </span>
                <span className="font-mono font-medium">v4 · March 2024</span>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={() => setStep(5)} className="gap-2 bg-primary">
              <Database className="w-4 h-4" /> Confirm Import
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Import Complete</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                7 athletes were imported successfully. 1 row was skipped due to errors.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-2 w-full max-w-sm">
                <div className="bg-success/10 rounded-lg p-2 text-center"><div className="text-lg font-bold text-success">7</div><div className="text-xs text-muted-foreground">Imported</div></div>
                <div className="bg-warning/10 rounded-lg p-2 text-center"><div className="text-lg font-bold text-warning">2</div><div className="text-xs text-muted-foreground">Warnings</div></div>
                <div className="bg-destructive/10 rounded-lg p-2 text-center"><div className="text-lg font-bold text-destructive">1</div><div className="text-xs text-muted-foreground">Skipped</div></div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export Import Log</Button>
                <Button size="sm" onClick={() => setStep(1)} className="gap-2"><RotateCcw className="w-4 h-4" /> New Import</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {IMPORT_HISTORY.map((h) => (
              <div key={h.id} className="py-3 flex items-center gap-4 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{h.file}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{h.date} · {h.rows} rows · {h.version}</div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-success">{h.valid} valid</span>
                  <span className="text-warning">{h.warnings} warn</span>
                  <span className="text-destructive">{h.errors} err</span>
                </div>
                <Badge variant={h.status === "success" ? "default" : "outline"} className="text-xs">
                  {h.status === "success" ? "✓ Success" : "⚠ Partial"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
