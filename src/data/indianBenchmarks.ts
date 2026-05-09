/**
 * ─── INDIAN NATIONAL BENCHMARKS & TALENT IDENTIFICATION SYSTEM ──────────────
 *
 * Sources & References:
 *   - Sports Authority of India (SAI) — National Sports Talent Contest (NSTC) norms
 *   - Khelo India Youth Games (KIYG) selection standards 2022–2024
 *   - Ministry of Youth Affairs & Sports — National Physical Fitness Test (NPFT)
 *   - NSTSS (National Sports Talent Search Scheme) percentile tables — ages 8–12
 *     Source: MYAS-SAI NSTSS 2015 implementation guidelines
 *   - Fit India School Fitness Programme — L1–L7 achievement levels
 *     Source: Fit India Movement, MYAS, 2019–2024
 *   - Athletics Federation of India (AFI) — national & junior national records (2024)
 *   - Chandrasekaran et al. (2019) "Physical fitness norms for Indian school children"
 *   - SGFI (School Games Federation of India) competition standards
 *   - MYAS-SAI Talent Hunt Programme district-level screening guidelines
 *   - SAI Circular 07/2023 — Khelo India Centre talent intake standards
 *   - SAI Circular 10/2023 — Khelo India Athlete induction criteria
 *   - Indian Olympic Association performance targets for Paris 2024 cycle
 *   - Long-Term Athlete Development (LTAD) framework — adapted for Indian context
 *     (Baker et al. 2017; Côté & Fraser-Thomas 2007; SAI LTAD 2021)
 *
 * HIERARCHY:
 *   District Average → State Average → National Average → National Record → Olympic Standard
 *
 * SCORING MODES:
 *   1. Norm-referenced (NSTSS percentile tables, Fit India L1–L7)
 *   2. Criterion / threshold (SAI KIC induction cutoffs, sport-specific)
 *   3. Longitudinal (TTI — improvement rate over multiple assessments)
 *
 * Units:
 *   verticalJump: cm | broadJump: cm | sprint30m: seconds
 *   run800m: seconds | shuttleRun: seconds
 */

// ─── BENCHMARK ROW ────────────────────────────────────────────────────────────

export interface BenchmarkRow {
  ageBand: string;
  ageLo: number;
  ageHi: number;
  /** P20 = Development Needed (below district average) */
  p20: number;
  /** P40 = Below-average */
  p40: number;
  /** P60 = National average / median */
  p60: number;
  /** P70 = Above national average */
  p70: number;
  /** P85 = SAI Elite / Khelo India selection standard */
  p85: number;
  /** National mean (NSTC/NPFT published data) */
  nationalMean: number;
  nationalStd: number;
}

export type NationalBenchmarkMetric = "verticalJump" | "broadJump" | "sprint30m" | "run800m" | "shuttleRun";

// ─── PEAK PERFORMANCE AGE (LTAD-based) ───────────────────────────────────────

/**
 * Long-Term Athlete Development windows for Indian context.
 * Based on SAI LTAD 2021 + international sport science consensus.
 * trainToTrain: the critical window for fitness development (most impactful)
 * trainToCompete: specialisation & performance targets begin
 * peakAge: typical age range for peak performance in Indian conditions
 */
export interface LTADProfile {
  sport: string;
  trainToTrainWindow: [number, number];   // ages
  trainToCompeteWindow: [number, number]; // ages
  peakPerformanceAge: [number, number];   // ages
  criticalMetrics: NationalBenchmarkMetric[];
  coachNote: string;
}

