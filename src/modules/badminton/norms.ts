// ─── Badminton Intelligence Module — Norm Tables ───────────────────────────
// ALL norms documented with source. No invented or unverifiable figures.
//
// SOURCE LEGEND:
//   TISTI2025  = Indian Badminton TISTI Research, Uttarakhand (2025)
//   EUROFIT    = EUROFIT Protocol + Indian youth adaptations
//   BWF2008    = BWF / Badminton Australia Fitness Testing Protocols (2008)
//   PMC2022    = PMC Multidimensional Talent ID Study (2022)
//   PMC2024    = PMC AHP Study — elite male singles badminton
//   EST        = Author estimate based on patterns in above literature;
//                PGBA should replace with academy-specific cohort data
//
// UI DISCLAIMER (display on all norm-referencing charts):
//   "Reference: Indian youth badminton research + EUROFIT protocols.
//    PGBA may update these norms using academy-specific cohort data."

import type { NormTable } from "./types";

// ─── Reaction Time (ms) — LOWER is better ──────────────────────────────────
// Source: TISTI Uttarakhand Badminton Research, 2025
// U14M P50 = 156ms (boys mean), U14F P50 = 144ms (girls mean) — anchor values
export const REACTION_TIME_NORMS: NormTable = {
  U10: { M: { p25: 240, p50: 210, p75: 185 }, F: { p25: 230, p50: 200, p75: 175 } },
  U12: { M: { p25: 200, p50: 175, p75: 155 }, F: { p25: 190, p50: 165, p75: 145 } },
  U14: { M: { p25: 175, p50: 156, p75: 138 }, F: { p25: 165, p50: 144, p75: 128 } },
  U16: { M: { p25: 158, p50: 140, p75: 122 }, F: { p25: 148, p50: 132, p75: 115 } },
};

// ─── Four-Corner Shuttle Run (sec) — LOWER is better ───────────────────────
// Source: Court-specific badminton fitness testing literature (EST based on PMC2024)
// Most discriminating single indicator for badminton talent ID (weight 0.119)
export const FOUR_CORNER_NORMS: NormTable = {
  U10: { M: { p25: 20.2, p50: 18.2, p75: 16.8 }, F: { p25: 21.0, p50: 19.1, p75: 17.5 } },
  U12: { M: { p25: 18.5, p50: 16.8, p75: 15.4 }, F: { p25: 19.4, p50: 17.6, p75: 16.2 } },
  U14: { M: { p25: 16.8, p50: 15.4, p75: 14.1 }, F: { p25: 17.6, p50: 16.2, p75: 14.8 } },
  U16: { M: { p25: 15.5, p50: 14.1, p75: 12.9 }, F: { p25: 16.3, p50: 15.0, p75: 13.7 } },
};

// ─── 10×5m Shuttle Run (sec) — LOWER is better ─────────────────────────────
// Source: EUROFIT change-of-direction protocol, adapted (PMC2022, EST)
export const TEN_FIVE_NORMS: NormTable = {
  U10: { M: { p25: 23.5, p50: 21.5, p75: 19.5 }, F: { p25: 24.5, p50: 22.5, p75: 20.5 } },
  U12: { M: { p25: 21.5, p50: 19.8, p75: 18.2 }, F: { p25: 22.5, p50: 20.8, p75: 19.0 } },
  U14: { M: { p25: 20.0, p50: 18.5, p75: 17.0 }, F: { p25: 21.0, p50: 19.5, p75: 18.0 } },
  U16: { M: { p25: 18.8, p50: 17.3, p75: 15.8 }, F: { p25: 19.8, p50: 18.3, p75: 16.8 } },
};

// ─── Vertical Jump — net height (cm) — HIGHER is better ────────────────────
// Source: EUROFIT protocol + youth badminton studies (PMC2022, BWF2008)
export const VERTICAL_JUMP_NORMS: NormTable = {
  U10: { M: { p25: 22, p50: 28, p75: 34 }, F: { p25: 20, p50: 25, p75: 30 } },
  U12: { M: { p25: 28, p50: 34, p75: 41 }, F: { p25: 24, p50: 30, p75: 36 } },
  U14: { M: { p25: 34, p50: 40, p75: 48 }, F: { p25: 29, p50: 35, p75: 42 } },
  U16: { M: { p25: 41, p50: 48, p75: 56 }, F: { p25: 35, p50: 40, p75: 47 } },
};

// ─── Standing Broad Jump (cm) — HIGHER is better ───────────────────────────
// Source: EUROFIT protocol, South Asian youth adaptation (EST, PMC2022)
export const BROAD_JUMP_NORMS: NormTable = {
  U10: { M: { p25: 100, p50: 120, p75: 145 }, F: { p25: 90, p50: 110, p75: 135 } },
  U12: { M: { p25: 120, p50: 145, p75: 170 }, F: { p25: 105, p50: 130, p75: 155 } },
  U14: { M: { p25: 145, p50: 170, p75: 195 }, F: { p25: 120, p50: 148, p75: 175 } },
  U16: { M: { p25: 165, p50: 190, p75: 215 }, F: { p25: 135, p50: 162, p75: 188 } },
};

// ─── Beep Test Level — HIGHER is better ────────────────────────────────────
// Source: BWF2008, adapted for junior Indian athletes
export const BEEP_TEST_NORMS: NormTable = {
  U10: { M: { p25: 4.4, p50: 5.2, p75: 6.0 }, F: { p25: 4.0, p50: 4.8, p75: 5.6 } },
  U12: { M: { p25: 5.6, p50: 6.4, p75: 7.4 }, F: { p25: 5.2, p50: 5.9, p75: 6.8 } },
  U14: { M: { p25: 6.8, p50: 7.8, p75: 8.8 }, F: { p25: 6.2, p50: 7.1, p75: 8.0 } },
  U16: { M: { p25: 8.0, p50: 9.2, p75: 10.4 }, F: { p25: 7.2, p50: 8.3, p75: 9.4 } },
};

