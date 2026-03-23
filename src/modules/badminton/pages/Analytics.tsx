// ─── Badminton Cohort Analytics ───────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
  ReferenceArea, Cell, ReferenceLine,
} from "recharts";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete } from "../types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const G  = "#1A5C38";
const Au = "#D4A017";
const R  = "#C0392B";
const B  = "#1D4ED8";
const Sk = "#15803D";
const Gr = "#6B7280";

const Q_COLOUR: Record<string, string> = {
  CHAMPION_PROFILE:    Au,
  RAW_PHYSICAL_TALENT: B,
  SKILL_FIRST:         Sk,
  EARLY_DEVELOPMENT:   Gr,
};

type PanelKey = "pipeline" | "heatmap" | "rt" | "pillar" | "trend";

const PANEL_TABS: { key: PanelKey; label: string; icon: string }[] = [
  { key: "pipeline", label: "Talent Pipeline",    icon: "🏅" },
  { key: "heatmap",  label: "Physical Heatmap",   icon: "🔥" },
  { key: "rt",       label: "Reaction Time",      icon: "⚡" },
  { key: "pillar",   label: "5-Pillar Framework", icon: "🧭" },
  { key: "trend",    label: "Age Progression",    icon: "📈" },
];

type PctKey = keyof NonNullable<ProcessedBadmintonAthlete["percentiles"]>;

const METRICS: { key: PctKey; label: string }[] = [
  { key: "reaction",          label: "RT" },
  { key: "four_corner",       label: "4-Cor" },
  { key: "ten_by_five",       label: "10×5m" },
  { key: "vertical_jump",     label: "V.Jump" },
  { key: "broad_jump",        label: "BdJump" },
  { key: "beep_test",         label: "Beep" },
  { key: "grip",              label: "Grip" },
  { key: "shuttlecock_throw", label: "Throw" },
  { key: "situps",            label: "Situps" },
  { key: "pushups",           label: "Pushups" },
  { key: "sit_reach",         label: "FlexSR" },
];

function heatCls(pct?: number): string {
  if (pct === undefined) return "bg-muted text-muted-foreground";
  if (pct < 25)  return "bg-red-100 text-red-700 font-bold";
  if (pct < 75)  return "bg-yellow-50 text-yellow-800";
  return "bg-green-100 text-green-700 font-bold";
}

function topWeakness(a: ProcessedBadmintonAthlete): string {
  const entries = [
    ["Agility", a.secondary.agility], ["Strength", a.secondary.strength],
    ["Endurance", a.secondary.endurance], ["Flexibility", a.secondary.flexibility], ["Reaction", a.secondary.speed],
  ] as [string, number | undefined][];
  const def = entries.filter(([, v]) => v !== undefined) as [string, number][];
  return def.length ? def.sort((x, y) => x[1] - y[1])[0][0] : "—";
}

function buildHistogram(vals: number[], bins = 10): { bin: string; count: number; midVal: number }[] {
  if (!vals.length) return [];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const w = (hi - lo) / bins || 5;
  return Array.from({ length: bins }, (_, i) => {
    const lo2 = lo + i * w, hi2 = lo + (i + 1) * w;
    return {
      bin: `${Math.round(lo2)}`,
      midVal: (lo2 + hi2) / 2,
      count: vals.filter((v) => v >= lo2 && (i === bins - 1 ? v <= hi2 : v < hi2)).length,
    };
  });
}

