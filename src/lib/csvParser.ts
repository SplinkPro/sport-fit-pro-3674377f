/**
 * CSV / TSV / Excel-like text parser for athlete import.
 * Converts raw text rows to Athlete objects ready for enrichAthletes().
 */
import { Athlete } from "@/data/seedAthletes";

// ─── Column aliases → internal field names ─────────────────────────────────
const COLUMN_MAP: Record<string, keyof Athlete | "_skip"> = {
  // Name
  name: "name", athletename: "name", "athlete name": "name", "full name": "name",
  // Gender
  gender: "gender", sex: "gender",
  // Age
  age: "age",
  // Height
  height: "height", height_cm: "height", "height (cm)": "height", heightcm: "height",
  // Weight
  weight: "weight", weight_kg: "weight", "weight (kg)": "weight", weightkg: "weight",
  // Vertical Jump
  v_jump: "verticalJump", vjump: "verticalJump", verticaljump: "verticalJump",
  "vertical jump": "verticalJump", "vertical jump (cm)": "verticalJump",
  vertical_jump: "verticalJump", vj: "verticalJump",
  // Broad Jump
  broad_jump: "broadJump", broadjump: "broadJump", "broad jump": "broadJump",
  "broad jump (cm)": "broadJump", bj: "broadJump",
  // 30m Sprint
  sprint_30m: "sprint30m", sprint30m: "sprint30m", "30m sprint": "sprint30m",
  "30m sprint (sec)": "sprint30m", "sprint (30m)": "sprint30m",
  "30m_sprint": "sprint30m", sprint: "sprint30m",
  // 800m Run
  run_800m: "run800m", run800m: "run800m", "800m run": "run800m",
  "800m run (min)": "run800m", "800m": "run800m", endurance: "run800m",
  // Shuttle Run
  shuttle_run: "shuttleRun", shuttlerun: "shuttleRun", "shuttle run": "shuttleRun",
  // Football Throw
  football_throw: "footballThrow", footballthrow: "footballThrow",
  "football throw": "footballThrow",
  // School / District
  school: "school", "school name": "school",
  district: "district",
  // Date of Birth
  dob: "dob", "date of birth": "dob", birthdate: "dob",
  // Assessment date
  assessment_date: "assessmentDate", assessmentdate: "assessmentDate",
  date: "assessmentDate",
  // Ignore
  id: "_skip", "#": "_skip", sr: "_skip", srno: "_skip", "sr.no": "_skip",
};

