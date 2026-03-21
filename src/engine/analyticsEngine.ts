import { Athlete, AthleteFlag } from "../data/seedAthletes";
import { SPORTS_CONFIG, SportConfig } from "../data/sportsConfig";
import {
  INDIAN_BENCHMARKS,
  getNationalBenchmarkRow,
  calcNationalPercentile,
  getSAIBand,
  SAIBand,
  NationalBenchmarkMetric,
} from "../data/indianBenchmarks";

// ─── METRIC KEYS ────────────────────────────────────────────────────────────

export type MetricKey = "verticalJump" | "broadJump" | "sprint30m" | "run800m" | "shuttleRun" | "footballThrow";
// CAPI uses these 5 metrics — shuttleRun IS included (5% weight)
export const METRIC_KEYS: MetricKey[] = ["verticalJump", "broadJump", "sprint30m", "run800m", "shuttleRun"];

// For sprint/run, lower is better — flag them
export const LOWER_IS_BETTER: Set<MetricKey> = new Set(["sprint30m", "run800m", "shuttleRun"]);

// ─── COHORT STATS ENGINE ────────────────────────────────────────────────────

interface CohortStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  values: number[];
  sorted: number[]; // pre-sorted for O(log n) percentile lookup
}

function calcStats(values: number[]): CohortStats {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 1, min: 0, max: 0, values, sorted: [] };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1;
  const sorted = [...values].sort((a, b) => a - b);
  return { mean, std, min: sorted[0], max: sorted[n - 1], values, sorted };
}

export function buildCohortStats(
  athletes: Athlete[],
  metric: MetricKey,
  gender?: "M" | "F",
  ageBand?: string
): CohortStats {
  let pool = athletes;
  if (gender) pool = pool.filter((a) => a.gender === gender);
  if (ageBand) {
    const [lo, hi] = ageBand.split("-").map(Number);
    pool = pool.filter((a) => a.age >= lo && a.age <= (hi || 99));
  }
  const values = pool.map((a) => a[metric] as number).filter((v) => v != null && !isNaN(v));
  return calcStats(values);
}

export function calcZScore(value: number, stats: CohortStats): number {
  return (value - stats.mean) / stats.std;
}

export function calcPercentile(value: number, stats: CohortStats, lowerIsBetter = false): number {
  const sorted = stats.sorted;
  const n = sorted.length;
  if (n === 0) return 50;

  if (lowerIsBetter) {
    // Count how many values are STRICTLY WORSE (higher) than this value
    // A lower time = better rank. If you have the lowest time, everyone is worse → 100th percentile.
    let countWorse = 0;
    for (let i = n - 1; i >= 0; i--) {
      if (sorted[i] > value) countWorse++;
      else break;
    }
    // Use standard percentile rank: (number of values below / n) * 100, clamped
    // Binary search: find first index where sorted[i] >= value (i.e. not strictly better)
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    // lo = number of values strictly better (lower) than this athlete → athlete beats everyone above lo
    // percentile = (n - lo) / n * 100  (how many they beat or tie, including themselves)
    return Math.min(100, Math.round(((n - lo) / n) * 100));
  } else {
    // Count strictly below
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    // lo = number of values strictly below this athlete
    return Math.min(100, Math.round((lo / n) * 100));
  }
}

// ─── BENCHMARK BANDS ───────────────────────────────────────────────────────

export type BenchmarkBand = "excellent" | "aboveAvg" | "average" | "belowAvg" | "development";

export function getBenchmarkBand(percentile: number): BenchmarkBand {
  if (percentile >= 85) return "excellent";
  if (percentile >= 70) return "aboveAvg";
  if (percentile >= 40) return "average";
  if (percentile >= 20) return "belowAvg";
  return "development";
}

export const BENCHMARK_COLORS: Record<BenchmarkBand, string> = {
  excellent:  "#16A34A",
  aboveAvg:   "#2563EB",
  average:    "#D97706",
  belowAvg:   "#EA580C",
  development:"#DC2626",
};

// ─── COMPOSITE SCORE ───────────────────────────────────────────────────────