export default function BadmintonAnalytics() {
  const navigate  = useNavigate();
  const athletes  = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);
  const valid     = useMemo(() => athletes.filter((a) => !a.isBlocked && a.bii.bii !== undefined), [athletes]);
  const [panel, setPanel] = useState<PanelKey>("pipeline");

  // Pipeline
  const pipeline = useMemo(() =>
    valid.filter((a) => a.quadrant === "CHAMPION_PROFILE" || a.quadrant === "RAW_PHYSICAL_TALENT")
         .sort((a, b) => (b.bii.bii ?? 0) - (a.bii.bii ?? 0)),
    [valid]
  );

  // RT histogram
  const rtVals = useMemo(() =>
    valid.map((a) => a.corrected.reaction_time_ms).filter((v) => v !== undefined) as number[],
    [valid]
  );
  const rtHist = useMemo(() => buildHistogram(rtVals), [rtVals]);

  // 5-Pillar
  const pillarData = useMemo(() => {
    const avg = (arr: number[]) => arr.length ? +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(0) : 0;
    return [
      { axis: "Physical",   cohort: avg(valid.map((a) => a.bii.bii ?? 0)), target: 85 },
      { axis: "Technical",  cohort: avg(valid.map((a) => {
        const r = a.raw;
        const v = [r.stroke_mechanics, r.smash_quality, r.net_play, r.serve_accuracy].filter(Boolean) as number[];
        return v.length ? (v.reduce((s, x) => s + x, 0) / v.length) * 10 : 0;
      })), target: 85 },
      { axis: "Mental",     cohort: avg(valid.map((a) => (a.raw.mental_resilience ?? 0) * 10)), target: 85 },
      { axis: "Discipline", cohort: avg(valid.map((a) => (a.raw.coachability ?? 0) * 10)),      target: 85 },
      { axis: "Tactical",   cohort: avg(valid.map((a) => (a.raw.court_awareness ?? 0) * 10)),   target: 85 },
    ];
  }, [valid]);

  // Age progression
  const ageTrend = useMemo(() =>
    (["U10", "U12", "U14", "U16"] as const).map((band) => {
      const inBand = valid.filter((a) => a.age_band === band);
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? +(arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length).toFixed(1) : null;
      return { band, Male: avg(inBand.filter((a) => a.raw.gender === "Male")), Female: avg(inBand.filter((a) => a.raw.gender === "Female")) };
    }), [valid]);

  // Cohort stats for summary strip
  const cohortStats = useMemo(() => {
    const avgBII = valid.length ? (valid.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / valid.length) : 0;
    const avgSQ  = valid.length ? (valid.reduce((s, a) => s + (a.sq.pct ?? 0), 0) / valid.length) : 0;
    const avgRT  = rtVals.length ? (rtVals.reduce((s, v) => s + v, 0) / rtVals.length) : 0;
    const eliteRT = rtVals.filter((v) => v < 130).length;
    return { avgBII: avgBII.toFixed(1), avgSQ: avgSQ.toFixed(1), avgRT: avgRT.toFixed(0), eliteRT };
  }, [valid, rtVals]);

  return (
    <div className="p-5 space-y-5">

      {/* ─── Cohort Summary Strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cohort Avg BII", value: cohortStats.avgBII, accent: G,  icon: "💪" },
          { label: "Cohort Avg SQ",  value: cohortStats.avgSQ,  accent: Au, icon: "🎯" },
          { label: "Avg Reaction",   value: `${cohortStats.avgRT}ms`, accent: B, icon: "⚡" },
          { label: "Elite RT (<130ms)", value: cohortStats.eliteRT, accent: Sk, icon: "🏆" },
        ].map(({ label, value, accent, icon }) => (
          <div key={label} className="rounded-xl border p-3" style={{ borderColor: `${accent}25`, background: `${accent}09` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{icon}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ─── Panel Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {PANEL_TABS.map((t) => (
          <button key={t.key} onClick={() => setPanel(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px",
              panel === t.key
                ? "text-foreground border-b-2"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            style={{ borderBottomColor: panel === t.key ? G : undefined }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Panel: Talent Pipeline ────────────────────────────────────── */}
      {panel === "pipeline" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-black text-sm">TALENT PIPELINE — PRIORITY ATHLETES</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Champion Profiles + Raw Physical Talents sorted by BII · {pipeline.length} athletes · Click row to open profile
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {["Rank", "Name", "Band", "BII", "SQ", "Quadrant", "Top Weakness", "Recommendation"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipeline.map((a, i) => {
                  const qc = a.quadrant ? Q_COLOUR[a.quadrant] : Gr;
                  return (
                    <tr key={a.raw.id}
                      className="border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}>
                      <td className="px-4 py-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: i === 0 ? Au : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : "hsl(var(--muted))",
                                   color: i < 3 ? "white" : "hsl(var(--muted-foreground))" }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{a.raw.name}</div>
                        <div className="text-[10px] text-muted-foreground">{a.raw.academy_batch}</div>
                      </td>
                      <td className="px-4 py-3"><span className="bg-muted text-xs rounded-full px-2 py-0.5">{a.age_band}</span></td>
                      <td className="px-4 py-3">
                        <div className="font-black font-mono" style={{ color: G }}>{a.bii.bii?.toFixed(1)}</div>
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden mt-1">
                          <div className="h-full rounded-full" style={{ width: `${a.bii.bii ?? 0}%`, background: G }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: Au }}>{a.sq.pct?.toFixed(1) ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: qc, background: `${qc}15`, border: `1px solid ${qc}30` }}>
                          {a.quadrant === "CHAMPION_PROFILE" ? "Champion" : "Raw Talent"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-700 text-xs font-medium">{topWeakness(a)}</td>
                      <td className="px-4 py-3 text-xs">{a.recommendation.icon} {a.recommendation.label}</td>
                    </tr>
                  );
                })}
                {pipeline.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No priority athletes in current cohort.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-muted/20 border-t border-border text-[10px] text-muted-foreground">
            Source: Talent Quadrant · BII/SQ ≥ 60 threshold per PGBA methodology
          </div>
        </div>
      )}

      {/* ─── Panel: Physical Heatmap ───────────────────────────────────── */}
      {panel === "heatmap" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-black text-sm">PHYSICAL PERFORMANCE HEATMAP</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Percentile vs Indian Youth Norms · 🔴 P&lt;25 · 🟡 P25–P75 · 🟢 P&gt;75</p>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="text-[10px] border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card text-left px-2 py-2 font-semibold text-muted-foreground z-10 min-w-[110px]">Athlete</th>
                  <th className="text-center px-1 py-2 font-semibold text-muted-foreground min-w-[45px]">Band</th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="text-center px-1 py-2 font-semibold text-muted-foreground min-w-[48px]">{m.label}</th>
                  ))}
                  <th className="text-right px-2 py-2 font-semibold text-muted-foreground min-w-[50px]">BII</th>
                </tr>
              </thead>
              <tbody>
                {valid.map((a) => (
                  <tr key={a.raw.id}
                    className="border-t border-border/40 cursor-pointer hover:bg-muted/20"
                    onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}>
                    <td className="sticky left-0 bg-card px-2 py-1.5 font-semibold z-10">{a.raw.name.split(" ")[0]}</td>
                    <td className="text-center px-1 py-1.5 text-muted-foreground">{a.age_band}</td>
                    {METRICS.map((m) => {
                      const pct = a.percentiles[m.key];
                      return (
                        <td key={m.key} className={cn("text-center px-1 py-1.5 font-mono rounded", heatCls(pct))}>
                          {pct !== undefined ? Math.round(pct) : "—"}
                        </td>
                      );
                    })}
                    <td className="text-right px-2 py-1.5 font-mono font-black" style={{ color: G }}>
                      {a.bii.bii?.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-3 text-[10px] text-muted-foreground">
            Values are percentile ranks (0–100). Reference: Indian youth badminton research + EUROFIT protocols. PGBA may update using academy-specific cohort data.
          </div>
        </div>
      )}

      {/* ─── Panel: Reaction Time ─────────────────────────────────────── */}
      {panel === "rt" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-0.5">REACTION TIME DISTRIBUTION</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Cohort histogram with reference lines · {rtVals.length} athletes with RT data
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rtHist} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="bin" tick={{ fontSize: 10 }}
                  label={{ value: "Reaction Time (ms)", position: "insideBottom", offset: -18, fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }}
                  label={{ value: "Athletes", angle: -90, position: "insideLeft", dx: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => [v, "Athletes"]} labelFormatter={(l) => `~${l}ms`} />
                <ReferenceLine x="130" stroke={G} strokeDasharray="5 4" strokeWidth={2}
                  label={{ value: "Elite ≤130ms", position: "top", fill: G, fontSize: 9 }} />
                <ReferenceLine x="156" stroke={Au} strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: "P50 Boys", position: "top", fill: Au, fontSize: 9 }} />
                <ReferenceLine x="144" stroke={B} strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: "P50 Girls", position: "top", fill: B, fontSize: 9 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {rtHist.map((entry, i) => (
                    <Cell key={i} fill={entry.midVal < 130 ? G : entry.midVal < 170 ? Au : entry.midVal < 220 ? "#E67E22" : R} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: G }} />Elite (&lt;130ms)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: Au }} />Competitive (130–170ms)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: "#E67E22" }} />Developing (170–220ms)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: R }} />Needs Focus (&gt;220ms)</span>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
              P50 Boys: <strong>156ms</strong> · P50 Girls: <strong>144ms</strong> · Elite threshold: <strong>130ms</strong>
              · <em>Source: TISTI Uttarakhand Badminton Research, 2025</em>
            </div>
          </div>

          {/* RT leaderboard */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-3">FASTEST REACTION TIMES</h2>
            <div className="space-y-2">
              {[...valid]
                .filter((a) => a.corrected.reaction_time_ms !== undefined)
                .sort((a, b) => (a.corrected.reaction_time_ms ?? 9999) - (b.corrected.reaction_time_ms ?? 9999))
                .slice(0, 8)
                .map((a, i) => {
                  const rt = a.corrected.reaction_time_ms!;
                  const colour = rt < 130 ? G : rt < 170 ? Au : rt < 220 ? "#E67E22" : R;
                  return (
                    <button key={a.raw.id} onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{a.raw.name}</div>
                        <div className="text-[10px] text-muted-foreground">{a.age_band} · {a.raw.gender}</div>
                      </div>
                      <span className="font-black font-mono text-sm" style={{ color: colour }}>{rt.toFixed(0)}ms</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: colour, background: `${colour}15` }}>
                        {rt < 130 ? "Elite" : rt < 170 ? "Competitive" : rt < 220 ? "Developing" : "Needs Focus"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Panel: 5-Pillar ──────────────────────────────────────────── */}
      {panel === "pillar" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-0.5">GOPICHAND 5-PILLAR FRAMEWORK</h2>
            <p className="text-xs text-muted-foreground mb-1">Cohort average vs Champion Target (85) — aspirational benchmark</p>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={pillarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Radar name="Cohort Average" dataKey="cohort" stroke={G} fill={G} fillOpacity={0.3} strokeWidth={2.5} />
                <Radar name="Champion Target (85)" dataKey="target" stroke={Au} fill="none" strokeDasharray="5 4" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}`, ""]} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground">
              Champion Target = 85 on all axes — aspirational internal benchmark, not an external published norm.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-black text-sm">PILLAR SCORES</h2>
            <p className="text-xs text-muted-foreground">Cohort averages per pillar</p>
            <div className="space-y-3">
              {pillarData.map(({ axis, cohort }) => {
                const gap = 85 - cohort;
                const colour = cohort >= 75 ? G : cohort >= 60 ? Au : R;
                return (
                  <div key={axis} className="p-3 rounded-xl bg-muted/20">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold">{axis}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-[10px]">Gap to target: {gap.toFixed(0)}</span>
                        <span className="font-black font-mono" style={{ color: colour }}>{cohort}</span>
                      </div>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cohort}%`, background: colour }} />
                      {/* Target marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 rounded" style={{ left: "85%", background: Au }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>0</span><span>Target (85)</span><span>100</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border pt-3">
              Physical = BII · Technical = stroke/smash/net/serve mean × 10 · Mental = mental_resilience × 10 · Discipline = coachability × 10 · Tactical = court_awareness × 10
            </div>
          </div>
        </div>
      )}

      {/* ─── Panel: Age Progression ───────────────────────────────────── */}
      {panel === "trend" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-0.5">BII PROGRESSION U10 → U16</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Average BII by age band — expected upward trend. Flat or declining trend may indicate training or selection pipeline gaps.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ageTrend} margin={{ top: 10, right: 25, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="band" tick={{ fontSize: 11 }}
                  label={{ value: "Age Band", position: "insideBottom", offset: -18, fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[20, 100]} tick={{ fontSize: 11 }}
                  label={{ value: "Avg BII", angle: -90, position: "insideLeft", dx: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => [v?.toFixed(1), ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={60} stroke="#9CA3AF" strokeDasharray="5 4" strokeWidth={1}
                  label={{ value: "Midpoint (60)", position: "right", fontSize: 9, fill: "#9CA3AF" }} />
                <Line type="monotone" dataKey="Male" stroke={G} strokeWidth={3} dot={{ r: 5, fill: G, stroke: "white", strokeWidth: 2 }} connectNulls />
                <Line type="monotone" dataKey="Female" stroke={Au} strokeWidth={3} dot={{ r: 5, fill: Au, stroke: "white", strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-band breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ageTrend.map(({ band, Male, Female }) => (
              <div key={band} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="font-black text-base" style={{ color: G }}>{band}</div>
                {[{ label: "Male", value: Male, colour: G }, { label: "Female", value: Female, colour: Au }].map(({ label, value, colour }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-bold" style={{ color: value ? colour : Gr }}>{value ?? "—"}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: colour }} />
                    </div>
                  </div>
                ))}
                <div className="text-[9px] text-muted-foreground">
                  {valid.filter((a) => a.age_band === band).length} athletes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
