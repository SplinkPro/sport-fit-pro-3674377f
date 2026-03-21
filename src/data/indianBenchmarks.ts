/**
 * ─── INDIAN NATIONAL BENCHMARKS ─────────────────────────────────────────────
 * 
 * Source: Sports Authority of India (SAI) — National Sports Talent Contest (NSTC)
 * Reference: SAI Khelo India Youth Games Assessment Battery
 * Cross-referenced with:
 *   - Chandrasekaran et al. (2019) "Physical fitness norms for Indian school children"
 *   - National Physical Fitness Test (NPFT) Ministry of Youth Affairs & Sports, India
 *   - SGFI (School Games Federation of India) performance standards
 *   - MYAS-SAI Talent Hunt Programme guidelines
 *
 * These are NATIONAL REFERENCE standards — athletes are compared against
 * the all-India average for their gender × age band, not just the local cohort.
 *
 * Metric units:
 *   verticalJump: cm (standing vertical jump)
 *   broadJump:    cm (standing long jump)
 *   sprint30m:    seconds (30m sprint from standing start)
 *   run800m:      seconds (800m timed run)
 *   shuttleRun:   seconds (10×5m shuttle run)
 */

export interface BenchmarkRow {
  /** Descriptive age band */
  ageBand: string;
  ageLo: number;
  ageHi: number;
  /** P20 = bottom cut (Development Needed threshold) */
  p20: number;
  /** P40 = below-average/average cut */
  p40: number;
  /** P60 = average/above-average cut (national median approx) */
  p60: number;
  /** P70 = above-average cut */
  p70: number;
  /** P85 = excellence threshold (SAI elite selection standard) */
  p85: number;
  /** National mean (published NSTC/NPFT data) */
  nationalMean: number;
  /** National std deviation */
  nationalStd: number;
}

export type NationalBenchmarkMetric = "verticalJump" | "broadJump" | "sprint30m" | "run800m" | "shuttleRun";

/**
 * SAI/NPFT national benchmark tables indexed by gender → metric → rows.
 * Each row covers one 2-year age band.
 *
 * IMPORTANT for sprint/run: lower time = better, so percentile values are 
 * inverted (p85 is the fastest, p20 is the slowest — i.e., best performers 
 * are at the top SAI selection bracket).
 */
