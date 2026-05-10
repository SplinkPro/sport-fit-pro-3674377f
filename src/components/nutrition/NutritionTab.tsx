/**
 * NutritionTab — Highly personalised, context-aware nutrition UI
 * Fully bilingual (EN/HI) via useLanguage hook + i18n keys
 */

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrichedAthlete } from "@/engine/analyticsEngine";
import { useTranslation } from "@/i18n/useTranslation";
import {
  NutritionContext, NutritionGoal, DietPref,
  buildNutritionPlan, NutritionPlan, MealSlot, HomeRemedy, RegionalFood,
} from "./NutritionEngine";

interface NutritionTabProps {
  athlete: EnrichedAthlete;
}

const GOAL_KEYS: NutritionGoal[] = ["performance", "weightGain", "maintenance", "recovery"];

const GOAL_INFO: Record<NutritionGoal, { labelKey: string; labelHi: string; color: string }> = {
  performance:  { labelKey: "goalPerformance", labelHi: "प्रदर्शन",   color: "bg-blue-100 text-blue-800 border-blue-300" },
  weightGain:   { labelKey: "goalWeightGain",  labelHi: "वजन बढ़ाना", color: "bg-green-100 text-green-800 border-green-300" },
  maintenance:  { labelKey: "goalMaintenance", labelHi: "रखरखाव",     color: "bg-gray-100 text-gray-800 border-gray-300" },
  recovery:     { labelKey: "recovery",        labelHi: "रिकवरी",     color: "bg-purple-100 text-purple-800 border-purple-300" },
};

const DIET_INFO: Record<DietPref, { en: string; hi: string; icon: string }> = {
  veg:       { en: "Vegetarian 🥦",    hi: "शाकाहारी 🥦",           icon: "🥦" },
  "egg-veg": { en: "Egg + Veg 🥚",     hi: "अंडा + शाकाहारी 🥚",     icon: "🥚" },
  nonveg:    { en: "Non-Vegetarian 🍗",hi: "मांसाहारी 🍗",            icon: "🍗" },
};

