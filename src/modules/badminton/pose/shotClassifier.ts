// ─── Shot Classifier v3 — Research-Calibrated, 8 Shot Types ──────────────
// Phase detection thresholds from: Guo & Lin 2026, Rusdiana et al.
// Dynamic chain: knee→hip→shoulder→elbow→wrist (Guo & Lin 2026)
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";
import { extractAngles, detectHandedness, angleBetween, type JointAngles } from "./biomechanics";

export type ShotType =
  | "Smash"
  | "Clear"
  | "Drop Shot"
  | "Net Drop"
  | "Drive"
  | "Defense"
  | "Backhand Clear"
  | "Serve"
  | "Unknown";

export type ShotPhase = "preparation" | "contact" | "follow-through" | "ready" | "unknown";

export interface ClassificationResult {
  shotType: ShotType;
  phase: ShotPhase;
  confidence: number;
  angles: JointAngles;
  reasoning: string;
  allScores: { type: ShotType; score: number }[];
}

const MIN_SCORE = 0.20;

function kpValid(keypoints: Keypoint[], idx: number): Keypoint | null {
  const k = keypoints[idx];
  return k && k.score >= MIN_SCORE ? k : null;
}

/** Detect shot phase from body configuration.
 *  Research-calibrated thresholds:
 *  - Preparation: elbow flexed < 110° (arm cocked), wrist above head
 *  - Contact: elbow extended > 155° (near full extension at impact)
 *  - Follow-through: wrist below shoulder, arm still extended > 120° */
function detectPhase(keypoints: Keypoint[], angles: JointAngles): ShotPhase {
  const hand = angles.handedness;
  const isRight = hand === "right";

  const wrist = kpValid(keypoints, isRight ? KI.right_wrist : KI.left_wrist);
  const shoulder = kpValid(keypoints, isRight ? KI.right_shoulder : KI.left_shoulder);
  const nose = kpValid(keypoints, KI.nose);

  if (!wrist || !shoulder) return "unknown";

  // Preparation: racket arm cocked behind head, elbow bent
  // Research: elbow flexion phase precedes extension (Guo & Lin 2026)
  if (wrist.y < (nose?.y ?? shoulder.y) &&
      angles.racketElbow != null && angles.racketElbow < 110) {
    return "preparation";
  }

  // Contact: near-full arm extension at highest point
  // Research: elbow extension peaks at ~167° angular velocity (Guo & Lin 2026)
  if (angles.racketElbow != null && angles.racketElbow > 155) {
    return "contact";
  }

  // Follow-through: arm past contact, wrist dropping below shoulder
  if (wrist.y > shoulder.y &&
      angles.racketElbow != null && angles.racketElbow > 120) {
    return "follow-through";
  }

  // Ready position: wide stance, knees bent, balanced
  if (angles.stanceWidth != null && angles.stanceWidth > 1.5 &&
      angles.frontKnee != null && angles.frontKnee < 155 &&
      angles.backKnee != null && angles.backKnee < 155) {
    return "ready";
  }

  return "unknown";
}

/** Classify shot type from keypoints — 8 types with research-calibrated scoring.
 *
 *  Classification uses a weighted feature-based approach where each shot type
 *  accumulates evidence from multiple biomechanical indicators. Weights reflect
 *  the discriminative power of each feature based on kinematic literature.
 */
