/**
 * CSV / TSV parser for athlete import — Production-grade v2.0
 * 
 * Handles:
 * - Bihar assessment format (Sample_data_12.xlsx)
 * - Standard template format
 * - Any column ordering
 * - No record limit — supports 100,000+ athletes
 *
 * KEY FEATURES:
 *  - 800m: Bihar Excel H:MM:SS (M:SS:cs), MM:SS, plain seconds, Excel serial fractions
 *  - VJ: Dual-convention handling (net jump vs wall-reach total)
 *  - Plausibility gates with wide tolerances for youth athletes
 *  - Graceful degradation: individual metric errors don't block athlete import
 *  - Auto-correction with full audit trail
 */
import { Athlete } from "@/data/seedAthletes";

// ─── Column name → internal field mapping ──────────────────────────────────

type InternalField = keyof Athlete | "_skip" | "_id";

const COLUMN_MAP: Record<string, InternalField> = {
  // ── Skip columns ──
  "slno": "_skip", "srno": "_skip", "serialno": "_skip",
  "serialnumber": "_skip", "sno": "_skip", "sino": "_skip",
  "sl": "_skip", "sr": "_skip", "no": "_skip", "sn": "_skip",

  // ── ID ──
  "studentid": "_id", "id": "_id", "athleteid": "_id",
  "rollno": "_id", "rollnumber": "_id", "regno": "_id",
  "registrationno": "_id", "enrollmentno": "_id",
  "registrationnumber": "_id", "enrollment": "_id",

  // ── Name ──
  "athletename": "name", "name": "name", "fullname": "name",
  "studentname": "name", "playername": "name",
  "participantname": "name", "childname": "name", "naam": "name",
  "firstname": "name", "candidatename": "name",

  // ── Gender ──
  "gender": "gender", "sex": "gender", "ling": "gender", "mf": "gender",

  // ── Age ──
  "age": "age", "ageyears": "age", "ayu": "age", "aayu": "age",
  "ageinyr": "age", "ageinyears": "age",

  // ── Height ──
  "height": "height", "heightcm": "height", "ht": "height",
  "heightincm": "height", "lambai": "height", "lamba": "height",
  "htcm": "height", "heightincentimeter": "height",

  // ── Weight ──
  "weight": "weight", "weightkg": "weight", "wt": "weight",
  "weightinkg": "weight", "bhar": "weight", "vajan": "weight",
  "wtkg": "weight", "weightinkilogram": "weight",

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
  "30mflyingstartssec": "sprint30m",

  // ── Broad Jump ──
  "standinggbroadjump": "broadJump",
  "standingbroadjump": "broadJump",
  "broadjump": "broadJump",
  "bj": "broadJump",
  "standinglongjump": "broadJump",
  "longjump": "broadJump",
  "standingjump": "broadJump",
  "sbj": "broadJump",
  "sbjcm": "broadJump",
  "broadjumpcm": "broadJump",

  // ── Shuttle Run ──
  "shuttlerun10mx6": "shuttleRun",
  "shuttlerun": "shuttleRun",
  "shuttle": "shuttleRun",
  "10mx6shuttle": "shuttleRun",
  "agilityrun": "shuttleRun",
  "10mx6": "shuttleRun",
  "shuttlerunsec": "shuttleRun",

  // ── Vertical Jump ──
  "verticaljump": "verticalJump",
  "vj": "verticalJump",
  "vjump": "verticalJump",
  "vertjump": "verticalJump",
  "cmj": "verticalJump",
  "vjcm": "verticalJump",
  "verticaljumpcm": "verticalJump",

  // ── Football Throw ──
  "footballballthrow5no": "footballThrow",
  "footballballthrow": "footballThrow",
  "footballthrow": "footballThrow",
  "ballthrow": "footballThrow",
  "throw": "footballThrow",
  "footballthrowm": "footballThrow",
  "throwm": "footballThrow",

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
  "800mrunsec": "run800m",

  // ── School / District ──
  "school": "school", "schoolname": "school", "vidyalaya": "school",
  "district": "district", "dist": "district", "zila": "district",

  // ── DoB / Assessment date ──
  "dob": "dob", "dateofbirth": "dob", "birthdate": "dob",
  "assessmentdate": "assessmentDate", "date": "assessmentDate",
  "testdate": "assessmentDate",
};

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─── 800m PARSER ─────────────────────────────────────────────────────────────

