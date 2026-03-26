// ─── Badminton Explorer ───────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete, AgeBand, Gender, QuadrantLabel } from "../types";
import { cn } from "@/lib/utils";

const G  = "#1A5C38";
const Au = "#D4A017";
const B  = "#1D4ED8";
const Sk = "#15803D";
const Gr = "#6B7280";
const R  = "#C0392B";

const Q_COLOUR: Record<QuadrantLabel, string> = {
  CHAMPION_PROFILE:    Au,
  RAW_PHYSICAL_TALENT: B,
  SKILL_FIRST:         Sk,
  EARLY_DEVELOPMENT:   Gr,
};
const Q_LABEL: Record<QuadrantLabel, string> = {
  CHAMPION_PROFILE:    "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST:         "Skill First",
  EARLY_DEVELOPMENT:   "Early Dev",
};

type SortKey = "rank" | "bii" | "sq" | "rt" | "agility" | "strength" | "endurance";
type SortDir = "asc" | "desc";

function MiniPercBar({ value, colour = G }: { value?: number; colour?: string }) {
  if (value === undefined) return <span className="text-muted-foreground text-xs font-mono">—</span>;
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: colour }} />
      </div>
      <span className="font-mono text-xs w-6 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function BadmintonExplorer() {
  const navigate = useNavigate();
  const all = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);

  const [search, setSearch]     = useState("");
  const [band, setBand]         = useState<AgeBand | "All">("All");
  const [gender, setGender]     = useState<Gender | "All">("All");
  const [quad, setQuad]         = useState<QuadrantLabel | "All">("All");
  const [flags, setFlags]       = useState<"All" | "Flagged" | "Blocked">("All");
  const [sortKey, setSortKey]   = useState<SortKey>("rank");
  const [sortDir, setSortDir]   = useState<SortDir>("asc");

  const rankMap = useMemo(() => {
    const m: Record<string, number> = {};
    all.filter((a) => !a.isBlocked && a.bii.bii !== undefined).forEach((a, i) => { m[a.raw.id] = i + 1; });
    return m;
  }, [all]);

  const filtered = useMemo(() => {
    let list = all.filter((a) => {
      if (search && !a.raw.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (band !== "All" && a.age_band !== band) return false;
      if (gender !== "All" && a.raw.gender !== gender) return false;
      if (quad !== "All" && a.quadrant !== quad) return false;
      if (flags === "Blocked" && !a.isBlocked) return false;
      if (flags === "Flagged" && (a.isBlocked || !a.flags.some((f) => f.startsWith("VERIFY_") || f.startsWith("AUTO_")))) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "bii":      av = a.bii.bii ?? -1; bv = b.bii.bii ?? -1; break;
        case "sq":       av = a.sq.pct ?? -1; bv = b.sq.pct ?? -1; break;
        case "rt":       av = a.corrected.reaction_time_ms ?? 9999; bv = b.corrected.reaction_time_ms ?? 9999; break;
        case "agility":  av = a.secondary.agility ?? -1; bv = b.secondary.agility ?? -1; break;
        case "strength": av = a.secondary.strength ?? -1; bv = b.secondary.strength ?? -1; break;
        case "endurance":av = a.secondary.endurance ?? -1; bv = b.secondary.endurance ?? -1; break;
        default:         av = rankMap[a.raw.id] ?? 9999; bv = rankMap[b.raw.id] ?? 9999;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [all, search, band, gender, quad, flags, sortKey, sortDir, rankMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortTh({ label, k, right = false }: { label: string; k: SortKey; right?: boolean }) {
    const active = sortKey === k;
    return (
      <th
        className={cn("px-3 py-3 text-[11px] font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap", right ? "text-right" : "text-left")}
        onClick={() => toggleSort(k)}
      >
        {label}
        <span className="ml-1 opacity-50">{active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
      </th>
    );
  }

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors", active
        ? "bg-foreground text-background border-foreground"
        : "bg-background text-muted-foreground border-border hover:border-foreground/40")}
    >
      {label}
    </button>
  );

  // Summary stats
  const visibleScored = filtered.filter((a) => !a.isBlocked && a.bii.bii !== undefined);
  const avgBII = visibleScored.length ? (visibleScored.reduce((s, a) => s + (a.bii.bii ?? 0), 0) / visibleScored.length).toFixed(1) : "—";
  const avgSQ  = visibleScored.length ? (visibleScored.reduce((s, a) => s + (a.sq.pct ?? 0), 0) / visibleScored.length).toFixed(1) : "—";

  return (
    <div className="p-5 space-y-4">

      {/* ─── Search + Filters ──────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athlete name…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {all.length} · avg BII <span className="font-mono font-semibold">{avgBII}</span> · avg SQ <span className="font-mono font-semibold">{avgSQ}</span>
            </span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {(["All", "U10", "U12", "U14", "U16"] as const).map((v) => (
              <FilterChip key={v} label={v} active={band === v} onClick={() => setBand(v as AgeBand | "All")} />
            ))}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="flex gap-1">
            {(["All", "Male", "Female"] as const).map((v) => (
              <FilterChip key={v} label={v} active={gender === v} onClick={() => setGender(v as Gender | "All")} />
            ))}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Quadrant:</span>
            {([
              { v: "All" as const,               label: "All Profiles",   desc: null },
              { v: "CHAMPION_PROFILE" as const,   label: "Champion",       desc: "BII ≥ 60 & SQ ≥ 60 — elite physical + skill" },
              { v: "RAW_PHYSICAL_TALENT" as const,label: "Raw Talent",     desc: "BII ≥ 60 & SQ < 60 — strong physique, skill needs development" },
              { v: "SKILL_FIRST" as const,        label: "Skill First",    desc: "BII < 60 & SQ ≥ 60 — high skill, physical conditioning needed" },
              { v: "EARLY_DEVELOPMENT" as const,  label: "Early Dev",      desc: "BII < 60 & SQ < 60 — foundational stage, full development needed" },
            ]).map(({ v, label, desc }) => (
              <div key={v} className="relative group">
                <FilterChip label={label} active={quad === v} onClick={() => setQuad(v)} />
                {desc && (
                  <div className="absolute bottom-full left-0 mb-1.5 z-20 hidden group-hover:block pointer-events-none">
                    <div className="bg-foreground text-background text-[10px] rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg max-w-[240px] leading-relaxed">
                      <div className="font-semibold mb-0.5">{label}</div>
                      <div className="font-mono opacity-80">{desc}</div>
                    </div>
                    <div className="w-2 h-2 bg-foreground rotate-45 ml-3 -mt-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="flex gap-1">
            {(["All", "Flagged", "Blocked"] as const).map((v) => (
              <FilterChip key={v} label={v} active={flags === v} onClick={() => setFlags(v)} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <SortTh label="Rank" k="rank" />
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground">Athlete</th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground">Batch</th>
                <SortTh label="BII" k="bii" right />
                <SortTh label="SQ" k="sq" right />
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground">Quadrant</th>
                <SortTh label="Agility Pct." k="agility" right />
                <SortTh label="Strength Pct." k="strength" right />
                <SortTh label="RT (ms)" k="rt" right />
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const rank = rankMap[a.raw.id];
                const blocked = a.isBlocked;
                const hasAuto = a.flags.some((f) => f.startsWith("AUTO_"));
                const hasVerify = a.flags.some((f) => f.startsWith("VERIFY_"));
                const rowCls = blocked
                  ? "bg-red-50/60 border-l-2 border-l-red-500"
                  : hasAuto || hasVerify ? "bg-amber-50/40" : "";

                return (
                  <tr key={a.raw.id}
                    className={cn("border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/40", rowCls)}
                    onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}>

                    <td className="px-3 py-2.5 text-center">
                      {blocked ? (
                        <span className="text-red-500 font-mono text-xs">—</span>
                      ) : rank ? (
                        <span className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mx-auto",
                          rank === 1 ? "text-white" : rank <= 3 ? "text-white" : "bg-muted text-muted-foreground"
                        )} style={{ background: rank === 1 ? Au : rank === 2 ? "#9CA3AF" : rank === 3 ? "#D97706" : undefined }}>
                          {rank}
                        </span>
                      ) : <span className="text-muted-foreground font-mono text-xs">—</span>}
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-sm">{a.raw.name}</div>
                      <div className="text-[10px] text-muted-foreground">{a.age_band} · {a.raw.gender} · {a.raw.dominant_hand} hand</div>
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="text-[10px] text-muted-foreground">{a.raw.academy_batch}</span>
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {blocked ? (
                        <span className="text-red-500 text-xs font-mono">⛔</span>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-black font-mono text-sm" style={{ color: G }}>{a.bii.bii?.toFixed(1) ?? "—"}</span>
                          {a.bii.bii !== undefined && (
                            <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${a.bii.bii}%`, background: G }} />
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-sm" style={{ color: Au }}>{a.sq.pct?.toFixed(1) ?? "—"}</span>
                        {a.sq.pct !== undefined && (
                          <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${a.sq.pct}%`, background: Au }} />
                          </div>
                        )}
                        {a.sq.isPartial && <span className="text-[9px] text-amber-600">partial</span>}
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      {a.quadrant ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: Q_COLOUR[a.quadrant], background: `${Q_COLOUR[a.quadrant]}15`, border: `1px solid ${Q_COLOUR[a.quadrant]}30` }}>
                          {Q_LABEL[a.quadrant]}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <MiniPercBar value={a.secondary.agility} colour={G} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <MiniPercBar value={a.secondary.strength} colour={Au} />
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono text-xs">
                      {a.corrected.reaction_time_ms !== undefined ? (
                        <span className={cn(
                          a.corrected.reaction_time_ms < 130 ? "text-green-700 font-bold" :
                          a.corrected.reaction_time_ms < 170 ? "text-yellow-700" :
                          a.corrected.reaction_time_ms < 220 ? "text-orange-600" : "text-red-600"
                        )}>{a.corrected.reaction_time_ms.toFixed(0)}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {blocked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">⛔ BLOCKED</span>}
                        {!blocked && hasAuto && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🟠 Fixed</span>}
                        {!blocked && hasVerify && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">⚠ Verify</span>}
                        {!blocked && a.flags.length === 0 && <span className="text-[9px] text-green-700">✅</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-muted-foreground py-10 text-sm">
                  No athletes match the current filters.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t bg-muted/20 flex justify-between">
          <span>Default sort: BII descending · Ties broken by reaction time · * = Partial SQ (&lt;6 skill scores)</span>
          <span>Click column headers to sort ↑↓</span>
        </div>
      </div>
    </div>
  );
}
