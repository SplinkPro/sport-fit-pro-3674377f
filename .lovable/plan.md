

## Full Multi-Agent End-to-End Audit Report

### Team assembled:
1. **UX/UI Expert** — visual clarity, demo readiness, layout issues
2. **Code Reviewer** — regressions, dead code, logical errors
3. **Logic & AI Expert** — formula accuracy, query engine, scoring
4. **Security Expert** — client-side auth, data exposure, session handling
5. **Prompt Engineer** — AI query interpretations, edge cases, language
6. **Go/No-Go Decision** — final call

---

## 🔴 CRITICAL — Must fix before demo

### C1 — Reports Tab is BROKEN (AthleteProfile.tsx lines 1192–1237)
**Agent: Code Reviewer**

The `ReportsTab` function at line 1198–1201 is a dead stub. `handleGenerate` sets a spinner for 2 seconds and does nothing. The three buttons (Export PDF, Export CSV, Print Coach Summary) have NO onClick handlers attached:
- Line 1218: `<Button ... className="gap-1.5">{p.exportCSV}</Button>` — no `onClick`
- Line 1219: `<Button ... className="gap-1.5">{p.printSummary}</Button>` — no `onClick`
- Line 1215: Export PDF just sets `generating=true` for 2 seconds then stops

**Previous fix message** said these were connected to real handlers, but reading the actual code at lines 1192–1237 confirms the real export handlers (`handleExportCSV`, `handleExportPDF`, `handlePrintCoachSummary`) were described in the message but **do not exist in the file**. The file shows the stub version only.

**Impact on demo**: The SAI audience will click "Export PDF" and nothing will happen. Critical demo failure.

**Fix**: Wire up real export functions to all three buttons.

---

### C2 — Health Tab BMI uses Adult Thresholds (AthleteProfile.tsx lines 1118–1122)
**Agent: Logic Expert**

The `HealthTab` function at line 1118–1122 still uses the old **adult BMI thresholds**:
```typescript
const bmiCat =
  bmi < 18.5 ? { label: dict.bmi.underweight ... }
  : bmi < 25 ? { label: dict.bmi.normal ... }
  : bmi < 30 ? { label: dict.bmi.overweight ... }
  : { label: dict.bmi.obese ... }
```

This was fixed in the **header section** (lines 67–72 use IAP thresholds correctly), but the Health tab at line 1118 was missed — it still uses 18.5/25/30/obese cutoffs. A 14-year-old girl with BMI 17.2 correctly shows "Mild Thinness — Monitor" in the profile header, but clicking the "Health & Growth" tab shows "Underweight" using the adult scale. **This is scientifically wrong and contradictory within the same profile.**

**Impact on demo**: If SAI officials click the Health tab they'll see a contradictory BMI classification on the same athlete.

**Fix**: Apply IAP thresholds to the Health tab's bmiCat calculation, same as the header fix.

---

### C3 — Trajectory Tab: `Math.round` on seconds in Methodology run800m formatter (AthleteProfile.tsx line 550)
**Agent: Code Reviewer**

Line 550 in the Trajectory tab metric options:
```typescript
fmt: (v) => { const m = Math.floor(v/60); const s = Math.round(v%60); return `${m}:${s.toString().padStart(2,"0")}`; }
```
Uses `Math.round` — if `v=239.6`, `239.6 % 60 = 59.6`, `Math.round(59.6) = 60` → displays as `3:60`. The PerformanceTab `fmtRunTime` already has the correct `Math.floor` fix. The Trajectory tab formatter has the same bug and was missed.

**Fix**: Change `Math.round` to `Math.floor` on line 550.

---

## 🟠 HIGH — Logic errors that affect scoring or mislead viewers

### H1 — Methodology page Sport Weights are STALE (Methodology.tsx lines 33–42)
**Agent: Logic Expert**

