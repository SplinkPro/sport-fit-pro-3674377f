

## Full Audit Findings — What Must Be Fixed

Based on deep code review, here are all confirmed bugs with exact file locations:

### Bug 1 — CRITICAL: VO2max formula math error
**File:** `src/engine/analyticsEngine.ts` line 291

Current: `const vo2 = 3.5 * (483 / timeMin + 3.5);`

This is wrong operator precedence. It computes `3.5 × (483/t + 3.5)` instead of the intended `(483/t) + 3.5`. For a typical U14 female running 800m in 260s (4.33 min):
- Current formula: `3.5 × (483/4.33 + 3.5) = 3.5 × (111.5 + 3.5) = 3.5 × 115 = 402.5` → immediately clamped to 85
- Correct formula: `(483/4.33) + 3.5 = 111.5 + 3.5 = 115` → still clamped to 85 for fast runners
- The actual Léger formula for 800m field: `VO2max = 0.1692 × (speed_m_per_min) + 0.3942` is different

The correct formula that was documented in the audit is: `VO2max = 483 / time_minutes + 3.5`
Fix: Remove the `3.5 *` multiplier → `const vo2 = 483 / timeMin + 3.5;`

### Bug 2 — HIGH: U14 age midpoint maps to wrong norm row
**File:** `src/lib/csvParser.ts` line 343

Current: `U14: 13` → gets matched against `ageBand: "12–13"` row in `INDIAN_BENCHMARKS`

Fix: `U14: 14` so it correctly falls into the `ageLo: 14, ageHi: 15` row. Same issue for U12 (11 → falls in 10–11 band, but should be 12). Fix: `U12: 12`, `U14: 14`, `U16: 16`, `U18: 18`.

### Bug 3 — HIGH: CAI score displayed without "percentile" label
**Files:** `src/pages/AthleteProfile.tsx` line 117-118, `src/pages/Explorer.tsx` line 618-625, `src/i18n/en.ts` line 160

The score `72` is shown as a raw number. The i18n label `p.compositeScore` currently reads "Composite Score" — no indication it's a percentile. In the Explorer table the column header is just "Score". A government audience will read "72" as "72 marks out of 100", not "72nd percentile rank within cohort".

Fix:
- Change `en.ts` `compositeScore` label from `"Composite Score"` to `"CAPI Score (percentile)"`
- Add a subtitle under the score display on the athlete profile: `"= {athlete.compositeScore}th percentile vs. cohort"` 
- Change Explorer column header from "Score" to "CAPI Pct."
- Add a tooltip on hover with explanation text

### Bug 4 — HIGH: BMI category labels use adult thresholds for children
**File:** `src/pages/AthleteProfile.tsx` lines 63-67

Current code:
```
const bmiCat =
  (athlete.bmi ?? 0) < 18.5 ? dict.bmi.underweight
  : (athlete.bmi ?? 0) < 25 ? dict.bmi.normal
  : (athlete.bmi ?? 0) < 30 ? dict.bmi.overweight
  : dict.bmi.obese;
```

Adult BMI cutoffs (18.5/25/30) are wrong for U14 children. A healthy 13-year-old girl with BMI 17 would be labeled "Underweight" when she is likely normal for her age. The `analyticsEngine.ts` already has the correct IAP thresholds (14/16/18.5). Use those instead.

Fix: Replace the profile's BMI category with IAP-aligned labels that match what `calcFlags` already uses:
- BMI < 14.0 → "Severe Thinness (IAP)"
- 14.0–16.0 → "Thinness (IAP)"  
- 16.0–18.5 → "Mild Thinness — Monitor"
- 18.5–23.0 → "Normal (IAP)"
- > 23.0 → "Review"

### Bug 5 — HIGH: broadJumpFlag missing from `hasCriticalFlag` check
**File:** `src/lib/csvParser.ts` line 602-606

Current:
```ts
const hasCriticalFlag =
  run800mFlag === "FORMAT_UNREADABLE" ||
  run800mFlag === "IMPLAUSIBLE_VERIFY" ||
  sprint30mFlag === "OUTLIER_VERIFY" ||
  vjFlag === "UNCLEAR_VERIFY";
```

`broadJumpFlag === "OUTLIER_VERIFY"` is missing. An athlete like MD Auranzeb with 302cm broad jump has their data nulled out correctly, but the data quality screen shows them as "verify" not "blocked" — they still appear in rankings with a missing BJ metric but no visual blocked indicator.

Fix: Add `|| broadJumpFlag === "OUTLIER_VERIFY"` to the `hasCriticalFlag` check.

### Bug 6 — MEDIUM: National CAPI badge on Performance tab uses verticalJump band only
**File:** `src/pages/AthleteProfile.tsx` lines 335-341

The national composite badge reads the band from `nationalBands?.verticalJump` as a proxy for the overall composite. This means if an athlete is "Elite" in VJ but "Needs Development" in everything else, the badge shows "Elite".

Fix: Compute the overall SAI band from `derivedIndices.nationalComposite` using `getSAIBand()` directly. Import `getSAIBand` and call `getSAIBand(di.nationalComposite)`.

### Bug 7 — MEDIUM: Explorer CAI score column shows no percentile context
**File:** `src/pages/Explorer.tsx` line 624

Score `{a.compositeScore}` is shown as plain number. Fix: render as `{a.compositeScore}th` with subscript "pct" or tooltip.

### Bug 8 — MEDIUM: run800m seconds in Explorer shown with integer `%60`
**File:** `src/pages/Explorer.tsx` line 617

`String(a.run800m % 60).padStart(2, "0")` — if run800m is a float like 260.18, the seconds will be `260.18 % 60 = 20.18` which displays as `20.18` instead of `20`. Should use `Math.floor(a.run800m % 60)`.

### Bug 9 — LOW: Coordination (10%) silently disappears from denominator
**File:** `src/engine/analyticsEngine.ts` `calcCompositeScore`

The function normalises by `totalWeight` (weights of present metrics only). With no Coordination test in the data, the CAI effectively becomes out of 90 points but is still presented as if out of 100. This is architecturally sound but not disclosed to the user anywhere.

Fix: Add a note on the athlete profile below the CAI score: "Based on {n}/5 metrics assessed" — already partially handled by completeness%, but should be explicitly tied to the CAI calculation.

---

## Files to Change

| File | Bugs Fixed |
|---|---|
| `src/engine/analyticsEngine.ts` | Bug 1 (VO2max formula) |
| `src/lib/csvParser.ts` | Bug 2 (age midpoints), Bug 5 (broadJumpFlag in hasCriticalFlag) |
| `src/pages/AthleteProfile.tsx` | Bug 3 (percentile label), Bug 4 (BMI IAP thresholds), Bug 6 (national band proxy), Bug 9 (metric count note) |
| `src/pages/Explorer.tsx` | Bug 3 (column header), Bug 7 (score suffix), Bug 8 (float seconds) |
| `src/i18n/en.ts` | Bug 3 (label text) |

## Implementation Order

1. `csvParser.ts` — Fix age midpoints + broadJumpFlag (2 isolated changes)
2. `analyticsEngine.ts` — Fix VO2max formula (1 line)
3. `AthleteProfile.tsx` — Fix BMI labels, national band, percentile label, metric count note
4. `Explorer.tsx` + `en.ts` — Column header/label and seconds formatting

