// ─── Reference Models v3 — Research-Calibrated Professional Templates ─────
// Angle values derived from:
// - Guo & Lin 2026 (JHSE): Smash kinematic chain analysis, n=40 national level
// - Rusdiana et al. (AASSJ): Forehand/backhand smash kinematics
// - JoVE 2019: Professional lunge biomechanics protocol
// - BMC Sports Sci 2025: Forehand clear novice vs experienced
// - Larasaty et al. 2025: Serve wrist/elbow IMU analysis
import type { JointAngles } from "./biomechanics";
import type { ShotType } from "./shotClassifier";

export interface ReferenceModel {
  shotType: ShotType;
  label: string;
  description: string;
  icon: string;
  color: string;
  angles: JointAngles;
  keyCoachingPoints: string[];
  source: string; // Research attribution
}

export const REFERENCE_MODELS: Record<Exclude<ShotType, "Unknown">, ReferenceModel> = {
  Smash: {
    shotType: "Smash",
    label: "Overhead Smash",
    description: "Maximum power shot — dynamic chain transmits knee→hip→shoulder→elbow→wrist. Contact at highest reachable point with near-full elbow extension and aggressive forward weight transfer.",
    icon: "💥",
    color: "#ef4444",
    angles: {
      // Elbow near full extension at contact (research: peak elbow extension ~167°/s angular velocity)
      racketElbow: 168,
      // Shoulder fully open for overhead reach
      racketShoulder: 160,
      // Balance arm tucked for counterbalance (Gopichand coaching point)
      balanceElbow: 85,
      balanceShoulder: 65,
      // Lead leg slightly bent for stability after weight transfer
      frontKnee: 155,
      // Rear leg extends as push-off completes
      backKnee: 162,
      // Forward lean for aggressive angle of attack
      torsoLean: 18,
      // Shoulder-hip separation for kinetic chain power
      shoulderRotation: 25,
      // Moderate stance during airborne/landing phase
      stanceWidth: 1.2,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Elbow near full extension at contact (~168°) — the 'whip' comes from the kinetic chain, not forced arm straightening",
      "Contact shuttle at the highest reachable point above the racket shoulder",
      "Dynamic chain sequence: ground→knee→hip→shoulder→elbow→wrist (Guo & Lin 2026)",
      "Aggressive forward weight transfer — torso lean ~18° at contact",
      "Non-racket arm tucks in as counterbalance (not hanging loose)",
      "Wrist pronation at contact for racket head speed — this is where shuttle speed comes from",
    ],
    source: "Guo & Lin 2026 (JHSE); Rusdiana et al.",
  },
  Clear: {
    shotType: "Clear",
    label: "Forehand Clear",
    description: "High deep baseline-to-baseline shot — similar preparation to smash but with more upright torso for height and depth. Power generated through shoulder rotation.",
    icon: "🌊",
    color: "#3b82f6",
    angles: {
      racketElbow: 158,
      racketShoulder: 145,
      balanceElbow: 95,
      balanceShoulder: 70,
      frontKnee: 158,
      backKnee: 165,
      // More upright than smash — sending shuttle UP and DEEP
      torsoLean: 10,
      shoulderRotation: 22,
      stanceWidth: 1.1,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Same preparation as smash for deception — opponent can't read intention",
      "More upright torso than smash (~10° vs ~18°) to direct shuttle upward",
      "Full arm extension similar to smash but contact angle directs shuttle high",
      "Generate depth through shoulder rotation, not just arm speed",
      "Weight stays slightly more on back foot compared to smash",
    ],
    source: "BMC Sports Sci 2025; coaching consensus",
  },
  "Drop Shot": {
    shotType: "Drop Shot",
    label: "Forehand Drop",
    description: "Deceptive overhead shot — identical preparation to smash/clear but with controlled deceleration before contact. The 'touch' shot.",
    icon: "🪶",
    color: "#8b5cf6",
    angles: {
      // Key differentiator: elbow NOT fully extended (deceleration)
      racketElbow: 132,
      racketShoulder: 128,
      balanceElbow: 90,
      balanceShoulder: 68,
      frontKnee: 158,
      backKnee: 162,
      // Minimal lean — controlled, not aggressive
      torsoLean: 7,
      shoulderRotation: 14,
      stanceWidth: 1.1,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Preparation must look IDENTICAL to smash/clear — this is what makes it effective",
      "Decelerate the racket head just before contact — elbow stays bent (~132°)",
      "Minimal follow-through — 'catch' the shuttle with the string bed",
      "Torso stays upright (~7°) — no aggressive forward lean",
      "Wrist controls angle and spin — fingertip power, not arm power",
    ],
    source: "Coaching consensus; kinematic deduction",
  },
  "Net Drop": {
    shotType: "Net Drop",
    label: "Net Drop / Net Kill",
    description: "Front court finesse — deep forward lunge with racket arm controlled at low height. Contact at tape height with deceptive wrist work.",
    icon: "🎯",
    color: "#10b981",
    angles: {
      // Arm controlled, not extended overhead
      racketElbow: 125,
      racketShoulder: 80,
      balanceElbow: 105,
      balanceShoulder: 55,
      // Deep lunge: ~95-105° (research: JoVE 2019 professional lunge protocol)
      frontKnee: 100,
      backKnee: 162,
      // Significant forward lean to reach the net
      torsoLean: 25,
      shoulderRotation: 8,
      // Very wide stance in full lunge
      stanceWidth: 2.0,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Deep lunge — lead knee ~100° (near right angle) for maximum reach",
      "Racket arm controlled at net height — elbow ~125°, not fully extended",
      "Contact shuttle at tape height or above — never let it drop below",
      "Rear leg fully extended for balance and push-off recovery",
      "Deceptive wrist for cross-net, straight, or spin net shots",
      "Wide base (~2× shoulder width) for stability in the lunge",
    ],
    source: "JoVE 2019 lunge biomechanics; BMC Sports Sci 2025",
  },
  Drive: {
    shotType: "Drive",
    label: "Forehand Drive",
    description: "Fast flat shot at mid-height — compact arm extension with quick swing. Emphasizes racket head speed over body rotation.",
    icon: "➡️",
    color: "#f59e0b",
    angles: {
      racketElbow: 148,
      racketShoulder: 105,
      balanceElbow: 95,
      balanceShoulder: 60,
      frontKnee: 155,
      backKnee: 158,
      torsoLean: 8,
      shoulderRotation: 18,
      stanceWidth: 1.3,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Contact at shoulder height — flat trajectory to opponent's mid-body",
      "Quick compact swing — minimal backswing for speed of execution",
      "Arm extends to ~148° at contact — not full extension like overhead shots",
      "Weight centered for quick directional change after the shot",
      "Elbow leads the swing, then wrist snaps through",
    ],
    source: "Coaching consensus; biomechanical deduction",
  },
  Defense: {
    shotType: "Defense",
    label: "Defensive Stance / Lift",
    description: "Wide ready position for receiving smash — low center of gravity, equal knee bend, reactive posture for any direction.",
    icon: "🛡️",
    color: "#6366f1",
    angles: {
      // Both arms in front, elbows bent equally
      racketElbow: 110,
      racketShoulder: 55,
      balanceElbow: 110,
      balanceShoulder: 55,
      // Equal knee bend — ready to spring in any direction
      frontKnee: 140,
      backKnee: 140,
      // Upright torso for balance
      torsoLean: 5,
      // Minimal rotation — symmetrical ready position
      shoulderRotation: 3,
      // Widest stance for defensive coverage
      stanceWidth: 2.2,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Widest base in badminton — feet ~2.2× shoulder width apart",
      "Both knees bent equally at ~140° — spring-loaded to react",
      "Upright torso (~5° lean) for maximum balance",
      "Racket held in front at waist-to-chest height",
      "Weight on balls of feet — heels barely touching the ground",
      "Symmetrical posture — ready for forehand or backhand return",
    ],
    source: "Standard coaching methodology",
  },
  "Backhand Clear": {
    shotType: "Backhand Clear",
    label: "Backhand Clear",
    description: "Cross-body overhead reach — significant upper-body rotation with racket arm crossing the body midline. Requires excellent shoulder flexibility.",
    icon: "↩️",
    color: "#ec4899",
    angles: {
      racketElbow: 152,
      racketShoulder: 135,
      balanceElbow: 85,
      balanceShoulder: 50,
      frontKnee: 152,
      backKnee: 158,
      torsoLean: 16,
      // Key differentiator: significant shoulder-hip separation
      shoulderRotation: 35,
      stanceWidth: 1.3,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Significant shoulder-hip rotation (~35°) — this generates power on the backhand side",
      "Racket arm crosses body midline — this is the primary identifier",
      "Near full extension at contact (~152°) for reach and power",
      "Use body rotation to generate power, NOT just arm swing",
      "Quick recovery turn after contact — don't stay with back to net",
    ],
    source: "Rusydi et al. 2015 (IMU euler angles); Rusdiana et al.",
  },
  Serve: {
    shotType: "Serve",
    label: "Service Action",
    description: "Controlled preparation — racket arm cocked, narrow stance, shuttle held in non-racket hand. Forearm is dominant power source in forehand serve.",
    icon: "🏸",
    color: "#14b8a6",
    angles: {
      // Elbow bent in preparation (cocked position)
      racketElbow: 108,
      racketShoulder: 95,
      // Non-racket arm holds shuttle — extended forward
      balanceElbow: 125,
      balanceShoulder: 40,
      // Legs nearly straight in service position
      frontKnee: 168,
      backKnee: 172,
      // Slight forward lean
      torsoLean: 8,
      shoulderRotation: 12,
      // Narrow stance for service (BWF rules)
      stanceWidth: 0.8,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Narrow stance — feet close together (~0.8× shoulder width) per BWF service rules",
      "Racket arm cocked with elbow bent ~108° — ready to swing forward",
      "Non-racket hand holds shuttle at waist height, arm extended (~125°)",
      "Contact MUST be below waist level (BWF Laws of Badminton)",
      "Forearm generates primary power in forehand serve (Larasaty 2025)",
      "Wrist controls direction and spin — backhand serves use more wrist",
    ],
    source: "Larasaty et al. 2025 (IMU analysis); BWF Laws",
  },
};

export function getReferenceModel(shotType: ShotType): ReferenceModel | null {
  if (shotType === "Unknown") return null;
  return REFERENCE_MODELS[shotType] ?? null;
}

export function getAllReferenceModels(): ReferenceModel[] {
  return Object.values(REFERENCE_MODELS);
}
