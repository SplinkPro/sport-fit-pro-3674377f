/**
 * YogaTab — Personalised Yoga Prescription Tab
 * ──────────────────────────────────────────────
 * Displays a hyper-personalised yoga prescription for each athlete
 * based on sport, age, gender, BMI, and fitness level.
 * Powered by the PRATIBHA Yoga Intelligence Engine.
 */
import React, { useState, useMemo } from "react";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import { generateYogaPrescription, YogaPose, YogaPhase, YogaDomain, normaliseSport } from "./YogaEngine";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wind, Brain, Flame, Leaf, Clock, ExternalLink,
  ChevronDown, ChevronUp, Shield, Calendar, Zap,
  BookOpen, FlaskConical,
} from "lucide-react";

// ─── DOMAIN CONFIG ──────────────────────────────────────────────────────────
const DOMAIN_META: Record<YogaDomain, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  asana:    { label: "Asana",     icon: <Zap className="w-3.5 h-3.5" />,    color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
  pranayama:{ label: "Pranayama", icon: <Wind className="w-3.5 h-3.5" />,   color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200" },
  dharana:  { label: "Dharana",   icon: <Brain className="w-3.5 h-3.5" />,  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  nidra:    { label: "Yoga Nidra",icon: <Leaf className="w-3.5 h-3.5" />,   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const PHASE_META: Record<YogaPhase, { label: string; color: string; bg: string }> = {
  pre:      { label: "Pre-Training Activation", color: "text-blue-700",    bg: "bg-blue-50" },
  active:   { label: "Active Phase",             color: "text-orange-700",  bg: "bg-orange-50" },
  recovery: { label: "Recovery & Reset",         color: "text-emerald-700", bg: "bg-emerald-50" },
};

const SPORT_DISPLAY: Record<string, { emoji: string; label: string }> = {
  athletics: { emoji: "🏃", label: "Athletics" },
  football:  { emoji: "⚽", label: "Football" },
  kabaddi:   { emoji: "🤸", label: "Kabaddi" },
  volleyball:{ emoji: "🏐", label: "Volleyball" },
  cycling:   { emoji: "🚴", label: "Cycling" },
  swimming:  { emoji: "🏊", label: "Swimming" },
  wrestling: { emoji: "🤼", label: "Wrestling" },
  basketball:{ emoji: "🏀", label: "Basketball" },
  badminton: { emoji: "🏸", label: "Badminton" },
  boxing:    { emoji: "🥊", label: "Boxing" },
  hockey:    { emoji: "🏑", label: "Hockey" },
  archery:   { emoji: "🏹", label: "Archery" },
  khokho:    { emoji: "🏃‍♀️", label: "Kho Kho" },
  tabletennis:{ emoji: "🏓", label: "Table Tennis" },
  weightlifting:{ emoji: "🏋️", label: "Weightlifting" },
};

// ─── POSE CARD ───────────────────────────────────────────────────────────────
function PoseCard({ pose }: { pose: YogaPose }) {
  const [open, setOpen] = useState(false);
  const domain = DOMAIN_META[pose.domain];

  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden transition-shadow duration-200", domain.border, open ? "shadow-md" : "shadow-sm hover:shadow-md")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        {/* Domain pill */}
        <span className={cn("mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0", domain.bg, domain.color, domain.border, "border")}>
          {domain.icon}{domain.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-800">{pose.name}</span>
            <span className="text-xs text-slate-400 italic">{pose.sanskrit}</span>
            <span className="ml-auto shrink-0 flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />{pose.duration}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{pose.benefit}</p>
        </div>
        <span className="shrink-0 mt-0.5 text-slate-400">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* Wikipedia image placeholder + link */}
          <div className="flex gap-3">
            <a
              href={pose.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("shrink-0 w-24 h-24 rounded-lg flex flex-col items-center justify-center gap-1 text-center border text-xs font-semibold transition-colors cursor-pointer", domain.bg, domain.border, domain.color, "hover:opacity-80")}
            >
              <ExternalLink className="w-5 h-5" />
              <span>View on<br/>Wikipedia</span>
            </a>
            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">How to perform</span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{pose.instruction}</p>
              </div>
              {pose.contraindication && (
                <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{pose.contraindication}</p>
                </div>
              )}
            </div>
          </div>
          <div className={cn("rounded-lg px-3 py-2", domain.bg)}>
            <span className={cn("text-[10px] font-bold uppercase tracking-wide", domain.color)}>Sport-specific benefit</span>
            <p className={cn("text-xs mt-0.5", domain.color)}>{pose.benefit}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SESSION SPLIT DONUT (CSS-based) ─────────────────────────────────────────
function SessionSplitBar({ split }: { split: { asana: number; pranayama: number; dharana: number; nidra: number } }) {
  const items = [
    { key: "asana",     label: "Asana",     pct: split.asana,     color: "#EA580C" },
    { key: "pranayama", label: "Pranayama", pct: split.pranayama, color: "#0D9488" },
    { key: "dharana",   label: "Dharana",   pct: split.dharana,   color: "#7C3AED" },
    { key: "nidra",     label: "Yoga Nidra",pct: split.nidra,     color: "#059669" },
  ];
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-20 shrink-0">{item.label}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-slate-600 w-8 text-right">{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── WEEKLY SCHEDULE ─────────────────────────────────────────────────────────
function WeeklyScheduleGrid({ schedule }: { schedule: { day: string; focus: string; duration: number; emoji: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {schedule.map(day => (
        <div key={day.day} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl mb-1">{day.emoji}</div>
          <div className="font-bold text-sm text-slate-800">{day.day}</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-tight">{day.focus}</div>
          <div className="mt-2 inline-flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            <Clock className="w-3 h-3" />{day.duration} min
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN YOGA TAB ──────────────────────────────────────────────────────────
export default function YogaTab({ athlete }: { athlete: EnrichedAthlete }) {
  const [activePhase, setActivePhase] = useState<YogaPhase>("pre");

  const prescription = useMemo(() => generateYogaPrescription({
    name: athlete.name,
    age: athlete.age,
    gender: athlete.gender as "M" | "F",
    bmi: athlete.bmi ?? 20,
    compositeScore: athlete.compositeScore,
    topSport: athlete.topSport ?? "athletics",
    dimensionScores: athlete.dimensionScores,
  }), [athlete]);

  const sportKey = normaliseSport(prescription.sport);
  const sportMeta = SPORT_DISPLAY[sportKey] ?? { emoji: "🧘", label: prescription.sport };

  const phasePoses = {
    pre: prescription.prePoses,
    active: prescription.activePoses,
    recovery: prescription.recoveryPoses,
  };

  const ageTierLabel: Record<string, string> = {
    u14: "Under 14", u18: "Under 18", u24: "Under 24", senior: "Senior (24+)"
  };
  const fitnessLabel: Record<string, string> = {
    beginner: "Beginner Track", intermediate: "Intermediate Track", advanced: "Advanced Track"
  };
  const fitnessColors: Record<string, string> = {
    beginner: "bg-blue-100 text-blue-800 border-blue-200",
    intermediate: "bg-amber-100 text-amber-800 border-amber-200",
    advanced: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="space-y-5">
      {/* ── PRESCRIPTION HEADER ──────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                Pratibha Yoga Intelligence Engine
              </span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full px-2 py-0.5 font-bold">SAI CI 07/2023</span>
            </div>
            <h2 className="text-xl font-black leading-tight">
              {athlete.name}&apos;s Personalised Yoga Plan
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Hyper-personalised for <span className="text-white font-semibold">{sportMeta.emoji} {sportMeta.label}</span> · Age {athlete.age} · {athlete.gender === "M" ? "Male" : "Female"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("border text-xs", fitnessColors[prescription.fitnessLevel])}>
              {fitnessLabel[prescription.fitnessLevel]}
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
              {ageTierLabel[prescription.ageTier]}
            </Badge>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{prescription.weeklyMinutes} min / week</span>
            </div>
          </div>
        </div>

        {/* Primary benefit */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-400">Primary Sport Benefit</span>
          <p className="text-sm text-slate-200 mt-1 leading-relaxed">{prescription.primaryBenefit}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {prescription.secondaryBenefits.map(b => (
              <span key={b} className="text-[10px] bg-white/10 border border-white/10 rounded-full px-2 py-0.5 text-slate-300">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SPECIAL FLAGS ──────────────────────────────────────────── */}
      {prescription.specialFlags.length > 0 && (
        <div className="space-y-2">
          {prescription.specialFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">{flag}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── TWO COLUMN: SESSION SPLIT + SCIENCE ──────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Session split */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-slate-800">Session Time Allocation</span>
          </div>
          <SessionSplitBar split={prescription.sessionSplit} />
          <p className="text-[10px] text-slate-400 mt-3 italic">Allocation derived from sport-specific physiological demand profile (SAI 07/2023).</p>
        </div>

        {/* Science basis */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-slate-800">Scientific Basis</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{prescription.scienceBasis}</p>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Sources</span>
            <p className="text-[10px] text-slate-500 mt-1">Birdee et al. 2009 · Telles et al. 2014 · Jarvis et al. 2017 · AYUSH Ministry Youth Yoga Guidelines · SAI Circular 07/2023</p>
          </div>
        </div>
      </div>

      {/* ── PHASE TABS + POSES ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Phase selector */}
        <div className="flex border-b border-slate-100">
          {(["pre", "active", "recovery"] as YogaPhase[]).map(phase => {
            const meta = PHASE_META[phase];
            const count = phasePoses[phase].length;
            const active = activePhase === phase;
            return (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={cn(
                  "flex-1 py-3 px-2 text-xs font-bold transition-all duration-200 border-b-2",
                  active
                    ? cn("border-b-2 border-orange-500", meta.bg, meta.color)
                    : "border-transparent text-slate-500 hover:bg-slate-50"
                )}
              >
                <div>{meta.label}</div>
                <div className="text-[10px] font-normal mt-0.5 opacity-70">{count} techniques</div>
              </button>
            );
          })}
        </div>

        {/* Poses for active phase */}
        <div className="p-4 space-y-2">
          {phasePoses[activePhase].length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No techniques for this phase.</p>
          ) : (
            phasePoses[activePhase].map((pose, i) => <PoseCard key={`${pose.sanskrit}-${i}`} pose={pose} />)
          )}
        </div>
      </div>

      {/* ── WEEKLY SCHEDULE ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-800">Recommended Weekly Schedule</span>
          <span className="ml-auto text-xs text-slate-400">{prescription.weeklyMinutes} min/week total</span>
        </div>
        <WeeklyScheduleGrid schedule={prescription.weeklySchedule} />
      </div>

      {/* ── COACH NOTES ──────────────────────────────────────────── */}
      {prescription.coachNotes.length > 0 && (
        <div className="bg-slate-800 text-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">Personalisation Notes for Coach</span>
          </div>
          <ul className="space-y-2">
            {prescription.coachNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 text-center italic px-4">
        ⚠️ This yoga prescription is a wellness and performance support tool. It is not a substitute for medical or physiotherapy advice. Consult a qualified yoga instructor and sports medicine professional before implementation. Generated under SAI Circular 07/2023 framework.
      </p>
    </div>
  );
}
