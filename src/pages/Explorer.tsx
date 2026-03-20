import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAthletes } from "@/hooks/useAthletes";
import { useT } from "@/i18n/useTranslation";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import {
  KPICard, DataQualityBadge, BenchmarkBadge, FlagBadge, EmptyState, PageHeader,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Users, Star, AlertTriangle, CheckCircle2, Search, SlidersHorizontal,
  ChevronDown, ChevronUp, X, ArrowUpDown, ChevronRight, Upload,
  BarChart3, GitCompare, ChevronLeft, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Filters {
  search: string;
  dataset: "all" | "male" | "female";
  quickFilter: "all" | "male" | "female" | "underweight" | "highPotential" | "flagged";
  ageMin: number;
  ageMax: number;
  sport: string;
  school: string;
  advancedOpen: boolean;
}

type SortKey = keyof EnrichedAthlete | "compositeScore" | "topSport";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

// ─── Component ─────────────────────────────────────────────────────────────
export default function ExplorerPage() {
  const { athletes, loading } = useAthletes();
  const { dict, language } = useT();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    dataset: "all",
    quickFilter: "all",
    ageMin: 8,
    ageMax: 25,
    sport: "all",
    school: "all",
    advancedOpen: false,
  });
  const [sortKey, setSortKey] = useState<SortKey>("compositeScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const e = dict.explorer;
  const m = dict.metrics;

  // Unique schools
  const schools = useMemo(() => {
    const s = new Set(athletes.map((a) => a.school));
    return Array.from(s).sort();
  }, [athletes]);

  // Unique sports
  const sports = useMemo(() => {
    const s = new Set(athletes.map((a) => a.topSport).filter(Boolean));
    return Array.from(s).sort();
  }, [athletes]);

  // Filtered athletes
  const filtered = useMemo(() => {
    let pool = [...athletes];
    const q = filters.search.toLowerCase();
    if (q) pool = pool.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    if (filters.dataset === "male") pool = pool.filter((a) => a.gender === "M");
    if (filters.dataset === "female") pool = pool.filter((a) => a.gender === "F");
    switch (filters.quickFilter) {
      case "male": pool = pool.filter((a) => a.gender === "M"); break;
      case "female": pool = pool.filter((a) => a.gender === "F"); break;
      case "underweight": pool = pool.filter((a) => a.flags?.some((f) => f.type === "underweight")); break;
      case "highPotential": pool = pool.filter((a) => a.isHighPotential); break;
      case "flagged": pool = pool.filter((a) => (a.flags?.length ?? 0) > 0); break;
    }
    pool = pool.filter((a) => a.age >= filters.ageMin && a.age <= filters.ageMax);
    if (filters.sport !== "all") pool = pool.filter((a) => a.topSport === filters.sport);
    if (filters.school !== "all") pool = pool.filter((a) => a.school === filters.school);

    // Sort
    pool.sort((a, b) => {
      const va = a[sortKey as keyof EnrichedAthlete] as number | string ?? 0;
      const vb = b[sortKey as keyof EnrichedAthlete] as number | string ?? 0;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return pool;
  }, [athletes, filters, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const summary = useMemo(() => ({
    total: athletes.length,
    eligible: athletes.filter((a) => (a.completeness ?? 0) >= 60).length,
    highPotential: athletes.filter((a) => a.isHighPotential).length,
    avgCompleteness: Math.round(athletes.reduce((s, a) => s + (a.completeness ?? 0), 0) / Math.max(athletes.length, 1)),
  }), [athletes]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  }, [sortKey]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const compareAthletes = athletes.filter((a) => selected.has(a.id));

  const activeFilterCount = [
    filters.quickFilter !== "all",
    filters.ageMin !== 8 || filters.ageMax !== 25,
    filters.sport !== "all",
    filters.school !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters((f) => ({ ...f, quickFilter: "all", ageMin: 8, ageMax: 25, sport: "all", school: "all" }));
    setPage(0);
  };

  const COLS: Array<{ key: string; label: string; sortKey?: SortKey; width?: string }> = [
    { key: "id", label: e.columns.id, sortKey: "id", width: "w-20" },
    { key: "name", label: e.columns.name, sortKey: "name", width: "w-36" },
    { key: "gender", label: e.columns.gender, sortKey: "gender", width: "w-16" },
    { key: "age", label: e.columns.age, sortKey: "age", width: "w-14" },
    { key: "height", label: e.columns.height, sortKey: "height", width: "w-20" },
    { key: "weight", label: e.columns.weight, sortKey: "weight", width: "w-20" },
    { key: "bmi", label: e.columns.bmi, sortKey: "bmi", width: "w-16" },
    { key: "verticalJump", label: e.columns.verticalJump, sortKey: "verticalJump", width: "w-20" },
    { key: "broadJump", label: e.columns.broadJump, sortKey: "broadJump", width: "w-20" },
    { key: "sprint30m", label: e.columns.sprint30m, sortKey: "sprint30m", width: "w-22" },
    { key: "run800m", label: e.columns.run800m, sortKey: "run800m", width: "w-22" },
    { key: "compositeScore", label: e.columns.compositeScore, sortKey: "compositeScore", width: "w-18" },
    { key: "topSport", label: e.columns.topSport, sortKey: "topSport", width: "w-28" },
    { key: "completeness", label: e.columns.completeness, width: "w-20" },
    { key: "flags", label: e.columns.flags, width: "w-24" },
  ];

  const visibleCols = COLS.filter((c) => !hiddenCols.has(c.key));

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 shrink-0">
        <PageHeader
          title={e.title}
          subtitle={e.subtitle}
          actions={
            <Select
              value={filters.dataset}
              onValueChange={(v) => { setFilters((f) => ({ ...f, dataset: v as Filters["dataset"] })); setPage(0); }}
            >
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{e.allDataset}</SelectItem>
                <SelectItem value="male">{e.maleCohort}</SelectItem>
                <SelectItem value="female">{e.femaleCohort}</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KPICard label={e.totalAthletes} value={summary.total} icon={Users} iconColor="#1E3A5F" />
          <KPICard label={e.eligibleAthletes} value={summary.eligible} icon={CheckCircle2} iconColor="#16A34A" />
          <KPICard label={e.highPotential} value={summary.highPotential} icon={Star} iconColor="#D97706" />
          <KPICard label={e.avgCompleteness} value={`${summary.avgCompleteness}%`} icon={BarChart3} iconColor="#7C3AED" />
        </div>

        {/* Search + Quick Filters */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={e.searchPlaceholder}
              value={filters.search}
              onChange={(ev) => { setFilters((f) => ({ ...f, search: ev.target.value })); setPage(0); }}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "male", "female", "highPotential", "underweight", "flagged"] as const).map((qf) => {
              const labels: Record<string, string> = {
                all: dict.common.all, male: dict.common.male, female: dict.common.female,
                highPotential: e.highPotential, underweight: e.flagTypes.underweight,
                flagged: dict.common.flagged,
              };
              return (
                <button
                  key={qf}
                  onClick={() => { setFilters((f) => ({ ...f, quickFilter: qf })); setPage(0); }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                    filters.quickFilter === qf
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  )}
                >
                  {labels[qf]}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Column toggle */}
          <Select value="cols" onValueChange={() => {}}>
            <SelectTrigger className="w-36 h-8 text-xs" onClick={(e) => e.preventDefault()}>
              <Eye size={12} className="mr-1" />
              <span>Columns</span>
            </SelectTrigger>
            <SelectContent>
              {COLS.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted select-none"
                  onClick={() => {
                    setHiddenCols((prev) => {
                      const next = new Set(prev);
                      if (next.has(col.key)) next.delete(col.key);
                      else next.add(col.key);
                      return next;
                    });
                  }}
                >
                  <Checkbox checked={!hiddenCols.has(col.key)} className="h-3.5 w-3.5" onCheckedChange={() => {}} />
                  <span className="text-xs">{col.label}</span>
                </div>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced filters toggle */}
          <Button
            variant={filters.advancedOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setFilters((f) => ({ ...f, advancedOpen: !f.advancedOpen }))}
          >
            <SlidersHorizontal size={14} />
            <span className="text-xs">{e.advancedFilters}</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-0.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X size={12} className="mr-1" /> {dict.common.clearAll}
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {filters.advancedOpen && (
          <div className="bg-muted/40 border rounded-lg p-4 mb-2 grid grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {e.ageRange}: {filters.ageMin}–{filters.ageMax} {dict.common.years}
              </label>
              <div className="px-1">
                <Slider
                  min={8} max={25} step={1}
                  value={[filters.ageMin, filters.ageMax]}
                  onValueChange={([lo, hi]) => { setFilters((f) => ({ ...f, ageMin: lo, ageMax: hi })); setPage(0); }}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{e.sportFit}</label>
              <Select value={filters.sport} onValueChange={(v) => { setFilters((f) => ({ ...f, sport: v })); setPage(0); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={dict.common.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.common.all}</SelectItem>
                  {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{e.schoolFilter}</label>
              <Select value={filters.school} onValueChange={(v) => { setFilters((f) => ({ ...f, school: v })); setPage(0); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={dict.common.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.common.all}</SelectItem>
                  {schools.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Results bar */}
      <div className="px-6 py-1.5 border-b bg-muted/30 flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">
          {filtered.length} {dict.common.of} {athletes.length} athletes
        </span>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} {e.selected}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={() => setCompareOpen(true)}
            >
              <GitCompare size={12} />
              {e.compareSelected} ({selected.size})
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelected(new Set())}>
              <X size={12} />
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={e.emptyState.title}
            subtitle={e.emptyState.subtitle}
            action={
              <Button size="sm" onClick={() => navigate("/import")}>
                <Upload size={14} className="mr-1" />
                {e.emptyState.importCTA}
              </Button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b z-10">
              <tr>
                <th className="w-8 px-2 py-2.5 text-left">
                  <Checkbox
                    checked={paginated.length > 0 && paginated.every((a) => selected.has(a.id))}
                    onCheckedChange={(c) => {
                      if (c) setSelected(new Set([...selected, ...paginated.map((a) => a.id)]));
                      else setSelected(new Set([...selected].filter((id) => !paginated.some((a) => a.id === id))));
                    }}
                    className="h-3.5 w-3.5"
                  />
                </th>
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                      col.sortKey && "cursor-pointer hover:text-foreground select-none"
                    )}
                    onClick={() => col.sortKey && handleSort(col.sortKey)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortKey && sortKey === col.sortKey && (
                        sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                      )}
                      {col.sortKey && sortKey !== col.sortKey && (
                        <ArrowUpDown size={11} className="opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((athlete, rowIdx) => (
                <tr
                  key={athlete.id}
                  className={cn(
                    "border-b table-row-hover",
                    rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20",
                    selected.has(athlete.id) && "bg-primary/5"
                  )}
                >
                  <td className="px-2 py-2">
                    <Checkbox
                      checked={selected.has(athlete.id)}
                      onCheckedChange={(c) => handleSelect(athlete.id, !!c)}
                      className="h-3.5 w-3.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-2 text-xs"
                      onClick={() => navigate(`/athlete/${athlete.id}`)}
                    >
                      {renderCell(col.key, athlete)}
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button
                      onClick={() => navigate(`/athlete/${athlete.id}`)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-card flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} {dict.common.of} {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={12} />
            </Button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-7 w-7 rounded text-xs font-medium transition-colors",
                    p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {p + 1}
                </button>
              );
            })}
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Drawer */}
      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <GitCompare size={18} />
              {dict.explorer.comparisonDrawer.title}
            </SheetTitle>
          </SheetHeader>
          <ComparisonPanel athletes={compareAthletes} dict={dict} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Cell Renderer ─────────────────────────────────────────────────────────
function renderCell(key: string, a: EnrichedAthlete): React.ReactNode {
  switch (key) {
    case "id": return <span className="font-mono text-[10px] text-muted-foreground">{a.id}</span>;
    case "name": return <span className="font-medium text-xs">{a.name}</span>;
    case "gender":
      return (
        <span className={cn("font-semibold", a.gender === "M" ? "text-blue-600" : "text-pink-600")}>
          {a.gender === "M" ? "♂ M" : "♀ F"}
        </span>
      );
    case "age": return <span>{a.age}y</span>;
    case "height": return <span>{a.height}</span>;
    case "weight": return <span>{a.weight}</span>;
    case "bmi": return <span>{a.bmi?.toFixed(1) ?? "—"}</span>;
    case "verticalJump": return <span>{a.verticalJump?.toFixed(1) ?? <span className="text-muted-foreground">—</span>}</span>;
    case "broadJump": return <span>{a.broadJump?.toFixed(1) ?? <span className="text-muted-foreground">—</span>}</span>;
    case "sprint30m": return <span>{a.sprint30m?.toFixed(2) ?? <span className="text-muted-foreground">—</span>}</span>;
    case "run800m": return <span>{a.run800m ? `${Math.floor(a.run800m / 60)}:${String(a.run800m % 60).padStart(2, "0")}` : <span className="text-muted-foreground">—</span>}</span>;
    case "compositeScore":
      return (
        <span className={cn(
          "font-bold tabular-nums",
          a.compositeScore >= 70 ? "text-green-600" : a.compositeScore >= 50 ? "text-yellow-600" : "text-red-500"
        )}>
          {a.compositeScore}
        </span>
      );
    case "topSport":
      return (
        <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium">
          {a.topSport}
        </span>
      );
    case "completeness": return <DataQualityBadge score={a.completeness ?? 0} />;
    case "flags":
      return (
        <div className="flex flex-wrap gap-0.5">
          {(a.flags ?? []).slice(0, 2).map((f, i) => <FlagBadge key={i} type={f.type} />)}
        </div>
      );
    default: return null;
  }
}

// ─── Comparison Panel ─────────────────────────────────────────────────────
function ComparisonPanel({ athletes, dict }: { athletes: EnrichedAthlete[]; dict: ReturnType<typeof useT>["dict"] }) {
  if (athletes.length === 0) return (
    <div className="text-sm text-muted-foreground text-center py-8">Select athletes from the table to compare</div>
  );

  const metrics: Array<{ key: keyof EnrichedAthlete; label: string; unit: string }> = [
    { key: "age", label: "Age", unit: "y" },
    { key: "height", label: "Height", unit: "cm" },
    { key: "weight", label: "Weight", unit: "kg" },
    { key: "bmi", label: "BMI", unit: "" },
    { key: "verticalJump", label: "V. Jump", unit: "cm" },
    { key: "broadJump", label: "B. Jump", unit: "cm" },
    { key: "sprint30m", label: "30m Sprint", unit: "s" },
    { key: "run800m", label: "800m Run", unit: "s" },
    { key: "compositeScore", label: "Composite Score", unit: "" },
  ];

  return (
    <div className="overflow-x-auto">
      {/* Athlete headers */}
      <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `140px repeat(${athletes.length}, 1fr)` }}>
        <div />
        {athletes.map((a) => (
          <div key={a.id} className="text-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1",
                a.gender === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
              )}
            >
              {a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="text-xs font-semibold">{a.name.split(" ")[0]}</div>
            <div className="text-[10px] text-muted-foreground">{a.id}</div>
          </div>
        ))}
      </div>

      {/* Metrics grid */}
      {metrics.map((m, i) => {
        const values = athletes.map((a) => a[m.key] as number | undefined);
        const best = values.reduce((b, v) => {
          if (v == null) return b;
          const lowerBetter = m.key === "sprint30m" || m.key === "run800m";
          return b == null || (lowerBetter ? v < b : v > b) ? v : b;
        }, undefined as number | undefined);

        return (
          <div
            key={m.key}
            className={cn(
              "grid gap-2 py-2 border-b last:border-0",
              i % 2 === 0 && "bg-muted/20 -mx-1 px-1 rounded"
            )}
            style={{ gridTemplateColumns: `140px repeat(${athletes.length}, 1fr)` }}
          >
            <div className="text-xs font-medium text-muted-foreground self-center">{m.label}</div>
            {athletes.map((a) => {
              const v = a[m.key] as number | undefined;
              const isBest = v != null && v === best;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "text-sm font-medium text-center py-1 rounded",
                    isBest && "bg-green-50 text-green-700 font-bold"
                  )}
                >
                  {v != null ? `${typeof v === "number" ? v.toFixed(m.key === "sprint30m" ? 2 : 1) : v} ${m.unit}` : "—"}
                  {isBest && <span className="text-[10px] ml-0.5">★</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
