// ─── Badminton Dashboard ─────────────────────────────────────────────────────
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete } from "../types";

const COURT_GREEN = "#1A5C38";
const SHUTTLE_GOLD = "#D4A017";

const QUADRANT_COLOURS: Record<string, string> = {
  CHAMPION_PROFILE: "#D4A017",
  RAW_PHYSICAL_TALENT: "#2563EB",
  SKILL_FIRST: "#16A34A",
  EARLY_DEVELOPMENT: "#6B7280",
};

const QUADRANT_LABELS: Record<string, string> = {
  CHAMPION_PROFILE: "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST: "Skill First",
  EARLY_DEVELOPMENT: "Early Development",
};

interface DotProps {
  cx?: number; cy?: number; payload?: ProcessedBadmintonAthlete;
}

function CustomDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload) return null;
  const colour = payload.quadrant ? QUADRANT_COLOURS[payload.quadrant] : "#6B7280";
  const blocked = payload.isBlocked;
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={blocked ? 7 : 8}
        fill={blocked ? "#C0392B" : colour}
        stroke={blocked ? "#7f0000" : "white"}
        strokeWidth={2}
        opacity={blocked ? 0.6 : 1}
      />
      {blocked && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="white" fontWeight="bold">⛔</text>
      )}
    </g>
  );
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: { payload: ProcessedBadmintonAthlete }[];
}