export const METRIC_WEIGHTS: Record<MetricKey, number> = {
  verticalJump:   0.25,
  broadJump:      0.20,
  sprint30m:      0.25,
  run800m:        0.25,
  shuttleRun:     0.05,
  footballThrow:  0.00,
};

export function calcCompositeScore(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): number {
  let totalWeight = 0;
  let weightedSum  = 0;

  for (const metric of METRIC_KEYS) {
    const value = athlete[metric] as number | undefined;
    const stats = cohortStats[metric];
    if (value == null || stats == null) continue;
    const lowerBetter  = LOWER_IS_BETTER.has(metric);
    const percentile   = calcPercentile(value, stats, lowerBetter);
    const w            = METRIC_WEIGHTS[metric];
    weightedSum        += percentile * w;
    totalWeight        += w;
  }

  if (totalWeight === 0) return 0;
  // Normalise by actual weights present (handles missing metrics gracefully)
  // Result is a 0–100 weighted average of percentile scores
  return Math.round(weightedSum / totalWeight);
}

// ─── NATIONAL COMPOSITE SCORE (vs SAI standards) ────────────────────────────

/**
 * Composite score calculated against SAI national benchmarks instead of 
 * local cohort — gives absolute positioning on the national scale.
 */
export function calcNationalCompositeScore(athlete: Athlete): number {
  const metrics: Array<[NationalBenchmarkMetric, boolean, number]> = [
    ["verticalJump", false, 0.25],
    ["broadJump",    false, 0.20],
    ["sprint30m",    true,  0.25],
    ["run800m",      true,  0.25],
    ["shuttleRun",   true,  0.05],
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [metric, lowerBetter, weight] of metrics) {
    const value = athlete[metric as MetricKey] as number | undefined;
    if (value == null || isNaN(value) || value <= 0) continue;
    const row = getNationalBenchmarkRow(athlete.gender, metric, athlete.age);
    if (!row) continue;
    const pct = calcNationalPercentile(value, row, lowerBetter);
    weightedSum  += pct * weight;
    totalWeight  += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

// ─── DERIVED PERFORMANCE INDICES ───────────────────────────────────────────

export interface DerivedIndices {
  /**
   * Relative Power Index (RPI)
   * Formula: (verticalJump_cm × body_mass_kg) / 1000
   * Represents absolute lower-body explosive power output.
   * Reference: Harman et al. (1990) — validated for school-age athletes.
   */
  relativePowerIndex: number | null;

  /**
   * Speed-Endurance Ratio (SER)
   * Formula: sprint30m_percentile / run800m_percentile
   * > 1.2 = speed-dominant; < 0.8 = endurance-dominant; ~1.0 = balanced
   * Useful for sport routing — sprinters vs distance runners.
   */
  speedEnduranceRatio: number | null;

  /**
   * Explosive-to-Structural Ratio (ESR)
   * Formula: verticalJump (cm) / height (cm) × 100
   * Normalizes explosive power to body size.
   * SAI threshold: Boys ≥ 30, Girls ≥ 26 for talent consideration.
   */
  explosiveStructuralRatio: number | null;

  /**
   * Aerobic Capacity Estimate (ACE)
   * Formula: Léger–Lambert adapted for 800m run time:
   * VO2max_est = (483 / run800m_min) + 3.5
   * Provides indicative aerobic fitness level.
   * NOTE: Estimated, not clinically validated.
   */
  aerobicCapacityEst: number | null;

  /**
   * Lean Power Score (LPS)
   * Formula: broadJump_cm / body_mass_kg
   * Normalizes horizontal power to body mass.
   * Higher = better relative horizontal power.
   */
  leanPowerScore: number | null;

  /**
   * Talent Trajectory Index (TTI)
   * If assessment history exists: compares composite score change 
   * over time normalized by months.
   * Score > 0 = improving; < 0 = declining; 0 = stable.
   */
  talentTrajectoryIndex: number | null;

  /** SAI national composite (0–100) for absolute national positioning */
  nationalComposite: number;

  /** Per-metric national percentiles */
  nationalPercentiles: Partial<Record<NationalBenchmarkMetric, number>>;

  /** Per-metric SAI bands */
  nationalBands: Partial<Record<NationalBenchmarkMetric, SAIBand>>;
}

export function calcDerivedIndices(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): DerivedIndices {
  const vj     = athlete.verticalJump;
  const bj     = athlete.broadJump;
  const s30    = athlete.sprint30m;
  const r800   = athlete.run800m;
  const height = athlete.height;
  const weight = athlete.weight;

  // Relative Power Index
  const relativePowerIndex = (vj != null && weight != null)
    ? parseFloat(((vj * weight) / 1000).toFixed(2))
    : null;

  // Speed-Endurance Ratio
  const speedPct    = s30  != null && cohortStats.sprint30m ? calcPercentile(s30,  cohortStats.sprint30m,  true) : null;
  const endurePct   = r800 != null && cohortStats.run800m   ? calcPercentile(r800, cohortStats.run800m,    true) : null;
  const speedEnduranceRatio = (speedPct != null && endurePct != null && endurePct > 0)
    ? parseFloat((speedPct / endurePct).toFixed(2))
    : null;

  // Explosive-Structural Ratio
  const explosiveStructuralRatio = (vj != null && height != null && height > 0)
    ? parseFloat(((vj / height) * 100).toFixed(1))
    : null;

  // Aerobic Capacity Estimate (VO2max proxy from 800m run)
  // Léger-Lambert adapted: VO2max ≈ (483 / run800m_minutes) + 3.5
  const aerobicCapacityEst = (r800 != null && r800 > 0)
    ? parseFloat(((483 / (r800 / 60)) + 3.5).toFixed(1))
    : null;

  // Lean Power Score
  const leanPowerScore = (bj != null && weight != null && weight > 0)
    ? parseFloat((bj / weight).toFixed(2))
    : null;

  // Talent Trajectory Index
  let talentTrajectoryIndex: number | null = null;
  const history = (athlete as Athlete & { assessmentHistory?: Array<{ date: string; compositeScore?: number }> }).assessmentHistory;
  if (history && history.length >= 2) {
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first  = sorted[0];
    const last   = sorted[sorted.length - 1];
    if (first.compositeScore != null && last.compositeScore != null && first.compositeScore > 0) {
      const monthsDiff = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24 * 30));
      talentTrajectoryIndex = parseFloat(((last.compositeScore - first.compositeScore) / monthsDiff).toFixed(2));
    }
  }

  // National percentiles vs SAI standards
  const nationalPercentiles: Partial<Record<NationalBenchmarkMetric, number>> = {};
  const nationalBands: Partial<Record<NationalBenchmarkMetric, SAIBand>> = {};
  const nationalMetrics: Array<[NationalBenchmarkMetric, MetricKey, boolean]> = [
    ["verticalJump", "verticalJump", false],
    ["broadJump",    "broadJump",    false],
    ["sprint30m",    "sprint30m",    true ],
    ["run800m",      "run800m",      true ],
    ["shuttleRun",   "shuttleRun",   true ],
  ];

  for (const [nm, mk, lowerBetter] of nationalMetrics) {
    const value = athlete[mk] as number | undefined;
    if (value == null || isNaN(value) || value <= 0) continue;
    const row = getNationalBenchmarkRow(athlete.gender, nm, athlete.age);
    if (!row) continue;
    const pct = calcNationalPercentile(value, row, lowerBetter);
    nationalPercentiles[nm] = pct;
    nationalBands[nm] = getSAIBand(pct);
  }

  const nationalComposite = calcNationalCompositeScore(athlete);

  return {
    relativePowerIndex,
    speedEnduranceRatio,
    explosiveStructuralRatio,
    aerobicCapacityEst,
    leanPowerScore,
    talentTrajectoryIndex,
    nationalComposite,
    nationalPercentiles,
    nationalBands,
  };
}

