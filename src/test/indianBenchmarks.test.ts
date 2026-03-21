/**
 * ─── INDIAN BENCHMARKS — COMPREHENSIVE TEST SUITE ────────────────────────────
 * Covers: benchmark data integrity, percentile interpolation, SAI band
 *         assignment, LTAD profiles, record hierarchy correctness
 */
import { describe, it, expect } from "vitest";
import {
  INDIAN_BENCHMARKS,
  getNationalBenchmarkRow,
  calcNationalPercentile,
  getSAIBand,
  LTAD_PROFILES,
} from "../data/indianBenchmarks";

const HIGHER_IS_BETTER_METRICS = ["verticalJump", "broadJump"] as const;
const LOWER_IS_BETTER_METRICS  = ["sprint30m", "run800m", "shuttleRun"] as const;
const ALL_METRICS = [...HIGHER_IS_BETTER_METRICS, ...LOWER_IS_BETTER_METRICS] as const;
type Metric = typeof ALL_METRICS[number];

// ─── 1. DATA INTEGRITY ────────────────────────────────────────────────────────

describe("INDIAN_BENCHMARKS — data integrity", () => {
  it("has entries for both M and F genders", () => {
    expect(INDIAN_BENCHMARKS.M).toBeDefined();
    expect(INDIAN_BENCHMARKS.F).toBeDefined();
  });

  it("all 5 metrics exist for both genders", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of ALL_METRICS) {
        expect(INDIAN_BENCHMARKS[gender][metric]).toBeDefined();
        expect(INDIAN_BENCHMARKS[gender][metric].length).toBeGreaterThan(0);
      }
    }
  });

  it("for higher-is-better: p20 < p40 < p60 < p70 < p85", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of HIGHER_IS_BETTER_METRICS) {
        for (const row of INDIAN_BENCHMARKS[gender][metric]) {
          expect(row.p20).toBeLessThanOrEqual(row.p40);
          expect(row.p40).toBeLessThanOrEqual(row.p60);
          expect(row.p60).toBeLessThanOrEqual(row.p70);
          expect(row.p70).toBeLessThanOrEqual(row.p85);
        }
      }
    }
  });

  it("for lower-is-better (sprint/run): p20 > p40 > p60 > p70 > p85 (lower = faster = better)", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of LOWER_IS_BETTER_METRICS) {
        for (const row of INDIAN_BENCHMARKS[gender][metric]) {
          expect(row.p20).toBeGreaterThanOrEqual(row.p40);
          expect(row.p40).toBeGreaterThanOrEqual(row.p60);
          expect(row.p60).toBeGreaterThanOrEqual(row.p70);
          expect(row.p70).toBeGreaterThanOrEqual(row.p85);
        }
      }
    }
  });

  it("each row has valid ageLo < ageHi", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of ALL_METRICS) {
        for (const row of INDIAN_BENCHMARKS[gender][metric]) {
          expect(row.ageLo).toBeLessThan(row.ageHi);
        }
      }
    }
  });

  it("nationalStd is positive and non-zero for all rows", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of ALL_METRICS) {
        for (const row of INDIAN_BENCHMARKS[gender][metric]) {
          expect(row.nationalStd).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ─── 2. getNationalBenchmarkRow ───────────────────────────────────────────────

describe("getNationalBenchmarkRow", () => {
  it("returns correct row for male age 14 vertical jump (ageLo ≤ 14 ≤ ageHi)", () => {
    const row = getNationalBenchmarkRow("M", "verticalJump", 14);
    expect(row).not.toBeNull();
    expect(row!.ageLo).toBeLessThanOrEqual(14);
    expect(row!.ageHi).toBeGreaterThanOrEqual(14);
  });

  it("returns correct row for female age 16 800m run", () => {
    const row = getNationalBenchmarkRow("F", "run800m", 16);
    expect(row).not.toBeNull();
    expect(row!.ageLo).toBeLessThanOrEqual(16);
    expect(row!.ageHi).toBeGreaterThanOrEqual(16);
  });

  it("returns a row for all ages 10–18, both genders, all metrics", () => {
    for (const gender of ["M", "F"] as const) {
      for (const metric of ALL_METRICS) {
        for (const age of [10, 11, 12, 13, 14, 15, 16, 17, 18]) {
          const row = getNationalBenchmarkRow(gender, metric, age);
          expect(row).not.toBeNull();
        }
      }
    }
  });
});

// ─── 3. NATIONAL PERCENTILE CALCULATION ──────────────────────────────────────

describe("calcNationalPercentile — always in 0–100", () => {
  for (const gender of ["M", "F"] as const) {
    for (const metric of ALL_METRICS) {
      it(`${gender} ${metric} returns 0–100 for edge values`, () => {
        const row = getNationalBenchmarkRow(gender, metric, 14);
        if (!row) return;
        const lowerIsBetter = LOWER_IS_BETTER_METRICS.includes(metric as typeof LOWER_IS_BETTER_METRICS[number]);
        const values = [0, row.p20, row.p40, row.p60, row.p70, row.p85, 9999];
        for (const v of values) {
          const pct = calcNationalPercentile(v, row, lowerIsBetter);
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);
        }
      });
    }
  }
});

describe("calcNationalPercentile — correct direction", () => {
  it("CRITICAL: best vertical jump (above p85) returns percentile >= 85", () => {
    const row = getNationalBenchmarkRow("M", "verticalJump", 14)!;
    const pct = calcNationalPercentile(row.p85 + 5, row, false);
    expect(pct).toBeGreaterThanOrEqual(85);
  });

  it("CRITICAL: poor vertical jump (below p20) returns percentile < 20", () => {
    const row = getNationalBenchmarkRow("M", "verticalJump", 14)!;
    const pct = calcNationalPercentile(row.p20 - 5, row, false);
    expect(pct).toBeLessThan(20);
  });

  it("CRITICAL: fastest 30m sprint (below p85 threshold) returns percentile >= 85", () => {
    const row = getNationalBenchmarkRow("M", "sprint30m", 14)!;
    // p85 for sprint is FASTEST (lowest seconds)
    const pct = calcNationalPercentile(row.p85 - 0.3, row, true);
    expect(pct).toBeGreaterThanOrEqual(85);
  });

  it("CRITICAL: slowest 30m sprint (above p20 threshold) returns percentile <= 20", () => {
    const row = getNationalBenchmarkRow("M", "sprint30m", 14)!;
    const pct = calcNationalPercentile(row.p20 + 0.5, row, true);
    expect(pct).toBeLessThanOrEqual(20);
  });

  it("CRITICAL: fastest 800m (below p85) returns percentile >= 85", () => {
    const row = getNationalBenchmarkRow("M", "run800m", 14)!;
    const pct = calcNationalPercentile(row.p85 - 5, row, true);
    expect(pct).toBeGreaterThanOrEqual(85);
  });

  it("CRITICAL: at national mean → percentile ~60", () => {
    const row = getNationalBenchmarkRow("M", "verticalJump", 14)!;
    const pct = calcNationalPercentile(row.nationalMean, row, false);
    // National mean is close to p60 — should be in 45–75 range
    expect(pct).toBeGreaterThanOrEqual(40);
    expect(pct).toBeLessThanOrEqual(75);
  });
});

// ─── 4. SAI BAND ASSIGNMENT ───────────────────────────────────────────────────

describe("getSAIBand", () => {
  it("returns 'elite' for >= 85th percentile", () => {
    expect(getSAIBand(85)).toBe("elite");
    expect(getSAIBand(100)).toBe("elite");
    expect(getSAIBand(92)).toBe("elite");
  });
  it("returns 'national_talent' for 70–84", () => {
    expect(getSAIBand(70)).toBe("national_talent");
    expect(getSAIBand(84)).toBe("national_talent");
  });
  it("returns 'average' for 40–69", () => {
    expect(getSAIBand(40)).toBe("average");
    expect(getSAIBand(65)).toBe("average");
  });
  it("returns 'below_national' for 20–39", () => {
    expect(getSAIBand(20)).toBe("below_national");
    expect(getSAIBand(39)).toBe("below_national");
  });
  it("returns 'needs_development' for < 20", () => {
    expect(getSAIBand(19)).toBe("needs_development");
    expect(getSAIBand(0)).toBe("needs_development");
  });
});

// ─── 5. LTAD PROFILES ────────────────────────────────────────────────────────

describe("LTAD_PROFILES", () => {
  it("all profiles have valid age windows (lo < hi)", () => {
    for (const profile of Object.values(LTAD_PROFILES)) {
      expect(profile.trainToTrainWindow[0]).toBeLessThan(profile.trainToTrainWindow[1]);
      expect(profile.trainToCompeteWindow[0]).toBeLessThan(profile.trainToCompeteWindow[1]);
      expect(profile.peakPerformanceAge[0]).toBeLessThan(profile.peakPerformanceAge[1]);
    }
  });

  it("trainToTrain starts before peak performance", () => {
    for (const profile of Object.values(LTAD_PROFILES)) {
      expect(profile.trainToTrainWindow[0]).toBeLessThan(profile.peakPerformanceAge[1]);
    }
  });

  it("sprint profile has sprint30m as critical metric", () => {
    const sprint = LTAD_PROFILES["athletics_sprint"];
    expect(sprint).toBeDefined();
    expect(sprint.criticalMetrics).toContain("sprint30m");
  });

  it("endurance profile has run800m as critical metric", () => {
    const endurance = LTAD_PROFILES["athletics_endurance"];
    expect(endurance).toBeDefined();
    expect(endurance.criticalMetrics).toContain("run800m");
  });

  it("all profiles have a non-empty coachNote (>10 chars)", () => {
    for (const profile of Object.values(LTAD_PROFILES)) {
      expect(profile.coachNote.trim().length).toBeGreaterThan(10);
    }
  });

  it("all profiles have at least one critical metric", () => {
    for (const profile of Object.values(LTAD_PROFILES)) {
      expect(profile.criticalMetrics.length).toBeGreaterThan(0);
    }
  });
});