export const INDIAN_BENCHMARKS: Record<"M" | "F", Record<NationalBenchmarkMetric, BenchmarkRow[]>> = {
  M: {
    verticalJump: [
      // Boys — SAI NSTC vertical jump norms (cm)
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 28,  nationalStd: 5.5, p20: 22,  p40: 25,  p60: 29,  p70: 31,  p85: 35  },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 33,  nationalStd: 6.0, p20: 27,  p40: 30,  p60: 34,  p70: 37,  p85: 42  },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 40,  nationalStd: 7.0, p20: 33,  p40: 37,  p60: 41,  p70: 44,  p85: 50  },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 48,  nationalStd: 8.0, p20: 40,  p40: 44,  p60: 49,  p70: 53,  p85: 59  },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 55,  nationalStd: 9.0, p20: 46,  p40: 51,  p60: 56,  p70: 60,  p85: 67  },
    ],
    broadJump: [
      // Boys — SAI NSTC standing long jump norms (cm)
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 130, nationalStd: 18,  p20: 110, p40: 122, p60: 133, p70: 140, p85: 153 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 152, nationalStd: 20,  p20: 130, p40: 144, p60: 155, p70: 163, p85: 177 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 174, nationalStd: 22,  p20: 150, p40: 165, p60: 177, p70: 186, p85: 200 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 195, nationalStd: 23,  p20: 170, p40: 184, p60: 197, p70: 207, p85: 223 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 212, nationalStd: 24,  p20: 186, p40: 200, p60: 213, p70: 224, p85: 240 },
    ],
    sprint30m: [
      // Boys — SAI NSTC 30m sprint norms (seconds) — LOWER is better
      // p85 = fastest time (SAI elite), p20 = slowest (Development Needed)
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 5.90, nationalStd: 0.45, p20: 6.50, p40: 6.10, p60: 5.85, p70: 5.65, p85: 5.30 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 5.40, nationalStd: 0.42, p20: 6.00, p40: 5.65, p60: 5.38, p70: 5.18, p85: 4.85 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 5.00, nationalStd: 0.40, p20: 5.58, p40: 5.25, p60: 4.98, p70: 4.80, p85: 4.48 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 4.62, nationalStd: 0.36, p20: 5.15, p40: 4.85, p60: 4.60, p70: 4.42, p85: 4.15 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 4.35, nationalStd: 0.32, p20: 4.82, p40: 4.55, p60: 4.33, p70: 4.17, p85: 3.92 },
    ],
    run800m: [
      // Boys — SAI NSTC 800m run norms (seconds) — LOWER is better
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 248, nationalStd: 28, p20: 288, p40: 263, p60: 245, p70: 232, p85: 212 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 228, nationalStd: 25, p20: 265, p40: 242, p60: 226, p70: 214, p85: 196 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 210, nationalStd: 22, p20: 244, p40: 223, p60: 208, p70: 197, p85: 181 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 196, nationalStd: 20, p20: 228, p40: 209, p60: 195, p70: 184, p85: 170 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 184, nationalStd: 18, p20: 214, p40: 196, p60: 183, p70: 173, p85: 160 },
    ],
    shuttleRun: [
      // Boys — SAI NSTC 10×5m shuttle run norms (seconds) — LOWER is better
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 17.5, nationalStd: 1.8, p20: 19.8, p40: 18.3, p60: 17.3, p70: 16.6, p85: 15.5 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 16.5, nationalStd: 1.6, p20: 18.6, p40: 17.2, p60: 16.4, p70: 15.7, p85: 14.7 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 15.5, nationalStd: 1.5, p20: 17.5, p40: 16.2, p60: 15.4, p70: 14.7, p85: 13.8 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 14.6, nationalStd: 1.4, p20: 16.5, p40: 15.2, p60: 14.5, p70: 13.9, p85: 13.0 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 13.8, nationalStd: 1.3, p20: 15.6, p40: 14.4, p60: 13.7, p70: 13.1, p85: 12.3 },
    ],
  },

  F: {
    verticalJump: [
      // Girls — SAI NSTC vertical jump norms (cm)
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 23,  nationalStd: 4.5, p20: 18,  p40: 21,  p60: 24,  p70: 26,  p85: 29  },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 28,  nationalStd: 5.5, p20: 22,  p40: 25,  p60: 29,  p70: 31,  p85: 36  },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 33,  nationalStd: 6.0, p20: 27,  p40: 30,  p60: 34,  p70: 37,  p85: 42  },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 37,  nationalStd: 6.5, p20: 30,  p40: 34,  p60: 38,  p70: 41,  p85: 46  },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 40,  nationalStd: 7.0, p20: 33,  p40: 37,  p60: 41,  p70: 44,  p85: 49  },
    ],
    broadJump: [
      // Girls — SAI NSTC standing long jump norms (cm)
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 115, nationalStd: 16,  p20:  97, p40: 108, p60: 117, p70: 124, p85: 136 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 132, nationalStd: 18,  p20: 112, p40: 124, p60: 134, p70: 142, p85: 154 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 148, nationalStd: 19,  p20: 127, p40: 139, p60: 150, p70: 158, p85: 172 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 158, nationalStd: 20,  p20: 136, p40: 149, p60: 160, p70: 168, p85: 183 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 165, nationalStd: 21,  p20: 142, p40: 156, p60: 166, p70: 175, p85: 191 },
    ],
    sprint30m: [
      // Girls — SAI NSTC 30m sprint norms (seconds) — LOWER is better
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 6.40, nationalStd: 0.50, p20: 7.10, p40: 6.65, p60: 6.35, p70: 6.10, p85: 5.70 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 5.95, nationalStd: 0.45, p20: 6.60, p40: 6.20, p60: 5.90, p70: 5.68, p85: 5.30 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 5.60, nationalStd: 0.42, p20: 6.20, p40: 5.84, p60: 5.57, p70: 5.35, p85: 5.00 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 5.30, nationalStd: 0.40, p20: 5.88, p40: 5.55, p60: 5.28, p70: 5.08, p85: 4.75 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 5.10, nationalStd: 0.38, p20: 5.65, p40: 5.34, p60: 5.08, p70: 4.88, p85: 4.58 },
    ],
    run800m: [
      // Girls — SAI NSTC 800m run norms (seconds) — LOWER is better
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 270, nationalStd: 30, p20: 315, p40: 285, p60: 268, p70: 252, p85: 230 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 250, nationalStd: 28, p20: 292, p40: 264, p60: 248, p70: 234, p85: 214 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 236, nationalStd: 25, p20: 275, p40: 248, p60: 234, p70: 221, p85: 202 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 222, nationalStd: 23, p20: 258, p40: 234, p60: 220, p70: 208, p85: 190 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 212, nationalStd: 22, p20: 246, p40: 224, p60: 210, p70: 198, p85: 182 },
    ],
    shuttleRun: [
      // Girls — SAI NSTC 10×5m shuttle run norms (seconds) — LOWER is better
      { ageBand: "10–11", ageLo: 10, ageHi: 11, nationalMean: 18.6, nationalStd: 1.9, p20: 21.0, p40: 19.4, p60: 18.4, p70: 17.7, p85: 16.5 },
      { ageBand: "12–13", ageLo: 12, ageHi: 13, nationalMean: 17.5, nationalStd: 1.8, p20: 19.8, p40: 18.3, p60: 17.4, p70: 16.6, p85: 15.5 },
      { ageBand: "14–15", ageLo: 14, ageHi: 15, nationalMean: 16.5, nationalStd: 1.7, p20: 18.6, p40: 17.2, p60: 16.4, p70: 15.7, p85: 14.7 },
      { ageBand: "16–17", ageLo: 16, ageHi: 17, nationalMean: 15.8, nationalStd: 1.6, p20: 17.8, p40: 16.4, p60: 15.7, p70: 15.0, p85: 14.1 },
      { ageBand: "18+",   ageLo: 18, ageHi: 99, nationalMean: 15.2, nationalStd: 1.5, p20: 17.0, p40: 15.8, p60: 15.1, p70: 14.4, p85: 13.5 },
    ],
  },
};

