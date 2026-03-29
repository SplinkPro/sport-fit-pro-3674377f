// ─── Pose Analysis Page — Photo + Video Analysis ──────────────────────────
import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { detectPose, type PoseResult } from "./poseEngine";
import { classifyShot, type ClassificationResult } from "./shotClassifier";
import { scoreBiomechanics, type BiomechanicsResult } from "./biomechanics";
import { getReferenceModel, type ReferenceModel } from "./referenceModels";
import { PoseCanvas } from "./PoseCanvas";
import { PoseResults } from "./PoseResults";
import {
  extractVideoFrames,
  getBestFrame,
  type ExtractedFrame,
  type VideoAnalysisProgress,
} from "./videoExtractor";
import { FrameTimeline } from "./FrameTimeline";

type MediaType = "none" | "image" | "video";
type AnalysisState =
  | "idle"
  | "loading-model"
  | "detecting"
  | "extracting"
  | "done"
  | "error";

interface FrameAnalysis {
  pose: PoseResult;
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
}

export default function PoseAnalysisPage() {
  // Core state
  const [state, setState] = useState<AnalysisState>("idle");
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [error, setError] = useState("");

  // Image mode
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  // Video mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);
  const [videoProgress, setVideoProgress] = useState<VideoAnalysisProgress | null>(null);

  // Analysis results (for current frame/image)
  const [frameAnalysis, setFrameAnalysis] = useState<FrameAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resetAll = useCallback(() => {
    setState("idle");
    setMediaType("none");
    setError("");
    setImageSrc(null);
    setImgDimensions({ w: 0, h: 0 });
    setVideoFile(null);
    setFrames([]);
    setSelectedFrameIdx(0);
    setVideoProgress(null);
    setFrameAnalysis(null);
  }, []);

  // ── Analyze a single pose from keypoints ──
  const analyzeFromPose = useCallback((pose: PoseResult): FrameAnalysis => {
    const cls = classifyShot(pose.keypoints);
    const ref = getReferenceModel(cls.shotType);
    const bio = scoreBiomechanics(cls.angles, (ref ?? getReferenceModel("Smash")!).angles);
    return { pose, classification: cls, biomechanics: bio, reference: ref };
  }, []);

  // ── File Selection ──
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.size > 100 * 1024 * 1024) {
        setError("File too large. Maximum 100MB for video, 20MB for images.");
        return;
      }

      resetAll();

      if (file.type.startsWith("video/")) {
        setMediaType("video");
        setVideoFile(file);
      } else if (file.type.startsWith("image/")) {
        setMediaType("image");
        const reader = new FileReader();
        reader.onload = (e) => setImageSrc(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setError("Unsupported file type. Upload a photo (JPG/PNG) or video (MP4/MOV/WebM).");
      }
    },
    [resetAll]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ── Image Analysis ──
  const runImageAnalysis = useCallback(async () => {
    if (!imgRef.current) return;
    try {
      setState("loading-model");
      if (!imgRef.current.complete) {
        await new Promise<void>((r) => { imgRef.current!.onload = () => r(); });
      }
      setState("detecting");
      const pose = await detectPose(imgRef.current);
      if (!pose || pose.score < 0.2) {
        setError("Could not detect a clear human pose. Try a different image with a single player clearly visible.");
        setState("error");
        return;
      }
      setFrameAnalysis(analyzeFromPose(pose));
      setState("done");
    } catch (err) {
      console.error("Image analysis error:", err);
      setError("Analysis failed. Please try Chrome or Edge browser.");
      setState("error");
    }
  }, [analyzeFromPose]);

  // ── Video Analysis ──
  const runVideoAnalysis = useCallback(async () => {
    if (!videoFile) return;
    try {
      setState("extracting");
      const extracted = await extractVideoFrames(videoFile, (p) => setVideoProgress(p));

      setFrames(extracted);

      // Auto-select best frame
      const best = getBestFrame(extracted);
      if (best) {
        const idx = extracted.indexOf(best);
        setSelectedFrameIdx(idx);
        setImageSrc(best.imageSrc);
        if (best.pose) {
          setFrameAnalysis(analyzeFromPose(best.pose));
        }
      } else if (extracted.length > 0) {
        setSelectedFrameIdx(0);
        setImageSrc(extracted[0].imageSrc);
      }

      setState("done");
    } catch (err) {
      console.error("Video analysis error:", err);
      setError("Video analysis failed. Try a shorter clip or different format (MP4 recommended).");
      setState("error");
    }
  }, [videoFile, analyzeFromPose]);

  // ── Frame Selection (video mode) ──
  const handleSelectFrame = useCallback(
    (idx: number) => {
      setSelectedFrameIdx(idx);
      const frame = frames[idx];
      if (!frame) return;
      setImageSrc(frame.imageSrc);
      if (frame.pose && frame.pose.score > 0.2) {
        setFrameAnalysis(analyzeFromPose(frame.pose));
      } else {
        setFrameAnalysis(null);
      }
    },
    [frames, analyzeFromPose]
  );

  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      setImgDimensions({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, []);

  // Display dimensions
  const maxW = 560;
  const displayW = Math.min(maxW, imgDimensions.w || maxW);
  const displayH = imgDimensions.w > 0
    ? Math.round((displayW / imgDimensions.w) * imgDimensions.h)
    : 400;

  const isProcessing = state === "loading-model" || state === "detecting" || state === "extracting";
  const selectedFrame = frames[selectedFrameIdx];

  return (
    <div className="p-5 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            🎯 Video & Pose Analysis
            <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-700">
              AI-POWERED
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a badminton video or photo — AI detects player skeleton, classifies shots, and scores technique against professional references.
          </p>
        </div>
        {mediaType !== "none" && (
          <Badge variant="secondary" className="text-xs">
            {mediaType === "video" ? "🎬 Video Mode" : "📸 Photo Mode"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ═══ Left Column — Upload, Canvas, Timeline ═══ */}
        <div className="space-y-4">
          {/* Upload Zone */}
          {mediaType === "none" && (
            <Card
              className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="text-5xl mb-4">🎬</div>
                <p className="font-semibold text-sm">
                  Drop a badminton video or photo here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • MP4, MOV, WebM, JPG, PNG
                </p>
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/50">
                    <span>🎬</span> Video up to 100MB
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/50">
                    <span>📸</span> Photo up to 20MB
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 max-w-xs">
                  For video: AI extracts frames at 3fps, auto-detects hit moments using wrist acceleration tracking, and analyzes the best action frame.
                </p>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />

          {/* Video Progress */}
          {state === "extracting" && videoProgress && (
            <Card>
              <CardContent className="py-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin text-lg">⚙️</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{videoProgress.message}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      Phase: {videoProgress.phase}
                    </p>
                  </div>
                </div>
                <Progress
                  value={
                    videoProgress.total > 0
                      ? (videoProgress.current / videoProgress.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Image / Canvas Display */}
          {imageSrc && state !== "extracting" && (
            <div className="space-y-3">
              {frameAnalysis ? (
                <PoseCanvas
                  imageSrc={imageSrc}
                  keypoints={frameAnalysis.pose.keypoints}
                  metrics={frameAnalysis.biomechanics.metrics}
                  width={displayW}
                  height={displayH}
                />
              ) : (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Analysis source"
                  className="rounded-lg border border-border shadow-md max-w-full"
                  style={{ maxWidth: displayW }}
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              {/* Hidden img for pose detection */}
              {frameAnalysis && (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt=""
                  className="hidden"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              {/* Frame info badge for video */}
              {mediaType === "video" && selectedFrame && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">
                    Frame {selectedFrameIdx + 1}/{frames.length}
                  </span>
                  <span>•</span>
                  <span>{selectedFrame.timestamp.toFixed(1)}s</span>
                  {selectedFrame.isHitFrame && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="text-[10px] py-0">
                        HIT FRAME
                      </Badge>
                    </>
                  )}
                  {selectedFrame.wristSpeed > 0 && (
                    <>
                      <span>•</span>
                      <span>Wrist speed: {selectedFrame.wristSpeed.toFixed(0)}px/f</span>
                    </>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {mediaType === "image" && (
                  <Button
                    onClick={runImageAnalysis}
                    disabled={isProcessing}
                    className="flex-1"
                    style={{ background: "linear-gradient(135deg, #1A5C38, #0d3d25)" }}
                  >
                    {state === "loading-model"
                      ? "⏳ Loading AI model..."
                      : state === "detecting"
                      ? "🔍 Analyzing..."
                      : state === "done"
                      ? "🔄 Re-analyze"
                      : "🎯 Analyze Pose"}
                  </Button>
                )}
                {mediaType === "video" && state === "idle" && (
                  <Button
                    onClick={runVideoAnalysis}
                    disabled={isProcessing}
                    className="flex-1"
                    style={{ background: "linear-gradient(135deg, #1A5C38, #0d3d25)" }}
                  >
                    🎬 Analyze Video
                  </Button>
                )}
                <Button variant="outline" onClick={resetAll}>
                  New Upload
                </Button>
              </div>

              {state === "loading-model" && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Loading TensorFlow.js MoveNet model (first time ~5-10 seconds)...
                </p>
              )}
            </div>
          )}

          {/* Video ready but not yet analyzed */}
          {mediaType === "video" && !imageSrc && state === "idle" && (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <div className="text-4xl">🎬</div>
                <div>
                  <p className="text-sm font-semibold">
                    {videoFile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((videoFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  onClick={runVideoAnalysis}
                  style={{ background: "linear-gradient(135deg, #1A5C38, #0d3d25)" }}
                >
                  🎬 Start Video Analysis
                </Button>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                  AI will extract frames, detect poses, measure wrist acceleration to find hit moments, and classify each shot.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Frame Timeline (video mode) */}
          {mediaType === "video" && frames.length > 0 && (
            <FrameTimeline
              frames={frames}
              selectedIndex={selectedFrameIdx}
              onSelectFrame={handleSelectFrame}
            />
          )}

          {/* Error */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <p className="text-xs text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══ Right Column — Results ═══ */}
        <div>
          {state === "done" && frameAnalysis ? (
            <div className="space-y-4">
              {/* Video summary stats */}
              {mediaType === "video" && frames.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">📊 Video Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-black text-foreground">{frames.length}</div>
                        <div className="text-[10px] text-muted-foreground">Frames Analyzed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-destructive">
                          {frames.filter((f) => f.isHitFrame).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Hit Frames</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-emerald-600">
                          {frames.filter((f) => f.pose && f.pose.score > 0.3).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Poses Detected</div>
                      </div>
                    </div>

                    {/* Hit frame chips */}
                    {frames.filter((f) => f.isHitFrame).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {frames
                          .filter((f) => f.isHitFrame)
                          .map((f) => (
                            <button
                              key={f.index}
                              onClick={() => handleSelectFrame(f.index)}
                              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                                f.index === selectedFrameIdx
                                  ? "bg-destructive text-destructive-foreground border-destructive"
                                  : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                              }`}
                            >
                              ⚡ {f.timestamp.toFixed(1)}s
                            </button>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <PoseResults
                classification={frameAnalysis.classification}
                biomechanics={frameAnalysis.biomechanics}
                reference={frameAnalysis.reference}
              />
            </div>
          ) : (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-16">
                <div className="text-4xl mb-3">🏸</div>
                <p className="text-sm font-medium text-muted-foreground">
                  {state === "extracting"
                    ? "Analyzing your video..."
                    : "Upload a video or photo to begin"}
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                  {state === "extracting"
                    ? "AI is extracting frames, detecting poses, and identifying hit moments. This may take 30-60 seconds."
                    : "The AI will detect skeleton, classify shot type (Smash, Net Drop, Defense, Backhand Clear), and score technique against professional references."}
                </p>

                {state !== "extracting" && (
                  <div className="mt-6 space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Detectable Shots
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs max-w-xs mx-auto">
                      {[
                        { icon: "💥", label: "Smash", desc: "Overhead power" },
                        { icon: "🎯", label: "Net Drop", desc: "Front court finesse" },
                        { icon: "🛡️", label: "Defense", desc: "Ready stance" },
                        { icon: "↩️", label: "Backhand", desc: "Cross-body clear" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-1.5 px-2 py-2 rounded bg-muted/50"
                        >
                          <span className="text-base">{s.icon}</span>
                          <div className="text-left">
                            <div className="font-medium text-foreground">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 rounded bg-muted/30 text-[10px] text-muted-foreground max-w-xs mx-auto">
                      <p className="font-semibold mb-1">🎬 Video Analysis Features:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>Frame extraction at 3fps</li>
                        <li>Auto hit-frame detection via wrist acceleration</li>
                        <li>Frame-by-frame skeleton overlay</li>
                        <li>Shot classification per frame</li>
                        <li>Biomechanical scoring vs pro references</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
