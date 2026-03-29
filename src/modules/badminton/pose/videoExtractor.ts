// ─── Video Frame Extractor — Multi-Pose Version ──────────────────────────
import { detectAllPoses, type DetectedPlayer, KEYPOINT_INDEX as KI } from "./poseEngine";
import type { PoseResult } from "./poseEngine";

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  imageSrc: string;
  players: DetectedPlayer[];    // all detected players in this frame
  isHitFrame: boolean;
  wristSpeed: number;           // max wrist speed across tracked player
  /** Legacy compat */
  pose: PoseResult | null;
}

export interface VideoAnalysisProgress {
  phase: "extracting" | "detecting" | "scoring";
  current: number;
  total: number;
  message: string;
}

const EXTRACTION_FPS = 3;
const MAX_FRAMES = 60;
const HIT_SPEED_PERCENTILE = 85;

export async function extractVideoFrames(
  videoFile: File,
  onProgress?: (p: VideoAnalysisProgress) => void
): Promise<ExtractedFrame[]> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const url = URL.createObjectURL(videoFile);
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load video"));
  });

  const duration = video.duration;
  const totalFrames = Math.min(Math.floor(duration * EXTRACTION_FPS), MAX_FRAMES);

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;

  const frames: ExtractedFrame[] = [];

  // Phase 1: Extract frames
  for (let i = 0; i < totalFrames; i++) {
    const timestamp = i / EXTRACTION_FPS;
    onProgress?.({
      phase: "extracting",
      current: i + 1,
      total: totalFrames,
      message: `Extracting frame ${i + 1}/${totalFrames} (${timestamp.toFixed(1)}s)`,
    });

    video.currentTime = timestamp;
    await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });

    ctx.drawImage(video, 0, 0);
    const imageSrc = canvas.toDataURL("image/jpeg", 0.85);

    frames.push({
      index: i,
      timestamp,
      imageSrc,
      players: [],
      isHitFrame: false,
      wristSpeed: 0,
      pose: null,
    });
  }

  // Phase 2: Run multi-pose detection on each frame
  for (let i = 0; i < frames.length; i++) {
    onProgress?.({
      phase: "detecting",
      current: i + 1,
      total: frames.length,
      message: `Detecting players in frame ${i + 1}/${frames.length}...`,
    });

    const img = new Image();
    img.src = frames[i].imageSrc;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    try {
      const players = await detectAllPoses(img);
      frames[i].players = players;
      // Legacy: set pose to best player's pose
      if (players.length > 0) {
        frames[i].pose = players.reduce((a, b) =>
          a.pose.score > b.pose.score ? a : b
        ).pose;
      }
    } catch {
      frames[i].players = [];
      frames[i].pose = null;
    }
  }

  // Phase 3: Calculate wrist speeds and detect hit frames
  onProgress?.({
    phase: "scoring",
    current: 0,
    total: 1,
    message: "Detecting hit frames via wrist acceleration...",
  });

  calculateWristSpeeds(frames);
  detectHitFrames(frames);

  URL.revokeObjectURL(url);

  onProgress?.({
    phase: "scoring",
    current: 1,
    total: 1,
    message: "Analysis complete!",
  });

  return frames;
}

/** Calculate max wrist speed across all tracked players using spatial proximity matching */
function calculateWristSpeeds(frames: ExtractedFrame[]) {
  for (let i = 1; i < frames.length; i++) {
    let maxSpeed = 0;

    for (const currPlayer of frames[i].players) {
      // Match by closest spatial position (centerY proximity), not courtPosition label
      let bestMatch: DetectedPlayer | null = null;
      let bestDist = Infinity;
      for (const prevPlayer of frames[i - 1].players) {
        const dist = Math.abs(prevPlayer.centerY - currPlayer.centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = prevPlayer;
        }
      }
      if (!bestMatch || bestDist > 200) continue; // skip if no reasonable match

      const prevWrist = bestMatch.pose.keypoints[KI.right_wrist];
      const currWrist = currPlayer.pose.keypoints[KI.right_wrist];
      const prevWristL = bestMatch.pose.keypoints[KI.left_wrist];
      const currWristL = currPlayer.pose.keypoints[KI.left_wrist];

      // Check both wrists and take max speed
      for (const [pw, cw] of [[prevWrist, currWrist], [prevWristL, currWristL]]) {
        if (pw.score > 0.2 && cw.score > 0.2) {
          const dx = cw.x - pw.x;
          const dy = cw.y - pw.y;
          const speed = Math.sqrt(dx * dx + dy * dy);
          maxSpeed = Math.max(maxSpeed, speed);
        }
      }
    }

    frames[i].wristSpeed = maxSpeed;
  }
}

function detectHitFrames(frames: ExtractedFrame[]) {
  const speeds = frames.map((f) => f.wristSpeed).filter((s) => s > 0);
  if (speeds.length < 3) return;

  const sorted = [...speeds].sort((a, b) => a - b);
  const threshIdx = Math.floor(sorted.length * (HIT_SPEED_PERCENTILE / 100));
  const threshold = sorted[threshIdx] || sorted[sorted.length - 1];

  let lastHitIdx = -5;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].wristSpeed >= threshold && i - lastHitIdx >= 3) {
      frames[i].isHitFrame = true;
      lastHitIdx = i;
    }
  }

  if (!frames.some((f) => f.isHitFrame)) {
    let maxSpeed = 0;
    let maxIdx = 0;
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].wristSpeed > maxSpeed) {
        maxSpeed = frames[i].wristSpeed;
        maxIdx = i;
      }
    }
    if (maxSpeed > 0) frames[maxIdx].isHitFrame = true;
  }
}

export function getBestFrame(frames: ExtractedFrame[]): ExtractedFrame | null {
  const hitFrames = frames.filter(
    (f) => f.isHitFrame && f.players.length > 0
  );
  if (hitFrames.length > 0) {
    return hitFrames.reduce((a, b) => (a.wristSpeed > b.wristSpeed ? a : b));
  }

  const withPlayers = frames.filter((f) => f.players.length > 0);
  if (withPlayers.length > 0) {
    return withPlayers.reduce((a, b) => {
      const aScore = Math.max(...a.players.map((p) => p.pose.score));
      const bScore = Math.max(...b.players.map((p) => p.pose.score));
      return aScore > bScore ? a : b;
    });
  }

  return null;
}