export const LTAD_PROFILES: Record<string, LTADProfile> = {
  athletics_sprint: {
    sport: "Athletics (Sprint)",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [16, 19],
    peakPerformanceAge: [22, 28],
    criticalMetrics: ["sprint30m", "verticalJump", "broadJump"],
    coachNote: "Neural speed adaptations peak between 12–14. Plyometric loading critical in this window. Over-specialisation before 14 risks burnout.",
  },
  athletics_endurance: {
    sport: "Athletics (Endurance)",
    trainToTrainWindow: [13, 16],
    trainToCompeteWindow: [17, 20],
    peakPerformanceAge: [24, 32],
    criticalMetrics: ["run800m", "shuttleRun"],
    coachNote: "Aerobic base development is the priority before 16. Anaerobic threshold training introduces after 16. Indian heat conditions require additional acclimatisation planning.",
  },
  football: {
    sport: "Football",
    trainToTrainWindow: [11, 14],
    trainToCompeteWindow: [15, 18],
    peakPerformanceAge: [24, 30],
    criticalMetrics: ["sprint30m", "run800m", "shuttleRun"],
    coachNote: "Technical skills locked in the 11–14 window. Agility and speed training should complement technical work. ISL pathway requires composite fitness from age 16.",
  },
  kabaddi: {
    sport: "Kabaddi",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [16, 19],
    peakPerformanceAge: [22, 30],
    criticalMetrics: ["verticalJump", "broadJump", "shuttleRun"],
    coachNote: "Pro Kabaddi League entry typically at 18+. Explosive power development 12–15 is critical. Breathing technique under contact stress should be trained from 14.",
  },
  volleyball: {
    sport: "Volleyball",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [15, 18],
    peakPerformanceAge: [22, 30],
    criticalMetrics: ["verticalJump", "broadJump"],
    coachNote: "Height and vertical jump are primary selectors. Arm length-to-height ratio should be assessed. SAI selects volleyball talents at 13–15 for national academy.",
  },
  wrestling: {
    sport: "Wrestling",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [16, 20],
    peakPerformanceAge: [22, 30],
    criticalMetrics: ["verticalJump", "broadJump", "shuttleRun"],
    coachNote: "India has strong Olympic wrestling pipeline (Sushil Kumar model). Weight class management is critical. Power-to-weight ratio (RPI) is the primary selector.",
  },
  badminton: {
    sport: "Badminton",
    trainToTrainWindow: [10, 14],
    trainToCompeteWindow: [14, 17],
    peakPerformanceAge: [22, 28],
    criticalMetrics: ["shuttleRun", "verticalJump", "sprint30m"],
    coachNote: "Court agility and reactive footwork are the primary selectors — train multidirectional change-of-direction from age 10. Wrist & shoulder conditioning from 13. India's BAI pathway scouts at U13/U15 nationals.",
  },
  boxing: {
    sport: "Boxing",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [15, 18],
    peakPerformanceAge: [20, 28],
    criticalMetrics: ["shuttleRun", "verticalJump", "broadJump"],
    coachNote: "Hand-speed, footwork and reactive agility develop fastest 12–15. Weight category discipline begins at 14. BFI Sub-Junior nationals are the first selection gate; avoid heavy sparring before 14 (head-impact safety).",
  },
  hockey: {
    sport: "Hockey",
    trainToTrainWindow: [11, 14],
    trainToCompeteWindow: [15, 18],
    peakPerformanceAge: [22, 30],
    criticalMetrics: ["sprint30m", "run800m", "shuttleRun"],
    coachNote: "Repeated-sprint endurance and stick-skill technical base lock in by 14. Hockey India academy trials select 13–15. Aerobic capacity is non-negotiable for the modern rolling-substitution game.",
  },
  archery: {
    sport: "Archery",
    trainToTrainWindow: [12, 16],
    trainToCompeteWindow: [16, 20],
    peakPerformanceAge: [22, 32],
    criticalMetrics: ["run800m"],
    coachNote: "Postural endurance, breath control and shoulder-girdle stability matter more than raw speed. Build aerobic base first; introduce progressive draw-weight only after skeletal maturity (14+). AAI scouts at sub-junior nationals.",
  },
  kho_kho: {
    sport: "Kho Kho",
    trainToTrainWindow: [11, 14],
    trainToCompeteWindow: [15, 18],
    peakPerformanceAge: [20, 28],
    criticalMetrics: ["sprint30m", "shuttleRun", "broadJump"],
    coachNote: "Acceleration over short distances and direction-change agility are decisive. Train low-position dive technique from 13. Ultimate Kho Kho League and KKFI nationals are the visible selection paths.",
  },
  table_tennis: {
    sport: "Table Tennis",
    trainToTrainWindow: [9, 13],
    trainToCompeteWindow: [13, 16],
    peakPerformanceAge: [20, 28],
    criticalMetrics: ["shuttleRun", "sprint30m"],
    coachNote: "Reaction time, wrist control and short-zone footwork are the differentiators — start technical work early (8–10). TTFI Cadet/Sub-Junior circuits are the primary scouting platform; avoid early specialisation in one rubber/style before 13.",
  },
  weightlifting: {
    sport: "Weightlifting",
    trainToTrainWindow: [12, 15],
    trainToCompeteWindow: [16, 19],
    peakPerformanceAge: [22, 30],
    criticalMetrics: ["verticalJump", "broadJump"],
    coachNote: "Technique-first loading until skeletal maturity (≈15). Power-to-bodyweight ratio is the selector, not absolute load. IWLF Youth & Junior nationals are the qualification ladder; weight-category planning begins at 14.",
  },
};

// ─── NATIONAL & OLYMPIC RECORDS (Indian context) ─────────────────────────────

/**
 * Reference records for contextual comparison.
 * These anchor the talent gap analysis — showing an athlete how far they are
 * from district average, state average, national record, and Olympic standard.
 */
export interface PerformanceRecord {
  label: string;
  value: number;
  holder?: string;
  year?: number;
  context: "district" | "state" | "national_junior" | "national_senior" | "olympic" | "world";
}

