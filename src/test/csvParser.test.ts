/**
 * ─── CSV PARSER — COMPREHENSIVE TEST SUITE ───────────────────────────────────
 * Covers: header normalisation, time parsing, Bihar file format, edge cases
 */
import { describe, it, expect } from "vitest";
import { parseCSVText, rowsToAthletes, generateCSVTemplate, preflightValidate } from "@/lib/csvParser";

// ─── 1. HEADER NORMALISATION ──────────────────────────────────────────────────

describe("parseCSVText", () => {
  it("parses basic comma-separated CSV", () => {
    const csv = `Name,Height,Weight\nRahul,165,55\nPriya,152,45`;
    const rows = parseCSVText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]["Name"]).toBe("Rahul");
    expect(rows[1]["Weight"]).toBe("45");
  });

  it("parses tab-separated TSV", () => {
    const tsv = `Name\tHeight\nRahul\t165`;
    const rows = parseCSVText(tsv);
    expect(rows).toHaveLength(1);
    expect(rows[0]["Height"]).toBe("165");
  });

  it("handles quoted fields with commas inside", () => {
    const csv = `Name,School\n"Kumar, Rahul","St. John's School"`;
    const rows = parseCSVText(csv);
    expect(rows[0]["Name"]).toBe("Kumar, Rahul");
  });

  it("returns empty array for single-line input (no data rows)", () => {
    const rows = parseCSVText("Name,Height");
    expect(rows).toHaveLength(0);
  });
});

// ─── 2. BIHAR FORMAT — COLUMN MAPPING ────────────────────────────────────────

describe("rowsToAthletes — Bihar format", () => {
  const biharCSV = [
    "Sl No,studentId,Athlete Name,Height,Thirty mflingstarts,Standinggbroadjump,Shuttlerun10Mx6,Verticaljump,Footballballthrow5No,Eighthundredmetersrun,Weight",
    "1,3524024014807,Rahul Kumar,158,5.1,200,12.3,42,8.5,3:45,48",
    "2,3524024014808,Priya Singh,152,5.8,165,13.1,35,6.2,4:10,42",
  ].join("\n");

  it("parses Bihar file format correctly", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes).toHaveLength(2);
    expect(result.skipped).toBe(0);
  });

  it("maps 'Thirty mflingstarts' → sprint30m", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0].sprint30m).toBe(5.1);
  });

  it("maps 'Standinggbroadjump' → broadJump", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0].broadJump).toBe(200);
  });

  it("maps 'Verticaljump' → verticalJump", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0].verticalJump).toBe(42);
  });

  it("maps 'Shuttlerun10Mx6' → shuttleRun", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0].shuttleRun).toBe(12.3);
  });

  it("converts MM:SS → seconds for run800m (3:45 = 225s)", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0].run800m).toBe(225);
  });

  it("converts MM:SS → seconds for run800m (4:10 = 250s)", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    expect(result.athletes[1].run800m).toBe(250);
  });

  it("derives studentId into athlete ID", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    // Uses last 6 digits: 014807
    expect(result.athletes[0].id).toBe("ID014807");
  });

  it("calculates BMI from height and weight", () => {
    const rows = parseCSVText(biharCSV);
    const result = rowsToAthletes(rows);
    const expected = parseFloat((48 / (1.58 ** 2)).toFixed(1));
    expect(result.athletes[0].bmi).toBeCloseTo(expected, 0);
  });
});

// ─── 3. TIME CONVERSION ───────────────────────────────────────────────────────

describe("800m time parsing", () => {
  function parse800m(time: string) {
    const csv = `Sl No,studentId,Athlete Name,Height,Thirty mflingstarts,Standinggbroadjump,Shuttlerun10Mx6,Verticaljump,Footballballthrow5No,Eighthundredmetersrun,Weight\n1,999,Test,165,5.0,200,12,45,8,${time},55`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    return result.athletes[0]?.run800m;
  }

  it("3:45 (MM:SS) = 225 seconds", () => expect(parse800m("3:45")).toBe(225));
  it("4:00 (MM:SS) = 240 seconds", () => expect(parse800m("4:00")).toBe(240));
  it("2:30 (MM:SS) = 150 seconds", () => expect(parse800m("2:30")).toBe(150));
  it("plain 200 (seconds) = 200", () => expect(parse800m("200")).toBe(200));
  it("Excel serial 0.00260416 ≈ 225s auto-corrected", () => {
    const val = parse800m("0.00260416");
    expect(val).toBe(225); // 0.00260416 × 86400 ≈ 225
  });
});

