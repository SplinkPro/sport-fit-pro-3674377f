// ─── Badminton Dashboard — PGBA Demo Quality ────────────────────────────────
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete } from "../types";

const COURT_GREEN = "#1A5C38";
const SHUTTLE_GOLD = "#D4A017";
const ALERT_RED   = "#C0392B";
const RAW_BLUE    = "#1D4ED8";
const SKILL_GREEN = "#15803D";
const DEV_GREY    = "#6B7280";

const Q_COLOUR: Record<string, string> = {
  CHAMPION_PROFILE:   SHUTTLE_GOLD,
  RAW_PHYSICAL_TALENT: RAW_BLUE,
  SKILL_FIRST:        SKILL_GREEN,
  EARLY_DEVELOPMENT:  DEV_GREY,
};

const Q_LABEL: Record<string, string> = {
  CHAMPION_PROFILE:    "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST:         "Skill First",
  EARLY_DEVELOPMENT:   "Early Development",
};

// ─── Custom scatter dot with optional name label ─────────────────────────────
function AthleteLabel(props: {
  cx?: number; cy?: number; payload?: ProcessedBadmintonAthlete & { rank: number };
}) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const rank = payload.rank;
  const blocked = payload.isBlocked;
  const colour = blocked ? ALERT_RED : (payload.quadrant ? Q_COLOUR[payload.quadrant] : DEV_GREY);
  const showLabel = !blocked && rank <= 8;

  return (
    <g>
      <circle
        cx={cx} cy={cy} r={blocked ? 7 : 8}
        fill={colour} stroke="white" strokeWidth={2}
        opacity={blocked ? 0.7 : 0.92}
      />
      {blocked && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={7} fill="white" fontWeight="bold">⛔</text>
      )}
      {showLabel && (
        <text
          x={cx + 10} y={cy - 8}
          fontSize={9} fill={colour} fontWeight="600"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {payload.raw.name.split(" ")[0]}
        </text>
      )}
    </g>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function QuadrantTooltip({ active, payload }: { active?: boolean; payload?: { payload: ProcessedBadmintonAthlete }[] }) {
  if (!active || !payload?.length) return null;
  const a = payload[0].payload;
  return (
    <div className="text-xs rounded-xl border shadow-xl p-3 bg-background min-w-[190px] space-y-1">
      <div className="font-bold text-sm flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ background: a.isBlocked ? ALERT_RED : (a.quadrant ? Q_COLOUR[a.quadrant] : DEV_GREY) }} />
        {a.raw.name}
      </div>
      <div className="text-muted-foreground">{a.age_band} · {a.raw.gender} · {a.raw.academy_batch}</div>
      {a.isBlocked ? (
        <div className="text-red-600 font-bold py-1">⛔ Blocked — data error</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-3 pt-0.5">
            <div><span className="text-muted-foreground">BII</span> <span className="font-mono font-bold" style={{ color: COURT_GREEN }}>{a.bii.bii?.toFixed(1) ?? "—"}</span></div>
            <div><span className="text-muted-foreground">SQ</span> <span className="font-mono font-bold" style={{ color: SHUTTLE_GOLD }}>{a.sq.pct?.toFixed(1) ?? "—"}</span></div>
            {a.corrected.reaction_time_ms && (
              <div><span className="text-muted-foreground">RT</span> <span className="font-mono">{a.corrected.reaction_time_ms.toFixed(0)}ms</span></div>
            )}
            {a.secondary.agility && (
              <div><span className="text-muted-foreground">Agility</span> <span className="font-mono">{a.secondary.agility.toFixed(0)}th</span></div>
            )}
          </div>
          {a.quadrant && (
            <div className="font-semibold mt-1 pt-1 border-t border-border/60" style={{ color: Q_COLOUR[a.quadrant] }}>
              {Q_LABEL[a.quadrant]}
            </div>
          )}
          <div className="text-muted-foreground text-[11px]">{a.recommendation.icon} {a.recommendation.label}</div>
        </>
      )}
    </div>
  );
}

