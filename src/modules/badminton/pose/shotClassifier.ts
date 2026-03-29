// ─── Shot Classifier — Rule-based from Joint Angles ────────────────────────
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";
import { extractAngles, type JointAngles } from "./biomechanics";

export type ShotType = "Smash" | "Net Drop" | "Defense" | "Backhand Clear" | "Unknown";

export interface ClassificationResult {
  shotType: ShotType;
  confidence: number; // 0–1
  angles: JointAngles;
  reasoning: string;
}

const MIN_SCORE = 0.25;

function kp(keypoints: Keypoint[], idx: number): Keypoint | null {
  const k = keypoints[idx];
  return k && k.score >= MIN_SCORE ? k : null;
}

/** Classify shot type from detected keypoints using angle heuristics */
export function classifyShot(keypoints: Keypoint[]): ClassificationResult {
  const angles = extractAngles(keypoints);

  const rw = kp(keypoints, KI.right_wrist);
  const rs = kp(keypoints, KI.right_shoulder);
  const nose = kp(keypoints, KI.nose);
  const ls = kp(keypoints, KI.left_shoulder);

  // Racket hand above head?
  const wristAboveHead = rw && nose && rw.y < nose.y;

  // Racket arm crossing body midline
  const armCrossing = rw && ls && rs && rw.x < (ls.x + rs.x) / 2;

  // Score each shot type
  const scores: Record<ShotType, { score: number; reason: string }> = {
    Smash: { score: 0, reason: "" },
    "Net Drop": { score: 0, reason: "" },
    Defense: { score: 0, reason: "" },
    "Backhand Clear": { score: 0, reason: "" },
    Unknown: { score: 0.1, reason: "Could not confidently classify" },
  };

  // SMASH: elbow extended, wrist above head, torso leaning forward
  {
    let s = 0;
    const reasons: string[] = [];
    if (angles.rightElbow != null && angles.rightElbow > 140) {
      s += 0.3;
      reasons.push("extended racket arm");
    }
    if (wristAboveHead) {
      s += 0.35;
      reasons.push("wrist above head");
    }
    if (angles.torsoLean != null && angles.torsoLean > 10) {
      s += 0.2;
      reasons.push("forward torso lean");
    }
    if (angles.rightShoulder != null && angles.rightShoulder > 120) {
      s += 0.15;
      reasons.push("open shoulder");
    }
    scores.Smash = { score: s, reason: reasons.join(", ") };
  }

  // NET DROP: deep lunge (front knee < 130°), racket hand at/below shoulder
  {
    let s = 0;
    const reasons: string[] = [];
    const frontKnee = angles.leftKnee ?? angles.rightKnee;
    if (frontKnee != null && frontKnee < 140) {
      s += 0.35;
      reasons.push("deep lunge");
    }
    if (rw && rs && rw.y > rs.y) {
      s += 0.3;
      reasons.push("racket hand below shoulder");
    }
    if (angles.torsoLean != null && angles.torsoLean > 15) {
      s += 0.2;
      reasons.push("forward reach");
    }
    if (angles.stanceWidth != null && angles.stanceWidth > 1.5) {
      s += 0.15;
      reasons.push("wide stance");
    }
    scores["Net Drop"] = { score: s, reason: reasons.join(", ") };
  }

  // DEFENSE: wide stance, low center, arms ready
  {
    let s = 0;
    const reasons: string[] = [];
    if (angles.stanceWidth != null && angles.stanceWidth > 1.8) {
      s += 0.35;
      reasons.push("very wide stance");
    }
    const avgKnee =
      ((angles.leftKnee ?? 180) + (angles.rightKnee ?? 180)) / 2;
    if (avgKnee < 160) {
      s += 0.3;
      reasons.push("bent knees");
    }
    if (angles.torsoLean != null && angles.torsoLean < 10) {
      s += 0.2;
      reasons.push("upright torso");
    }
    if (angles.rightElbow != null && angles.rightElbow < 130) {
      s += 0.15;
      reasons.push("compact arm position");
    }
    scores.Defense = { score: s, reason: reasons.join(", ") };
  }

  // BACKHAND CLEAR: arm crossing body, torso rotation
  {
    let s = 0;
    const reasons: string[] = [];
    if (armCrossing) {
      s += 0.4;
      reasons.push("arm crossing body midline");
    }
    if (angles.rightElbow != null && angles.rightElbow > 130) {
      s += 0.25;
      reasons.push("extended reach");
    }
    if (wristAboveHead) {
      s += 0.2;
      reasons.push("high contact point");
    }
    if (angles.torsoLean != null && angles.torsoLean > 15) {
      s += 0.15;
      reasons.push("body rotation");
    }
    scores["Backhand Clear"] = { score: s, reason: reasons.join(", ") };
  }

  // Pick highest scorer
  let best: ShotType = "Unknown";
  let bestScore = 0;
  for (const [type, { score }] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = type as ShotType;
    }
  }

  // Require minimum threshold
  if (bestScore < 0.3) {
    best = "Unknown";
    bestScore = 0.1;
  }

  return {
    shotType: best,
    confidence: Math.min(1, bestScore),
    angles,
    reasoning: scores[best].reason || "Insufficient keypoint data",
  };
}
