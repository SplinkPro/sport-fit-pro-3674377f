// ─── Pose Canvas v2 — Angle Annotations + Phase Badge ─────────────────────
import React, { useEffect, useRef } from "react";
import type { Keypoint } from "./poseEngine";
import { SKELETON_CONNECTIONS, KEYPOINT_INDEX as KI } from "./poseEngine";
import type { BiomechanicsMetric } from "./biomechanics";
import type { DetectedPlayer } from "./poseEngine";
import type { ShotPhase } from "./shotClassifier";

interface PoseCanvasProps {
  imageSrc: string;
  players: DetectedPlayer[];
  selectedPlayerIdx?: number;
  metrics?: BiomechanicsMetric[];
  showAngles?: boolean;
  phase?: ShotPhase;
  width: number;
  height: number;
}

const JOINT_RADIUS = 7;
const LINE_WIDTH = 3;
const MIN_SCORE = 0.25;

const PLAYER_COLORS = [
  { main: "#22c55e", dim: "rgba(34, 197, 94, 0.3)", glow: "rgba(34, 197, 94, 0.15)" },
  { main: "#3b82f6", dim: "rgba(59, 130, 246, 0.3)", glow: "rgba(59, 130, 246, 0.15)" },
  { main: "#f59e0b", dim: "rgba(245, 158, 11, 0.3)", glow: "rgba(245, 158, 11, 0.15)" },
  { main: "#a855f7", dim: "rgba(168, 85, 247, 0.3)", glow: "rgba(168, 85, 247, 0.15)" },
];

const SEVERITY_COLORS = {
  excellent: "#22c55e",
  good: "#84cc16",
  "needs-work": "#f59e0b",
  critical: "#ef4444",
};

const PHASE_LABELS: Record<ShotPhase, { label: string; color: string }> = {
  preparation: { label: "PREPARATION", color: "#f59e0b" },
  contact: { label: "CONTACT", color: "#22c55e" },
  "follow-through": { label: "FOLLOW-THROUGH", color: "#3b82f6" },
  ready: { label: "READY POSITION", color: "#6366f1" },
  unknown: { label: "ANALYZING", color: "#9ca3af" },
};

// Map metric labels to joint keypoint indices for angle annotation (handedness-aware)
function getAngleAnnotationJoints(handedness: "right" | "left"): Record<string, number> {
  const isRight = handedness === "right";
  return {
    "Racket Arm Elbow": isRight ? KI.right_elbow : KI.left_elbow,
    "Racket Shoulder": isRight ? KI.right_shoulder : KI.left_shoulder,
    "Balance Arm Elbow": isRight ? KI.left_elbow : KI.right_elbow,
    "Balance Shoulder": isRight ? KI.left_shoulder : KI.right_shoulder,
    "Front Knee Bend": isRight ? KI.left_knee : KI.right_knee,
    "Back Knee": isRight ? KI.right_knee : KI.left_knee,
    "Torso Lean": KI.left_hip, // mid-torso approximation
    "Shoulder-Hip Rotation": isRight ? KI.right_shoulder : KI.left_shoulder,
  };
}

