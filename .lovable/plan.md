## Client Feedback Audit — Pratibha by SPLINK

Two production bugs reported by SPLINK after client review. Both reproduced and root-caused in the codebase.

---

### Bug 1 — AI Query: single-age phrases ignored

**Reported:** Query "best male athletes at 12 year old" returns athletes aged 17–18.

**Root cause (verified in `src/pages/AIQuery.tsx`):**
- `parseAgeRange()` (line 29) only matches **ranges** like `aged 12-14`, `between 12 and 14`, `12-14 years`. It returns `null` for any single-age phrase.
- There is no `parseSingleAge()` function. Only `under 12` and `18+/adult` are caught as scalar conditions.
- Result: "12 year old" passes through with no age filter; the gender filter alone runs and the dataset's older athletes dominate by composite score.

**Fix:**
1. Add `parseSingleAge(q)` that matches:
   - `\b(\d{1,2})\s*[- ]?(?:year|yr|yrs|y)\s*[- ]?old`
   - `(?:age[d]?|aged)\s+(\d{1,2})\b` (when not already part of a range)
   - `\bat\s+(\d{1,2})\b` only when followed by an age unit (`year/y/yo`)
   - Plausibility gate: 8 ≤ age ≤ 25 to avoid colliding with "top 10" / "score above 60".
2. In `queryAthletes()`, after `parseAgeRange()` fails, call `parseSingleAge()`. Apply `pool.filter(a => a.age === age)` and push filter chip `Age: 12`.
3. Order matters: run single-age **after** range so a query like "aged 12-14" still wins.
4. Visible interpreted-filter chips already render — the new `Age: 12` chip will surface automatically, satisfying the client's "show parsed filters" suggestion.
5. Add example query "Best male athletes aged 12" to `EXAMPLE_QUERIES_EN/HI` so the capability is discoverable.

**Regression guards:**
- Vitest cases: "top 10 athletes" (no age filter), "athletes aged 14-16" (range), "12 year old girls" (single age + gender), "athletes with score above 60" (no false age match on `60`), "top 12 athletes" (no false age match on `12`).
- Run `bunx vitest run` and confirm 117/117 still pass plus the new cases.

---

### Bug 2 — Local CAPI dominates over National CAPI

**Reported:** Profile of an athlete with Local CAPI 98 / National CAPI 39 still reads as "Excellent" because per-metric bands and the hero score are local-cohort based. For a B2G/state talent-ID product this inflates perception.

**Root cause (verified in `src/pages/AthleteProfile.tsx`):**
- Header hero (line 122–138) shows `athlete.compositeScore` (Local CAPI) as the dominant 3xl number. National CAPI does not appear in the header at all.
- Performance tab banner (line 330–367) renders Local and National side-by-side with **equal visual weight**; Local is listed first (left = primary in reading order) and uses `text-primary`, while National sits in a tinted box but with the same font size.
- Per-metric badges (line 400–404) use `m.band` which is derived from **local** percentiles — this is why "Excellent" still appears against a weak national score.

**Fix (UI + framing only — no scoring math changes):**
1. **Profile header (lines 122–138):**
   - Make **National CAPI (SAI)** the dominant 3xl figure with the SAI band badge directly under it.
   - Demote Local CAPI to a smaller secondary stat ("Local CAPI 98 — within current cohort").
   - Suppress the ⭐ High Potential badge in the header when `nationalComposite < 40` (clinical guard against false elite framing). Keep it visible only when both local ≥ 70 **and** national ≥ 50.
2. **Performance tab banner (lines 330–367):**
   - Swap order: National card on the **left**, Local on the right.
   - Make National card visually heavier (border-2, larger value, accent color); Local card downgraded to muted background, smaller value, label "Local cohort context — best within current dataset".
   - When `nationalComposite < 40` and `localCAPI ≥ 70`, render an inline advisory line: *"Locally strong but below national benchmark — interpret with caution."*
3. **Per-metric "Band" column (lines 400–404):**
   - Add a second "Nat. Band" column derived from `m.natBand` (already available in `cohortData`). Keep the local "Band" but rename header to "Local Band" and grey it down.
   - When local band is `excellent`/`aboveAvg` but national band is `belowAvg`/`development`, append a small "vs Nat." caveat tag.
4. **Reports / PDF export (line 1312–1421):**
   - Mirror the new hierarchy in the printable profile: National CAPI is the headline number, Local CAPI is contextual.
   - Update `capiTier` thresholds (line 1394) to gate "HIGH POTENTIAL" on national ≥ 50, not local alone. Keep three-tier wording.
5. **Wording cleanup:**
   - Replace "Excellent" labels in any string that pairs with a low national score by using the existing band-pair logic. No new translations needed for v1 — English copy only; Hindi parity tracked as follow-up.

**Out of scope (explicit, to avoid regressions):**
- No changes to `nationalComposite`, `localCAPI`, percentile, or band computation in `src/engine/**`. Only presentation and gating thresholds change.
- No changes to AI Query scoring, ranking, or examples beyond the new age regex + one example string.
- No changes to other tabs (Trajectory, Sport Fit, Nutrition, Yoga) except where they reuse the header CAPI block.

---

### Files to modify

```text
src/pages/AIQuery.tsx           # parseSingleAge() + filter wiring + 1 example
src/pages/AthleteProfile.tsx    # header + perf banner + band column + PDF block
src/test/aiQuery.test.ts        # new vitest cases (create if missing)
```

### Verification

1. `bunx vitest run` — all existing tests pass + new age-parse tests pass.
2. Build typecheck green.
3. Manual smoke in preview:
   - AI Query: "best male athletes at 12 year old" → only 12-year-olds, chip "Age: 12" visible.
   - AI Query: "top 10 athletes" → no spurious age filter.
   - Profile of athlete with Local 98 / National 39 → National is the dominant number, advisory copy renders, no "⭐ High Potential" badge in header, per-metric Nat. Band column shows "Below Avg".
   - PDF export reflects new hierarchy.
4. Re-run `security--get_scan_results` since two pages change — expect no new findings (UI-only edits).

### Risk

Low. All edits are presentation logic + one regex addition. No DB, no auth, no scoring engine, no migrations. Worst case rollback is a single revert of the two page files.
