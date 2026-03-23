/**
 * NutritionTab — Highly personalised, context-aware nutrition UI
 * ──────────────────────────────────────────────────────────────
 * Tabs:
 *   1. Meal Plan        — full day plan, context-aware by gender/age/BMI/goal/diet pref
 *   2. Hydration        — personalised water + electrolyte guidance
 *   3. Regional Foods   — Bihar district-level seasonal food atlas
 *   4. Home Remedies    — evidence-graded traditional remedies
 *   5. Macro Targets    — calorie + macro breakdown with ICMR sourcing
 */

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import { useLanguage } from "@/i18n/useTranslation";
import {
  NutritionContext, NutritionGoal, DietPref,
  buildNutritionPlan, NutritionPlan, MealSlot, HomeRemedy, RegionalFood,
} from "./NutritionEngine";

// ─── Props ────────────────────────────────────────────────────────────────

interface NutritionTabProps {
  athlete: EnrichedAthlete;
}

const CATEGORY_STYLE: Record<string, string> = {
  protein:      "bg-red-50 border-red-200 text-red-800",
  carb:         "bg-amber-50 border-amber-200 text-amber-800",
  fat:          "bg-yellow-50 border-yellow-200 text-yellow-800",
  micronutrient:"bg-green-50 border-green-200 text-green-800",
  probiotic:    "bg-purple-50 border-purple-200 text-purple-800",
  hydration:    "bg-blue-50 border-blue-200 text-blue-800",
};

// ─── Main Component ──────────────────────────────────────────────────────

