// ─── Badminton Dashboard ─────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Cell, LineChart, Line,
} from "recharts";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete } from "../types";
import { cn } from "@/lib/utils";

// ─── Design tokens aligned with PGBA identity ────────────────────────────────
const G = "#1A5C38";   // court green
const Au = "#D4A017";  // shuttlecock gold
const R  = "#C0392B";  // alert red
const B  = "#1D4ED8";  // raw talent blue
const Gr = "#6B7280";  // dev grey
const Sk = "#15803D";  // skill first green

const Q_COLOUR: Record<string, string> = {
  CHAMPION_PROFILE:    Au,
  RAW_PHYSICAL_TALENT: B,
  SKILL_FIRST:         Sk,
  EARLY_DEVELOPMENT:   Gr,
};
const Q_LABEL: Record<string, string> = {
  CHAMPION_PROFILE:    "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST:         "Skill First",
  EARLY_DEVELOPMENT:   "Early Development",
};
const Q_DESC: Record<string, string> = {
  CHAMPION_PROFILE:    "BII ≥ 60 · SQ ≥ 60",
  RAW_PHYSICAL_TALENT: "BII ≥ 60 · SQ < 60",
  SKILL_FIRST:         "BII < 60 · SQ ≥ 60",
  EARLY_DEVELOPMENT:   "BII < 60 · SQ < 60",
};

// ─── Custom scatter dot ───────────────────────────────────────────────────────
function AthleteNode(props: { cx?: number; cy?: number; payload?: ProcessedBadmintonAthlete & { rank: number } }) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const blocked = payload.isBlocked;
  const colour = blocked ? R : (payload.quadrant ? Q_COLOUR[payload.quadrant] : Gr);
  const isTop = !blocked && payload.rank <= 5;
  const r = blocked ? 6 : isTop ? 9 : 7;

  return (
    <g>
      {/* Glow ring for top athletes */}
      {isTop && (
        <circle cx={cx} cy={cy} r={r + 5} fill={colour} opacity={0.15} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={colour} stroke="white" strokeWidth={1.5} opacity={blocked ? 0.6 : 1} />
      {blocked && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="white" fontWeight="bold">✕</text>
      )}
      {isTop && (
        <>
          <text
            x={cx} y={cy - r - 7}
            textAnchor="middle" fontSize={9} fill={colour} fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {payload.raw.name.split(" ")[0]}
          </text>
          <text
            x={cx} y={cy - r - 18}
            textAnchor="middle" fontSize={8} fill={colour} opacity={0.8}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            #{payload.rank}
          </text>
        </>
      )}
    </g>
  );
}

// ─── Rich tooltip ─────────────────────────────────────────────────────────────
function QuadTooltip({ active, payload }: { active?: boolean; payload?: { payload: ProcessedBadmintonAthlete & { rank: number } }[] }) {
  if (!active || !payload?.length) return null;
  const a = payload[0].payload;
  const colour = a.isBlocked ? R : (a.quadrant ? Q_COLOUR[a.quadrant] : Gr);
  return (
    <div className="rounded-xl border shadow-2xl bg-card p-4 min-w-[210px] space-y-2 text-xs">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="w-3 h-3 rounded-full" style={{ background: colour }} />
        <span className="font-bold text-sm">{a.raw.name}</span>
        {!a.isBlocked && a.rank && (
          <span className="ml-auto font-mono text-muted-foreground">#{a.rank}</span>
        )}
      </div>
      <div className="text-muted-foreground">{a.age_band} · {a.raw.gender} · {a.raw.academy_batch}</div>
      {a.isBlocked ? (
        <div className="font-bold text-red-600 bg-red-50 rounded p-1.5">⛔ Blocked — data error</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="font-medium text-muted-foreground">BII</div>
          <div className="font-bold font-mono" style={{ color: G }}>{a.bii.bii?.toFixed(1) ?? "—"}</div>
          <div className="font-medium text-muted-foreground">SQ</div>
          <div className="font-bold font-mono" style={{ color: Au }}>{a.sq.pct?.toFixed(1) ?? "—"}</div>
          {a.corrected.reaction_time_ms && (
            <>
              <div className="font-medium text-muted-foreground">RT</div>
              <div className="font-mono">{a.corrected.reaction_time_ms.toFixed(0)}ms</div>
            </>
          )}
          {a.secondary.agility !== undefined && (
            <>
              <div className="font-medium text-muted-foreground">Agility Pct.</div>
              <div className="font-mono">{a.secondary.agility.toFixed(0)}th</div>
            </>
          )}
        </div>
      )}
      {a.quadrant && (
        <div className="font-semibold border-t border-border pt-1.5" style={{ color: colour }}>
          {Q_LABEL[a.quadrant]}
        </div>
      )}
      {!a.isBlocked && (
        <div className="text-[10px] text-muted-foreground italic">{a.recommendation.icon} {a.recommendation.label}</div>
      )}
    </div>
  );
}

