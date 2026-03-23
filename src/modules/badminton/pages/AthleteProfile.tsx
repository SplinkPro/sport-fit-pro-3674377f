// ─── Badminton Athlete Profile ────────────────────────────────────────────────
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { processAll } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import { getRTZone } from "../norms";
import type { ProcessedBadmintonAthlete } from "../types";

const COURT_GREEN = "#1A5C38";
const SHUTTLE_GOLD = "#D4A017";

const FLAG_DESCRIPTIONS: Record<string, string> = {
  AUTO_CORRECTED_UNIT: "Reaction time auto-corrected: entered as seconds, converted to ms",
  AUTO_CORRECTED_VJ: "Vertical jump auto-corrected: wall-reach convention detected, net jump computed",
  VERIFY_RT_LOW: "Extraordinary reaction time (<110ms) — verify equipment calibration",
  VERIFY_SKILL_LENIENCY: "All skill scores ≥ 9 — coach review recommended for leniency bias",
  VERIFY_BII_TALENT: "BII >88 with <1 year playing — exceptional raw talent, verify data",
  VERIFY_WINGSPAN: "Wingspan >18cm above height — verify measurement technique",
  BLOCKED_RT: "BLOCKED: Reaction time outside valid range (80–700ms)",
  BLOCKED_VJ: "BLOCKED: Vertical jump >120cm — physically impossible for youth",
  BLOCKED_SHUTTLE_LOW: "BLOCKED: 4-corner shuttle <8.0s — physically impossible",
  BLOCKED_GRIP: "BLOCKED: Grip strength >65kg — equipment error",
  BLOCKED_BEEP: "BLOCKED: Beep test level >15 — maximum test level exceeded",
  BLOCKED_SKILL: "BLOCKED: Skill score outside 1–10 range",
};

