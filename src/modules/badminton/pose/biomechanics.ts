// ─── Biomechanics Engine v2 — Production-Grade Scoring ────────────────────
// Gaussian scoring, 10 metrics, handedness detection, directional coaching
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";

const MIN_SCORE = 0.25;

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

/** Detect dominant hand: the wrist that is higher (more active in overhead shots)
 *  or further from body center (more extended in ground strokes) */
export function detectHandedness(keypoints: Keypoint[]): Handedness {
  const lw = kp(keypoints, KI.left_wrist);
  const rw = kp(keypoints, KI.right_wrist);
  const ls = kp(keypoints, KI.left_shoulder);
  const rs = kp(keypoints, KI.right_shoulder);

  if (!lw || !rw) return "right"; // default

  // Check which wrist is higher (lower Y = higher in image)
  const heightDiff = rw.y - lw.y; // negative = right is higher

  // Check which arm is more extended from body center
  if (ls && rs) {
    const centerX = (ls.x + rs.x) / 2;
    const leftExt = Math.abs(lw.x - centerX);
    const rightExt = Math.abs(rw.x - centerX);

    // Combine height and extension signals
    const rightSignal = (heightDiff < -15 ? 1 : 0) + (rightExt > leftExt ? 1 : 0);
    const leftSignal = (heightDiff > 15 ? 1 : 0) + (leftExt > rightExt ? 1 : 0);

    return leftSignal > rightSignal ? "left" : "right";
  }

  return heightDiff < 0 ? "right" : "left";
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
  // Lower body
  frontKnee?: number;
  backKnee?: number;
  frontHip?: number;
  backHip?: number;
  // Core
  torsoLean?: number;
  shoulderRotation?: number; // asymmetry of shoulder line vs hip line
  stanceWidth?: number;
  // Derived
  centerOfGravity?: number; // normalized Y position of midHip
  handedness: Handedness;
}

/** Extract comprehensive joint angles with handedness awareness */
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
  const racketHip = kp(keypoints, isRight ? KI.right_hip : KI.left_hip);
  const balanceHip = kp(keypoints, isRight ? KI.left_hip : KI.right_hip);
  const racketKnee = kp(keypoints, isRight ? KI.right_knee : KI.left_knee);
  const balanceKnee = kp(keypoints, isRight ? KI.left_knee : KI.right_knee);
  const racketAnkle = kp(keypoints, isRight ? KI.right_ankle : KI.left_ankle);
  const balanceAnkle = kp(keypoints, isRight ? KI.left_ankle : KI.right_ankle);
  const nose = kp(keypoints, KI.nose);

  const angles: JointAngles = { handedness: hand };

  // Racket arm angles
  if (racketShoulder && racketElbow && racketWrist)
    angles.racketElbow = angleBetween(racketShoulder, racketElbow, racketWrist);
  if (racketElbow && racketShoulder && racketHip)
    angles.racketShoulder = angleBetween(racketElbow, racketShoulder, racketHip);
  if (racketWrist && nose)
    angles.racketWristHeight = racketWrist.y - nose.y; // negative = above head

  // Balance arm
  if (balanceShoulder && balanceElbow && balanceWrist)
    angles.balanceElbow = angleBetween(balanceShoulder, balanceElbow, balanceWrist);
  if (balanceElbow && balanceShoulder && balanceHip)
    angles.balanceShoulder = angleBetween(balanceElbow, balanceShoulder, balanceHip);

  // Front leg (balance side in forward lunge) / Back leg (racket side)
  if (balanceShoulder && balanceHip && balanceKnee)
    angles.frontHip = angleBetween(balanceShoulder, balanceHip, balanceKnee);
  if (balanceHip && balanceKnee && balanceAnkle)
    angles.frontKnee = angleBetween(balanceHip, balanceKnee, balanceAnkle);
  if (racketShoulder && racketHip && racketKnee)
    angles.backHip = angleBetween(racketShoulder, racketHip, racketKnee);
  if (racketHip && racketKnee && racketAnkle)
    angles.backKnee = angleBetween(racketHip, racketKnee, racketAnkle);

  // Torso lean
  if (racketShoulder && balanceShoulder && racketHip && balanceHip) {
    const midS = { x: (racketShoulder.x + balanceShoulder.x) / 2, y: (racketShoulder.y + balanceShoulder.y) / 2 };
    const midH = { x: (racketHip.x + balanceHip.x) / 2, y: (racketHip.y + balanceHip.y) / 2 };
    const vertical = { x: midS.x, y: midS.y - 100 };
    angles.torsoLean = angleBetween(vertical, midS, midH);

    // Shoulder rotation (angle between shoulder line and hip line)
    const shoulderAngle = Math.atan2(racketShoulder.y - balanceShoulder.y, racketShoulder.x - balanceShoulder.x);
    const hipAngle = Math.atan2(racketHip.y - balanceHip.y, racketHip.x - balanceHip.x);
    angles.shoulderRotation = Math.abs((shoulderAngle - hipAngle) * 180 / Math.PI);

    // Center of gravity (normalized)
    angles.centerOfGravity = midH.y;
  }

  // Stance width
  if (racketAnkle && balanceAnkle && racketShoulder && balanceShoulder) {
    const shoulderW = Math.abs(racketShoulder.x - balanceShoulder.x);
    if (shoulderW > 0) {
      angles.stanceWidth = Math.abs(racketAnkle.x - balanceAnkle.x) / shoulderW;
    }
  }

  return angles;
}