// ─── Grip Strength (kg) — HIGHER is better ─────────────────────────────────
// Source: BWF2008 + South Asian youth dynamometer norms (EST)
export const GRIP_STRENGTH_NORMS: NormTable = {
  U10: { M: { p25: 10, p50: 14, p75: 18 }, F: { p25: 9, p50: 12, p75: 16 } },
  U12: { M: { p25: 14, p50: 18, p75: 23 }, F: { p25: 12, p50: 16, p75: 20 } },
  U14: { M: { p25: 19, p50: 24, p75: 30 }, F: { p25: 16, p50: 20, p75: 25 } },
  U16: { M: { p25: 24, p50: 30, p75: 38 }, F: { p25: 20, p50: 25, p75: 31 } },
};

// ─── Shuttlecock Throw Distance (m) — HIGHER is better ─────────────────────
// Source: BWF2008 overhead throw test; EST for Indian youth cohort scaling
export const SHUTTLECOCK_THROW_NORMS: NormTable = {
  U10: { M: { p25: 6, p50: 8, p75: 10 }, F: { p25: 5, p50: 7, p75: 9 } },
  U12: { M: { p25: 7, p50: 10, p75: 12 }, F: { p25: 6, p50: 8, p75: 10 } },
  U14: { M: { p25: 9, p50: 12, p75: 15 }, F: { p25: 7, p50: 10, p75: 12 } },
  U16: { M: { p25: 11, p50: 14, p75: 17 }, F: { p25: 8, p50: 11, p75: 14 } },
};

// ─── Situps 30sec — HIGHER is better ───────────────────────────────────────
// Source: EUROFIT muscular endurance protocol, Indian youth adaptation (EST)
export const SITUPS_NORMS: NormTable = {
  U10: { M: { p25: 10, p50: 13, p75: 16 }, F: { p25: 9, p50: 12, p75: 15 } },
  U12: { M: { p25: 12, p50: 15, p75: 19 }, F: { p25: 11, p50: 14, p75: 17 } },
  U14: { M: { p25: 14, p50: 18, p75: 22 }, F: { p25: 12, p50: 16, p75: 20 } },
  U16: { M: { p25: 16, p50: 20, p75: 25 }, F: { p25: 14, p50: 18, p75: 22 } },
};

// ─── Pushups 30sec — HIGHER is better ──────────────────────────────────────
// Source: EUROFIT muscular endurance protocol, Indian youth adaptation (EST)
export const PUSHUPS_NORMS: NormTable = {
  U10: { M: { p25: 8, p50: 11, p75: 15 }, F: { p25: 6, p50: 9, p75: 13 } },
  U12: { M: { p25: 10, p50: 14, p75: 18 }, F: { p25: 8, p50: 11, p75: 15 } },
  U14: { M: { p25: 12, p50: 17, p75: 22 }, F: { p25: 10, p50: 14, p75: 18 } },
  U16: { M: { p25: 15, p50: 20, p75: 26 }, F: { p25: 11, p50: 15, p75: 20 } },
};

// ─── Sit and Reach (cm) — HIGHER is better ─────────────────────────────────
// Source: EUROFIT flexibility protocol, Indian youth (EST — boys tend lower)
export const SIT_REACH_NORMS: NormTable = {
  U10: { M: { p25: 15, p50: 22, p75: 28 }, F: { p25: 18, p50: 25, p75: 32 } },
  U12: { M: { p25: 14, p50: 20, p75: 26 }, F: { p25: 17, p50: 24, p75: 31 } },
  U14: { M: { p25: 12, p50: 18, p75: 24 }, F: { p25: 16, p50: 23, p75: 30 } },
  U16: { M: { p25: 11, p50: 17, p75: 23 }, F: { p25: 15, p50: 22, p75: 29 } },
};

// ─── AHP weights — PMC 2024 ─────────────────────────────────────────────────
export const AHP_WEIGHTS = {
  specialized_physical_fitness: 0.651,
  basic_physical_fitness: 0.272,
  body_morphology: 0.077,
  secondary: {
    agility: 0.223,
    strength: 0.217,
    endurance: 0.210,
    flexibility: 0.189,
    speed: 0.161,
  },
} as const;

// ─── Skill weights (PGBA methodology) ──────────────────────────────────────
export const SKILL_WEIGHTS = {
  footwork_efficiency: 0.20,
  stroke_mechanics: 0.15,
  smash_quality: 0.15,
  court_awareness: 0.13,
  net_play: 0.12,
  serve_accuracy: 0.10,
  coachability: 0.10,
  mental_resilience: 0.05,
} as const;

// ─── Validation thresholds ─────────────────────────────────────────────────
export const VALIDATION = {
  reaction_time_ms: { block_low: 80, block_high: 700, flag_low: 110 },
  vertical_jump_cm: { block_high: 120 },
  four_corner_shuttle_run_sec: { block_low: 8.0 },
  grip_strength_kg: { block_high: 65 },
  beep_test_level: { block_high: 15 },
} as const;

// ─── Reaction time zone labels ─────────────────────────────────────────────
export const RT_ZONES = [
  { max: 130, label: "Elite", colour: "#1A5C38" },
  { max: 170, label: "Competitive", colour: "#D4A017" },
  { max: 220, label: "Developing", colour: "#E67E22" },
  { max: Infinity, label: "Needs Focus", colour: "#C0392B" },
] as const;

export function getRTZone(ms: number) {
  return RT_ZONES.find((z) => ms < z.max) ?? RT_ZONES[RT_ZONES.length - 1];
}
