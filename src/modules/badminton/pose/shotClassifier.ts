// ─── Shot Classifier v2 — 8 Shot Types + Phase Detection ──────────────────
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";
import { extractAngles, detectHandedness, type JointAngles } from "./biomechanics";

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
  allScores: { type: ShotType; score: number }[]; // for transparency
}

const MIN_SCORE = 0.25;

function kpValid(keypoints: Keypoint[], idx: number): Keypoint | null {
  const k = keypoints[idx];
  return k && k.score >= MIN_SCORE ? k : null;
}

/** Detect shot phase from body configuration */
function detectPhase(keypoints: Keypoint[], angles: JointAngles): ShotPhase {
  const hand = angles.handedness;
  const isRight = hand === "right";

  const wrist = kpValid(keypoints, isRight ? KI.right_wrist : KI.left_wrist);
  const elbow = kpValid(keypoints, isRight ? KI.right_elbow : KI.left_elbow);
  const shoulder = kpValid(keypoints, isRight ? KI.right_shoulder : KI.left_shoulder);
  const nose = kpValid(keypoints, KI.nose);

  if (!wrist || !shoulder) return "unknown";

  // Preparation: racket arm behind/above head, elbow bent
  if (wrist.y < (nose?.y ?? shoulder.y) && angles.racketElbow != null && angles.racketElbow < 120) {
    return "preparation";
  }

  // Contact: arm extended, wrist at highest or most forward point
  if (angles.racketElbow != null && angles.racketElbow > 145) {
    return "contact";
  }

  // Follow-through: arm past contact, moving down
  if (wrist.y > shoulder.y && angles.racketElbow != null && angles.racketElbow > 120) {
    return "follow-through";
  }

  // Ready position: both arms in front, knees bent
  if (angles.stanceWidth != null && angles.stanceWidth > 1.5 &&
      angles.frontKnee != null && angles.frontKnee < 160) {
    return "ready";
  }

  return "unknown";
}

