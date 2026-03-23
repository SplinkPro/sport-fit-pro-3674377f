// ─── Badminton Intelligence Module — Types ─────────────────────────────────
// Zero dependency on the rest of the PRATIBHA codebase.

export type AgeBand = "U10" | "U12" | "U14" | "U16";
export type Gender = "Male" | "Female";
export type DominantHand = "Right" | "Left";
export type AcademyBatch = "Morning Elite" | "Evening Development" | "Weekend Grassroots";

export type FlagStatus =
  | "CLEAN"
  | "AUTO_CORRECTED_UNIT"   // RT entered as seconds → converted to ms
  | "AUTO_CORRECTED_VJ"     // VJ entered as wall-reach → net jump computed
  | "VERIFY_RT_LOW"         // RT < 110ms: extraordinary, verify equipment
  | "VERIFY_SKILL_LENIENCY" // all skill scores ≥ 9
  | "VERIFY_BII_TALENT"     // BII > 88 with years_playing < 1
  | "VERIFY_WINGSPAN"       // wingspan > height + 18cm
  | "BLOCKED_RT"            // RT < 80ms: physically impossible
  | "BLOCKED_VJ"            // VJ > 120cm
  | "BLOCKED_SHUTTLE_LOW"   // four_corner_shuttle_run < 8s
  | "BLOCKED_GRIP"          // grip > 65kg
  | "BLOCKED_BEEP"          // beep level > 15
  | "BLOCKED_SKILL";        // skill score outside 1–10

export interface RawBadmintonAthlete {
  // IDENTITY
  id: string;
  name: string;
  date_of_birth: string;        // ISO YYYY-MM-DD
  gender: Gender;
  dominant_hand: DominantHand;
  years_playing_badminton: number;
  academy_batch: AcademyBatch;
  coach_name: string;

  // ANTHROPOMETRIC
  height_cm: number;
  weight_kg: number;
  wingspan_cm?: number;         // if missing: proxy = height_cm, flagged
  standing_reach_cm?: number;   // used for VJ dual-convention correction

  // PHYSICAL TESTS (as entered — may need auto-correction)
  reaction_time_ms?: number;
  four_corner_shuttle_run_sec?: number;
  ten_by_five_shuttle_run_sec?: number;
  vertical_jump_cm?: number;
  standing_broad_jump_cm?: number;
  beep_test_level?: number;
  grip_strength_kg?: number;
  shuttlecock_throw_m?: number;
  situps_30sec?: number;
  pushups_30sec?: number;
  sit_and_reach_cm?: number;

  // SKILL SCORES (coach-rated 1–10)
  footwork_efficiency?: number;
  stroke_mechanics?: number;
  smash_quality?: number;
  net_play?: number;
  serve_accuracy?: number;
  court_awareness?: number;
  coachability?: number;
  mental_resilience?: number;
}

// ─── Processed athlete (after engine runs) ─────────────────────────────────

export interface CorrectedPhysicals {
  reaction_time_ms?: number;
  four_corner_shuttle_run_sec?: number;
  ten_by_five_shuttle_run_sec?: number;
  vertical_jump_cm?: number;        // net jump, corrected if wall-reach detected
  standing_broad_jump_cm?: number;
  beep_test_level?: number;
  grip_strength_kg?: number;
  shuttlecock_throw_m?: number;
  situps_30sec?: number;
  pushups_30sec?: number;
  sit_and_reach_cm?: number;
}

export interface PercentileBreakdown {
  reaction?: number;           // individual percentile (0–100)
  four_corner?: number;
  ten_by_five?: number;
  vertical_jump?: number;
  broad_jump?: number;
  beep_test?: number;
  grip?: number;
  shuttlecock_throw?: number;
  situps?: number;
  pushups?: number;
  sit_reach?: number;
}

export interface SecondaryScores {
  agility?: number;            // mean of four_corner + ten_by_five (weight 0.223)
  strength?: number;           // mean of vj + bj + grip (weight 0.217)
  endurance?: number;          // mean of beep + situps + pushups (weight 0.210)
  flexibility?: number;        // sit_reach (weight 0.189)
  speed?: number;              // reaction_time (weight 0.161)
}

export interface BIIBreakdown {
  spf_norm?: number;           // Specialized Physical Fitness (0–100)
  bpf?: number;                // Basic Physical Fitness (0–100)
  bm?: number;                 // Body Morphology (0–100)
  bii?: number;                // Final BII (0–100)
  physicalTestCount: number;   // how many of 11 tests are valid
  isSufficient: boolean;       // ≥6 tests required
  missingComponents: string[]; // which secondary indicators are missing
}

export interface SQBreakdown {
  raw?: number;                // weighted raw (0–10 scale)
  pct?: number;                // ×10 → 0–100
  isPartial: boolean;          // <6 of 8 skills entered
  hasLeniencyFlag: boolean;    // all scores ≥9
}

export type QuadrantLabel =
  | "CHAMPION_PROFILE"
  | "RAW_PHYSICAL_TALENT"
  | "SKILL_FIRST"
  | "EARLY_DEVELOPMENT";

export interface RecommendationTag {
  icon: string;
  label: string;
  colour: "gold" | "blue" | "green" | "grey" | "amber";
}

export interface ProcessedBadmintonAthlete {
  raw: RawBadmintonAthlete;
  age: number;
  age_band: AgeBand;
  corrected: CorrectedPhysicals;
  bmi: number;
  wingspanProxy: boolean;      // true if wingspan was missing, height used
  flags: FlagStatus[];
  isBlocked: boolean;
  percentiles: PercentileBreakdown;
  secondary: SecondaryScores;
  bii: BIIBreakdown;
  sq: SQBreakdown;
  quadrant?: QuadrantLabel;
  recommendation: RecommendationTag;
}

export interface NormBand {
  p25: number;
  p50: number;
  p75: number;
}

export type AgeBandKey = "U10" | "U12" | "U14" | "U16";
export type GenderKey = "M" | "F";

export type NormTable = Record<AgeBandKey, Record<GenderKey, NormBand>>;