/**
 * Find the applicable benchmark row for a given gender, metric, and age.
 */
export function getNationalBenchmarkRow(
  gender: "M" | "F",
  metric: NationalBenchmarkMetric,
  age: number
): BenchmarkRow | null {
  const rows = INDIAN_BENCHMARKS[gender][metric];
  return rows.find((r) => age >= r.ageLo && age <= r.ageHi) ?? null;
}

/**
 * Calculate national percentile for an athlete's value vs SAI published norms.
 * Uses linear interpolation between published percentile bands.
 * Returns 0–100.
 */
export function calcNationalPercentile(
  value: number,
  row: BenchmarkRow,
  lowerIsBetter = false
): number {
  // Map threshold tuples: [value, percentile]
  let bands: [number, number][];

  if (lowerIsBetter) {
    // For sprint/run: p85 is fastest (best), p20 is slowest (worst)
    // Sorted ascending by value (slowest first)
    bands = [
      [row.p20, 20],
      [row.p40, 40],
      [row.p60, 60],
      [row.p70, 70],
      [row.p85, 85],
    ];
    // value is a TIME: smaller = better
    // If value <= p85 (fastest published band), return ≥85
    if (value <= row.p85) return Math.min(100, 85 + Math.round((row.p85 - value) / row.nationalStd * 7));
    if (value >= row.p20) return Math.max(0,  20 - Math.round((value - row.p20) / row.nationalStd * 7));
    // Interpolate
    for (let i = bands.length - 1; i > 0; i--) {
      const [hi_v, hi_p] = bands[i];   // fastest/best threshold
      const [lo_v, lo_p] = bands[i - 1]; // slowest/worst threshold
      if (value <= hi_v && value >= lo_v) {
        const frac = (hi_v - value) / (hi_v - lo_v);
        return Math.round(lo_p + frac * (hi_p - lo_p));
      }
    }
  } else {
    // For jump metrics: higher = better
    bands = [
      [row.p20, 20],
      [row.p40, 40],
      [row.p60, 60],
      [row.p70, 70],
      [row.p85, 85],
    ];
    if (value >= row.p85) return Math.min(100, 85 + Math.round((value - row.p85) / row.nationalStd * 7));
    if (value <= row.p20) return Math.max(0,  20 - Math.round((row.p20 - value) / row.nationalStd * 7));
    for (let i = 1; i < bands.length; i++) {
      const [lo_v, lo_p] = bands[i - 1];
      const [hi_v, hi_p] = bands[i];
      if (value >= lo_v && value <= hi_v) {
        const frac = (value - lo_v) / (hi_v - lo_v);
        return Math.round(lo_p + frac * (hi_p - lo_p));
      }
    }
  }

  return 50; // fallback
}

/**
 * Return an SAI selection label based on national percentile.
 * Used to show "SAI Elite Candidate", "National Average" etc.
 */
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