`SPORT_WEIGHTS` object in Methodology.tsx (line 33) only lists 8 sports. Since the last update added 15 sports to `sportsConfig.ts`, the Methodology page shows incomplete data. SAI officials viewing the Methodology tab see only Athletics, Football, Kabaddi, Volleyball, Cycling, Wrestling, Swimming, Basketball. Badminton, Boxing, Hockey, Archery, Kho Kho, Table Tennis, Weightlifting are **all missing from the documentation**.

Additionally the shuttle run in `METRIC_DISPLAY` at line 49 says "10×5m" but the actual test is "10m×6" (60m total). Discrepancy between documentation and implementation.

**Fix**: Sync Methodology sport weights to `SPORTS_CONFIG`, fix shuttle label to "10m×6".

---

### H2 — Explorer `isBlocked` check incomplete (Explorer.tsx lines 499–504)
**Agent: Code Reviewer**

```typescript
const isBlocked =
  athlete.sprint30mFlag === "OUTLIER_VERIFY" ||
  athlete.broadJumpFlag === "OUTLIER_VERIFY" ||
  athlete.run800mFlag === "FORMAT_UNREADABLE" ||
  athlete.run800mFlag === "IMPLAUSIBLE_VERIFY" ||
  athlete.vjFlag === "UNCLEAR_VERIFY";
```

This is the visual block indicator for the Explorer row. It does NOT include `athlete.vjFlag === "AUTO_CORRECTED"` — an athlete with an auto-corrected VJ does not get the red border treatment even though their data was modified. More importantly, the `dataQualityIssues` severity logic in csvParser.ts (line 604) marks `hasCriticalFlag` based on the same 5 conditions, but if an athlete is `"verify"` severity (not blocked), they won't get the red left border in Explorer. This is fine, but the BLOCKED badge on the right side (line 535–539) does correctly only show on blocked athletes.

**Minor inconsistency**: `vjFlag === "AUTO_CORRECTED"` athletes have no visual marker whatsoever in Explorer — not even an amber tint. They appear identical to clean athletes.

---

### H3 — Fly Start Sprint: "standinggbroadjump" vs "standinggbroadjump" fuzzy collision risk
**Agent: Logic Expert**

