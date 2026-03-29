// ─── Pose Analysis Page — Multi-Player Video + Photo Analysis ─────────────
import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { detectAllPoses, type DetectedPlayer } from "./poseEngine";
import { classifyShot, type ClassificationResult } from "./shotClassifier";
import { scoreBiomechanics, type BiomechanicsResult } from "./biomechanics";
import { getReferenceModel, type ReferenceModel } from "./referenceModels";
import { PoseCanvas } from "./PoseCanvas";
import { PoseResults } from "./PoseResults";
import { PlayerSelector } from "./PlayerSelector";
import {
  extractVideoFrames,
  getBestFrame,
  type ExtractedFrame,
  type VideoAnalysisProgress,
} from "./videoExtractor";
import { FrameTimeline } from "./FrameTimeline";

type MediaType = "none" | "image" | "video";
type AnalysisState = "idle" | "loading-model" | "detecting" | "extracting" | "done" | "error";

interface PlayerAnalysis {
  classification: ClassificationResult;
  biomechanics: BiomechanicsResult;
  reference: ReferenceModel | null;
}

export default function PoseAnalysisPage() {
  const [state, setState] = useState<AnalysisState>("idle");
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [error, setError] = useState("");

  // Image mode
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  // Multi-player detection
  const [players, setPlayers] = useState<DetectedPlayer[]>([]);
  const [selectedPlayerIdx, setSelectedPlayerIdx] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [playerAnalyses, setPlayerAnalyses] = useState<Map<number, PlayerAnalysis>>(new Map());

  // Video mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);
  const [videoProgress, setVideoProgress] = useState<VideoAnalysisProgress | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resetAll = useCallback(() => {
    setState("idle");
    setMediaType("none");
    setError("");
    setImageSrc(null);
    setImgDimensions({ w: 0, h: 0 });
    setPlayers([]);
    setSelectedPlayerIdx(0);
    setCompareMode(false);
    setPlayerAnalyses(new Map());
    setVideoFile(null);
    setFrames([]);
    setSelectedFrameIdx(0);
    setVideoProgress(null);
  }, []);

  const analyzePlayer = useCallback((player: DetectedPlayer): PlayerAnalysis => {
    const cls = classifyShot(player.pose.keypoints);
    const ref = getReferenceModel(cls.shotType);
    const bio = scoreBiomechanics(cls.angles, (ref ?? getReferenceModel("Smash")!).angles);
    return { classification: cls, biomechanics: bio, reference: ref };
  }, []);

  const analyzeAllPlayers = useCallback(
    (detectedPlayers: DetectedPlayer[]) => {
      const analyses = new Map<number, PlayerAnalysis>();
      detectedPlayers.forEach((p, idx) => {
        analyses.set(idx, analyzePlayer(p));
      });
      setPlayerAnalyses(analyses);
    },
    [analyzePlayer]
  );

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

  // ── Image Analysis (multi-pose) ──
  const runImageAnalysis = useCallback(async () => {
    if (!imgRef.current) return;
    try {
      setState("loading-model");
      if (!imgRef.current.complete) {
        await new Promise<void>((r) => { imgRef.current!.onload = () => r(); });
      }
      setState("detecting");
      const detected = await detectAllPoses(imgRef.current);
      if (detected.length === 0) {
        setError("No players detected. Try a different image with clear full-body views.");
        setState("error");
        return;
      }
      setPlayers(detected);
      setSelectedPlayerIdx(0);
      analyzeAllPlayers(detected);
      setState("done");
    } catch (err) {
      console.error("Image analysis error:", err);
      setError("Analysis failed. Please try Chrome or Edge browser.");
      setState("error");
    }
  }, [analyzeAllPlayers]);

  // ── Video Analysis ──
  const runVideoAnalysis = useCallback(async () => {
    if (!videoFile) return;
    try {
      setState("extracting");
      const extracted = await extractVideoFrames(videoFile, (p) => setVideoProgress(p));
      setFrames(extracted);

      const best = getBestFrame(extracted);
      if (best) {
        const idx = extracted.indexOf(best);
        setSelectedFrameIdx(idx);
        setImageSrc(best.imageSrc);
        setPlayers(best.players);
        setSelectedPlayerIdx(0);
        analyzeAllPlayers(best.players);
      } else if (extracted.length > 0) {
        setSelectedFrameIdx(0);
        setImageSrc(extracted[0].imageSrc);
        setPlayers(extracted[0].players);
        analyzeAllPlayers(extracted[0].players);
      }

      setState("done");
    } catch (err) {
      console.error("Video analysis error:", err);
      setError("Video analysis failed. Try a shorter clip or MP4 format.");
      setState("error");
    }
  }, [videoFile, analyzeAllPlayers]);

  // ── Frame Selection (video) ──
  const handleSelectFrame = useCallback(
    (idx: number) => {
      setSelectedFrameIdx(idx);
      const frame = frames[idx];
      if (!frame) return;
      setImageSrc(frame.imageSrc);
      setPlayers(frame.players);
      setSelectedPlayerIdx(0);
      analyzeAllPlayers(frame.players);
    },
    [frames, analyzeAllPlayers]
  );

  // ── Player Selection ──
  const handleSelectPlayer = useCallback((idx: number) => {
    setSelectedPlayerIdx(idx);
  }, []);

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
  const currentAnalysis = playerAnalyses.get(selectedPlayerIdx);
  const compareAnalysis = compareMode && players.length >= 2
    ? playerAnalyses.get(selectedPlayerIdx === 0 ? 1 : 0)
    : null;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            🎯 Video & Pose Analysis
            <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-700">
              AI · MULTI-PLAYER
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a badminton video or photo — AI detects <strong>all players</strong>, classifies shots, and scores technique against professional references.
          </p>
        </div>
        {mediaType !== "none" && (
          <div className="flex gap-2">
            {players.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                👥 {players.length} Player{players.length > 1 ? "s" : ""} Detected
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {mediaType === "video" ? "🎬 Video" : "📸 Photo"}
            </Badge>
          </div>
        )}
      </div>

      <div className={`grid gap-5 ${compareMode ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
        {/* ═══ Left Column — Upload, Canvas, Timeline ═══ */}
        <div className={`space-y-4 ${compareMode ? "xl:col-span-1" : ""}`}>
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
                <div className="mt-4 p-3 rounded bg-muted/30 text-[10px] text-muted-foreground max-w-xs">
                  <p className="font-semibold mb-1">👥 Multi-Player Detection:</p>
                  <p>AI detects <strong>all players</strong> on court simultaneously. Select which player to analyze, or compare both side-by-side.</p>
                </div>
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
                    <p className="text-[10px] text-muted-foreground capitalize">Phase: {videoProgress.phase}</p>
                  </div>
                </div>
                <Progress
                  value={videoProgress.total > 0 ? (videoProgress.current / videoProgress.total) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Canvas Display */}
          {imageSrc && state !== "extracting" && (
            <div className="space-y-3">
              {players.length > 0 ? (
                <PoseCanvas
                  imageSrc={imageSrc}
                  players={players}
                  selectedPlayerIdx={selectedPlayerIdx}
                  metrics={currentAnalysis?.biomechanics.metrics}
                  phase={currentAnalysis?.classification.phase}
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

              {players.length > 0 && (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt=""
                  className="hidden"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              )}

              {/* Player Selector */}
              <PlayerSelector
                players={players}
                selectedIdx={selectedPlayerIdx}
                onSelect={handleSelectPlayer}
                compareMode={compareMode}
                onToggleCompare={() => setCompareMode((c) => !c)}
              />

              {/* Video frame info */}
              {mediaType === "video" && selectedFrame && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono">
                    Frame {selectedFrameIdx + 1}/{frames.length}
                  </span>
                  <span>•</span>
                  <span>{selectedFrame.timestamp.toFixed(1)}s</span>
                  <span>•</span>
                  <span>👥 {selectedFrame.players.length} player{selectedFrame.players.length !== 1 ? "s" : ""}</span>
                  {selectedFrame.isHitFrame && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="text-[10px] py-0">HIT FRAME</Badge>
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
                      ? "⏳ Loading AI..."
                      : state === "detecting"
                      ? "🔍 Detecting players..."
                      : state === "done"
                      ? "🔄 Re-analyze"
                      : "🎯 Detect & Analyze"}
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
                  Loading TensorFlow.js MoveNet multi-pose model (~5-10 seconds)...
                </p>
              )}
            </div>
          )}

          {/* Video ready but not analyzed */}
          {mediaType === "video" && !imageSrc && state === "idle" && (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <div className="text-4xl">🎬</div>
                <div>
                  <p className="text-sm font-semibold">{videoFile?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((videoFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  onClick={runVideoAnalysis}
                  style={{ background: "linear-gradient(135deg, #1A5C38, #0d3d25)" }}
                >
                  🎬 Start Multi-Player Video Analysis
                </Button>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                  AI will detect <strong>both players</strong> in each frame, track wrist acceleration for hit detection, and classify shots per player.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Frame Timeline */}
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
        {state === "done" && currentAnalysis ? (
          compareMode && compareAnalysis ? (
            // ── Compare Mode: side-by-side ──
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-emerald-300">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold">
                    Player {selectedPlayerIdx + 1}
                    {players[selectedPlayerIdx]?.courtPosition !== "unknown" &&
                      ` · ${players[selectedPlayerIdx]?.courtPosition === "near" ? "Near" : "Far"} Court`}
                  </span>
                </div>
                <PoseResults
                  classification={currentAnalysis.classification}
                  biomechanics={currentAnalysis.biomechanics}
                  reference={currentAnalysis.reference}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-blue-300">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold">
                    Player {selectedPlayerIdx === 0 ? 2 : 1}
                    {players[selectedPlayerIdx === 0 ? 1 : 0]?.courtPosition !== "unknown" &&
                      ` · ${players[selectedPlayerIdx === 0 ? 1 : 0]?.courtPosition === "near" ? "Near" : "Far"} Court`}
                  </span>
                </div>
                <PoseResults
                  classification={compareAnalysis.classification}
                  biomechanics={compareAnalysis.biomechanics}
                  reference={compareAnalysis.reference}
                />
              </div>
            </>
          ) : (
            // ── Single Player Results ──
            <div className="space-y-4">
              {/* Video summary */}
              {mediaType === "video" && frames.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">📊 Video Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-xl font-black">{frames.length}</div>
                        <div className="text-[10px] text-muted-foreground">Frames</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-destructive">
                          {frames.filter((f) => f.isHitFrame).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Hits</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-emerald-600">
                          {Math.max(...frames.map((f) => f.players.length))}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Max Players</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-blue-600">
                          {frames.filter((f) => f.players.length >= 2).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Both Visible</div>
                      </div>
                    </div>

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
                              ⚡ {f.timestamp.toFixed(1)}s · {f.players.length}p
                            </button>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Selected player header */}
              {players.length > 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>
                    Showing analysis for <strong className="text-foreground">Player {selectedPlayerIdx + 1}</strong>
                    {players[selectedPlayerIdx]?.courtPosition !== "unknown" &&
                      ` (${players[selectedPlayerIdx]?.courtPosition === "near" ? "Near" : "Far"} Court)`}
                  </span>
                  <span>•</span>
                  <span>Click another player above to switch</span>
                </div>
              )}

              <PoseResults
                classification={currentAnalysis.classification}
                biomechanics={currentAnalysis.biomechanics}
                reference={currentAnalysis.reference}
              />
            </div>
          )
        ) : (
          // ── Placeholder ──
          <div className={compareMode ? "xl:col-span-2" : ""}>
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
                    ? "AI is detecting all players, tracking wrist motion, and identifying hit moments."
                    : "AI detects both players simultaneously. Choose which to analyze or compare side-by-side."}
                </p>
                {state !== "extracting" && (
                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs max-w-xs mx-auto">
                      {[
                        { icon: "💥", label: "Smash", desc: "Overhead power" },
                        { icon: "🎯", label: "Net Drop", desc: "Finesse" },
                        { icon: "🛡️", label: "Defense", desc: "Ready stance" },
                        { icon: "↩️", label: "Backhand", desc: "Cross-body" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 px-2 py-2 rounded bg-muted/50">
                          <span className="text-base">{s.icon}</span>
                          <div className="text-left">
                            <div className="font-medium text-foreground">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded bg-muted/30 text-[10px] text-muted-foreground max-w-xs mx-auto">
                      <p className="font-semibold mb-1">👥 Multi-Player Features:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>Detects all players on court simultaneously</li>
                        <li>Auto-labels Near Court vs Far Court</li>
                        <li>Side-by-side comparison mode</li>
                        <li>Per-player shot classification & scoring</li>
                        <li>Hit-frame detection via wrist acceleration</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
