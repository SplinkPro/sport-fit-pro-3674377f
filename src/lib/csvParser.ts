/**
 * CSV / TSV parser for athlete import.
 * Handles the Bihar assessment format from Sample_data_12.xlsx:
 *   Sl No | studentId | Athlete Name | Height | Thirty mflingstarts |
 *   Standinggbroadjump | Shuttlerun10Mx6 | Verticaljump |
 *   Footballballthrow5No | Eighthundredmetersrun | Weight
 *
 * Also accepts the standard template format.
 */
import { Athlete } from "@/data/seedAthletes";

// ─── Column name → internal field mapping ──────────────────────────────────
// All keys are lowercase with spaces collapsed, so matching is forgiving.

type InternalField = keyof Athlete | "_skip" | "_id";

const COLUMN_MAP: Record<string, InternalField> = {
  // ── Skip columns ──
  "sl no": "_skip", "sl.no": "_skip", "slno": "_skip",
  "sr no": "_skip", "sr.no": "_skip", "srno": "_skip", "#": "_skip",
  "serial no": "_skip", "serial number": "_skip", "s no": "_skip",

  // ── ID ──
  "studentid": "_id", "student id": "_id", "student_id": "_id",
  "id": "_id", "athleteid": "_id", "athlete id": "_id",
  "roll no": "_id", "rollno": "_id", "roll number": "_id",
  "reg no": "_id", "registration no": "_id", "regno": "_id",

  // ── Name ──
  "athlete name": "name", "athletename": "name", "name": "name",
  "full name": "name", "fullname": "name", "student name": "name",
  "studentname": "name", "player name": "name", "playername": "name",
  "participant name": "name", "child name": "name", "childname": "name",
  "naam": "name",

  // ── Gender ──
  "gender": "gender", "sex": "gender", "ling": "gender",
  "gender (m/f)": "gender", "m/f": "gender",

  // ── Age ──
  "age": "age", "age (years)": "age", "age years": "age",
  "ayu": "age", "aayu": "age",

  // ── Height ──
  "height": "height", "height cm": "height", "height_cm": "height",
  "heightcm": "height", "height (cm)": "height", "ht": "height",
  "ht (cm)": "height", "ht cm": "height", "height in cm": "height",
  "lambai": "height", "lamba": "height",

  // ── Weight ──
  "weight": "weight", "weight kg": "weight", "weight_kg": "weight",
  "weightkg": "weight", "weight (kg)": "weight", "wt": "weight",
  "wt (kg)": "weight", "wt kg": "weight", "weight in kg": "weight",
  "bhar": "weight", "vajan": "weight",

  // ── 30m Sprint — Bihar columns ──
  "thirty mflingstarts": "sprint30m",
  "thirtymflingstarts": "sprint30m",
  "thirty meter flying starts": "sprint30m",
  "30m sprint": "sprint30m", "sprint 30m": "sprint30m",
  "sprint_30m": "sprint30m", "sprint30m": "sprint30m",
  "sprint (30m)": "sprint30m", "sprint (sec)": "sprint30m",
  "30 m sprint": "sprint30m", "30m": "sprint30m",
  "thirty m flying starts": "sprint30m",
  "30 meter sprint": "sprint30m", "30 m flying start": "sprint30m",
  "flying start 30m": "sprint30m", "30m flying start": "sprint30m",
  "sprint": "sprint30m",

  // ── Broad Jump — Bihar columns ──
  "standinggbroadjump": "broadJump",
  "standin gbroadjump": "broadJump",
  "standing broad jump": "broadJump", "standingt broad jump": "broadJump",
  "broad jump": "broadJump", "broadjump": "broadJump",
  "broad_jump": "broadJump", "bj": "broadJump",
  "broad jump (cm)": "broadJump", "standinggbroadjump (cm)": "broadJump",
  "standing long jump": "broadJump", "standinglongjump": "broadJump",
  "long jump": "broadJump", "longjump": "broadJump",
  "standing jump": "broadJump",

  // ── Shuttle Run — Bihar column ──
  "shuttlerun10mx6": "shuttleRun",
  "shuttle run 10mx6": "shuttleRun", "shuttle run": "shuttleRun",
  "shuttlerun": "shuttleRun", "shuttle_run": "shuttleRun",
  "shuttle run (sec)": "shuttleRun", "shuttle": "shuttleRun",
  "10mx6 shuttle": "shuttleRun", "agility run": "shuttleRun",

  // ── Vertical Jump — Bihar column ──
  "verticaljump": "verticalJump",
  "vertical jump": "verticalJump", "vertical_jump": "verticalJump",
  "vj": "verticalJump", "v jump": "verticalJump", "v_jump": "verticalJump",
  "vertical jump (cm)": "verticalJump", "vert jump": "verticalJump",

  // ── Football Throw — Bihar column ──
  "footballballthrow5no": "footballThrow",
  "football ball throw 5 no": "footballThrow",
  "football throw": "footballThrow", "footballthrow": "footballThrow",
  "football_throw": "footballThrow", "football throw (m)": "footballThrow",
  "ball throw": "footballThrow", "throw": "footballThrow",

  // ── 800m Run — Bihar column ──
  "eighthundredmetersrun": "run800m",
  "eight hundred meters run": "run800m",
  "800m run": "run800m", "run800m": "run800m", "run_800m": "run800m",
  "800m run (sec)": "run800m", "800m": "run800m", "800 m run": "run800m",
  "800m run (min)": "run800m", "800 meter run": "run800m",
  "800m endurance": "run800m", "endurance run": "run800m",

  // ── School / District ──
  "school": "school", "school name": "school", "schoolname": "school",
  "district": "district", "dist": "district", "zila": "district",

  // ── DoB / Assessment date ──
  "dob": "dob", "date of birth": "dob", "birthdate": "dob",
  "assessment date": "assessmentDate", "assessmentdate": "assessmentDate",
  "date": "assessmentDate",
};

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ").replace(/[_-]/g, " ");
}