function normalise(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Parse a raw text (CSV or TSV) into row objects */
export function parseCSVText(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Detect delimiter
  const first = lines[0];
  const delim = first.includes("\t") ? "\t" : ",";

  // Parse header
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
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export interface ParseResult {
  athletes: Athlete[];
  warnings: { row: number; name: string; issues: string[] }[];
  errors: { row: number; name: string; issues: string[] }[];
  skipped: number;
}

let _importIdSeed = 1;

/** Convert parsed rows to Athlete objects */
export function rowsToAthletes(rows: Record<string, string>[]): ParseResult {
  const athletes: Athlete[] = [];
  const warnings: ParseResult["warnings"] = [];
  const errors: ParseResult["errors"] = [];
  let skipped = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed, accounting for header
    const issues: string[] = [];
    const warnIssues: string[] = [];

    // Build a normalised lookup
    const norm: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => {
      norm[normalise(k)] = v;
    });

    // Helper: get value by multiple possible header names
    const get = (key: keyof Athlete | string): string => {
      const mapped = COLUMN_MAP[normalise(key)];
      if (mapped && mapped !== "_skip") {
        // search all headers that map to this field
        for (const [rawKey, rawVal] of Object.entries(row)) {
          if (COLUMN_MAP[normalise(rawKey)] === mapped) return rawVal.trim();
        }
      }
      return norm[normalise(key)] ?? "";
    };

    const getField = (field: keyof Athlete): string => {
      for (const [rawKey, rawVal] of Object.entries(row)) {
        if (COLUMN_MAP[normalise(rawKey)] === field) return rawVal.trim();
      }
      return "";
    };

    // Required fields
    const name = getField("name");
    if (!name) { issues.push("Missing name"); }

    const genderRaw = getField("gender").toUpperCase();
    const gender = (genderRaw === "M" || genderRaw === "MALE" || genderRaw === "BOY") ? "M"
      : (genderRaw === "F" || genderRaw === "FEMALE" || genderRaw === "GIRL") ? "F"
      : null;
    if (!gender) issues.push(`Invalid gender: "${getField("gender") || "empty"}"`);

    const ageRaw = getField("age");
    const age = parseFloat(ageRaw);
    if (!ageRaw || isNaN(age) || age < 5 || age > 50) issues.push(`Invalid age: "${ageRaw}"`);

    const heightRaw = getField("height");
    const height = parseFloat(heightRaw);
    if (!heightRaw || isNaN(height) || height < 50 || height > 250)
      issues.push(`Invalid height: "${heightRaw}"`);

    const weightRaw = getField("weight");
    const weight = parseFloat(weightRaw);
    if (!weightRaw || isNaN(weight) || weight < 10 || weight > 200)
      issues.push(`Invalid weight: "${weightRaw}"`);

    if (issues.length > 0) {
      errors.push({ row: rowNum, name: name || `Row ${rowNum}`, issues });
      skipped++;
      return;
    }

    // Optional metrics
    const vj = parseFloat(getField("verticalJump"));
    const bj = parseFloat(getField("broadJump"));
    const s30 = parseFloat(getField("sprint30m"));
    const r800 = parseFloat(getField("run800m"));
    const shuttle = parseFloat(getField("shuttleRun"));
    const fbThrow = parseFloat(getField("footballThrow"));

    if (!getField("verticalJump") || isNaN(vj)) warnIssues.push("Missing vertical jump");
    if (!getField("sprint30m") || isNaN(s30)) warnIssues.push("Missing 30m sprint");

    const school = getField("school") || "Unknown School";
    const district = getField("district") || "Unknown District";

    const dobRaw = getField("dob");
    const today = new Date();
    const dob = dobRaw || `${today.getFullYear() - Math.round(age)}-01-01`;

    const assessmentDateRaw = getField("assessmentDate");
    const assessmentDate = assessmentDateRaw || today.toISOString().slice(0, 10);

    const id = `IMP${String(_importIdSeed++).padStart(4, "0")}`;

    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

    const athlete: Athlete = {
      id,
      name,
      gender: gender as "M" | "F",
      dob,
      age: Math.round(age),
      school,
      district,
      height,
      weight,
      bmi,
      assessmentDate,
      ...(isFinite(vj) && vj > 0 ? { verticalJump: vj } : {}),
      ...(isFinite(bj) && bj > 0 ? { broadJump: bj } : {}),
      ...(isFinite(s30) && s30 > 0 ? { sprint30m: s30 } : {}),
      ...(isFinite(r800) && r800 > 0 ? { run800m: r800 } : {}),
      ...(isFinite(shuttle) && shuttle > 0 ? { shuttleRun: shuttle } : {}),
      ...(isFinite(fbThrow) && fbThrow > 0 ? { footballThrow: fbThrow } : {}),
    };

    athletes.push(athlete);
    if (warnIssues.length > 0) {
      warnings.push({ row: rowNum, name, issues: warnIssues });
    }
  });

  return { athletes, warnings, errors, skipped };
}

/** Generate a downloadable CSV template */
export function generateCSVTemplate(): string {
  const headers = [
    "Name", "Gender", "Age", "Height_cm", "Weight_kg",
    "V_Jump", "Broad_Jump", "Sprint_30m", "Run_800m",
    "Shuttle_Run", "Football_Throw", "School", "District",
  ];
  const row1 = [
    "Rahul Kumar", "M", "14", "158", "48",
    "42", "160", "5.1", "185", "12.3", "18",
    "Rajendra Prasad High School", "Patna",
  ];
  const row2 = [
    "Priya Singh", "F", "13", "152", "42",
    "35", "148", "5.8", "210", "13.1", "",
    "Nehru Vidya Mandir", "Patna",
  ];
  return [headers.join(","), row1.join(","), row2.join(",")].join("\n");
}
