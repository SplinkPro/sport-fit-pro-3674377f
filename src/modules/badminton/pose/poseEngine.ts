// ─── Pose Engine — TensorFlow.js MoveNet Multi-Pose ───────────────────────
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface PoseResult {
  keypoints: Keypoint[];
  score: number;
  /** Bounding box [y1, x1, y2, x2] in pixel coords */
  boundingBox?: { xMin: number; yMin: number; xMax: number; yMax: number };
}

export type CourtPosition = "near" | "far" | "unknown";

export interface DetectedPlayer {
  id: number;            // 0-based index
  label: string;         // "Player 1 (Near Court)" etc.
  courtPosition: CourtPosition;
  pose: PoseResult;
  centerY: number;       // vertical center — lower = near court (camera side)
}

let detector: poseDetection.PoseDetector | null = null;
let isLoading = false;
let loadPromise: Promise<poseDetection.PoseDetector> | null = null;

const MIN_CONFIDENCE = 0.25;

/** Lazy-load MoveNet MULTIPOSE Lightning — detects up to 6 people */
export async function getDetector(): Promise<poseDetection.PoseDetector> {
  if (detector) return detector;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    await tf.ready();
    const det = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
        enableSmoothing: true,
        enableTracking: true,
      }
    );
    detector = det;
    isLoading = false;
    return det;
  })();

  return loadPromise;
}

/** Calculate average confidence of a pose */
function avgConfidence(keypoints: Keypoint[]): number {
  const valid = keypoints.filter((k) => k.score >= MIN_CONFIDENCE);
  return valid.length > 0
    ? valid.reduce((s, k) => s + k.score, 0) / valid.length
    : 0;
}

/** Calculate vertical center of a pose (for court position) */
function verticalCenter(keypoints: Keypoint[]): number {
  const valid = keypoints.filter((k) => k.score >= MIN_CONFIDENCE);
  if (valid.length === 0) return 0;
  return valid.reduce((s, k) => s + k.y, 0) / valid.length;
}

/** Calculate bounding box from keypoints */
function calcBoundingBox(keypoints: Keypoint[]) {
  const valid = keypoints.filter((k) => k.score >= MIN_CONFIDENCE);
  if (valid.length === 0) return undefined;
  return {
    xMin: Math.min(...valid.map((k) => k.x)),
    yMin: Math.min(...valid.map((k) => k.y)),
    xMax: Math.max(...valid.map((k) => k.x)),
    yMax: Math.max(...valid.map((k) => k.y)),
  };
}

/** Detect all poses in an image/video/canvas — returns all detected players */
export async function detectAllPoses(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedPlayer[]> {
  const det = await getDetector();
  const poses = await det.estimatePoses(source, {
    flipHorizontal: false,
  });

  if (!poses.length) return [];

  const players: DetectedPlayer[] = poses
    .map((pose, idx) => {
      const keypoints: Keypoint[] = pose.keypoints.map((kp) => ({
        x: kp.x,
        y: kp.y,
        score: kp.score ?? 0,
        name: kp.name ?? "",
      }));

      const score = avgConfidence(keypoints);
      if (score < 0.15) return null; // skip very low confidence detections

      const centerY = verticalCenter(keypoints);
      const boundingBox = calcBoundingBox(keypoints);

      return {
        id: idx,
        label: `Player ${idx + 1}`,
        courtPosition: "unknown" as CourtPosition,
        pose: { keypoints, score, boundingBox },
        centerY,
      };
    })
    .filter(Boolean) as DetectedPlayer[];

  // Sort by vertical position (top to bottom) and assign court positions
  players.sort((a, b) => a.centerY - b.centerY);

  if (players.length >= 2) {
    // In standard badminton video: far court player is higher (smaller Y),
    // near court player is lower (larger Y, closer to camera)
    players[0].courtPosition = "far";
    players[0].label = "Player 1 (Far Court)";
    players[players.length - 1].courtPosition = "near";
    players[players.length - 1].label = `Player ${players.length} (Near Court)`;

    // Middle players (rare, but handle gracefully)
    for (let i = 1; i < players.length - 1; i++) {
      players[i].courtPosition = "unknown";
      players[i].label = `Player ${i + 1} (Mid)`;
    }
  } else if (players.length === 1) {
    players[0].label = "Player 1";
  }

  // Re-assign IDs after sorting
  players.forEach((p, i) => (p.id = i));

  return players;
}

/** Legacy single-pose API — detects best single pose (backward compat) */
export async function detectPose(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<PoseResult | null> {
  const players = await detectAllPoses(source);
  if (players.length === 0) return null;
  // Return highest confidence player
  return players.reduce((a, b) => (a.pose.score > b.pose.score ? a : b)).pose;
}

export function isModelLoading(): boolean {
  return isLoading;
}

// COCO keypoint indices
export const KEYPOINT_INDEX = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_ear: 3,
  right_ear: 4,
  left_shoulder: 5,
  right_shoulder: 6,
  left_elbow: 7,
  right_elbow: 8,
  left_wrist: 9,
  right_wrist: 10,
  left_hip: 11,
  right_hip: 12,
  left_knee: 13,
  right_knee: 14,
  left_ankle: 15,
  right_ankle: 16,
} as const;

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],           // head
  [5, 6],                                     // shoulders
  [5, 7], [7, 9],                             // left arm
  [6, 8], [8, 10],                            // right arm
  [5, 11], [6, 12],                           // torso
  [11, 12],                                   // hips
  [11, 13], [13, 15],                         // left leg
  [12, 14], [14, 16],                         // right leg
];