/** Classify shot type from keypoints — 8 types with normalized scoring */
export function classifyShot(keypoints: Keypoint[]): ClassificationResult {
  const angles = extractAngles(keypoints);
  const hand = angles.handedness;
  const isRight = hand === "right";

  const racketWrist = kpValid(keypoints, isRight ? KI.right_wrist : KI.left_wrist);
  const racketShoulder = kpValid(keypoints, isRight ? KI.right_shoulder : KI.left_shoulder);
  const balanceShoulder = kpValid(keypoints, isRight ? KI.left_shoulder : KI.right_shoulder);
  const nose = kpValid(keypoints, KI.nose);

  const wristAboveHead = racketWrist && nose && racketWrist.y < nose.y;
  const wristBelowShoulder = racketWrist && racketShoulder && racketWrist.y > racketShoulder.y;

  // Arm crossing body midline (for backhand detection)
  const armCrossing = racketWrist && balanceShoulder && racketShoulder &&
    (isRight
      ? racketWrist.x < (balanceShoulder.x + racketShoulder.x) / 2
      : racketWrist.x > (balanceShoulder.x + racketShoulder.x) / 2);

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

  // Helper to add weighted feature
  const add = (type: ShotType, weight: number, reason: string) => {
    scores[type].score += weight;
    scores[type].reasons.push(reason);
  };

  // ── SMASH: full extension overhead, aggressive forward lean ──
  if (angles.racketElbow != null && angles.racketElbow > 150) add("Smash", 0.25, "full arm extension");
  if (wristAboveHead) add("Smash", 0.30, "overhead contact point");
  if (angles.torsoLean != null && angles.torsoLean > 15) add("Smash", 0.20, "aggressive forward lean");
  if (angles.racketShoulder != null && angles.racketShoulder > 130) add("Smash", 0.15, "wide open shoulder");
  if (angles.shoulderRotation != null && angles.shoulderRotation > 15) add("Smash", 0.10, "torso rotation");

  // ── CLEAR: overhead but more upright, weight transfer back ──
  if (wristAboveHead) add("Clear", 0.25, "overhead position");
  if (angles.racketElbow != null && angles.racketElbow > 140) add("Clear", 0.20, "extended arm");
  if (angles.torsoLean != null && angles.torsoLean < 15 && angles.torsoLean > 3) add("Clear", 0.25, "controlled upright stance");
  if (angles.racketShoulder != null && angles.racketShoulder > 110) add("Clear", 0.15, "open shoulder");
  if (angles.backKnee != null && angles.backKnee > 150) add("Clear", 0.15, "weight on back leg");

  // ── DROP SHOT: overhead but with bent elbow (deceleration) ──
  if (wristAboveHead) add("Drop Shot", 0.20, "overhead position");
  if (angles.racketElbow != null && angles.racketElbow > 100 && angles.racketElbow < 150) add("Drop Shot", 0.30, "controlled bent elbow (decel)");
  if (angles.torsoLean != null && angles.torsoLean < 12) add("Drop Shot", 0.20, "minimal forward lean");
  if (angles.balanceElbow != null && angles.balanceElbow < 120) add("Drop Shot", 0.15, "compact balance arm");

  // ── NET DROP: deep lunge at net ──
  const frontKnee = angles.frontKnee;
  if (frontKnee != null && frontKnee < 140) add("Net Drop", 0.30, "deep forward lunge");
  if (wristBelowShoulder) add("Net Drop", 0.25, "low racket position");
  if (angles.stanceWidth != null && angles.stanceWidth > 1.5) add("Net Drop", 0.20, "wide lunge stance");
  if (angles.torsoLean != null && angles.torsoLean > 20) add("Net Drop", 0.15, "forward body reach");
  if (angles.racketElbow != null && angles.racketElbow < 140) add("Net Drop", 0.10, "controlled arm");

  // ── DRIVE: mid-height, arm extended sideways ──
  if (racketWrist && racketShoulder && Math.abs(racketWrist.y - racketShoulder.y) < 40) add("Drive", 0.30, "mid-height contact");
  if (angles.racketElbow != null && angles.racketElbow > 130) add("Drive", 0.25, "extended arm at mid-body");
  if (angles.torsoLean != null && angles.torsoLean < 15) add("Drive", 0.20, "upright posture");
  if (angles.stanceWidth != null && angles.stanceWidth > 1.0 && angles.stanceWidth < 1.8) add("Drive", 0.15, "moderate stance");

  // ── DEFENSE: wide ready stance, compact arms ──
  if (angles.stanceWidth != null && angles.stanceWidth > 1.8) add("Defense", 0.30, "wide defensive base");
  const avgKnee = ((angles.frontKnee ?? 180) + (angles.backKnee ?? 180)) / 2;
  if (avgKnee < 160) add("Defense", 0.25, "bent ready knees");
  if (angles.torsoLean != null && angles.torsoLean < 10) add("Defense", 0.20, "upright balanced torso");
  if (angles.racketElbow != null && angles.racketElbow < 130) add("Defense", 0.15, "compact racket arm");
  if (!wristAboveHead && wristBelowShoulder) add("Defense", 0.10, "low ready position");

  // ── BACKHAND CLEAR: arm crossing, overhead with rotation ──
  if (armCrossing) add("Backhand Clear", 0.35, "racket arm crossing body");
  if (angles.racketElbow != null && angles.racketElbow > 130) add("Backhand Clear", 0.20, "arm extension");
  if (wristAboveHead) add("Backhand Clear", 0.20, "high contact point");
  if (angles.shoulderRotation != null && angles.shoulderRotation > 20) add("Backhand Clear", 0.15, "significant body rotation");

  // ── SERVE: one arm high (racket), slight lean, preparation stance ──
  if (wristAboveHead && angles.racketElbow != null && angles.racketElbow < 130) add("Serve", 0.30, "arm cocked overhead");
  if (angles.torsoLean != null && angles.torsoLean > 5 && angles.torsoLean < 20) add("Serve", 0.20, "slight forward lean");
  if (angles.stanceWidth != null && angles.stanceWidth < 1.3) add("Serve", 0.25, "narrow service stance");
  if (angles.frontKnee != null && angles.frontKnee > 150) add("Serve", 0.15, "upright front leg");

  // Normalize all scores to 0-1 range
  const maxPossible = 1.0;
  for (const key of Object.keys(scores) as ShotType[]) {
    scores[key].score = Math.min(scores[key].score / maxPossible, 1.0);
  }

  // Find best match
  const sortedTypes = (Object.entries(scores) as [ShotType, Score][])
    .sort((a, b) => b[1].score - a[1].score);

  let bestType = sortedTypes[0][0];
  let bestScore = sortedTypes[0][1].score;

  if (bestScore < 0.25) {
    bestType = "Unknown";
    bestScore = 0.05;
  }

  // Detect phase
  const phase = detectPhase(keypoints, angles);

  // All scores for transparency
  const allScores = sortedTypes
    .filter(([, s]) => s.score > 0.1)
    .map(([type, s]) => ({ type, score: Math.round(s.score * 100) / 100 }));

  return {
    shotType: bestType,
    phase,
    confidence: Math.min(1, bestScore),
    angles,
    reasoning: scores[bestType].reasons.join(", ") || "Insufficient keypoint data",
    allScores,
  };
}
