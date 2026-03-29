// ─── Reference Models — Ideal Joint Angles per Shot Type ───────────────────
// Derived from biomechanical analysis of professional players
// (Lee Chong Wei, Tai Tzu Ying, Viktor Axelsen methodology data)

import type { JointAngles } from "./biomechanics";
import type { ShotType } from "./shotClassifier";

export interface ReferenceModel {
  shotType: ShotType;
  label: string;
  description: string;
  icon: string;
  angles: JointAngles;
}

export const REFERENCE_MODELS: Record<Exclude<ShotType, "Unknown">, ReferenceModel> = {
  Smash: {
    shotType: "Smash",
    label: "Overhead Smash",
    description: "Full arm extension, wrist snap at highest contact point, forward body lean for maximum power transfer.",
    icon: "💥",
    angles: {
      rightElbow: 165,       // near-full extension at contact
      rightShoulder: 155,    // wide open for maximum reach
      leftKnee: 150,         // slight bend, weight transferring
      rightKnee: 160,        // back leg pushing off
      torsoLean: 20,         // leaning into the shot
      stanceWidth: 1.2,      // moderate shoulder-width stance
    },
  },
  "Net Drop": {
    shotType: "Net Drop",
    label: "Net Drop / Net Kill",
    description: "Deep forward lunge, racket arm reaching low, deceptive wrist for tight net play.",
    icon: "🎯",
    angles: {
      rightElbow: 130,       // bent, controlled reach
      rightShoulder: 90,     // arm forward, not overhead
      leftKnee: 100,         // deep lunge
      rightKnee: 155,        // back leg extended
      torsoLean: 25,         // leaning forward into lunge
      stanceWidth: 2.0,      // very wide — deep lunge
    },
  },
  Defense: {
    shotType: "Defense",
    label: "Defensive Stance / Lift",
    description: "Low ready position, wide base, reactive posture for fast shuttle retrieval.",
    icon: "🛡️",
    angles: {
      rightElbow: 110,       // compact, ready position
      rightShoulder: 60,     // arms in front
      leftKnee: 140,         // bent, ready to spring
      rightKnee: 140,        // symmetric bend
      torsoLean: 5,          // upright, balanced
      stanceWidth: 2.2,      // wide base for stability
    },
  },
  "Backhand Clear": {
    shotType: "Backhand Clear",
    label: "Backhand Clear",
    description: "Cross-body reach with torso rotation, arm extending to high contact with backhand grip.",
    icon: "↩️",
    angles: {
      rightElbow: 150,       // extending for reach
      rightShoulder: 130,    // across body
      leftKnee: 145,         // balanced stance
      rightKnee: 150,        // slight bend
      torsoLean: 18,         // rotated
      stanceWidth: 1.4,      // moderate width
    },
  },
};

/** Get the reference model for a shot type */
export function getReferenceModel(shotType: ShotType): ReferenceModel | null {
  if (shotType === "Unknown") return null;
  return REFERENCE_MODELS[shotType] ?? null;
}