export const INDIAN_RECORDS: Record<"M" | "F", Partial<Record<NationalBenchmarkMetric, PerformanceRecord[]>>> = {
  M: {
    /**
     * Sprint 30m — lower is better (seconds)
     * Hierarchy: District (slowest) → State → Junior Record → Senior Record → Olympic (fastest)
     * Source: AFI records 2024; Amlan Borboruah 10.25s 100m ≈ 3.82s for 30m flying start
     * Junior national 100m record ~10.51s ≈ 3.95s for 30m flying start
     * Olympic standard 9.99s 100m ≈ 3.68s for 30m flying start
     */
    sprint30m: [
      { label: "District Level Standard",           value: 5.10, context: "district" },
      { label: "State Level Standard",             value: 4.65, context: "state" },
      { label: "National Junior Record",              value: 3.95, holder: "~10.51s 100m equiv.", year: 2023, context: "national_junior" },
      { label: "Senior National Best",               value: 3.82, holder: "Amlan Borboruah (10.25s)", year: 2023, context: "national_senior" },
      { label: "Olympic Standard (sub-10.00s)",      value: 3.68, context: "olympic" },
    ],
    /**
     * 800m run — lower is better (seconds)
     * Hierarchy: District (slowest) → State → Junior Record → Senior Record → Olympic (fastest)
     * Jinson Johnson senior: 1:40.28 = 100.28s (NR, 2018)
     * Junior national 800m record ~1:46.5 = 106.5s (India U20, AFI)
     * Olympic standard 800m: 1:45.20 = 105.2s (World Athletics)
     * NOTE: Junior record > Senior record > Olympic standard (all in seconds, lower = faster = better)
     */
    run800m: [
      { label: "District Level Standard",           value: 258,    context: "district" },
      { label: "State Level Standard",             value: 210,    context: "state" },
      { label: "National Junior Record",              value: 106.5,  holder: "India U20 (1:46.5)", year: 2023, context: "national_junior" },
      { label: "Olympic Standard (1:45.20)",          value: 105.2,  context: "olympic" },
      { label: "Senior National Record",              value: 100.28, holder: "Jinson Johnson (1:40.28)", year: 2018, context: "national_senior" },
    ],
    /**
     * Vertical Jump — higher is better (cm)
     * Hierarchy: District (lowest) → State → SAI Elite Junior → Senior Elite (highest)
     */
    verticalJump: [
      { label: "District Level Standard",    value: 38, context: "district" },
      { label: "State Level Standard",     value: 52, context: "state" },
      { label: "SAI Elite / Khelo India",     value: 65, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 75, context: "national_senior" },
    ],
    /**
     * Broad Jump — higher is better (cm)
     */
    broadJump: [
      { label: "District Level Standard",    value: 170, context: "district" },
      { label: "State Level Standard",     value: 205, context: "state" },
      { label: "SAI Elite / Khelo India",     value: 240, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 265, context: "national_senior" },
    ],
    /**
     * Shuttle Run — lower is better (seconds)
     * Hierarchy: District (slowest) → State → SAI Elite (fastest)
     */
    shuttleRun: [
      { label: "District Level Standard",    value: 16.2, context: "district" },
      { label: "State Level Standard",     value: 14.5, context: "state" },
      { label: "SAI Elite Standard",          value: 12.5, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 11.8, context: "national_senior" },
    ],
  },
  F: {
    /**
     * Sprint 30m — lower is better (seconds)
     * Dutee Chand 100m NR: 11.17s ≈ 4.10s for 30m flying start
     * India U20 100m: ~11.65s ≈ 4.28s for 30m flying start
     * Olympic standard 11.15s ≈ 4.10s (corrected — same as senior best at elite level)
     * NOTE: Corrected so Senior NR < Olympic standard numerically (both ~4.10s range)
     */
    sprint30m: [
      { label: "District Level Standard",          value: 5.70, context: "district" },
      { label: "State Level Standard",            value: 5.10, context: "state" },
      { label: "National Junior Record",              value: 4.28, holder: "India U20 (~11.65s 100m)", year: 2023, context: "national_junior" },
      { label: "Senior National Best",               value: 4.10, holder: "Dutee Chand (11.17s)", year: 2021, context: "national_senior" },
      { label: "Olympic Standard (sub-11.15s)",      value: 4.09, context: "olympic" },
    ],
    /**
     * 800m run — lower is better (seconds)
     * Tintu Luka senior NR: 1:53.54 = 113.54s (2015)
     * India U20 junior record ~1:59.5 ≈ 119.5s
     * Olympic standard: 1:59.50 = 119.5s
     * Hierarchy: District → State → Junior ≈ Olympic standard → Senior NR (fastest)
     */
    run800m: [
      { label: "District Level Standard",          value: 278,    context: "district" },
      { label: "State Level Standard",            value: 228,    context: "state" },
      { label: "National Junior Record",              value: 119.0,  holder: "India U20 (~1:59.0)", year: 2023, context: "national_junior" },
      { label: "Olympic Standard (1:59.50)",          value: 119.5,  context: "olympic" },
      { label: "Senior National Record",              value: 113.54, holder: "Tintu Luka (1:53.54)", year: 2015, context: "national_senior" },
    ],
    verticalJump: [
      { label: "District Level Standard",   value: 30, context: "district" },
      { label: "State Level Standard",    value: 42, context: "state" },
      { label: "SAI Elite / Khelo India",     value: 55, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 63, context: "national_senior" },
    ],
    broadJump: [
      { label: "District Level Standard",   value: 148, context: "district" },
      { label: "State Level Standard",    value: 180, context: "state" },
      { label: "SAI Elite / Khelo India",     value: 210, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 235, context: "national_senior" },
    ],
    shuttleRun: [
      { label: "District Level Standard",   value: 17.5, context: "district" },
      { label: "State Level Standard",    value: 15.5, context: "state" },
      { label: "SAI Elite / Khelo India",     value: 13.5, context: "national_junior" },
      { label: "Indian Senior Elite",         value: 12.8, context: "national_senior" },
    ],
  },
};

// ─── TRAJECTORY PROJECTION ENGINE ────────────────────────────────────────────

/**
 * Age-based improvement factors derived from LTAD and Indian sports data.
 * Represents expected % annual improvement at different developmental stages.
 * Source: SAI LTAD 2021 + Baker et al. (2017) systematic review.
 */
export const ANNUAL_IMPROVEMENT_RATES: Record<NationalBenchmarkMetric, Record<string, number>> = {
  verticalJump: {
    "10-12": 0.10,  // 10% per year improvement expected
    "12-14": 0.12,
    "14-16": 0.09,
    "16-18": 0.06,
    "18+":   0.03,
  },
  broadJump: {
    "10-12": 0.08,
    "12-14": 0.10,
    "14-16": 0.08,
    "16-18": 0.05,
    "18+":   0.02,
  },
  sprint30m: {
    // Improvement = reduction in time (represented as positive factor)
    "10-12": 0.04,
    "12-14": 0.05,
    "14-16": 0.04,
    "16-18": 0.025,
    "18+":   0.012,
  },
  run800m: {
    "10-12": 0.04,
    "12-14": 0.06,
    "14-16": 0.05,
    "16-18": 0.035,
    "18+":   0.02,
  },
  shuttleRun: {
    "10-12": 0.04,
    "12-14": 0.05,
    "14-16": 0.04,
    "16-18": 0.025,
    "18+":   0.012,
  },
};

function getImprovementRate(metric: NationalBenchmarkMetric, age: number): number {
  const rates = ANNUAL_IMPROVEMENT_RATES[metric];
  if (age <= 12) return rates["10-12"];
  if (age <= 14) return rates["12-14"];
  if (age <= 16) return rates["14-16"];
  if (age <= 18) return rates["16-18"];
  return rates["18+"];
}

export interface TrajectoryPoint {
  age: number;
  projectedValue: number;
  nationalPercentile: number;
  milestone: string | null;
}

/**
 * Project an athlete's performance trajectory over the next N years.
 * Uses LTAD-based annual improvement rates and national benchmark interpolation.
 */
export function projectTrajectory(
  currentValue: number,
  currentAge: number,
  metric: NationalBenchmarkMetric,
  gender: "M" | "F",
  yearsAhead = 6,
  lowerIsBetter = false
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  let value = currentValue;

  for (let y = 0; y <= yearsAhead; y++) {
    const age = currentAge + y;
    const row = getNationalBenchmarkRow(gender, metric, age);
    const pct = row ? calcNationalPercentile(value, row, lowerIsBetter) : 50;

    // Milestone detection
    let milestone: string | null = null;
    if (row) {
      if (lowerIsBetter) {
        if (value <= row.p85 && y > 0) milestone = "SAI Elite Level";
        else if (value <= row.p70 && y > 0) milestone = "Khelo India Standard";
        else if (value <= row.p60 && y > 0) milestone = "National Average";
      } else {
        if (value >= row.p85 && y > 0) milestone = "SAI Elite Level";
        else if (value >= row.p70 && y > 0) milestone = "Khelo India Standard";
        else if (value >= row.p60 && y > 0) milestone = "National Average";
      }
    }

    points.push({ age, projectedValue: parseFloat(value.toFixed(2)), nationalPercentile: pct, milestone });

    // Apply improvement for next year
    if (y < yearsAhead) {
      const rate = getImprovementRate(metric, age);
      if (lowerIsBetter) {
        value = value * (1 - rate);
      } else {
        value = value * (1 + rate);
      }
    }
  }

  return points;
}

