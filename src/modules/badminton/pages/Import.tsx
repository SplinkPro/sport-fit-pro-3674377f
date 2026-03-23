// ─── Badminton Import ─────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";

const COURT_GREEN = "#1A5C38";
const SHUTTLE_GOLD = "#D4A017";

const COLUMN_SYNONYMS: { canonical: string; display: string; synonyms: string[] }[] = [
  { canonical: "reaction_time_ms", display: "Reaction Time (ms)", synonyms: ["RT", "react time", "reaction", "reaction_time"] },
  { canonical: "four_corner_shuttle_run_sec", display: "4-Corner Shuttle Run (sec)", synonyms: ["4 corner", "fourcorner", "4CR", "four corner"] },
  { canonical: "ten_by_five_shuttle_run_sec", display: "10×5m Shuttle Run (sec)", synonyms: ["10x5", "ten five", "shuttle run", "10_5_shuttle"] },
  { canonical: "vertical_jump_cm", display: "Vertical Jump (cm)", synonyms: ["VJ", "vert jump", "vertical", "vjump"] },
  { canonical: "standing_broad_jump_cm", display: "Standing Broad Jump (cm)", synonyms: ["BJ", "broad jump", "standing jump", "broadjump"] },
  { canonical: "beep_test_level", display: "Beep Test Level", synonyms: ["beep", "shuttle beep", "bleep", "beep_test"] },
  { canonical: "grip_strength_kg", display: "Grip Strength (kg)", synonyms: ["grip", "grip str", "hand strength", "grip_strength"] },
  { canonical: "shuttlecock_throw_m", display: "Shuttlecock Throw (m)", synonyms: ["throw", "shuttle throw", "overhead throw", "sc_throw"] },
  { canonical: "situps_30sec", display: "Situps (30s)", synonyms: ["situps", "sit ups", "sit_ups", "ab_30s"] },
  { canonical: "pushups_30sec", display: "Pushups (30s)", synonyms: ["pushups", "push ups", "push_ups", "pu_30s"] },
  { canonical: "sit_and_reach_cm", display: "Sit & Reach (cm)", synonyms: ["sit reach", "sit_reach", "flexibility", "SAR"] },
  { canonical: "footwork_efficiency", display: "Footwork Score (1–10)", synonyms: ["FW", "footwork score", "footwork"] },
  { canonical: "coachability", display: "Coachability (1–10)", synonyms: ["coacha", "coachability", "coach_score"] },
  { canonical: "stroke_mechanics", display: "Stroke Mechanics (1–10)", synonyms: ["stroke", "strokes", "stroke_score"] },
  { canonical: "smash_quality", display: "Smash Quality (1–10)", synonyms: ["smash", "smash_score", "smash quality"] },
  { canonical: "net_play", display: "Net Play (1–10)", synonyms: ["net", "net_play", "net_score"] },
  { canonical: "serve_accuracy", display: "Serve Accuracy (1–10)", synonyms: ["serve", "serve_accuracy", "serve_score"] },
  { canonical: "court_awareness", display: "Court Awareness (1–10)", synonyms: ["court", "court_awareness", "awareness"] },
  { canonical: "mental_resilience", display: "Mental Resilience (1–10)", synonyms: ["mental", "resilience", "mental_score"] },
];

const ALL_FIELDS = [
  "name", "date_of_birth", "gender", "dominant_hand", "years_playing_badminton",
  "academy_batch", "coach_name", "height_cm", "weight_kg", "wingspan_cm",
  "standing_reach_cm", ...COLUMN_SYNONYMS.map((c) => c.canonical),
];

function generateTemplate(): string {
  const header = ALL_FIELDS.join(",");
  const sample = [
    "Kiran Reddy", "2011-04-15", "Male", "Right", "4",
    "Morning Elite", "Coach Prasad", "160", "48", "163",
    "155", "155", "15.2", "18.0", "42", "168", "7.6",
    "26", "12.5", "20", "18", "21", "8", "8", "7",
    "7", "7", "8", "9", "7",
  ].join(",");
  return `${header}\n${sample}`;
}

