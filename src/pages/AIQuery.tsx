import { useState } from "react";
import { Search, Sparkles, ChevronRight, X, BookOpen, Clock, Copy, Download, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useAthletes } from "@/hooks/useAthletes";
import { EnrichedAthlete } from "@/engine/analyticsEngine";

// ─── Query Engine ─────────────────────────────────────────────────────────

interface QueryResult {
  results: EnrichedAthlete[];
  filters: string[];
  reasoning: string;
  metricLabel: string;
  metricFn: (a: EnrichedAthlete) => string;
  poolSize: number;         // pre-slice pool size for accurate reasoning
  isMaleVsFemale?: boolean; // special comparison mode
  maleGroup?: EnrichedAthlete[];
  femaleGroup?: EnrichedAthlete[];
}

function parseTopN(q: string): number {
  const m = q.match(/(?:top|first|show)\s+(\d+)/i);
  return m ? Math.min(parseInt(m[1], 10), 100) : 10;
}

function parseAgeRange(q: string): [number, number] | null {
  // Matches: "14-16", "14–16", "14 to 16", "aged 14-16"
  // Must be preceded by age-related word OR be a standalone range (not part of "top 10")
  const m = q.match(/(?:aged?\s+|between\s+)(\d{1,2})\s*[-–to]+\s*(\d{1,2})/i)
    || q.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:year|yr|age)/i);
  if (!m) return null;
  const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
  // Sanity: must be plausible ages, not confusion with "top 10" etc.
  if (lo < 8 || lo > 25 || hi < 8 || hi > 25 || lo > hi) return null;
  return [lo, hi];
}

function parseScoreThreshold(q: string): number | null {
  const m = q.match(/(?:composite\s+score\s+(?:above|over|>|>=)|score\s*(?:>|>=|above|over))\s*(\d+)/i)
    || q.match(/above\s+(\d{2,3})/i);
  if (!m) return null;
  const v = parseInt(m[1], 10);
  return (v >= 1 && v <= 100) ? v : null;
}

function formatRunTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Hindi keyword maps ───────────────────────────────────────────────────
const HINDI_TO_ENGLISH: [RegExp, string][] = [
  [/शीर्ष|टॉप/g, "top"],
  [/खिलाड़ी/g, "athletes"],
  [/वर्टिकल जंप/g, "vertical jump"],
  [/ब्रॉड जंप/g, "broad jump"],
  [/स्प्रिंट|दौड़/g, "sprint"],
  [/साइकिलिंग/g, "cycling"],
  [/फुटबॉल/g, "football"],
  [/कबड्डी/g, "kabaddi"],
  [/कम वजन|कमजोर/g, "underweight"],
  [/अधिक वजन/g, "overweight"],
  [/उच्च क्षमता/g, "high potential"],
  [/पुरुष|लड़के/g, "male"],
  [/महिला|लड़कियां/g, "female"],
  [/सहनशक्ति/g, "endurance"],
  [/800 मीटर|आठ सौ मीटर/g, "800m"],
  [/तुलना/g, "compare"],
];

function normaliseQuery(raw: string): string {
  let q = raw;
  for (const [re, en] of HINDI_TO_ENGLISH) q = q.replace(re, en);
  return q.toLowerCase();
}

