import { Athlete } from "../data/seedAthletes";
import { SPORTS_CONFIG, SportConfig } from "../data/sportsConfig";

// ─── Z-SCORE ENGINE ────────────────────────────────────────────────────────

export type MetricKey = "verticalJump" | "broadJump" | "sprint30m" | "run800m" | "shuttleRun" | "footballThrow";
export const METRIC_KEYS: MetricKey[] = ["verticalJump", "broadJump", "sprint30m", "run800m"];

// For sprint/run, lower is better — flag them
export const LOWER_IS_BETTER: Set<MetricKey> = new Set(["sprint30m", "run800m", "shuttleRun"]);

interface CohortStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  values: number[];
}

function calcStats(values: number[]): CohortStats {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 1, min: 0, max: 0, values };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1;
  return { mean, std, min: Math.min(...values), max: Math.max(...values), values };
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
  const sorted = [...stats.values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 50;
  const rank = sorted.filter((v) => (lowerIsBetter ? v > value : v < value)).length;
  return Math.round((rank / n) * 100);
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
  excellent: "#16A34A",
  aboveAvg: "#2563EB",
  average: "#D97706",
  belowAvg: "#EA580C",
  development: "#DC2626",
};

// ─── COMPOSITE SCORE ───────────────────────────────────────────────────────

export const METRIC_WEIGHTS: Record<MetricKey, number> = {
  verticalJump: 0.25,
  broadJump: 0.2,
  sprint30m: 0.25,
  run800m: 0.25,
  shuttleRun: 0.05,
  footballThrow: 0.0,
};

export function calcCompositeScore(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const metric of METRIC_KEYS) {
    const value = athlete[metric] as number | undefined;
    const stats = cohortStats[metric];
    if (value == null || stats == null) continue;
    const lowerBetter = LOWER_IS_BETTER.has(metric);
    const percentile = calcPercentile(value, stats, lowerBetter);
    const w = METRIC_WEIGHTS[metric];
    weightedSum += percentile * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
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

  const speedP = getP("sprint30m");
  const powerP = Math.round((getP("verticalJump") + getP("broadJump")) / 2);
  const enduranceP = getP("run800m");
  const agilityP = cohortStats.shuttleRun ? getP("shuttleRun") : Math.round((speedP + powerP) / 2);
  const bmiScore = athlete.bmi != null ? Math.max(0, Math.min(100, 100 - Math.abs(21 - athlete.bmi) * 5)) : 50;

  return { speed: speedP, power: powerP, endurance: enduranceP, agility: agilityP, bodyComp: bmiScore };
}

export function calcSportFit(
  athlete: Athlete,
  cohortStats: Partial<Record<MetricKey, CohortStats>>
): SportFitResult[] {
  const dims = calcDimensionScores(athlete, cohortStats);
  const completeness = (athlete.completeness ?? 50) / 100;
  const confidencePenalty = 0.5 + 0.5 * completeness;

  return SPORTS_CONFIG.map((sport) => {
    const { traitWeights: w } = sport;
    const rawScore =
      dims.speed * w.speed +
      dims.power * w.power +
      dims.endurance * w.endurance +
      dims.agility * w.agility +
      dims.bodyComp * w.bodyComp;

    const matchScore = Math.round(rawScore);
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
}

export function enrichAthletes(athletes: Athlete[]): EnrichedAthlete[] {
  // Build cohort stats for all
  const cohortStats: Partial<Record<MetricKey, CohortStats>> = {};
  for (const metric of [...METRIC_KEYS, "shuttleRun" as MetricKey]) {
    cohortStats[metric] = buildCohortStats(athletes, metric);
  }

  return athletes.map((athlete) => {
    const percentiles: Partial<Record<MetricKey, number>> = {};
    const benchmarkBands: Partial<Record<MetricKey, BenchmarkBand>> = {};

    for (const metric of METRIC_KEYS) {
      const value = athlete[metric] as number | undefined;
      const stats = cohortStats[metric];
      if (value != null && stats) {
        const p = calcPercentile(value, stats, LOWER_IS_BETTER.has(metric));
        percentiles[metric] = p;
        benchmarkBands[metric] = getBenchmarkBand(p);
      }
    }

    const compositeScore = calcCompositeScore(athlete, cohortStats);
    const sportFit = calcSportFit(athlete, cohortStats);
    const topSport = sportFit[0]?.sport.nameEn ?? "—";
    const topSportScore = sportFit[0]?.matchScore ?? 0;
    const isHighPotential = compositeScore >= 70;
    const dimScores = calcDimensionScores(athlete, cohortStats);

    return {
      ...athlete,
      compositeScore,
      percentiles,
      benchmarkBands,
      sportFit,
      topSport,
      topSportScore,
      isHighPotential,
      dimensionScores: dimScores,
    };
  });
}