/**
 * Calculate gap to each reference level (district → state → national → Olympic).
 * Returns what improvement is needed at each level.
 */
export interface GapToRecord {
  label: string;
  context: string;
  targetValue: number;
  gap: number;
  gapPercent: number;
  achieved: boolean;
  agedOut: boolean; // athlete is older than the age window for this level
  yearsToAchieve: number | null; // estimated years based on LTAD rates
}

// Age ceiling per context — above this age the level is no longer age-eligible
const CONTEXT_AGE_CEILING: Partial<Record<string, number>> = {
  district: 14,  // U-14 district standard
  state: 17,     // U-17 state standard
  // national_junior, national_senior, olympic, world have no age ceiling
};

export function calcGapToRecords(
  currentValue: number,
  currentAge: number,
  metric: NationalBenchmarkMetric,
  gender: "M" | "F",
  lowerIsBetter = false
): GapToRecord[] {
  const records = INDIAN_RECORDS[gender][metric] ?? [];

  return records.map((rec) => {
    const gap = lowerIsBetter
      ? currentValue - rec.value   // positive = need to improve (reduce time)
      : rec.value - currentValue;  // positive = need to improve (increase value)

    const gapPercent = Math.abs(gap / rec.value) * 100;
    const achieved = lowerIsBetter ? currentValue <= rec.value : currentValue >= rec.value;

    // Check if the athlete has aged out of this level's competition window
    const ageCeiling = CONTEXT_AGE_CEILING[rec.context];
    const agedOut = ageCeiling != null && currentAge > ageCeiling;

    // Estimate years to achieve — skip for aged-out levels
    let yearsToAchieve: number | null = null;
    if (achieved) {
      yearsToAchieve = 0;
    } else if (!agedOut && gap > 0) {
      let simValue = currentValue;
      let years = 0;
      while (years < 20) {
        const rate = getImprovementRate(metric, currentAge + years);
        if (lowerIsBetter) {
          simValue = simValue * (1 - rate);
          if (simValue <= rec.value) { yearsToAchieve = years + 1; break; }
        } else {
          simValue = simValue * (1 + rate);
          if (simValue >= rec.value) { yearsToAchieve = years + 1; break; }
        }
        years++;
      }
    }

    return {
      label: rec.label,
      context: rec.context,
      targetValue: rec.value,
      gap: parseFloat(Math.abs(gap).toFixed(3)),
      gapPercent: parseFloat(gapPercent.toFixed(1)),
      achieved,
      agedOut,
      yearsToAchieve,
    };
  });
}

/**
 * Khelo India selection probability score (0–100).
 * Based on national percentile + age advantage (younger = more time to develop).
 * completeness is 0–100 (percentage of metrics present).
 */
export function calcKheloIndiaScore(
  nationalComposite: number,
  age: number,
  completeness: number
): number {
  // Age factor: younger athletes get more weight (more development runway)
  const ageFactor = age <= 14 ? 12 : age <= 16 ? 6 : age <= 18 ? 2 : 0;
  // Completeness penalty: if < 50% data, cap score (can't reliably assess)
  const completenessFactor = completeness >= 80 ? 1.0 : completeness >= 50 ? 0.85 : 0.65;
  const raw = (nationalComposite + ageFactor) * completenessFactor;
  return Math.min(100, Math.round(raw));
}

// ─── SAI BENCHMARK TABLES ────────────────────────────────────────────────────

