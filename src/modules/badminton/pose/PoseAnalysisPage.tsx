// ─── Pose Analysis Page — Upload, Detect, Analyze ─────────────────────────
import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectPose, type PoseResult } from "./poseEngine";
import { classifyShot, type ClassificationResult } from "./shotClassifier";
import { extractAngles, scoreBiomechanics, type BiomechanicsResult } from "./biomechanics";
import { getReferenceModel, type ReferenceModel } from "./referenceModels";
import { PoseCanvas } from "./PoseCanvas";
import { PoseResults } from "./PoseResults";

type AnalysisState = "idle" | "loading-model" | "detecting" | "done" | "error";

export default function PoseAnalysisPage() {
  const [state, setState] = useState<AnalysisState>("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [biomechanics, setBiomechanics] = useState<BiomechanicsResult | null>(null);
  const [reference, setReference] = useState<ReferenceModel | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resetAnalysis = useCallback(() => {
    setPoseResult(null);
    setClassification(null);
    setBiomechanics(null);
    setReference(null);
    setError("");
    setState("idle");
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("File too large. Maximum 20MB.");
        return;
      }

      resetAnalysis();
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [resetAnalysis]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const runAnalysis = useCallback(async () => {
    if (!imgRef.current) return;

    try {
      setState("loading-model");
      // Wait for image to be fully loaded
      if (!imgRef.current.complete) {
        await new Promise<void>((resolve) => {
          imgRef.current!.onload = () => resolve();
        });
      }

      setState("detecting");
      const pose = await detectPose(imgRef.current);

      if (!pose || pose.score < 0.2) {
        setError(
          "Could not detect a clear human pose. Try a different image with a single person clearly visible."
        );
        setState("error");
        return;
      }

      setPoseResult(pose);

      // Classify shot
      const cls = classifyShot(pose.keypoints);
      setClassification(cls);

      // Get reference model and score
      const ref = getReferenceModel(cls.shotType);
      setReference(ref);

      if (ref) {
        const bio = scoreBiomechanics(cls.angles, ref.angles);
        setBiomechanics(bio);
      } else {
        // Still show angles even without reference
        const defaultRef = getReferenceModel("Smash")!;
        const bio = scoreBiomechanics(cls.angles, defaultRef.angles);
        setBiomechanics(bio);
      }

      setState("done");
    } catch (err) {
      console.error("Pose analysis error:", err);
      setError(
        "Analysis failed. This may be due to browser compatibility. Please try Chrome or Edge."
      );
      setState("error");
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      setImgDimensions({
        w: imgRef.current.naturalWidth,
        h: imgRef.current.naturalHeight,
      });
    }
  }, []);

  // Calculate display dimensions (max 560px wide, maintain aspect ratio)
  const maxW = 560;
  const displayW = Math.min(maxW, imgDimensions.w || maxW);
  const displayH =
    imgDimensions.w > 0
      ? Math.round((displayW / imgDimensions.w) * imgDimensions.h)
      : 400;

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          🎯 Pose Analysis
          <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300">
            AI-POWERED
          </Badge>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload a badminton action photo to analyze technique, classify shot type, and compare against professional reference models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column — Upload & Canvas */}
        <div className="space-y-4">
          {/* Upload Zone */}
          {!imageSrc && (
            <Card
              className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">📸</div>
                <p className="font-semibold text-sm">
                  Drop a badminton action photo here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • JPG, PNG, WebP up to 20MB
                </p>
                <p className="text-xs text-muted-foreground mt-3 max-w-xs">
                  Best results: single player, clear full-body view, mid-shot action freeze
                </p>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />

          {/* Image / Canvas Display */}
          {imageSrc && (
            <div className="space-y-3">
              {/* Show canvas with skeleton if we have results, otherwise raw image */}
              {poseResult ? (
                <PoseCanvas
                  imageSrc={imageSrc}
                  keypoints={poseResult.keypoints}
                  metrics={biomechanics?.metrics}
                  width={displayW}
                  height={displayH}
                />
              ) : (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Uploaded badminton photo"
                  className="rounded-lg border border-border shadow-md max-w-full"
                  style={{ maxWidth: displayW }}
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              {/* Hidden image for pose detection (always needed) */}
              {poseResult && (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt=""
                  className="hidden"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={runAnalysis}
                  disabled={state === "loading-model" || state === "detecting"}
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, #1A5C38, #0d3d25)" }}
                >
                  {state === "loading-model"
                    ? "⏳ Loading AI model..."
                    : state === "detecting"
                    ? "🔍 Analyzing pose..."
                    : state === "done"
                    ? "🔄 Re-analyze"
                    : "🎯 Analyze Pose"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageSrc(null);
                    resetAnalysis();
                  }}
                >
                  Clear
                </Button>
              </div>

              {state === "loading-model" && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Loading TensorFlow.js MoveNet model (first time may take 5-10 seconds)...
                </p>
              )}
            </div>
          )}

          {error && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="py-4">
                <p className="text-xs text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Results */}
        <div>
          {state === "done" && classification && biomechanics ? (
            <PoseResults
              classification={classification}
              biomechanics={biomechanics}
              reference={reference}
            />
          ) : (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-16">
                <div className="text-4xl mb-3">🏸</div>
                <p className="text-sm font-medium text-muted-foreground">
                  Upload a photo and click "Analyze Pose"
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                  The AI will detect the player's skeleton, classify the shot type,
                  and score technique against professional references.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2 text-xs max-w-xs mx-auto">
                  {[
                    { icon: "💥", label: "Smash" },
                    { icon: "🎯", label: "Net Drop" },
                    { icon: "🛡️", label: "Defense" },
                    { icon: "↩️", label: "Backhand Clear" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/50"
                    >
                      <span>{s.icon}</span>
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
