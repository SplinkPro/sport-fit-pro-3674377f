// ─── Badminton Athlete Profile ────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { processAll } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import { getRTZone } from "../norms";
import type { ProcessedBadmintonAthlete } from "../types";
import { cn } from "@/lib/utils";

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
const Q_LABEL: Record<string, string> = {
  CHAMPION_PROFILE:    "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST:         "Skill First",
  EARLY_DEVELOPMENT:   "Early Development",
};

const FLAG_DESC: Record<string, string> = {
  AUTO_CORRECTED_UNIT: "Reaction time auto-corrected: entered as seconds → converted to ms",
  AUTO_CORRECTED_VJ:   "Vertical jump auto-corrected: wall-reach convention detected → net jump computed",
  VERIFY_RT_LOW:       "Extraordinary reaction time (<110ms) — verify equipment calibration",
  VERIFY_SKILL_LENIENCY:"All skill scores ≥ 9 — coach review recommended for leniency bias",
  VERIFY_BII_TALENT:   "BII >88 with <1 year playing — exceptional raw talent, verify data",
  VERIFY_WINGSPAN:     "Wingspan >18cm above height — verify measurement technique",
  BLOCKED_RT:          "BLOCKED: Reaction time outside valid range (80–700ms)",
  BLOCKED_VJ:          "BLOCKED: Vertical jump >120cm — physically impossible for youth",
  BLOCKED_SHUTTLE_LOW: "BLOCKED: 4-corner shuttle <8.0s — physically impossible",
  BLOCKED_GRIP:        "BLOCKED: Grip strength >65kg — equipment error",
  BLOCKED_BEEP:        "BLOCKED: Beep test level >15 — maximum test level exceeded",
  BLOCKED_SKILL:       "BLOCKED: Skill score outside 1–10 range",
};

const PHYSICAL_TESTS = [
  { key: "reaction",         label: "Reaction Time",        unit: "ms",  lowerBetter: true },
  { key: "four_corner",      label: "4-Corner Shuttle",     unit: "s",   lowerBetter: true },
  { key: "ten_by_five",      label: "10×5m Shuttle",        unit: "s",   lowerBetter: true },
  { key: "vertical_jump",    label: "Vertical Jump",        unit: "cm",  lowerBetter: false },
  { key: "broad_jump",       label: "Broad Jump",           unit: "cm",  lowerBetter: false },
  { key: "beep_test",        label: "Beep Test",            unit: "lvl", lowerBetter: false },
  { key: "grip",             label: "Grip Strength",        unit: "kg",  lowerBetter: false },
  { key: "shuttlecock_throw",label: "Shuttlecock Throw",    unit: "m",   lowerBetter: false },
  { key: "situps",           label: "Sit-ups 30s",          unit: "reps",lowerBetter: false },
  { key: "pushups",          label: "Push-ups 30s",         unit: "reps",lowerBetter: false },
  { key: "sit_reach",        label: "Sit & Reach",          unit: "cm",  lowerBetter: false },
] as const;

type PhysKey = typeof PHYSICAL_TESTS[number]["key"];

const RAW_KEY_MAP: Record<PhysKey, keyof import("../types").CorrectedPhysicals> = {
  reaction:          "reaction_time_ms",
  four_corner:       "four_corner_shuttle_run_sec",
  ten_by_five:       "ten_by_five_shuttle_run_sec",
  vertical_jump:     "vertical_jump_cm",
  broad_jump:        "standing_broad_jump_cm",
  beep_test:         "beep_test_level",
  grip:              "grip_strength_kg",
  shuttlecock_throw: "shuttlecock_throw_m",
  situps:            "situps_30sec",
  pushups:           "pushups_30sec",
  sit_reach:         "sit_and_reach_cm",
};

type Tab = "overview" | "physical" | "skills" | "quality";