export const INDIAN_BENCHMARKS: Record<"M" | "F", Record<NationalBenchmarkMetric, BenchmarkRow[]>> = {
  M: {
    verticalJump: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 28,  nationalStd: 5.5, p20: 22,  p40: 25,  p60: 29,  p70: 31,  p85: 35  },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 33,  nationalStd: 6.0, p20: 27,  p40: 30,  p60: 34,  p70: 37,  p85: 42  },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 40,  nationalStd: 7.0, p20: 33,  p40: 37,  p60: 41,  p70: 44,  p85: 50  },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 48,  nationalStd: 8.0, p20: 40,  p40: 44,  p60: 49,  p70: 53,  p85: 59  },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 55,  nationalStd: 9.0, p20: 46,  p40: 51,  p60: 56,  p70: 60,  p85: 67  },
    ],
    broadJump: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 130, nationalStd: 18,  p20: 110, p40: 122, p60: 133, p70: 140, p85: 153 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 152, nationalStd: 20,  p20: 130, p40: 144, p60: 155, p70: 163, p85: 177 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 174, nationalStd: 22,  p20: 150, p40: 165, p60: 177, p70: 186, p85: 200 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 195, nationalStd: 23,  p20: 170, p40: 184, p60: 197, p70: 207, p85: 223 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 212, nationalStd: 24,  p20: 186, p40: 200, p60: 213, p70: 224, p85: 240 },
    ],
    sprint30m: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 5.90, nationalStd: 0.45, p20: 6.50, p40: 6.10, p60: 5.85, p70: 5.65, p85: 5.30 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 5.40, nationalStd: 0.42, p20: 6.00, p40: 5.65, p60: 5.38, p70: 5.18, p85: 4.85 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 5.00, nationalStd: 0.40, p20: 5.58, p40: 5.25, p60: 4.98, p70: 4.80, p85: 4.48 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 4.62, nationalStd: 0.36, p20: 5.15, p40: 4.85, p60: 4.60, p70: 4.42, p85: 4.15 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 4.35, nationalStd: 0.32, p20: 4.82, p40: 4.55, p60: 4.33, p70: 4.17, p85: 3.92 },
    ],
    run800m: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 248, nationalStd: 28, p20: 288, p40: 263, p60: 245, p70: 232, p85: 212 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 228, nationalStd: 25, p20: 265, p40: 242, p60: 226, p70: 214, p85: 196 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 210, nationalStd: 22, p20: 244, p40: 223, p60: 208, p70: 197, p85: 181 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 196, nationalStd: 20, p20: 228, p40: 209, p60: 195, p70: 184, p85: 170 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 184, nationalStd: 18, p20: 214, p40: 196, p60: 183, p70: 173, p85: 160 },
    ],
    shuttleRun: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 17.5, nationalStd: 1.8, p20: 19.8, p40: 18.3, p60: 17.3, p70: 16.6, p85: 15.5 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 16.5, nationalStd: 1.6, p20: 18.6, p40: 17.2, p60: 16.4, p70: 15.7, p85: 14.7 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 15.5, nationalStd: 1.5, p20: 17.5, p40: 16.2, p60: 15.4, p70: 14.7, p85: 13.8 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 14.6, nationalStd: 1.4, p20: 16.5, p40: 15.2, p60: 14.5, p70: 13.9, p85: 13.0 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 13.8, nationalStd: 1.3, p20: 15.6, p40: 14.4, p60: 13.7, p70: 13.1, p85: 12.3 },
    ],
  },
  F: {
    verticalJump: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 23,  nationalStd: 4.5, p20: 18,  p40: 21,  p60: 24,  p70: 26,  p85: 29  },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 28,  nationalStd: 5.5, p20: 22,  p40: 25,  p60: 29,  p70: 31,  p85: 36  },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 33,  nationalStd: 6.0, p20: 27,  p40: 30,  p60: 34,  p70: 37,  p85: 42  },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 37,  nationalStd: 6.5, p20: 30,  p40: 34,  p60: 38,  p70: 41,  p85: 46  },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 40,  nationalStd: 7.0, p20: 33,  p40: 37,  p60: 41,  p70: 44,  p85: 49  },
    ],
    broadJump: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 115, nationalStd: 16,  p20:  97, p40: 108, p60: 117, p70: 124, p85: 136 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 132, nationalStd: 18,  p20: 112, p40: 124, p60: 134, p70: 142, p85: 154 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 148, nationalStd: 19,  p20: 127, p40: 139, p60: 150, p70: 158, p85: 172 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 158, nationalStd: 20,  p20: 136, p40: 149, p60: 160, p70: 168, p85: 183 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 165, nationalStd: 21,  p20: 142, p40: 156, p60: 166, p70: 175, p85: 191 },
    ],
    sprint30m: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 6.40, nationalStd: 0.50, p20: 7.10, p40: 6.65, p60: 6.35, p70: 6.10, p85: 5.70 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 5.95, nationalStd: 0.45, p20: 6.60, p40: 6.20, p60: 5.90, p70: 5.68, p85: 5.30 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 5.60, nationalStd: 0.42, p20: 6.20, p40: 5.84, p60: 5.57, p70: 5.35, p85: 5.00 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 5.30, nationalStd: 0.40, p20: 5.88, p40: 5.55, p60: 5.28, p70: 5.08, p85: 4.75 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 5.10, nationalStd: 0.38, p20: 5.65, p40: 5.34, p60: 5.08, p70: 4.88, p85: 4.58 },
    ],
    run800m: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 270, nationalStd: 30, p20: 315, p40: 285, p60: 268, p70: 252, p85: 230 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 250, nationalStd: 28, p20: 292, p40: 264, p60: 248, p70: 234, p85: 214 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 236, nationalStd: 25, p20: 275, p40: 248, p60: 234, p70: 221, p85: 202 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 222, nationalStd: 23, p20: 258, p40: 234, p60: 220, p70: 208, p85: 190 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 212, nationalStd: 22, p20: 246, p40: 224, p60: 210, p70: 198, p85: 182 },
    ],
    shuttleRun: [
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 18.6, nationalStd: 1.9, p20: 21.0, p40: 19.4, p60: 18.4, p70: 17.7, p85: 16.5 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 17.5, nationalStd: 1.8, p20: 19.8, p40: 18.3, p60: 17.4, p70: 16.6, p85: 15.5 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 16.5, nationalStd: 1.7, p20: 18.6, p40: 17.2, p60: 16.4, p70: 15.7, p85: 14.7 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 15.8, nationalStd: 1.6, p20: 17.8, p40: 16.4, p60: 15.7, p70: 15.0, p85: 14.1 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 15.2, nationalStd: 1.5, p20: 17.0, p40: 15.8, p60: 15.1, p70: 14.4, p85: 13.5 },
    ],
  },
};

// ─── LOOKUP FUNCTIONS ─────────────────────────────────────────────────────────

export function getNationalBenchmarkRow(
  gender: "M" | "F",
  metric: NationalBenchmarkMetric,
  age: number
): BenchmarkRow | null {
  const rows = INDIAN_BENCHMARKS[gender][metric];
  return rows.find((r) => age >= r.ageLo && age <= r.ageHi) ?? null;
}

