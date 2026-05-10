

# Badminton Pose Analysis Module — Production Plan

## What This Does

Adds a **Pose Analysis** tab to the Badminton Intelligence module that lets coaches upload a photo or short video of an athlete playing a shot, and the system will:

1. **Detect the player's skeleton** using TensorFlow.js MoveNet (runs entirely in-browser, no server needed)
2. **Classify the shot type** (Smash, Net Drop, Defense, Backhand Clear) using joint-angle heuristics
3. **Compare the pose against ideal reference models** of professional players (Lee Chong Wei / Tai Tzu Ying skeleton templates from the research)
4. **Score biomechanical quality** — joint angles, lunge distance, arm configuration
5. **Show a radar chart** comparing the athlete's form to the professional reference

This mirrors the GitHub repo's pipeline but runs client-side using TensorFlow.js instead of Python/OpenPose.

---

## Architecture

```text
┌──────────────────────────────────────────────────┐
│  BadmintonShell  (existing)                      │
│  ┌──────────────────────────────────────────────┐│
│  │ /sports/badminton/pose-analysis   (NEW)      ││
│  │                                              ││
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ││
│  │  │ Upload  │→ │ MoveNet  │→ │ Classifier │  ││
│  │  │ Image/  │  │ Skeleton │  │ + Scoring  │  ││
│  │  │ Video   │  │ Detect   │  │ Engine     │  ││
│  │  └─────────┘  └──────────┘  └────────────┘  ││
│  │       ↓              ↓            ↓          ││
│  │  Canvas Overlay   Angle Calc   Radar Chart   ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `src/modules/badminton/pose/PoseAnalysisPage.tsx` | Main page — upload, canvas, results |
| `src/modules/badminton/pose/poseEngine.ts` | TensorFlow.js MoveNet loading + inference |
| `src/modules/badminton/pose/shotClassifier.ts` | Rule-based shot classification from keypoints |
| `src/modules/badminton/pose/referenceModels.ts` | Ideal skeleton templates per shot type (angles/ratios from research) |
| `src/modules/badminton/pose/biomechanics.ts` | Joint angle calculation, comparison scoring, radar data |
| `src/modules/badminton/pose/PoseCanvas.tsx` | Canvas overlay drawing skeleton on image |
| `src/modules/badminton/pose/PoseResults.tsx` | Radar chart + score breakdown + coaching tips |

### Modified Files

| File | Change |
|------|--------|
| `BadmintonRouter.tsx` | Add route `pose-analysis` → `PoseAnalysisPage` |
| `BadmintonShell.tsx` | Add "Pose Analysis" nav tab with 🎯 icon |
| `package.json` | Add `@tensorflow/tfjs` and `@tensorflow-models/pose-detection` |

---

## Key Technical Decisions

1. **MoveNet Lightning** (not BlazePose) — faster, lighter, sufficient for single-person badminton frames. ~30ms per frame on modern hardware.

2. **Rule-based shot classification** instead of CNN — we define angle thresholds derived from the research paper's features:
   - **Smash**: elbow angle > 150°, wrist above head, torso leaning forward
   - **Net Drop**: front knee angle < 120° (lunge), racket hand below shoulder
   - **Defense**: wide stance (hip-to-ankle spread), low center of gravity
   - **Backhand**: racket arm crossing body midline, torso rotation > 30°

3. **Reference models** stored as normalized joint-angle arrays (not raw keypoints) so they're camera-independent — solving the homography problem from the repo without needing court detection.

4. **Scoring** via cosine similarity between detected and reference angle vectors, mapped to 0–100 scale.

5. **Image-first, video-optional** — image upload works immediately; video support extracts key frames at 2fps for batch analysis.

---

## Detailed Implementation

### Step 1: Dependencies
Add `@tensorflow/tfjs` (~1.5MB gzipped) and `@tensorflow-models/pose-detection` to package.json.

### Step 2: Pose Engine (`poseEngine.ts`)
- Lazy-load TF.js model on first use (not at app startup)
- Singleton pattern to avoid re-downloading
- Returns 17 keypoints (COCO format) with confidence scores
- Minimum confidence threshold: 0.3

### Step 3: Shot Classifier (`shotClassifier.ts`)
- Takes keypoints → calculates 8 key angles (shoulder, elbow, hip, knee for both sides)
- Decision tree classifier using angle ranges from the research
- Returns: `{ shotType, confidence, angles }`

### Step 4: Reference Models (`referenceModels.ts`)
- Pre-computed ideal angle arrays for each shot type, derived from the research paper's professional player data
- Separate male/female references where biomechanics differ significantly

### Step 5: Biomechanics Scoring (`biomechanics.ts`)
- Compare detected angles against reference
- Per-metric scores: arm position, torso angle, leg stance, follow-through
- Overall form score (weighted average)
- Generate coaching tips based on largest deviations

### Step 6: UI — Page + Canvas + Results
- Upload zone (drag-drop or click, accepts image/video)
- Live skeleton overlay on canvas with color-coded joints (green = good, red = needs correction)
- Shot type badge with confidence
- Radar chart (Recharts, already in project) comparing 6 metrics against ideal
- Coaching recommendations panel with specific angle corrections

### Step 7: Navigation Integration
- Add tab to BadmintonShell
- Lazy-load the page to avoid TF.js bundle impacting other pages

---

## What's NOT included (and why)

- **Real-time webcam** — Not in scope for v1. Can be added later.
- **Video timeline scrubbing** — v1 extracts best frame automatically; manual scrubbing is v2.
- **Court detection/homography** — Not needed because we use normalized angle comparison instead of absolute position comparison.
- **Model training** — We use pre-computed reference templates, not a trainable classifier.

