
# Pratibha by SPLINK — Athlete Intelligence Platform

## What We're Building
A production-ready, Phase 1 sports analytics platform with rich mock data (Bihar-style, ~80 athletes), hybrid AI (rules engine + Lovable AI narrative summaries), full English/Hindi support, and the **Pratibha by SPLINK** brand. Clean light theme, enterprise-professional, deployed as a standalone Lovable app.

---

## Architecture Overview

### Pages & Routing
- `/` → Redirect to `/explorer`
- `/explorer` → Athlete Explorer (main screen)
- `/athlete/:id` → Full Athlete Profile (7 tabs)
- `/analytics` → Analytics Dashboard (executive + analyst views)
- `/import` → Data Import & Validation
- `/ai-query` → AI Query Assistant
- `/settings` → Settings & User Management
- `/methodology` → Methodology & Documentation
- `/license` → License Status & Activation
- `/login` → Auth screen (local auth, role-aware)

### Layout Shell
- Collapsible left sidebar (icon + label, mini mode when collapsed)
- Top header: Logo "Pratibha", language toggle (EN / हिं), user avatar, notifications
- Sidebar sections: Explorer, Analytics, AI Query, Import, Reports, Settings, Methodology, License
- Breadcrumb trail per page
- Responsive: sidebar collapses to icons on medium screens, bottom nav on mobile

---

## Module 1: Athlete Explorer (`/explorer`)

### Top Summary Cards (4 cards)
- Total Athletes | Eligible Athletes | High Potential | Avg Completeness Score

### Filter Bar
- Global search (name, ID)
- Quick filter chips: All | Male | Female | Underweight | High Potential | Flagged
- Dataset selector (dropdown): All / Male Cohort / Female Cohort / Full Dataset
- Advanced filters panel (collapsible):
  - Age range slider (8–25)
  - Height / Weight / BMI range
  - Performance metric ranges (V. Jump, Broad Jump, 30m Sprint, 800m Run)
  - School/District selector
  - Assessment completeness %
  - Sport fit (filter by recommended sport)
- Active filter chips row with × dismiss per filter
- Saved views: save/load named filter presets

### Athlete Table
- Columns: ID, Name, Gender, Age, Height, Weight, BMI, V.Jump, Broad Jump, 30m Sprint, 800m Run, Composite Score, Sport Fit (top match), Completeness, Flags
- Sortable columns, server-side pagination (20 per page)
- Column customizer (show/hide columns)
- Row checkbox for multi-select → bulk compare
- Per-row: data completeness badge (green/yellow/red), attention flag icon, "View Profile" chevron
- Comparison mode: select 2–5 athletes → floating "Compare (N)" button → side-by-side comparison drawer
- Smart empty state with import CTA

---

## Module 2: Athlete Profile (`/athlete/:id`)

### Profile Header
- Avatar initials circle (gender-color coded), Name, ID, Gender, Age, School/District
- Data completeness score badge
- Quick stats: Height | Weight | BMI | BMI Category

### 7-Tab Navigation
**Tab 1 — Overview**
- Readiness snapshot (5-dimension spider/radar chart: Speed, Power, Endurance, Agility, Body Composition)
- Percentile summary (5 horizontal bar badges with peer cohort labels)
- Key stats: Best Metric, Weakest Metric
- Top sport recommendation (1-liner)
- Attention flags panel (non-diagnostic)

**Tab 2 — Performance**
- Raw metrics table with normalized scores and percentiles
- Peer cohort comparison bar chart (athlete vs. cohort avg vs. top 10%)
- Benchmark bands: Excellent / Above Avg / Average / Below Avg / Development
- Best / Weakest / delta highlighting
- Composite Score breakdown (visible formula)

**Tab 3 — AI Insights**
- Explainable narrative summary (Lovable AI generated, falls back to template if AI unavailable)
- SWOT-style cards: Strengths | Weaknesses | Opportunities | Risks
- Coach Talking Points (bulleted)
- Suggested Interventions
- Per-insight confidence score (0–100%)
- "Why this insight?" expandable block showing rules/logic used
- AI model label + disclaimer