// ─── Time conversion helpers ────────────────────────────────────────────────

/**
 * Convert "H:MM:SS", "MM:SS", plain decimal, or Excel serial fraction
 * to total seconds (number).
 */
function parseTimeToSeconds(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const s = raw.trim();

  // Excel serial time fraction (e.g. "0.231840278" = fraction of a day)
  const numeric = parseFloat(s);
  if (!isNaN(numeric) && s.indexOf(":") === -1) {
    if (numeric > 0 && numeric < 1) {
      // It's an Excel serial fraction for a time within a day
      return Math.round(numeric * 86400);
    }
    // Already plain seconds
    return numeric > 0 ? numeric : null;
  }

  // "H:MM:SS" or "MM:SS"
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  return null;
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

export interface ParseResult {
  athletes: Athlete[];
  warnings: { row: number; name: string; issues: string[] }[];
  errors:   { row: number; name: string; issues: string[] }[];
  skipped:  number;
  detectedColumns: string[]; // for debug / field-map display
  unmappedColumns: string[]; // columns in file that were NOT recognized
  headerSnapshot: string[];  // all raw column names from the file
}

// Module-level counter so IDs never collide across multiple imports in the same session
let _globalIdCounter = Date.now() % 100000; // start from a time-based offset

export function rowsToAthletes(rows: Record<string, string>[]): ParseResult {
  // Use module-scoped counter (not reset on each call) to avoid ID collisions on append imports
  const _idBase = ++_globalIdCounter;
  const athletes: Athlete[] = [];
  const warnings: ParseResult["warnings"] = [];
  const errors:   ParseResult["errors"]   = [];
  let skipped = 0;

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

  /** Get raw string value for an internal field */
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

    // ── Required: Name ──
    const name = getField(row, "name");
    if (!name) hardErrors.push("Missing athlete name");

    // ── Optional: ID (use studentId if available) ──
    const importedId = getField(row, "_id");

    // ── Optional: Gender (not in Bihar file — default to "M" with warning) ──
    const genderRaw = getField(row, "gender").toUpperCase();
    let gender: "M" | "F" | null = null;
    if (genderRaw === "M" || genderRaw === "MALE" || genderRaw === "BOY")  gender = "M";
    else if (genderRaw === "F" || genderRaw === "FEMALE" || genderRaw === "GIRL") gender = "F";
    else if (!genderRaw) {
      gender = "M"; // default — Bihar file has no gender column
      softWarnings.push("Gender not provided — defaulted to M");
    } else {
      gender = "M"; // fallback instead of hard error
      softWarnings.push(`Unrecognised gender "${genderRaw}" — defaulted to M`);
    }

    // ── Optional: Age (default 14 if absent) ──
    const ageRaw = getField(row, "age");
    let age = parseFloat(ageRaw);
    if (!ageRaw || isNaN(age) || age < 5 || age > 50) {
      if (ageRaw && !isNaN(age)) hardErrors.push(`Invalid age: "${ageRaw}"`);
      else { age = 14; softWarnings.push("Age not provided — defaulted to 14"); }
    }

    // ── Height — soft error (warn but don't skip) ──
    const heightRaw = getField(row, "height");
    let height = parseFloat(heightRaw);
    if (!heightRaw || isNaN(height) || height < 50 || height > 260) {
      if (!heightRaw) {
        height = 160; // reasonable default
        softWarnings.push("Height missing — defaulted to 160cm");
      } else {
        hardErrors.push(`Invalid height: "${heightRaw}"`);
      }
    }

    // ── Weight — soft error (warn but don't skip) ──
    const weightRaw = getField(row, "weight");
    let weight = parseFloat(weightRaw);
    if (!weightRaw || isNaN(weight) || weight < 10 || weight > 250) {
      if (!weightRaw) {
        weight = 50; // reasonable default
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

    // ── Metrics ──
    const vjRaw      = getField(row, "verticalJump");
    const bjRaw      = getField(row, "broadJump");
    const s30Raw     = getField(row, "sprint30m");
    const r800Raw    = getField(row, "run800m");
    const shuttleRaw = getField(row, "shuttleRun");
    const fbRaw      = getField(row, "footballThrow");

    const vj      = parseFloat(vjRaw);
    const bj      = parseFloat(bjRaw);
    const s30     = parseFloat(s30Raw);
    const r800    = parseTimeToSeconds(r800Raw);   // handles H:MM:SS and fractions
    const shuttle = parseFloat(shuttleRaw);
    const fb      = parseFloat(fbRaw);

    // Warn on missing key metrics
    if (!vjRaw  || isNaN(vj))  softWarnings.push("Missing vertical jump");
    if (!s30Raw || isNaN(s30)) softWarnings.push("Missing 30m sprint");

    const school   = getField(row, "school")   || "Unknown School";
    const district = getField(row, "district") || "Unknown District";
    const dobRaw   = getField(row, "dob");
    const today    = new Date();
    const dob      = dobRaw || `${today.getFullYear() - Math.round(age)}-01-01`;
    const asmtDate = getField(row, "assessmentDate") || today.toISOString().slice(0, 10);

    const id = importedId
      ? `ID${importedId.slice(-6)}`  // use last 6 digits of studentId
      : `IMP${String(_idBase + idx).padStart(6, "0")}`;

    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

    const athlete: Athlete = {
      id,
      name,
      gender: gender!,
      dob,
      age: Math.round(age),
      school,
      district,
      height,
      weight,
      bmi,
      assessmentDate: asmtDate,
      ...(isFinite(vj)      && vj > 0      ? { verticalJump:  vj }      : {}),
      ...(isFinite(bj)      && bj > 0      ? { broadJump:     bj }      : {}),
      ...(isFinite(s30)     && s30 > 0     ? { sprint30m:     s30 }     : {}),
      ...(r800              && r800 > 0    ? { run800m:       r800 }    : {}),
      ...(isFinite(shuttle) && shuttle > 0 ? { shuttleRun:    shuttle } : {}),
      ...(isFinite(fb)      && fb > 0      ? { footballThrow: fb }      : {}),
    };

    athletes.push(athlete);
    if (softWarnings.length > 0) {
      warnings.push({ row: rowNum, name, issues: softWarnings });
    }
  });

  return { athletes, warnings, errors, skipped, detectedColumns, unmappedColumns, headerSnapshot };
}

// ─── Template generator ─────────────────────────────────────────────────────

/** Generates a CSV that matches the Bihar assessment file format exactly */
export function generateCSVTemplate(): string {
  const headers = [
    "Sl No", "studentId", "Athlete Name", "Height",
    "Thirty mflingstarts", "Standinggbroadjump", "Shuttlerun10Mx6",
    "Verticaljump", "Footballballthrow5No", "Eighthundredmetersrun", "Weight",
  ];
  // 800m run in MM:SS format (not H:MM:SS which would be read as hours)
  const row1 = ["1", "3524024014807", "Rahul Kumar", "158", "5.1", "200", "12.3", "42", "8.5", "3:45", "48"];
  const row2 = ["2", "3524024014808", "Priya Singh", "152", "5.8", "165", "13.1", "35", "6.2", "4:10", "42"];
  const row3 = ["3", "3524024014809", "Arjun Sharma", "165", "4.9", "220", "11.8", "55", "10.0", "3:20", "55"];
  return [headers.join(","), row1.join(","), row2.join(","), row3.join(",")].join("\n");
}