export type Run800mFlag =
  | "OK"
  | "AUTO_CORRECTED"
  | "IMPLAUSIBLE_VERIFY"
  | "FORMAT_UNREADABLE";

export interface Parsed800m {
  value: number | null;
  flag: Run800mFlag;
  raw: string;
}

/**
 * Parse 800m time from various formats:
 * - "3:45" → 225s (MM:SS)
 * - "4:20:18" → 260.18s (Bihar M:SS:cs)
 * - "225" → 225s (plain seconds)
 * - "0.00260416" → 225s (Excel serial fraction: value × 86400)
 * - Values 90-900s are plausible for youth 800m
 */
export function parse800m(raw: string): Parsed800m {
  if (!raw || raw.trim() === "") return { value: null, flag: "FORMAT_UNREADABLE", raw };
  const s = raw.trim();

  // ── Excel serial fraction (e.g. "0.00260416" = 225s) ──
  const numeric = parseFloat(s);
  if (!isNaN(numeric) && s.indexOf(":") === -1) {
    if (numeric > 0 && numeric < 1) {
      // Excel time serial → convert to seconds (× 86400)
      const converted = Math.round(numeric * 86400);
      if (converted >= 90 && converted <= 900) {
        return { value: converted, flag: "AUTO_CORRECTED", raw };
      }
      return { value: null, flag: "FORMAT_UNREADABLE", raw };
    }
    // Plain seconds
    if (numeric >= 90 && numeric <= 900) return { value: numeric, flag: "OK", raw };
    if (numeric > 900) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    // Values < 90 could be minutes.decimal (e.g. 3.75 = 3m45s = 225s)
    if (numeric >= 1.5 && numeric < 15) {
      const converted = Math.floor(numeric) * 60 + Math.round((numeric % 1) * 60);
      if (converted >= 90 && converted <= 900) {
        return { value: converted, flag: "AUTO_CORRECTED", raw };
      }
    }
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  // ── Colon-separated time string ──
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return { value: null, flag: "FORMAT_UNREADABLE", raw };

  let seconds: number;

  if (parts.length === 4) {
    // 0:00:03:45 format from Excel — try last two parts as MM:SS
    seconds = parts[2] * 60 + parts[3];
    if (seconds >= 90 && seconds <= 900) {
      return { value: seconds, flag: "AUTO_CORRECTED", raw };
    }
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  if (parts.length === 3) {
    // Try standard H:MM:SS first
    const standard = parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (standard >= 90 && standard <= 900) {
      return { value: parseFloat(standard.toFixed(2)), flag: "OK", raw };
    }
    // Try Bihar M:SS:cs
    const biharSeconds = parts[0] * 60 + parts[1] + parts[2] / 100;
    if (biharSeconds >= 90 && biharSeconds <= 900) {
      return { value: parseFloat(biharSeconds.toFixed(2)), flag: "AUTO_CORRECTED", raw };
    }
    if (biharSeconds > 900) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  if (parts.length === 2) {
    // MM:SS
    seconds = parts[0] * 60 + parts[1];
    if (seconds >= 90 && seconds <= 900) return { value: seconds, flag: "OK", raw };
    if (seconds > 900) return { value: null, flag: "IMPLAUSIBLE_VERIFY", raw };
    // Very small MM:SS like 1:30 = 90s is minimum plausible
    return { value: null, flag: "FORMAT_UNREADABLE", raw };
  }

  return { value: null, flag: "FORMAT_UNREADABLE", raw };
}

// ─── VERTICAL JUMP DUAL-CONVENTION CORRECTION ────────────────────────────────

export type VJFlag =
  | "OK"
  | "AUTO_CORRECTED"
  | "UNCLEAR_VERIFY";

export interface ParsedVJ {
  value: number | null;
  flag: VJFlag;
  raw: number;
  correctedFrom?: number;
}

export function correctVerticalJump(rawVJ: number, heightCm: number): ParsedVJ {
  let vj = rawVJ;

  // Handle accidental meter entry (value < 10 → likely entered in meters)
  if (vj < 10 && vj > 0) {
    vj = vj * 100;
  }

  if (vj > 120) {
    // Likely wall-reach convention
    const estimatedReach = heightCm * 1.33;
    const netJump = vj - estimatedReach;
    if (netJump < 0 || netJump > 110) {
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
// Widened tolerances for Indian youth athletes (rural/tribal programs)

export type Sprint30mFlag = "OK" | "OUTLIER_VERIFY";
export type BroadJumpFlag = "OK" | "OUTLIER_VERIFY";
export type ShuttleRunFlag = "OK" | "OUTLIER_VERIFY";
export type FootballThrowFlag = "OK" | "OUTLIER_VERIFY";

export function checkSprint30m(value: number): Sprint30mFlag {
  // 2.5s–14s: very wide gate for youth (some rural kids may be slow)
  return (value < 2.5 || value > 14.0) ? "OUTLIER_VERIFY" : "OK";
}

export function checkBroadJump(value: number): BroadJumpFlag {
  // 30–300cm: wide for youth (small children jump short)
  return (value > 300 || value < 30) ? "OUTLIER_VERIFY" : "OK";
}

export function checkShuttleRun(value: number): ShuttleRunFlag {
  // 6–40s: wide for 10m×6 shuttle
  return (value > 40 || value < 6) ? "OUTLIER_VERIFY" : "OK";
}

export function checkFootballThrow(value: number): FootballThrowFlag {
  // 1–35m: youth football throw range
  return (value > 35 || value < 1) ? "OUTLIER_VERIFY" : "OK";
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

// ─── PREFLIGHT VALIDATION ────────────────────────────────────────────────────
// Hard-blocks at upload time. Returns clear, actionable errors BEFORE the user
// is allowed to advance through the import wizard. Every error includes a
// human-readable fix.

export interface PreflightError {
  code:
    | "EMPTY_FILE"
    | "NO_HEADER_ROW"
    | "NO_DATA_ROWS"
    | "MISSING_NAME_COLUMN"
    | "NO_METRIC_COLUMNS"
    | "DUPLICATE_HEADERS"
    | "ALL_ROWS_BLANK";
  title: string;
  detail: string;
  fix: string;
}

const REQUIRED_NAME_ALIASES = [
  "Athlete Name", "Name", "Full Name", "Student Name", "Player Name",
];

const RECOGNISED_METRIC_FIELDS: InternalField[] = [
  "verticalJump", "broadJump", "sprint30m", "run800m",
  "shuttleRun", "footballThrow", "height", "weight",
];

export function preflightValidate(
  rows: Record<string, string>[],
  fileName?: string,
): PreflightError[] {
  const errors: PreflightError[] = [];

  // 1. Empty file
  if (!rows || rows.length === 0) {
    errors.push({
      code: "EMPTY_FILE",
      title: "File is empty or unreadable",
      detail: fileName
        ? `"${fileName}" contains no readable rows.`
        : "The uploaded file contains no readable rows.",
      fix: "Open the file and confirm it has a header row followed by at least one athlete row. Re-save as .csv or .xlsx and try again.",
    });
    return errors; // nothing else to check
  }

  const headers = Object.keys(rows[0] ?? {});

  // 2. No header row (all headers blank)
  if (headers.length === 0 || headers.every((h) => !h.trim())) {
    errors.push({
      code: "NO_HEADER_ROW",
      title: "Header row is missing",
      detail: "The first row must contain column names like 'Athlete Name', 'Height', 'Vertical Jump'.",
      fix: "Add a header row as the first line of the file. Download the CSV template below for the exact format.",
    });
    return errors;
  }

  // 3. Duplicate headers (after normalisation)
  const normCounts = new Map<string, string[]>();
  headers.forEach((h) => {
    if (!h.trim()) return;
    const norm = normaliseHeader(h);
    if (!norm) return;
    const list = normCounts.get(norm) ?? [];
    list.push(h);
    normCounts.set(norm, list);
  });
  const dupes = [...normCounts.values()].filter((g) => g.length > 1);
  if (dupes.length > 0) {
    errors.push({
      code: "DUPLICATE_HEADERS",
      title: "Duplicate column headers detected",
      detail: `These columns map to the same field: ${dupes.map((g) => g.join(" / ")).join("; ")}.`,
      fix: "Remove or rename the duplicate columns so each metric appears only once.",
    });
  }

  // 4. Missing required Name column
  const headerMap: Partial<Record<string, InternalField>> = {};
  headers.forEach((h) => {
    const mapped = COLUMN_MAP[normaliseHeader(h)];
    if (mapped) headerMap[h] = mapped;
  });
  const hasName = Object.values(headerMap).includes("name");
  if (!hasName) {
    errors.push({
      code: "MISSING_NAME_COLUMN",
      title: "Required column 'Athlete Name' not found",
      detail: `Detected columns: ${headers.filter(Boolean).slice(0, 10).join(", ") || "(none)"}${headers.length > 10 ? "…" : ""}`,
      fix: `Add a column named one of: ${REQUIRED_NAME_ALIASES.map((n) => `"${n}"`).join(", ")}. This column must contain the athlete's full name on each row.`,
    });
  }

  // 5. No recognised metric columns at all
  const recognisedMetrics = Object.values(headerMap).filter((f) =>
    f && RECOGNISED_METRIC_FIELDS.includes(f as InternalField),
  );
  if (recognisedMetrics.length === 0) {
    errors.push({
      code: "NO_METRIC_COLUMNS",
      title: "No performance metric columns recognised",
      detail: "At least one of: Vertical Jump, Broad Jump, 30m Sprint, 800m Run, Shuttle Run, Football Throw, Height, Weight must be present.",
      fix: "Rename your metric columns to match the template (e.g. 'Verticaljump', 'Standinggbroadjump', 'Eighthundredmetersrun'). Download the CSV template for exact names.",
    });
  }

  // 6. All rows blank
  const nonBlankRows = rows.filter((r) => Object.values(r).some((v) => v && String(v).trim()));
  if (nonBlankRows.length === 0) {
    errors.push({
      code: "ALL_ROWS_BLANK",
      title: "No data rows found",
      detail: `Found ${rows.length} row(s) but every cell is empty.`,
      fix: "Add at least one row of athlete data below the header. Re-check that you saved the file with data, not just column headings.",
    });
  } else if (nonBlankRows.length < rows.length / 2 && rows.length > 4) {
    // Not blocking, but warn-ish — only block if literally nothing.
  }

  // 7. Has name column but no row has a value for it
  if (hasName && nonBlankRows.length > 0) {
    const nameHeader = Object.entries(headerMap).find(([, f]) => f === "name")?.[0];
    if (nameHeader) {
      const rowsWithName = rows.filter((r) => (r[nameHeader] ?? "").trim());
      if (rowsWithName.length === 0) {
        errors.push({
          code: "NO_DATA_ROWS",
          title: "Athlete Name column is empty on every row",
          detail: `The "${nameHeader}" column exists but contains no values.`,
          fix: "Fill in each athlete's full name in the 'Athlete Name' column. Rows without a name will be skipped.",
        });
      }
    }
  }

  return errors;
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
  dataQualityIssues: DataQualityIssue[];
  bmiSummary: {
    total: number;
    severeThinness: number;
    thinness: number;
    mildThinness: number;
    normal: number;
    review: number;
  };
  /** Total rows in input file (including skipped) */
  totalInputRows: number;
}

let _globalIdCounter = Date.now() % 100000;

export interface BatchMeta {
  ageGroup: "U10" | "U12" | "U14" | "U16" | "U18" | "Open";
  gender: "M" | "F" | "Mixed";
}

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

  const getField = (row: Record<string, string>, field: InternalField): string => {
    for (const [header, mapped] of Object.entries(headerMap)) {
      if (mapped === field) return (row[header] ?? "").trim();
    }
    return "";
  };

  // NO RECORD LIMIT — process all rows
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const softWarnings: string[] = [];
    const qualityIssues: DataQualityIssue["issues"] = [];

    // ── Required: Name ──
    const name = getField(row, "name");
    if (!name) {
      // Skip silently for truly empty rows
      const hasAnyData = Object.values(row).some(v => v && v.trim());
      if (hasAnyData) {
        errors.push({ row: rowNum, name: `Row ${rowNum}`, issues: ["Missing athlete name"] });
        skipped++;
      }
      return;
    }

    // ── Optional: ID ──
    const importedId = getField(row, "_id");

    // ── Gender ──
    let gender: "M" | "F" = "M";
    if (batchMeta && batchMeta.gender !== "Mixed") {
      gender = batchMeta.gender;
    } else {
      const genderRaw = getField(row, "gender").toUpperCase().trim();
      if (genderRaw === "M" || genderRaw === "MALE" || genderRaw === "BOY" || genderRaw === "B") gender = "M";
      else if (genderRaw === "F" || genderRaw === "FEMALE" || genderRaw === "GIRL" || genderRaw === "G") gender = "F";
      else if (!genderRaw) {
        gender = "M";
        if (!batchMeta) softWarnings.push("Gender not provided — defaulted to M");
      } else {
        gender = "M";
        softWarnings.push(`Unrecognised gender "${genderRaw}" — defaulted to M`);
      }
    }

    // ── Age ──
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
        age = 14;
        softWarnings.push("Age not provided — defaulted to 14");
      }
    }

    // ── Height (soft default — never blocks import) ──
    const heightRaw = getField(row, "height");
    let height = parseFloat(heightRaw);
    if (!heightRaw || isNaN(height)) {
      height = 160;
      softWarnings.push("Height missing — defaulted to 160cm");
    } else if (height < 50) {
      // Possibly entered in meters (1.65 → 165)
      if (height > 0.5 && height < 3) {
        height = Math.round(height * 100);
        softWarnings.push(`Height auto-corrected from ${heightRaw}m to ${height}cm`);
      } else {
        height = 160;
        softWarnings.push(`Height ${heightRaw} implausible — defaulted to 160cm`);
      }
    } else if (height > 260) {
      height = 160;
      softWarnings.push(`Height ${heightRaw}cm implausible — defaulted to 160cm`);
    }

    // ── Weight (soft default — never blocks import) ──
    const weightRaw = getField(row, "weight");
    let weight = parseFloat(weightRaw);
    if (!weightRaw || isNaN(weight)) {
      weight = 50;
      softWarnings.push("Weight missing — defaulted to 50kg");
    } else if (weight < 10 || weight > 250) {
      weight = 50;
      softWarnings.push(`Weight ${weightRaw} implausible — defaulted to 50kg`);
    }

    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

    // BMI distribution
    bmiSummary.total++;
    if (bmi < 14.0) bmiSummary.severeThinness++;
    else if (bmi < 16.0) bmiSummary.thinness++;
    else if (bmi < 18.5) bmiSummary.mildThinness++;
    else if (bmi <= 23.0) bmiSummary.normal++;
    else bmiSummary.review++;

    // ── 800m Run ──
    const r800Raw = getField(row, "run800m");
    const r800Parsed = r800Raw ? parse800m(r800Raw) : { value: null, flag: "FORMAT_UNREADABLE" as Run800mFlag, raw: r800Raw };
    const run800m = r800Parsed.value;
    const run800mFlag = r800Parsed.flag;

    if (r800Raw) {
      if (run800mFlag === "FORMAT_UNREADABLE") {
        qualityIssues.push({
          metric: "800m Run",
          description: `Format not recognised: "${r800Raw}" — not scored`,
          rawValue: r800Raw,
        });
        softWarnings.push(`800m format unreadable: "${r800Raw}" — not scored`);
      } else if (run800mFlag === "IMPLAUSIBLE_VERIFY") {
        qualityIssues.push({
          metric: "800m Run",
          description: `Time ${r800Raw} is implausible (>15 min) — verify with coach`,
          rawValue: r800Raw,
        });
        softWarnings.push(`800m time implausible: "${r800Raw}" — not scored`);
      } else if (run800mFlag === "AUTO_CORRECTED") {
        qualityIssues.push({
          metric: "800m Run",
          description: "Time format auto-corrected",
          rawValue: r800Raw,
          correctedValue: run800m != null ? `${Math.floor(run800m / 60)}:${String(Math.round(run800m % 60)).padStart(2, "0")}` : undefined,
        });
      }
    }

    // ── Vertical Jump ──
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
          description: `Value ${vjRaw}cm unclear — may be wall-reach total; cannot auto-correct`,
          rawValue: `${vjRaw}cm`,
        });
        softWarnings.push(`VJ ${vjRaw}cm unclear — not scored`);
      } else if (vjFlag === "AUTO_CORRECTED") {
        qualityIssues.push({
          metric: "Vertical Jump",
          description: "Wall-reach convention detected — auto-corrected to net jump",
          rawValue: `${vjRaw}cm`,
          correctedValue: `${verticalJump?.toFixed(1)}cm`,
        });
      }
    }

    // ── 30m Sprint ──
    const s30Raw = getField(row, "sprint30m");
    const s30Num = parseFloat(s30Raw);
    let sprint30m: number | undefined;
    let sprint30mFlag: Sprint30mFlag = "OK";

    if (s30Raw && !isNaN(s30Num) && s30Num > 0) {
      sprint30mFlag = checkSprint30m(s30Num);
      if (sprint30mFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "30m Sprint",
          description: `${s30Num}s outside plausible range (2.5–14s) — verify`,
          rawValue: `${s30Num}s`,
        });
        softWarnings.push(`30m sprint ${s30Num}s implausible — not scored`);
      } else {
        sprint30m = s30Num;
      }
    }

    // ── Broad Jump ──
    const bjRaw = getField(row, "broadJump");
    const bjNum = parseFloat(bjRaw);
    let broadJump: number | undefined;
    let broadJumpFlag: BroadJumpFlag = "OK";

    if (bjRaw && !isNaN(bjNum) && bjNum > 0) {
      broadJumpFlag = checkBroadJump(bjNum);
      if (broadJumpFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "Broad Jump",
          description: `${bjNum}cm outside plausible range (30–300cm) — verify`,
          rawValue: `${bjNum}cm`,
        });
        softWarnings.push(`Broad jump ${bjNum}cm implausible — not scored`);
      } else {
        broadJump = bjNum;
      }
    }

    // ── Shuttle Run ──
    const shuttleRaw = getField(row, "shuttleRun");
    const shuttleNum = parseFloat(shuttleRaw);
    let shuttleRun: number | undefined;
    let shuttleRunFlag: ShuttleRunFlag = "OK";

    if (shuttleRaw && !isNaN(shuttleNum) && shuttleNum > 0) {
      shuttleRunFlag = checkShuttleRun(shuttleNum);
      if (shuttleRunFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "Shuttle Run",
          description: `${shuttleNum}s outside plausible range (6–40s) — verify`,
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
    let footballThrow: number | undefined;
    let footballThrowFlag: FootballThrowFlag = "OK";

    if (fbRaw && !isNaN(fbNum) && fbNum > 0) {
      footballThrowFlag = checkFootballThrow(fbNum);
      if (footballThrowFlag === "OUTLIER_VERIFY") {
        qualityIssues.push({
          metric: "Football Throw",
          description: `${fbNum}m outside plausible range (1–35m) — verify`,
          rawValue: `${fbNum}m`,
        });
        softWarnings.push(`Football throw ${fbNum}m implausible — not scored`);
      } else {
        footballThrow = fbNum;
      }
    }

    // Build quality issue record
    if (qualityIssues.length > 0) {
      const hasCriticalFlag =
        run800mFlag === "FORMAT_UNREADABLE" ||
        run800mFlag === "IMPLAUSIBLE_VERIFY" ||
        sprint30mFlag === "OUTLIER_VERIFY" ||
        broadJumpFlag === "OUTLIER_VERIFY" ||
        vjFlag === "UNCLEAR_VERIFY";

      const hasAutoCorrection =
        run800mFlag === "AUTO_CORRECTED" || vjFlag === "AUTO_CORRECTED";

      // Only mark "blocked" if MULTIPLE critical metrics are missing/flagged
      const criticalFlagCount = [
        run800mFlag === "FORMAT_UNREADABLE" || run800mFlag === "IMPLAUSIBLE_VERIFY",
        sprint30mFlag === "OUTLIER_VERIFY",
        broadJumpFlag === "OUTLIER_VERIFY",
        vjFlag === "UNCLEAR_VERIFY",
      ].filter(Boolean).length;

      const severity: DataQualityIssue["severity"] =
        criticalFlagCount >= 2 ? "blocked" :
        hasCriticalFlag ? "verify" :
        hasAutoCorrection ? "auto_corrected" : "verify";

      dataQualityIssues.push({
        athleteName: name,
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
      run800mFlag,
      vjFlag,
      sprint30mFlag,
      broadJumpFlag,
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
    totalInputRows: rows.length,
  };
}

// ─── Template generator ─────────────────────────────────────────────────────

export function generateCSVTemplate(): string {
  const headers = [
    "Sl No", "studentId", "Athlete Name", "Gender", "Age", "Height",
    "Thirty mflingstarts", "Standinggbroadjump", "Shuttlerun10Mx6",
    "Verticaljump", "Footballballthrow5No", "Eighthundredmetersrun", "Weight",
    "School", "District",
  ];
  const row1 = ["1", "3524024014807", "Rahul Kumar",  "M", "14", "158", "5.1", "200", "12.3", "42", "8.5",  "3:45", "48", "DAV Public School", "Patna"];
  const row2 = ["2", "3524024014808", "Priya Singh",  "F", "13", "152", "5.8", "165", "13.1", "35", "6.2",  "4:10", "42", "Kendriya Vidyalaya", "Gaya"];
  const row3 = ["3", "3524024014809", "Arjun Sharma", "M", "15", "165", "4.9", "220", "11.8", "55", "10.0", "3:20", "55", "St. Xavier's School", "Muzaffarpur"];
  return [headers.join(","), row1.join(","), row2.join(","), row3.join(",")].join("\n");
}