// ─── Reaction Time Gauge ──────────────────────────────────────────────────────
function RTGauge({ ms, gender }: { ms: number; gender: string }) {
  const zone = getRTZone(ms);
  const p50  = gender === "Male" ? 156 : 144;
  const pct  = Math.max(0, Math.min(100, ((300 - ms) / 200) * 100));
  const zones = [
    { max: 130, label: "Elite",       colour: G },
    { max: 170, label: "Competitive", colour: Au },
    { max: 220, label: "Developing",  colour: "#E67E22" },
    { max: 9999,label: "Needs Focus", colour: R },
  ];

  return (
    <div className="space-y-4">
      {/* Big number */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-black font-mono" style={{ color: zone.colour }}>{ms.toFixed(0)}</span>
        <span className="text-muted-foreground text-sm mb-2">ms</span>
        <div className="mb-1">
          <span className="text-lg font-black" style={{ color: zone.colour }}>{zone.label}</span>
          <div className="text-xs text-muted-foreground">Zone Classification</div>
        </div>
      </div>

      {/* Gradient bar */}
      <div className="relative">
        <div className="h-5 rounded-full overflow-hidden" style={{ background: `linear-gradient(to right, ${G} 0%, ${Au} 35%, #E67E22 65%, ${R} 100%)` }}>
          <div className="absolute top-0 bottom-0 w-1 bg-white rounded shadow-md"
            style={{ left: `calc(${pct}% - 2px)` }} />
        </div>
        {/* P50 marker */}
        <div className="absolute -top-1 flex flex-col items-center"
          style={{ left: `calc(${Math.max(0, Math.min(100, ((300 - p50) / 200) * 100))}% - 2px)` }}>
          <div className="w-0.5 h-2 bg-foreground/40 rounded" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>100ms</span><span>150ms</span><span>200ms</span><span>250ms</span><span>300ms+</span>
        </div>
      </div>

      {/* Zone legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {zones.map((z) => (
          <div key={z.label} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border",
            zone.label === z.label ? "border-current" : "border-border/40 opacity-70")}
            style={{ color: z.colour, background: `${z.colour}12` }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: z.colour }} />
            <span className="font-bold">{z.label}</span>
            <span className="text-[10px] ml-auto">{z.max < 999 ? `<${z.max}ms` : "≥220ms"}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground border-t border-border pt-2 space-y-0.5">
        <div>Indian youth P50: <span className="font-mono font-semibold">{p50}ms</span> ({gender === "Male" ? "Boys" : "Girls"}) · Marker shown on gauge</div>
        <div className="italic">Source: TISTI Uttarakhand Badminton Research, 2025</div>
      </div>
    </div>
  );
}

// ─── BII Breakdown Bar ────────────────────────────────────────────────────────
function BIIBreakdown({ bii }: { bii: import("../types").BIIBreakdown }) {
  const items = [
    { label: "SPF (Agility·Strength·Endurance·Flex·Speed)", value: bii.spf_norm, weight: 0.651, colour: G },
    { label: "BPF (Throw + Beep)", value: bii.bpf, weight: 0.272, colour: Au },
    { label: "Body Morphology", value: bii.bm, weight: 0.077, colour: B },
  ];
  return (
    <div className="space-y-2">
      {items.map(({ label, value, weight, colour }) => (
        <div key={label}>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold">{value !== undefined ? value.toFixed(1) : "—"} <span className="text-muted-foreground font-normal">(w={weight})</span></span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: colour }} />
          </div>
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground pt-1">
        {bii.physicalTestCount}/11 physical tests valid · {bii.missingComponents.length > 0 && `Missing: ${bii.missingComponents.join(", ")}`}
      </div>
    </div>
  );
}

export default function BadmintonAthleteProfile() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const athletes  = useMemo(() => processAll(SEED_ATHLETES), []);
  const a: ProcessedBadmintonAthlete | undefined = athletes.find((x) => x.raw.id === id);

  if (!a) return (
    <div className="p-12 text-center space-y-3">
      <div className="text-4xl">🔍</div>
      <div className="text-muted-foreground">Athlete not found.</div>
      <button onClick={() => navigate("/sports/badminton/explorer")} className="text-sm underline" style={{ color: G }}>← Back to Explorer</button>
    </div>
  );

  const qColour = a.quadrant ? Q_COLOUR[a.quadrant] : Gr;
  const recC = { gold: Au, blue: B, green: Sk, grey: Gr, amber: "#D97706" };
  const hasLeniency = a.flags.includes("VERIFY_SKILL_LENIENCY");

  // Radar data
  const radarData = [
    { axis: "Agility",      athlete: Math.round(a.secondary.agility ?? 0),     norm: 50 },
    { axis: "Strength",     athlete: Math.round(a.secondary.strength ?? 0),    norm: 50 },
    { axis: "Endurance",    athlete: Math.round(a.secondary.endurance ?? 0),   norm: 50 },
    { axis: "Reaction",     athlete: Math.round(a.secondary.speed ?? 0),       norm: 50 },
    { axis: "Flexibility",  athlete: Math.round(a.secondary.flexibility ?? 0), norm: 50 },
    { axis: "Power",        athlete: Math.round(((a.percentiles.vertical_jump ?? 0) + (a.percentiles.broad_jump ?? 0)) / 2), norm: 50 },
    { axis: "Throw",        athlete: Math.round(a.percentiles.shuttlecock_throw ?? 0), norm: 50 },
    { axis: "Court Fit",    athlete: Math.round(((a.percentiles.beep_test ?? 0) + (a.percentiles.pushups ?? 0) + (a.percentiles.situps ?? 0)) / 3), norm: 50 },
  ];

  // Physical test bar data
  const physBarData = PHYSICAL_TESTS.map((t) => ({
    name: t.label,
    pct:  Math.round(a.percentiles[t.key as keyof typeof a.percentiles] ?? 0),
    raw:  a.corrected[RAW_KEY_MAP[t.key]] as number | undefined,
    unit: t.unit,
    lowerBetter: t.lowerBetter,
    available: a.corrected[RAW_KEY_MAP[t.key]] !== undefined,
  }));

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview",  label: "Overview",      icon: "⚡" },
    { key: "physical",  label: "Physical Tests", icon: "🏃" },
    { key: "skills",    label: "Skills",         icon: "🎯" },
    { key: "quality",   label: "Data Quality",   icon: "🔎" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-5">

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border">
        {/* Colour band */}
        <div className="h-2" style={{ background: a.isBlocked ? R : qColour }} />
        <div className="p-5 bg-card">
          <div className="flex flex-wrap gap-5 items-start">
            {/* Identity */}
            <div className="flex-1 min-w-[220px]">
              <h1 className="text-2xl font-black tracking-tight">{a.raw.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[a.age_band, a.raw.gender, `${a.raw.dominant_hand} Hand`, `Age ${a.age}`, `${a.raw.years_playing_badminton}yr playing`].map((t) => (
                  <span key={t} className="text-xs bg-muted rounded-full px-2.5 py-0.5 font-medium">{t}</span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground space-y-0.5">
                <div>Batch: <span className="text-foreground font-medium">{a.raw.academy_batch}</span></div>
                <div>Coach: <span className="text-foreground font-medium">{a.raw.coach_name}</span></div>
              </div>
            </div>

            {/* BII + SQ big numbers */}
            <div className="flex gap-3">
              <div className="text-center px-5 py-3.5 rounded-xl"
                style={{ background: a.isBlocked ? `${R}15` : `${G}15`, border: `1px solid ${a.isBlocked ? R : G}30` }}>
                <div className="text-4xl font-black font-mono" style={{ color: a.isBlocked ? R : G }}>
                  {a.isBlocked ? "⛔" : (a.bii.bii?.toFixed(1) ?? "—")}
                </div>
                <div className="text-xs font-black mt-1" style={{ color: a.isBlocked ? R : G }}>BII</div>
                <div className="text-[10px] text-muted-foreground">Physical Potential</div>
                {!a.isBlocked && a.bii.bii && (
                  <div className="text-[10px] font-bold mt-1" style={{ color: G }}>
                    Top {Math.max(1, Math.round(100 - a.bii.bii))}% of {a.age_band} {a.raw.gender === "Male" ? "Males" : "Females"}
                  </div>
                )}
              </div>
              <div className="text-center px-5 py-3.5 rounded-xl"
                style={{ background: `${Au}15`, border: `1px solid ${Au}30` }}>
                <div className="text-4xl font-black font-mono" style={{ color: Au }}>
                  {a.sq.pct?.toFixed(1) ?? "—"}
                </div>
                <div className="text-xs font-black mt-1" style={{ color: Au }}>SQ</div>
                <div className="text-[10px] text-muted-foreground">Skill Quotient</div>
                {a.sq.isPartial && <div className="text-[10px] text-amber-600 mt-1">⚠ Partial</div>}
              </div>
            </div>
          </div>

          {/* Quadrant + Recommendation */}
          <div className="mt-4 flex flex-wrap gap-2">
            {a.quadrant && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                style={{ color: qColour, borderColor: `${qColour}50`, background: `${qColour}12` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: qColour }} />
                {Q_LABEL[a.quadrant]}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border"
              style={{ color: recC[a.recommendation.colour], borderColor: `${recC[a.recommendation.colour]}40`, background: `${recC[a.recommendation.colour]}10` }}>
              {a.recommendation.icon} {a.recommendation.label}
            </span>
          </div>

          {a.isBlocked && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-semibold">
              ⛔ BLOCKED — BII cannot be computed. Correct flagged data entries before scoring.
            </div>
          )}
        </div>
      </div>

      {/* ─── Tab Bar ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-b-2 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            style={{ borderBottomColor: tab === t.key ? G : undefined }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab: Overview ─────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Physical Radar */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-black text-xs uppercase tracking-wide mb-0.5">Physical Profile Radar</h3>
              <p className="text-[10px] text-muted-foreground mb-3">Athlete percentile vs Indian Youth P50 norm (dashed)</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <Radar name={a.raw.name} dataKey="athlete" stroke={G} fill={G} fillOpacity={0.35} strokeWidth={2} />
                  <Radar name="P50 Norm" dataKey="norm" stroke="#9CA3AF" fill="none" strokeDasharray="5 4" strokeWidth={1.5} />
                  <Tooltip formatter={(v: number) => [`${v}th pct.`, ""]} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-1">Reference: Indian youth badminton research + EUROFIT protocols. PGBA may update using academy-specific cohort data.</p>
            </div>

            {/* RT Gauge */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-black text-xs uppercase tracking-wide mb-4">Reaction Time Gauge</h3>
              {a.corrected.reaction_time_ms !== undefined ? (
                <RTGauge ms={a.corrected.reaction_time_ms} gender={a.raw.gender} />
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  Reaction time not available
                </div>
              )}
            </div>
          </div>

          {/* BII Breakdown */}
          {!a.isBlocked && a.bii.bii !== undefined && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-black text-xs uppercase tracking-wide mb-1">BII Component Breakdown</h3>
              <p className="text-[10px] text-muted-foreground mb-4">AHP-validated weights per PMC 2024 study</p>
              <BIIBreakdown bii={a.bii} />
            </div>
          )}

          {/* Anthropometrics */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-black text-xs uppercase tracking-wide mb-4">Anthropometrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Height", value: `${a.raw.height_cm} cm` },
                { label: "Weight", value: `${a.raw.weight_kg} kg` },
                { label: "BMI (IAP)", value: `${a.bmi.toFixed(1)}` },
                { label: "Wingspan", value: a.wingspanProxy ? `${a.raw.height_cm} cm *` : `${a.raw.wingspan_cm} cm` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3.5 rounded-xl bg-muted/30">
                  <div className="text-xl font-black font-mono">{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs">
              Reach Index:{" "}
              <span className="font-mono font-bold">
                {a.wingspanProxy ? "N/A" : `${((a.raw.wingspan_cm ?? a.raw.height_cm) - a.raw.height_cm) >= 0 ? "+" : ""}${(a.raw.wingspan_cm ?? a.raw.height_cm) - a.raw.height_cm} cm`}
              </span>
              {a.wingspanProxy && <span className="ml-2 text-amber-600 text-[10px]">⚠ Wingspan not recorded — using height as proxy</span>}
            </div>
            <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-2">
              Taller players (e.g. PV Sindhu at 179cm) gain reach advantage at net. Wingspan &gt; height is favourable for net coverage.
            </p>
          </div>
        </div>
      )}

      {/* ─── Tab: Physical Tests ───────────────────────────────────────── */}
      {tab === "physical" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-black text-xs uppercase tracking-wide mb-1">11-Test Physical Battery — Percentile Ranks</h3>
            <p className="text-[10px] text-muted-foreground mb-4">vs Indian Youth Badminton Norms · Red &lt;P25 · Yellow P25–P75 · Green &gt;P75</p>

            <div className="space-y-3">
              {physBarData.map(({ name, pct, raw, unit, available }) => {
                const colour = pct < 25 ? R : pct < 75 ? Au : G;
                return (
                  <div key={name} className={cn("p-3 rounded-lg", !available && "opacity-40")}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold">{name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        {raw !== undefined && (
                          <span className="text-muted-foreground font-mono">{typeof raw === "number" ? raw.toFixed(1) : raw} {unit}</span>
                        )}
                        <span className="font-black font-mono" style={{ color: available ? colour : Gr }}>
                          {available ? `${pct}th` : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${available ? pct : 0}%`, background: colour }} />
                      {/* P50 marker */}
                      <div className="absolute top-0 bottom-0 w-px bg-muted-foreground/30" style={{ left: "50%" }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>P0</span><span>P25</span><span>P50</span><span>P75</span><span>P100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/30 text-[10px] text-muted-foreground space-y-0.5">
              <div className="font-semibold text-foreground mb-1">Norm Reference</div>
              <div>Reference: Indian youth badminton research + EUROFIT protocols.</div>
              <div>PGBA may update these norms using academy-specific cohort data.</div>
              <div className="mt-1">Sources: TISTI 2025 (reaction time) · BWF 2008 (beep test, grip, throw) · PMC 2022 (agility, jump, endurance) · EUROFIT (flexibility)</div>
            </div>
          </div>

          {/* Secondary Indicators */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-black text-xs uppercase tracking-wide mb-1">Secondary AHP Indicators</h3>
            <p className="text-[10px] text-muted-foreground mb-4">PMC 2024 weights · contribute to BII score</p>
            <div className="space-y-3">
              {[
                { label: "Agility",         value: a.secondary.agility,   weight: 0.223, colour: G,  desc: "4-corner + 10×5m shuttle mean" },
                { label: "Strength",        value: a.secondary.strength,  weight: 0.217, colour: Au, desc: "VJ + broad jump + grip mean" },
                { label: "Endurance",       value: a.secondary.endurance, weight: 0.210, colour: B,  desc: "Beep test + situps + pushups mean" },
                { label: "Flexibility",     value: a.secondary.flexibility,weight: 0.189,colour: Sk, desc: "Sit & reach" },
                { label: "Speed/Reaction",  value: a.secondary.speed,     weight: 0.161, colour: "#9333EA", desc: "Reaction time (inverted percentile)" },
              ].map(({ label, value, weight, colour, desc }) => (
                <div key={label} className="p-3 rounded-lg bg-muted/20">
                  <div className="flex justify-between text-xs mb-1.5">
                    <div>
                      <span className="font-bold">{label}</span>
                      <span className="text-muted-foreground ml-2 text-[10px]">{desc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">weight {weight}</span>
                      <span className="font-black font-mono" style={{ color: value !== undefined ? colour : Gr }}>
                        {value !== undefined ? `${value.toFixed(0)}th` : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: colour }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Skills ───────────────────────────────────────────────── */}
      {tab === "skills" && (
        <div className="space-y-4">
          {hasLeniency && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-sm text-amber-800 font-semibold">
              ⚠ Coach review recommended — all skill scores ≥ 9. Possible leniency bias. Please re-assess independently.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Skills bar chart */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-black text-xs uppercase tracking-wide mb-1">Gopichand Skill Assessment</h3>
              <p className="text-[10px] text-muted-foreground mb-4">8 dimensions weighted by PGBA methodology</p>
              <div className="space-y-2.5">
                {[
                  { key: "footwork_efficiency", label: "Footwork Efficiency", weight: 0.20, primary: true },
                  { key: "stroke_mechanics",    label: "Stroke Mechanics",    weight: 0.15, primary: false },
                  { key: "smash_quality",       label: "Smash Quality",       weight: 0.15, primary: false },
                  { key: "court_awareness",     label: "Court Awareness",     weight: 0.13, primary: false },
                  { key: "net_play",            label: "Net Play",            weight: 0.12, primary: false },
                  { key: "serve_accuracy",      label: "Serve Accuracy",      weight: 0.10, primary: false },
                  { key: "coachability",        label: "Coachability ★",      weight: 0.10, primary: true },
                  { key: "mental_resilience",   label: "Mental Resilience",   weight: 0.05, primary: false },
                ].map(({ key, label, weight, primary }) => {
                  const score = a.raw[key as keyof typeof a.raw] as number | undefined;
                  const pct   = score !== undefined ? score * 10 : undefined;
                  const colour = score !== undefined
                    ? score >= 8 ? G : score >= 6 ? Au : R
                    : Gr;

                  return (
                    <div key={key} className={cn("p-2.5 rounded-lg border", primary && !hasLeniency && "border-transparent", primary && hasLeniency && "border-amber-300 bg-amber-50")}
                      style={primary && !hasLeniency ? { borderColor: `${G}30`, background: `${G}06` } : {}}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-semibold", primary && "font-black")}>{label}</span>
                          <span className="text-[10px] text-muted-foreground">w={weight}</span>
                        </div>
                        <span className="font-black font-mono" style={{ color: colour }}>
                          {score !== undefined ? `${score}/10` : "—"}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct ?? 0}%`, background: colour }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SQ summary */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-wide">SQ Summary</h3>

              <div className="text-center py-6">
                <div className="text-6xl font-black font-mono" style={{ color: Au }}>
                  {a.sq.pct?.toFixed(1) ?? "—"}
                </div>
                <div className="text-sm font-bold mt-1" style={{ color: Au }}>Skill Quotient</div>
                <div className="text-xs text-muted-foreground mt-1">Coach Assessment Score (0–100 scale)</div>
                {a.sq.isPartial && (
                  <div className="mt-2 text-xs text-amber-600 font-semibold">⚠ Partial SQ — fewer than 6 skill scores entered</div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-xs">
                <div className="font-semibold">SQ Formula</div>
                <div className="text-muted-foreground text-[10px] space-y-0.5">
                  <div>SQ_raw = Σ(skill × weight) / Σweights</div>
                  <div>SQ_pct = SQ_raw × 10 → 0–100 scale</div>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
                  Footwork weighted highest (20%) per PGBA methodology. Coachability is a primary intake criterion at PGBA (Gopichand stated criterion).
                </div>
              </div>

              {/* RT quick callout */}
              {a.corrected.reaction_time_ms !== undefined && (
                <div className="p-3 rounded-lg border" style={{ borderColor: `${G}30`, background: `${G}08` }}>
                  <div className="text-xs font-bold mb-1" style={{ color: G }}>Reaction Time</div>
                  <div className="text-2xl font-black font-mono" style={{ color: G }}>{a.corrected.reaction_time_ms.toFixed(0)}ms</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{getRTZone(a.corrected.reaction_time_ms).label} zone · P50={a.raw.gender === "Male" ? 156 : 144}ms</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Data Quality ─────────────────────────────────────────── */}
      {tab === "quality" && (
        <div className="space-y-4">
          {/* Status header */}
          <div className={cn("rounded-xl p-4 border text-sm font-semibold",
            a.isBlocked ? "bg-red-50 border-red-200 text-red-700" : a.flags.length > 0 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-green-50 border-green-200 text-green-700"
          )}>
            {a.isBlocked ? "⛔ BLOCKED — this athlete has data errors that prevent scoring" :
             a.flags.length > 0 ? `⚠ ${a.flags.length} flag(s) detected — review before finalising scores` :
             "✅ All fields clean — no issues detected"}
          </div>

          {/* Legend */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-black text-xs uppercase tracking-wide mb-3">Flag Legend</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { icon: "✅", label: "Clean",          desc: "No issues detected",                  cls: "bg-green-50 border-green-200 text-green-700" },
                { icon: "🟠", label: "Auto-corrected", desc: "Value converted — review recommended", cls: "bg-amber-50 border-amber-200 text-amber-800" },
                { icon: "⚠",  label: "Verify",         desc: "Unusual value — coach to confirm",     cls: "bg-yellow-50 border-yellow-200 text-yellow-800" },
                { icon: "🔴", label: "Blocked",        desc: "Invalid data — cannot score",          cls: "bg-red-50 border-red-200 text-red-700" },
              ].map(({ icon, label, desc, cls }) => (
                <div key={label} className={cn("flex items-center gap-2 p-2 rounded-lg border", cls)}>
                  <span>{icon}</span>
                  <div>
                    <div className="font-bold">{label}</div>
                    <div className="text-[10px]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flag detail */}
          {a.flags.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground text-sm">
              ✅ All 31 fields passed validation. No flags or corrections applied.
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="font-black text-xs uppercase tracking-wide mb-3">Flag Audit Log</h3>
              {a.flags.map((flag) => {
                const isBlocked = flag.startsWith("BLOCKED");
                const isAuto    = flag.startsWith("AUTO_");
                const cls = isBlocked ? "bg-red-50 border-red-200 text-red-700"
                          : isAuto    ? "bg-amber-50 border-amber-200 text-amber-800"
                          :             "bg-yellow-50 border-yellow-200 text-yellow-800";
                return (
                  <div key={flag} className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-xs font-medium", cls)}>
                    <span className="flex-shrink-0">{isBlocked ? "🔴" : isAuto ? "🟠" : "⚠"}</span>
                    <div>
                      <div className="font-bold font-mono mb-0.5">{flag}</div>
                      <div>{FLAG_DESC[flag] ?? flag}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Field completeness */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-black text-xs uppercase tracking-wide mb-3">Assessment Completeness</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: "Physical Tests", present: a.bii.physicalTestCount, total: 11 },
                { label: "Skill Scores",   present: [a.raw.footwork_efficiency, a.raw.stroke_mechanics, a.raw.smash_quality, a.raw.net_play, a.raw.serve_accuracy, a.raw.court_awareness, a.raw.coachability, a.raw.mental_resilience].filter(Boolean).length, total: 8 },
                { label: "Identity",       present: [a.raw.name, a.raw.date_of_birth, a.raw.gender, a.raw.dominant_hand, a.raw.coach_name].filter(Boolean).length, total: 5 },
              ].map(({ label, present, total }) => {
                const pct = Math.round((present / total) * 100);
                const colour = pct >= 80 ? G : pct >= 50 ? Au : R;
                return (
                  <div key={label} className="p-3 rounded-lg bg-muted/30">
                    <div className="font-semibold mb-1">{label}</div>
                    <div className="text-2xl font-black font-mono" style={{ color: colour }}>{present}/{total}</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