// ─── SPORT FIT ENGINE ──────────────────────────────────────────────────────

export interface SportFitResult {
  sport: SportConfig;
  matchScore: number; // 0–100
  dimensionScores: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    bodyComp: number;
  };
  explanation: string;
  confidence: number;
}

// Map metrics to sport dimensions
function calcDimensionScores(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): { speed: number; power: number; endurance: number; agility: number; bodyComp: number } {
  const getP = (metric: MetricKey) => {
    const v = athlete[metric] as number | undefined;
    const s = cohortStats[metric];
    if (v == null || s == null) return 50; // neutral
    return calcPercentile(v, s, LOWER_IS_BETTER.has(metric));
  };

  const speedP      = getP("sprint30m");
  const powerP      = Math.round((getP("verticalJump") + getP("broadJump")) / 2);
  const enduranceP  = getP("run800m");
  const agilityP    = cohortStats.shuttleRun ? getP("shuttleRun") : Math.round((speedP + powerP) / 2);

  // Body composition: penalise far from sport-optimal BMI range
  // Sports science consensus optimal BMI for youth athletes: 18–23 (gender-adjusted)
  const optBMI = athlete.gender === "M" ? 20.5 : 19.5;
  const bmiScore = athlete.bmi != null
    ? Math.max(0, Math.min(100, 100 - Math.abs(optBMI - athlete.bmi) * 6))
    : 50;

  return { speed: speedP, power: powerP, endurance: enduranceP, agility: agilityP, bodyComp: bmiScore };
}