export default function NutritionTab({ athlete }: NutritionTabProps) {
  const autoGoal: NutritionGoal = (athlete.bmi ?? 20) < 16 ? "weightGain" : (athlete.bmi ?? 20) > 23 ? "maintenance" : "performance";
  const [goal, setGoal] = useState<NutritionGoal>(autoGoal);
  const [dietPref, setDietPref] = useState<DietPref>("egg-veg");
  const [subTab, setSubTab] = useState("meal");
  const [expandedRemedy, setExpandedRemedy] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>("Breakfast");

  const ctx: NutritionContext = useMemo(() => ({
    gender:   athlete.gender,
    age:      athlete.age,
    weight:   athlete.weight,
    height:   athlete.height,
    bmi:      athlete.bmi ?? 0,
    district: athlete.district ?? "Patna",
    sport:    athlete.topSport,
    compositeScore: athlete.compositeScore,
    dietPref,
    goal,
  }), [athlete, dietPref, goal]);

  const plan: NutritionPlan = useMemo(() => buildNutritionPlan(ctx), [ctx]);

  return (
    <div className="space-y-4">
      {/* ── Context controls ── */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Personalisation Context
        </h3>
        {/* Goal selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Nutrition Goal</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GOAL_LABELS) as NutritionGoal[]).map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  goal === g ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border hover:bg-muted"
                )}
              >
                {GOAL_LABELS[g].label}
                <span className="ml-1 text-[10px] opacity-70">{GOAL_LABELS[g].labelHi}</span>
              </button>
            ))}
          </div>
          {autoGoal !== goal && (
            <p className="text-[10px] text-amber-600 mt-1">
              💡 Suggested: <strong>{GOAL_LABELS[autoGoal].label}</strong> based on BMI {(athlete.bmi ?? 0).toFixed(1)}
            </p>
          )}
          {autoGoal === goal && (
            <p className="text-[10px] text-green-600 mt-1">
              ✓ Auto-selected based on BMI {(athlete.bmi ?? 0).toFixed(1)} · {athlete.gender === "F" ? "Female" : "Male"} · Age {athlete.age} · {athlete.district}
            </p>
          )}
        </div>

        {/* Diet preference */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Dietary Preference</p>
          <div className="flex gap-2">
            {(Object.keys(DIET_LABELS) as DietPref[]).map(d => (
              <button
                key={d}
                onClick={() => setDietPref(d)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  dietPref === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
              >
                {DIET_LABELS[d].label}
              </button>
            ))}
          </div>
        </div>

        {/* Context badge row */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <ContextBadge icon="👤" label={athlete.gender === "F" ? "Female" : "Male"} />
          <ContextBadge icon="🎂" label={`Age ${athlete.age}`} />
          <ContextBadge icon="⚖️" label={`BMI ${(athlete.bmi ?? 0).toFixed(1)}`} />
          <ContextBadge icon="📍" label={athlete.district ?? "Bihar"} />
          {athlete.topSport && <ContextBadge icon="🏅" label={athlete.topSport} />}
          <ContextBadge icon="🎯" label={`${plan.macroTargets.kcal} kcal/day`} />
        </div>
      </div>

      {/* ── Nutrition alerts ── */}
      {plan.alerts.length > 0 && (
        <div className="space-y-2">
          {plan.alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                alert.severity === "red" ? "bg-red-50 border-red-200" :
                alert.severity === "orange" ? "bg-amber-50 border-amber-200" :
                "bg-green-50 border-green-200"
              )}
            >
              <span className="text-lg shrink-0">{alert.icon}</span>
              <div>
                <p className={cn(
                  "text-xs font-semibold",
                  alert.severity === "red" ? "text-red-800" : alert.severity === "orange" ? "text-amber-800" : "text-green-800"
                )}>
                  {alert.title}
                </p>
                <p className={cn(
                  "text-[11px] mt-0.5 leading-relaxed",
                  alert.severity === "red" ? "text-red-700" : alert.severity === "orange" ? "text-amber-700" : "text-green-700"
                )}>
                  {alert.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid grid-cols-5 h-auto p-1 gap-0.5">
          <TabsTrigger value="meal"    className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🍱</span>Meal Plan</TabsTrigger>
          <TabsTrigger value="hydration" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">💧</span>Hydration</TabsTrigger>
          <TabsTrigger value="regional" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🌾</span>Regional</TabsTrigger>
          <TabsTrigger value="remedies" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🌿</span>Remedies</TabsTrigger>
          <TabsTrigger value="macros"  className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">📊</span>Macros</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Meal Plan ── */}
        <TabsContent value="meal" className="mt-3 space-y-3">
          {/* Pre/post workout callouts */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1">⚡ Pre-Training</p>
              <p className="text-xs text-blue-700">{plan.preworkoutGuidance}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wide mb-1">🔄 Post-Training</p>
              <p className="text-xs text-green-700">{plan.postworkoutGuidance}</p>
            </div>
          </div>

          {/* Meal slots */}
          {plan.mealSlots.map((slot: MealSlot) => (
            <div key={slot.label} className="bg-card border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === slot.label ? null : slot.label)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{slot.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{slot.label}</p>
                    <p className="text-[10px] text-muted-foreground">{slot.labelHi} · {slot.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    ~{slot.items.reduce((s, i) => s + i.kcal, 0)} kcal
                  </span>
                  <span className="text-muted-foreground text-sm">{expandedMeal === slot.label ? "▲" : "▼"}</span>
                </div>
              </button>

              {expandedMeal === slot.label && (
                <div className="border-t divide-y">
                  {slot.items.map((item, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.nameHi}</p>
                        {item.notes && (
                          <p className="text-[10px] text-primary mt-0.5">💡 {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-xs font-semibold">{item.kcal} kcal</p>
                        <p className="text-[10px] text-muted-foreground">P:{item.proteinG}g C:{item.carbG}g F:{item.fatG}g</p>
                        <p className="text-[10px] text-muted-foreground">{item.portionG}g</p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 bg-muted/20 flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Slot Total</span>
                    <span>
                      {slot.items.reduce((s, i) => s + i.kcal, 0)} kcal ·
                      P:{slot.items.reduce((s, i) => s + i.proteinG, 0).toFixed(0)}g ·
                      C:{slot.items.reduce((s, i) => s + i.carbG, 0).toFixed(0)}g ·
                      F:{slot.items.reduce((s, i) => s + i.fatG, 0).toFixed(0)}g
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Weekly tips */}
          <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold">💡 Weekly Nutrition Tips</p>
            {plan.weeklyTips.map((tip, i) => (
              <p key={i} className="text-[11px] text-muted-foreground flex gap-2">
                <span className="shrink-0 text-primary font-bold">{i + 1}.</span>
                {tip}
              </p>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 2: Hydration ── */}
        <TabsContent value="hydration" className="mt-3 space-y-3">
          {/* Headline numbers */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              icon="💧"
              value={`${(plan.hydrationPlan.dailyML / 1000).toFixed(1)}L`}
              label="Daily Baseline"
              labelHi="दैनिक आधार"
              color="blue"
            />
            <StatCard
              icon="⚡"
              value={`+${(plan.hydrationPlan.trainingTopUpML / 1000).toFixed(1)}L`}
              label="Training Days"
              labelHi="प्रशिक्षण दिन"
              color="amber"
            />
            <StatCard
              icon="🌡️"
              value="+0.5L"
              label="Hot Weather"
              labelHi="गर्म मौसम"
              color="red"
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            {plan.hydrationPlan.recommendations.map((rec, i) => (
              <div key={i} className="bg-card border rounded-lg p-3 flex gap-3">
                <span className="text-xl shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-xs font-semibold">{rec.label} <span className="text-muted-foreground font-normal">({rec.labelHi})</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{rec.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Electrolyte note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">🫙 Bihar Traditional Electrolytes</p>
            <p className="text-[11px] text-blue-700">{plan.hydrationPlan.electrolyteNote}</p>
          </div>
        </TabsContent>

        {/* ── Tab 3: Regional Foods ── */}
        <TabsContent value="regional" className="mt-3 space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 border rounded-lg p-2">
            <span className="text-sm">📍</span>
            <span>Showing foods available in <strong>{athlete.district ?? "Bihar"}</strong> district in current season. {plan.regionalFoods.length} foods matched.</span>
          </div>

          {/* Category sections */}
          {(["protein", "carb", "micronutrient", "fat", "probiotic", "hydration"] as const).map(cat => {
            const foods = plan.regionalFoods.filter(f => f.category === cat);
            if (foods.length === 0) return null;
            const catLabels: Record<string, string> = {
              protein: "🥩 Protein Sources",
              carb: "🌾 Carbohydrate Sources",
              micronutrient: "🥬 Micronutrients & Greens",
              fat: "🫒 Healthy Fats",
              probiotic: "🦠 Probiotics & Gut Health",
              hydration: "💧 Hydration Foods",
            };
            return (
              <div key={cat}>
                <p className="text-xs font-semibold mb-2">{catLabels[cat]}</p>
                <div className="space-y-2">
                  {foods.map((food: RegionalFood) => (
                    <div key={food.name} className="bg-card border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-xs font-semibold">{food.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{food.nameHi}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium border", CATEGORY_STYLE[food.category])}>
                            {food.kcalPer100g} kcal
                          </span>
                          {food.vegSafe && <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-50 border border-green-200 text-green-700">🥦 Veg</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-primary font-medium mb-1">⚡ {food.sportBenefit}</p>
                      <p className="text-[10px] text-muted-foreground">🔑 {food.keyNutrient}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">👨‍🍳 {food.preparation}</p>
                      <p className="text-[10px] text-muted-foreground">👨‍🍳 {food.preparationHi}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── Tab 4: Home Remedies ── */}
        <TabsContent value="remedies" className="mt-3 space-y-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-700">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>Traditional remedies from Ayurvedic and Bihar folk medicine. Safety-graded by AYUSH. Not a substitute for medical treatment. Consult school doctor for Grade B/C remedies.</span>
          </div>

          {/* Purpose filter buttons */}
          {(["energy", "recovery", "iron", "immunity", "digestion", "hydration", "joint-care"] as const).map(purpose => {
            const remedies = plan.homeRemedies.filter(r => r.purpose === purpose);
            if (remedies.length === 0) return null;
            const p = PURPOSE_LABELS[purpose];
            return (
              <div key={purpose}>
                <p className="text-xs font-semibold mb-2">{p.icon} {p.label}</p>
                <div className="space-y-2">
                  {remedies.map((remedy: HomeRemedy) => {
                    const grade = SAFETY_GRADE[remedy.safetyGrade];
                    const isExpanded = expandedRemedy === remedy.name;
                    return (
                      <div key={remedy.name} className={cn("border rounded-lg overflow-hidden", grade.bg)}>
                        <button
                          className="w-full px-4 py-3 flex items-start justify-between gap-2 text-left"
                          onClick={() => setExpandedRemedy(isExpanded ? null : remedy.name)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{remedy.name}</p>
                            <p className="text-[10px] text-muted-foreground">{remedy.nameHi}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded border", grade.bg, grade.color)}>
                              {grade.label}
                            </span>
                            <span className="text-muted-foreground text-sm">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t px-4 py-3 space-y-2 bg-card">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ingredients</p>
                              <p className="text-xs mt-0.5">{remedy.ingredients}</p>
                              <p className="text-[10px] text-muted-foreground">{remedy.ingredientsHi}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Preparation</p>
                              <p className="text-xs mt-0.5">{remedy.preparation}</p>
                              <p className="text-[10px] text-muted-foreground">{remedy.preparationHi}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Dosage</p>
                              <p className="text-xs mt-0.5">{remedy.dosage}</p>
                              <p className="text-[10px] text-muted-foreground">{remedy.dosageHi}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-[10px] font-semibold text-blue-800">📚 Evidence Note</p>
                              <p className="text-[10px] text-blue-700 mt-0.5">{remedy.evidenceNote}</p>
                            </div>
                            {remedy.contraindications && (
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-[10px] font-semibold text-red-800">⛔ Contraindications</p>
                                <p className="text-[10px] text-red-700 mt-0.5">{remedy.contraindications}</p>
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">🛡️ {remedy.safetyNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── Tab 5: Macro Targets ── */}
        <TabsContent value="macros" className="mt-3 space-y-3">
          {/* Daily target headline */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary tabular-nums">{plan.macroTargets.kcal}</p>
            <p className="text-xs text-muted-foreground">kcal / day target</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ICMR 2020 DRV · {athlete.gender === "F" ? "Female" : "Male"} · Age {athlete.age} · {GOAL_LABELS[goal].label} goal
            </p>
          </div>

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <MacroCard label="Protein" labelHi="प्रोटीन" value={plan.macroTargets.proteinG} unit="g" color="red" detail={`${plan.macroTargets.proteinPerKg}g/kg`} />
            <MacroCard label="Carbs"   labelHi="कार्ब्स" value={plan.macroTargets.carbG}    unit="g" color="amber" detail="~55% total" />
            <MacroCard label="Fat"     labelHi="वसा"    value={plan.macroTargets.fatG}     unit="g" color="yellow" detail="~28% total" />
          </div>

          {/* Water */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-sm font-bold text-blue-900">{(plan.macroTargets.waterML / 1000).toFixed(1)}L water/day</p>
              <p className="text-[10px] text-blue-700">38ml × {athlete.weight}kg bodyweight · +600ml on training days</p>
            </div>
          </div>

          {/* Macro bar visual */}
          <div className="bg-card border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold">Macronutrient Distribution</p>
            <div className="h-6 rounded-full overflow-hidden flex gap-0.5">
              <div className="bg-red-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "22%" }}>Protein 22%</div>
              <div className="bg-amber-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "55%" }}>Carbs 55%</div>
              <div className="bg-yellow-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "23%" }}>Fat 23%</div>
            </div>
            <p className="text-[10px] text-muted-foreground">Target ratio for {GOAL_LABELS[goal].label.toLowerCase()} — ICMR 2020 sport-active guidelines</p>
          </div>

          {/* Source citations */}
          <div className="bg-muted/30 border rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">📚 Sources</p>
            <p>• ICMR-NIN 2020 Dietary Reference Values for Indians (Table 4, active children)</p>
            <p>• WHO/IAP BMI-for-age growth references (South Asian children)</p>
            <p>• Khelo India National Physical Fitness Test norms</p>
            <p>• AYUSH Traditional Medicine Safety Grading Framework</p>
            <p>• NIN Hyderabad Regional Food Composition Tables</p>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-700">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>These are evidence-informed general guidelines for active children. Individual nutritional needs vary. Consult a registered clinical dietitian for personalised assessment and medical conditions.</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ContextBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border text-[10px] font-medium">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function StatCard({
  icon, value, label, labelHi, color
}: {
  icon: string; value: string; label: string; labelHi: string;
  color: "blue" | "amber" | "red" | "green";
}) {
  const colorMap = {
    blue:  "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    red:   "bg-red-50 border-red-200 text-red-900",
    green: "bg-green-50 border-green-200 text-green-900",
  };
  return (
    <div className={cn("border rounded-lg p-3 text-center", colorMap[color])}>
      <p className="text-xl">{icon}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium">{label}</p>
      <p className="text-[9px] opacity-70">{labelHi}</p>
    </div>
  );
}

function MacroCard({
  label, labelHi, value, unit, color, detail
}: {
  label: string; labelHi: string; value: number; unit: string;
  color: "red" | "amber" | "yellow" | "green" | "blue";
  detail: string;
}) {
  const colorMap = {
    red:    "border-red-200 bg-red-50 text-red-900",
    amber:  "border-amber-200 bg-amber-50 text-amber-900",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
    green:  "border-green-200 bg-green-50 text-green-900",
    blue:   "border-blue-200 bg-blue-50 text-blue-900",
  };
  return (
    <div className={cn("border rounded-lg p-3 text-center", colorMap[color])}>
      <p className="text-2xl font-bold tabular-nums">{value}<span className="text-sm font-normal ml-0.5">{unit}</span></p>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[9px] opacity-70">{labelHi}</p>
      <p className="text-[10px] mt-1 opacity-80">{detail}</p>
    </div>
  );
}
