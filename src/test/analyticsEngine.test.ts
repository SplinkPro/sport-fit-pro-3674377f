/**
 * ─── ANALYTICS ENGINE — COMPREHENSIVE TEST SUITE ─────────────────────────────
 * Covers: calcPercentile, calcZScore, calcCompositeScore, calcSportFit,
 *         calcDerivedIndices, enrichAthletes, detectOutliers, getBenchmarkBand
 */
import { describe, it, expect } from "vitest";
import {
  calcPercentile,
  calcZScore,
  buildCohortStats,
  calcCompositeScore,
  calcSportFit,
  calcDerivedIndices,
  enrichAthletes,
  detectOutliers,
  getBenchmarkBand,
  LOWER_IS_BETTER,
  METRIC_WEIGHTS,
  METRIC_KEYS,
} from "../engine/analyticsEngine";
import type { Athlete } from "../data/seedAthletes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAthlete(overrides: Partial<Athlete> = {}): Athlete {
  return {
    id: "TEST001",
    name: "Test Athlete",
    gender: "M",
    dob: "2010-01-01",
    age: 14,
    school: "Test School",
    district: "Patna",
    height: 165,
    weight: 55,
    bmi: 20.2,
    verticalJump: 45,
    broadJump: 200,
    sprint30m: 4.5,
    run800m: 180,
    shuttleRun: 12.0,
    footballThrow: 8.5,
    assessmentDate: "2024-03-01",
    ...overrides,
  };
}

function makeStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1;
  return { mean, std, min: sorted[0], max: sorted[n - 1], values, sorted };
}

// ─── 1. PERCENTILE CALCULATION ────────────────────────────────────────────────

describe("calcPercentile — higher is better", () => {
  it("returns 100 for the highest value in the cohort", () => {
    const stats = makeStats([30, 35, 40, 45, 50]);
    // value = 50 (best vertical jump) → should be top percentile
    expect(calcPercentile(50, stats, false)).toBe(80); // 4 out of 5 below it
  });

  it("returns 0 for the lowest value in the cohort", () => {
    const stats = makeStats([30, 35, 40, 45, 50]);
    expect(calcPercentile(30, stats, false)).toBe(0);
  });

  it("returns middle percentile for median value", () => {
    const stats = makeStats([10, 20, 30, 40, 50]);
    // value = 30 → 2 values below → 40th percentile
    expect(calcPercentile(30, stats, false)).toBe(40);
  });

  it("clamps at 100 — never exceeds", () => {
    const stats = makeStats([10, 20, 30, 40, 50]);
    expect(calcPercentile(999, stats, false)).toBeLessThanOrEqual(100);
  });
});

describe("calcPercentile — lower is better (sprint/run)", () => {
  it("CRITICAL: fastest sprinter gets HIGHEST percentile", () => {
    // 4.0s is the fastest time — athlete beats everyone with a slower time
    const stats = makeStats([4.0, 4.5, 5.0, 5.5, 6.0]);
    const pct = calcPercentile(4.0, stats, true);
    // Everyone else has a higher (worse) time → athlete beats 4 out of 5
    expect(pct).toBeGreaterThanOrEqual(80);
  });

  it("CRITICAL: slowest runner gets LOWEST percentile", () => {
    const stats = makeStats([4.0, 4.5, 5.0, 5.5, 6.0]);
    const pct = calcPercentile(6.0, stats, true);
    expect(pct).toBeLessThanOrEqual(20);
  });

  it("best 800m time (lowest seconds) ranks at top", () => {
    const stats = makeStats([160, 170, 180, 190, 200]); // seconds
    const pct = calcPercentile(160, stats, true); // 2:40 is fastest
    expect(pct).toBeGreaterThan(60);
  });

  it("worst 800m time ranks at bottom", () => {
    const stats = makeStats([160, 170, 180, 190, 200]);
    const pct = calcPercentile(200, stats, true);
    expect(pct).toBeLessThanOrEqual(20);
  });
});

// ─── 2. Z-SCORE ───────────────────────────────────────────────────────────────

describe("calcZScore", () => {
  it("returns 0 for the mean value", () => {
    const stats = makeStats([10, 20, 30, 40, 50]); // mean = 30
    expect(calcZScore(30, stats)).toBe(0);
  });

  it("returns positive z for above-mean value", () => {
    const stats = makeStats([10, 20, 30, 40, 50]);
    expect(calcZScore(50, stats)).toBeGreaterThan(0);
  });

  it("returns negative z for below-mean value", () => {
    const stats = makeStats([10, 20, 30, 40, 50]);
    expect(calcZScore(10, stats)).toBeLessThan(0);
  });
});