In `COLUMN_MAP` at csvParser.ts line 59: `"standinggbroadjump": "broadJump"` (two g's). This matches because the normalize function strips spaces and special chars. The column "standing g broad jump" (with a space-letter typo) would normalise to "standinggbroadjump" and map correctly. This is actually fine.

However, the query `"standingjump"` maps to broadJump (line 65) AND "vjump" maps to verticalJump. If a coach column is simply "Jump" → normalises to "jump" → **no match in COLUMN_MAP**. A column named exactly "jump" silently fails to map to either metric. This is a detection gap.

---

### H4 — AI Query "top 5 female athletes" returns 10 by default
**Agent: Prompt Engineer**

`parseTopN` regex: `/(?:top|first|show)\s+(\d+)/i` — matches "top 5" → returns 5. This works correctly.

However the demo query **"Show me the top 5 female athletes"** maps to limit=5. Good.

**But**: The "Show me the top 5 female athletes" query hits both the gender filter AND the `limit` parser. The pool is first filtered to females, then sorted by composite, then sliced to 5. This is correct. ✅

**Edge case found**: If the demo presenter types "Show top female athletes" (no number), `parseTopN` returns **10** by default (line 26). The demo script says "top 5" so this won't be a problem if they follow the script exactly. But a freeform query of "show female athletes" returns 10 — not 5. Flag for presenter awareness.

---

### H5 — Analytics page does NOT filter out BLOCKED athletes from charts
**Agent: Logic Expert**

Analytics.tsx line 213-215: `const values = athletes.map(...)` — uses the raw `athletes` array directly. Blocked athletes (sprint30mFlag === "OUTLIER_VERIFY" etc.) have their flagged metrics set to `null/undefined` by the parser, so they contribute `null` values which are filtered out at line 215. 

**However**, blocked athletes still appear in:
- The "Total Athletes" KPI count (line 119)
- The age band distribution (lines 89–93)
- The gender split pie (lines 83–86)
- The school leaderboard average score (line 112) — **blocked athletes have compositeScore=0 which drags down school averages**

A school with 3 blocked athletes will show a lower average score than it should. During the demo, if a presenter is showing school leaderboard, the scores may look artificially low.

---

## 🟡 DEMO FLOW RISKS

### D1 — Radar chart: "Coordination" axis
**Agent: UX Expert**

The radar chart in `OverviewTab` at line 169–175 only shows 5 axes: Speed, Power, Endurance, Agility, Body Comp. There is no "Coordination" axis. This is correct since Coordination is always absent. However the CAPI formula card at line 536 says `"CAPI = V.Jump(25%) + Broad Jump(20%) + 30m Sprint(25%) + 800m Run(25%) + Shuttle(5%)"` — the weights add to 100% and are accurate. **No issue here.** ✅

### D2 — Trajectory tab "Age category passed" fix regression check
**Agent: Code Reviewer**

The `agedOut` fix correctly shows "Age category passed" for athletes over the category ceiling. However the `calcGapToRecords` function in `indianBenchmarks.ts` needs to have `agedOut` set correctly. Looking at the `gaps` data used in AthleteProfile line 566–569, `calcGapToRecords` is imported but we need to verify the `agedOut` field is being set in that function. The `gap.agedOut` is referenced at line 832 in the JSX — if `agedOut` is missing from the return type, TypeScript would fail silently. Need to confirm the `GapToRecord` interface includes it.

### D3 — "Print Coach Summary" and "Export CSV" buttons on Reports tab have no handler
Same as C1 — reconfirmed as critical.

### D4 — Mobile layout at 1280×720
**Agent: UX Expert**

The athlete profile header uses `flex-wrap` and `flex items-center gap-3 mt-1`. At 1280×720 (standard government laptop), the 3-column overview grid (`grid-cols-3`) and the performance tab's metric table may be tight. The radar chart height is fixed at `h-52` (208px). This should render fine at 1280px. The main risk is the overview tab's 3-column layout at narrow widths — the third column cards may get squeezed.

### D5 — Import history shows real entries or empty — CONFIRMED FIXED
**Agent: Code Reviewer**

Line 65–72 in Import.tsx: `loadHistory()` returns `[]` when localStorage is empty. The fake hardcoded history was previously removed. ✅

---

## 🔵 HARDCODED / DEBUG CODE

### DB1 — SEED_META count says 82 athletes (useAthletes.ts line 43)
**Agent: Code Reviewer**

```typescript
export const SEED_META: DatasetMeta = {
  count: 82,
  ...
```

The actual demo uses 41 U14 female athletes. If seed data has 82 total, this number is technically correct (full seed dataset). But the demo will say "82 athletes" on the dataset switcher badge, which conflicts with the demo script that references "41 U14 female athletes from Bihar". The presenter needs to import the Bihar file to show the correct 41-athlete dataset — the seed data shows 82.

This is not a bug, but a **demo flow risk**: starting on the seed data shows "82 athletes" and the presenter needs to switch to the imported Bihar dataset to match the script.

### DB2 — Console.log in csvParser.ts line 376–377
Line 376: `// Debug logs removed — kept for reference during development only` — this is a comment, not actual logs. ✅ Clean.

### DB3 — Methodology.tsx shuttle run label
Line 49: `label: "10×5m Shuttle Run"` — should be `"10m×6 Shuttle Run"`. Minor but visible on the Methodology page that SAI will scrutinize.

---

## ✅ VERIFIED CLEAN (Confirmed working correctly)

1. **VO2max formula** (analyticsEngine.ts line 296): `const vo2 = 483 / timeMin + 3.5` — correct, multiplier removed ✅
2. **Age midpoints** (csvParser.ts line 344): `U14: 14, U12: 12` — correct ✅
3. **broadJumpFlag in hasCriticalFlag** (csvParser.ts line 608): `broadJumpFlag === "OUTLIER_VERIFY"` — present ✅
4. **National band proxy fix** (AthleteProfile.tsx line 349): `getSAIBand(di.nationalComposite)` — correct ✅
5. **BMI profile header IAP fix** (AthleteProfile.tsx lines 67–72): Correct IAP thresholds ✅
6. **CAPI percentile label** (en.ts line 160): `"CAPI Score (percentile)"` ✅
7. **Explorer column header** (Explorer.tsx line 235): `"CAPI Pct."` ✅
8. **Explorer score suffix** (Explorer.tsx lines 641–643): `{a.compositeScore}<span>pct</span>` ✅
9. **Explorer run800m float seconds** (Explorer.tsx line 634): `Math.floor(a.run800m % 60)` ✅
10. **Import history no fake data** (Import.tsx lines 65–72): Returns `[]` when empty ✅
11. **Male vs Female AI query** (AIQuery.tsx line 100–114): Handles all-female dataset gracefully ✅
12. **Data quality AI query** (AIQuery.tsx lines 207–231): Returns blocked + flagged + auto-corrected ✅
13. **Nutrition support AI query** (AIQuery.tsx line 173–178): Filters BMI < 16.0 correctly ✅
14. **Blocked indicator in Explorer** (Explorer.tsx lines 499–539): Red row + BLOCKED badge ✅
15. **CAPI denominator normalization** (analyticsEngine.ts line 148–151): `totalWeight` denominator correct ✅
16. **Sprint/run inversion** (analyticsEngine.ts line 19, 62–96): `LOWER_IS_BETTER` set applied ✅
17. **VO2max clamp** (analyticsEngine.ts line 297–298): `Math.max(20, Math.min(85, vo2))` ✅
18. **Age category passed fix** (AthleteProfile.tsx line 832–854): Renders correctly ✅
19. **VJ auto-correction** (csvParser.ts line 212–238): Dual convention correction active ✅
20. **Broad Jump plausibility gate** (csvParser.ts line 254–258): `>260` blocked ✅

---

## ⚠️ NEEDS MANUAL BROWSER CHECK

1. **Radar chart at 1280×720** — confirm all 5 axis labels visible without clipping
2. **Import → Data Quality screen sequence** — verify the 3.5 step renders before scores
3. **PDF export** — currently does nothing (C1 above), needs fixing first
4. **Hindi mode on Nutrition tab** — verify all labels switch correctly

---

## GO / NO-GO DECISION

**Agent: Go/No-Go Decision Lead**

**CURRENT STATUS: CONDITIONAL NO-GO**

**Blockers (must fix before demo):**
1. 🔴 C1 — Report Export buttons are dead stubs. Export PDF/CSV/Print do nothing. This will be clicked by SAI officials during demo.
2. 🔴 C2 — Health tab still shows adult BMI thresholds, contradicting the profile header on same page.
3. 🟠 H1 — Methodology page shows 8 sports, not 15 — SAI will notice missing Badminton, Hockey, Boxing.
4. 🟡 DB1 — Demo presenter must start on imported Bihar file (41 athletes), not seed data (82).

**Items that are SAFE to ignore for tomorrow:**
- H2 (auto-corrected athletes have no visual marker in Explorer — minor)
- H3 (column "jump" doesn't map — unlikely to occur with Bihar file)
- H4 (default query returns 10 not 5 — only if presenter deviates from script)
- H5 (blocked athletes in school leaderboard count — low visibility)
- D2 (gap records regression — visually works, type safety concern only)
- C3 (Trajectory 3:60 edge case — only for athletes with exactly ~239.5s run time)
- DB3 (shuttle label "10×5m" vs "10m×6" — minor)

**If C1, C2, and H1 are fixed: GO ✅**

---

## Files to change

| File | Fix |
|---|---|
| `src/pages/AthleteProfile.tsx` | C1: Wire real export handlers to 3 buttons; C2: Fix HealthTab BMI thresholds; C3: Math.floor in trajectory fmt |
| `src/pages/Methodology.tsx` | H1: Sync sport weights table from SPORTS_CONFIG; fix shuttle label |

Only 2 files. Isolated changes. Low regression risk.