// ─── Metric mini bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max = 100, colour }: { value: number; max?: number; colour: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: colour }} />
    </div>
  );
}

// ─── Top Prospect Card ────────────────────────────────────────────────────────
function ProspectCard({ athlete, rank }: { athlete: ProcessedBadmintonAthlete; rank: number }) {
  const navigate = useNavigate();
  const medals = ["🥇", "🥈", "🥉"];
  const bii = athlete.bii.bii ?? 0;
  const sq = athlete.sq.pct ?? 0;
  const colour = athlete.quadrant ? Q_COLOUR[athlete.quadrant] : Gr;

  return (
    <button
      onClick={() => navigate(`/sports/badminton/athlete/${athlete.raw.id}`)}
      className="w-full text-left p-3 rounded-xl border bg-card hover:shadow-md transition-all group"
      style={{ borderLeftColor: colour, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-tight flex-shrink-0">{medals[rank - 1] ?? `#${rank}`}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate group-hover:underline">{athlete.raw.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{athlete.age_band} · {athlete.raw.gender} · {athlete.raw.years_playing_badminton}yr</div>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground">BII</span>
            <span className="font-bold font-mono" style={{ color: G }}>{bii.toFixed(1)}</span>
          </div>
          <MiniBar value={bii} colour={G} />
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground">SQ</span>
            <span className="font-bold font-mono" style={{ color: Au }}>{sq.toFixed(0)}</span>
          </div>
          <MiniBar value={sq} colour={Au} />
        </div>
      </div>
      <div className="mt-1.5 text-[10px] font-semibold" style={{ color: colour }}>
        {athlete.recommendation.icon} {athlete.recommendation.label}
      </div>
    </button>
  );
}

export default function BadmintonDashboard() {
  const navigate = useNavigate();
  const athletes = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);
  const scored   = useMemo(() => athletes.filter((a) => !a.isBlocked && a.bii.bii !== undefined), [athletes]);
  const ranked   = useMemo(() => scored.map((a, i) => ({ ...a, rank: i + 1 })), [scored]);

  const stats = useMemo(() => ({
    total:     athletes.length,
    champions: athletes.filter((a) => a.quadrant === "CHAMPION_PROFILE").length,
    raw:       athletes.filter((a) => a.quadrant === "RAW_PHYSICAL_TALENT").length,
    skill:     athletes.filter((a) => a.quadrant === "SKILL_FIRST").length,
    dev:       athletes.filter((a) => a.quadrant === "EARLY_DEVELOPMENT").length,
    alerts:    athletes.filter((a) => a.isBlocked || a.flags.length > 0).length,
    blocked:   athletes.filter((a) => a.isBlocked).length,
  }), [athletes]);

  const top3    = scored.slice(0, 3);
  const rawList = athletes.filter((a) => a.quadrant === "RAW_PHYSICAL_TALENT");

  // Scatter
  const scatterData = useMemo(
    () => athletes.map((a) => ({
      ...a, rank: scored.indexOf(a) + 1 || 99, x: a.bii.bii ?? 0, y: a.sq.pct ?? 0,
    })),
    [athletes, scored]
  );

  // BII bar by age band
  const barData = useMemo(() =>
    (["U10", "U12", "U14", "U16"] as const).map((band) => {
      const inBand = scored.filter((a) => a.age_band === band);
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? +(arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length).toFixed(1) : 0;
      return { band, "Male BII": avg(inBand.filter((a) => a.raw.gender === "Male")), "Female BII": avg(inBand.filter((a) => a.raw.gender === "Female")) };
    }), [scored]);

  // Age progression line
  const progressData = useMemo(() =>
    (["U10", "U12", "U14", "U16"] as const).map((band) => {
      const inBand = scored.filter((a) => a.age_band === band);
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? +(arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length).toFixed(1) : null;
      return {
        band,
        Male:   avg(inBand.filter((a) => a.raw.gender === "Male")),
        Female: avg(inBand.filter((a) => a.raw.gender === "Female")),
      };
    }), [scored]);

  // 5-Pillar
  const pillarData = useMemo(() => {
    const avg = (vals: number[]) => vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(0) : 0;
    return [
      { axis: "Physical",  cohort: avg(scored.map((a) => a.bii.bii ?? 0)), target: 85 },
      { axis: "Technical", cohort: avg(scored.map((a) => {
        const r = a.raw;
        const v = [r.stroke_mechanics, r.smash_quality, r.net_play, r.serve_accuracy].filter(Boolean) as number[];
        return v.length ? (v.reduce((s, x) => s + x, 0) / v.length) * 10 : 0;
      })), target: 85 },
      { axis: "Mental",      cohort: avg(scored.map((a) => (a.raw.mental_resilience ?? 0) * 10)), target: 85 },
      { axis: "Discipline",  cohort: avg(scored.map((a) => (a.raw.coachability ?? 0) * 10)), target: 85 },
      { axis: "Tactical",    cohort: avg(scored.map((a) => (a.raw.court_awareness ?? 0) * 10)), target: 85 },
    ];
  }, [scored]);

  return (
    <div className="p-5 space-y-5">

      {/* ─── KPI Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Assessed",   value: stats.total,    accent: G,  icon: "👤", sub: "all cohorts" },
          { label: "Champion Profile", value: stats.champions, accent: Au, icon: "🏆", sub: Q_DESC.CHAMPION_PROFILE },
          { label: "Raw Talent",       value: stats.raw,      accent: B,  icon: "💪", sub: Q_DESC.RAW_PHYSICAL_TALENT },
          { label: "Skill First",      value: stats.skill,    accent: Sk, icon: "🎯", sub: Q_DESC.SKILL_FIRST },
          { label: "Early Dev",        value: stats.dev,      accent: Gr, icon: "📈", sub: Q_DESC.EARLY_DEVELOPMENT },
          { label: "Action Required",  value: stats.alerts,   accent: R,  icon: "⚠️",  sub: "flags + blocked" },
        ].map(({ label, value, accent, icon, sub }) => (
          <div key={label} className="rounded-xl border p-3" style={{ borderColor: `${accent}25`, background: `${accent}09` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{icon}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight">{label}</span>
            </div>
            <div className="text-3xl font-black font-mono" style={{ color: accent }}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Main: Quadrant + Right Panel ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

        {/* Talent Quadrant */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-black text-sm tracking-wide">TALENT QUADRANT MATRIX</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                BII (Physical) × SQ (Skill) · Midpoint 60/60 per PGBA methodology · Hover: details · Click: open profile
              </p>
            </div>
            <button
              onClick={() => navigate("/sports/badminton/explorer")}
              className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0 ml-4"
            >View all →</button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 my-3 p-2.5 rounded-lg bg-muted/30">
            {Object.entries(Q_LABEL).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: Q_COLOUR[k] }} />
                <span className="font-medium">{v}</span>
                <span className="text-muted-foreground text-[10px]">
                  ({athletes.filter((a) => a.quadrant === k).length})
                </span>
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60" />
              <span className="font-medium text-red-600">Blocked ({stats.blocked})</span>
            </span>
          </div>

          {/* Quadrant zone labels */}
          <div className="relative">
            <div className="absolute inset-0 pointer-events-none z-10" style={{ top: 15, right: 30, bottom: 58, left: 50 }}>
              <div className="absolute text-[9px] font-bold opacity-25" style={{ top: "4%", right: "4%", color: Au }}>CHAMPION PROFILE</div>
              <div className="absolute text-[9px] font-bold opacity-25" style={{ top: "4%", left: "4%", color: Sk }}>SKILL FIRST</div>
              <div className="absolute text-[9px] font-bold opacity-25" style={{ bottom: "8%", right: "4%", color: B }}>RAW PHYSICAL TALENT</div>
              <div className="absolute text-[9px] font-bold opacity-25" style={{ bottom: "8%", left: "4%", color: Gr }}>EARLY DEVELOPMENT</div>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 15, right: 30, bottom: 40, left: 50 }}>
                <defs>
                  <linearGradient id="bgGold" x1="1" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={Au} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={Au} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="bgBlue" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={B} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={B} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" dataKey="x" domain={[0, 100]} name="BII"
                  tick={{ fontSize: 11 }}
                  label={{ value: "BII — Badminton Intelligence Index (Physical Potential)", position: "insideBottom", offset: -28, fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis type="number" dataKey="y" domain={[0, 100]} name="SQ"
                  tick={{ fontSize: 11 }}
                  label={{ value: "SQ — Skill Quotient (Coach Assessment)", angle: -90, position: "insideLeft", offset: 15, dx: -10, fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                />
                <ReferenceLine x={60} stroke="#9CA3AF" strokeDasharray="6 4" strokeWidth={1.5} />
                <ReferenceLine y={60} stroke="#9CA3AF" strokeDasharray="6 4" strokeWidth={1.5} />
                <RTooltip content={<QuadTooltip />} cursor={false} />
                <Scatter
                  data={scatterData}
                  shape={(p: { cx?: number; cy?: number; payload?: ProcessedBadmintonAthlete & { rank: number } }) => <AthleteNode {...p} />}
                  onClick={(d: ProcessedBadmintonAthlete) => navigate(`/sports/badminton/athlete/${d.raw.id}`)}
                  style={{ cursor: "pointer" }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            BII weights: SPF 65.1% (Agility·Strength·Endurance·Flexibility·Speed) + BPF 27.2% + BM 7.7% · Source: PMC 2024 AHP Study
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">

          {/* Top Prospects */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-black text-xs tracking-wide mb-3 uppercase text-muted-foreground">
              🏅 Top Prospects
            </h2>
            <div className="space-y-2">
              {top3.map((a, i) => <ProspectCard key={a.raw.id} athlete={a} rank={i + 1} />)}
            </div>
          </div>

          {/* Raw Physical Talents */}
          {rawList.length > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: `${B}30`, background: `${B}07` }}>
              <h2 className="font-black text-xs tracking-wide mb-1" style={{ color: B }}>💪 RAW PHYSICAL TALENTS</h2>
              <p className="text-[10px] text-muted-foreground mb-3">Elite athleticism · Fast-track technical coaching recommended</p>
              <div className="space-y-1.5">
                {rawList.map((a) => (
                  <button key={a.raw.id} onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-background border border-border/60 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold">{a.raw.name}</div>
                        <div className="text-[10px] text-muted-foreground">{a.age_band} · {a.raw.years_playing_badminton}yr playing</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black font-mono" style={{ color: B }}>{a.bii.bii?.toFixed(1)}</div>
                        <div className="text-[9px] text-muted-foreground">BII</div>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <MiniBar value={a.bii.bii ?? 0} colour={B} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {stats.alerts > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: `${R}30`, background: `${R}07` }}>
              <h2 className="font-black text-xs tracking-wide mb-2" style={{ color: R }}>⚠ ACTION REQUIRED</h2>
              <div className="space-y-1.5">
                {athletes.filter((a) => a.isBlocked || a.flags.length > 0).slice(0, 5).map((a) => {
                  const colour = a.isBlocked ? R : "#D97706";
                  return (
                    <button key={a.raw.id} onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}
                      className="w-full text-left px-2.5 py-2 rounded-lg border hover:bg-muted/30 transition-colors"
                      style={{ borderColor: `${colour}30`, background: `${colour}07` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{a.isBlocked ? "⛔" : "⚠"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: colour }}>{a.raw.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {a.isBlocked ? "Blocked — data error" : a.flags.some((f) => f.startsWith("AUTO_")) ? "Auto-corrected" : "Needs verification"}
                          </div>
                        </div>
                        <span className="text-[10px] bg-muted rounded px-1.5 shrink-0">{a.age_band}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Secondary Analytics Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* BII by Age Band */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-black text-xs tracking-wide uppercase text-muted-foreground mb-0.5">Physical Potential by Age Band</h2>
          <p className="text-[10px] text-muted-foreground mb-3">Average BII — Male vs Female</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="band" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <RTooltip formatter={(v: number) => [v.toFixed(1), ""]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Male BII" fill={G} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Female BII" fill={Au} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gopichand 5-Pillar */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-black text-xs tracking-wide uppercase text-muted-foreground mb-0.5">Gopichand 5-Pillar Framework</h2>
          <p className="text-[10px] text-muted-foreground mb-3">Cohort avg vs Champion Target (85) — aspirational</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={pillarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
              <Radar name="Cohort" dataKey="cohort" stroke={G} fill={G} fillOpacity={0.3} />
              <Radar name="Target (85)" dataKey="target" stroke={Au} fill="none" strokeDasharray="4 4" strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* BII Progression */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-black text-xs tracking-wide uppercase text-muted-foreground mb-0.5">BII Progression U10→U16</h2>
          <p className="text-[10px] text-muted-foreground mb-3">Expected upward trend — flat = pipeline gap</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={progressData} margin={{ top: 5, right: 15, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="band" tick={{ fontSize: 10 }} />
              <YAxis domain={[20, 100]} tick={{ fontSize: 10 }} />
              <RTooltip formatter={(v: number) => [v?.toFixed(1), ""]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Male" stroke={G} strokeWidth={2.5} dot={{ r: 4, fill: G }} connectNulls />
              <Line type="monotone" dataKey="Female" stroke={Au} strokeWidth={2.5} dot={{ r: 4, fill: Au }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Phase 2 footer ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-dashed border-border/60 p-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phase 2 Roadmap</span>
          {["Video Analysis", "Match Statistics", "Injury Tracking", "Training Programme Generator", "Tournament Results", "Multi-Academy Comparison"].map((f) => (
            <span key={f} className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />{f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