function downloadTemplate() {
  const csv = generateTemplate();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pgba_badminton_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Step = 1 | 2 | 3;

export default function BadmintonImport() {
  const [step, setStep] = useState<Step>(1);
  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");
  const [fileName, setFileName] = useState("");
  const [mappingPreview, setMappingPreview] = useState<{ col: string; mapped: string | null }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function normalise(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function findMapping(col: string): string | null {
    const norm = normalise(col);
    const direct = COLUMN_SYNONYMS.find((c) => c.canonical === norm || c.synonyms.some((s) => normalise(s) === norm));
    if (direct) return direct.display;
    if (norm === "name" || norm === "athlete") return "name";
    if (norm === "dob" || norm === "dateofbirth") return "date_of_birth";
    if (norm === "gender" || norm === "sex") return "gender";
    return null;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const firstLine = text.split("\n")[0];
      const cols = firstLine.split(/,|\t/).map((c) => c.trim().replace(/"/g, ""));
      const preview = cols.map((col) => ({ col, mapped: findMapping(col) }));
      setMappingPreview(preview);
      setStep(2);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-5 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="text-xl">🏸</span>
        <div>
          <h1 className="text-lg font-bold" style={{ color: COURT_GREEN }}>IMPORT ATHLETE DATA</h1>
          <p className="text-xs text-muted-foreground">PGBA Hyderabad — Upload CSV or Excel</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <span className={`rounded-full w-6 h-6 flex items-center justify-center font-bold text-[11px] ${step >= s ? "text-white" : "bg-muted text-muted-foreground"}`}
              style={{ background: step >= s ? COURT_GREEN : undefined }}>
              {s}
            </span>
            <span className={step >= s ? "text-foreground font-medium" : ""}>
              {s === 1 ? "Select Cohort" : s === 2 ? "Review Mapping" : "Confirm & Import"}
            </span>
            {s < 3 && <span className="text-muted-foreground/40">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <h2 className="font-semibold text-sm">Step 1 — Select Age Band & Gender</h2>
          <p className="text-xs text-muted-foreground">
            Required before upload. Determines which norm tables are applied to compute BII scores.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Age Band</label>
              <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">— Select —</option>
                {["U10", "U12", "U14", "U16"].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">— Select —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!ageBand || !gender}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: COURT_GREEN }}
            >
              Upload File →
            </button>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted transition-colors"
              style={{ color: SHUTTLE_GOLD, borderColor: SHUTTLE_GOLD }}
            >
              ⬇ Download Template
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          <p className="text-[10px] text-muted-foreground">
            Template includes all 31 fields with one sample row of valid data.
            Column names are flexible — the system auto-maps common synonyms.
          </p>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Step 2 — Column Auto-Mapping</h2>
            <span className="text-xs text-muted-foreground">{fileName}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cohort: <strong>{ageBand} {gender}</strong> · Review mappings before proceeding.
            Unmapped columns will be ignored.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Your Column</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Maps To</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappingPreview.map(({ col, mapped }) => (
                  <tr key={col} className="border-t border-border/60">
                    <td className="px-3 py-2 font-mono">{col}</td>
                    <td className="px-3 py-2">{mapped ?? <span className="text-muted-foreground italic">Not mapped</span>}</td>
                    <td className="px-3 py-2">
                      {mapped
                        ? <span className="text-green-700 font-semibold">✅ Matched</span>
                        : <span className="text-amber-600">⚠ Ignored</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: COURT_GREEN }}>
              Looks Good — Validate →
            </button>
            <button onClick={() => { setStep(1); setMappingPreview([]); setFileName(""); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">Step 3 — Validation & Confirmation</h2>
          <p className="text-xs text-muted-foreground">
            File: <strong>{fileName}</strong> · Cohort: <strong>{ageBand} {gender}</strong>
          </p>

          {/* Demo validation preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
              <span className="text-green-700 font-bold">✅ Clean</span>
              <span className="text-green-800">22 rows passed all validation checks</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <span className="text-amber-700 font-bold">🟠 Auto-corrected</span>
              <span className="text-amber-800">2 rows: unit correction applied (verify before submission)</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
              <span className="text-red-700 font-bold">🔴 Blocked</span>
              <span className="text-red-800">1 row: reaction_time = 72ms (physically impossible — correct data before importing)</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground mb-1">Validation Rules Applied</div>
            <div>• Reaction time &lt; 80ms or &gt; 700ms → BLOCKED</div>
            <div>• Vertical jump &gt; 120cm → BLOCKED</div>
            <div>• 4-corner shuttle run &lt; 8.0s → BLOCKED</div>
            <div>• RT entered &lt; 2.0 (seconds not ms) → Auto-corrected ×1000</div>
            <div>• VJ &gt; 150cm with standing reach → Auto-corrected to net jump</div>
            <div>• All skill scores ≥ 9 → Coach review flag</div>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              style={{ background: COURT_GREEN }}
              title="Full import pipeline available in production build"
            >
              Import 22 Clean Athletes (Demo Mode)
            </button>
            <button onClick={() => { setStep(1); setMappingPreview([]); setFileName(""); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted">
              ← Start Over
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Demo mode: import pipeline uses pre-loaded seed data. Full backend import available post-integration.
          </p>
        </div>
      )}

      {/* Synonym table */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Accepted Column Name Synonyms</h2>
        <p className="text-xs text-muted-foreground">The import engine auto-maps these variations to canonical field names.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Field</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Accepted Column Names</th>
              </tr>
            </thead>
            <tbody>
              {COLUMN_SYNONYMS.map(({ canonical, display, synonyms }) => (
                <tr key={canonical} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{display}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{synonyms.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