export function queryAthletes(rawQuery: string, athletes: EnrichedAthlete[]): QueryResult {
  const q = normaliseQuery(rawQuery);
  const filters: string[] = [];
  let pool = [...athletes];
  const totalAthletes = athletes.length;
  const limit = parseTopN(q);
  let metricLabel = "Composite Score";
  let metricFn: (a: EnrichedAthlete) => string = (a) => String(a.compositeScore);

  // ── Special: male vs female comparison ──
  const isMvF = /compare\s+male|male\s+vs|male.*female|female.*male/i.test(q);
  if (isMvF) {
    const allMales = athletes.filter((a) => a.gender === "M");
    const allFemales = athletes.filter((a) => a.gender === "F");
    const males = [...allMales].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, limit);
    const females = [...allFemales].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, limit);

    // Handle single-gender datasets gracefully
    if (allMales.length === 0 && allFemales.length > 0) {
      const avgF = Math.round(allFemales.reduce((s, a) => s + a.compositeScore, 0) / allFemales.length);
      const reasoning = `This dataset contains ${allFemales.length} female athletes (avg CAPI: ${avgF} pct). No male athletes are present in this cohort — showing female rankings instead.`;
      return {
        results: females,
        filters: ["Mode: Female Athletes (no male data in this cohort)"],
        reasoning,
        metricLabel: "CAPI Score (percentile)",
        metricFn: (a) => `${a.compositeScore} pct`,
        poolSize: allFemales.length,
        isMaleVsFemale: true,
        maleGroup: [],
        femaleGroup: females,
      };
    }
    if (allFemales.length === 0 && allMales.length > 0) {
      const avgM = Math.round(allMales.reduce((s, a) => s + a.compositeScore, 0) / allMales.length);
      const reasoning = `This dataset contains ${allMales.length} male athletes (avg CAPI: ${avgM} pct). No female athletes are present in this cohort — showing male rankings instead.`;
      return {
        results: males,
        filters: ["Mode: Male Athletes (no female data in this cohort)"],
        reasoning,
        metricLabel: "CAPI Score (percentile)",
        metricFn: (a) => `${a.compositeScore} pct`,
        poolSize: allMales.length,
        isMaleVsFemale: true,
        maleGroup: males,
        femaleGroup: [],
      };
    }

    const avgM = males.length ? Math.round(males.reduce((s, a) => s + a.compositeScore, 0) / males.length) : 0;
    const avgF = females.length ? Math.round(females.reduce((s, a) => s + a.compositeScore, 0) / females.length) : 0;
    const reasoning = `Comparison mode: ${allMales.length} male athletes (avg CAPI: ${avgM} pct) vs ${allFemales.length} female athletes (avg CAPI: ${avgF} pct). Showing top ${Math.max(males.length, females.length)} from each group. Total dataset: ${totalAthletes} athletes.`;
    return {
      results: [...males.slice(0, 5), ...females.slice(0, 5)],
      filters: ["Mode: Male vs Female Comparison"],
      reasoning,
      metricLabel: "CAPI Score (percentile)",
      metricFn: (a) => `${a.compositeScore} pct (${a.gender === "M" ? "Male" : "Female"})`,
      poolSize: totalAthletes,
      isMaleVsFemale: true,
      maleGroup: males,
      femaleGroup: females,
    };
  }

  // ── Gender filter ──
  if (/\b(male|boys?|men)\b/i.test(q)) {
    pool = pool.filter((a) => a.gender === "M");
    filters.push("Gender: Male");
  } else if (/\b(female|girls?|women)\b/i.test(q)) {
    pool = pool.filter((a) => a.gender === "F");
    filters.push("Gender: Female");
  }

  // ── Age range filter ──
  const ageRange = parseAgeRange(q);
  if (ageRange) {
    pool = pool.filter((a) => a.age >= ageRange[0] && a.age <= ageRange[1]);
    filters.push(`Age: ${ageRange[0]}–${ageRange[1]}`);
  } else if (/under\s*12/i.test(q)) {
    pool = pool.filter((a) => a.age < 12);
    filters.push("Age: Under 12");
  } else if (/18\+|eighteen\s*plus|adult/i.test(q)) {
    pool = pool.filter((a) => a.age >= 18);
    filters.push("Age: 18+");
  }

  // ── BMI / body flags ── (check before general sort to allow compound queries)
  let bmiFilter = false;
  // "nutrition support" / "nutrition alert" → maps to IAP thinness (BMI < 16.0)
  // This is the demo query "Who needs nutrition support?" — must return the correct athletes
  if (/nutrition\s*support|nutrition\s*alert|needs?\s*nutrition|खाना|पोषण/i.test(q)) {
    pool = pool.filter((a) => a.bmi != null && a.bmi < 16.0);
    filters.push("Flag: Thinness BMI < 16 (IAP)");
    bmiFilter = true;
    metricLabel = "BMI";
    metricFn = (a) => a.bmi != null ? `${a.bmi.toFixed(1)} BMI` : "—";
  } else if (/underweight|bmi\s*<\s*18/i.test(q)) {
    pool = pool.filter((a) => a.flags?.some((f) => f.type === "underweight"));
    filters.push("Flag: Underweight");
    bmiFilter = true;
    // If no other metric asked, show BMI as the metric
    if (!/vertical|broad|sprint|30\s*m|800|endurance|shuttle|throw|cycling|football|kabaddi|swim|wrestl|basket|volley/i.test(q)) {
      metricLabel = "BMI";
      metricFn = (a) => a.bmi != null ? a.bmi.toFixed(1) : "—";
    }
  } else if (/overweight|bmi\s*>\s*25/i.test(q)) {
    pool = pool.filter((a) => a.bmi != null && a.bmi > 25);
    filters.push("Flag: Overweight");
    bmiFilter = true;
    if (!/vertical|broad|sprint|30\s*m|800|endurance|shuttle|throw|cycling|football|kabaddi/i.test(q)) {
      metricLabel = "BMI";
      metricFn = (a) => a.bmi != null ? a.bmi.toFixed(1) : "—";
    }
  }


  // ── High potential ──
  if (/high\s*potential|top\s*talent/i.test(q)) {
    pool = pool.filter((a) => a.isHighPotential);
    filters.push("Filter: High Potential");
  }

  // ── Data quality issues — "which athletes have data quality issues?" ──
  // Returns ALL flagged/blocked athletes (both import-time flags AND health flags)
  if (/data\s*quality|quality\s*issues?|flagged\s*athlete|blocked\s*athlete|data\s*issue|डेटा\s*गुणवत्ता/i.test(q)) {
    const qualityPool = pool.filter((a) => {
      const hasImportFlag =
        (a as typeof a & { sprint30mFlag?: string }).sprint30mFlag === "OUTLIER_VERIFY" ||
        (a as typeof a & { broadJumpFlag?: string }).broadJumpFlag === "OUTLIER_VERIFY" ||
        (a as typeof a & { run800mFlag?: string }).run800mFlag === "FORMAT_UNREADABLE" ||
        (a as typeof a & { run800mFlag?: string }).run800mFlag === "IMPLAUSIBLE_VERIFY" ||
        (a as typeof a & { vjFlag?: string }).vjFlag === "UNCLEAR_VERIFY" ||
        (a as typeof a & { vjFlag?: string }).vjFlag === "AUTO_CORRECTED" ||
        (a as typeof a & { run800mFlag?: string }).run800mFlag === "AUTO_CORRECTED";
      const hasScoreFlag = (a.flags?.length ?? 0) > 0;
      return hasImportFlag || hasScoreFlag;
    });
    const dqMeta = "Filter: All Data Quality Issues (blocked + flagged + auto-corrected)";
    const dqMetricLabel = "Data Flags";
    const dqMetricFn = (a: EnrichedAthlete) => {
      const flags = a.flags ?? [];
      if (flags.length === 0) return "Auto-corrected";
      return flags.map((f) => f.type).join(", ");
    };
    const sorted = [...qualityPool].sort((a, b) => (b.flags?.length ?? 0) - (a.flags?.length ?? 0));
    const results = sorted.slice(0, 50);
    const reasoning = `Found ${qualityPool.length} athletes with data quality issues (blocked values, implausible metrics, auto-corrections, or health flags). These must be reviewed before finalising rankings.`;
    return { results, filters: [dqMeta], reasoning, metricLabel: dqMetricLabel, metricFn: dqMetricFn, poolSize: qualityPool.length };
  }


  if (/sai\s*elite|khelo\s*india\s*(candidate|selection)|elite\s*candidate/i.test(q)) {
    pool = pool.filter((a) => {
      const di = a.derivedIndices;
      if (!di) return false;
      return di.nationalComposite >= 70;
    });
    filters.push("Filter: SAI Elite Band (Nat. CAPI ≥ 70)");
    metricLabel = "National CAPI";
    metricFn = (a) => `${a.derivedIndices?.nationalComposite ?? "—"} / 100`;
  }

  // ── National talent pool filter ──
  if (/national\s*talent\s*pool|talent\s*pool|khelo\s*india\s*standard/i.test(q)) {
    pool = pool.filter((a) => (a.derivedIndices?.nationalComposite ?? 0) >= 55);
    filters.push("Filter: National Talent Pool (Nat. CAPI ≥ 55)");
    metricLabel = "National CAPI";
    metricFn = (a) => `${a.derivedIndices?.nationalComposite ?? "—"} / 100`;
  }

  // ── SAI/National percentile sort ──
  if (/national\s*(composite|score|rank)|best\s*nationally|top\s*national/i.test(q)) {
    filters.push("Sort: National Composite ↓");
    metricLabel = "National CAPI";
    metricFn = (a) => `${a.derivedIndices?.nationalComposite ?? "—"} / 100`;
  }

  // ── Composite score threshold ──
  const threshold = parseScoreThreshold(q);
  if (threshold !== null) {
    pool = pool.filter((a) => a.compositeScore >= threshold);
    filters.push(`Composite Score ≥ ${threshold}`);
  }

  // ── Trajectory / young talent (athletes with development runway) ──
  if (/young\s*talent|future\s*star|most\s*potential|development\s*pipeline|train\s*to\s*train/i.test(q)) {
    pool = pool.filter((a) => a.age <= 15);
    pool.sort((a, b) => (b.derivedIndices?.nationalComposite ?? 0) - (a.derivedIndices?.nationalComposite ?? 0));
    filters.push("Filter: Young Talent Pipeline (age ≤ 15)");
    metricLabel = "National CAPI";
    metricFn = (a) => `${a.derivedIndices?.nationalComposite ?? "—"} (age ${a.age})`;
    const poolSize = pool.length;
    const results = pool.slice(0, limit);
    const reasoning = `Showing ${results.length} young athletes (≤15 yrs) with highest national CAPI — these are your development pipeline candidates with most growth runway. Full dataset: ${totalAthletes} athletes.`;
    return { results, filters, reasoning, metricLabel, metricFn, poolSize };
  }

  // ── Aerobic capacity / VO2max ──
  if (/vo2|aerobic\s*cap|oxygen|aerobic\s*fitness/i.test(q)) {
    filters.push("Metric: VO₂max Estimate");
    metricLabel = "VO₂max Est. (ml/kg/min)";
    metricFn = (a) => a.derivedIndices?.aerobicCapacityEst != null ? `${a.derivedIndices.aerobicCapacityEst.toFixed(1)} ml/kg/min` : "—";
  }

  // ── Explosive power (RPI) ──
  if (/explosive\s*power|relative\s*power|power\s*index|rpi/i.test(q)) {
    filters.push("Metric: Relative Power Index (RPI)");
    metricLabel = "Relative Power Index";
    metricFn = (a) => a.derivedIndices?.relativePowerIndex != null ? `RPI ${a.derivedIndices.relativePowerIndex.toFixed(2)}` : "—";
  }

  // Record pool size BEFORE sorting/slicing for honest reasoning
  const poolSize = pool.length;

  // ── Metric sorts — determine best sort & metric display ──
  // Use priority: explicit metric > sport > default
  type SortFn = (a: EnrichedAthlete) => number;
  let sortFn: SortFn | null = null;

  if (/vertical\s*jump/i.test(q)) {
    sortFn = (a) => -(a.verticalJump ?? 0);
    metricLabel = "Vertical Jump (cm)";
    metricFn = (a) => a.verticalJump != null ? `${a.verticalJump} cm` : "—";
    filters.push("Metric: Vertical Jump");
  } else if (/broad\s*jump/i.test(q)) {
    sortFn = (a) => -(a.broadJump ?? 0);
    metricLabel = "Broad Jump (cm)";
    metricFn = (a) => a.broadJump != null ? `${a.broadJump} cm` : "—";
    filters.push("Metric: Broad Jump");
  } else if (/sprint|30\s*m/i.test(q)) {
    sortFn = (a) => (a.sprint30m ?? 999);  // lower is better
    metricLabel = "30m Sprint (sec)";
    metricFn = (a) => a.sprint30m != null ? `${a.sprint30m.toFixed(2)}s` : "—";
    filters.push("Metric: 30m Sprint");
  } else if (/\b800\s*m\b|endurance/i.test(q)) {
    sortFn = (a) => (a.run800m ?? 999999);  // lower is better
    metricLabel = "800m Run";
    metricFn = (a) => a.run800m != null ? formatRunTime(a.run800m) : "—";
    filters.push("Metric: 800m Run");
  } else if (/shuttle/i.test(q)) {
    sortFn = (a) => (a.shuttleRun ?? 999);
    metricLabel = "Shuttle Run (sec)";
    metricFn = (a) => a.shuttleRun != null ? `${a.shuttleRun.toFixed(2)}s` : "—";
    filters.push("Metric: Shuttle Run");
  } else if (/throw/i.test(q)) {
    sortFn = (a) => -(a.footballThrow ?? 0);
    metricLabel = "Football Throw (m)";
    metricFn = (a) => a.footballThrow != null ? `${a.footballThrow} m` : "—";
    filters.push("Metric: Football Throw");
  } else if (/cycling|cycle|साइकिल/i.test(q)) {
    // Do NOT filter pool by sport — just sort by cycling fit score
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "cycling");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Cycling Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "cycling");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Cycling");
  } else if (/\bfootball\b/i.test(q) && !/throw/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "football");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Football Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "football");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Football");
  } else if (/kabaddi|कबड्डी/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "kabaddi");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Kabaddi Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "kabaddi");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Kabaddi");
  } else if (/volleyball|volley/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "volleyball");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Volleyball Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "volleyball");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Volleyball");
  } else if (/swimming|swim/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "swimming");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Swimming Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "swimming");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Swimming");
  } else if (/wrestling|wrestl/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "wrestling");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Wrestling Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "wrestling");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Wrestling");
  } else if (/basketball|basket/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "basketball");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Basketball Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "basketball");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Basketball");
  } else if (/badminton/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "badminton");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Badminton Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "badminton");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Badminton");
  } else if (/boxing|box/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "boxing");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Boxing Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "boxing");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Boxing");
  } else if (/\bhockey\b/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "hockey");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Hockey Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "hockey");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Hockey");
  } else if (/archery|archer/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "archery");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Archery Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "archery");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Archery");
  } else if (/kho\s*kho|khokho/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "kho_kho");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Kho Kho Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "kho_kho");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Kho Kho");
  } else if (/table\s*tennis|tt\b|ping\s*pong/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "table_tennis");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Table Tennis Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "table_tennis");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Table Tennis");
  } else if (/weightlift|weight\s*lift|bharat|lifting/i.test(q)) {
    sortFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "weightlifting");
      return -(fit?.matchScore ?? 0);
    };
    metricLabel = "Weightlifting Fit Score";
    metricFn = (a) => {
      const fit = a.sportFit?.find((s) => s.sport.key === "weightlifting");
      return fit ? `${fit.matchScore}/100` : "—";
    };
    filters.push("Sport Fit: Weightlifting");
  } else if (/best\s*suit|recommend|which\s*sport|top\s*sport/i.test(q)) {
    sortFn = (a) => -(a.topSportScore ?? 0);
    metricLabel = "Top Sport Fit";
    metricFn = (a) => `${a.topSport} (${a.topSportScore ?? 0})`;
    filters.push("Sort: Top Sport Fit");
  }

  // Default sort: composite score descending
  if (!sortFn) {
    sortFn = (a) => -a.compositeScore;
    if (!bmiFilter) filters.push("Sort: Composite Score ↓");
  }

  pool.sort((a, b) => sortFn!(a) - sortFn!(b));
  filters.push(`Limit: ${limit}`);

  const results = pool.slice(0, limit);

  // ── Build honest reasoning ──
  const genderStr = filters.find((f) => f.startsWith("Gender:"))?.replace("Gender: ", "") ?? null;
  const ageStr = filters.find((f) => f.startsWith("Age:"))?.replace("Age: ", "") ?? null;
  const metricStr = filters.find((f) => f.startsWith("Metric:") || f.startsWith("Sport Fit:") || f.startsWith("Sort:"))
    ?.replace(/^(Metric:|Sport Fit:|Sort:)\s*/, "") ?? "composite score";
  const flagStr = filters.find((f) => f.startsWith("Flag:"))?.replace("Flag: ", "") ?? null;

  let reasoning = `Showing ${results.length} of ${poolSize} matching athletes`;
  if (genderStr) reasoning += ` (${genderStr})`;
  if (ageStr) reasoning += ` aged ${ageStr}`;
  if (flagStr) reasoning += `, filtered by ${flagStr.toLowerCase()} flag`;
  reasoning += `, ranked by ${metricStr.toLowerCase()}.`;
  if (threshold !== null) reasoning += ` Composite score ≥ ${threshold} filter applied.`;
  reasoning += ` Full dataset: ${totalAthletes} athletes.`;

  return { results, filters, reasoning, metricLabel, metricFn, poolSize };
}

