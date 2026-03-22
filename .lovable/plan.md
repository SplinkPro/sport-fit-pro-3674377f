
## Full forensic audit findings before planning

### What exists today (audit):

| Area | Current State | Problem |
|---|---|---|
| 800m parser | H:MM:SS → `H*3600 + M*60 + S` | **CRITICAL**: Bihar Excel stores `04:20:18` as 4min 20.18sec, NOT 4h 20m 18s. Current code would produce 4*3600+20*60+18 = 15,618 seconds — completely wrong |
| Float detection | `numeric * 86400` stored as 800m time | **CRITICAL**: Produces 20,031s (5.5 hours) and uses it silently with no flag |
| Vertical Jump | Stores raw value, no dual-convention handling | **HIGH**: 7 athletes with wall-reach values (180–290cm) get scored as if VJ=180-290cm — way above human max |
| Outlier detection | Z-score ≥ 3 flag only | **HIGH**: Guddi Kumari 14.0s sprint and MD Auranzeb 302cm SBJ pass through silently |
| Age/Gender capture | Defaults to Age 14 / Gender M | **HIGH**: All scoring against wrong norm table |
| VO2max formula | Balke treadmill: `(speedMperMin - 133) * 0.172 + 33.3` | **MEDIUM**: Treadmill protocol, not valid for field 800m run |
| Coordination component | Mapped to 10% weight but no coordination test in data | **MEDIUM**: Missing 10% weight redistributed silently |
| Norm tables | SAI benchmarks are reasonable estimates | **MEDIUM**: Exact Khelo India cut-off values not yet applied |
| Pre-scoring data quality screen | None — flags only appear post-import | **MEDIUM**: Coach sees no data warnings before scores calculate |
| Cohort BMI nutrition alert | Not implemented | **LOW**: 13/41 athletes are BMI <16 — no cohort-level alert |

---

## Priority order (highest impact first)

### Priority 1 — Fix 800m parser (CRITICAL data corruption)

**File: `src/lib/csvParser.ts`**

Replace `parseTimeToSeconds`:
- **Excel H:MM:SS from Bihar**: SheetJS with `raw: false` renders these as strings like `"4:20:18"`. The correct interpretation is `H=minutes, M=seconds, S=centiseconds` → `total_seconds = H*60 + M + S/100`
- **Detection rule**: After parsing as time string, if result > 600s (10 min), re-interpret as `MM:SS.cs`
- **Float detection**: If raw is a decimal `0 < x < 1` (Excel serial), flag as `FORMAT_UNREADABLE` — do NOT convert to seconds
- **Implausible gate**: If parsed seconds > 720 (12 min) after correction → flag `IMPLAUSIBLE_VERIFY`, store as null, do not score
- Return a `{ value, flag }` object; store flag on athlete as `run800mFlag`

Add to `Athlete` type in `seedAthletes.ts`:
```ts
run800mFlag?: "OK" | "IMPLAUSIBLE_VERIFY" | "FORMAT_UNREADABLE" | "AUTO_CORRECTED"
vjFlag?: "OK" | "AUTO_CORRECTED" | "UNCLEAR_VERIFY"
sprint30mFlag?: "OUTLIER_VERIFY"
broadJumpFlag?: "OUTLIER_VERIFY"
```

---

### Priority 2 — Fix Vertical Jump dual-convention (CRITICAL scoring error)

**File: `src/lib/csvParser.ts`**

Add `correctVerticalJump(rawVJ, heightCm)`:
```
if rawVJ > 120:
  reach = height_cm * 1.33
  net = rawVJ - reach
  if net < 0 or net > 110: return { value: null, flag: "UNCLEAR_VERIFY" }
  else: return { value: net, flag: "AUTO_CORRECTED" }
if rawVJ < 10:
  corrected = rawVJ * 100
  then re-apply > 120 check
return { value: rawVJ, flag: "OK" }
```

Show in Step 3 Validate: raw value → corrected value → flag label.

---

### Priority 3 — Add plausible-range outlier flags before scoring

**File: `src/lib/csvParser.ts`**

