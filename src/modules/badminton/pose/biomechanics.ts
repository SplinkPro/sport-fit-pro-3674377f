// ─── Biomechanics Engine v3 — Research-Calibrated, Olympic-Grade ──────────
// Gaussian scoring, 9 metrics, handedness detection, directional coaching
// References: Guo & Lin 2026 (JHSE), Rusdiana et al. (AASSJ),
// JoVE lunge biomechanics protocol, BMC Sports Sci 2025
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";

const MIN_SCORE = 0.20;

/** Calculate angle at point B given three points A-B-C (degrees) */
export function angleBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2);
  if (magBA === 0 || magBC === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

function kp(keypoints: Keypoint[], idx: number): Keypoint | null {
  const k = keypoints[idx];
  return k && k.score >= MIN_SCORE ? k : null;
}

// ── Handedness Detection ────────────────────────────────────────────────
export type Handedness = "right" | "left";

/** Detect dominant hand using normalized metrics (shoulder-width relative).
 *  Checks: (1) which wrist is higher, (2) which arm is more extended from center,
 *  (3) which elbow is more extended (higher angle = more active) */
export function detectHandedness(keypoints: Keypoint[]): Handedness {
  const lw = kp(keypoints, KI.left_wrist);
  const rw = kp(keypoints, KI.right_wrist);
  const ls = kp(keypoints, KI.left_shoulder);
  const rs = kp(keypoints, KI.right_shoulder);
  const le = kp(keypoints, KI.left_elbow);
  const re = kp(keypoints, KI.right_elbow);

  if (!lw || !rw) return "right"; // default

  let rightSignal = 0;
  let leftSignal = 0;

  // Normalize height difference by shoulder width for scale-independence
  const shoulderWidth = (ls && rs) ? Math.abs(rs.x - ls.x) : 100;
  const normalizedHeightDiff = (rw.y - lw.y) / shoulderWidth;

  // Signal 1: Which wrist is higher (lower Y = higher in image)
  if (normalizedHeightDiff < -0.15) rightSignal += 2;
  else if (normalizedHeightDiff > 0.15) leftSignal += 2;

  // Signal 2: Which arm is more extended from body center
  if (ls && rs) {
    const centerX = (ls.x + rs.x) / 2;
    const leftExt = Math.abs(lw.x - centerX) / shoulderWidth;
    const rightExt = Math.abs(rw.x - centerX) / shoulderWidth;
    if (rightExt > leftExt + 0.2) rightSignal += 1;
    else if (leftExt > rightExt + 0.2) leftSignal += 1;
  }

  // Signal 3: Which elbow is more extended (active arm tends to be straighter at contact)
  if (le && re && ls && rs && lw && rw) {
    const leftElbowAngle = angleBetween(ls, le, lw);
    const rightElbowAngle = angleBetween(rs, re, rw);
    if (rightElbowAngle > leftElbowAngle + 15) rightSignal += 1;
    else if (leftElbowAngle > rightElbowAngle + 15) leftSignal += 1;
  }

  return leftSignal > rightSignal ? "left" : "right";
}

// ── Joint Angles ────────────────────────────────────────────────────────

export interface JointAngles {
  // Racket arm (dominant)
  racketElbow?: number;
  racketShoulder?: number;
  racketWristHeight?: number; // relative to nose (negative = above)
  // Non-racket arm
  balanceElbow?: number;
  balanceShoulder?: number;
  // Lower body — NOTE: In badminton forehand shots, the racket-side leg
  // typically leads the lunge. We detect which leg is forward dynamically.
  frontKnee?: number;
  backKnee?: number;
  frontHip?: number;
  backHip?: number;
  // Core
  torsoLean?: number;
  shoulderRotation?: number;
  stanceWidth?: number;
  // Derived
  centerOfGravity?: number;
  handedness: Handedness;
}

/** Normalize angle difference to [-180, 180] range */
function normalizeAngleDiff(a: number, b: number): number {
  let diff = a - b;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

/** Extract comprehensive joint angles with handedness awareness.
 *  Front/back leg assignment is DYNAMIC — determined by which foot is
 *  further forward (lower X for right-facing, or lower Y for side view),
 *  not hardcoded to a body side. */
export function extractAngles(keypoints: Keypoint[]): JointAngles {
  const hand = detectHandedness(keypoints);
  const isRight = hand === "right";

  // Map to racket/balance sides based on handedness
  const racketShoulder = kp(keypoints, isRight ? KI.right_shoulder : KI.left_shoulder);
  const racketElbow = kp(keypoints, isRight ? KI.right_elbow : KI.left_elbow);
  const racketWrist = kp(keypoints, isRight ? KI.right_wrist : KI.left_wrist);
  const balanceShoulder = kp(keypoints, isRight ? KI.left_shoulder : KI.right_shoulder);
  const balanceElbow = kp(keypoints, isRight ? KI.left_elbow : KI.right_elbow);
  const balanceWrist = kp(keypoints, isRight ? KI.left_wrist : KI.right_wrist);

  const rHip = kp(keypoints, KI.right_hip);
  const lHip = kp(keypoints, KI.left_hip);
  const rKnee = kp(keypoints, KI.right_knee);
  const lKnee = kp(keypoints, KI.left_knee);
  const rAnkle = kp(keypoints, KI.right_ankle);
  const lAnkle = kp(keypoints, KI.left_ankle);
  const nose = kp(keypoints, KI.nose);

  // Determine which side's hip/knee/ankle to use for racket vs balance
  const racketHip = kp(keypoints, isRight ? KI.right_hip : KI.left_hip);
  const balanceHip = kp(keypoints, isRight ? KI.left_hip : KI.right_hip);

  const angles: JointAngles = { handedness: hand };

  // ── Racket arm angles ──
  if (racketShoulder && racketElbow && racketWrist)
    angles.racketElbow = angleBetween(racketShoulder, racketElbow, racketWrist);
  if (racketElbow && racketShoulder && racketHip)
    angles.racketShoulder = angleBetween(racketElbow, racketShoulder, racketHip);
  if (racketWrist && nose)
    angles.racketWristHeight = racketWrist.y - nose.y;

  // ── Balance arm ──
  if (balanceShoulder && balanceElbow && balanceWrist)
    angles.balanceElbow = angleBetween(balanceShoulder, balanceElbow, balanceWrist);
  if (balanceElbow && balanceShoulder && balanceHip)
    angles.balanceShoulder = angleBetween(balanceElbow, balanceShoulder, balanceHip);

  // ── Lower body — DYNAMIC front/back leg detection ──
  // Determine front leg by which ankle is furthest from the body center
  // (the lunging leg extends forward). Use Y position as proxy for
  // "forward" in typical broadcast/side views (lower in frame = closer to camera = forward).
  if (rAnkle && lAnkle && rKnee && lKnee && rHip && lHip) {
    // The foot that is lower in the image (higher Y) is the front foot in most camera angles
    const rForward = rAnkle.y > lAnkle.y;
    const frontAnkle = rForward ? rAnkle : lAnkle;
    const frontKnee = rForward ? rKnee : lKnee;
    const frontHip = rForward ? rHip : lHip;
    const frontShoulder = rForward
      ? kp(keypoints, KI.right_shoulder)
      : kp(keypoints, KI.left_shoulder);
    const backAnkle = rForward ? lAnkle : rAnkle;
    const backKnee = rForward ? lKnee : rKnee;
    const backHip = rForward ? lHip : rHip;
    const backShoulder = rForward
      ? kp(keypoints, KI.left_shoulder)
      : kp(keypoints, KI.right_shoulder);

    angles.frontKnee = angleBetween(frontHip, frontKnee, frontAnkle);
    if (frontShoulder) angles.frontHip = angleBetween(frontShoulder, frontHip, frontKnee);
    angles.backKnee = angleBetween(backHip, backKnee, backAnkle);
    if (backShoulder) angles.backHip = angleBetween(backShoulder, backHip, backKnee);
  } else {
    // Fallback: use racket/balance side mapping
    const racketKnee = kp(keypoints, isRight ? KI.right_knee : KI.left_knee);
    const balanceKnee = kp(keypoints, isRight ? KI.left_knee : KI.right_knee);
    const racketAnkle = kp(keypoints, isRight ? KI.right_ankle : KI.left_ankle);
    const balanceAnkle = kp(keypoints, isRight ? KI.left_ankle : KI.right_ankle);

    if (racketHip && racketKnee && racketAnkle)
      angles.frontKnee = angleBetween(racketHip, racketKnee, racketAnkle);
    if (racketShoulder && racketHip && racketKnee)
      angles.frontHip = angleBetween(racketShoulder, racketHip, racketKnee);
    if (balanceHip && balanceKnee && balanceAnkle)
      angles.backKnee = angleBetween(balanceHip, balanceKnee, balanceAnkle);
    if (balanceShoulder && balanceHip && balanceKnee)
      angles.backHip = angleBetween(balanceShoulder, balanceHip, balanceKnee);
  }

  // ── Torso lean (angle of spine from vertical) ──
  if (racketShoulder && balanceShoulder && racketHip && balanceHip) {
    const midS = {
      x: (racketShoulder.x + balanceShoulder.x) / 2,
      y: (racketShoulder.y + balanceShoulder.y) / 2,
    };
    const midH = {
      x: (racketHip.x + balanceHip.x) / 2,
      y: (racketHip.y + balanceHip.y) / 2,
    };

    // Torso lean = angle of spine from true vertical
    // In image coords: vertical is straight up (0, -1), spine is midS - midH
    const spineX = midS.x - midH.x;
    const spineY = midS.y - midH.y; // negative because Y increases downward
    // Angle from vertical (0, -1): using atan2
    const spineAngle = Math.atan2(spineX, -spineY); // angle from straight up
    angles.torsoLean = Math.abs(spineAngle * 180 / Math.PI);

    // Shoulder-hip rotation (with proper angle wrapping)
    const shoulderLineAngle = Math.atan2(
      racketShoulder.y - balanceShoulder.y,
      racketShoulder.x - balanceShoulder.x
    );
    const hipLineAngle = Math.atan2(
      racketHip.y - balanceHip.y,
      racketHip.x - balanceHip.x
    );
    const rotDiff = normalizeAngleDiff(shoulderLineAngle, hipLineAngle);
    angles.shoulderRotation = Math.abs(rotDiff * 180 / Math.PI);

    angles.centerOfGravity = midH.y;
  }

  // ── Stance width (normalized by shoulder width) ──
  const rAnkleKp = kp(keypoints, KI.right_ankle);
  const lAnkleKp = kp(keypoints, KI.left_ankle);
  if (rAnkleKp && lAnkleKp && racketShoulder && balanceShoulder) {
    const shoulderW = Math.abs(racketShoulder.x - balanceShoulder.x);
    if (shoulderW > 10) { // Minimum shoulder width to avoid division noise
      angles.stanceWidth = Math.abs(rAnkleKp.x - lAnkleKp.x) / shoulderW;
    }
  }

  return angles;
}

// ── Scoring Engine ──────────────────────────────────────────────────────

export interface BiomechanicsMetric {
  label: string;
  shortLabel: string;
  category: "arm" | "core" | "leg";
  value: number;         // 0-100 score
  ideal: number;         // reference value
  actual: number;        // detected value
  deviation: number;     // signed: positive = over, negative = under
  unit: string;
  severity: "excellent" | "good" | "needs-work" | "critical";
  correction: string;
}

export interface BiomechanicsResult {
  metrics: BiomechanicsMetric[];
  overallScore: number;
  armScore: number;
  coreScore: number;
  legScore: number;
  radarData: { metric: string; athlete: number; ideal: number }[];
  tips: CorrectionTip[];
  handedness: Handedness;
  confidence: number;
}

export interface CorrectionTip {
  priority: number;
  category: "arm" | "core" | "leg";
  icon: string;
  title: string;
  detail: string;
  angleDiff: number;
}

/** Gaussian scoring with floor at 5 (never show 0 for a measured metric).
 *  sigma tuned per metric based on biomechanical tolerance ranges from literature. */
function gaussianScore(actual: number, ideal: number, sigma: number): number {
  const diff = actual - ideal;
  const score = Math.exp(-(diff * diff) / (2 * sigma * sigma));
  return Math.max(5, Math.round(score * 100));
}

function getSeverity(score: number): "excellent" | "good" | "needs-work" | "critical" {
  if (score >= 85) return "excellent";
  if (score >= 65) return "good";
  if (score >= 40) return "needs-work";
  return "critical";
}

function getDirectionalCorrection(
  label: string,
  actual: number,
  ideal: number,
  unit: string
): string {
  const diff = actual - ideal;
  const absDiff = Math.abs(diff);

  if (unit === "ratio") {
    if (absDiff < 0.15) return `${label} is well-positioned`;
    return diff > 0
      ? `Narrow your stance — currently ${(absDiff * 100).toFixed(0)}% wider than ideal`
      : `Widen your stance — currently ${(absDiff * 100).toFixed(0)}% narrower than ideal`;
  }

  if (absDiff < 5) return `${label} is within ideal range`;

  if (label.includes("Elbow")) {
    return diff > 0
      ? `Bend elbow ${Math.round(absDiff)}° more (currently over-extended)`
      : `Extend elbow ${Math.round(absDiff)}° more (currently too bent)`;
  }
  if (label.includes("Shoulder") && !label.includes("Rotation")) {
    return diff > 0
      ? `Close shoulder angle ${Math.round(absDiff)}° (currently too open)`
      : `Open shoulder ${Math.round(absDiff)}° more (currently too compact)`;
  }
  if (label.includes("Knee")) {
    return diff > 0
      ? `Bend knee ${Math.round(absDiff)}° deeper`
      : `Straighten knee ${Math.round(absDiff)}° (over-bent)`;
  }
  if (label.includes("Torso")) {
    return diff > 0
      ? `Reduce forward lean by ${Math.round(absDiff)}°`
      : `Lean forward ${Math.round(absDiff)}° more`;
  }
  if (label.includes("Rotation")) {
    return diff > 0
      ? `Reduce upper-body rotation by ${Math.round(absDiff)}°`
      : `Increase shoulder-hip separation by ${Math.round(absDiff)}°`;
  }

  return diff > 0
    ? `Decrease ${label.toLowerCase()} by ${Math.round(absDiff)}${unit}`
    : `Increase ${label.toLowerCase()} by ${Math.round(absDiff)}${unit}`;
}

interface MetricConfig {
  key: keyof Omit<JointAngles, "handedness">;
  label: string;
  shortLabel: string;
  category: "arm" | "core" | "leg";
  sigma: number;
  unit: string;
  weight: number;
  tipIcon: string;
}

// Sigma values calibrated from research variance data:
// - Elite elbow extension at contact: SD ≈ 7-8° (Guo & Lin 2026) → sigma 20
// - Shoulder angles: SD ≈ 10-12° → sigma 22
// - Knee angles in lunge: SD ≈ 8-10° → sigma 20
// - Torso lean: SD ≈ 5-7° → sigma 12 (tighter tolerance)
// - Rotation: SD ≈ 8-10° → sigma 18
const METRIC_CONFIGS: MetricConfig[] = [
  { key: "racketElbow", label: "Racket Arm Elbow", shortLabel: "R.Elbow", category: "arm", sigma: 20, unit: "°", weight: 1.6, tipIcon: "💪" },
  { key: "racketShoulder", label: "Racket Shoulder", shortLabel: "R.Shoulder", category: "arm", sigma: 22, unit: "°", weight: 1.4, tipIcon: "🎯" },
  { key: "balanceElbow", label: "Balance Arm Elbow", shortLabel: "B.Elbow", category: "arm", sigma: 28, unit: "°", weight: 0.7, tipIcon: "⚖️" },
  { key: "balanceShoulder", label: "Balance Shoulder", shortLabel: "B.Shoulder", category: "arm", sigma: 28, unit: "°", weight: 0.6, tipIcon: "⚖️" },
  { key: "frontKnee", label: "Lead Knee", shortLabel: "Lead Knee", category: "leg", sigma: 20, unit: "°", weight: 1.5, tipIcon: "🦵" },
  { key: "backKnee", label: "Rear Knee", shortLabel: "Rear Knee", category: "leg", sigma: 22, unit: "°", weight: 1.0, tipIcon: "🦵" },
  { key: "torsoLean", label: "Torso Lean", shortLabel: "Torso", category: "core", sigma: 12, unit: "°", weight: 1.3, tipIcon: "🏋️" },
  { key: "shoulderRotation", label: "Shoulder-Hip Separation", shortLabel: "Rotation", category: "core", sigma: 18, unit: "°", weight: 1.1, tipIcon: "🔄" },
  { key: "stanceWidth", label: "Stance Width", shortLabel: "Stance", category: "leg", sigma: 0.4, unit: "ratio", weight: 1.0, tipIcon: "👣" },
];

/** Score biomechanics with Gaussian accuracy and directional corrections */
export function scoreBiomechanics(
  angles: JointAngles,
  reference: JointAngles
): BiomechanicsResult {
  const metrics: BiomechanicsMetric[] = [];
  const tips: CorrectionTip[] = [];

  for (const cfg of METRIC_CONFIGS) {
    const actual = angles[cfg.key] as number | undefined;
    const ideal = reference[cfg.key] as number | undefined;
    if (actual == null || ideal == null) continue;

    const score = gaussianScore(actual, ideal, cfg.sigma);
    const deviation = actual - ideal;
    const severity = getSeverity(score);
    const correction = getDirectionalCorrection(cfg.label, actual, ideal, cfg.unit);

    metrics.push({
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      category: cfg.category,
      value: score,
      ideal,
      actual,
      deviation,
      unit: cfg.unit,
      severity,
      correction,
    });

    if (score < 65) {
      tips.push({
        priority: Math.round(cfg.weight * (100 - score)),
        category: cfg.category,
        icon: cfg.tipIcon,
        title: cfg.label,
        detail: correction,
        angleDiff: Math.abs(deviation),
      });
    }
  }

  tips.sort((a, b) => b.priority - a.priority);

  const categoryScore = (cat: "arm" | "core" | "leg") => {
    const catMetrics = metrics.filter((m) => m.category === cat);
    if (catMetrics.length === 0) return 0;
    // Weighted average within category
    const totalW = catMetrics.reduce((s, m) => {
      const cfg = METRIC_CONFIGS.find((c) => c.label === m.label);
      return s + (cfg?.weight ?? 1);
    }, 0);
    const sum = catMetrics.reduce((s, m) => {
      const cfg = METRIC_CONFIGS.find((c) => c.label === m.label);
      return s + m.value * (cfg?.weight ?? 1);
    }, 0);
    return totalW > 0 ? Math.round(sum / totalW) : 0;
  };

  const armScore = categoryScore("arm");
  const coreScore = categoryScore("core");
  const legScore = categoryScore("leg");

  // Weighted overall score
  const totalWeight = metrics.reduce((s, m) => {
    const cfg = METRIC_CONFIGS.find((c) => c.label === m.label);
    return s + (cfg?.weight ?? 1);
  }, 0);
  const weightedSum = metrics.reduce((s, m) => {
    const cfg = METRIC_CONFIGS.find((c) => c.label === m.label);
    return s + m.value * (cfg?.weight ?? 1);
  }, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const radarData = metrics.map((m) => ({
    metric: m.shortLabel,
    athlete: m.value,
    ideal: 100,
  }));

  if (tips.length === 0 && overallScore >= 80) {
    tips.push({
      priority: 0,
      category: "core",
      icon: "🏆",
      title: "Excellent Form",
      detail: "Technique closely matches professional reference. Focus on consistency under match pressure and fatigue conditions.",
      angleDiff: 0,
    });
  }

  const confidence = metrics.length / METRIC_CONFIGS.length;

  return {
    metrics,
    overallScore,
    armScore,
    coreScore,
    legScore,
    radarData,
    tips,
    handedness: angles.handedness,
    confidence,
  };
}
