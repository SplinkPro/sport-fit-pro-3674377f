// ─── Biomechanics — Joint Angle Calculation & Scoring ──────────────────────
import type { Keypoint } from "./poseEngine";
import { KEYPOINT_INDEX as KI } from "./poseEngine";

const MIN_SCORE = 0.25;

/** Calculate angle at point B given three points A-B-C (in degrees) */
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

/** Get a keypoint if its confidence is above threshold */
function kp(keypoints: Keypoint[], idx: number): Keypoint | null {
  const k = keypoints[idx];
  return k && k.score >= MIN_SCORE ? k : null;
}

export interface JointAngles {
  leftElbow?: number;
  rightElbow?: number;
  leftShoulder?: number;
  rightShoulder?: number;
  leftHip?: number;
  rightHip?: number;
  leftKnee?: number;
  rightKnee?: number;
  torsoLean?: number; // angle of torso from vertical
  stanceWidth?: number; // normalized by hip-to-shoulder distance
}

/** Extract all measurable joint angles from keypoints */
export function extractAngles(keypoints: Keypoint[]): JointAngles {
  const angles: JointAngles = {};

  const ls = kp(keypoints, KI.left_shoulder);
  const rs = kp(keypoints, KI.right_shoulder);
  const le = kp(keypoints, KI.left_elbow);
  const re = kp(keypoints, KI.right_elbow);
  const lw = kp(keypoints, KI.left_wrist);
  const rw = kp(keypoints, KI.right_wrist);
  const lh = kp(keypoints, KI.left_hip);
  const rh = kp(keypoints, KI.right_hip);
  const lk = kp(keypoints, KI.left_knee);
  const rk = kp(keypoints, KI.right_knee);
  const la = kp(keypoints, KI.left_ankle);
  const ra = kp(keypoints, KI.right_ankle);

  if (ls && le && lw) angles.leftElbow = angleBetween(ls, le, lw);
  if (rs && re && rw) angles.rightElbow = angleBetween(rs, re, rw);
  if (le && ls && lh) angles.leftShoulder = angleBetween(le, ls, lh);
  if (re && rs && rh) angles.rightShoulder = angleBetween(re, rs, rh);
  if (ls && lh && lk) angles.leftHip = angleBetween(ls, lh, lk);
  if (rs && rh && rk) angles.rightHip = angleBetween(rs, rh, rk);
  if (lh && lk && la) angles.leftKnee = angleBetween(lh, lk, la);
  if (rh && rk && ra) angles.rightKnee = angleBetween(rh, rk, ra);

  // Torso lean: angle between midShoulder→midHip vector and vertical
  if (ls && rs && lh && rh) {
    const midS = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const midH = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
    const vertical = { x: midS.x, y: midS.y - 100 }; // straight up
    angles.torsoLean = angleBetween(vertical, midS, midH);
  }

  // Stance width (ankle spread normalized by shoulder width)
  if (la && ra && ls && rs) {
    const shoulderW = Math.abs(ls.x - rs.x);
    if (shoulderW > 0) {
      angles.stanceWidth = Math.abs(la.x - ra.x) / shoulderW;
    }
  }

  return angles;
}

export interface BiomechanicsMetric {
  label: string;
  value: number;   // 0-100 score
  ideal: number;   // reference angle
  actual: number;  // detected angle
  unit: string;
}

export interface BiomechanicsResult {
  metrics: BiomechanicsMetric[];
  overallScore: number;
  radarData: { metric: string; athlete: number; ideal: number }[];
  tips: string[];
}

/** Score an angle: 100 = perfect match, decreasing linearly with deviation */
function scoreAngle(actual: number, ideal: number, tolerance: number): number {
  const diff = Math.abs(actual - ideal);
  return Math.max(0, Math.round(100 - (diff / tolerance) * 100));
}

/** Compare detected angles against reference for a given shot type */
export function scoreBiomechanics(
  angles: JointAngles,
  reference: JointAngles
): BiomechanicsResult {
  const metrics: BiomechanicsMetric[] = [];
  const tips: string[] = [];

  const pairs: {
    key: keyof JointAngles;
    label: string;
    tolerance: number;
    tip: string;
  }[] = [
    { key: "rightElbow", label: "Racket Arm Elbow", tolerance: 40, tip: "Adjust your racket arm elbow angle for better power transfer" },
    { key: "rightShoulder", label: "Racket Shoulder", tolerance: 35, tip: "Open your shoulder more for full range of motion" },
    { key: "leftKnee", label: "Front Knee Bend", tolerance: 40, tip: "Deepen your lunge for better stability and reach" },
    { key: "rightKnee", label: "Back Knee", tolerance: 40, tip: "Keep your back leg engaged for balance" },
    { key: "torsoLean", label: "Torso Angle", tolerance: 25, tip: "Adjust your torso lean — stay balanced through the shot" },
    { key: "stanceWidth", label: "Stance Width", tolerance: 0.8, tip: "Widen or narrow your stance for optimal court coverage" },
  ];

  for (const p of pairs) {
    const actual = angles[p.key];
    const ideal = reference[p.key];
    if (actual != null && ideal != null) {
      const score = scoreAngle(actual as number, ideal as number, p.tolerance);
      metrics.push({
        label: p.label,
        value: score,
        ideal: ideal as number,
        actual: actual as number,
        unit: p.key === "stanceWidth" ? "ratio" : "°",
      });
      if (score < 60) tips.push(p.tip);
    }
  }

  const overallScore =
    metrics.length > 0
      ? Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length)
      : 0;

  const radarData = metrics.map((m) => ({
    metric: m.label,
    athlete: m.value,
    ideal: 100,
  }));

  if (tips.length === 0 && overallScore >= 80) {
    tips.push("Excellent form! Maintain this technique consistency in match situations.");
  }

  return { metrics, overallScore, radarData, tips };
}