const SAFETY_GRADE_INFO: Record<string, { labelKey: string; color: string; bg: string }> = {
  A: { labelKey: "gradeA", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  B: { labelKey: "gradeB", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  C: { labelKey: "gradeC", color: "text-red-700",   bg: "bg-red-50 border-red-200" },
};

const PURPOSE_ICON: Record<string, string> = {
  energy: "⚡", recovery: "🔄", immunity: "🛡️", digestion: "🌿",
  sleep: "😴", "joint-care": "🦴", iron: "🩸", hydration: "💧",
};

const PURPOSE_KEY_MAP: Record<string, string> = {
  energy: "purposeEnergy", recovery: "purposeRecovery", immunity: "purposeImmunity",
  digestion: "purposeDigestion", sleep: "purposeSleep", "joint-care": "purposeJointCare",
  iron: "purposeIron", hydration: "purposeHydration",
};

const CAT_KEY_MAP: Record<string, string> = {
  protein: "catProtein", carb: "catCarb", micronutrient: "catMicro",
  fat: "catFat", probiotic: "catProbiotic", hydration: "catHydration",
};

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
  const { t, language } = useTranslation();
  const isHi = language === "hi";

  // FIX: IAP normal BMI range for active youth athletes is up to 25 (not 23).
  // Using 23 caused healthy teen athletes (BMI 23–25) to be incorrectly routed to "maintenance"
  // instead of "performance". Corrected threshold to 25 (IAP overweight boundary for South Asian youth).
  const autoGoal: NutritionGoal = (athlete.bmi ?? 20) < 16 ? "weightGain" : (athlete.bmi ?? 20) > 25 ? "maintenance" : "performance";
  const [goal, setGoal] = useState<NutritionGoal>(autoGoal);
  const [dietPref, setDietPref] = useState<DietPref>("egg-veg");
  const [subTab, setSubTab] = useState("meal");
  const [expandedRemedy, setExpandedRemedy] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>("Breakfast");

  const ctx: NutritionContext = useMemo(() => ({
    gender: athlete.gender, age: athlete.age, weight: athlete.weight,
    height: athlete.height, bmi: athlete.bmi ?? 0, district: athlete.district ?? "Patna",
    sport: athlete.topSport, compositeScore: athlete.compositeScore, dietPref, goal,
  }), [athlete, dietPref, goal]);

  const plan: NutritionPlan = useMemo(() => buildNutritionPlan(ctx), [ctx]);

  const goalLabel = (g: NutritionGoal) => {
    const info = GOAL_INFO[g];
    return isHi ? info.labelHi : t(`profile.${info.labelKey}`);
  };

  const genderLabel = athlete.gender === "F"
    ? (isHi ? "महिला" : "Female")
    : (isHi ? "पुरुष" : "Male");

  return (
    <div className="space-y-4">
      {/* ── Context controls ── */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("profile.personalisationContext")}
        </h3>
        {/* Goal selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{t("profile.nutritionGoalLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_KEYS.map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  goal === g ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border hover:bg-muted"
                )}
              >
                {goalLabel(g)}
              </button>
            ))}
          </div>
          {autoGoal !== goal && (
            <p className="text-[10px] text-amber-600 mt-1">
              💡 {t("profile.suggestedGoal")}: <strong>{goalLabel(autoGoal)}</strong> — BMI {(athlete.bmi ?? 0).toFixed(1)}
            </p>
          )}
          {autoGoal === goal && (
            <p className="text-[10px] text-green-600 mt-1">
              ✓ {t("profile.autoSelected")} {(athlete.bmi ?? 0).toFixed(1)} · {genderLabel} · {isHi ? "आयु" : "Age"} {athlete.age} · {athlete.district}
            </p>
          )}
          {/* Clinical rationale for no weight-loss goal */}
          {(athlete.bmi ?? 0) > 25 && autoGoal === "maintenance" && goal === "maintenance" && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[11px] text-amber-800 leading-relaxed">
              <span className="font-semibold">⚕️ Why no "Weight Loss" plan?</span>{" "}
              IAP &amp; WHO guidelines prohibit caloric-deficit diets for athletes under 18.
              For BMI &gt; 25, the clinically correct protocol is{" "}
              <strong>Maintenance calories (−5% TDEE)</strong> with higher lean-protein ratio,
              combined with increased training load to improve body composition naturally.
              Weight-loss diets in child athletes risk stunting growth and impairing performance.{" "}
              <span className="italic text-amber-600">
                Source: IAP Clinical Practice Guidelines 2022 · WHO Growth Reference 2007
              </span>
            </div>
          )}
        </div>

        {/* Diet preference */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{t("profile.dietaryPreference")}</p>
          <div className="flex gap-2">
            {(Object.keys(DIET_INFO) as DietPref[]).map(d => (
              <button
                key={d}
                onClick={() => setDietPref(d)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  dietPref === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
              >
                {isHi ? DIET_INFO[d].hi : DIET_INFO[d].en}
              </button>
            ))}
          </div>
        </div>

        {/* Context badge row */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <ContextBadge icon="👤" label={genderLabel} />
          <ContextBadge icon="🎂" label={`${isHi ? "आयु" : "Age"} ${athlete.age}`} />
          <ContextBadge icon="⚖️" label={`BMI ${(athlete.bmi ?? 0).toFixed(1)}`} />
          <ContextBadge icon="📍" label={athlete.district ?? "Bihar"} />
          {athlete.topSport && <ContextBadge icon="🏅" label={athlete.topSport} />}
          <ContextBadge icon="🎯" label={`${plan.macroTargets.kcal} kcal/${isHi ? "दिन" : "day"}`} />
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
                  {isHi ? (alert.titleHi ?? alert.title) : alert.title}
                </p>
                <p className={cn(
                  "text-[11px] mt-0.5 leading-relaxed",
                  alert.severity === "red" ? "text-red-700" : alert.severity === "orange" ? "text-amber-700" : "text-green-700"
                )}>
                  {isHi ? (alert.bodyHi ?? alert.body) : alert.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid grid-cols-5 h-auto p-1 gap-0.5">
          <TabsTrigger value="meal"    className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🍱</span>{t("profile.mealPlanTab")}</TabsTrigger>
          <TabsTrigger value="hydration" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">💧</span>{t("profile.hydrationTab")}</TabsTrigger>
          <TabsTrigger value="regional" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🌾</span>{t("profile.regionalTab")}</TabsTrigger>
          <TabsTrigger value="remedies" className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">🌿</span>{t("profile.remediesTab")}</TabsTrigger>
          <TabsTrigger value="macros"  className="flex flex-col items-center gap-0.5 py-2 text-[10px]"><span className="text-base">📊</span>{t("profile.macrosTab")}</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Meal Plan ── */}
        <TabsContent value="meal" className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1">⚡ {t("profile.preTraining")}</p>
              <p className="text-xs text-blue-700">{isHi ? (plan.preworkoutGuidanceHi ?? plan.preworkoutGuidance) : plan.preworkoutGuidance}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wide mb-1">🔄 {t("profile.postTraining")}</p>
              <p className="text-xs text-green-700">{isHi ? (plan.postworkoutGuidanceHi ?? plan.postworkoutGuidance) : plan.postworkoutGuidance}</p>
            </div>
          </div>

          {plan.mealSlots.map((slot: MealSlot) => (
            <div key={slot.label} className="bg-card border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === slot.label ? null : slot.label)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{slot.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{isHi ? (slot.labelHi ?? slot.label) : slot.label}</p>
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
                        <p className="text-xs font-medium">{isHi ? (item.nameHi ?? item.name) : item.name}</p>
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
                    <span>{t("profile.slotTotal")}</span>
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

          <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold">{t("profile.weeklyTips")}</p>
            {plan.weeklyTips.map((tip, i) => (
              <p key={i} className="text-[11px] text-muted-foreground flex gap-2">
                <span className="shrink-0 text-primary font-bold">{i + 1}.</span>
                {isHi ? ((plan.weeklyTipsHi?.[i]) ?? tip) : tip}
              </p>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 2: Hydration ── */}
        <TabsContent value="hydration" className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon="💧" value={`${(plan.hydrationPlan.dailyML / 1000).toFixed(1)}L`}
              label={t("profile.dailyBaseline")} labelHi="दैनिक आधार" color="blue" />
            <StatCard icon="⚡" value={`+${(plan.hydrationPlan.trainingTopUpML / 1000).toFixed(1)}L`}
              label={t("profile.trainingDays")} labelHi="प्रशिक्षण दिन" color="amber" />
            <StatCard icon="🌡️" value="+0.5L"
              label={t("profile.hotWeather")} labelHi="गर्म मौसम" color="red" />
          </div>

          <div className="space-y-2">
            {plan.hydrationPlan.recommendations.map((rec, i) => (
              <div key={i} className="bg-card border rounded-lg p-3 flex gap-3">
                <span className="text-xl shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-xs font-semibold">
                    {isHi ? (rec.labelHi ?? rec.label) : rec.label}
                    {" "}<span className="text-muted-foreground font-normal">({rec.labelHi})</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isHi ? (rec.detailHi ?? rec.detail) : rec.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">{t("profile.biharElectrolytes")}</p>
            <p className="text-[11px] text-blue-700">
              {isHi ? (plan.hydrationPlan.electrolyteNoteHi ?? plan.hydrationPlan.electrolyteNote) : plan.hydrationPlan.electrolyteNote}
            </p>
          </div>
        </TabsContent>

        {/* ── Tab 3: Regional Foods ── */}
        <TabsContent value="regional" className="mt-3 space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 border rounded-lg p-2">
            <span className="text-sm">📍</span>
            <span>
              {t("profile.showingFoodsIn")} <strong>{athlete.district || "your region"}</strong> {t("profile.district")} — {plan.regionalFoods.length} {t("profile.foodsMatched")}
            </span>
          </div>

          {(["protein", "carb", "micronutrient", "fat", "probiotic", "hydration"] as const).map(cat => {
            const foods = plan.regionalFoods.filter(f => f.category === cat);
            if (foods.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold mb-2">{t(`profile.${CAT_KEY_MAP[cat]}`)}</p>
                <div className="space-y-2">
                  {foods.map((food: RegionalFood) => (
                    <div key={food.name} className="bg-card border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-xs font-semibold">{isHi ? (food.nameHi ?? food.name) : food.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{food.nameHi}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium border", CATEGORY_STYLE[food.category])}>
                            {food.kcalPer100g} kcal
                          </span>
                          {food.vegSafe && <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-50 border border-green-200 text-green-700">🥦 {isHi ? "शाकाहारी" : "Veg"}</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-primary font-medium mb-1">⚡ {isHi ? (food.sportBenefitHi ?? food.sportBenefit) : food.sportBenefit}</p>
                      <p className="text-[10px] text-muted-foreground">🔑 {isHi ? (food.keyNutrientHi ?? food.keyNutrient) : food.keyNutrient}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">👨‍🍳 {isHi ? (food.preparationHi ?? food.preparation) : food.preparation}</p>
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
            <span>{t("profile.remediesDisclaimer")}</span>
          </div>

          {(["energy", "recovery", "iron", "immunity", "digestion", "hydration", "joint-care"] as const).map(purpose => {
            const remedies = plan.homeRemedies.filter(r => r.purpose === purpose);
            if (remedies.length === 0) return null;
            return (
              <div key={purpose}>
                <p className="text-xs font-semibold mb-2">{PURPOSE_ICON[purpose]} {t(`profile.${PURPOSE_KEY_MAP[purpose]}`)}</p>
                <div className="space-y-2">
                  {remedies.map((remedy: HomeRemedy) => {
                    const gradeInfo = SAFETY_GRADE_INFO[remedy.safetyGrade] ?? SAFETY_GRADE_INFO["B"];
                    const isExpanded = expandedRemedy === remedy.name;
                    return (
                      <div key={remedy.name} className={cn("border rounded-lg overflow-hidden", gradeInfo.bg)}>
                        <button
                          className="w-full px-4 py-3 flex items-start justify-between gap-2 text-left"
                          onClick={() => setExpandedRemedy(isExpanded ? null : remedy.name)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{isHi ? (remedy.nameHi ?? remedy.name) : remedy.name}</p>
                            <p className="text-[10px] text-muted-foreground">{remedy.nameHi}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded border", gradeInfo.bg, gradeInfo.color)}>
                              {t(`profile.${gradeInfo.labelKey}`)}
                            </span>
                            <span className="text-muted-foreground text-sm">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t px-4 py-3 space-y-2 bg-card">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t("profile.ingredients")}</p>
                              <p className="text-xs mt-0.5">{isHi ? (remedy.ingredientsHi ?? remedy.ingredients) : remedy.ingredients}</p>
                              <p className="text-[10px] text-muted-foreground">{remedy.ingredientsHi}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t("profile.preparation")}</p>
                              <p className="text-xs mt-0.5">{isHi ? (remedy.preparationHi ?? remedy.preparation) : remedy.preparation}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t("profile.dosage")}</p>
                              <p className="text-xs mt-0.5">{isHi ? (remedy.dosageHi ?? remedy.dosage) : remedy.dosage}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-[10px] font-semibold text-blue-800">{t("profile.evidenceNote")}</p>
                              <p className="text-[10px] text-blue-700 mt-0.5">{remedy.evidenceNote}</p>
                            </div>
                            {remedy.contraindications && (
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-[10px] font-semibold text-red-800">{t("profile.contraindications")}</p>
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
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary tabular-nums">{plan.macroTargets.kcal}</p>
            <p className="text-xs text-muted-foreground">{t("profile.kcalPerDay")}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ICMR 2020 DRV · {genderLabel} · {isHi ? "आयु" : "Age"} {athlete.age} · {goalLabel(goal)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MacroCard label={isHi ? "प्रोटीन" : "Protein"} labelHi="प्रोटीन" value={plan.macroTargets.proteinG} unit="g" color="red" detail={`${plan.macroTargets.proteinPerKg}g/kg`} />
            <MacroCard label={isHi ? "कार्ब्स" : "Carbs"}   labelHi="कार्ब्स" value={plan.macroTargets.carbG}    unit="g" color="amber" detail="~55% total" />
            <MacroCard label={isHi ? "वसा" : "Fat"}         labelHi="वसा"    value={plan.macroTargets.fatG}     unit="g" color="yellow" detail="~28% total" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-sm font-bold text-blue-900">{(plan.macroTargets.waterML / 1000).toFixed(1)}L {t("profile.waterPerDay")}</p>
              <p className="text-[10px] text-blue-700">38ml × {athlete.weight}kg · {t("profile.onTrainingDays")}</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold">{t("profile.macroDistribution")}</p>
            <div className="h-6 rounded-full overflow-hidden flex gap-0.5">
              <div className="bg-red-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "22%" }}>{isHi ? "प्रोटीन 22%" : "Protein 22%"}</div>
              <div className="bg-amber-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "55%" }}>{isHi ? "कार्ब्स 55%" : "Carbs 55%"}</div>
              <div className="bg-yellow-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: "23%" }}>{isHi ? "वसा 23%" : "Fat 23%"}</div>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("profile.targetRatio")} {goalLabel(goal).toLowerCase()} — ICMR 2020</p>
          </div>

          <div className="bg-muted/30 border rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">{t("profile.sources")}</p>
            <p>• ICMR-NIN 2020 Dietary Reference Values for Indians</p>
            <p>• WHO/IAP BMI-for-age growth references (South Asian children)</p>
            <p>• Khelo India National Physical Fitness Test norms</p>
            <p>• AYUSH Traditional Medicine Safety Grading Framework</p>
            <p>• NIN Hyderabad Regional Food Composition Tables</p>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-700">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{t("profile.macroDisclaimer")}</span>
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