// ─── Constants ────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES_EN = [
  "Show top 10 athletes by vertical jump",
  "Find underweight athletes",
  "Which athletes are best suited for cycling?",
  "Show SAI elite candidates",
  "Compare male vs female average performance",
  "Find athletes aged 14–16 with composite score above 60",
  "Show national talent pool",
  "Find young talent development pipeline (age ≤ 15)",
  "Show athletes with highest aerobic capacity",
];

const EXAMPLE_QUERIES_HI = [
  "वर्टिकल जंप में शीर्ष 10 खिलाड़ी दिखाएं",
  "कम वजन वाले खिलाड़ी खोजें",
  "साइकिलिंग के लिए सबसे उपयुक्त खिलाड़ी कौन हैं?",
  "उच्च क्षमता वाले खिलाड़ी दिखाएं",
  "पुरुष बनाम महिला प्रदर्शन की तुलना करें",
  "राष्ट्रीय प्रतिभा पूल दिखाएं",
];

const SAVED_TEMPLATES = [
  { id: 1, name: "Top sprinters", query: "Show top 10 athletes by 30m sprint" },
  { id: 2, name: "High potential cohort", query: "Show athletes with high potential" },
  { id: 3, name: "Underweight alert", query: "Find underweight athletes" },
  { id: 4, name: "SAI Elite candidates", query: "Show SAI elite candidates" },
  { id: 5, name: "Khelo India pipeline", query: "Show national talent pool" },
  { id: 6, name: "Young talent pipeline", query: "Find young talent development pipeline age 15" },
  { id: 7, name: "Best volleyball fit", query: "Show top 10 athletes for volleyball" },
];