function ScatterTooltipContent({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null;
  const a = payload[0].payload;
  return (
    <div className="text-xs rounded-lg border shadow-lg p-3 bg-background border-border space-y-1 min-w-[180px]">
      <div className="font-bold text-sm">{a.raw.name}</div>
      <div className="text-muted-foreground">{a.age_band} · {a.raw.gender}</div>
      {a.isBlocked ? (
        <div className="text-red-600 font-semibold">⛔ Data Issue — Blocked</div>
      ) : (
        <>
          <div>BII: <span className="font-mono font-semibold">{a.bii.bii?.toFixed(1) ?? "—"}</span></div>
          <div>SQ: <span className="font-mono font-semibold">{a.sq.pct?.toFixed(1) ?? "—"}</span></div>
          {a.quadrant && (
            <div style={{ color: QUADRANT_COLOURS[a.quadrant] }} className="font-semibold">
              {QUADRANT_LABELS[a.quadrant]}
            </div>
          )}
          <div className="text-muted-foreground">{a.recommendation.icon} {a.recommendation.label}</div>
        </>
      )}
    </div>
  );
}

export default function BadmintonDashboard() {
  const navigate = useNavigate();
  const athletes = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);

  const stats = useMemo(() => {
    const assessed = athletes.filter((a) => a.bii.bii !== undefined).length;
    const champions = athletes.filter((a) => a.quadrant === "CHAMPION_PROFILE").length;
    const rawTalent = athletes.filter((a) => a.quadrant === "RAW_PHYSICAL_TALENT").length;
    const alerts = athletes.filter((a) => a.isBlocked || a.flags.some(
      (f) => f.startsWith("VERIFY_") || f.startsWith("AUTO_")
    )).length;
    return { total: athletes.length, assessed, champions, rawTalent, alerts };
  }, [athletes]);

  // Scatter data
  const scatterData = useMemo(
    () => athletes.map((a) => ({
      ...a,
      x: a.bii.bii ?? 0,
      y: a.sq.pct ?? 0,
    })),
    [athletes]
  );

  // BII by age band M vs F
  const barData = useMemo(() => {
    const bands = ["U10", "U12", "U14", "U16"] as const;
    return bands.map((band) => {
      const inBand = athletes.filter((a) => a.age_band === band && !a.isBlocked);
      const males = inBand.filter((a) => a.raw.gender === "Male");
      const females = inBand.filter((a) => a.raw.gender === "Female");
      const avg = (arr: ProcessedBadmintonAthlete[]) =>
        arr.length ? arr.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / arr.length : 0;
      return { band, Male: Math.round(avg(males) * 10) / 10, Female: Math.round(avg(females) * 10) / 10 };
    });
  }, [athletes]);

  // Radar: cohort avg vs P50 norm (using proxy values)
  const radarData = useMemo(() => {
    const valid = athletes.filter((a) => !a.isBlocked);
    const avgSec = (key: keyof typeof valid[0]["secondary"]) => {
      const vals = valid.map((a) => a.secondary[key]).filter((v) => v !== undefined) as number[];
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    return [
      { axis: "Agility",     cohort: Math.round(avgSec("agility")), norm: 50 },
      { axis: "Strength",    cohort: Math.round(avgSec("strength")), norm: 50 },
      { axis: "Endurance",   cohort: Math.round(avgSec("endurance")), norm: 50 },
      { axis: "Reaction",    cohort: Math.round(avgSec("speed")), norm: 50 },
      { axis: "Flexibility", cohort: Math.round(avgSec("flexibility")), norm: 50 },
    ];
  }, [athletes]);

  const KPI = ({ label, value, sub, colour }: { label: string; value: string | number; sub?: string; colour?: string }) => (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-bold" style={{ color: colour ?? "inherit" }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      {/* Module header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏸</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: COURT_GREEN }}>
              BADMINTON INTELLIGENCE PLATFORM
            </h1>
            <p className="text-sm text-muted-foreground">Gopichand Academy Methodology | PGBA Hyderabad</p>
          </div>
          <span className="ml-auto text-xs font-bold rounded px-2 py-0.5 border" style={{ color: SHUTTLE_GOLD, borderColor: SHUTTLE_GOLD }}>BETA</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Athletes Assessed" value={stats.total} sub={`${stats.assessed} with BII score`} colour={COURT_GREEN} />
        <KPI label="Champion Profiles" value={stats.champions} sub="BII ≥ 60 & SQ ≥ 60" colour={SHUTTLE_GOLD} />
        <KPI label="Physical Talents" value={stats.rawTalent} sub="BII ≥ 60, SQ < 60" colour="#2563EB" />
        <KPI label="Alerts" value={stats.alerts} sub="Flagged + Blocked" colour="#C0392B" />
      </div>

      {/* Talent Quadrant */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-bold mb-1">TALENT QUADRANT</h2>
        <p className="text-xs text-muted-foreground mb-1">
          X-axis: BII (Physical Potential) · Y-axis: SQ (Skill Quotient) · Midpoint 60/60
        </p>
        <div className="flex flex-wrap gap-4 mb-3 text-xs">
          {Object.entries(QUADRANT_LABELS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: QUADRANT_COLOURS[k] }} />
              {v}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block bg-red-600 opacity-60" />⛔ Blocked
          </span>
        </div>

        {/* Quadrant zone labels */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none z-10 flex">
            <div className="w-1/2 h-full flex flex-col">
              <div className="flex-1 flex items-start justify-start p-2">
                <span className="text-xs font-semibold opacity-30" style={{ color: "#16A34A" }}>◀ SKILL FIRST</span>
              </div>
              <div className="flex-1 flex items-end justify-start p-2">
                <span className="text-xs font-semibold opacity-30 text-muted-foreground">▼ EARLY DEVELOPMENT</span>
              </div>
            </div>
            <div className="w-1/2 h-full flex flex-col">
              <div className="flex-1 flex items-start justify-end p-2">
                <span className="text-xs font-semibold opacity-40" style={{ color: SHUTTLE_GOLD }}>CHAMPION PROFILE ▶</span>
              </div>
              <div className="flex-1 flex items-end justify-end p-2">
                <span className="text-xs font-semibold opacity-30" style={{ color: "#2563EB" }}>RAW PHYSICAL ▶</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} name="BII"
                label={{ value: "BII — Physical Potential", position: "insideBottom", offset: -10, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} name="SQ"
                label={{ value: "SQ — Skill Quotient", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }} />
              <ReferenceLine x={60} stroke="#6B7280" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={60} stroke="#6B7280" strokeDasharray="4 4" strokeWidth={1.5} />
              <RTooltip content={<ScatterTooltipContent />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={scatterData}
                shape={(props: DotProps) => <CustomDot {...props} />}
                onClick={(data: ProcessedBadmintonAthlete) => navigate(`/sports/badminton/athlete/${data.raw.id}`)}
                style={{ cursor: "pointer" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BII distribution by age band */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-bold mb-1">PHYSICAL POTENTIAL DISTRIBUTION</h2>
          <p className="text-xs text-muted-foreground mb-3">Average BII by age band — Male vs Female</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: number) => [`${v.toFixed(1)}`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Male" fill={COURT_GREEN} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Female" fill={SHUTTLE_GOLD} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort vs norm radar */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-bold mb-1">COHORT PHYSICAL PROFILE</h2>
          <p className="text-xs text-muted-foreground mb-3">vs Indian Youth Badminton Norms (P50 = 50th percentile)</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
              <Radar name="Cohort Avg" dataKey="cohort" stroke={COURT_GREEN} fill={COURT_GREEN} fillOpacity={0.35} />
              <Radar name="P50 Norm" dataKey="norm" stroke="#6B7280" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <RTooltip formatter={(v: number) => [`${v}th percentile`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2">
            Reference: Indian youth badminton research + EUROFIT protocols. PGBA may update using academy-specific cohort data.
          </p>
        </div>
      </div>
    </div>
  );
}
