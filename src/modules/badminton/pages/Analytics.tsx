// ─── Badminton Cohort Analytics ───────────────────────────────────────────────
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
} from "recharts";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete } from "../types";

const COURT_GREEN = "#1A5C38";
const SHUTTLE_GOLD = "#D4A017";

const METRICS = [
  { key: "reaction_time_ms" as const, label: "RT (ms)", corrKey: "reaction_time_ms" as const },
  { key: "four_corner_shuttle_run_sec" as const, label: "4-Corner", corrKey: "four_corner_shuttle_run_sec" as const },
  { key: "ten_by_five_shuttle_run_sec" as const, label: "10×5m", corrKey: "ten_by_five_shuttle_run_sec" as const },
  { key: "vertical_jump_cm" as const, label: "VJ (cm)", corrKey: "vertical_jump_cm" as const },
  { key: "standing_broad_jump_cm" as const, label: "Broad J", corrKey: "standing_broad_jump_cm" as const },
  { key: "beep_test_level" as const, label: "Beep", corrKey: "beep_test_level" as const },
  { key: "grip_strength_kg" as const, label: "Grip", corrKey: "grip_strength_kg" as const },
  { key: "shuttlecock_throw_m" as const, label: "S.Throw", corrKey: "shuttlecock_throw_m" as const },
  { key: "situps_30sec" as const, label: "Situps", corrKey: "situps_30sec" as const },
  { key: "pushups_30sec" as const, label: "Pushups", corrKey: "pushups_30sec" as const },
  { key: "sit_and_reach_cm" as const, label: "Sit/Reach", corrKey: "sit_and_reach_cm" as const },
];

type PctKey = keyof NonNullable<ProcessedBadmintonAthlete["percentiles"]>;

const METRIC_PCT_MAP: Partial<Record<typeof METRICS[number]["corrKey"], PctKey>> = {
  reaction_time_ms: "reaction",
  four_corner_shuttle_run_sec: "four_corner",
  ten_by_five_shuttle_run_sec: "ten_by_five",
  vertical_jump_cm: "vertical_jump",
  standing_broad_jump_cm: "broad_jump",
  beep_test_level: "beep_test",
  grip_strength_kg: "grip",
  shuttlecock_throw_m: "shuttlecock_throw",
  situps_30sec: "situps",
  pushups_30sec: "pushups",
  sit_and_reach_cm: "sit_reach",
};

function heatColour(pct: number | undefined): string {
  if (pct === undefined) return "bg-muted text-muted-foreground";
  if (pct < 25) return "bg-red-100 text-red-700";
  if (pct < 75) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

// Simple histogram bins for reaction time distribution
function buildHistogram(values: number[], bins = 8): { range: string; count: number }[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 10;
  const result = Array.from({ length: bins }, (_, i) => ({
    range: `${Math.round(min + i * width)}`,
    count: 0,
  }));
  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    result[idx].count++;
  });
  return result;
}