export function PoseCanvas({
  imageSrc,
  players,
  selectedPlayerIdx = 0,
  metrics,
  showAngles = true,
  phase,
  width,
  height,
}: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Slight darkening overlay for better skeleton visibility
      ctx.drawImage(img, 0, 0, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);

      const scaleX = width / img.naturalWidth;
      const scaleY = height / img.naturalHeight;

      // Draw non-selected players first (behind)
      players.forEach((player, pIdx) => {
        if (pIdx === selectedPlayerIdx) return;
        drawSkeleton(ctx, player, pIdx, scaleX, scaleY, false);
      });

      // Draw selected player on top
      const selectedPlayer = players[selectedPlayerIdx];
      if (selectedPlayer) {
        drawSkeleton(ctx, selectedPlayer, selectedPlayerIdx, scaleX, scaleY, true);

        // Draw angle annotations for selected player
        if (showAngles && metrics && metrics.length > 0) {
          drawAngleAnnotations(ctx, selectedPlayer, metrics, scaleX, scaleY);
        }
      }

      // Phase badge (top-right)
      if (phase && phase !== "unknown") {
        drawPhaseBadge(ctx, phase, width);
      }
    };
    img.src = imageSrc;
  }, [imageSrc, players, selectedPlayerIdx, metrics, showAngles, phase, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-border shadow-lg max-w-full"
      style={{ width, height }}
    />
  );
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  player: DetectedPlayer,
  playerIdx: number,
  scaleX: number,
  scaleY: number,
  isSelected: boolean
) {
  const colors = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
  const opacity = isSelected ? 1.0 : 0.35;
  const scaled = player.pose.keypoints.map((kp) => ({
    ...kp,
    x: kp.x * scaleX,
    y: kp.y * scaleY,
  }));

  // Glow effect for selected player
  if (isSelected) {
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 12;
  }

  // Connections
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = scaled[i];
    const b = scaled[j];
    if (a.score >= MIN_SCORE && b.score >= MIN_SCORE) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isSelected ? colors.main : colors.dim;
      ctx.lineWidth = isSelected ? LINE_WIDTH + 1 : LINE_WIDTH - 1;
      ctx.globalAlpha = opacity;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  ctx.shadowBlur = 0;

  // Joints
  for (const kp of scaled) {
    if (kp.score < MIN_SCORE) continue;

    const r = isSelected ? JOINT_RADIUS : 4;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, r, 0, 2 * Math.PI);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = isSelected ? colors.main : colors.dim;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = isSelected ? 2.5 : 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Player label
  const nose = scaled[0];
  if (nose && nose.score >= MIN_SCORE) {
    const label = isSelected
      ? `Player ${playerIdx + 1}${player.courtPosition !== "unknown" ? ` · ${player.courtPosition === "near" ? "Near" : "Far"}` : ""}`
      : `P${playerIdx + 1}`;

    ctx.font = `bold ${isSelected ? 11 : 9}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    const tw = ctx.measureText(label).width;

    const px = nose.x - tw / 2 - 8;
    const py = nose.y - 28;

    ctx.globalAlpha = isSelected ? 0.9 : 0.5;
    ctx.fillStyle = isSelected ? colors.main : colors.dim;
    ctx.beginPath();
    ctx.roundRect(px, py, tw + 16, 20, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.fillText(label, nose.x, py + 14);
  }

  // Bounding box for non-selected
  if (!isSelected && player.pose.boundingBox) {
    const bb = player.pose.boundingBox;
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bb.xMin * scaleX, bb.yMin * scaleY, (bb.xMax - bb.xMin) * scaleX, (bb.yMax - bb.yMin) * scaleY);
    ctx.setLineDash([]);
  }
}

function drawAngleAnnotations(
  ctx: CanvasRenderingContext2D,
  player: DetectedPlayer,
  metrics: BiomechanicsMetric[],
  scaleX: number,
  scaleY: number
) {
  // Detect handedness from the biomechanics result via the player's pose
  const { detectHandedness } = require("./biomechanics");
  const handedness = detectHandedness(player.pose.keypoints);
  const annotationJoints = getAngleAnnotationJoints(handedness);

  for (const metric of metrics) {
    const jointIdx = annotationJoints[metric.label];

    // Adjust for handedness (swap left/right indices)
    // This is a simplification — works for right-handed players
    if (jointIdx == null) continue;

    const joint = player.pose.keypoints[jointIdx];
    if (!joint || joint.score < MIN_SCORE) continue;

    const x = joint.x * scaleX;
    const y = joint.y * scaleY;
    const color = SEVERITY_COLORS[metric.severity];

    // Draw angle value badge
    const text = metric.unit === "ratio" ? `${metric.actual.toFixed(1)}×` : `${Math.round(metric.actual)}°`;
    ctx.font = "bold 10px system-ui, sans-serif";
    const tw = ctx.measureText(text).width;

    // Position slightly offset from joint
    const ox = x + 14;
    const oy = y - 8;

    // Background pill
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(ox - 2, oy - 9, tw + 8, 15, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Text
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(text, ox + 2, oy + 2);

    // Connecting line from joint to badge
    ctx.beginPath();
    ctx.moveTo(x + JOINT_RADIUS + 1, y);
    ctx.lineTo(ox - 2, oy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawPhaseBadge(ctx: CanvasRenderingContext2D, phase: ShotPhase, canvasWidth: number) {
  const { label, color } = PHASE_LABELS[phase];
  ctx.font = "bold 10px system-ui, sans-serif";
  const tw = ctx.measureText(label).width;

  const px = canvasWidth - tw - 24;
  const py = 8;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.roundRect(px, py, tw + 16, 20, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(label, px + tw / 2 + 8, py + 14);
}