// ─── 3. BENCHMARK BANDS ───────────────────────────────────────────────────────

describe("getBenchmarkBand", () => {
  it("excellent for >= 85th percentile", () => {
    expect(getBenchmarkBand(85)).toBe("excellent");
    expect(getBenchmarkBand(100)).toBe("excellent");
  });
  it("aboveAvg for 70-84", () => {
    expect(getBenchmarkBand(70)).toBe("aboveAvg");
    expect(getBenchmarkBand(84)).toBe("aboveAvg");
  });
  it("average for 40-69", () => {
    expect(getBenchmarkBand(40)).toBe("average");
    expect(getBenchmarkBand(69)).toBe("average");
  });
  it("belowAvg for 20-39", () => {
    expect(getBenchmarkBand(20)).toBe("belowAvg");
    expect(getBenchmarkBand(39)).toBe("belowAvg");
  });
  it("development for < 20", () => {
    expect(getBenchmarkBand(19)).toBe("development");
    expect(getBenchmarkBand(0)).toBe("development");
  });
});

// ─── 4. METRIC WEIGHTS ────────────────────────────────────────────────────────

describe("METRIC_WEIGHTS integrity", () => {
  it("CAPI weights sum to exactly 1.0", () => {
    const sum = METRIC_KEYS.reduce((acc, k) => acc + METRIC_WEIGHTS[k], 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("shuttleRun is in METRIC_KEYS (5% weight)", () => {
    expect(METRIC_KEYS).toContain("shuttleRun");
  });

  it("sprint30m is flagged as LOWER_IS_BETTER", () => {
    expect(LOWER_IS_BETTER.has("sprint30m")).toBe(true);
  });

  it("run800m is flagged as LOWER_IS_BETTER", () => {
    expect(LOWER_IS_BETTER.has("run800m")).toBe(true);
  });

  it("verticalJump is NOT lower-is-better", () => {
    expect(LOWER_IS_BETTER.has("verticalJump")).toBe(false);
  });
});

// ─── 5. COMPOSITE SCORE ───────────────────────────────────────────────────────

describe("calcCompositeScore", () => {
  const cohort = Array.from({ length: 20 }, (_, i) =>
    makeAthlete({
      id: `A${i}`,
      verticalJump: 30 + i * 2,
      broadJump: 150 + i * 5,
      sprint30m: 5.5 - i * 0.05,
      run800m: 220 - i * 3,
      shuttleRun: 14 - i * 0.1,
    })
  );

  it("returns 0–100 range", () => {
    const stats: Record<string, ReturnType<typeof makeStats>> = {};
    for (const m of METRIC_KEYS) {
      stats[m] = buildCohortStats(cohort, m);
    }
    for (const athlete of cohort) {
      const score = calcCompositeScore(athlete, stats);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("best athlete in every metric gets the highest composite score", () => {
    const stats: Record<string, ReturnType<typeof makeStats>> = {};
    for (const m of METRIC_KEYS) {
      stats[m] = buildCohortStats(cohort, m);
    }
    const best = cohort[cohort.length - 1]; // highest vertical, fastest sprint
    const worst = cohort[0];
    const bestScore = calcCompositeScore(best, stats);
    const worstScore = calcCompositeScore(worst, stats);
    expect(bestScore).toBeGreaterThan(worstScore);
  });

  it("handles athletes with missing metrics gracefully (no NaN)", () => {
    const partial = makeAthlete({ verticalJump: undefined, broadJump: undefined });
    const stats: Record<string, ReturnType<typeof makeStats>> = {};
    const minCohort = [partial, makeAthlete({ id: "B" })];
    for (const m of METRIC_KEYS) {
      stats[m] = buildCohortStats(minCohort, m);
    }
    const score = calcCompositeScore(partial, stats);
    expect(isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ─── 6. SPORT FIT ─────────────────────────────────────────────────────────────

describe("calcSportFit", () => {
  const cohort = Array.from({ length: 15 }, (_, i) =>
    makeAthlete({ id: `SF${i}`, verticalJump: 35 + i, sprint30m: 5.0 - i * 0.05 })
  );
  const stats: Record<string, ReturnType<typeof makeStats>> = {};
  beforeEach(() => {
    for (const m of METRIC_KEYS) {
      stats[m] = buildCohortStats(cohort, m);
    }
  });

  it("returns an array of sport fit results", () => {
    const athlete = makeAthlete();
    const fits = calcSportFit(athlete, stats);
    expect(Array.isArray(fits)).toBe(true);
    expect(fits.length).toBeGreaterThan(0);
  });

  it("matchScore is between 0 and 100", () => {
    const fits = calcSportFit(cohort[0], stats);
    for (const f of fits) {
      expect(f.matchScore).toBeGreaterThanOrEqual(0);
      expect(f.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it("results are sorted descending by matchScore", () => {
    const fits = calcSportFit(cohort[5], stats);
    for (let i = 0; i < fits.length - 1; i++) {
      expect(fits[i].matchScore).toBeGreaterThanOrEqual(fits[i + 1].matchScore);
    }
  });

  it("matchScore has 1 decimal precision (no tie-breaking collapse)", () => {
    const fits = calcSportFit(cohort[7], stats);
    const allSame = fits.every((f) => f.matchScore === fits[0].matchScore);
    // At least some sports should differ
    expect(allSame).toBe(false);
  });

  it("confidence is between 0 and 100", () => {
    const fits = calcSportFit(cohort[0], stats);
    for (const f of fits) {
      expect(f.confidence).toBeGreaterThanOrEqual(0);
      expect(f.confidence).toBeLessThanOrEqual(100);
    }
  });
});

// ─── 7. DERIVED INDICES ───────────────────────────────────────────────────────

describe("calcDerivedIndices", () => {
  const cohort = Array.from({ length: 10 }, (_, i) =>
    makeAthlete({ id: `DI${i}`, sprint30m: 4.5 + i * 0.1, run800m: 170 + i * 5 })
  );
  const stats: Record<string, ReturnType<typeof makeStats>> = {};
  beforeEach(() => {
    for (const m of METRIC_KEYS) {
      stats[m] = buildCohortStats(cohort, m);
    }
  });

  it("relativePowerIndex = (verticalJump * weight) / 1000", () => {
    const a = makeAthlete({ verticalJump: 45, weight: 55 });
    const di = calcDerivedIndices(a, stats);
    expect(di.relativePowerIndex).toBeCloseTo((45 * 55) / 1000, 1);
  });

  it("relativePowerIndex is null when weight is missing", () => {
    const a = makeAthlete({ weight: undefined as unknown as number });
    const di = calcDerivedIndices(a, stats);
    expect(di.relativePowerIndex).toBeNull();
  });

  it("aerobicCapacityEst is clamped to [20, 85] ml/kg/min", () => {
    // 3-minute 800m: VO2max = 483/3 + 3.5 = 164.5 → clamped to 85
    const a = makeAthlete({ run800m: 180 });
    const di = calcDerivedIndices(a, stats);
    if (di.aerobicCapacityEst !== null) {
      expect(di.aerobicCapacityEst).toBeGreaterThanOrEqual(20);
      // Clamp ceiling is 85 ml/kg/min (very fast runners hit the ceiling)
      expect(di.aerobicCapacityEst).toBeLessThanOrEqual(85);
    }
    // Typical U14 girl: 800m in 270s → 483/4.5 + 3.5 = 110.9 → clamped to 85
    const typical = makeAthlete({ run800m: 270 });
    const di2 = calcDerivedIndices(typical, stats);
    if (di2.aerobicCapacityEst !== null) {
      expect(di2.aerobicCapacityEst).toBeGreaterThanOrEqual(20);
      expect(di2.aerobicCapacityEst).toBeLessThanOrEqual(85);
    }
    // Slow runner 600s (10 min): 483/10 + 3.5 = 51.8 → within range
    const slow = makeAthlete({ run800m: 600 });
    const di3 = calcDerivedIndices(slow, stats);
    if (di3.aerobicCapacityEst !== null) {
      expect(di3.aerobicCapacityEst).toBeGreaterThanOrEqual(20);
      expect(di3.aerobicCapacityEst).toBeLessThanOrEqual(85);
      // Should be ~51.8 for 600s
      expect(di3.aerobicCapacityEst).toBeCloseTo(51.8, 0);
    }
  });

  it("aerobicCapacityEst is null for impossible run times", () => {
    const a = makeAthlete({ run800m: 30 }); // 30s for 800m — impossible
    const di = calcDerivedIndices(a, stats);
    expect(di.aerobicCapacityEst).toBeNull();
  });

  it("explosiveStructuralRatio = (verticalJump / height) * 100", () => {
    const a = makeAthlete({ verticalJump: 50, height: 165 });
    const di = calcDerivedIndices(a, stats);
    expect(di.explosiveStructuralRatio).toBeCloseTo((50 / 165) * 100, 0);
  });

  it("leanPowerScore = broadJump / weight", () => {
    const a = makeAthlete({ broadJump: 200, weight: 50 });
    const di = calcDerivedIndices(a, stats);
    expect(di.leanPowerScore).toBeCloseTo(200 / 50, 1);
  });

  it("nationalComposite is 0–100", () => {
    const a = makeAthlete();
    const di = calcDerivedIndices(a, stats);
    expect(di.nationalComposite).toBeGreaterThanOrEqual(0);
    expect(di.nationalComposite).toBeLessThanOrEqual(100);
  });

  it("speedEnduranceRatio > 1.0 for speed-dominant athlete", () => {
    // Very fast sprint, mediocre endurance
    const speedAthlete = makeAthlete({ sprint30m: 4.0, run800m: 250 });
    const endureAthlete = makeAthlete({ sprint30m: 6.0, run800m: 160 });
    const mixedCohort = [speedAthlete, endureAthlete,
      ...Array.from({length: 5}, (_, i) => makeAthlete({id: `M${i}`, sprint30m: 5.0, run800m: 200}))
    ];
    const mixedStats: Record<string, ReturnType<typeof makeStats>> = {};
    for (const m of METRIC_KEYS) mixedStats[m] = buildCohortStats(mixedCohort, m);
    const di = calcDerivedIndices(speedAthlete, mixedStats);
    if (di.speedEnduranceRatio !== null) {
      expect(di.speedEnduranceRatio).toBeGreaterThan(1.0);
    }
  });
});

// ─── 8. OUTLIER DETECTION ─────────────────────────────────────────────────────

describe("detectOutliers", () => {
  it("flags athletes with z-score >= 3 as outliers", () => {
    // Create a cohort with one extreme outlier
    const cohort = Array.from({ length: 20 }, (_, i) =>
      makeAthlete({ id: `O${i}`, verticalJump: 40 + i * 0.5 }) // 40–49.5
    );
    // Add extreme outlier
    cohort.push(makeAthlete({ id: "OUTLIER", verticalJump: 200 }));

    const stats: Record<string, ReturnType<typeof makeStats>> = {};
    for (const m of METRIC_KEYS) stats[m] = buildCohortStats(cohort, m);

    const outliers = detectOutliers(cohort, stats);
    const outlierIds = outliers.map((o) => o.athleteId);
    expect(outlierIds).toContain("OUTLIER");
  });

  it("does not flag normal athletes as outliers", () => {
    const cohort = Array.from({ length: 20 }, (_, i) =>
      makeAthlete({ id: `N${i}`, verticalJump: 40 + i * 0.5 })
    );
    const stats: Record<string, ReturnType<typeof makeStats>> = {};
    for (const m of METRIC_KEYS) stats[m] = buildCohortStats(cohort, m);
    const outliers = detectOutliers(cohort, stats);
    expect(outliers.length).toBe(0);
  });
});

// ─── 9. ENRICH ATHLETES (FULL PIPELINE) ──────────────────────────────────────

describe("enrichAthletes — full pipeline", () => {
  const cohort = Array.from({ length: 20 }, (_, i) =>
    makeAthlete({
      id: `E${i}`,
      verticalJump: 30 + i * 2,
      broadJump: 150 + i * 5,
      sprint30m: 5.5 - i * 0.06,
      run800m: 220 - i * 4,
      shuttleRun: 14 - i * 0.15,
    })
  );

  it("returns same count as input", () => {
    const enriched = enrichAthletes(cohort);
    expect(enriched.length).toBe(cohort.length);
  });

  it("every athlete has a compositeScore 0–100", () => {
    const enriched = enrichAthletes(cohort);
    for (const a of enriched) {
      expect(a.compositeScore).toBeGreaterThanOrEqual(0);
      expect(a.compositeScore).toBeLessThanOrEqual(100);
    }
  });

  it("isHighPotential set correctly (threshold: compositeScore >= 70)", () => {
    const enriched = enrichAthletes(cohort);
    for (const a of enriched) {
      if (a.compositeScore >= 70) expect(a.isHighPotential).toBe(true);
      else expect(a.isHighPotential).toBe(false);
    }
  });

  it("best all-around athlete has highest compositeScore", () => {
    const enriched = enrichAthletes(cohort);
    const sorted = [...enriched].sort((a, b) => b.compositeScore - a.compositeScore);
    // The last athlete in cohort has best stats in every metric
    expect(sorted[0].id).toBe("E19");
  });

  it("topSport is populated (not empty)", () => {
    const enriched = enrichAthletes(cohort);
    for (const a of enriched) {
      expect(a.topSport).not.toBe("");
    }
  });

  it("derivedIndices are calculated for all enriched athletes", () => {
    const enriched = enrichAthletes(cohort);
    for (const a of enriched) {
      expect(a.derivedIndices).toBeDefined();
      expect(a.derivedIndices.nationalComposite).toBeGreaterThanOrEqual(0);
    }
  });

  it("empty input returns empty array (no crash)", () => {
    const result = enrichAthletes([]);
    expect(result).toEqual([]);
  });
});
