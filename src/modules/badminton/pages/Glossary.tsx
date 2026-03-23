// ─── Badminton Intelligence Module — Glossary & Methodology Reference ─────────
// Every abbreviation, formula, and source explained for coaches and officials.

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "scores",
    label: "Composite Scores",
    icon: "🏆",
    entries: [
      {
        abbr: "BII",
        full: "Badminton Intelligence Index",
        range: "0 – 100",
        unit: "Percentile",
        description:
          "The primary talent identification score. Combines physical fitness testing into a single percentile rank relative to Indian youth badminton norms. A BII of 75 means the athlete performs better than 75% of their age-band and gender peers.",
        formula:
          "BII = (SPF_norm × 0.651) + (BPF × 0.272) + (BM × 0.077)",
        components: [
          { name: "SPF_norm", weight: "65.1%", desc: "Specialized Physical Fitness — agility, strength, endurance, flexibility, speed" },
          { name: "BPF", weight: "27.2%", desc: "Basic Physical Fitness — shuttlecock throw + beep test" },
          { name: "BM", weight: "7.7%", desc: "Body Morphology — BMI-for-age + wingspan reach advantage" },
        ],
        source: "PMC 2024 — AHP Delphi study, elite male singles badminton. DOI: 10.3390/ijerph21030298",
        note: "Requires minimum 6 of 11 physical tests. Missing components are redistributed proportionally — never silently dropped.",
        colour: "#1A5C38",
      },
      {
        abbr: "SQ",
        full: "Skill Quotient",
        range: "0 – 100",
        unit: "Weighted coach score",
        description:
          "Coach-assessed technical and psychological skill rating. Eight dimensions rated 1–10 by the academy coach, then weighted by PGBA methodology and scaled to 100.",
        formula:
          "SQ = (FW×0.20 + SM×0.15 + SQ_s×0.15 + CA×0.13 + NP×0.12 + SA×0.10 + Co×0.10 + MR×0.05) × 10",
        components: [
          { name: "FW", weight: "20%", desc: "Footwork Efficiency — court movement and recovery" },
          { name: "SM", weight: "15%", desc: "Stroke Mechanics — forehand and backhand technique" },
          { name: "SQ_s", weight: "15%", desc: "Smash Quality — power and accuracy of overhead smash" },
          { name: "CA", weight: "13%", desc: "Court Awareness — reading opponent, positioning" },
          { name: "NP", weight: "12%", desc: "Net Play — net kill and net drop precision" },
          { name: "SA", weight: "10%", desc: "Serve Accuracy — short serve placement" },
          { name: "Co", weight: "10%", desc: "Coachability — response to instruction (primary intake criterion at PGBA)" },
          { name: "MR", weight: "5%", desc: "Mental Resilience — response to errors and losing" },
        ],
        source: "PGBA Methodology — based on Gopichand's published coaching philosophy. Coachability explicitly cited as primary intake criterion.",
        note: "If fewer than 6 of 8 skill scores are entered, SQ is labeled 'Partial SQ' and excluded from quadrant placement.",
        colour: "#D4A017",
      },
      {
        abbr: "SPF",
        full: "Specialized Physical Fitness",
        range: "0 – 100",
        unit: "Composite percentile",
        description:
          "The dominant sub-score within BII (65.1% weight). Groups the 5 physical fitness dimensions most discriminating for badminton talent identification.",
        formula:
          "SPF = (Agility×0.223) + (Strength×0.217) + (Endurance×0.210) + (Flexibility×0.189) + (Speed×0.161)",
        components: [
          { name: "Agility", weight: "22.3%", desc: "Mean of Four-Corner Shuttle Run + 10×5m Shuttle Run percentiles" },
          { name: "Strength", weight: "21.7%", desc: "Mean of Vertical Jump + Broad Jump + Grip Strength percentiles" },
          { name: "Endurance", weight: "21.0%", desc: "Mean of Beep Test + Sit-ups + Push-ups percentiles" },
          { name: "Flexibility", weight: "18.9%", desc: "Sit and Reach percentile" },
          { name: "Speed", weight: "16.1%", desc: "Reaction Time percentile (inverted — lower ms = better)" },
        ],
        source: "PMC 2024 — AHP weights derived from Delphi expert panel of elite badminton coaches and sports scientists.",
        colour: "#1A5C38",
      },
      {
        abbr: "BPF",
        full: "Basic Physical Fitness",
        range: "0 – 100",
        unit: "Composite percentile",
        description:
          "Secondary sub-score (27.2% of BII). Reflects general athletic capacity relevant to badminton but not sport-specific.",
        formula: "BPF = mean(Shuttlecock Throw percentile, Beep Test percentile)",
        components: [
          { name: "Shuttlecock Throw", weight: "50%", desc: "Overhead throwing power in metres — proxy for upper-body explosive force" },
          { name: "Beep Test", weight: "50%", desc: "Progressive shuttle beep test level — aerobic capacity indicator" },
        ],
        source: "BWF Fitness Testing Protocols 2008 + PMC 2022.",
        colour: "#2563EB",
      },
      {
        abbr: "BM",
        full: "Body Morphology Score",
        range: "0 – 100",
        unit: "Composite score",
        description:
          "Smallest BII component (7.7%). Combines BMI-for-age (IAP India youth charts) and wingspan reach advantage.",
        formula:
          "BM = mean(BMI_age_percentile, reach_adjusted_score)\nReach bonus: +5 if (wingspan − height) > 5cm; −3 if < −3cm",
        components: [
          { name: "BMI-for-age", weight: "~50%", desc: "Uses IAP India youth charts — NOT adult BMI cutoffs (18.5/25/30 are for adults)" },
          { name: "Reach Advantage", weight: "~50%", desc: "Wingspan minus height. Positive = reach advantage at net. Sindhu (179cm) exemplifies this." },
        ],
        source: "IAP India 2015 BMI-for-age charts. Wingspan benefit: BWF 2008 + court geometry rationale.",
        colour: "#7C3AED",
      },
    ],
  },
  {
    id: "physical",
    label: "Physical Tests",
    icon: "⚡",
    entries: [
      {
        abbr: "RT",
        full: "Reaction Time",
        range: "80 – 700 ms",
        unit: "Milliseconds (ms)",
        description:
          "Measured using a drop-ruler or light board. Faster (lower) is better. The most neurologically demanding metric — elite players respond to shuttle direction changes within 130ms.",
        formula: "Percentile = 100 − raw_percentile (inverted: lower ms = higher percentile)",
        components: [
          { name: "Elite zone", weight: "< 130ms", desc: "Green — top international standard" },
          { name: "Competitive", weight: "130–170ms", desc: "Yellow — state and national competition level" },
          { name: "Developing", weight: "170–220ms", desc: "Orange — academy training level" },
          { name: "Needs Focus", weight: "> 220ms", desc: "Red — requires dedicated reaction training" },
        ],
        source: "TISTI Uttarakhand Badminton Research 2025. Boys P50 = 156ms ± 28ms. Girls P50 = 144ms ± 24ms.",
        note: "Auto-corrected: if value < 2.0 (entered in seconds not ms), multiplied × 1000 and flagged. BLOCKED if < 80ms (physically impossible).",
        colour: "#059669",
      },
      {
        abbr: "4CR",
        full: "Four-Corner Shuttle Run",
        range: "8 – 30 sec",
        unit: "Seconds (lower = better)",
        description:
          "Court-specific agility test. Athlete starts at centre, sprints to each of 4 corners touching each marker, returns to centre. Highest AHP weight of any single test (0.119). Most discriminating indicator for badminton talent.",
        formula: "Timed test — converted to percentile using age/gender norm table. Inverted (lower = better).",
        components: [],
        source: "PMC 2024 — single highest-weighted tertiary indicator (weight 0.119). PMC 2022 — elites outperform novices by 28% in change-of-direction.",
        colour: "#059669",
      },
      {
        abbr: "10×5",
        full: "10×5m Shuttle Run",
        range: "15 – 30 sec",
        unit: "Seconds (lower = better)",
        description:
          "Change-of-direction speed test. Athlete sprints 5m, touches line, returns — 10 repetitions. Tests acceleration, deceleration, and lateral quickness relevant to baseline-to-net movement.",
        formula: "Timed test — inverted percentile using age/gender norm table.",
        components: [],
        source: "EUROFIT change-of-direction protocol. Adapted for Indian youth badminton context (PMC 2022).",
        colour: "#059669",
      },
      {
        abbr: "VJ",
        full: "Vertical Jump (Net Height)",
        range: "10 – 120 cm",
        unit: "Centimetres (higher = better)",
        description:
          "Lower-limb explosive power. Measured as net jump height (jump reach minus standing reach). AHP weight: 0.096 (third highest single indicator).",
        formula: "Net jump = jump reach − standing reach. Auto-corrected if wall-reach convention detected (value > 150cm AND standing_reach present).",
        components: [],
        source: "BWF 2008 + EUROFIT protocol. PMC 2024 AHP weight = 0.096.",
        note: "BLOCKED if > 120cm. Auto-corrected: if value > 150cm and standing_reach_cm is provided, net jump = value − standing_reach_cm.",
        colour: "#2563EB",
      },
      {
        abbr: "BJ",
        full: "Standing Broad Jump",
        range: "50 – 280 cm",
        unit: "Centimetres (higher = better)",
        description:
          "EUROFIT lower-limb explosive power test. Best of 2 trials. Correlates strongly with court acceleration and net attack speed.",
        formula: "Best of 2 trials. Percentile lookup using age/gender norm table.",
        components: [],
        source: "EUROFIT protocol. PMC 2022 — used for lower limb explosive power in badminton talent ID.",
        colour: "#2563EB",
      },
      {
        abbr: "BT",
        full: "Beep Test Level",
        range: "1 – 15",
        unit: "Level.shuttle (higher = better)",
        description:
          "Progressive shuttle beep test. Levels represent increasing speed. Indicator of VO2max and aerobic capacity — critical for multi-game tournament endurance.",
        formula: "Raw level converted to percentile using age/gender norm table. BLOCKED if > level 15.",
        components: [],
        source: "BWF Junior Fitness Testing Protocols 2008.",
        colour: "#7C3AED",
      },
      {
        abbr: "GS",
        full: "Grip Strength",
        range: "5 – 65 kg",
        unit: "Kilograms (higher = better)",
        description:
          "Dominant hand grip measured by dynamometer. Proxy for racket control strength and smash power. BLOCKED if > 65kg (equipment error in youth context).",
        formula: "Percentile lookup. BLOCKED if > 65kg.",
        components: [],
        source: "BWF 2008 dynamometer protocol. South Asian youth norms (estimated from PMC 2022 patterns).",
        colour: "#2563EB",
      },
      {
        abbr: "ST",
        full: "Shuttlecock Throw Distance",
        range: "3 – 25 m",
        unit: "Metres (higher = better)",
        description:
          "Overhead shuttlecock throw. Measures upper-body explosive power and shoulder rotation — directly relevant to smash strength.",
        formula: "Distance in metres. Percentile lookup using age/gender norm table.",
        components: [],
        source: "BWF 2008 overhead throw test protocol.",
        colour: "#2563EB",
      },
      {
        abbr: "SU",
        full: "Sit-ups (30 seconds)",
        range: "5 – 40",
        unit: "Repetitions (higher = better)",
        description:
          "Core muscular endurance. Maximum sit-ups in 30 seconds using EUROFIT protocol. Core stability is critical for stroke mechanics and injury prevention.",
        formula: "Reps in 30 seconds. Percentile lookup.",
        components: [],
        source: "EUROFIT muscular endurance protocol. Indian youth adaptation (PMC 2022).",
        colour: "#7C3AED",
      },
      {
        abbr: "PU",
        full: "Push-ups (30 seconds)",
        range: "3 – 35",
        unit: "Repetitions (higher = better)",
        description:
          "Upper-body muscular endurance. Maximum push-ups in 30 seconds. Correlates with net play power and overhead stroke stamina.",
        formula: "Reps in 30 seconds. Percentile lookup.",
        components: [],
        source: "EUROFIT muscular endurance protocol. Indian youth adaptation (PMC 2022).",
        colour: "#7C3AED",
      },
      {
        abbr: "S&R",
        full: "Sit and Reach",
        range: "-10 – 50 cm",
        unit: "Centimetres (higher = better)",
        description:
          "Trunk and hamstring flexibility using EUROFIT box protocol. Flexibility is the 4th-ranked fitness component for badminton (weight 0.189) — important for low net shots and lunge recovery.",
        formula: "Measured in cm from baseline. Percentile lookup. Girls typically score higher than boys.",
        components: [],
        source: "EUROFIT flexibility protocol. Indian youth reference (PMC 2022).",
        colour: "#D97706",
      },
    ],
  },
  {
    id: "skill",
    label: "Skill Dimensions",
    icon: "🎯",
    entries: [
      {
        abbr: "FW",
        full: "Footwork Efficiency",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Court movement and recovery speed. The single highest-weighted skill dimension (20%). Gopichand has consistently identified footwork as the primary differentiator between good and great players. Assesses: split-step timing, court coverage pattern, recovery to base position.",
        formula: "Coach-rated 1–10. Weight = 0.20 in SQ formula.",
        components: [],
        source: "PGBA methodology. Gopichand's published coaching philosophy.",
        colour: "#D4A017",
      },
      {
        abbr: "SM",
        full: "Stroke Mechanics",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Forehand and backhand technique quality. Assesses grip, swing path, contact point, and follow-through for all stroke types.",
        formula: "Coach-rated 1–10. Weight = 0.15 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "SQ_s",
        full: "Smash Quality",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Overhead smash power and accuracy. Composite of jump smash height, shuttle speed, and placement consistency.",
        formula: "Coach-rated 1–10. Weight = 0.15 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "CA",
        full: "Court Awareness",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Tactical reading of opponent and court positioning. Includes anticipation, shot selection, and exploitation of gaps.",
        formula: "Coach-rated 1–10. Weight = 0.13 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "NP",
        full: "Net Play",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Net kill and net drop precision. Deceptive net play is a hallmark of Indian elite badminton style.",
        formula: "Coach-rated 1–10. Weight = 0.12 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "SA",
        full: "Serve Accuracy",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Short serve placement and consistency. Low serve at net tape height is critical in doubles and increasingly in singles.",
        formula: "Coach-rated 1–10. Weight = 0.10 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "Co",
        full: "Coachability",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Response to instruction, willingness to correct errors, and adaptation speed. Gopichand has explicitly stated coachability as a primary intake criterion — above raw talent.",
        formula: "Coach-rated 1–10. Weight = 0.10 in SQ formula.",
        components: [],
        source: "PGBA methodology. Gopichand's stated primary intake criterion.",
        note: "⚠ Even a score of 9 here is worth reviewing carefully — academy has rejected high-BII athletes with low coachability.",
        colour: "#D4A017",
      },
      {
        abbr: "MR",
        full: "Mental Resilience",
        range: "1 – 10",
        unit: "Coach rating",
        description:
          "Response to errors, pressure situations, and losing. Lowest SQ weight but correlated with long-term retention in elite academies.",
        formula: "Coach-rated 1–10. Weight = 0.05 in SQ formula.",
        components: [],
        source: "PGBA methodology.",
        colour: "#D4A017",
      },
    ],
  },
  {
    id: "quadrant",
    label: "Talent Quadrants",
    icon: "🗺",
    entries: [
      {
        abbr: "Champion Profile",
        full: "BII ≥ 60 AND SQ ≥ 60",
        range: "Top-right quadrant",
        unit: "Gold",
        description:
          "Athletes with both strong physical potential and assessed skill. Priority intake candidates. These are athletes the PGBA programme is designed to identify and accelerate.",
        formula: "Midpoint at 60 (not 50) — PGBA works with a selected cohort, so the baseline expectation is above population median.",
        components: [],
        source: "PGBA talent quadrant methodology.",
        colour: "#D4A017",
      },
      {
        abbr: "Raw Physical Talent",
        full: "BII ≥ 60 AND SQ < 60",
        range: "Bottom-right quadrant",
        unit: "Blue",
        description:
          "High physical potential, lower skill assessment. Often athletes transitioning from other sports (athletics, gymnastics). Strong candidates for fast-track skill development. High BII means the physical foundation is already there.",
        formula: "BII ≥ 60, SQ < 60.",
        components: [],
        source: "PGBA talent quadrant methodology.",
        colour: "#2563EB",
      },
      {
        abbr: "Skill First",
        full: "BII < 60 AND SQ ≥ 60",
        range: "Top-left quadrant",
        unit: "Green",
        description:
          "High skill rating, lower physical test scores. May reflect excellent technique masking physical limitations, or incomplete physical test data. Physical conditioning programme recommended.",
        formula: "BII < 60, SQ ≥ 60.",
        components: [],
        source: "PGBA talent quadrant methodology.",
        colour: "#059669",
      },
      {
        abbr: "Early Development",
        full: "BII < 60 AND SQ < 60",
        range: "Bottom-left quadrant",
        unit: "Grey",
        description:
          "Developing athletes who need more time. Not a rejection — many champions spent time here. Age-appropriate expectations apply: a U10 in this quadrant should be reassessed at U12.",
        formula: "BII < 60, SQ < 60.",
        components: [],
        source: "PGBA talent quadrant methodology.",
        colour: "#6B7280",
      },
    ],
  },
  {
    id: "flags",
    label: "Data Flags",
    icon: "🚦",
    entries: [
      {
        abbr: "⛔ BLOCKED",
        full: "Data Blocked — cannot score",
        range: "—",
        unit: "Red",
        description:
          "The entered value is physically impossible. BII cannot be calculated. The athlete profile is shown with a blocked indicator. Correct the data and re-import.",
        formula: "Triggers: RT < 80ms | VJ > 120cm | 4CR < 8.0s | Grip > 65kg | Beep > level 15 | Any skill score outside 1–10",
        components: [],
        source: "Sports science literature — physiological limits for youth athletes.",
        colour: "#C0392B",
      },
      {
        abbr: "⚠ VERIFY",
        full: "Flagged — verify with coach",
        range: "—",
        unit: "Amber",
        description:
          "The value is physiologically possible but extraordinary. BII is calculated but the profile shows a verification flag. The coach should confirm the measurement before using the score for selection decisions.",
        formula: "Triggers: RT < 110ms | All skill scores ≥ 9 (leniency bias) | BII > 88 with years_playing < 1 | Wingspan > height + 18cm",
        components: [],
        source: "TISTI 2025 — RT min recorded 110ms. PGBA methodology for leniency detection.",
        colour: "#D97706",
      },
      {
        abbr: "🔄 AUTO-CORRECTED",
        full: "Value auto-corrected before scoring",
        range: "—",
        unit: "Orange",
        description:
          "The system detected a common data entry convention error and corrected it automatically. The original value is preserved and shown alongside the corrected value.",
        formula: "RT: if value < 2.0 → multiply × 1000 (seconds entered instead of ms)\nVJ: if value > 150 AND standing_reach_cm present → net_jump = value − standing_reach_cm",
        components: [],
        source: "Field observation — coaches commonly enter RT in seconds (0.156) rather than ms (156).",
        colour: "#EA580C",
      },
      {
        abbr: "✅ CLEAN",
        full: "Data validated — no issues",
        range: "—",
        unit: "Green",
        description:
          "All entered values passed the validation engine. No corrections applied. Profile and scores are reliable for selection decisions.",
        formula: "No block or flag conditions triggered.",
        components: [],
        source: "—",
        colour: "#059669",
      },
    ],
  },
  {
    id: "norms",
    label: "Norm Sources",
    icon: "📚",
    entries: [
      {
        abbr: "P25 / P50 / P75",
        full: "25th / 50th / 75th Percentile",
        range: "—",
        unit: "Reference percentiles",
        description:
          "All norm tables show three reference points. P50 is the median — 50% of athletes in the reference population scored above/below this. P75 = top 25%. P25 = bottom 25%. An athlete above P75 on a test is performing in the top quartile for their age band and gender.",
        formula: "Percentile calculation: interpolate between P25, P50, P75 using piecewise linear interpolation.",
        components: [
          { name: "< P25", weight: "Below average", desc: "Below 25th percentile — priority for focused development" },
          { name: "P25–P50", weight: "Average", desc: "Between 25th and 50th percentile — meets baseline" },
          { name: "P50–P75", weight: "Above average", desc: "Above median — solid foundation" },
          { name: "> P75", weight: "Top quartile", desc: "Top 25% — high performance indicator" },
        ],
        source: "Standard statistical percentile methodology.",
        colour: "#1A5C38",
      },
      {
        abbr: "TISTI 2025",
        full: "Indian Badminton TISTI Research, Uttarakhand (2025)",
        range: "—",
        unit: "Primary RT norm source",
        description:
          "The only published study providing Indian youth badminton-specific reaction time norms. Boys mean: 156ms ± 28ms. Girls mean: 144ms ± 24ms. Ages 8–14. Used as the anchor for all RT norm tables in this module.",
        formula: "RT norms only. All other norms: EUROFIT + BWF 2008 adapted for South Asian youth.",
        components: [],
        source: "TISTI Uttarakhand Badminton Research, 2025. The only verified Indian youth RT source for badminton.",
        note: "⚠ Zig-zag agility norms: Girls mean 20.88s ± 2.63s, Boys mean 19.40s ± 2.10s (state level). These are reference values — not used directly in BII calculation as they use a different agility protocol.",
        colour: "#1A5C38",
      },
      {
        abbr: "PMC 2024",
        full: "PMC AHP Study — Delphi Expert Consensus (2024)",
        range: "—",
        unit: "BII weight source",
        description:
          "The only validated AHP-derived weight system for badminton physical fitness. Expert panel of elite badminton coaches and sports scientists using Delphi methodology. Determines how much each fitness component contributes to badminton performance.",
        formula: "BII component weights: SPF 0.651, BPF 0.272, BM 0.077. Secondary: Agility 0.223, Strength 0.217, Endurance 0.210, Flexibility 0.189, Speed 0.161.",
        components: [],
        source: "PMC 2024. DOI: 10.3390/ijerph21030298. Elite male singles badminton — weights validated for competition level, adapted for youth development context.",
        colour: "#2563EB",
      },
      {
        abbr: "BWF 2008",
        full: "BWF / Badminton Australia Fitness Testing Protocols (2008)",
        range: "—",
        unit: "Battery source",
        description:
          "The international standard test battery for junior badminton talent identification. Validates: SEMO agility, beep test, vertical jump, grip dynamometer, shuttlecock throw distance, reaction time.",
        formula: "Protocol definitions for VJ, BT, GS, ST, RT. Norm values for non-Indian populations — used as reference only, adjusted for South Asian youth.",
        components: [],
        source: "Badminton World Federation / Badminton Australia, 2008.",
        colour: "#7C3AED",
      },
      {
        abbr: "EUROFIT",
        full: "European Fitness Testing Battery",
        range: "—",
        unit: "Protocol source",
        description:
          "International standard fitness testing battery. Used for: Standing Broad Jump, Sit and Reach, Sit-ups (30s), Push-ups (30s), 10×5m Shuttle Run. Protocol definitions are standardised — norms adapted for South Asian youth populations.",
        formula: "Standardised test protocols. Norms: adapted from PMC 2022 + Indian youth studies.",
        components: [],
        source: "Council of Europe, EUROFIT battery. Indian youth adaptation: PMC 2022.",
        colour: "#6B7280",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: (typeof SECTIONS)[0]["entries"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all"
      style={{ borderColor: entry.colour + "30" }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div
          className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center text-xs font-black text-white text-center leading-tight"
          style={{ background: entry.colour }}
        >
          {entry.abbr.length <= 6 ? entry.abbr : entry.abbr.slice(0, 6)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm">{entry.abbr}</span>
            <span className="text-muted-foreground text-xs">—</span>
            <span className="text-muted-foreground text-xs font-medium truncate">{entry.full}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {entry.description}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: entry.colour + "20", color: entry.colour }}
          >
            {entry.unit}
          </span>
          <span className="text-xs text-muted-foreground">{entry.range}</span>
        </div>
        <span className="text-muted-foreground ml-2 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: entry.colour + "20" }}>
          {/* Formula */}
          {entry.formula && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 mt-4">
                Formula / Calculation
              </p>
              <pre
                className="text-xs font-mono p-3 rounded-lg whitespace-pre-wrap break-words"
                style={{ background: entry.colour + "10", color: entry.colour, border: `1px solid ${entry.colour}25` }}
              >
                {entry.formula}
              </pre>
            </div>
          )}

          {/* Components */}
          {entry.components.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Components
              </p>
              <div className="space-y-2">
                {entry.components.map((c) => (
                  <div key={c.name} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded mt-0.5"
                      style={{ background: entry.colour + "15", color: entry.colour }}
                    >
                      {c.weight}
                    </div>
                    <div>
                      <span className="text-xs font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">— {c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{ background: "#1A5C3810", borderLeft: `3px solid #1A5C38` }}
          >
            <span className="flex-shrink-0 font-bold text-[#1A5C38]">SOURCE</span>
            <span className="text-muted-foreground">{entry.source}</span>
          </div>

          {/* Note */}
          {entry.note && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{ background: "#D4A01710", borderLeft: `3px solid #D4A017` }}
            >
              <span className="flex-shrink-0 font-bold text-[#D4A017]">NOTE</span>
              <span className="text-muted-foreground">{entry.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BadmintonGlossary() {
  const [activeSection, setActiveSection] = useState("scores");

  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Abbreviations & Methodology</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Every metric, score, and flag explained — with source citations.
          </p>
        </div>
        <div
          className="text-xs font-semibold px-3 py-1.5 rounded-full border"
          style={{ color: "#1A5C38", borderColor: "#1A5C3840", background: "#1A5C3810" }}
        >
          {SECTIONS.reduce((n, s) => n + s.entries.length, 0)} entries
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="p-4 rounded-xl text-xs leading-relaxed"
        style={{ background: "#1A5C3810", border: "1px solid #1A5C3830" }}
      >
        <span className="font-bold text-[#1A5C38]">Scientific basis: </span>
        <span className="text-muted-foreground">
          All norms reference Indian youth badminton research + EUROFIT protocols (TISTI 2025, PMC 2022/2024, BWF 2008).
          PGBA may update these norms using academy-specific cohort data as it grows.
          No invented benchmarks are used. All estimates are clearly labeled.
        </span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border",
              activeSection === s.id
                ? "text-white border-transparent"
                : "text-muted-foreground border-border hover:bg-muted"
            )}
            style={
              activeSection === s.id
                ? { background: "#1A5C38", borderColor: "#1A5C38" }
                : {}
            }
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                activeSection === s.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {s.entries.length}
            </span>
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
          {section.icon} {section.label} — {section.entries.length} entries · click any row to expand
        </p>
        {section.entries.map((entry) => (
          <EntryCard key={entry.abbr} entry={entry} />
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t text-xs text-muted-foreground text-center leading-relaxed">
        Reference: Indian youth badminton research + EUROFIT protocols · PGBA may update norms using academy-specific cohort data
        <br />
        BII weights: PMC 2024 (DOI: 10.3390/ijerph21030298) · RT norms: TISTI Uttarakhand 2025 · Test battery: BWF 2008
      </div>
    </div>
  );
}