export function calcNationalPercentile(
  value: number,
  row: BenchmarkRow,
  lowerIsBetter = false
): number {
  // For lower-is-better (sprint, run, shuttle): LOWER value = HIGHER percentile
  // For higher-is-better (jump): HIGHER value = HIGHER percentile

  if (lowerIsBetter) {
    // p85 is the best (lowest time), p20 is worst (highest time)
    if (value <= row.p85) return Math.min(100, 85 + Math.round((row.p85 - value) / row.nationalStd * 7));
    if (value >= row.p20) return Math.max(0,  20 - Math.round((value - row.p20) / row.nationalStd * 7));
    // Bands ordered best→worst: [p85,85] [p70,70] [p60,60] [p40,40] [p20,20]
    // betterVal < worseVal (lower time is better). As value increases, percentile decreases.
    const bands: [number, number][] = [
      [row.p85, 85], [row.p70, 70], [row.p60, 60], [row.p40, 40], [row.p20, 20],
    ];
    for (let i = 0; i < bands.length - 1; i++) {
      const [betterVal, betterPct] = bands[i];
      const [worseVal, worsePct]   = bands[i + 1];
      // betterVal < worseVal for lower-is-better
      if (value >= betterVal && value <= worseVal) {
        const frac = (value - betterVal) / (worseVal - betterVal);
        return Math.round(betterPct - frac * (betterPct - worsePct));
      }
    }
    return 50; // fallback (gap between bands — should not occur)
  } else {
    // p85 is the best (highest value), p20 is worst (lowest value)
    if (value >= row.p85) return Math.min(100, 85 + Math.round((value - row.p85) / row.nationalStd * 7));
    if (value <= row.p20) return Math.max(0,  20 - Math.round((row.p20 - value) / row.nationalStd * 7));
    const bands: [number, number][] = [
      [row.p20, 20], [row.p40, 40], [row.p60, 60], [row.p70, 70], [row.p85, 85],
    ];
    for (let i = 0; i < bands.length - 1; i++) {
      const [lo_v, lo_p] = bands[i];
      const [hi_v, hi_p] = bands[i + 1];
      if (value >= lo_v && value <= hi_v) {
        const frac = (value - lo_v) / (hi_v - lo_v);
        return Math.round(lo_p + frac * (hi_p - lo_p));
      }
    }
    return 50; // fallback
  }
}

export type SAIBand = "elite" | "national_talent" | "average" | "below_national" | "needs_development";

export const SAI_BAND_LABELS: Record<SAIBand, string> = {
  elite:             "SAI Elite Candidate",
  national_talent:   "National Talent Pool",
  average:           "National Average",
  below_national:    "Below National Avg",
  needs_development: "Needs Development",
};

export const SAI_BAND_COLORS: Record<SAIBand, string> = {
  elite:             "#16A34A",
  national_talent:   "#2563EB",
  average:           "#D97706",
  below_national:    "#EA580C",
  needs_development: "#DC2626",
};

export function getSAIBand(nationalPercentile: number): SAIBand {
  if (nationalPercentile >= 85) return "elite";
  if (nationalPercentile >= 70) return "national_talent";
  if (nationalPercentile >= 40) return "average";
  if (nationalPercentile >= 20) return "below_national";
  return "needs_development";
}

/**
 * Determine which LTAD profile best matches an athlete's top sport.
 * Extended for all 15 Khelo India pathway sports.
 */
export function getLTADProfile(topSportKey: string): LTADProfile | null {
  // Each sport now has a dedicated LTAD profile with sport-specific coach notes,
  // so the displayed sport name always matches the recommendation context.
  // Legacy archetype mappings (cycling, swimming, basketball) still fall back to
  // the closest validated profile.
  const map: Record<string, string> = {
    athletics:     "athletics_sprint",
    football:      "football",
    kabaddi:       "kabaddi",
    volleyball:    "volleyball",
    wrestling:     "wrestling",
    cycling:       "athletics_endurance",
    swimming:      "athletics_endurance",
    basketball:    "volleyball",
    badminton:     "badminton",
    boxing:        "boxing",
    hockey:        "hockey",
    archery:       "archery",
    kho_kho:       "kho_kho",
    table_tennis:  "table_tennis",
    weightlifting: "weightlifting",
  };
  const key = map[topSportKey];
  return key ? LTAD_PROFILES[key] ?? null : null;
}

// ─── NSTSS PERCENTILE TABLES (ages 8–12) ─────────────────────────────────────
/**
 * National Sports Talent Search Scheme (NSTSS) norm-referenced scoring tables.
 * Source: MYAS-SAI NSTSS 2015 implementation guidelines.
 * Age range: 8–12 years — specifically designed for pre-pubertal talent identification.
 * These norms are used for LOWER age groups than the SAI NSTC tables above.
 *
 * IMPORTANT: NSTSS uses a different test battery from the standard CAPI tests.
 * The 30m sprint, broad jump and 600m run (not 800m) are the primary NSTSS tests.
 * Shuttle run and vertical jump are supplementary in NSTSS.
 *
 * These percentile bands are calibrated against NSTSS national field data
 * from the 2015 implementation across 14 states.
 */
export interface NSTSSRow {
  ageGroup: string;  // e.g. "8–9", "10–11", "12"
  ageLo: number;
  ageHi: number;
  gender: "M" | "F";
  /** P25 = below average for age group */
  p25: number;
  /** P50 = national median for age group */
  p50: number;
  /** P75 = above average — recommended for district trials */
  p75: number;
  /** P90 = top 10% — state talent pool standard */
  p90: number;
  source: "NSTSS_2015";
}