Add hard plausibility checks:
- `sprint30m > 11.0s` → flag `OUTLIER_VERIFY`, set value to null (do not score)
- `broadJump > 260cm` → flag `OUTLIER_VERIFY`, set value to null  
- `shuttleRun > 30s` → flag `OUTLIER_VERIFY`, set value to null

These are **different from z-score outliers** — they are physically impossible values that corrupt scoring.

---

### Priority 4 — Age group + gender capture at import (mandatory step)

**File: `src/pages/Import.tsx`**

Insert a new **Step 0** (or extend Step 1) before file parsing:

Two questions shown before upload button activates:
1. **Age group**: `[ U10 ] [ U12 ] [ U14 ] [ U16 ] [ U18 ] [ Open 18+ ]` — required
2. **Gender**: `[ All Male ] [ All Female ] [ Mixed ]` — required; if Mixed, show per-row gender column in Step 3

Store as `batchAgeGroup` and `batchGender` in component state. Pass into `rowsToAthletes` as context. All athletes in the batch get `age` set from the age group midpoint if no age column exists, and `gender` set from batch gender (or per-row for Mixed).

Block the "Continue" button if either is unset. Show message: *"Age group and gender are required to calculate scores against the correct norm table."*

---

### Priority 5 — Replace VO2max formula

**File: `src/engine/analyticsEngine.ts`** (lines 294–301)

Replace Balke treadmill formula with Léger-Lambert 800m field formula:
```
VO2max = 3.5 × (483 / time_in_minutes + 3.5)
```
where `time_in_minutes = run800m_seconds / 60`

Add bounds: clamp to [20, 85]. Label as "Estimated VO2max (800m field)".

If `run800mFlag !== "OK"`, set `aerobicCapacityEst = null` and show `--` in UI.

---

### Priority 6 — Pre-scoring data quality screen

**File: `src/pages/Import.tsx`**

Between Step 3 (Validate) and Step 4 (Review), add a **Data Quality Summary** panel:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠ Data issues found — review before scoring             │
│                                                         │
│ Guddi Kumari (Row 15):                                  │
│   • 30m sprint: 14.0s — exceeds plausible range (>11s)  │
│   • 800m: 592s (9:52) — implausible, verify with coach  │
│   → CAI will NOT be calculated for this athlete          │
│                                                         │
│ Musbbeha (Row 22):                                      │
│   • VJ: 180cm — unclear (wall reach?), not scoreable    │
│                                                         │
│ 5 athletes: 800m time format unreadable — enter manually │
└─────────────────────────────────────────────────────────┘
```

Grouped by severity: ❌ Not scored (hard flags) | ⚠ Verify with coach | ℹ Auto-corrected.

---

### Priority 7 — Cohort BMI nutrition alert banner

**File: `src/pages/Import.tsx`** (Step 4 confirm screen)

Calculate BMI distribution after parsing. If ≥2 athletes have BMI < 16:

```
⚠ Nutrition alert: X athletes show thinness (BMI < 16).
  Consider nutrition assessment before performance scoring.
  [View details]
```

This is **informational only** — does not affect CAI.

Also add to `analyticsEngine.ts` BMI flag thresholds:
- `< 14.0` → "Severe thinness" (red)  
- `14.0–16.0` → "Thinness" (orange)  
- `16.0–18.5` → "Mild thinness — monitor" (amber)  
- `18.5–23.0` → "Normal" (green)  
- `> 23.0` → "Review" (amber)

---

## Files to change

| File | Priorities |
|---|---|
| `src/lib/csvParser.ts` | P1, P2, P3 |
| `src/data/seedAthletes.ts` | P1, P2, P3 (add flag fields to Athlete type) |
| `src/pages/Import.tsx` | P4, P6, P7 |
| `src/engine/analyticsEngine.ts` | P5, P7 |

## Implementation order

1. `seedAthletes.ts` — add flag fields to Athlete type (no logic change, enables everything else)
2. `csvParser.ts` — fix 800m parser, VJ correction, plausibility gates
3. `analyticsEngine.ts` — fix VO2max formula, update BMI bands, guard against flagged values
4. `Import.tsx` — add age/gender batch capture + data quality screen + nutrition alert
