// ─── Pose Engine — TensorFlow.js MoveNet Singleton ─────────────────────────
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
}

let detector: poseDetection.PoseDetector | null = null;
let isLoading = false;
let loadPromise: Promise<poseDetection.PoseDetector> | null = null;

const MIN_CONFIDENCE = 0.25;

/** Lazy-load MoveNet Lightning — singleton, called once */
export async function getDetector(): Promise<poseDetection.PoseDetector> {
  if (detector) return detector;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    await tf.ready();
    const det = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
    detector = det;
    isLoading = false;
    return det;
  })();

  return loadPromise;
}

/** Run pose estimation on an HTMLImageElement or HTMLVideoElement */
export async function detectPose(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<PoseResult | null> {
  const det = await getDetector();
  const poses = await det.estimatePoses(source, {
    flipHorizontal: false,
  });

  if (!poses.length) return null;

  const pose = poses[0];
  const keypoints: Keypoint[] = pose.keypoints.map((kp) => ({
    x: kp.x,
    y: kp.y,
    score: kp.score ?? 0,
    name: kp.name ?? "",
  }));

  const validScores = keypoints.filter((k) => k.score >= MIN_CONFIDENCE);
  const avgScore =
    validScores.length > 0
      ? validScores.reduce((s, k) => s + k.score, 0) / validScores.length
      : 0;

  return { keypoints, score: avgScore };
}

/** Check if the model is currently loading */
export function isModelLoading(): boolean {
  return isLoading;
}

// COCO keypoint indices for convenience
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
