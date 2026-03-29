// ─── Reference Models v2 — 8 Shot Types with Handedness-Aware Angles ──────
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
}

export const REFERENCE_MODELS: Record<Exclude<ShotType, "Unknown">, ReferenceModel> = {
  Smash: {
    shotType: "Smash",
    label: "Overhead Smash",
    description: "Maximum power — full arm extension, wrist snap at highest point, aggressive forward body lean, push off back leg.",
    icon: "💥",
    color: "#ef4444",
    angles: {
      racketElbow: 165, racketShoulder: 155, balanceElbow: 90, balanceShoulder: 70,
      frontKnee: 150, backKnee: 160, torsoLean: 20, shoulderRotation: 25, stanceWidth: 1.2,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Full arm extension at contact — elbow near 165°",
      "Contact shuttle at highest reachable point",
      "Aggressive weight transfer from back to front foot",
      "Snap wrist through contact for speed",
      "Non-racket arm counterbalances — tuck it in",
    ],
  },
  Clear: {
    shotType: "Clear",
    label: "Forehand Clear",
    description: "High deep shot — overhead contact with controlled power, upright stance, weight transfers backward for depth.",
    icon: "🌊",
    color: "#3b82f6",
    angles: {
      racketElbow: 155, racketShoulder: 140, balanceElbow: 100, balanceShoulder: 75,
      frontKnee: 155, backKnee: 165, torsoLean: 10, shoulderRotation: 20, stanceWidth: 1.1,
      handedness: "right",
    },
    keyCoachingPoints: [
      "High contact point — similar to smash preparation",
      "More upright than smash — torso ~10° lean only",
      "Follow through forward and down",
      "Generate depth with shoulder rotation, not just arm",
    ],
  },
  "Drop Shot": {
    shotType: "Drop Shot",
    label: "Forehand Drop",
    description: "Deceptive — looks like smash/clear but decelerates racket before contact. Soft touch, minimal follow-through.",
    icon: "🪶",
    color: "#8b5cf6",
    angles: {
      racketElbow: 130, racketShoulder: 125, balanceElbow: 95, balanceShoulder: 70,
      frontKnee: 155, backKnee: 160, torsoLean: 8, shoulderRotation: 15, stanceWidth: 1.1,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Same preparation as smash/clear for deception",
      "Decelerate racket head just before contact",
      "Elbow stays more bent than smash (~130°)",
      "Minimal follow-through — 'catch' the shuttle",
    ],
  },
  "Net Drop": {
    shotType: "Net Drop",
    label: "Net Drop / Net Kill",
    description: "Front court finesse — deep lunge, racket arm low and controlled, deceptive wrist for tight net play.",
    icon: "🎯",
    color: "#10b981",
    angles: {
      racketElbow: 130, racketShoulder: 85, balanceElbow: 110, balanceShoulder: 60,
      frontKnee: 100, backKnee: 160, torsoLean: 25, shoulderRotation: 10, stanceWidth: 2.0,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Deep lunge — front knee ~100°, close to right angle",
      "Racket arm controlled, elbow ~130°",
      "Touch the shuttle at tape height",
      "Back leg extended for balance and recovery push",
      "Minimal backswing — use fingers and wrist",
    ],
  },
  Drive: {
    shotType: "Drive",
    label: "Forehand Drive",
    description: "Fast flat shot at mid-height — arm extends sideways, quick compact swing, weight centered.",
    icon: "➡️",
    color: "#f59e0b",
    angles: {
      racketElbow: 145, racketShoulder: 100, balanceElbow: 100, balanceShoulder: 65,
      frontKnee: 155, backKnee: 155, torsoLean: 8, shoulderRotation: 20, stanceWidth: 1.3,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Contact at shoulder height — flat trajectory",
      "Quick, compact swing — no big backswing",
      "Arm extends to ~145° at contact",
      "Weight centered for quick directional change",
    ],
  },
  Defense: {
    shotType: "Defense",
    label: "Defensive Stance / Lift",
    description: "Wide ready position — low center of gravity, reactive posture, balanced weight for any direction.",
    icon: "🛡️",
    color: "#6366f1",
    angles: {
      racketElbow: 110, racketShoulder: 60, balanceElbow: 110, balanceShoulder: 60,
      frontKnee: 140, backKnee: 140, torsoLean: 5, shoulderRotation: 5, stanceWidth: 2.2,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Wide base — feet wider than shoulders (2.2× ratio)",
      "Both knees bent equally ~140° — ready to spring",
      "Upright torso — minimal lean for balance",
      "Racket in front at waist height",
      "Weight on balls of feet — heels barely touching",
    ],
  },
  "Backhand Clear": {
    shotType: "Backhand Clear",
    label: "Backhand Clear",
    description: "Cross-body reach with significant torso rotation — arm extends overhead on non-dominant side.",
    icon: "↩️",
    color: "#ec4899",
    angles: {
      racketElbow: 150, racketShoulder: 130, balanceElbow: 90, balanceShoulder: 55,
      frontKnee: 150, backKnee: 155, torsoLean: 18, shoulderRotation: 35, stanceWidth: 1.4,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Significant shoulder-hip rotation ~35°",
      "Racket arm crosses body midline",
      "Extend fully at contact ~150°",
      "Use body rotation for power, not just arm",
      "Quick recovery turn after contact",
    ],
  },
  Serve: {
    shotType: "Serve",
    label: "Service Action",
    description: "Controlled preparation — racket arm cocked behind, narrow stance, shuttle held in non-racket hand.",
    icon: "🏸",
    color: "#14b8a6",
    angles: {
      racketElbow: 110, racketShoulder: 100, balanceElbow: 120, balanceShoulder: 45,
      frontKnee: 165, backKnee: 170, torsoLean: 10, shoulderRotation: 15, stanceWidth: 0.8,
      handedness: "right",
    },
    keyCoachingPoints: [
      "Narrow stance — feet close together (~0.8× shoulder width)",
      "Racket arm cocked with elbow bent ~110°",
      "Non-racket hand holds shuttle at waist height",
      "Slight forward lean ~10°",
      "Contact below waist (laws of badminton)",
    ],
  },
};

export function getReferenceModel(shotType: ShotType): ReferenceModel | null {
  if (shotType === "Unknown") return null;
  return REFERENCE_MODELS[shotType] ?? null;
}

/** Get all reference models as array */
export function getAllReferenceModels(): ReferenceModel[] {
  return Object.values(REFERENCE_MODELS);
}
