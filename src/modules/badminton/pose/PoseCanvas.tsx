// ─── Pose Canvas — Multi-Player Skeleton Overlay ──────────────────────────
import React, { useEffect, useRef } from "react";
import type { Keypoint } from "./poseEngine";
import { SKELETON_CONNECTIONS } from "./poseEngine";
import type { BiomechanicsMetric } from "./biomechanics";
import type { DetectedPlayer } from "./poseEngine";

interface PoseCanvasProps {
  imageSrc: string;
  /** All detected players — rendered with distinct colors */
  players: DetectedPlayer[];
  /** Index of the selected/focused player (gets brighter skeleton) */
  selectedPlayerIdx?: number;
  /** Metrics for the selected player's scoring color */
  metrics?: BiomechanicsMetric[];
  width: number;
  height: number;
}

const JOINT_RADIUS = 6;
const LINE_WIDTH = 3;
const MIN_SCORE = 0.25;

// Distinct colors for each player
const PLAYER_COLORS = [
  { main: "#22c55e", dim: "rgba(34, 197, 94, 0.35)", label: "#22c55e" },   // green — Player 1
  { main: "#3b82f6", dim: "rgba(59, 130, 246, 0.35)", label: "#3b82f6" },   // blue — Player 2
  { main: "#f59e0b", dim: "rgba(245, 158, 11, 0.35)", label: "#f59e0b" },   // amber — Player 3+
  { main: "#a855f7", dim: "rgba(168, 85, 247, 0.35)", label: "#a855f7" },   // purple
];

function getJointColor(metricValue?: number): string {
  if (metricValue != null) {
    if (metricValue >= 80) return "#22c55e";
    if (metricValue >= 50) return "#f59e0b";
    return "#ef4444";
  }
  return "#22c55e";
}

export function PoseCanvas({
  imageSrc,
  players,
  selectedPlayerIdx = 0,
  metrics,
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
      ctx.drawImage(img, 0, 0, width, height);

      const scaleX = width / img.naturalWidth;
      const scaleY = height / img.naturalHeight;

      // Draw each player's skeleton
      players.forEach((player, pIdx) => {
        const isSelected = pIdx === selectedPlayerIdx;
        const colors = PLAYER_COLORS[pIdx % PLAYER_COLORS.length];
        const opacity = isSelected ? 1.0 : 0.4;

        const scaled = player.pose.keypoints.map((kp) => ({
          ...kp,
          x: kp.x * scaleX,
          y: kp.y * scaleY,
        }));

        // Draw skeleton connections
        for (const [i, j] of SKELETON_CONNECTIONS) {
          const a = scaled[i];
          const b = scaled[j];
          if (a.score >= MIN_SCORE && b.score >= MIN_SCORE) {
            // Shadow
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * opacity})`;
            ctx.lineWidth = LINE_WIDTH + 2;
            ctx.stroke();

            // Main line
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isSelected ? colors.main : colors.dim;
            ctx.lineWidth = LINE_WIDTH;
            ctx.globalAlpha = opacity;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // Draw joints
        for (const kp of scaled) {
          if (kp.score < MIN_SCORE) continue;

          const metricScore = isSelected
            ? findMetricForJoint(kp.name, metrics)
            : undefined;

          ctx.beginPath();
          ctx.arc(kp.x, kp.y, isSelected ? JOINT_RADIUS : 4, 0, 2 * Math.PI);
          ctx.globalAlpha = opacity;
          ctx.fillStyle = isSelected
            ? getJointColor(metricScore)
            : colors.dim;
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Draw player label near head
        const nose = scaled[0];
        if (nose && nose.score >= MIN_SCORE) {
          const labelY = nose.y - 20;
          ctx.font = `bold ${isSelected ? 12 : 10}px system-ui, sans-serif`;
          ctx.textAlign = "center";

          // Background pill
          const text = player.label;
          const textW = ctx.measureText(text).width;
          ctx.fillStyle = isSelected ? colors.main : colors.dim;
          ctx.globalAlpha = isSelected ? 0.85 : 0.5;
          const pillX = nose.x - textW / 2 - 6;
          const pillY = labelY - 10;
          const pillW = textW + 12;
          const pillH = 16;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, 8);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Text
          ctx.fillStyle = "white";
          ctx.fillText(text, nose.x, labelY + 2);
        }
      });

      // Draw bounding boxes for non-selected players (subtle)
      players.forEach((player, pIdx) => {
        if (pIdx === selectedPlayerIdx) return;
        const bb = player.pose.boundingBox;
        if (!bb) return;

        const colors = PLAYER_COLORS[pIdx % PLAYER_COLORS.length];
        ctx.strokeStyle = colors.dim;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          bb.xMin * scaleX,
          bb.yMin * scaleY,
          (bb.xMax - bb.xMin) * scaleX,
          (bb.yMax - bb.yMin) * scaleY
        );
        ctx.setLineDash([]);
      });
    };
    img.src = imageSrc;
  }, [imageSrc, players, selectedPlayerIdx, metrics, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-border shadow-md max-w-full"
      style={{ width, height }}
    />
  );
}

function findMetricForJoint(
  jointName: string,
  metrics?: BiomechanicsMetric[]
): number | undefined {
  if (!metrics) return undefined;
  const map: Record<string, string> = {
    right_elbow: "Racket Arm Elbow",
    right_shoulder: "Racket Shoulder",
    left_knee: "Front Knee Bend",
    right_knee: "Back Knee",
  };
  const label = map[jointName];
  if (!label) return undefined;
  return metrics.find((m) => m.label === label)?.value;
}
