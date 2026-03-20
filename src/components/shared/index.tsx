import React from "react";
import { cn } from "@/lib/utils";
import { BenchmarkBand, BENCHMARK_COLORS } from "@/engine/analyticsEngine";

// ─── Benchmark Band Badge ──────────────────────────────────────────────────
export function BenchmarkBadge({ band, label }: { band: BenchmarkBand; label: string }) {
  const cls: Record<BenchmarkBand, string> = {
    excellent: "metric-badge-excellent",
    aboveAvg: "metric-badge-above-avg",
    average: "metric-badge-average",
    belowAvg: "metric-badge-below-avg",
    development: "metric-badge-development",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", cls[band])}>
      {label}
    </span>
  );
}

// ─── Percentile Bar ────────────────────────────────────────────────────────
export function PercentileBar({
  percentile,
  label,
  showValue = true,
  height = "h-2",
}: {
  percentile: number;
  label?: string;
  showValue?: boolean;
  height?: string;
}) {
  const color =
    percentile >= 85
      ? "bg-green-500"
      : percentile >= 70
      ? "bg-blue-500"
      : percentile >= 40
      ? "bg-yellow-500"
      : percentile >= 20
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold tabular-nums">{percentile}th</span>
          )}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", height)}>
        <div
          className={cn("rounded-full transition-all duration-500", height, color)}
          style={{ width: `${percentile}%` }}
        />
      </div>
    </div>
  );
}

// ─── Confidence Bar ────────────────────────────────────────────────────────
export function ConfidenceBar({ score, label }: { score: number; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted-foreground shrink-0">{label}:</span>}
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0">{score}%</span>
    </div>
  );
}

// ─── Data Completeness Badge ───────────────────────────────────────────────
export function DataQualityBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-100 text-green-800 border-green-200"
    : score >= 50 ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-red-100 text-red-800 border-red-200";
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border", color)}>
      <span>{score}%</span>
    </span>
  );
}

// ─── Sport Fit Bar ─────────────────────────────────────────────────────────
export function SportFitBar({
  sportName,
  sportIcon,
  score,
  color,
  rank,
}: {
  sportName: string;
  sportIcon: string;
  score: number;
  color: string;
  rank?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {rank != null && (
        <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{rank}</span>
      )}
      <span className="text-sm shrink-0 w-6">{sportIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium truncate">{sportName}</span>
          <span className="text-sm font-bold tabular-nums ml-2">{score}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Metric Chip ──────────────────────────────────────────────────────────
export function MetricChip({
  label,
  value,
  unit,
  percentile,
}: {
  label: string;
  value: number | string;
  unit?: string;
  percentile?: number;
}) {
  return (
    <div className="bg-muted/60 rounded-lg p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums">
        {value}
        {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </div>
      {percentile != null && (
        <div className="text-[10px] text-muted-foreground mt-0.5">{percentile}th pct</div>
      )}
    </div>
  );
}

// ─── Flag Badge ────────────────────────────────────────────────────────────
export function FlagBadge({ type, label }: { type: "outlier" | "missing" | "underweight" | "overweight"; label?: string }) {
  const defaultLabels = {
    outlier: "⚡ Outlier",
    missing: "◻ Missing",
    underweight: "⬇ Underweight",
    overweight: "⬆ Overweight",
  };
  const classNames = {
    outlier: "bg-orange-100 text-orange-700 border-orange-200",
    missing: "bg-gray-100 text-gray-600 border-gray-200",
    underweight: "bg-blue-100 text-blue-700 border-blue-200",
    overweight: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const icons = { outlier: "⚡", missing: "◻", underweight: "⬇", overweight: "⬆" };
  const displayLabel = label ? `${icons[type]} ${label}` : defaultLabels[type];
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border", classNames[type])}>
      {displayLabel}
    </span>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────
export function SectionCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("bg-card border rounded-lg p-4", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────
export function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  iconColor?: string;
  trend?: { direction: "up" | "down" | "flat"; label: string };
}) {
  return (
    <div className="bg-card border rounded-lg p-4 flex items-start gap-3">
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor ?? "hsl(var(--primary))"}20` }}
        >
          <Icon size={20} style={{ color: iconColor ?? "hsl(var(--primary))" }} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        {trend && (
          <div
            className={cn(
              "text-xs font-medium mt-1",
              trend.direction === "up" ? "text-green-600" : trend.direction === "down" ? "text-red-600" : "text-muted-foreground"
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon size={24} className="text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumb && (
          <p className="text-xs text-muted-foreground mb-0.5">{breadcrumb}</p>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
