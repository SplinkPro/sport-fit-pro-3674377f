
# Top 5 Fixes Before Client Delivery — Complete Implementation Plan

## Fix 1: AI Query uses fake hardcoded data — replace with real athlete engine

**Problem:** `MOCK_RESULT_ROWS` are always the same 5 fictional names regardless of query. The "AI Reasoning" paragraph is also hardcoded. A client typing any query always sees "Ravi Kumar", "Arjun Verma" etc.

**Fix:** Build a rule-based query interpreter that runs against live `useAthletes()` data. No external AI needed.

Map these intent patterns from the query text:
- "top N by [metric]" → sort by that metric, limit N
- "underweight" / "bmi" → filter `flags.type === "underweight"`
- "high potential" → filter `isHighPotential`
- "sport [X]" / "best suited for [X]" → filter/sort by sport fit score
- "male"/"female" → gender filter
- "age 14–16" → age range filter
- "composite score above X" → filter compositeScore

Show real athlete rows from the current dataset with correct rank, name, school, composite, and the relevant metric value. Generate a real reasoning string from the applied filters.

**Files changed:** `src/pages/AIQuery.tsx` — add `queryAthletes(query, athletes)` function that returns `{ results, filters, reasoning }`. Remove all `MOCK_RESULT_ROWS`. Wire Export CSV to download the actual result rows.

---

## Fix 2: Data does not persist on page refresh — add localStorage persistence

**Problem:** `useAthletes.ts` stores everything in React state. Refreshing the browser loses all imported datasets. A client who imports 41 athletes, refreshes, and sees the demo data again will lose trust immediately.

**Fix:** In `useAthletes.ts`:
- On `addDataset`: serialise new dataset (meta + athletes array) into `localStorage` under key `"pratibha_datasets"`. Limit stored size to most recent 5 imports.
- On mount (in the `useEffect`): after seed loads, read `localStorage` and rehydrate `savedDatasets`. Restore the last-active dataset id from `localStorage["pratibha_active_dataset"]`.
- On `loadDataset`: write the new active id to `localStorage`.
- Strip `athletes` array from the `datasetMeta` state object (already done for memory) but keep full athletes in the localStorage blob.

Cap each stored dataset at 500 athletes to avoid localStorage quota errors. Show a toast warning if the import exceeds this limit.

**Files changed:** `src/hooks/useAthletes.ts`

---

## Fix 3: "Assessments This Month" is hardcoded 42 — replace with live data

**Problem:** Line 112 of `Analytics.tsx`: `<KPICard label={a.kpis.assessmentsThisMonth} value={42} .../>` — a static number. Every client will see 42 even with 0 or 200 athletes.

**Fix:** Replace with derived count from the real athlete dataset:
```
const thisMonthCount = athletes.filter(at => {
  if (!at.assessmentDate) return false;
  const d = new Date(at.assessmentDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}).length;
```
If result is 0 (Bihar file has no assessment date), fall back to `athletes.length` with the label changed to "Total Athletes" — show the real count, never a fake one.

**Files changed:** `src/pages/Analytics.tsx` (line 112)

---

## Fix 4: Demo Mode banner never auto-dismisses after real import

**Problem:** `DemoModeBanner` reads `CLIENT_CONFIG.demoMode` which is a compile-time constant. Even after a client uploads their own data, the banner still says "82 sample Bihar athletes loaded" — looks broken/fake.

**Fix:** Update `DemoModeBanner.tsx` to also hide when the active dataset is not the seed:
```tsx
const { datasetMeta } = useAthletes();
const isRealData = datasetMeta.source === "import";
if (!CLIENT_CONFIG.demoMode || dismissed || isRealData) return null;
```
Also update the banner copy to use the live `datasetMeta.count` instead of the hardcoded `CLIENT_CONFIG.demoAthleteCount`.

**Files changed:** `src/components/layout/DemoModeBanner.tsx`

---

## Fix 5: Settings Save buttons are all no-ops — make Branding and Weights functional

**Problem:** Every "Save" button in Settings does nothing. The Metric Weights inputs are `readOnly`. A client clicking "Save Branding" or "Save Weights" gets zero feedback — it looks broken.

**Fix:**
1. **Branding tab**: Make `clientName`, `instanceCode`, and `reportHeader` controlled inputs backed by `useState`. "Save Branding" writes to `localStorage["pratibha_branding"]` and shows a success toast.
2. **Metric Weights tab**: Remove `readOnly`, make weights a `useState` array, make sliders interactive. Validate sum === 100 (show inline error if not). "Save Weights" writes to `localStorage["pratibha_weights"]` and shows a success toast. On app init, `analyticsEngine` reads from localStorage weights if present.
3. **Other tabs** (Users, AI, Sports): Add visual confirmation on button click (toast "Saved" or button state change) even if not fully wired — prevents the "broken button" impression.

**Files changed:** `src/pages/Settings.tsx`, optionally `src/engine/analyticsEngine.ts` to read custom weights from localStorage.

---

## Implementation Order

1. Fix 2 (localStorage persistence) — must go first, fixes core data loss
2. Fix 4 (Demo banner) — 2-line change, depends on Fix 2 being merged
3. Fix 3 (hardcoded 42) — single-line change in Analytics
4. Fix 5 (Settings saves) — isolated to Settings page
5. Fix 1 (AI Query real data) — largest change, isolated to AIQuery page

## Files to change

| File | Fixes |
|---|---|
| `src/hooks/useAthletes.ts` | Fix 2 |
| `src/components/layout/DemoModeBanner.tsx` | Fix 4 |
| `src/pages/Analytics.tsx` | Fix 3 |
| `src/pages/Settings.tsx` | Fix 5 |
| `src/pages/AIQuery.tsx` | Fix 1 |
