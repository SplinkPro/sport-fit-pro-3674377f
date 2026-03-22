/**
 * CSV / TSV parser for athlete import.
 * Handles the Bihar assessment format from Sample_data_12.xlsx.
 * Also accepts the standard template format.
 *
 * KEY CORRECTIONS vs prior version:
 *  - 800m: Bihar Excel stores "4:20:18" as M:SS:cs (NOT H:MM:SS). Correct formula: M*60+S+cs/100
 *  - VJ: Dual-convention handling (net jump vs wall-reach total)
 *  - Plausibility gates: sprint > 11s, SBJ > 260cm, shuttle > 30s → nulled + flagged
 */
import { Athlete } from "@/data/seedAthletes";

// ─── Column name → internal field mapping ──────────────────────────────────

type InternalField = keyof Athlete | "_skip" | "_id";

const COLUMN_MAP: Record<string, InternalField> = {
  // ── Skip columns ──
  "slno": "_skip", "srno": "_skip", "serialno": "_skip",
  "serialnumber": "_skip", "sno": "_skip",

  // ── ID ──
  "studentid": "_id", "id": "_id", "athleteid": "_id",
  "rollno": "_id", "rollnumber": "_id", "regno": "_id",
  "registrationno": "_id",

  // ── Name ──
  "athletename": "name", "name": "name", "fullname": "name",
  "studentname": "name", "playername": "name",
  "participantname": "name", "childname": "name", "naam": "name",

  // ── Gender ──
  "gender": "gender", "sex": "gender", "ling": "gender", "mf": "gender",

  // ── Age ──
  "age": "age", "ageyears": "age", "ayu": "age", "aayu": "age",

  // ── Height ──
  "height": "height", "heightcm": "height", "ht": "height",
  "heightincm": "height", "lambai": "height", "lamba": "height",

  // ── Weight ──
  "weight": "weight", "weightkg": "weight", "wt": "weight",
  "weightinkg": "weight", "bhar": "weight", "vajan": "weight",

  // ── 30m Sprint ──
  "thirtymflingstarts": "sprint30m",
  "thirtymeterflyingstarts": "sprint30m",
  "30mflyingstart": "sprint30m",
  "flyingstart30m": "sprint30m",
  "30msprint": "sprint30m",
  "sprint30m": "sprint30m",
  "sprintsec": "sprint30m",
  "30m": "sprint30m",
  "sprint": "sprint30m",
  "thirtymeter": "sprint30m",

  // ── Broad Jump ──
  "standinggbroadjump": "broadJump",
  "standingbroadjump": "broadJump",
  "broadjump": "broadJump",
  "bj": "broadJump",
  "standinglongjump": "broadJump",
  "longjump": "broadJump",
  "standingjump": "broadJump",
  "sbj": "broadJump",

  // ── Shuttle Run ──
  "shuttlerun10mx6": "shuttleRun",
  "shuttlerun": "shuttleRun",
  "shuttle": "shuttleRun",
  "10mx6shuttle": "shuttleRun",
  "agilityrun": "shuttleRun",
  "10mx6": "shuttleRun",

  // ── Vertical Jump ──
  "verticaljump": "verticalJump",
  "vj": "verticalJump",
  "vjump": "verticalJump",
  "vertjump": "verticalJump",
  "cmj": "verticalJump",

  // ── Football Throw ──
  "footballballthrow5no": "footballThrow",
  "footballballthrow": "footballThrow",
  "footballthrow": "footballThrow",
  "ballthrow": "footballThrow",
  "throw": "footballThrow",

  // ── 800m Run ──
  "eighthundredmetersrun": "run800m",
  "eighthundredmeterrun": "run800m",
  "800mrun": "run800m",
  "run800m": "run800m",
  "800m": "run800m",
  "800meterrun": "run800m",
  "800mendurance": "run800m",
  "endurancerun": "run800m",
  "eighthundred": "run800m",

  // ── School / District ──
  "school": "school", "schoolname": "school",
  "district": "district", "dist": "district", "zila": "district",

  // ── DoB / Assessment date ──
  "dob": "dob", "dateofbirth": "dob", "birthdate": "dob",
  "assessmentdate": "assessmentDate", "date": "assessmentDate",
};

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─── 800m PARSER ─────────────────────────────────────────────────────────────
//
// Bihar Excel stores 800m times as H:MM:SS where the CORRECT interpretation is:
//   H   = minutes
//   MM  = seconds
//   SS  = centiseconds (1/100 of a second)
// So "4:20:18" means 4 min 20.18 sec = 260.18 seconds — NOT 4 hours 20 min 18 sec.
//
// Additionally some rows come as Excel serial fractions (0 < x < 1) — these are
// unrecoverable; we flag them rather than silently produce garbage values.