export function calcSportFit(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): SportFitResult[] {
  const dims = calcDimensionScores(athlete, cohortStats);
  const completeness     = (athlete.completeness ?? 50) / 100;
  const confidencePenalty = 0.5 + 0.5 * completeness;

  return SPORTS_CONFIG.map((sport) => {
    const { traitWeights: w } = sport;
    const rawScore =
      dims.speed      * w.speed      +
      dims.power      * w.power      +
      dims.endurance  * w.endurance  +
      dims.agility    * w.agility    +
      dims.bodyComp   * w.bodyComp;

    const matchScore = Math.round(rawScore * 10) / 10; // one decimal — preserves ranking separation
    const confidence = Math.round(confidencePenalty * 100);

    return {
      sport,
      matchScore,
      dimensionScores: dims,
      explanation: sport.whyEn,
      confidence,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// ─── OUTLIER DETECTION ─────────────────────────────────────────────────────

export interface OutlierResult {
  athleteId: string;
  metric: MetricKey;
  value: number;
  zScore: number;
  direction: "high" | "low";
}

export function detectOutliers(
  athletes: Athlete[],
  cohortStats: Partial<Record<MetricKey, CohortStats>>,
  threshold = 3
): OutlierResult[] {
  const results: OutlierResult[] = [];
  for (const athlete of athletes) {
    for (const metric of METRIC_KEYS) {
      const value = athlete[metric] as number | undefined;
      const stats = cohortStats[metric];
      if (value == null || stats == null) continue;
      const z = calcZScore(value, stats);
      if (Math.abs(z) >= threshold) {
        results.push({
          athleteId: athlete.id,
          metric,
          value,
          zScore: parseFloat(z.toFixed(2)),
          direction: z > 0 ? "high" : "low",
        });
      }
    }
  }
  return results;
}

// ─── FULL ENRICHMENT ───────────────────────────────────────────────────────

export interface EnrichedAthlete extends Athlete {
  compositeScore: number;
  percentiles: Partial<Record<MetricKey, number>>;
  benchmarkBands: Partial<Record<MetricKey, BenchmarkBand>>;
  sportFit: SportFitResult[];
  topSport: string;
  topSportScore: number;
  isHighPotential: boolean;
  dimensionScores: { speed: number; power: number; endurance: number; agility: number; bodyComp: number };
  /** All SAI national comparison indices */
  derivedIndices: DerivedIndices;
}

// ─── COMPLETENESS SCORING ──────────────────────────────────────────────────

const COMPLETENESS_METRICS: MetricKey[] = ["verticalJump", "broadJump", "sprint30m", "run800m", "shuttleRun", "footballThrow"];

function calcCompleteness(athlete: Athlete): number {
  const present = COMPLETENESS_METRICS.filter((m) => {
    const v = athlete[m] as number | undefined;
    return v != null && isFinite(v) && v > 0;
  }).length;
  return Math.round((present / COMPLETENESS_METRICS.length) * 100);
}

// ─── FLAG DETECTION ─────────────────────────────────────────────────────────

function calcFlags(athlete: Athlete, cohortStats: Partial<Record<MetricKey, CohortStats>>): AthleteFlag[] {
  const flags: AthleteFlag[] = [];

  // BMI flags — using WHO/IAP (Indian Academy of Pediatrics) thresholds for youth
  if (athlete.bmi != null) {
    if (athlete.bmi < 14.5) flags.push({ type: "underweight", message: `BMI ${athlete.bmi} — severely underweight (IAP threshold)` });
    else if (athlete.bmi < 18.5) flags.push({ type: "underweight", message: `BMI ${athlete.bmi} — underweight` });
    else if (athlete.bmi > 27.5) flags.push({ type: "overweight", message: `BMI ${athlete.bmi} — overweight (adjusted for South Asian)` });
    // Note: WHO recommends BMI >23 as overweight for South Asians; for youth athletes we use 27.5
  }

  // Missing key metrics flag
  const missingMetrics = (["verticalJump", "sprint30m"] as MetricKey[]).filter((m) => {
    const v = athlete[m] as number | undefined;
    return v == null || !isFinite(v) || v <= 0;
  });
  if (missingMetrics.length > 0) {
    flags.push({ type: "missing", metric: missingMetrics[0], message: `Missing: ${missingMetrics.join(", ")}` });
  }

  // Outlier flags (z-score > 3)
  for (const metric of METRIC_KEYS) {
    const value = athlete[metric] as number | undefined;
    const stats = cohortStats[metric];
    if (value == null || stats == null) continue;
    const z = calcZScore(value, stats);
    if (Math.abs(z) >= 3) {
      flags.push({ type: "outlier", metric, message: `${metric} is a statistical outlier (z=${z.toFixed(1)})` });
    }
  }

  return flags;
}

export function enrichAthletes(athletes: Athlete[]): EnrichedAthlete[] {
  if (athletes.length === 0) return [];

  // Build cohort stats for all metrics
  const cohortStats: Partial<Record<MetricKey, CohortStats>> = {};
  for (const metric of [...METRIC_KEYS, "shuttleRun" as MetricKey, "footballThrow" as MetricKey]) {
    cohortStats[metric] = buildCohortStats(athletes, metric);
  }

  return athletes.map((athlete) => {
    const percentiles: Partial<Record<MetricKey, number>> = {};
    const benchmarkBands: Partial<Record<MetricKey, BenchmarkBand>> = {};

    for (const metric of METRIC_KEYS) {
      const value = athlete[metric] as number | undefined;
      const stats = cohortStats[metric];
      if (value != null && isFinite(value) && value > 0 && stats) {
        const p = calcPercentile(value, stats, LOWER_IS_BETTER.has(metric));
        percentiles[metric] = p;
        benchmarkBands[metric] = getBenchmarkBand(p);
      }
    }

    const completeness  = calcCompleteness(athlete);
    const flags         = calcFlags(athlete, cohortStats);
    const compositeScore = calcCompositeScore(athlete, cohortStats);
    const sportFit      = calcSportFit(athlete, cohortStats);
    const topSport      = sportFit[0]?.sport.nameEn ?? "—";
    const topSportScore = sportFit[0]?.matchScore ?? 0;
    const isHighPotential = compositeScore >= 70;
    const dimScores     = calcDimensionScores(athlete, cohortStats);
    const derivedIndices = calcDerivedIndices(athlete, cohortStats);

    return {
      ...athlete,
      completeness,
      flags,
      compositeScore,
      percentiles,
      benchmarkBands,
      sportFit,
      topSport,
      topSportScore,
      isHighPotential,
      dimensionScores: dimScores,
      derivedIndices,
    };
  });
}