// ── Scoring Engine ──────────────────────────────────────────────────────

export interface BiomechanicsMetric {
  label: string;
  shortLabel: string;    // for radar chart
  category: "arm" | "core" | "leg";
  value: number;         // 0-100 score
  ideal: number;         // reference value
  actual: number;        // detected value
  deviation: number;     // signed: positive = over, negative = under
  unit: string;
  severity: "excellent" | "good" | "needs-work" | "critical";
  correction: string;    // specific coaching correction
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
  confidence: number;    // how many metrics we could measure (0-1)
}

export interface CorrectionTip {
  priority: number;       // 1 = most important
  category: "arm" | "core" | "leg";
  icon: string;
  title: string;
  detail: string;
  angleDiff: number;     // magnitude of correction needed
}

/** Gaussian scoring: bell curve centered on ideal value.
 *  sigma controls how forgiving (higher = more forgiving) */
function gaussianScore(actual: number, ideal: number, sigma: number): number {
  const diff = actual - ideal;
  const score = Math.exp(-(diff * diff) / (2 * sigma * sigma));
  return Math.round(score * 100);
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
    if (absDiff < 0.2) return `${label} is well-positioned`;
    return diff > 0
      ? `Narrow your ${label.toLowerCase()} by ~${(absDiff * 100).toFixed(0)}%`
      : `Widen your ${label.toLowerCase()} by ~${(absDiff * 100).toFixed(0)}%`;
  }

  if (absDiff < 8) return `${label} is within ideal range`;

  // Direction-specific language per body part
  if (label.includes("Elbow")) {
    return diff > 0
      ? `Bend your elbow ${Math.round(absDiff)}° more — currently too extended`
      : `Extend your elbow ${Math.round(absDiff)}° more — currently too bent`;
  }
  if (label.includes("Shoulder")) {
    return diff > 0
      ? `Close your shoulder ${Math.round(absDiff)}° — too open`
      : `Open your shoulder ${Math.round(absDiff)}° more — too compact`;
  }
  if (label.includes("Knee")) {
    return diff > 0
      ? `Bend your knee ${Math.round(absDiff)}° deeper — insufficient depth`
      : `Straighten your knee ${Math.round(absDiff)}° — over-bent`;
  }
  if (label.includes("Torso")) {
    return diff > 0
      ? `Reduce forward lean by ${Math.round(absDiff)}° — too much forward tilt`
      : `Lean forward ${Math.round(absDiff)}° more — too upright`;
  }
  if (label.includes("Rotation")) {
    return diff > 0
      ? `Reduce upper body rotation by ${Math.round(absDiff)}°`
      : `Increase shoulder-hip rotation by ${Math.round(absDiff)}°`;
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
  sigma: number;        // Gaussian width (higher = more forgiving)
  unit: string;
  weight: number;       // scoring weight
  tipIcon: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: "racketElbow", label: "Racket Arm Elbow", shortLabel: "R.Elbow", category: "arm", sigma: 25, unit: "°", weight: 1.5, tipIcon: "💪" },
  { key: "racketShoulder", label: "Racket Shoulder", shortLabel: "R.Shoulder", category: "arm", sigma: 22, unit: "°", weight: 1.3, tipIcon: "🎯" },
  { key: "balanceElbow", label: "Balance Arm Elbow", shortLabel: "B.Elbow", category: "arm", sigma: 30, unit: "°", weight: 0.8, tipIcon: "⚖️" },
  { key: "balanceShoulder", label: "Balance Shoulder", shortLabel: "B.Shoulder", category: "arm", sigma: 28, unit: "°", weight: 0.7, tipIcon: "⚖️" },
  { key: "frontKnee", label: "Front Knee Bend", shortLabel: "F.Knee", category: "leg", sigma: 22, unit: "°", weight: 1.4, tipIcon: "🦵" },
  { key: "backKnee", label: "Back Knee", shortLabel: "B.Knee", category: "leg", sigma: 25, unit: "°", weight: 1.0, tipIcon: "🦵" },
  { key: "torsoLean", label: "Torso Lean", shortLabel: "Torso", category: "core", sigma: 15, unit: "°", weight: 1.2, tipIcon: "🏋️" },
  { key: "shoulderRotation", label: "Shoulder-Hip Rotation", shortLabel: "Rotation", category: "core", sigma: 18, unit: "°", weight: 1.0, tipIcon: "🔄" },
  { key: "stanceWidth", label: "Stance Width", shortLabel: "Stance", category: "leg", sigma: 0.5, unit: "ratio", weight: 1.1, tipIcon: "👣" },
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

    // Generate coaching tip if score is below good
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

  // Sort tips by priority (highest first)
  tips.sort((a, b) => b.priority - a.priority);

  // Calculate category scores
  const categoryScore = (cat: "arm" | "core" | "leg") => {
    const catMetrics = metrics.filter((m) => m.category === cat);
    if (catMetrics.length === 0) return 0;
    return Math.round(catMetrics.reduce((s, m) => s + m.value, 0) / catMetrics.length);
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

  // Add positive tip if everything is good
  if (tips.length === 0 && overallScore >= 80) {
    tips.push({
      priority: 0,
      category: "core",
      icon: "🏆",
      title: "Excellent Form",
      detail: "Your technique closely matches professional reference models. Focus on maintaining this consistency under match pressure.",
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