// ─── Prospect Card ────────────────────────────────────────────────────────────
function ProspectCard({ athlete, rank }: { athlete: ProcessedBadmintonAthlete; rank: number }) {
  const navigate = useNavigate();
  const medals = ["🥇", "🥈", "🥉"];
  const recC = { gold: SHUTTLE_GOLD, blue: RAW_BLUE, green: SKILL_GREEN, grey: DEV_GREY, amber: "#D97706" };
  return (
    <button
      onClick={() => navigate(`/sports/badminton/athlete/${athlete.raw.id}`)}
      className="w-full text-left p-3 rounded-xl border border-border hover:border-border/80 bg-background hover:bg-muted/40 transition-all group"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg leading-tight">{medals[rank - 1] ?? `#${rank}`}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate group-hover:underline">{athlete.raw.name}</div>
          <div className="text-[11px] text-muted-foreground">{athlete.age_band} · {athlete.raw.gender} · {athlete.raw.academy_batch}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold font-mono leading-tight" style={{ color: COURT_GREEN }}>
            {athlete.bii.bii?.toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground">BII</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: recC[athlete.recommendation.colour] }}>
          {athlete.recommendation.icon} {athlete.recommendation.label}
        </span>
        <span className="text-[10px] text-muted-foreground">SQ {athlete.sq.pct?.toFixed(0) ?? "—"}</span>
      </div>
    </button>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ athlete }: { athlete: ProcessedBadmintonAthlete }) {
  const navigate = useNavigate();
  const isBlocked = athlete.isBlocked;
  const isAuto = athlete.flags.some((f) => f.startsWith("AUTO_"));
  const isVerify = athlete.flags.some((f) => f.startsWith("VERIFY_"));
  const colour = isBlocked ? ALERT_RED : "#D97706";
  const icon = isBlocked ? "⛔" : isAuto ? "🟠" : "⚠";
  const reason = isBlocked
    ? "Blocked — data error requires correction"
    : isAuto
    ? "Auto-corrected — value converted, review"
    : "Flagged — verify before scoring";

  return (
    <button
      onClick={() => navigate(`/sports/badminton/athlete/${athlete.raw.id}`)}
      className="w-full text-left p-2.5 rounded-lg border hover:bg-muted/30 transition-colors"
      style={{ borderColor: `${colour}40`, background: `${colour}08` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: colour }}>{athlete.raw.name}</div>
          <div className="text-[10px] text-muted-foreground">{reason}</div>
        </div>
        <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 shrink-0">{athlete.age_band}</span>
      </div>
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BadmintonDashboard() {
  const navigate = useNavigate();
  const athletes = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);

  // Ranked list excludes blocked
  const scored = useMemo(() => athletes.filter((a) => !a.isBlocked && a.bii.bii !== undefined), [athletes]);
  const rankedWithIdx = useMemo(() => scored.map((a, i) => ({ ...a, rank: i + 1 })), [scored]);

  const stats = useMemo(() => ({
    total:     athletes.length,
    scored:    scored.length,
    champions: athletes.filter((a) => a.quadrant === "CHAMPION_PROFILE").length,
    rawTalent: athletes.filter((a) => a.quadrant === "RAW_PHYSICAL_TALENT").length,
    skillFirst: athletes.filter((a) => a.quadrant === "SKILL_FIRST").length,
    earlyDev:  athletes.filter((a) => a.quadrant === "EARLY_DEVELOPMENT").length,
    alerts:    athletes.filter((a) => a.isBlocked || a.flags.some((f) => f.startsWith("VERIFY_") || f.startsWith("AUTO_"))).length,
  }), [athletes, scored]);

  const top3 = scored.slice(0, 3);
  const alertAthletes = athletes.filter((a) => a.isBlocked || a.flags.length > 0).slice(0, 4);

  // Scatter data with rank
  const scatterData = useMemo(
    () => athletes.map((a, idx) => ({
      ...a,
      rank: scored.indexOf(a) + 1 || 99,
      x: a.bii.bii ?? 0,
      y: a.sq.pct ?? 0,
    })),
    [athletes, scored]
  );

  // BII distribution
  const barData = useMemo(() => {
    return (["U10", "U12", "U14", "U16"] as const).map((band) => {
      const inBand = scored.filter((a) => a.age_band === band);
      const m = inBand.filter((a) => a.raw.gender === "Male");
      const f = inBand.filter((a) => a.raw.gender === "Female");
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? Math.round(arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length * 10) / 10 : 0;
      return { band, Male: avg(m), Female: avg(f) };
    });
  }, [scored]);

  // 5-Pillar radar
  const pillarData = useMemo(() => {
    const avg = (vals: number[]) => vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return [
      { axis: "Physical",    cohort: Math.round(avg(scored.map((a) => a.bii.bii ?? 0))), target: 85 },
      { axis: "Technical",   cohort: Math.round(avg(scored.map((a) => {
        const r = a.raw;
        const v = [r.stroke_mechanics, r.smash_quality, r.net_play, r.serve_accuracy].filter(Boolean) as number[];
        return v.length ? avg(v) * 10 : 0;
      }))), target: 85 },
      { axis: "Mental",       cohort: Math.round(avg(scored.map((a) => (a.raw.mental_resilience ?? 0) * 10))), target: 85 },
      { axis: "Discipline",   cohort: Math.round(avg(scored.map((a) => (a.raw.coachability ?? 0) * 10))), target: 85 },
      { axis: "Tactical",     cohort: Math.round(avg(scored.map((a) => (a.raw.court_awareness ?? 0) * 10))), target: 85 },
    ];
  }, [scored]);

  return (
    <div className="min-h-screen bg-background">

      {/* ─── Hero Header ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${COURT_GREEN} 0%, #0d3d25 100%)` }}
        className="px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🏸</span>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-tight">
                  BADMINTON INTELLIGENCE PLATFORM
                </h1>
                <p className="text-sm opacity-80 font-medium">
                  Gopichand Academy Methodology · PGBA Hyderabad · Cohort Analysis
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { label: "Total Athletes", value: stats.total },
                { label: "Scored", value: stats.scored },
                { label: "Age Bands", value: "U10–U16" },
              ].map(({ label, value }) => (
                <div key={label} className="text-xs opacity-70">
                  <span className="font-bold text-white">{value}</span>
                  <span className="ml-1 opacity-80">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs font-black px-2 py-1 rounded border"
              style={{ color: SHUTTLE_GOLD, borderColor: SHUTTLE_GOLD }}>BETA</span>
            <button
              onClick={() => navigate("/sports/badminton/explorer")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 transition-colors"
            >
              View All Athletes →
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ─── KPI Strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Champion Profiles",
              value: stats.champions,
              sub: "BII ≥ 60 · SQ ≥ 60",
              accent: SHUTTLE_GOLD,
              bg: `${SHUTTLE_GOLD}12`,
              icon: "🏆",
            },
            {
              label: "Raw Physical Talents",
              value: stats.rawTalent,
              sub: "High BII · Technical training needed",
              accent: RAW_BLUE,
              bg: "#1D4ED812",
              icon: "💪",
            },
            {
              label: "Skill First",
              value: stats.skillFirst,
              sub: "High SQ · Physical conditioning needed",
              accent: SKILL_GREEN,
              bg: "#15803D12",
              icon: "🎯",
            },
            {
              label: "Action Required",
              value: stats.alerts,
              sub: "Flagged · Blocked · Verify",
              accent: ALERT_RED,
              bg: `${ALERT_RED}12`,
              icon: "⚠️",
            },
          ].map(({ label, value, sub, accent, bg, icon }) => (
            <div key={label} className="rounded-xl border p-4" style={{ borderColor: `${accent}30`, background: bg }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
              </div>
              <div className="text-4xl font-black font-mono" style={{ color: accent }}>{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* ─── Main two-column: Quadrant + Right Panel ──────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

          {/* Talent Quadrant */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-black text-base tracking-tight">TALENT QUADRANT</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  X: BII Physical Potential · Y: SQ Skill Quotient · Midpoint 60/60 · Hover for details · Click to open profile
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
              {Object.entries(Q_LABEL).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: Q_COLOUR[k] }} />
                  <span className="font-medium">{v}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    ({athletes.filter((a) => a.quadrant === k).length})
                  </span>
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ALERT_RED, opacity: 0.7 }} />
                <span className="font-medium text-red-600">⛔ Blocked</span>
              </span>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 15, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

                {/* Quadrant shading */}
                <defs>
                  <pattern id="gold-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <rect width="3" height="6" fill={`${SHUTTLE_GOLD}08`} />
                  </pattern>
                  <pattern id="blue-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <rect width="3" height="6" fill={`${RAW_BLUE}08`} />
                  </pattern>
                </defs>

                <XAxis type="number" dataKey="x" domain={[0, 100]} name="BII"
                  tick={{ fontSize: 11 }}
                  label={{ value: "BII — Physical Potential Index", position: "insideBottom", offset: -18, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis type="number" dataKey="y" domain={[0, 100]} name="SQ"
                  tick={{ fontSize: 11 }}
                  label={{ value: "SQ — Skill Quotient", angle: -90, position: "insideLeft", offset: 15, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />

                {/* Quadrant labels in background */}
                <ReferenceLine x={60} stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5}
                  label={{ value: "← Dev  |  Talent →", position: "top", fontSize: 9, fill: "#9CA3AF" }} />
                <ReferenceLine y={60} stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5}
                  label={{ value: "← Physical  |  Champion →", position: "right", fontSize: 9, fill: "#9CA3AF", angle: -90 }} />

                <RTooltip content={<QuadrantTooltip />} cursor={false} />
                <Scatter
                  data={scatterData}
                  shape={(props: { cx?: number; cy?: number; payload?: ProcessedBadmintonAthlete & { rank: number } }) =>
                    <AthleteLabel {...props} />}
                  onClick={(data: ProcessedBadmintonAthlete) => navigate(`/sports/badminton/athlete/${data.raw.id}`)}
                  style={{ cursor: "pointer" }}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-1">
              BII weights: Specialized Physical Fitness (65.1%) + Basic Physical Fitness (27.2%) + Body Morphology (7.7%) · Source: PMC 2024 AHP Study
            </p>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">

            {/* Top 3 Prospects */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-sm tracking-tight">TOP PROSPECTS</h2>
                <button onClick={() => navigate("/sports/badminton/explorer")}
                  className="text-[10px] text-muted-foreground hover:underline">View all →</button>
              </div>
              <div className="space-y-2">
                {top3.map((a, i) => (
                  <ProspectCard key={a.raw.id} athlete={a} rank={i + 1} />
                ))}
              </div>
            </div>

            {/* Raw Physical Talents */}
            {stats.rawTalent > 0 && (
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: `${RAW_BLUE}30`, background: `${RAW_BLUE}06` }}>
                <h2 className="font-black text-sm tracking-tight" style={{ color: RAW_BLUE }}>
                  💪 RAW PHYSICAL TALENTS
                </h2>
                <p className="text-[10px] text-muted-foreground">Exceptional athletic base — fast-track technical coaching recommended</p>
                <div className="space-y-2">
                  {athletes.filter((a) => a.quadrant === "RAW_PHYSICAL_TALENT").map((a) => (
                    <button key={a.raw.id} onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}
                      className="w-full text-left p-2.5 rounded-lg bg-background border border-border/60 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold">{a.raw.name}</div>
                          <div className="text-[10px] text-muted-foreground">{a.age_band} · {a.raw.years_playing_badminton}y playing</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono" style={{ color: RAW_BLUE }}>{a.bii.bii?.toFixed(1)}</div>
                          <div className="text-[10px] text-muted-foreground">BII</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {alertAthletes.length > 0 && (
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: `${ALERT_RED}30`, background: `${ALERT_RED}06` }}>
                <h2 className="font-black text-sm tracking-tight" style={{ color: ALERT_RED }}>
                  ACTION REQUIRED
                </h2>
                <div className="space-y-2">
                  {alertAthletes.map((a) => <AlertCard key={a.raw.id} athlete={a} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Secondary Analytics Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* BII distribution */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-0.5">PHYSICAL POTENTIAL BY AGE BAND</h2>
            <p className="text-xs text-muted-foreground mb-3">Average BII score — Male vs Female</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RTooltip formatter={(v: number) => [`${v.toFixed(1)}`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Male" fill={COURT_GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill={SHUTTLE_GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gopichand 5-Pillar */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-black text-sm mb-0.5">GOPICHAND 5-PILLAR FRAMEWORK</h2>
            <p className="text-xs text-muted-foreground mb-1">
              Cohort average vs Champion Target (85) — aspirational benchmark
            </p>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={pillarData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <Radar name="Cohort Avg" dataKey="cohort" stroke={COURT_GREEN} fill={COURT_GREEN} fillOpacity={0.3} />
                <Radar name="Champion Target (85)" dataKey="target" stroke={SHUTTLE_GOLD}
                  fill="none" strokeDasharray="4 4" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <RTooltip formatter={(v: number) => [`${v}`, ""]} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground">
              Champion Target = 85 is an aspirational internal benchmark, not an external published norm.
            </p>
          </div>
        </div>

        {/* ─── Phase 2 footer ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-dashed border-border p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phase 2 Pipeline</span>
            {["Video Analysis", "Match Statistics", "Injury Tracking", "Training Programme Generator", "Tournament Results", "Multi-Academy Comparison"].map((f) => (
              <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-[10px]">○</span>{f}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