// ─── 4. ERROR & SKIP HANDLING ─────────────────────────────────────────────────

describe("rowsToAthletes — validation", () => {
  it("skips row with missing athlete name", () => {
    const csv = `Sl No,studentId,Athlete Name,Height,Weight\n1,001,,165,55`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.skipped).toBe(1);
    expect(result.athletes).toHaveLength(0);
  });

  it("defaults gender to M when not provided (with warning)", () => {
    const csv = `Athlete Name,Height,Weight\nRahul,165,55`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0]?.gender).toBe("M");
    const hasGenderWarning = result.warnings.some((w) =>
      w.issues.some((i) => i.toLowerCase().includes("gender"))
    );
    expect(hasGenderWarning).toBe(true);
  });

  it("defaults age to 14 when not provided", () => {
    const csv = `Athlete Name,Height,Weight\nRahul,165,55`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.athletes[0]?.age).toBe(14);
  });

  it("identifies unmapped columns", () => {
    const csv = `Athlete Name,Height,Weight,UnknownColumn\nRahul,165,55,xyz`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.unmappedColumns).toContain("UnknownColumn");
  });

  it("handles empty rows gracefully", () => {
    const csv = `Athlete Name,Height,Weight\nRahul,165,55\n\n`;
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.athletes.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 5. TEMPLATE GENERATOR ───────────────────────────────────────────────────

describe("generateCSVTemplate", () => {
  it("generates valid CSV that can be re-parsed", () => {
    const csv = generateCSVTemplate();
    const rows = parseCSVText(csv);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("template has required Bihar columns", () => {
    const csv = generateCSVTemplate();
    expect(csv).toContain("Athlete Name");
    expect(csv).toContain("Verticaljump");
    expect(csv).toContain("Eighthundredmetersrun");
    expect(csv).toContain("Thirty mflingstarts");
  });

  it("template sample data parses to valid athletes", () => {
    const csv = generateCSVTemplate();
    const rows = parseCSVText(csv);
    const result = rowsToAthletes(rows);
    expect(result.athletes.length).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);
    // 800m should parse correctly (3:45 = 225s)
    expect(result.athletes[0].run800m).toBe(225);
  });
});

// ─── 6. PREFLIGHT VALIDATION (BLOCKING ERRORS BEFORE IMPORT) ─────────────────

describe("preflightValidate — blocking gate", () => {
  it("blocks empty file with EMPTY_FILE error", () => {
    const errors = preflightValidate([], "empty.csv");
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("EMPTY_FILE");
    expect(errors[0].fix).toMatch(/header row/i);
  });

  it("blocks file missing the Athlete Name column", () => {
    const csv = `Height,Weight,Verticaljump\n165,55,42`;
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "no-name.csv");
    const codes = errors.map((e) => e.code);
    expect(codes).toContain("MISSING_NAME_COLUMN");
    const nameErr = errors.find((e) => e.code === "MISSING_NAME_COLUMN")!;
    expect(nameErr.fix).toMatch(/Athlete Name/);
  });

  it("blocks file with no recognised metric columns", () => {
    const csv = `Athlete Name,FavouriteColour,LuckyNumber\nRahul,Blue,7`;
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "no-metrics.csv");
    const codes = errors.map((e) => e.code);
    expect(codes).toContain("NO_METRIC_COLUMNS");
  });

  it("blocks file with header but no name values", () => {
    const csv = `Athlete Name,Height,Weight\n,165,55\n,170,60`;
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "blank-names.csv");
    expect(errors.some((e) => e.code === "NO_DATA_ROWS")).toBe(true);
  });

  it("detects duplicate normalised headers", () => {
    const csv = `Athlete Name,Height,Height_cm\nRahul,165,166`;
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "dupes.csv");
    expect(errors.some((e) => e.code === "DUPLICATE_HEADERS")).toBe(true);
  });

  it("passes a clean Bihar-format file", () => {
    const csv = [
      "Athlete Name,Height,Verticaljump,Eighthundredmetersrun,Weight",
      "Rahul,165,42,3:45,55",
    ].join("\n");
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "good.csv");
    expect(errors).toHaveLength(0);
  });

  it("passes the generated CSV template", () => {
    const csv = generateCSVTemplate();
    const rows = parseCSVText(csv);
    const errors = preflightValidate(rows, "template.csv");
    expect(errors).toHaveLength(0);
  });

  it("every error includes title, detail, and fix", () => {
    const errors = preflightValidate([], "x.csv");
    errors.forEach((e) => {
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.detail.length).toBeGreaterThan(0);
      expect(e.fix.length).toBeGreaterThan(0);
    });
  });
});
