// ─── Badminton Intelligence Module — Scoring Engine ───────────────────────
// Implements BII (Badminton Intelligence Index) and SQ (Skill Quotient)
// per PMC 2024 AHP weights and PGBA coaching methodology.

import type {
  RawBadmintonAthlete,
  ProcessedBadmintonAthlete,
  AgeBand,
  NormTable,
  PercentileBreakdown,
  SecondaryScores,
  BIIBreakdown,
  SQBreakdown,
  FlagStatus,
  QuadrantLabel,
  RecommendationTag,
  CorrectedPhysicals,
} from "./types";
import {
  REACTION_TIME_NORMS, FOUR_CORNER_NORMS, TEN_FIVE_NORMS,
  VERTICAL_JUMP_NORMS, BROAD_JUMP_NORMS, BEEP_TEST_NORMS,
  GRIP_STRENGTH_NORMS, SHUTTLECOCK_THROW_NORMS, SITUPS_NORMS,
  PUSHUPS_NORMS, SIT_REACH_NORMS, AHP_WEIGHTS, SKILL_WEIGHTS, VALIDATION,
} from "./norms";

// ─── Age helpers ────────────────────────────────────────────────────────────

export function calcAge(dob: string): number {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function getAgeBand(age: number): AgeBand {
  if (age <= 10) return "U10";
  if (age <= 12) return "U12";
  if (age <= 14) return "U14";
  return "U16";
}

// ─── Percentile interpolation ───────────────────────────────────────────────
// For HIGHER-is-better: p25 < p50 < p75, higher value → higher percentile
// For LOWER-is-better:  p25 > p50 > p75, lower value → higher percentile

function interpolate(val: number, p25: number, p50: number, p75: number): number {
  // Piecewise linear, extrapolates beyond p25 and p75
  if (val >= p75) {
    const range = p75 - p50;
    if (range <= 0) return 75;
    return Math.min(100, 75 + 25 * (val - p75) / range);
  }
  if (val >= p50) {
    const range = p50 > 0 ? p75 - p50 : 1;
    return 50 + 25 * (val - p50) / (p75 - p50);
  }
  if (val >= p25) {
    return 25 + 25 * (val - p25) / (p50 - p25);
  }
  const range = p50 - p25;
  if (range <= 0) return 0;
  return Math.max(0, 25 - 25 * (p25 - val) / range);
}

export function getPercentile(
  value: number,
  norms: NormTable,
  ageBand: AgeBand,
  gender: "M" | "F",
  lowerIsBetter: boolean
): number {
  const { p25, p50, p75 } = norms[ageBand][gender];
  let pct: number;
  if (lowerIsBetter) {
    // Norms are ordered high (bad) → low (good): p25 > p50 > p75
    // Invert: treat as if we flip the scale
    pct = interpolate(value, p75, p50, p25); // pass inverted order
    // The interpolation above treats p75 as "lowest good value", so:
    // value = p75 (fast) → pct = 75 via interpolate(val, p75, p50, p25)
    // Actually we need to flip: lower value → higher percentile
    // Correct approach: map lower→higher percentile
    const invertedVal = p25 + p75 - value; // mirror around midpoint
    pct = interpolate(invertedVal, p25, p50, p75);
  } else {
    pct = interpolate(value, p25, p50, p75);
  }
  return Math.max(0, Math.min(100, pct));
}

// ─── Validation & auto-correction ──────────────────────────────────────────

interface ValidationResult {
  corrected: CorrectedPhysicals;
  flags: FlagStatus[];
  isBlocked: boolean;
  skillFlags: FlagStatus[];
}

function validateAndCorrect(raw: RawBadmintonAthlete): ValidationResult {
  const flags: FlagStatus[] = [];
  const skillFlags: FlagStatus[] = [];
  let isBlocked = false;
  const c: CorrectedPhysicals = {};

  // ── Reaction time ──
  let rt = raw.reaction_time_ms;
  if (rt !== undefined) {
    // Auto-correct: entered as seconds (e.g., 0.144 → 144ms)
    if (rt < 2.0) {
      rt = rt * 1000;
      flags.push("AUTO_CORRECTED_UNIT");
    }
    if (rt < VALIDATION.reaction_time_ms.block_low) {
      isBlocked = true;
      flags.push("BLOCKED_RT");
      rt = undefined;
    } else if (rt > VALIDATION.reaction_time_ms.block_high) {
      isBlocked = true;
      flags.push("BLOCKED_RT");
      rt = undefined;
    } else {
      if (rt < VALIDATION.reaction_time_ms.flag_low) {
        flags.push("VERIFY_RT_LOW");
      }
      c.reaction_time_ms = rt;
    }
  }

  // ── Vertical jump ──
  let vj = raw.vertical_jump_cm;
  if (vj !== undefined) {
    // Auto-correct: wall-reach convention if value > 150 and standing_reach provided
    if (vj > 150 && raw.standing_reach_cm !== undefined) {
      const netJump = vj - raw.standing_reach_cm;
      vj = netJump > 0 ? netJump : vj;
      flags.push("AUTO_CORRECTED_VJ");
    }
    if (vj > VALIDATION.vertical_jump_cm.block_high) {
      isBlocked = true;
      flags.push("BLOCKED_VJ");
      vj = undefined;
    } else {
      c.vertical_jump_cm = vj;
    }
  }

  // ── Four-corner shuttle run ──
  const fc = raw.four_corner_shuttle_run_sec;
  if (fc !== undefined) {
    if (fc < VALIDATION.four_corner_shuttle_run_sec.block_low) {
      isBlocked = true;
      flags.push("BLOCKED_SHUTTLE_LOW");
    } else {
      c.four_corner_shuttle_run_sec = fc;
    }
  }

  // ── Beep test ──
  const beep = raw.beep_test_level;
  if (beep !== undefined) {
    if (beep > VALIDATION.beep_test_level.block_high) {
      isBlocked = true;
      flags.push("BLOCKED_BEEP");
    } else {
      c.beep_test_level = beep;
    }
  }

  // ── Grip strength ──
  const grip = raw.grip_strength_kg;
  if (grip !== undefined) {
    if (grip > VALIDATION.grip_strength_kg.block_high) {
      isBlocked = true;
      flags.push("BLOCKED_GRIP");
    } else {
      c.grip_strength_kg = grip;
    }
  }

  // ── Passthrough fields ──
  if (raw.ten_by_five_shuttle_run_sec !== undefined) c.ten_by_five_shuttle_run_sec = raw.ten_by_five_shuttle_run_sec;
  if (raw.standing_broad_jump_cm !== undefined) c.standing_broad_jump_cm = raw.standing_broad_jump_cm;
  if (raw.shuttlecock_throw_m !== undefined) c.shuttlecock_throw_m = raw.shuttlecock_throw_m;
  if (raw.situps_30sec !== undefined) c.situps_30sec = raw.situps_30sec;
  if (raw.pushups_30sec !== undefined) c.pushups_30sec = raw.pushups_30sec;
  if (raw.sit_and_reach_cm !== undefined) c.sit_and_reach_cm = raw.sit_and_reach_cm;

  // ── Skill scores ──
  const skillFields = [
    raw.footwork_efficiency, raw.stroke_mechanics, raw.smash_quality,
    raw.net_play, raw.serve_accuracy, raw.court_awareness,
    raw.coachability, raw.mental_resilience,
  ].filter((v) => v !== undefined) as number[];

  const hasSkillOutOfRange = skillFields.some((v) => v < 1 || v > 10);
  if (hasSkillOutOfRange) {
    isBlocked = true;
    flags.push("BLOCKED_SKILL");
  }

  const allSkillsHigh = skillFields.length === 8 && skillFields.every((v) => v >= 9);
  if (allSkillsHigh) skillFlags.push("VERIFY_SKILL_LENIENCY");

  // ── Wingspan ──
  const ws = raw.wingspan_cm ?? raw.height_cm;
  if (raw.wingspan_cm !== undefined && raw.wingspan_cm > raw.height_cm + 18) {
    flags.push("VERIFY_WINGSPAN");
  }

  return { corrected: c, flags: [...flags, ...skillFlags], isBlocked, skillFlags };
}

// ─── BMI-for-age percentile (simplified IAP South Asian youth) ──────────────

function bmiForAgePercentile(bmi: number, ageBand: AgeBand, gender: "M" | "F"): number {
  // Approximate IAP healthy ranges by age band (South Asian youth, lean build expected in athletes)
  // Refs: IAP 2015 growth charts; healthy athlete BMI tends toward 15–21 for juniors
  const ranges: Record<AgeBand, Record<"M" | "F", { thinLow: number; normal: [number, number]; overHigh: number }>> = {
    U10: { M: { thinLow: 13.5, normal: [13.5, 18.0], overHigh: 18.0 }, F: { thinLow: 13.0, normal: [13.0, 18.5], overHigh: 18.5 } },
    U12: { M: { thinLow: 14.0, normal: [14.0, 19.5], overHigh: 19.5 }, F: { thinLow: 13.5, normal: [13.5, 20.0], overHigh: 20.0 } },
    U14: { M: { thinLow: 15.0, normal: [15.0, 21.0], overHigh: 21.0 }, F: { thinLow: 14.5, normal: [14.5, 21.5], overHigh: 21.5 } },
    U16: { M: { thinLow: 16.0, normal: [16.0, 22.5], overHigh: 22.5 }, F: { thinLow: 15.5, normal: [15.5, 23.0], overHigh: 23.0 } },
  };
  const r = ranges[ageBand][gender];
  const [low, high] = r.normal;
  const mid = (low + high) / 2;
  if (bmi < low) {
    // Below normal: 0–40 percentile
    return Math.max(0, 40 * (bmi - (low - 4)) / 4);
  }
  if (bmi <= mid) {
    return 40 + 30 * (bmi - low) / (mid - low);
  }
  if (bmi <= high) {
    return 70 + 20 * (bmi - mid) / (high - mid);
  }
  // Above range: drop
  return Math.max(0, 90 - 20 * (bmi - high) / 3);
}

// ─── BII computation ────────────────────────────────────────────────────────

function computeBII(
  c: CorrectedPhysicals,
  ageBand: AgeBand,
  gender: "M" | "F",
  bmi: number,
  wingspanCm: number,
  heightCm: number,
): { bii: BIIBreakdown; percentiles: PercentileBreakdown; secondary: SecondaryScores } {
  const g = gender;
  const ab = ageBand;

  // ─ Individual percentiles ─
  const pct: PercentileBreakdown = {};
  if (c.reaction_time_ms !== undefined)
    pct.reaction = getPercentile(c.reaction_time_ms, REACTION_TIME_NORMS, ab, g, true);
  if (c.four_corner_shuttle_run_sec !== undefined)
    pct.four_corner = getPercentile(c.four_corner_shuttle_run_sec, FOUR_CORNER_NORMS, ab, g, true);
  if (c.ten_by_five_shuttle_run_sec !== undefined)
    pct.ten_by_five = getPercentile(c.ten_by_five_shuttle_run_sec, TEN_FIVE_NORMS, ab, g, true);
  if (c.vertical_jump_cm !== undefined)
    pct.vertical_jump = getPercentile(c.vertical_jump_cm, VERTICAL_JUMP_NORMS, ab, g, false);
  if (c.standing_broad_jump_cm !== undefined)
    pct.broad_jump = getPercentile(c.standing_broad_jump_cm, BROAD_JUMP_NORMS, ab, g, false);
  if (c.beep_test_level !== undefined)
    pct.beep_test = getPercentile(c.beep_test_level, BEEP_TEST_NORMS, ab, g, false);
  if (c.grip_strength_kg !== undefined)
    pct.grip = getPercentile(c.grip_strength_kg, GRIP_STRENGTH_NORMS, ab, g, false);
  if (c.shuttlecock_throw_m !== undefined)
    pct.shuttlecock_throw = getPercentile(c.shuttlecock_throw_m, SHUTTLECOCK_THROW_NORMS, ab, g, false);
  if (c.situps_30sec !== undefined)
    pct.situps = getPercentile(c.situps_30sec, SITUPS_NORMS, ab, g, false);
  if (c.pushups_30sec !== undefined)
    pct.pushups = getPercentile(c.pushups_30sec, PUSHUPS_NORMS, ab, g, false);
  if (c.sit_and_reach_cm !== undefined)
    pct.sit_reach = getPercentile(c.sit_and_reach_cm, SIT_REACH_NORMS, ab, g, false);

  const validCount = Object.values(pct).filter((v) => v !== undefined).length;
  const missingComponents: string[] = [];

  // ─ Secondary indicators ─
  const sec: SecondaryScores = {};

  const agilityVals = [pct.four_corner, pct.ten_by_five].filter((v) => v !== undefined) as number[];
  if (agilityVals.length > 0) sec.agility = agilityVals.reduce((a, b) => a + b, 0) / agilityVals.length;
  else missingComponents.push("Agility");

  const strengthVals = [pct.vertical_jump, pct.broad_jump, pct.grip].filter((v) => v !== undefined) as number[];
  if (strengthVals.length > 0) sec.strength = strengthVals.reduce((a, b) => a + b, 0) / strengthVals.length;
  else missingComponents.push("Strength");

  const enduranceVals = [pct.beep_test, pct.situps, pct.pushups].filter((v) => v !== undefined) as number[];
  if (enduranceVals.length > 0) sec.endurance = enduranceVals.reduce((a, b) => a + b, 0) / enduranceVals.length;
  else missingComponents.push("Endurance");

  if (pct.sit_reach !== undefined) sec.flexibility = pct.sit_reach;
  else missingComponents.push("Flexibility");

  if (pct.reaction !== undefined) sec.speed = pct.reaction;
  else missingComponents.push("Speed/Reaction");

  // ─ SPF — redistribute weights for missing components ─
  const SPF_WEIGHTS = AHP_WEIGHTS.secondary;
  const spfEntries: [keyof typeof sec, number][] = [
    ["agility", SPF_WEIGHTS.agility],
    ["strength", SPF_WEIGHTS.strength],
    ["endurance", SPF_WEIGHTS.endurance],
    ["flexibility", SPF_WEIGHTS.flexibility],
    ["speed", SPF_WEIGHTS.speed],
  ];
  const availableSPF = spfEntries.filter(([k]) => sec[k] !== undefined);
  let spf_norm: number | undefined;
  if (availableSPF.length > 0) {
    const weightSum = availableSPF.reduce((s, [, w]) => s + w, 0);
    const spfRaw = availableSPF.reduce((s, [k, w]) => s + (sec[k] as number) * w, 0);
    spf_norm = (spfRaw / weightSum) * 100; // normalise so it's already 0–100
    // Wait: SPF = Σ(secondary × weight) where weights sum to 1, secondary is already 0–100
    // So SPF_norm = spfRaw (since weights sum ~1 when all present, or adjusted)
    spf_norm = spfRaw / weightSum; // 0–100 already
  }

  // ─ BPF ─
  const bpfVals = [pct.shuttlecock_throw, pct.beep_test].filter((v) => v !== undefined) as number[];
  const bpf = bpfVals.length > 0 ? bpfVals.reduce((a, b) => a + b, 0) / bpfVals.length : undefined;

  // ─ BM ─
  const bmiPct = bmiForAgePercentile(bmi, ageBand, gender);
  const wingDiff = wingspanCm - heightCm;
  let bmScore = bmiPct;
  if (wingDiff > 5) bmScore = Math.min(100, bmScore + 5);
  else if (wingDiff < -3) bmScore = Math.max(0, bmScore - 3);
  const bm = (bmiPct + bmScore) / 2;

  // ─ BII — redistribute if components missing ─
  const biiEntries: [string, number | undefined, number][] = [
    ["spf", spf_norm, AHP_WEIGHTS.specialized_physical_fitness],
    ["bpf", bpf, AHP_WEIGHTS.basic_physical_fitness],
    ["bm", bm, AHP_WEIGHTS.body_morphology],
  ];
  const availBII = biiEntries.filter(([, v]) => v !== undefined) as [string, number, number][];
  const isSufficient = validCount >= 6;
  let biiVal: number | undefined;
  if (isSufficient && availBII.length > 0) {
    const wSum = availBII.reduce((s, [, , w]) => s + w, 0);
    biiVal = availBII.reduce((s, [, v, w]) => s + v * w, 0) / wSum;
    biiVal = Math.max(0, Math.min(100, biiVal));
    biiVal = Math.round(biiVal * 10) / 10;
  }

  return {
    bii: { spf_norm, bpf, bm, bii: biiVal, physicalTestCount: validCount, isSufficient, missingComponents },
    percentiles: pct,
    secondary: sec,
  };
}

// ─── SQ computation ─────────────────────────────────────────────────────────

function computeSQ(raw: RawBadmintonAthlete): SQBreakdown {
  const entries: [keyof typeof SKILL_WEIGHTS, number | undefined][] = [
    ["footwork_efficiency", raw.footwork_efficiency],
    ["stroke_mechanics", raw.stroke_mechanics],
    ["smash_quality", raw.smash_quality],
    ["court_awareness", raw.court_awareness],
    ["net_play", raw.net_play],
    ["serve_accuracy", raw.serve_accuracy],
    ["coachability", raw.coachability],
    ["mental_resilience", raw.mental_resilience],
  ];
  const valid = entries.filter(([, v]) => v !== undefined && v >= 1 && v <= 10) as [keyof typeof SKILL_WEIGHTS, number][];
  const isPartial = valid.length < 6;
  const hasLeniencyFlag = valid.length === 8 && valid.every(([, v]) => v >= 9);

  if (valid.length === 0) return { raw: undefined, pct: undefined, isPartial: true, hasLeniencyFlag: false };

  const wSum = valid.reduce((s, [k]) => s + SKILL_WEIGHTS[k], 0);
  const sqRaw = valid.reduce((s, [k, v]) => s + v * SKILL_WEIGHTS[k], 0) / wSum;
  const sqPct = Math.min(100, Math.round(sqRaw * 10 * 10) / 10);

  return { raw: sqRaw, pct: sqPct, isPartial, hasLeniencyFlag };
}

// ─── Quadrant ───────────────────────────────────────────────────────────────

function computeQuadrant(bii?: number, sq?: number): QuadrantLabel | undefined {
  if (bii === undefined || sq === undefined) return undefined;
  if (bii >= 60 && sq >= 60) return "CHAMPION_PROFILE";
  if (bii >= 60 && sq < 60) return "RAW_PHYSICAL_TALENT";
  if (bii < 60 && sq >= 60) return "SKILL_FIRST";
  return "EARLY_DEVELOPMENT";
}

// ─── Recommendation tag ─────────────────────────────────────────────────────

function computeRecommendation(bii?: number, sq?: number): RecommendationTag {
  if (bii === undefined || sq === undefined)
    return { icon: "📋", label: "Insufficient data — complete assessment", colour: "grey" };
  if (bii >= 78 && sq >= 72) return { icon: "🏆", label: "Priority Intake — Champion Profile", colour: "gold" };
  if (bii >= 72 && sq < 62) return { icon: "💪", label: "Enrol — Skill Development Programme", colour: "blue" };
  if (bii < 62 && sq >= 70) return { icon: "🎯", label: "Enrol — Physical Conditioning Required", colour: "green" };
  if (bii >= 65 && sq >= 65) return { icon: "✅", label: "Strong Candidate — Continue Assessment", colour: "amber" };
  return { icon: "📋", label: "Continue Monitoring", colour: "grey" };
}

// ─── Main processing function ───────────────────────────────────────────────

export function processAthlete(raw: RawBadmintonAthlete): ProcessedBadmintonAthlete {
  const age = calcAge(raw.date_of_birth);
  const age_band = getAgeBand(age);
  const gender = raw.gender === "Male" ? "M" : "F";

  const { corrected, flags, isBlocked } = validateAndCorrect(raw);

  const wingspanCm = raw.wingspan_cm ?? raw.height_cm;
  const wingspanProxy = raw.wingspan_cm === undefined;

  const bmi = raw.weight_kg / ((raw.height_cm / 100) ** 2);

  const { bii, percentiles, secondary } = isBlocked
    ? {
        bii: { physicalTestCount: 0, isSufficient: false, missingComponents: [], bii: undefined, spf_norm: undefined, bpf: undefined, bm: undefined },
        percentiles: {},
        secondary: {},
      }
    : computeBII(corrected, age_band, gender, bmi, wingspanCm, raw.height_cm);

  const sq = computeSQ(raw);

  const quadrant = computeQuadrant(bii.bii, sq.pct);
  const recommendation = computeRecommendation(bii.bii, sq.pct);

  // BII > 88 with years_playing < 1 flag
  if (bii.bii !== undefined && bii.bii > 88 && raw.years_playing_badminton < 1) {
    flags.push("VERIFY_BII_TALENT");
  }

  return {
    raw,
    age,
    age_band,
    corrected,
    bmi: Math.round(bmi * 10) / 10,
    wingspanProxy,
    flags,
    isBlocked,
    percentiles,
    secondary,
    bii,
    sq,
    quadrant,
    recommendation,
  };
}

export function processAll(rawAthletes: RawBadmintonAthlete[]): ProcessedBadmintonAthlete[] {
  return rawAthletes.map(processAthlete);
}

// ─── Ranking ────────────────────────────────────────────────────────────────
// Sort by BII desc, break ties by reaction_time_ms asc

export function rankAthletes(athletes: ProcessedBadmintonAthlete[]): ProcessedBadmintonAthlete[] {
  return [...athletes].sort((a, b) => {
    const biA = a.bii.bii ?? -1;
    const biB = b.bii.bii ?? -1;
    if (biB !== biA) return biB - biA;
    const rtA = a.corrected.reaction_time_ms ?? 9999;
    const rtB = b.corrected.reaction_time_ms ?? 9999;
    return rtA - rtB;
  });
}