const FOLLOW_UP = [
  "Show top 10 athletes by vertical jump",
  "Show SAI elite candidates",
  "Find young talent development pipeline",
  "Show national talent pool",
  "Which athletes are best suited for cycling?",
  "Show top 10 athletes by 30m sprint",
  "Show athletes with highest aerobic capacity",
  "Show top 10 athletes for kabaddi",
];

type QueryState = "idle" | "interpreting" | "results";

// ─── Male vs Female Comparison Card ──────────────────────────────────────

function MaleVsFemaleCard({ result }: { result: QueryResult }) {
  const males = result.maleGroup ?? [];
  const females = result.femaleGroup ?? [];
  const avgM = males.length ? Math.round(males.reduce((s, a) => s + a.compositeScore, 0) / males.length) : 0;
  const avgF = females.length ? Math.round(females.reduce((s, a) => s + a.compositeScore, 0) / females.length) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" /> Male vs Female Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{avgM}</div>
            <div className="text-xs text-muted-foreground mt-1">Male avg. score ({males.length} athletes)</div>
          </div>
          <div className="bg-accent/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">{avgF}</div>
            <div className="text-xs text-muted-foreground mt-1">Female avg. score ({females.length} athletes)</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Top Males</p>
            {males.slice(0, 5).map((a, i) => (
              <div key={a.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                <span className="text-foreground">#{i + 1} {a.name}</span>
                <span className="font-semibold text-primary">{a.compositeScore}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Top Females</p>
            {females.slice(0, 5).map((a, i) => (
              <div key={a.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                <span className="text-foreground">#{i + 1} {a.name}</span>
                <span className="font-semibold text-accent">{a.compositeScore}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────

export default function AIQueryPage() {
  const { language } = useTranslation();
  const { athletes, datasetMeta } = useAthletes();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<QueryState>("idle");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [interpretedFilters, setInterpretedFilters] = useState<string[]>([]);

  const examples = language === "hi" ? EXAMPLE_QUERIES_HI : EXAMPLE_QUERIES_EN;

  const handleQuery = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setState("interpreting");
    setTimeout(() => {
      const result = queryAthletes(q, athletes);
      setQueryResult(result);
      setInterpretedFilters(result.filters);
      setState("results");
    }, 600);
  };

  const removeFilter = (f: string) => {
    setInterpretedFilters((prev) => prev.filter((x) => x !== f));
  };

  const handleExportCSV = () => {
    if (!queryResult) return;
    const headers = ["Rank", "Name", "Gender", "Age", "School", "Composite Score", queryResult.metricLabel];
    const rows = queryResult.results.map((r, i) => [
      i + 1, r.name, r.gender, r.age, r.school, r.compositeScore, queryResult.metricFn(r),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pratibha_query_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          AI Query Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask questions about your athletes in plain English or Hindi.{" "}
          <span className="text-xs text-primary font-medium">
            Active: {datasetMeta.name} · {athletes.length} athletes
          </span>
        </p>
      </div>

      {/* Query Input */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery(query)}
                placeholder={language === "hi" ? "खिलाड़ियों के बारे में कुछ भी पूछें..." : "Ask anything about your athletes..."}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Button onClick={() => handleQuery(query)} disabled={!query.trim()} className="gap-2 px-5">
              <Sparkles className="w-4 h-4" /> Ask
            </Button>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => handleQuery(ex)}
                className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-colors text-muted-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interpreting state */}
      {state === "interpreting" && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Interpreting your query...</p>
                <p className="text-xs text-muted-foreground">Filtering and ranking {athletes.length} athletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {state === "results" && queryResult && (
        <div className="space-y-4">
          {/* Interpreted query */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Interpreted as</p>
                  <p className="text-sm font-medium text-foreground">"{query}"</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {interpretedFilters.map((f) => (
                      <Badge key={f} variant="secondary" className="gap-1 text-xs">
                        {f}
                        <button onClick={() => removeFilter(f)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => handleQuery(query)}>
                  <Sparkles className="w-3 h-3" /> Re-run
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Male vs Female special view */}
          {queryResult.isMaleVsFemale ? (
            <MaleVsFemaleCard result={queryResult} />
          ) : (
            /* Results table */
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Results — {queryResult.results.length} of {queryResult.poolSize} athletes
                    {queryResult.results.length === 0 && (
                      <span className="text-muted-foreground font-normal text-sm ml-2">(no matches found)</span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => {
                        const text = queryResult.results.map((r, i) => `${i + 1}. ${r.name} — ${queryResult.metricFn(r)}`).join("\n");
                        navigator.clipboard?.writeText(text);
                      }}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleExportCSV}>
                      <Download className="w-3 h-3" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {queryResult.results.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No athletes matched this query in the current dataset.</p>
                    <p className="text-xs mt-1">Try broadening your filters or check a different dataset.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-12">Rank</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground hidden sm:table-cell">School</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Score</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">{queryResult.metricLabel}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {queryResult.results.map((r, i) => (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="py-2 pr-4 font-bold text-muted-foreground">#{i + 1}</td>
                          <td className="py-2 pr-4 font-medium text-foreground">
                            {r.name}
                            <span className="ml-2 text-xs text-muted-foreground">{r.gender} · {r.age}y</span>
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground text-xs hidden sm:table-cell">{r.school}</td>
                          <td className="py-2 pr-4 text-right">
                            <Badge variant="outline" className="text-xs">{r.compositeScore}</Badge>
                          </td>
                          <td className="py-2 text-right font-semibold text-primary">{queryResult.metricFn(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Reasoning */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Query Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1.5">
              <p>{queryResult.reasoning}</p>
              <p className="text-xs italic">
                Rankings are cohort-relative within the active dataset: <strong>{datasetMeta.name}</strong>.
                All computation is on-device — no data leaves your browser.
              </p>
            </CardContent>
          </Card>

          {/* Follow-up prompts */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggested follow-ups</p>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UP.map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuery(f)}
                  className="text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-colors text-muted-foreground flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Saved Query Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {SAVED_TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{tpl.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tpl.query}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuery(tpl.query)}>
                  Run
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