**Tab 4 — Sport Fit**
- Ranked sport recommendations with match % bar
- Per-sport: trait requirements vs. athlete scores (expandable)
- "Why this sport?" explanatory text
- Configurable weight disclaimer
- Sensitivity note (how score changes if weights shift)

**Tab 5 — Health & Growth**
- BMI card with growth-context note
- Attention flags (underweight/overweight guidance, non-diagnostic)
- General wellness recommendations (sleep, hydration, recovery)
- Prominent disclaimer: "Guidance only, not medical advice"

**Tab 6 — Nutrition**
- Goal-based nutrition template (weight gain / maintenance / performance)
- Bihar-specific traditional foods section
- Daily meal plan framework (Breakfast / Snack / Lunch / Snack / Dinner)
- Hydration guidance
- Region/climate-aware notes
- Hindi + English display

**Tab 7 — Reports**
- Generate PDF report (bilingual)
- Export CSV
- Print-friendly coach summary
- Language selector for report

---

## Module 3: Analytics Dashboard (`/analytics`)

### Toggle: Executive View | Analyst View

**Executive View**
- 6 KPI tiles: Total Athletes, Male/Female split, High Potential %, Data Completeness %, Assessments This Month, Sport-Fit Distribution
- Gender pie chart
- Age distribution histogram (grouped: Under 12, 12–14, 15–17, 18+)
- Top 5 Sports by athlete fit count (bar chart)
- Assessment completion trend (line chart, monthly)
- School/District leaderboard (horizontal bars)

**Analyst View**
- Metric distribution violin/box plots (V.Jump, Broad Jump, Sprint, 800m)
- Percentile distribution curves per metric
- Gender comparison grouped bar charts
- Age-band performance comparison
- Top 10 performers per metric (ranked table)
- Composite Score quadrant: Potential vs. Current Performance (scatter)
- Correlation explorer: anthropometrics vs. performance (scatter with trendline)
- Outlier detection table (flags anomalous values)
- Data quality dashboard (missing fields by school)
- Benchmark band distribution (stacked bar: Excellent → Development per metric)

---

## Module 4: Data Import (`/import`)

### Import Flow (step-by-step wizard)
1. **Upload** — drag/drop CSV or Excel, download template
2. **Map Fields** — detected columns → platform fields (name, gender, height, weight, metrics)
3. **Validate** — preview table with green/yellow/red row-level validation
4. **Review** — stats: N valid, N warnings, N errors; data quality suggestions
5. **Confirm** — Import / Append / Replace modes + versioning label
6. **Done** — import log with success/error breakdown, export error report

### Import History
- Past imports list with timestamp, row count, status, dataset version

---

## Module 5: AI Query Assistant (`/ai-query`)

- Natural language input box (EN or Hindi)
- "Interpret query" step: show extracted filters before running
- Editable filter chips extracted from query
- Results table with AI reasoning panel
- Suggested follow-up prompts (5 contextual chips)
- Saved query templates
- Example prompts in both languages
- Lovable AI Gateway integration for query interpretation + summarization
- Rules-only fallback when AI unavailable

---

## Module 6: Settings (`/settings`)

### Tabs
- **Users & Roles** — list, add, edit roles (Super Admin / Admin / Coach / Analyst / Viewer)
- **AI Configuration** — model selector per task (summary / recommendation / report), API key input, fallback chain toggle
- **Sport Taxonomy** — add/edit/configure sports with metric weights
- **Metric Weights** — configure composite score weights per gender/age band
- **Methodology Settings** — benchmark band thresholds, cohort definition
- **Branding** — client name, logo, report header
- **Data Retention** — policy settings, audit log viewer

---

## Module 7: Methodology Page (`/methodology`)

- Composite score formula displayed (transparent, editable reference)
- Benchmark band definitions with numeric thresholds
- Sport-fit weighting model explanation
- Z-score normalization approach
- Percentile calculation methodology
- Assumptions and limitations section (honest, non-diagnostic)
- Research references section
- Bilingual (EN/HI toggle)

---

## Module 8: License (`/license`)

- License key display and status
- Plan, expiry, user count, athlete count usage meters
- Activation/deactivation
- Heartbeat status (last sync timestamp)
- Renewal CTA
- Privacy statement: "Only aggregated counts sync to vendor. No athlete data is transmitted."

