// ─── Video Frame Extractor — Extract Key Frames from Video ────────────────
// Uses canvas-based frame capture + wrist acceleration for hit-frame detection
import { detectPose, type PoseResult, KEYPOINT_INDEX as KI } from "./poseEngine";

export interface ExtractedFrame {
  index: number;
  timestamp: number;       // seconds into the video
  imageSrc: string;        // data URL of the frame
  pose: PoseResult | null;
  isHitFrame: boolean;     // auto-detected contact moment
  wristSpeed: number;      // px/frame of dominant wrist
}

export interface VideoAnalysisProgress {
  phase: "extracting" | "detecting" | "scoring";
  current: number;
  total: number;
  message: string;
}

const EXTRACTION_FPS = 3;        // frames per second to sample
const MAX_FRAMES = 60;           // cap at 20 seconds of video
const HIT_SPEED_PERCENTILE = 85; // top 15% wrist speed = candidate hit frames

/**
 * Extract frames from a video element at EXTRACTION_FPS,
 * run pose detection on each, and identify hit frames
 */
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

  // Wait for metadata
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load video"));
  });

  const duration = video.duration;
  const totalFrames = Math.min(
    Math.floor(duration * EXTRACTION_FPS),
    MAX_FRAMES
  );

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

    // Seek to timestamp
    video.currentTime = timestamp;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    // Capture frame
    ctx.drawImage(video, 0, 0);
    const imageSrc = canvas.toDataURL("image/jpeg", 0.85);

    frames.push({
      index: i,
      timestamp,
      imageSrc,
      pose: null,
      isHitFrame: false,
      wristSpeed: 0,
    });
  }

  // Phase 2: Run pose detection on each frame
  for (let i = 0; i < frames.length; i++) {
    onProgress?.({
      phase: "detecting",
      current: i + 1,
      total: frames.length,
      message: `Analyzing pose ${i + 1}/${frames.length}...`,
    });

    // Create temp image for detection
    const img = new Image();
    img.src = frames[i].imageSrc;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    try {
      frames[i].pose = await detectPose(img);
    } catch {
      frames[i].pose = null;
    }
  }

  // Phase 3: Calculate wrist speeds and detect hit frames
  onProgress?.({
    phase: "scoring",
    current: 0,
    total: 1,
    message: "Detecting hit frames...",
  });

  calculateWristSpeeds(frames);
  detectHitFrames(frames);

  // Cleanup
  URL.revokeObjectURL(url);

  onProgress?.({
    phase: "scoring",
    current: 1,
    total: 1,
    message: "Analysis complete!",
  });

  return frames;
}

/** Calculate wrist movement speed between consecutive frames */
function calculateWristSpeeds(frames: ExtractedFrame[]) {
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1].pose;
    const curr = frames[i].pose;
    if (!prev || !curr) continue;

    // Use right wrist (dominant hand) speed
    const prevWrist = prev.keypoints[KI.right_wrist];
    const currWrist = curr.keypoints[KI.right_wrist];

    if (prevWrist.score > 0.2 && currWrist.score > 0.2) {
      const dx = currWrist.x - prevWrist.x;
      const dy = currWrist.y - prevWrist.y;
      frames[i].wristSpeed = Math.sqrt(dx * dx + dy * dy);
    }
  }
}

/** Detect hit frames — moments of peak wrist acceleration (contact moments) */
function detectHitFrames(frames: ExtractedFrame[]) {
  const speeds = frames.map((f) => f.wristSpeed).filter((s) => s > 0);
  if (speeds.length < 3) return;

  // Sort speeds to find percentile threshold
  const sorted = [...speeds].sort((a, b) => a - b);
  const threshIdx = Math.floor(sorted.length * (HIT_SPEED_PERCENTILE / 100));
  const threshold = sorted[threshIdx] || sorted[sorted.length - 1];

  // Mark frames above threshold as hit frames, but enforce minimum gap
  let lastHitIdx = -5;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].wristSpeed >= threshold && i - lastHitIdx >= 3) {
      frames[i].isHitFrame = true;
      lastHitIdx = i;
    }
  }

  // If no hit frames detected, mark the frame with highest speed
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

/** Get the best frame for analysis (highest wrist speed with valid pose) */
export function getBestFrame(frames: ExtractedFrame[]): ExtractedFrame | null {
  // Prefer hit frames with good pose detection
  const hitFrames = frames.filter((f) => f.isHitFrame && f.pose && f.pose.score > 0.3);
  if (hitFrames.length > 0) {
    return hitFrames.reduce((a, b) => (a.wristSpeed > b.wristSpeed ? a : b));
  }

  // Fallback: highest pose confidence
  const withPose = frames.filter((f) => f.pose && f.pose.score > 0.3);
  if (withPose.length > 0) {
    return withPose.reduce((a, b) => (a.pose!.score > b.pose!.score ? a : b));
  }

  return null;
}