export default function BadmintonAnalytics() {
  const athletes = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);
  const valid = useMemo(() => athletes.filter((a) => !a.isBlocked && a.bii.bii !== undefined), [athletes]);

  // Panel 1 — Talent pipeline
  const pipeline = useMemo(
    () => valid.filter((a) => a.quadrant === "CHAMPION_PROFILE" || a.quadrant === "RAW_PHYSICAL_TALENT"),
    [valid]
  );

  function topWeakness(a: ProcessedBadmintonAthlete): string {
    const sec = a.secondary;
    const entries = [
      ["Agility", sec.agility], ["Strength", sec.strength],
      ["Endurance", sec.endurance], ["Flexibility", sec.flexibility], ["Reaction", sec.speed],
    ] as [string, number | undefined][];
    const defined = entries.filter(([, v]) => v !== undefined) as [string, number][];
    if (!defined.length) return "—";
    return defined.sort((a, b) => a[1] - b[1])[0][0];
  }

  // Panel 2 — Heatmap data
  const heatAthletes = valid.slice(0, 16);

  // Panel 3 — RT histogram
  const rtValues = useMemo(
    () => valid.map((a) => a.corrected.reaction_time_ms).filter((v) => v !== undefined) as number[],
    [valid]
  );
  const rtHistogram = useMemo(() => buildHistogram(rtValues), [rtValues]);

  // Panel 4 — Gopichand 5-Pillar radar
  const pillarData = useMemo(() => {
    const avg = (vals: number[]) => vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return [
      {
        axis: "Physical",
        cohort: Math.round(avg(valid.map((a) => a.bii.bii ?? 0))),
        target: 85,
      },
      {
        axis: "Technical",
        cohort: Math.round(avg(valid.map((a) => {
          const r = a.raw;
          const vals = [r.stroke_mechanics, r.smash_quality, r.net_play, r.serve_accuracy].filter(Boolean) as number[];
          return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length * 10 : 0;
        }))),
        target: 85,
      },
      {
        axis: "Mental",
        cohort: Math.round(avg(valid.map((a) => (a.raw.mental_resilience ?? 0) * 10))),
        target: 85,
      },
      {
        axis: "Discipline",
        cohort: Math.round(avg(valid.map((a) => (a.raw.coachability ?? 0) * 10))),
        target: 85,
      },
      {
        axis: "Tactical",
        cohort: Math.round(avg(valid.map((a) => (a.raw.court_awareness ?? 0) * 10))),
        target: 85,
      },
    ];
  }, [valid]);

  // Panel 5 — BII trend by age band
  const ageBandTrend = useMemo(() => {
    const bands = ["U10", "U12", "U14", "U16"] as const;
    return bands.map((band) => {
      const inBand = valid.filter((a) => a.age_band === band);
      const males = inBand.filter((a) => a.raw.gender === "Male");
      const females = inBand.filter((a) => a.raw.gender === "Female");
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? Math.round(arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length * 10) / 10 : null;
      return { band, Male: avg(males), Female: avg(females) };
    });
  }, [valid]);

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="text-xl">🏸</span>
        <div>
          <h1 className="text-lg font-bold" style={{ color: COURT_GREEN }}>COHORT ANALYTICS</h1>
          <p className="text-xs text-muted-foreground">PGBA Hyderabad — {valid.length} scored athletes</p>
        </div>
      </div>

      {/* Panel 1 — Talent Pipeline */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-bold">TALENT PIPELINE — PRIORITY ATHLETES</h2>
        <p className="text-xs text-muted-foreground">Champion Profiles and Raw Physical Talents. Source: Talent Quadrant (BII/SQ ≥ 60 threshold).</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {["Name", "Band", "BII", "SQ", "Top Weakness", "Recommendation"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pipeline.map((a) => (
                <tr key={a.raw.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-semibold">{a.raw.name}</td>
                  <td className="px-3 py-2"><span className="bg-muted rounded-full px-2 py-0.5">{a.age_band}</span></td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: COURT_GREEN }}>{a.bii.bii?.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: SHUTTLE_GOLD }}>{a.sq.pct?.toFixed(1) ?? "—"}</td>
                  <td className="px-3 py-2 text-amber-700">{topWeakness(a)}</td>
                  <td className="px-3 py-2">{a.recommendation.icon} {a.recommendation.label}</td>
                </tr>
              ))}
              {pipeline.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No priority athletes in current cohort.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel 2 — Physical Heatmap */}
      <div className="rounded-xl border bg-card p-5 space-y-3 overflow-hidden">
        <h2 className="text-sm font-bold">PHYSICAL PERFORMANCE HEATMAP</h2>
        <p className="text-xs text-muted-foreground">Percentile vs Indian Youth Norms. 🔴 Below P25 · 🟡 P25–P75 · 🟢 Above P75</p>
        <div className="overflow-x-auto">
          <table className="text-[10px] border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground sticky left-0 bg-card min-w-[110px]">Athlete</th>
                {METRICS.map((m) => (
                  <th key={m.key} className="px-1.5 py-1.5 font-semibold text-muted-foreground text-center min-w-[55px]">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatAthletes.map((a) => (
                <tr key={a.raw.id} className="border-t border-border/40">
                  <td className="px-2 py-1.5 font-medium sticky left-0 bg-card">{a.raw.name.split(" ")[0]}</td>
                  {METRICS.map((m) => {
                    const pctKey = METRIC_PCT_MAP[m.corrKey];
                    const pct = pctKey ? a.percentiles[pctKey] : undefined;
                    return (
                      <td key={m.key} className={`px-1 py-1.5 text-center font-mono rounded ${heatColour(pct)}`}>
                        {pct !== undefined ? Math.round(pct) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground">Values are percentile ranks. Reference: Indian youth badminton research + EUROFIT protocols. PGBA may update using academy-specific cohort data.</p>
      </div>

      {/* Panel 3 + 4 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 3 — RT Distribution */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-bold">REACTION TIME DISTRIBUTION</h2>
          <p className="text-xs text-muted-foreground">Cohort histogram with Indian youth P50 reference lines</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rtHistogram} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} label={{ value: "RT (ms)", position: "insideBottom", offset: -5, fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [v, "Athletes"]} />
              <Bar dataKey="count" fill={COURT_GREEN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <div>P50 Boys: <span className="font-mono font-semibold">156ms</span> · P50 Girls: <span className="font-mono font-semibold">144ms</span> · Elite threshold: <span className="font-mono font-semibold">130ms</span></div>
            <div className="italic">Source: TISTI Uttarakhand Badminton Research, 2025</div>
          </div>
        </div>

        {/* Panel 4 — Gopichand 5-Pillar */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-bold">GOPICHAND 5-PILLAR FRAMEWORK</h2>
          <p className="text-xs text-muted-foreground">Cohort average vs Champion Target (85) — aspirational benchmark</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={pillarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <Radar name="Cohort Avg" dataKey="cohort" stroke={COURT_GREEN} fill={COURT_GREEN} fillOpacity={0.3} />
              <Radar name="Champion Target (85)" dataKey="target" stroke={SHUTTLE_GOLD} fill="none" strokeDasharray="4 4" strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v}`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground">Champion Target = 85 on all axes — aspirational target, not a measured external norm. Pillars: Physical (BII) · Technical (stroke/smash/net/serve) · Mental · Discipline (coachability) · Tactical (court awareness)</p>
        </div>
      </div>

      {/* Panel 5 — Age Band Progression */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-bold">AGE BAND BII PROGRESSION</h2>
        <p className="text-xs text-muted-foreground">Median BII per age band — expected upward trend U10→U16. Flat or declining trend may indicate training or selection pipeline gaps.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ageBandTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="band" tick={{ fontSize: 11 }} />
            <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`${v?.toFixed(1)}`, ""]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Male" stroke={COURT_GREEN} strokeWidth={2} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="Female" stroke={SHUTTLE_GOLD} strokeWidth={2} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