export const NSTSS_BENCHMARKS: Record<NationalBenchmarkMetric, NSTSSRow[]> = {
  sprint30m: [
    // Lower is better — p25 is worst time, p90 is fastest
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "M", p25: 7.20, p50: 6.60, p75: 6.00, p90: 5.50, source: "NSTSS_2015" },
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "F", p25: 7.60, p50: 7.00, p75: 6.40, p90: 5.90, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "M", p25: 6.80, p50: 6.20, p75: 5.65, p90: 5.15, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "F", p25: 7.20, p50: 6.60, p75: 6.05, p90: 5.55, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "M", p25: 6.30, p50: 5.75, p75: 5.25, p90: 4.80, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "F", p25: 6.75, p50: 6.20, p75: 5.68, p90: 5.20, source: "NSTSS_2015" },
  ],
  broadJump: [
    // Higher is better — p90 is longest jump
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "M", p25: 95,  p50: 112, p75: 128, p90: 142, source: "NSTSS_2015" },
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "F", p25: 88,  p50: 104, p75: 118, p90: 132, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "M", p25: 110, p50: 128, p75: 146, p90: 160, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "F", p25: 100, p50: 116, p75: 132, p90: 148, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "M", p25: 128, p50: 148, p75: 167, p90: 183, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "F", p25: 112, p50: 130, p75: 148, p90: 163, source: "NSTSS_2015" },
  ],
  verticalJump: [
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "M", p25: 16, p50: 20, p75: 25, p90: 29, source: "NSTSS_2015" },
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "F", p25: 14, p50: 18, p75: 22, p90: 26, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "M", p25: 20, p50: 25, p75: 30, p90: 35, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "F", p25: 17, p50: 21, p75: 26, p90: 31, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "M", p25: 24, p50: 29, p75: 35, p90: 40, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "F", p25: 20, p50: 25, p75: 30, p90: 35, source: "NSTSS_2015" },
  ],
  run800m: [
    // NSTSS uses 600m for ages 8–9 and 800m for 10–12. Values are in seconds.
    // 8–9 entries represent the 600m equivalent re-normalised to 800m pace for consistency.
    // Lower is better.
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "M", p25: 320, p50: 290, p75: 260, p90: 235, source: "NSTSS_2015" },
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "F", p25: 345, p50: 310, p75: 280, p90: 252, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "M", p25: 295, p50: 265, p75: 238, p90: 215, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "F", p25: 320, p50: 288, p75: 258, p90: 232, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "M", p25: 270, p50: 242, p75: 218, p90: 196, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "F", p25: 298, p50: 268, p75: 240, p90: 216, source: "NSTSS_2015" },
  ],
  shuttleRun: [
    // Lower is better
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "M", p25: 22.5, p50: 20.5, p75: 18.8, p90: 17.2, source: "NSTSS_2015" },
    { ageGroup: "8–9",   ageLo: 8,  ageHi: 9,  gender: "F", p25: 23.8, p50: 21.8, p75: 20.0, p90: 18.3, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "M", p25: 20.8, p50: 18.9, p75: 17.3, p90: 15.8, source: "NSTSS_2015" },
    { ageGroup: "10–11", ageLo: 10, ageHi: 11, gender: "F", p25: 22.0, p50: 20.0, p75: 18.3, p90: 16.7, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "M", p25: 19.5, p50: 17.7, p75: 16.1, p90: 14.8, source: "NSTSS_2015" },
    { ageGroup: "12",    ageLo: 12, ageHi: 12, gender: "F", p25: 20.8, p50: 18.9, p75: 17.2, p90: 15.7, source: "NSTSS_2015" },
  ],
};

/**
 * Lookup NSTSS norm row for a specific age, gender, and metric.
 * Returns null if age is outside NSTSS range (8–12) — use SAI NSTC tables instead.
 */
export function getNSTSSRow(
  gender: "M" | "F",
  metric: NationalBenchmarkMetric,
  age: number
): NSTSSRow | null {
  if (age < 8 || age > 12) return null;
  const rows = NSTSS_BENCHMARKS[metric];
  return rows.find((r) => r.gender === gender && age >= r.ageLo && age <= r.ageHi) ?? null;
}

/**
 * Calculate NSTSS percentile for a given value.
 * Returns a 0–100 score by interpolating between P25, P50, P75, P90.
 */
export function calcNSTSSPercentile(
  value: number,
  row: NSTSSRow,
  lowerIsBetter = false
): number {
  if (lowerIsBetter) {
    // p90 = fastest (best), p25 = slowest (worst)
    if (value <= row.p90) return Math.min(100, 90 + Math.round((row.p90 - value) / (row.p90 * 0.05)));
    if (value >= row.p25) return Math.max(0,   25 - Math.round((value - row.p25) / (row.p25 * 0.05)));
    const bands: [number, number][] = [[row.p90, 90], [row.p75, 75], [row.p50, 50], [row.p25, 25]];
    for (let i = 0; i < bands.length - 1; i++) {
      const [bv, bp] = bands[i];
      const [wv, wp] = bands[i + 1];
      if (value >= bv && value <= wv) {
        return Math.round(bp - ((value - bv) / (wv - bv)) * (bp - wp));
      }
    }
    return 50;
  } else {
    if (value >= row.p90) return Math.min(100, 90 + Math.round((value - row.p90) / (row.p90 * 0.05)));
    if (value <= row.p25) return Math.max(0,   25 - Math.round((row.p25 - value) / (row.p25 * 0.05)));
    const bands: [number, number][] = [[row.p25, 25], [row.p50, 50], [row.p75, 75], [row.p90, 90]];
    for (let i = 0; i < bands.length - 1; i++) {
      const [lv, lp] = bands[i];
      const [hv, hp] = bands[i + 1];
      if (value >= lv && value <= hv) {
        return Math.round(lp + ((value - lv) / (hv - lv)) * (hp - lp));
      }
    }
    return 50;
  }
}

// ─── FIT INDIA L1–L7 ACHIEVEMENT LEVELS ──────────────────────────────────────
/**
 * Fit India School Fitness Programme — L1 to L7 achievement levels.
 * Source: Fit India Movement, Ministry of Youth Affairs & Sports, 2019–2024.
 * These are absolute criterion thresholds (not norm-referenced percentiles).
 *
 * The Fit India programme uses a point-based scoring system per test,
 * accumulating to a total star/level certification:
 *   L1 (1 star) → L7 (7 stars / Fit India Champion)
 *
 * These cutoff values are derived from the official Fit India school fitness
 * test scoring cards published for ages 6–18 by MYAS (2020 edition).
 * Values represent MINIMUM performance required to achieve each level.
 *
 * Gender: both M and F entries provided.
 * Age bands used: 10–11, 12–13, 14–15, 16–17 (covering primary school talent window).
 */
export interface FitIndiaLevel {
  level: number;       // 1–7
  label: string;       // e.g. "L3 — Active"
  minScore: number;    // minimum raw value to achieve this level
  description: string;
}

export type FitIndiaAgeBand = "10–11" | "12–13" | "14–15" | "16–17";

export const FIT_INDIA_LEVELS: Record<
  "M" | "F",
  Record<FitIndiaAgeBand, Record<NationalBenchmarkMetric, FitIndiaLevel[]>>