---

## Data & State Architecture

### Mock Seed Data
- ~80 athletes with Bihar-style metrics: Height, Weight, Vertical Jump, Broad Jump, 30m Sprint, 800m Run
- Additional fields: Shuttle Run, Football Throw for some athletes (partial data to show completeness logic)
- Multiple schools/districts (5 schools, 3 districts)
- Both genders, ages 10–20
- Multiple assessment dates for ~20 athletes (longitudinal)
- Intentional data quality issues in ~10 rows (outliers, missing fields) for demonstration

### Analytics Engine (Client-Side)
- Z-score calculation per metric per gender/age band
- Percentile rank in cohort
- Composite Athlete Potential Index: weighted sum of normalized metric scores
- Sport-fit engine: weighted trait matching (cycling, athletics, football, kabaddi, volleyball, swimming, wrestling)
- Benchmark band assignment: Excellent (>85th) / Above Avg (70–85) / Average (40–70) / Below Avg (20–40) / Development (<20)
- BMI calculation and category
- Outlier detection: values beyond ±3 SD flagged

### i18n Architecture
- `src/i18n/en.ts` and `src/i18n/hi.ts` translation dictionaries
- `useTranslation()` custom hook
- Language stored in localStorage, toggled via header
- All labels, chart axes, metric names, AI outputs, report text available in both languages
- Metric names: V. Jump → "वर्टिकल जंप", Sprint → "30 मीटर दौड़", etc.

### AI Integration
- Lovable AI Gateway (Gemini Flash) via Supabase Edge Function `generate-insights`
- Input: structured athlete data (scores, ranks, sport-fit results) — NO raw names or IDs
- Output: narrative summary text (strengths, coach points, sport rationale)
- Graceful fallback: if AI unavailable, template-based summaries from rules engine
- System prompt stored in edge function config (not hardcoded in UI)
- Client-owned API key support (configurable in Settings)

---

## Design System
- **Colors**: Primary `#1E3A5F` (deep navy), Accent `#F97316` (energetic orange), Success green, Warning amber, light backgrounds `#F8FAFC`
- **Typography**: Inter — 14px body, 16px table, 24px headings
- **Components**: Cards with subtle shadows, data badges, metric chips, confidence bars, sport-fit bars
- **Charts**: Recharts — radar/spider, bar, line, scatter, histogram
- **Tables**: Tanstack Table with virtual scrolling for large datasets
- **Transitions**: Smooth tab transitions, skeleton loaders, optimistic UI

---

## File Structure
```
src/
  i18n/          — en.ts, hi.ts, useTranslation.ts
  data/          — seedAthletes.ts, sportsConfig.ts, benchmarks.ts
  engine/        — analyticsEngine.ts, sportFitEngine.ts, outlierDetection.ts
  pages/         — Explorer, AthleteProfile, Analytics, Import, AIQuery, Settings, Methodology, License, Login
  components/
    layout/      — AppShell, AppSidebar, TopHeader
    explorer/    — AthleteTable, FilterBar, ActiveFilters, ComparisonDrawer, SummaryCards
    profile/     — OverviewTab, PerformanceTab, InsightsTab, SportFitTab, HealthTab, NutritionTab, ReportsTab
    analytics/   — ExecutiveDashboard, AnalystDashboard, MetricChart, DistributionChart
    import/      — ImportWizard, FieldMapper, ValidationPreview
    ai/          — QueryAssistant, InsightBlock, ExplainPanel
    shared/      — MetricBadge, ConfidenceBar, BenchmarkBand, SportFitBar, LanguageToggle, DataQualityBadge
  hooks/         — useAthletes.ts, useAnalytics.ts, useAI.ts, useTranslation.ts
supabase/
  functions/generate-insights/  — Edge function for AI summaries
```

---

## Build Order
1. Design system tokens + AppShell + Sidebar + i18n foundation
2. Seed data + analytics engine + sport-fit engine
3. Athlete Explorer (full filters, table, comparison)
4. Athlete Profile (all 7 tabs) with rules-based insights
5. Analytics Dashboard (executive + analyst)
6. Data Import wizard
7. AI Query Assistant + edge function
8. Settings, Methodology, License pages
