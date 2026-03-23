// ─── Badminton Explorer ───────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { processAll, rankAthletes } from "../engine";
import { SEED_ATHLETES } from "../data/athletes";
import type { ProcessedBadmintonAthlete, AgeBand, Gender, QuadrantLabel } from "../types";
import { cn } from "@/lib/utils";

const COURT_GREEN = "#1A5C38";
const QUADRANT_LABELS: Record<QuadrantLabel, string> = {
  CHAMPION_PROFILE: "Champion Profile",
  RAW_PHYSICAL_TALENT: "Raw Physical Talent",
  SKILL_FIRST: "Skill First",
  EARLY_DEVELOPMENT: "Early Development",
};

const QUADRANT_COLOURS: Record<QuadrantLabel, string> = {
  CHAMPION_PROFILE: "text-yellow-600 bg-yellow-50",
  RAW_PHYSICAL_TALENT: "text-blue-600 bg-blue-50",
  SKILL_FIRST: "text-green-700 bg-green-50",
  EARLY_DEVELOPMENT: "text-gray-500 bg-gray-100",
};

function getFlagBadges(a: ProcessedBadmintonAthlete) {
  if (a.isBlocked) return "BLOCKED";
  const hasAuto = a.flags.some((f) => f.startsWith("AUTO_"));
  const hasVerify = a.flags.some((f) => f.startsWith("VERIFY_"));
  if (hasAuto && hasVerify) return "BOTH";
  if (hasAuto) return "AUTO";
  if (hasVerify) return "VERIFY";
  return "CLEAN";
}

export default function BadmintonExplorer() {
  const navigate = useNavigate();
  const allAthletes = useMemo(() => rankAthletes(processAll(SEED_ATHLETES)), []);

  const [ageBandFilter, setAgeBandFilter] = useState<AgeBand | "All">("All");
  const [genderFilter, setGenderFilter] = useState<Gender | "All">("All");
  const [quadFilter, setQuadFilter] = useState<QuadrantLabel | "All">("All");
  const [flagFilter, setFlagFilter] = useState<"All" | "Flagged" | "Blocked">("All");

  const filtered = useMemo(() => {
    return allAthletes.filter((a) => {
      if (ageBandFilter !== "All" && a.age_band !== ageBandFilter) return false;
      if (genderFilter !== "All" && a.raw.gender !== genderFilter) return false;
      if (quadFilter !== "All" && a.quadrant !== quadFilter) return false;
      if (flagFilter === "Blocked" && !a.isBlocked) return false;
      if (flagFilter === "Flagged" && a.isBlocked) return false;
      if (flagFilter === "Flagged" && !a.flags.some((f) => f.startsWith("VERIFY_") || f.startsWith("AUTO_"))) return false;
      return true;
    });
  }, [allAthletes, ageBandFilter, genderFilter, quadFilter, flagFilter]);

  const FilterSelect = ({ label, value, onChange, options }: {
    label: string; value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  // Compute rank in full list
  const rankMap = useMemo(() => {
    const m: Record<string, number> = {};
    allAthletes.forEach((a, i) => { m[a.raw.id] = i + 1; });
    return m;
  }, [allAthletes]);

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="text-xl">🏸</span>
        <div>
          <h1 className="text-lg font-bold" style={{ color: COURT_GREEN }}>ATHLETE EXPLORER</h1>
          <p className="text-xs text-muted-foreground">PGBA Hyderabad — {allAthletes.length} athletes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl border bg-card">
        <FilterSelect label="Age Band" value={ageBandFilter} onChange={(v) => setAgeBandFilter(v as AgeBand | "All")}
          options={[{ value: "All", label: "All Bands" }, ...["U10", "U12", "U14", "U16"].map((b) => ({ value: b, label: b }))]} />
        <FilterSelect label="Gender" value={genderFilter} onChange={(v) => setGenderFilter(v as Gender | "All")}
          options={[{ value: "All", label: "All" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
        <FilterSelect label="Quadrant" value={quadFilter} onChange={(v) => setQuadFilter(v as QuadrantLabel | "All")}
          options={[
            { value: "All", label: "All Quadrants" },
            { value: "CHAMPION_PROFILE", label: "Champion Profile" },
            { value: "RAW_PHYSICAL_TALENT", label: "Raw Physical Talent" },
            { value: "SKILL_FIRST", label: "Skill First" },
            { value: "EARLY_DEVELOPMENT", label: "Early Development" },
          ]} />
        <FilterSelect label="Flags" value={flagFilter} onChange={(v) => setFlagFilter(v as "All" | "Flagged" | "Blocked")}
          options={[{ value: "All", label: "All Athletes" }, { value: "Flagged", label: "Flagged Only" }, { value: "Blocked", label: "Blocked Only" }]} />
        <div className="flex items-end">
          <span className="text-xs text-muted-foreground self-center">
            Showing {filtered.length} of {allAthletes.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground w-12">Rank</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Band</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Gender</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">BII</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">SQ</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Quadrant</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">RT (ms)</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Agility</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const flagType = getFlagBadges(a);
                const rowCls = a.isBlocked
                  ? "bg-red-50 border-l-4 border-l-red-500"
                  : flagType === "AUTO" || flagType === "BOTH" || flagType === "VERIFY"
                  ? "bg-amber-50"
                  : "";

                return (
                  <tr
                    key={a.raw.id}
                    className={cn(
                      "border-b border-border/60 cursor-pointer transition-colors hover:bg-muted/50",
                      rowCls
                    )}
                    onClick={() => navigate(`/sports/badminton/athlete/${a.raw.id}`)}
                  >
                    <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                      {a.isBlocked ? "—" : rankMap[a.raw.id]}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{a.raw.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{a.age_band}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{a.raw.gender}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      {a.isBlocked ? <span className="text-red-500">⛔</span> :
                        a.bii.bii !== undefined ? a.bii.bii.toFixed(1) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {a.sq.pct !== undefined ? a.sq.pct.toFixed(1) : <span className="text-muted-foreground">—</span>}
                      {a.sq.isPartial && <span className="text-[10px] text-muted-foreground ml-0.5">*</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {a.quadrant ? (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", QUADRANT_COLOURS[a.quadrant])}>
                          {QUADRANT_LABELS[a.quadrant]}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">
                      {a.corrected.reaction_time_ms !== undefined
                        ? a.corrected.reaction_time_ms.toFixed(0)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">
                      {a.secondary.agility !== undefined
                        ? `${a.secondary.agility.toFixed(0)}th`
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {a.isBlocked && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">⛔ Data Issue</span>
                        )}
                        {!a.isBlocked && a.flags.some((f) => f.startsWith("AUTO_")) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400 text-amber-900">🟠 Auto-fixed</span>
                        )}
                        {!a.isBlocked && a.flags.some((f) => f.startsWith("VERIFY_")) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800">⚠ Verify</span>
                        )}
                        {!a.isBlocked && a.flags.length === 0 && (
                          <span className="text-[10px] text-muted-foreground">✅</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-muted-foreground py-8 text-sm">
                    No athletes match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border bg-muted/20">
          Default sort: BII descending · Ties broken by reaction time (faster = higher rank) · * = Partial SQ (fewer than 6 skill scores)
        </div>
      </div>
    </div>
  );
}