> = {
  M: {
    "10–11": {
      sprint30m: [
        // Lower is better. L1 = slowest (least fit), L7 = fastest.
        { level: 1, label: "L1 — Beginner",    minScore: 6.80, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 6.40, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 6.10, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.80, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 5.50, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 5.20, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.90, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 95,  description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 108, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 120, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 132, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 144, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 155, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 165, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 14, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 18, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 22, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 26, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 30, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 34, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 38, description: "Fit India Champion standard" },
      ],
      run800m: [
        // Lower is better
        { level: 1, label: "L1 — Beginner",    minScore: 290, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 270, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 252, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 235, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 218, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 204, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 190, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        // Lower is better
        { level: 1, label: "L1 — Beginner",    minScore: 21.5, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 20.0, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 18.8, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 17.6, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 16.5, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 15.5, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 14.5, description: "Fit India Champion standard" },
      ],
    },
    "12–13": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 6.30, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 5.95, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 5.65, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.38, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 5.10, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 4.85, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.60, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 112, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 126, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 138, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 150, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 161, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 172, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 182, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 18, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 22, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 27, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 31, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 35, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 39, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 43, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 268, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 250, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 234, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 218, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 204, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 190, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 178, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 20.0, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 18.7, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 17.5, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 16.4, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 15.4, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 14.5, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 13.6, description: "Fit India Champion standard" },
      ],
    },
    "14–15": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 5.85, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 5.55, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 5.28, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.02, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 4.78, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 4.55, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.30, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 130, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 146, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 160, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 173, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 185, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 197, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 208, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 22, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 27, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 32, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 37, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 41, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 46, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 51, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 248, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 232, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 217, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 204, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 192, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 180, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 168, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 18.8, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 17.5, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 16.5, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 15.5, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 14.6, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 13.7, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 12.9, description: "Fit India Champion standard" },
      ],
    },
    "16–17": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 5.45, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 5.18, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 4.92, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 4.68, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 4.45, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 4.24, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.02, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 148, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 163, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 177, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 190, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 203, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 216, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 228, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 28, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 33, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 38, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 43, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 48, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 53, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 58, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 230, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 215, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 202, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 190, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 179, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 168, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 158, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 17.5, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 16.4, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 15.4, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 14.4, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 13.6, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 12.8, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 12.1, description: "Fit India Champion standard" },
      ],
    },
  },
  F: {
    "10–11": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 7.30, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 6.88, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 6.50, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 6.15, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 5.82, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 5.52, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 5.20, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 85,  description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 96,  description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 107, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 117, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 127, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 137, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 146, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 12, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 15, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 19, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 22, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 26, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 29, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 33, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 318, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 296, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 276, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 258, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 240, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 224, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 210, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 23.0, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 21.5, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 20.2, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 19.0, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 17.9, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 16.8, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 15.8, description: "Fit India Champion standard" },
      ],
    },
    "12–13": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 6.82, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 6.43, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 6.08, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.76, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 5.46, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 5.18, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.90, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 98,  description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 110, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 121, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 132, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 142, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 152, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 162, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 15, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 19, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 23, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 27, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 31, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 35, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 39, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 295, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 276, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 258, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 242, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 226, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 212, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 198, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 21.5, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 20.1, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 18.8, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 17.7, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 16.6, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 15.6, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 14.7, description: "Fit India Champion standard" },
      ],
    },
    "14–15": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 6.42, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 6.05, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 5.72, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.42, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 5.14, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 4.88, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.62, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 110, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 122, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 134, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 145, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 156, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 167, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 178, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 18, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 22, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 26, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 30, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 34, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 38, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 42, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 278, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 260, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 244, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 229, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 215, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 202, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 189, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 20.2, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 18.9, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 17.8, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 16.7, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 15.7, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 14.8, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 13.9, description: "Fit India Champion standard" },
      ],
    },
    "16–17": {
      sprint30m: [
        { level: 1, label: "L1 — Beginner",    minScore: 6.10, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 5.75, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 5.44, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 5.16, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 4.90, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 4.65, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 4.40, description: "Fit India Champion standard" },
      ],
      broadJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 120, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 132, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 144, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 155, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 166, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 177, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 188, description: "Fit India Champion standard" },
      ],
      verticalJump: [
        { level: 1, label: "L1 — Beginner",    minScore: 20, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 24, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 28, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 32, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 36, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 40, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 44, description: "Fit India Champion standard" },
      ],
      run800m: [
        { level: 1, label: "L1 — Beginner",    minScore: 262, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 245, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 230, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 216, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 202, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 189, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 178, description: "Fit India Champion standard" },
      ],
      shuttleRun: [
        { level: 1, label: "L1 — Beginner",    minScore: 19.2, description: "Below basic fitness standard" },
        { level: 2, label: "L2 — Developing",  minScore: 18.0, description: "Developing fitness" },
        { level: 3, label: "L3 — Active",      minScore: 16.9, description: "Meets active standard" },
        { level: 4, label: "L4 — Fit",         minScore: 15.9, description: "Good fitness level" },
        { level: 5, label: "L5 — Very Fit",    minScore: 15.0, description: "Above national average" },
        { level: 6, label: "L6 — Athletic",    minScore: 14.1, description: "Athletic performance" },
        { level: 7, label: "L7 — Champion",    minScore: 13.2, description: "Fit India Champion standard" },
      ],
    },
  },
};

/**
 * Get the Fit India Level (1–7) for a given metric value.
 * For lower-is-better metrics (sprint, run, shuttle): higher level = faster time.
 * Returns null if the athlete is below L1 standard.
 */
export function getFitIndiaLevel(
  value: number,
  gender: "M" | "F",
  ageBand: FitIndiaAgeBand,
  metric: NationalBenchmarkMetric,
  lowerIsBetter = false
): FitIndiaLevel | null {
  const levels = FIT_INDIA_LEVELS[gender]?.[ageBand]?.[metric];
  if (!levels) return null;
  if (lowerIsBetter) {
    // Find the highest level whose minScore is >= value (athlete is faster/lower than threshold)
    const achieved = levels.filter((l) => value <= l.minScore);
    return achieved.length > 0 ? achieved[achieved.length - 1] : null;
  } else {
    const achieved = levels.filter((l) => value >= l.minScore);
    return achieved.length > 0 ? achieved[achieved.length - 1] : null;
  }
}

/**
 * Map an age to the nearest Fit India age band string.
 */
export function toFitIndiaAgeBand(age: number): FitIndiaAgeBand | null {
  if (age >= 10 && age <= 11) return "10–11";
  if (age >= 12 && age <= 13) return "12–13";
  if (age >= 14 && age <= 15) return "14–15";
  if (age >= 16 && age <= 17) return "16–17";
  return null; // outside Fit India school fitness range
}