export type Run800mFlag =
  | "OK"
  | "AUTO_CORRECTED"       // H:MM:SS re-interpreted correctly
  | "IMPLAUSIBLE_VERIFY"   // parsed time > 720s (12 min) — flag for coach
  | "FORMAT_UNREADABLE";   // Excel float fraction — cannot determine time

export interface Parsed800m {
  value: number | null;
  flag: Run800mFlag;
  raw: string;
}

export function parse800m(raw: string): Parsed800m {
  if (!raw || raw.trim() === "") return { value: null, flag: "FORMAT_UNREADABLE", raw };
  const s = raw.trim();

  // ── Excel serial fraction (e.g. "0.231840278") ──
  const numeric = parseFloat(s);
  if (!isNaN(numeric) && s.indexOf(":") === -1) {
    if (numeric > 0 && numeric < 1) {
      // This is an Excel time-of-day serial — the value is unrecoverable as 800m time
      return { value: null, flag: "FORMAT_UNREADABLE", raw };
    }
    // Plain seconds (e.g. "260")
    if (numeric >= 60 && numeric <= 720) return { value: numeric, flag: "OK", raw };
    if (numeric > 720) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  // ── Colon-separated time string ──
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return { value: null, flag: "FORMAT_UNREADABLE", raw };

  let seconds: number;

  if (parts.length === 3) {
    // Could be H:MM:SS (standard) or Bihar M:SS:cs
    // Attempt standard first: H*3600 + M*60 + S
    const standard = parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (standard >= 60 && standard <= 720) {
      // Standard interpretation gives a plausible 800m time → use it
      return { value: parseFloat(standard.toFixed(2)), flag: "OK", raw };
    }
    // Standard gives implausible value → try Bihar interpretation: M:SS:cs
    const biharSeconds = parts[0] * 60 + parts[1] + parts[2] / 100;
    if (biharSeconds >= 60 && biharSeconds <= 720) {
      return { value: parseFloat(biharSeconds.toFixed(2)), flag: "AUTO_CORRECTED", raw };
    }
    // Both interpretations are implausible
    if (biharSeconds > 720) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  if (parts.length === 2) {
    // MM:SS
    seconds = parts[0] * 60 + parts[1];
    if (seconds >= 60 && seconds <= 720) return { value: seconds, flag: "OK", raw };
    if (seconds > 720) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  return { value: null, flag: "FORMAT_UNREADABLE", raw };
}

// ─── VERTICAL JUMP DUAL-CONVENTION CORRECTION ────────────────────────────────
//
// Two recording conventions exist in the field:
//   Convention A: NET jump height (e.g. 30–80cm)  → use as-is
//   Convention B: TOTAL wall-reach height (e.g. 180–290cm)
//                 → subtract estimated standing reach (height × 1.33)
//                    to recover net jump height
//
// If subtraction yields a negative or implausibly large value, the 1.33 ratio
// didn't work for this athlete → flag as UNCLEAR, don't score.

export type VJFlag =
  | "OK"
  | "AUTO_CORRECTED"   // wall-reach detected and corrected
  | "UNCLEAR_VERIFY";  // correction produced impossible value — coach must verify

export interface ParsedVJ {
  value: number | null;
  flag: VJFlag;
  raw: number;
  correctedFrom?: number; // original raw value before correction
}

export function correctVerticalJump(rawVJ: number, heightCm: number): ParsedVJ {
  let vj = rawVJ;

  // Handle accidental meter entry (value < 10 → likely entered in meters)
  if (vj < 10 && vj > 0) {
    vj = vj * 100;
  }

  if (vj > 120) {
    // Likely wall-reach convention — attempt conversion
    const estimatedReach = heightCm * 1.33;
    const netJump = vj - estimatedReach;
    if (netJump < 0 || netJump > 110) {
      // Conversion failed — cannot determine true value
      return { value: null, flag: "UNCLEAR_VERIFY", raw: rawVJ, correctedFrom: vj };
    }
    return {
      value: parseFloat(netJump.toFixed(1)),
      flag: "AUTO_CORRECTED",
      raw: rawVJ,
      correctedFrom: vj,
    };
  }

  if (vj <= 0) return { value: null, flag: "UNCLEAR_VERIFY", raw: rawVJ };

  return { value: parseFloat(vj.toFixed(1)), flag: "OK", raw: rawVJ };
}

// ─── PLAUSIBILITY GATES ───────────────────────────────────────────────────────
// Hard physical limits — values outside these are almost certainly data entry errors.

export type Sprint30mFlag = "OK" | "OUTLIER_VERIFY";
export type BroadJumpFlag = "OK" | "OUTLIER_VERIFY";
export type ShuttleRunFlag = "OK" | "OUTLIER_VERIFY";

export function checkSprint30m(value: number): Sprint30mFlag {
  // < 3.0s: physically impossible even for world-class sprinters over 30m flying
  // > 11.0s: walking pace — must be data error
  return (value < 3.0 || value > 11.0) ? "OUTLIER_VERIFY" : "OK";
}

export function checkBroadJump(value: number): BroadJumpFlag {
  // > 260cm: beyond any recorded youth broad jump
  // < 50cm: implausibly short
  return (value > 260 || value < 50) ? "OUTLIER_VERIFY" : "OK";
}

export function checkShuttleRun(value: number): ShuttleRunFlag {
  // > 30s: implausible for 10m×6 shuttle even for very unfit youth
  // < 8s: faster than any recorded youth shuttle run
  return (value > 30 || value < 8) ? "OUTLIER_VERIFY" : "OK";
}

// ─── CSV text parser ────────────────────────────────────────────────────────

export function parseCSVText(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const first = lines[0];
  const delim = first.includes("\t") ? "\t" : ",";
  const headers = first.split(delim).map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const cells = splitCSVLine(line, delim);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });
}

function splitCSVLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === delim && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ─── Row → Athlete conversion ───────────────────────────────────────────────

export interface DataQualityIssue {
  athleteName: string;
  rowNum: number;
  severity: "blocked" | "verify" | "auto_corrected";
  issues: Array<{
    metric: string;
    description: string;
    rawValue?: string;
    correctedValue?: string;
  }>;
}

export interface ParseResult {
  athletes: Athlete[];
  warnings: { row: number; name: string; issues: string[] }[];
  errors:   { row: number; name: string; issues: string[] }[];
  skipped:  number;
  detectedColumns: string[];
  unmappedColumns: string[];
  headerSnapshot: string[];
  dataQualityIssues: DataQualityIssue[]; // NEW: structured quality issues for pre-scoring screen
  bmiSummary: {           // NEW: cohort BMI distribution for nutrition alert
    total: number;
    severeThinness: number;   // BMI < 14
    thinness: number;         // BMI 14–16
    mildThinness: number;     // BMI 16–18.5
    normal: number;           // BMI 18.5–23
    review: number;           // BMI > 23
  };
}

// Module-level counter so IDs never collide across multiple imports in the same session
let _globalIdCounter = Date.now() % 100000;

export interface BatchMeta {
  ageGroup: "U10" | "U12" | "U14" | "U16" | "U18" | "Open";
  gender: "M" | "F" | "Mixed";
}

/** Maps age group label to midpoint age for norm table lookup.
 * BUG FIX: U12→12, U14→14, U16→16, U18→18 (was 11/13/15/17 — off-by-one
 * causing each group to match the row BELOW its actual age band in INDIAN_BENCHMARKS). */
const AGE_GROUP_MIDPOINT: Record<BatchMeta["ageGroup"], number> = {
  U10: 10, U12: 12, U14: 14, U16: 16, U18: 18, Open: 20,
};

export function rowsToAthletes(
  rows: Record<string, string>[],
  batchMeta?: BatchMeta
): ParseResult {
  const _idBase = ++_globalIdCounter;
  const athletes: Athlete[] = [];
  const warnings: ParseResult["warnings"] = [];
  const errors:   ParseResult["errors"]   = [];
  const dataQualityIssues: DataQualityIssue[] = [];
  let skipped = 0;

  // BMI distribution counters
  const bmiSummary = { total: 0, severeThinness: 0, thinness: 0, mildThinness: 0, normal: 0, review: 0 };

  // Build header → internal-field map once
  const headerMap: Record<string, InternalField> = {};
  const headerSnapshot: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];

  if (rows.length > 0) {
    Object.keys(rows[0]).forEach((h) => {
      const norm = normaliseHeader(h);
      const mapped = COLUMN_MAP[norm];
      if (mapped) headerMap[h] = mapped;
    });
  }
  const detectedColumns = Object.keys(headerMap);
  const unmappedColumns = headerSnapshot.filter((h) => !headerMap[h]);

  console.log("[csvParser] Header snapshot:", headerSnapshot);
  console.log("[csvParser] Detected (mapped):", detectedColumns);
  console.log("[csvParser] Unmapped:", unmappedColumns);
  if (batchMeta) console.log("[csvParser] Batch meta:", batchMeta);

  const getField = (row: Record<string, string>, field: InternalField): string => {
    for (const [header, mapped] of Object.entries(headerMap)) {
      if (mapped === field) return (row[header] ?? "").trim();
    }
    return "";
  };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const hardErrors: string[] = [];
    const softWarnings: string[] = [];
    const qualityIssues: DataQualityIssue["issues"] = [];

    // ── Required: Name ──
    const name = getField(row, "name");
    if (!name) hardErrors.push("Missing athlete name");

    // ── Optional: ID ──
    const importedId = getField(row, "_id");

    // ── Gender: use batch meta if provided, else column, else default ──
    let gender: "M" | "F" = "M";
    if (batchMeta && batchMeta.gender !== "Mixed") {
      gender = batchMeta.gender;
    } else {
      const genderRaw = getField(row, "gender").toUpperCase();
      if (genderRaw === "M" || genderRaw === "MALE" || genderRaw === "BOY") gender = "M";
      else if (genderRaw === "F" || genderRaw === "FEMALE" || genderRaw === "GIRL") gender = "F";
      else if (!genderRaw) {
        gender = "M";
        if (!batchMeta) softWarnings.push("Gender not provided — defaulted to M");
      } else {
        gender = "M";
        softWarnings.push(`Unrecognised gender "${genderRaw}" — defaulted to M`);
      }
    }

    // ── Age: use batch meta midpoint if provided, else column, else default ──
    let age: number;
    if (batchMeta) {
      const ageRaw = getField(row, "age");
      const parsedAge = parseFloat(ageRaw);
      age = (!ageRaw || isNaN(parsedAge) || parsedAge < 5 || parsedAge > 50)
        ? AGE_GROUP_MIDPOINT[batchMeta.ageGroup]
        : parsedAge;
    } else {
      const ageRaw = getField(row, "age");
      age = parseFloat(ageRaw);
      if (!ageRaw || isNaN(age) || age < 5 || age > 50) {
        if (ageRaw && !isNaN(age)) hardErrors.push(`Invalid age: "${ageRaw}"`);
        else { age = 14; softWarnings.push("Age not provided — defaulted to 14"); }
      }
    }

    // ── Height ──
    const heightRaw = getField(row, "height");
    let height = parseFloat(heightRaw);
    if (!heightRaw || isNaN(height) || height < 50 || height > 260) {
      if (!heightRaw) {
        height = 160;
        softWarnings.push("Height missing — defaulted to 160cm");
      } else {
        hardErrors.push(`Invalid height: "${heightRaw}"`);
      }
    }

    // ── Weight ──
    const weightRaw = getField(row, "weight");
    let weight = parseFloat(weightRaw);
    if (!weightRaw || isNaN(weight) || weight < 10 || weight > 250) {
      if (!weightRaw) {
        weight = 50;
        softWarnings.push("Weight missing — defaulted to 50kg");
      } else {
        hardErrors.push(`Invalid weight: "${weightRaw}"`);
      }
    }

    if (hardErrors.length > 0) {
      errors.push({ row: rowNum, name: name || `Row ${rowNum}`, issues: hardErrors });
      skipped++;
      return;
    }

    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

    // BMI distribution tracking
    bmiSummary.total++;
    if (bmi < 14.0) bmiSummary.severeThinness++;
    else if (bmi < 16.0) bmiSummary.thinness++;
    else if (bmi < 18.5) bmiSummary.mildThinness++;
    else if (bmi <= 23.0) bmiSummary.normal++;
    else bmiSummary.review++;

    // ── 800m Run — corrected Bihar parser ──
    const r800Raw = getField(row, "run800m");
    const r800Parsed = r800Raw ? parse800m(r800Raw) : { value: null, flag: "FORMAT_UNREADABLE" as Run800mFlag, raw: r800Raw };
    const run800m = r800Parsed.value;
    const run800mFlag = r800Parsed.flag;

    if (r800Raw) {
      if (run800mFlag === "FORMAT_UNREADABLE") {
        qualityIssues.push({
          metric: "800m Run",
          description: "Time format not recognised — enter manually",
          rawValue: r800Raw,
        });
        softWarnings.push(`800m format unreadable: "${r800Raw}" — not scored`);
      } else if (run800mFlag === "IMPLAUSIBLE_VERIFY") {
        qualityIssues.push({
          metric: "800m Run",
          description: `Time ${r800Raw} is implausible for 800m — verify with coach`,
          rawValue: r800Raw,
        });
        softWarnings.push(`800m time implausible: "${r800Raw}" — not scored`);
      } else if (run800mFlag === "AUTO_CORRECTED") {
        qualityIssues.push({
          metric: "800m Run",
          description: "Time format auto-corrected from Bihar H:MM:SS convention",
          rawValue: r800Raw,
          correctedValue: run800m != null ? `${Math.floor(run800m / 60)}:${String(Math.round(run800m % 60)).padStart(2, "0")}` : undefined,
        });
      }
    }

    // ── Vertical Jump — dual-convention correction ──
    const vjRaw = getField(row, "verticalJump");
    const vjNum = parseFloat(vjRaw);
    let verticalJump: number | undefined;
    let vjFlag: VJFlag = "OK";

    if (vjRaw && !isNaN(vjNum) && vjNum > 0) {
      const vjResult = correctVerticalJump(vjNum, height);
      vjFlag = vjResult.flag;
      verticalJump = vjResult.value ?? undefined;

      if (vjFlag === "UNCLEAR_VERIFY") {
        qualityIssues.push({
          metric: "Vertical Jump",
          description: "Value unclear — may be wall-reach total; cannot auto-correct. Verify with coach.",
          rawValue: `${vjRaw}cm`,
        });
        softWarnings.push(`VJ ${vjRaw}cm unclear — not scored`);
      } else if (vjFlag === "AUTO_CORRECTED") {
        qualityIssues.push({
          metric: "Vertical Jump",
          description: "Wall-reach convention detected — auto-corrected to net jump height",
          rawValue: `${vjRaw}cm`,
          correctedValue: `${verticalJump?.toFixed(1)}cm`,
        });
        softWarnings.push(`VJ auto-corrected: ${vjRaw}cm → ${verticalJump?.toFixed(1)}cm`);
      }
    }

    // ── 30m Sprint — plausibility gate ──
    const s30Raw = getField(row, "sprint30m");
    const s30Num = parseFloat(s30Raw);
    let sprint30m: number | undefined;
    let sprint30mFlag: Sprint30mFlag = "OK";

    if (s30Raw && !isNaN(s30Num) && s30Num > 0) {
      sprint30mFlag = checkSprint30m(s30Num);
      if (sprint30mFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "30m Sprint",
          description: `${s30Num}s exceeds plausible range (3.0s–11.0s) — verify with coach`,
          rawValue: `${s30Num}s`,
        });
        softWarnings.push(`30m sprint ${s30Num}s implausible — not scored`);
        // Do NOT store the value
      } else {
        sprint30m = s30Num;
      }
    }

    // ── Broad Jump — plausibility gate ──
    const bjRaw = getField(row, "broadJump");
    const bjNum = parseFloat(bjRaw);
    let broadJump: number | undefined;
    let broadJumpFlag: BroadJumpFlag = "OK";

    if (bjRaw && !isNaN(bjNum) && bjNum > 0) {
      broadJumpFlag = checkBroadJump(bjNum);
      if (broadJumpFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "Standing Broad Jump",
          description: `${bjNum}cm exceeds plausible range (50cm–260cm) — verify with coach`,
          rawValue: `${bjNum}cm`,
        });
        softWarnings.push(`Broad jump ${bjNum}cm implausible — not scored`);
      } else {
        broadJump = bjNum;
      }
    }

    // ── Shuttle Run — plausibility gate ──
    const shuttleRaw = getField(row, "shuttleRun");
    const shuttleNum = parseFloat(shuttleRaw);
    let shuttleRun: number | undefined;
    let shuttleRunFlag: ShuttleRunFlag = "OK";

    if (shuttleRaw && !isNaN(shuttleNum) && shuttleNum > 0) {
      shuttleRunFlag = checkShuttleRun(shuttleNum);
      if (shuttleRunFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "Shuttle Run",
          description: `${shuttleNum}s exceeds plausible range (8s–30s) — verify with coach`,
          rawValue: `${shuttleNum}s`,
        });
        softWarnings.push(`Shuttle run ${shuttleNum}s implausible — not scored`);
      } else {
        shuttleRun = shuttleNum;
      }
    }

    // ── Football Throw ──
    const fbRaw = getField(row, "footballThrow");
    const fbNum = parseFloat(fbRaw);
    const footballThrow = (!fbRaw || isNaN(fbNum) || fbNum <= 0) ? undefined : fbNum;

    // Build quality issue record
    if (qualityIssues.length > 0) {
      // Determine severity: blocked if CAI cannot be calculated (critical metrics missing/flagged)
      const hasCriticalFlag =
        run800mFlag === "FORMAT_UNREADABLE" ||
        run800mFlag === "IMPLAUSIBLE_VERIFY" ||
        sprint30mFlag === "OUTLIER_VERIFY" ||
        vjFlag === "UNCLEAR_VERIFY";

      const hasAutoCorrection =
        run800mFlag === "AUTO_CORRECTED" || vjFlag === "AUTO_CORRECTED";

      const severity: DataQualityIssue["severity"] =
        hasCriticalFlag ? "blocked" :
        hasAutoCorrection ? "auto_corrected" : "verify";

      dataQualityIssues.push({
        athleteName: name || `Row ${rowNum}`,
        rowNum,
        severity,
        issues: qualityIssues,
      });
    }

    const school   = getField(row, "school")   || "Unknown School";
    const district = getField(row, "district") || "Unknown District";
    const dobRaw   = getField(row, "dob");
    const today    = new Date();
    const dob      = dobRaw || `${today.getFullYear() - Math.round(age)}-01-01`;
    const asmtDate = getField(row, "assessmentDate") || today.toISOString().slice(0, 10);

    const id = importedId
      ? `ID${importedId.slice(-6)}`
      : `IMP${String(_idBase + idx).padStart(6, "0")}`;

    const athlete: Athlete = {
      id,
      name,
      gender,
      dob,
      age: Math.round(age),
      school,
      district,
      height,
      weight,
      bmi,
      assessmentDate: asmtDate,
      // Data quality flags — stored for downstream use
      run800mFlag,
      vjFlag,
      sprint30mFlag,
      broadJumpFlag,
      // Metrics — only include if plausible
      ...(verticalJump != null   ? { verticalJump }   : {}),
      ...(broadJump != null      ? { broadJump }      : {}),
      ...(sprint30m != null      ? { sprint30m }      : {}),
      ...(run800m != null        ? { run800m }        : {}),
      ...(shuttleRun != null     ? { shuttleRun }     : {}),
      ...(footballThrow != null  ? { footballThrow }  : {}),
    };

    athletes.push(athlete);
    if (softWarnings.length > 0) {
      warnings.push({ row: rowNum, name, issues: softWarnings });
    }
  });

  return {
    athletes,
    warnings,
    errors,
    skipped,
    detectedColumns,
    unmappedColumns,
    headerSnapshot,
    dataQualityIssues,
    bmiSummary,
  };
}

// ─── Template generator ─────────────────────────────────────────────────────

export function generateCSVTemplate(): string {
  const headers = [
    "Sl No", "studentId", "Athlete Name", "Height",
    "Thirty mflingstarts", "Standinggbroadjump", "Shuttlerun10Mx6",
    "Verticaljump", "Footballballthrow5No", "Eighthundredmetersrun", "Weight",
  ];
  const row1 = ["1", "3524024014807", "Rahul Kumar",  "158", "5.1", "200", "12.3", "42", "8.5",  "3:45", "48"];
  const row2 = ["2", "3524024014808", "Priya Singh",  "152", "5.8", "165", "13.1", "35", "6.2",  "4:10", "42"];
  const row3 = ["3", "3524024014809", "Arjun Sharma", "165", "4.9", "220", "11.8", "55", "10.0", "3:20", "55"];
  return [headers.join(","), row1.join(","), row2.join(","), row3.join(",")].join("\n");
}