function RTGauge({ ms, gender }: { ms: number; gender: string }) {
  const zone = getRTZone(ms);
  const p50 = gender === "Male" ? 156 : 144;
  const pct = Math.max(0, Math.min(100, ((300 - ms) / (300 - 100)) * 100));
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-wide">REACTION TIME GAUGE</div>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold font-mono" style={{ color: zone.colour }}>{ms.toFixed(0)}<span className="text-sm ml-1 font-normal text-muted-foreground">ms</span></div>
        <div>
          <div className="text-lg font-bold" style={{ color: zone.colour }}>{zone.label}</div>
          <div className="text-xs text-muted-foreground">Zone Classification</div>
        </div>
      </div>
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "linear-gradient(to right, #1A5C38, #D4A017, #E67E22, #C0392B)" }}>
        <div className="absolute top-0 h-full w-1 bg-white shadow-md rounded" style={{ left: `${pct}%`, transform: "translateX(-50%)" }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>100ms (Elite)</span><span>200ms</span><span>300ms+</span>
      </div>
      <div className="text-[10px] space-y-0.5">
        {[{ max: 130, label: "Elite", c: "#1A5C38" }, { max: 170, label: "Competitive", c: "#D4A017" }, { max: 220, label: "Developing", c: "#E67E22" }, { max: 999, label: "Needs Focus", c: "#C0392B" }].map((z) => (
          <div key={z.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: z.c }} />
            <span style={{ color: z.c }}>{z.label}</span>
            <span className="text-muted-foreground">{z.max < 999 ? `< ${z.max}ms` : `≥ 220ms`}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground border-t pt-2">
        Indian youth P50: <span className="font-mono font-semibold">{p50}ms</span> ({gender === "Male" ? "boys" : "girls"}) ·
        <em> TISTI Uttarakhand Badminton Research, 2025</em>
      </div>
    </div>
  );
}

function SkillBar({ label, score, highlight }: { label: string; score: number; highlight?: boolean }) {
  return (
    <div className={`space-y-1 p-2 rounded-lg ${highlight ? "bg-yellow-50 border border-yellow-200" : ""}`}>
      <div className="flex justify-between text-xs">
        <span className={`font-medium ${highlight ? "text-yellow-800" : ""}`}>{label}</span>
        <span className="font-mono font-bold">{score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score * 10}%`, background: score >= 8 ? COURT_GREEN : score >= 6 ? SHUTTLE_GOLD : "#C0392B" }} />
      </div>
    </div>
  );
}

export default function BadmintonAthleteProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const athletes = useMemo(() => processAll(SEED_ATHLETES), []);
  const a: ProcessedBadmintonAthlete | undefined = athletes.find((x) => x.raw.id === id);

  if (!a) return (
    <div className="p-8 text-center text-muted-foreground">
      <div className="text-4xl mb-3">🔍</div>
      <div>Athlete not found.</div>
      <button onClick={() => navigate("/sports/badminton/explorer")} className="mt-3 text-sm underline" style={{ color: COURT_GREEN }}>← Back to Explorer</button>
    </div>
  );

  const genderKey = a.raw.gender === "Male" ? "M" : "F";
  const hasLeniency = a.flags.includes("VERIFY_SKILL_LENIENCY");

  const radarData = [
    { axis: "Agility", athlete: Math.round(a.secondary.agility ?? 0), norm: 50 },
    { axis: "Strength", athlete: Math.round(a.secondary.strength ?? 0), norm: 50 },
    { axis: "Endurance", athlete: Math.round(a.secondary.endurance ?? 0), norm: 50 },
    { axis: "Reaction", athlete: Math.round(a.secondary.speed ?? 0), norm: 50 },
    { axis: "Flexibility", athlete: Math.round(a.secondary.flexibility ?? 0), norm: 50 },
    { axis: "Power", athlete: Math.round(((a.percentiles.vertical_jump ?? 0) + (a.percentiles.broad_jump ?? 0)) / 2), norm: 50 },
    { axis: "Throw Power", athlete: Math.round(a.percentiles.shuttlecock_throw ?? 0), norm: 50 },
    { axis: "Court Fitness", athlete: Math.round(((a.percentiles.beep_test ?? 0) + (a.percentiles.pushups ?? 0) + (a.percentiles.situps ?? 0)) / 3), norm: 50 },
  ];

  const recColour = { gold: SHUTTLE_GOLD, blue: "#2563EB", green: "#16A34A", grey: "#6B7280", amber: "#D97706" };

  return (
    <div className="p-5 space-y-5 max-w-5xl">
      <button onClick={() => navigate("/sports/badminton/explorer")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        ← Back to Explorer
      </button>

      {/* Section A — Identity + Summary */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap gap-5 items-start">
          <div className="flex-1 min-w-[200px] space-y-2">
            <h1 className="text-2xl font-bold">{a.raw.name}</h1>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-muted rounded-full px-2 py-0.5 font-medium">{a.age_band}</span>
              <span className="bg-muted rounded-full px-2 py-0.5">{a.raw.gender}</span>
              <span className="bg-muted rounded-full px-2 py-0.5">{a.raw.dominant_hand} Hand</span>
              <span className="bg-muted rounded-full px-2 py-0.5">Age {a.age}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Batch: <span className="text-foreground">{a.raw.academy_batch}</span></div>
              <div>Coach: <span className="text-foreground">{a.raw.coach_name}</span></div>
              <div>Playing: <span className="text-foreground">{a.raw.years_playing_badminton} yr{a.raw.years_playing_badminton !== 1 ? "s" : ""}</span></div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: `${COURT_GREEN}15`, border: `1px solid ${COURT_GREEN}30` }}>
              <div className="text-3xl font-bold font-mono" style={{ color: COURT_GREEN }}>
                {a.isBlocked ? "⛔" : a.bii.bii?.toFixed(1) ?? "—"}
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: COURT_GREEN }}>BII Score</div>
              <div className="text-[10px] text-muted-foreground">Physical Potential</div>
              {!a.isBlocked && a.bii.bii && (
                <div className="text-[10px] font-semibold mt-1" style={{ color: COURT_GREEN }}>
                  Top {Math.round(100 - a.bii.bii)}% of {a.age_band} {a.raw.gender === "Male" ? "Males" : "Females"}
                </div>
              )}
            </div>
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: `${SHUTTLE_GOLD}15`, border: `1px solid ${SHUTTLE_GOLD}40` }}>
              <div className="text-3xl font-bold font-mono" style={{ color: SHUTTLE_GOLD }}>
                {a.sq.pct?.toFixed(1) ?? "—"}
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: SHUTTLE_GOLD }}>SQ Score</div>
              <div className="text-[10px] text-muted-foreground">Coach Assessment</div>
              {a.sq.isPartial && <div className="text-[10px] text-amber-600 mt-1">Partial SQ</div>}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg text-sm font-semibold" style={{ background: `${recColour[a.recommendation.colour]}15`, color: recColour[a.recommendation.colour], border: `1px solid ${recColour[a.recommendation.colour]}30` }}>
          {a.recommendation.icon} {a.recommendation.label}
        </div>

        {a.isBlocked && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-semibold">
            ⛔ This athlete has BLOCKED data — BII cannot be computed. Correct flagged entries before scoring.
          </div>
        )}
      </div>

      {/* Sections B + C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* B — Radar */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-wide mb-1">PHYSICAL PROFILE RADAR</div>
          <div className="text-[10px] text-muted-foreground mb-3">vs Indian Youth Badminton Research Norms (P50)</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <Radar name={a.raw.name} dataKey="athlete" stroke={COURT_GREEN} fill={COURT_GREEN} fillOpacity={0.35} />
              <Radar name="P50 Norm" dataKey="norm" stroke="#6B7280" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
              <Tooltip formatter={(v: number) => [`${v}th pct`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-1">Reference: Indian youth badminton research + EUROFIT protocols. PGBA may update using academy-specific cohort data.</p>
        </div>

        {/* C — RT Gauge */}
        {a.corrected.reaction_time_ms !== undefined ? (
          <RTGauge ms={a.corrected.reaction_time_ms} gender={a.raw.gender} />
        ) : (
          <div className="rounded-xl border bg-card p-5 flex items-center justify-center text-muted-foreground text-sm">
            Reaction time data not available or blocked.
          </div>
        )}
      </div>

      {/* Section D — Skill Breakdown */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide">SKILL ASSESSMENT — GOPICHAND COACHING FRAMEWORK</div>
        {hasLeniency && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-800 font-semibold">
            ⚠ Coach review recommended — all scores ≥ 9. Possible leniency bias. Please re-assess.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: "footwork_efficiency", label: "Footwork Efficiency (weight 20%)", highlight: true },
            { key: "stroke_mechanics", label: "Stroke Mechanics" },
            { key: "smash_quality", label: "Smash Quality" },
            { key: "court_awareness", label: "Court Awareness" },
            { key: "net_play", label: "Net Play" },
            { key: "serve_accuracy", label: "Serve Accuracy" },
            { key: "coachability", label: "Coachability ★ Primary intake criterion at PGBA", highlight: true },
            { key: "mental_resilience", label: "Mental Resilience" },
          ].map(({ key, label, highlight }) => {
            const val = a.raw[key as keyof typeof a.raw] as number | undefined;
            if (val === undefined) return <div key={key} className="text-xs text-muted-foreground p-2">No data: {label}</div>;
            return <SkillBar key={key} label={label} score={val} highlight={highlight && hasLeniency} />;
          })}
        </div>
      </div>

      {/* Section E — Anthropometrics */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide">ANTHROPOMETRICS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Height", value: `${a.raw.height_cm} cm` },
            { label: "Weight", value: `${a.raw.weight_kg} kg` },
            { label: "BMI", value: `${a.bmi} (${a.age_band})` },
            { label: "Wingspan", value: a.wingspanProxy ? `${a.raw.height_cm} cm (proxy)` : `${a.raw.wingspan_cm} cm` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold font-mono">{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs">
          Reach Index: <span className="font-mono font-bold">
            {a.wingspanProxy ? "N/A (wingspan not recorded)" : `${((a.raw.wingspan_cm ?? a.raw.height_cm) - a.raw.height_cm) >= 0 ? "+" : ""}${(a.raw.wingspan_cm ?? a.raw.height_cm) - a.raw.height_cm} cm`}
          </span>
          {a.wingspanProxy && <span className="ml-2 text-amber-600 text-[10px]">⚠ Wingspan not recorded — using height as proxy</span>}
        </div>
        <p className="text-[10px] text-muted-foreground border-t pt-2">
          Taller players (e.g. PV Sindhu at 179cm) gain reach advantage at net. Wingspan &gt; height is favourable for net coverage.
        </p>
      </div>

      {/* Section F — Data Quality */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide">DATA QUALITY</div>
        <div className="flex flex-wrap gap-3 mb-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="font-bold text-green-700">✅</span> Clean — no issues</span>
          <span className="flex items-center gap-1"><span>🟠</span> Auto-corrected — value converted, review recommended</span>
          <span className="flex items-center gap-1"><span className="text-red-600 font-bold">🔴</span> Verify / Blocked — requires correction</span>
        </div>
        {a.flags.length === 0 ? (
          <div className="text-sm text-green-700 font-semibold">✅ All fields clean — no issues detected.</div>
        ) : (
          <div className="space-y-2">
            {a.flags.map((flag) => (
              <div key={flag} className={`p-2.5 rounded-lg text-xs font-medium border ${flag.startsWith("BLOCKED") ? "bg-red-50 border-red-200 text-red-700" : flag.startsWith("AUTO") ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-yellow-50 border-yellow-200 text-yellow-800"}`}>
                {flag.startsWith("BLOCKED") ? "🔴" : flag.startsWith("AUTO") ? "🟠" : "⚠"} {FLAG_DESCRIPTIONS[flag] ?? flag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
