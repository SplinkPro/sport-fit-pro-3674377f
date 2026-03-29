// ─── Pose Canvas — Skeleton Overlay on Image ──────────────────────────────
import React, { useEffect, useRef } from "react";
import type { Keypoint } from "./poseEngine";
import { SKELETON_CONNECTIONS } from "./poseEngine";
import type { BiomechanicsMetric } from "./biomechanics";

interface PoseCanvasProps {
  imageSrc: string;
  keypoints: Keypoint[];
  metrics?: BiomechanicsMetric[];
  width: number;
  height: number;
}

const JOINT_RADIUS = 6;
const LINE_WIDTH = 3;
const MIN_SCORE = 0.25;

function getJointColor(score: number, metricValue?: number): string {
  if (metricValue != null) {
    if (metricValue >= 80) return "#22c55e"; // green
    if (metricValue >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  }
  return score >= 0.5 ? "#22c55e" : score >= MIN_SCORE ? "#f59e0b" : "#6b7280";
}

export function PoseCanvas({ imageSrc, keypoints, metrics, width, height }: PoseCanvasProps) {
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

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Scale keypoints to canvas size
      const scaleX = width / img.naturalWidth;
      const scaleY = height / img.naturalHeight;

      const scaled = keypoints.map((kp) => ({
        ...kp,
        x: kp.x * scaleX,
        y: kp.y * scaleY,
      }));

      // Draw skeleton connections
      ctx.lineWidth = LINE_WIDTH;
      for (const [i, j] of SKELETON_CONNECTIONS) {
        const a = scaled[i];
        const b = scaled[j];
        if (a.score >= MIN_SCORE && b.score >= MIN_SCORE) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.stroke();

          // Shadow for visibility
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          ctx.lineWidth = LINE_WIDTH + 2;
          ctx.stroke();
          ctx.lineWidth = LINE_WIDTH;
        }
      }

      // Draw joints
      for (const kp of scaled) {
        if (kp.score < MIN_SCORE) continue;

        // Find matching metric for color coding
        const metricScore = findMetricForJoint(kp.name, metrics);

        ctx.beginPath();
        ctx.arc(kp.x, kp.y, JOINT_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = getJointColor(kp.score, metricScore);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };
    img.src = imageSrc;
  }, [imageSrc, keypoints, metrics, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-border shadow-md max-w-full"
      style={{ width, height }}
    />
  );
}

function findMetricForJoint(jointName: string, metrics?: BiomechanicsMetric[]): number | undefined {
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