export function classifyShot(keypoints: Keypoint[]): ClassificationResult {
  const angles = extractAngles(keypoints);
  const hand = angles.handedness;
  const isRight = hand === "right";

  const racketWrist = kpValid(keypoints, isRight ? KI.right_wrist : KI.left_wrist);
  const racketShoulder = kpValid(keypoints, isRight ? KI.right_shoulder : KI.left_shoulder);
  const balanceShoulder = kpValid(keypoints, isRight ? KI.left_shoulder : KI.right_shoulder);
  const racketElbow = kpValid(keypoints, isRight ? KI.right_elbow : KI.left_elbow);
  const nose = kpValid(keypoints, KI.nose);

  const wristAboveHead = racketWrist && nose && racketWrist.y < nose.y;
  const wristAboveShoulder = racketWrist && racketShoulder && racketWrist.y < racketShoulder.y;
  const wristBelowShoulder = racketWrist && racketShoulder && racketWrist.y > racketShoulder.y;
  const wristNearShoulder = racketWrist && racketShoulder &&
    Math.abs(racketWrist.y - racketShoulder.y) < (nose && racketShoulder ? Math.abs(nose.y - racketShoulder.y) * 0.5 : 40);

  // Arm crossing body midline (backhand detection)
  const armCrossing = racketWrist && balanceShoulder && racketShoulder && (
    isRight
      ? racketWrist.x < balanceShoulder.x
      : racketWrist.x > balanceShoulder.x
  );

  type Score = { score: number; reasons: string[] };
  const scores: Record<ShotType, Score> = {
    Smash: { score: 0, reasons: [] },
    Clear: { score: 0, reasons: [] },
    "Drop Shot": { score: 0, reasons: [] },
    "Net Drop": { score: 0, reasons: [] },
    Drive: { score: 0, reasons: [] },
    Defense: { score: 0, reasons: [] },
    "Backhand Clear": { score: 0, reasons: [] },
    Serve: { score: 0, reasons: [] },
    Unknown: { score: 0.05, reasons: ["insufficient data"] },
  };

  const add = (type: ShotType, weight: number, reason: string) => {
    scores[type].score += weight;
    scores[type].reasons.push(reason);
  };

  // ══════════════════════════════════════════════════════════════════════
  // SMASH: Full extension overhead, aggressive forward lean, rotation
  // Key: elbow > 155° at contact, wrist above head, torso lean > 15°
  // Research: dynamic chain peaks at wrist (173°/s angular velocity)
  // ══════════════════════════════════════════════════════════════════════
  if (angles.racketElbow != null && angles.racketElbow > 155) add("Smash", 0.25, "full arm extension (>155°)");
  else if (angles.racketElbow != null && angles.racketElbow > 140) add("Smash", 0.10, "near-full extension");
  if (wristAboveHead) add("Smash", 0.30, "overhead contact point");
  if (angles.torsoLean != null && angles.torsoLean > 15) add("Smash", 0.20, "aggressive forward lean (>15°)");
  if (angles.racketShoulder != null && angles.racketShoulder > 140) add("Smash", 0.10, "wide open shoulder (>140°)");
  if (angles.shoulderRotation != null && angles.shoulderRotation > 15) add("Smash", 0.10, "torso rotation for power");
  // Negative: penalize if NOT overhead
  if (!wristAboveHead && !wristAboveShoulder) scores.Smash.score *= 0.3;

  // ══════════════════════════════════════════════════════════════════════
  // CLEAR: Overhead but more upright, controlled power for depth
  // Key: overhead contact, torso lean 5-15° (controlled), back leg supports
  // ══════════════════════════════════════════════════════════════════════
  if (wristAboveHead) add("Clear", 0.25, "overhead position");
  if (angles.racketElbow != null && angles.racketElbow > 140) add("Clear", 0.20, "extended arm");
  if (angles.torsoLean != null && angles.torsoLean >= 3 && angles.torsoLean <= 18)
    add("Clear", 0.25, "controlled upright stance (3-18°)");
  if (angles.racketShoulder != null && angles.racketShoulder > 110) add("Clear", 0.15, "open shoulder");
  if (angles.backKnee != null && angles.backKnee > 145) add("Clear", 0.10, "weight transfer back");
  if (!wristAboveHead) scores.Clear.score *= 0.3;

  // ══════════════════════════════════════════════════════════════════════
  // DROP SHOT: Overhead but with controlled deceleration
  // Key: elbow 100-150° (NOT fully extended), minimal lean, soft touch
  // ══════════════════════════════════════════════════════════════════════
  if (wristAboveHead) add("Drop Shot", 0.20, "overhead position");
  if (angles.racketElbow != null && angles.racketElbow > 100 && angles.racketElbow < 155)
    add("Drop Shot", 0.30, "controlled bent elbow (deceleration)");
  if (angles.torsoLean != null && angles.torsoLean < 12) add("Drop Shot", 0.20, "minimal forward lean");
  if (angles.balanceElbow != null && angles.balanceElbow < 120) add("Drop Shot", 0.15, "compact balance arm");
  if (angles.racketElbow != null && angles.racketElbow > 155)
    scores["Drop Shot"].score *= 0.5; // Penalize full extension (that's smash/clear)

  // ══════════════════════════════════════════════════════════════════════
  // NET DROP: Deep lunge at net, racket low
  // Key: front knee < 130° (deep lunge), racket below shoulder, wide stance
  // Research: professional lunge shows 90-110° knee angle (JoVE 2019)
  // ══════════════════════════════════════════════════════════════════════
  if (angles.frontKnee != null && angles.frontKnee < 130) add("Net Drop", 0.30, "deep forward lunge (<130°)");
  if (wristBelowShoulder) add("Net Drop", 0.25, "low racket position");
  if (angles.stanceWidth != null && angles.stanceWidth > 1.5) add("Net Drop", 0.20, "wide lunge stance");
  if (angles.torsoLean != null && angles.torsoLean > 18) add("Net Drop", 0.15, "forward body reach");
  if (angles.racketElbow != null && angles.racketElbow < 145) add("Net Drop", 0.10, "controlled arm");
  if (wristAboveHead) scores["Net Drop"].score *= 0.2; // Strongly penalize overhead

  // ══════════════════════════════════════════════════════════════════════
  // DRIVE: Mid-height flat shot, arm extended sideways
  // Key: wrist near shoulder height, extended arm, upright torso
  // ══════════════════════════════════════════════════════════════════════
  if (wristNearShoulder) add("Drive", 0.30, "mid-height contact");
  if (angles.racketElbow != null && angles.racketElbow > 130) add("Drive", 0.25, "extended arm at mid-body");
  if (angles.torsoLean != null && angles.torsoLean < 15) add("Drive", 0.20, "upright posture");
  if (angles.stanceWidth != null && angles.stanceWidth > 1.0 && angles.stanceWidth < 1.8)
    add("Drive", 0.15, "moderate athletic stance");
  if (wristAboveHead) scores.Drive.score *= 0.3; // Penalize overhead

  // ══════════════════════════════════════════════════════════════════════
  // DEFENSE: Wide ready stance, compact arms, balanced
  // Key: wide stance > 1.8×, both knees bent, upright, low racket
  // ══════════════════════════════════════════════════════════════════════
  if (angles.stanceWidth != null && angles.stanceWidth > 1.8) add("Defense", 0.30, "wide defensive base (>1.8×)");
  const avgKnee = ((angles.frontKnee ?? 180) + (angles.backKnee ?? 180)) / 2;
  if (avgKnee < 155) add("Defense", 0.25, "bent ready knees");
  if (angles.torsoLean != null && angles.torsoLean < 10) add("Defense", 0.20, "upright balanced torso");
  if (angles.racketElbow != null && angles.racketElbow < 130) add("Defense", 0.15, "compact racket arm");
  if (!wristAboveHead && wristBelowShoulder) add("Defense", 0.10, "low ready position");

  // ══════════════════════════════════════════════════════════════════════
  // BACKHAND CLEAR: Arm crosses body midline, overhead with significant rotation
  // Research: backhand shows different local euler angle gradients (Rusydi 2015)
  // ══════════════════════════════════════════════════════════════════════
  if (armCrossing) add("Backhand Clear", 0.35, "racket arm crosses body midline");
  if (angles.racketElbow != null && angles.racketElbow > 130) add("Backhand Clear", 0.20, "arm extension");
  if (wristAboveHead) add("Backhand Clear", 0.15, "high contact point");
  if (angles.shoulderRotation != null && angles.shoulderRotation > 20)
    add("Backhand Clear", 0.20, "significant body rotation (>20°)");
  if (!armCrossing) scores["Backhand Clear"].score *= 0.3; // Strong penalty

  // ══════════════════════════════════════════════════════════════════════
  // SERVE: Arm cocked overhead, narrow stance, preparation position
  // Key: elbow bent < 125° (cocked), narrow stance < 1.2×, upright front leg
  // Research: forearm dominant in forehand serve power (Larasaty 2025)
  // ══════════════════════════════════════════════════════════════════════
  if (wristAboveHead && angles.racketElbow != null && angles.racketElbow < 125)
    add("Serve", 0.30, "arm cocked overhead");
  if (angles.torsoLean != null && angles.torsoLean > 3 && angles.torsoLean < 18)
    add("Serve", 0.20, "slight forward lean");
  if (angles.stanceWidth != null && angles.stanceWidth < 1.2)
    add("Serve", 0.25, "narrow service stance (<1.2×)");
  if (angles.frontKnee != null && angles.frontKnee > 155) add("Serve", 0.15, "upright front leg");

  // ── Normalize and rank ──
  const maxPossible = 1.0;
  for (const key of Object.keys(scores) as ShotType[]) {
    scores[key].score = Math.min(scores[key].score / maxPossible, 1.0);
  }

  const sortedTypes = (Object.entries(scores) as [ShotType, Score][])
    .sort((a, b) => b[1].score - a[1].score);

  let bestType = sortedTypes[0][0];
  let bestScore = sortedTypes[0][1].score;

  // Disambiguation: if top two are very close (< 0.08), add context note
  const secondType = sortedTypes[1]?.[0];
  const secondScore = sortedTypes[1]?.[1]?.score ?? 0;
  let reasoning = scores[bestType].reasons.join(", ") || "Insufficient keypoint data";
  if (secondScore > 0.15 && bestScore - secondScore < 0.08 && secondType !== "Unknown") {
    reasoning += ` (close to ${secondType}: ${Math.round(secondScore * 100)}%)`;
  }

  if (bestScore < 0.20) {
    bestType = "Unknown";
    bestScore = 0.05;
    reasoning = "Insufficient biomechanical features detected for confident classification";
  }

  const phase = detectPhase(keypoints, angles);

  const allScores = sortedTypes
    .filter(([, s]) => s.score > 0.08)
    .map(([type, s]) => ({ type, score: Math.round(s.score * 100) / 100 }));

  return {
    shotType: bestType,
    phase,
    confidence: Math.min(1, bestScore),
    angles,
    reasoning,
    allScores,
  };
}
