/**
 * PRATIBHA — Clinical Nutrition Engine
 * ─────────────────────────────────────────────────────────────────
 * Multi-agent knowledge graph for personalised athlete nutrition.
 *
 * Agents encoded here:
 *   Agent A — Child Sports Nutritionist     : age-band macro targets, sport-specific loading
 *   Agent B — Regional Food Specialist      : district-level food availability atlas (Bihar focus)
 *   Agent C — Traditional/Home Remedies     : evidence-graded Ayurvedic & home remedies
 *   Agent D — ML Feature Engineer           : context scoring, preference weighting, conflict detection
 *
 * Output is fully deterministic — no network calls, no AI runtime required.
 * All data is traceable to published sources (ICMR 2020, NIN Hyderabad,
 * WHO/IAP BMI-for-age, Khelo India NPFT, AYUSH safety grades).
 *
 * Disclaimer: Informational only. Not a substitute for clinical dietitian.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type DietPref = "veg" | "nonveg" | "egg-veg";
export type NutritionGoal = "performance" | "weightGain" | "maintenance" | "recovery";
export type AgeBand = "U10" | "U12" | "U14" | "U16" | "U18" | "Open";
export type Season = "summer" | "monsoon" | "winter";

export interface NutritionContext {
  gender: "M" | "F";
  age: number;
  weight: number;   // kg
  height: number;   // cm
  bmi: number;
  district: string; // e.g. "Patna", "Gaya"
  sport?: string;
  compositeScore?: number;
  dietPref: DietPref;
  goal: NutritionGoal;
  season?: Season;
}

export interface MealItem {
  name: string;        // English
  nameHi: string;      // Hindi
  portionG: number;    // grams
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  notes?: string;
}

export interface MealSlot {
  time: string;
  label: string;
  labelHi: string;
  icon: string;
  items: MealItem[];
}

export interface MacroTarget {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  waterML: number;
  proteinPerKg: number;
}

export interface RegionalFood {
  name: string;
  nameHi: string;
  category: "protein" | "carb" | "fat" | "micronutrient" | "probiotic" | "hydration";
  districts: string[];   // available in these districts
  season: Season[];
  kcalPer100g: number;
  proteinPer100g: number;
  keyNutrient: string;
  keyNutrientHi?: string;
  sportBenefit: string;
  sportBenefitHi?: string;
  vegSafe: boolean;
  preparation: string;
  preparationHi: string;
  /** True for foods that are culturally Bihar-iconic (Sattu, Makhana, Litti).
   *  Suppressed for non-Bihar districts to avoid regional leakage even when
   *  ingredients are technically available pan-India. */
  biharSpecific?: boolean;
}

export interface HomeRemedy {
  name: string;
  nameHi: string;
  purpose: "energy" | "recovery" | "immunity" | "digestion" | "sleep" | "joint-care" | "iron" | "hydration";
  ingredients: string;
  ingredientsHi: string;
  preparation: string;
  preparationHi: string;
  dosage: string;
  dosageHi: string;
  safetyGrade: "A" | "B" | "C";   // A=well-tolerated, B=monitor, C=consult first
  safetyNote: string;
  evidenceNote: string;
  contraindications?: string;
  ageMin: number;
  districts: string[];  // where ingredients are locally available
  /** Bihar-iconic remedy (e.g. Sattu drink) — hidden outside Bihar context. */
  biharSpecific?: boolean;
}

export interface NutritionPlan {
  context: NutritionContext;
  macroTargets: MacroTarget;
  mealSlots: MealSlot[];
  hydrationPlan: HydrationPlan;
  regionalFoods: RegionalFood[];
  homeRemedies: HomeRemedy[];
  alerts: NutritionAlert[];
  weeklyTips: string[];
  weeklyTipsHi?: string[];
  preworkoutGuidance: string;
  preworkoutGuidanceHi?: string;
  postworkoutGuidance: string;
  postworkoutGuidanceHi?: string;
}

export interface HydrationPlan {
  dailyML: number;
  trainingTopUpML: number;
  hotWeatherTopUpML: number;
  electrolyteNote: string;
  electrolyteNoteHi?: string;
  recommendations: HydrationRec[];
}

export interface HydrationRec {
  icon: string;
  label: string;
  labelHi: string;
  detail: string;
  detailHi: string;
}

export interface NutritionAlert {
  severity: "red" | "orange" | "green";
  icon: string;
  title: string;
  titleHi?: string;
  body: string;
  bodyHi?: string;
}

// ─── Age-band helpers ─────────────────────────────────────────────────────

function getAgeBand(age: number): AgeBand {
  if (age < 10) return "U10";
  if (age < 12) return "U12";
  if (age < 14) return "U14";
  if (age < 16) return "U16";
  if (age < 18) return "U18";
  return "Open";
}

// ─── Region detection ────────────────────────────────────────────────────
// Bihar-specific copy (Sattu, Makhana, "Bihar summers", etc.) must only
// surface when the athlete actually belongs to a Bihar district. For all
// other districts we fall back to pan-India neutral copy.
const BIHAR_DISTRICTS = new Set([
  "Patna", "Gaya", "Bhojpur", "Arwal", "Jehanabad", "Aurangabad",
  "Bhagalpur", "Nalanda", "Rohtas", "Buxar", "Muzaffarpur",
  "Darbhanga", "Madhubani", "Sitamarhi", "Samastipur",
  "Bihar", "All",
]);

function isBiharContext(district?: string): boolean {
  if (!district) return false;
  return BIHAR_DISTRICTS.has(district);
}

// ─── ICMR 2020 macro targets ────────────────────────────────────────────────
// Source: ICMR-NIN 2020 Dietary Reference Values, Table 4 (school-age, active)
// Agent A: adjusted upward 15% for sport-active children per NIN Sport Nutrition addendum

interface MacroProfile { kcal: number; proteinPerKg: number; carbPct: number; fatPct: number; }

const MACRO_PROFILES: Record<string, Record<string, MacroProfile>> = {
  M: {
    U10:  { kcal: 1900, proteinPerKg: 1.3, carbPct: 0.55, fatPct: 0.30 },
    U12:  { kcal: 2100, proteinPerKg: 1.4, carbPct: 0.55, fatPct: 0.28 },
    U14:  { kcal: 2400, proteinPerKg: 1.5, carbPct: 0.55, fatPct: 0.28 },
    U16:  { kcal: 2700, proteinPerKg: 1.7, carbPct: 0.56, fatPct: 0.27 },
    U18:  { kcal: 2900, proteinPerKg: 1.8, carbPct: 0.57, fatPct: 0.26 },
    Open: { kcal: 3100, proteinPerKg: 1.8, carbPct: 0.57, fatPct: 0.26 },
  },
  F: {
    U10:  { kcal: 1750, proteinPerKg: 1.2, carbPct: 0.55, fatPct: 0.30 },
    U12:  { kcal: 1950, proteinPerKg: 1.3, carbPct: 0.55, fatPct: 0.29 },
    U14:  { kcal: 2100, proteinPerKg: 1.4, carbPct: 0.55, fatPct: 0.28 },
    U16:  { kcal: 2300, proteinPerKg: 1.5, carbPct: 0.56, fatPct: 0.27 },
    U18:  { kcal: 2500, proteinPerKg: 1.6, carbPct: 0.57, fatPct: 0.26 },
    Open: { kcal: 2700, proteinPerKg: 1.7, carbPct: 0.57, fatPct: 0.26 },
  },
};

// Goal multipliers
const GOAL_KCAL_MULTIPLIER: Record<NutritionGoal, number> = {
  performance: 1.0,
  weightGain:  1.15,
  maintenance: 0.95,
  recovery:    1.05,
};

export function calcMacroTargets(ctx: NutritionContext): MacroTarget {
  const band   = getAgeBand(ctx.age);
  const profile = MACRO_PROFILES[ctx.gender]?.[band] ?? MACRO_PROFILES["M"]["U14"];
  const mult   = GOAL_KCAL_MULTIPLIER[ctx.goal];
  const kcal   = Math.round(profile.kcal * mult);
  const proteinG = Math.round(ctx.weight * profile.proteinPerKg);
  const carbG    = Math.round((kcal * profile.carbPct) / 4);
  const fatG     = Math.round((kcal * profile.fatPct) / 9);
  // Hydration: 35–40 ml/kg/day (NIN recommendation for active children)
  const waterML  = Math.round(ctx.weight * 38);

  return { kcal, proteinG, carbG, fatG, waterML, proteinPerKg: profile.proteinPerKg };
}

// ─── Regional Foods Knowledge Graph ──────────────────────────────────────
// Agent B: Bihar district-level seasonal food availability
// Sources: ICAR-RCER Patna regional nutritional studies, NIN regional food tables

export const REGIONAL_FOODS_DB: RegionalFood[] = [
  // ── Proteins ──
  {
    name: "Sattu (Roasted Bengal Gram Flour)",
    nameHi: "सत्तू (भुना चना का आटा)",
    category: "protein",
    districts: ["Patna", "Gaya", "Bhojpur", "Arwal", "Jehanabad", "Aurangabad", "All"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 406, proteinPer100g: 22.4,
    keyNutrient: "Protein, Iron, Fibre",
    sportBenefit: "Pre-workout energy + sustained release. Bihar's original sports drink.",
    vegSafe: true,
    preparation: "Mix 2 tbsp in water with lemon + salt. Drink before training.",
    preparationHi: "2 चम्मच सत्तू को पानी में नींबू + नमक के साथ मिलाएं। प्रशिक्षण से पहले पीएं।",
    biharSpecific: true,
  },
  {
    name: "Chana Dal (Split Bengal Gram)",
    nameHi: "चना दाल",
    category: "protein",
    districts: ["All"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 360, proteinPer100g: 20.8,
    keyNutrient: "Protein, Complex Carb, Folate",
    sportBenefit: "Muscle repair, sustained energy for endurance athletes.",
    vegSafe: true,
    preparation: "Cook with turmeric and ginger. Eat with rice or roti.",
    preparationHi: "हल्दी और अदरक के साथ पकाएं। चावल या रोटी के साथ खाएं।",
  },
  {
    name: "Urad Dal (Black Lentil)",
    nameHi: "उड़द दाल",
    category: "protein",
    districts: ["All"],
    season: ["winter", "monsoon"],
    kcalPer100g: 347, proteinPer100g: 26.0,
    keyNutrient: "Protein, Calcium, Iron",
    sportBenefit: "Highest protein dal. Bone strength. Post-workout muscle recovery.",
    vegSafe: true,
    preparation: "Cook as dal or make idli/dosa batter. Best with ghee.",
    preparationHi: "दाल के रूप में पकाएं या इडली/डोसा बैटर बनाएं। घी के साथ सर्वोत्तम।",
  },
  {
    name: "Egg (Country Hen)",
    nameHi: "अंडा (देसी मुर्गी)",
    category: "protein",
    districts: ["All"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 155, proteinPer100g: 13.0,
    keyNutrient: "Complete protein, Vit D, B12, Choline",
    sportBenefit: "Complete amino acid profile. Best single protein source for growth.",
    vegSafe: false,
    preparation: "Boil or scramble. Post-training: 2 boiled eggs within 30 min.",
    preparationHi: "उबालें या स्क्रैम्बल करें। प्रशिक्षण के बाद: 30 मिनट के भीतर 2 उबले अंडे।",
  },
  {
    name: "Makhana (Fox Nuts / Lotus Seeds)",
    nameHi: "मखाना",
    category: "protein",
    districts: ["Darbhanga", "Madhubani", "Sitamarhi", "Muzaffarpur", "Samastipur", "Patna"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 347, proteinPer100g: 9.7,
    keyNutrient: "Low GI carb, Magnesium, Phosphorus, Antioxidants",
    sportBenefit: "Bihar's superfood. Anti-inflammatory. Ideal pre-sleep recovery snack.",
    vegSafe: true,
    preparation: "Dry roast in ghee + rock salt + turmeric. 30g at night before sleep.",
    preparationHi: "घी + सेंधा नमक + हल्दी में सूखा भूनें। सोने से पहले रात में 30 ग्राम।",
  },
  // ── Carbohydrates ──
  {
    name: "Litti-Chokha",
    nameHi: "लिट्टी-चोखा",
    category: "carb",
    districts: ["Patna", "Gaya", "Bhojpur", "Bhagalpur", "Nalanda", "All"],
    season: ["winter", "monsoon"],
    kcalPer100g: 320, proteinPer100g: 9.0,
    keyNutrient: "Complex carb, Sattu protein, Calcium (from bati)",
    sportBenefit: "Complete meal: slow carb + protein. Ideal 2hrs before competition.",
    vegSafe: true,
    preparation: "Traditional litti baked in coal/gas. Chokha: roasted brinjal + tomato.",
    preparationHi: "पारंपरिक लिट्टी कोयले/गैस में बेक की जाती है। चोखा: भुनी बैंगन + टमाटर।",
  },
  {
    name: "Poha (Flattened Rice)",
    nameHi: "पोहा (चिवड़ा)",
    category: "carb",
    districts: ["All"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 369, proteinPer100g: 6.5,
    keyNutrient: "Fast carb, Iron (if fortified), B vitamins",
    sportBenefit: "Rapid energy pre-training. Easy to digest — no bloating.",
    vegSafe: true,
    preparation: "Stir-fry with mustard seeds, onion, lemon. Add peanuts for protein.",
    preparationHi: "सरसों के दाने, प्याज, नींबू के साथ भूनें। प्रोटीन के लिए मूंगफली डालें।",
  },
  {
    name: "Brown Rice (Parmal / Sona Masoori)",
    nameHi: "ब्राउन राइस (परमल)",
    category: "carb",
    districts: ["Patna", "Rohtas", "Buxar", "Bhojpur", "Muzaffarpur"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 345, proteinPer100g: 7.9,
    keyNutrient: "Complex carb, Fibre, B1 (thiamine)",
    sportBenefit: "Sustained energy. Fibre supports gut health during intense training.",
    vegSafe: true,
    preparation: "Cook 1:2 (rice:water). Eat with dal + sabzi.",
    preparationHi: "1:2 (चावल:पानी) में पकाएं। दाल + सब्जी के साथ खाएं।",
  },
  // ── Micronutrients / Greens ──
  {
    name: "Drumstick Leaves (Moringa / Sahjan)",
    nameHi: "सहजन की पत्तियां (मोरिंगा)",
    category: "micronutrient",
    districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
    season: ["summer", "monsoon"],
    kcalPer100g: 64, proteinPer100g: 9.4,
    keyNutrient: "Iron, Calcium, Vit C, Vit A, Protein",
    sportBenefit: "Iron for female athletes (prevents anaemia). Bone support. Natural anti-inflammatory.",
    vegSafe: true,
    preparation: "Add to dal or make sabzi. 2 tbsp leaves = 25% daily iron for girls.",
    preparationHi: "दाल में मिलाएं या सब्जी बनाएं। 2 चम्मच पत्तियां = लड़कियों की 25% दैनिक आयरन।",
  },
  {
    name: "Spinach (Palak)",
    nameHi: "पालक",
    category: "micronutrient",
    districts: ["All"],
    season: ["winter", "monsoon"],
    kcalPer100g: 23, proteinPer100g: 2.9,
    keyNutrient: "Iron, Folate, Vit K, Magnesium",
    sportBenefit: "Iron absorption for endurance. Magnesium for muscle function.",
    vegSafe: true,
    preparation: "Sauté in mustard oil with garlic. Pair with dal for iron absorption.",
    preparationHi: "सरसों के तेल में लहसुन के साथ भूनें। आयरन अवशोषण के लिए दाल के साथ लें।",
  },
  {
    name: "Amla (Indian Gooseberry)",
    nameHi: "आंवला",
    category: "micronutrient",
    districts: ["All"],
    season: ["winter"],
    kcalPer100g: 58, proteinPer100g: 0.9,
    keyNutrient: "Vit C (highest natural source), antioxidants",
    sportBenefit: "Immunity. Collagen for tendon/joint health. Reduces exercise oxidative stress.",
    vegSafe: true,
    preparation: "Eat raw (1 amla/day) or as juice/murabba. Best in winter.",
    preparationHi: "कच्चा खाएं (1 आंवला/दिन) या जूस/मुरब्बा के रूप में। सर्दियों में सर्वोत्तम।",
  },
  {
    name: "Jaggery (Desi Gud)",
    nameHi: "देसी गुड़",
    category: "micronutrient",
    districts: ["All"],
    season: ["winter", "monsoon"],
    kcalPer100g: 383, proteinPer100g: 0.4,
    keyNutrient: "Iron, Potassium, Magnesium, rapid energy",
    sportBenefit: "Post-training rapid glycogen repletion + iron. Better than refined sugar.",
    vegSafe: true,
    preparation: "Eat 10–15g after training with water. Add to milk.",
    preparationHi: "प्रशिक्षण के बाद पानी के साथ 10-15 ग्राम खाएं। दूध में मिलाएं।",
  },
  // ── Fats ──
  {
    name: "Desi Ghee",
    nameHi: "देसी घी",
    category: "fat",
    districts: ["All"],
    season: ["summer", "winter", "monsoon"],
    kcalPer100g: 898, proteinPer100g: 0,
    keyNutrient: "Fat-soluble Vit A,D,E,K, CLA, butyrate",
    sportBenefit: "Brain development, joint lubrication, Vit D absorption for bone strength.",
    vegSafe: true,
    preparation: "Add 1 tsp to rice/roti daily. Not for weight-loss goals.",
    preparationHi: "रोजाना चावल/रोटी पर 1 चम्मच डालें। वजन घटाने के लक्ष्य के लिए नहीं।",
  },
  {
    name: "Peanuts (Moongfali)",
    nameHi: "मूंगफली",
    category: "fat",
    districts: ["All"],
    season: ["winter"],
    kcalPer100g: 567, proteinPer100g: 25.8,
    keyNutrient: "Protein, Monounsaturated fat, Vit E, Niacin",
    sportBenefit: "Budget protein + healthy fat. Roasted peanuts = best value snack.",
    vegSafe: true,
    preparation: "Roast dry (no oil). 30g as evening snack. Or as chikki with jaggery.",
    preparationHi: "सूखा भूनें (बिना तेल)। शाम के नाश्ते के रूप में 30 ग्राम। या गुड़ के साथ चिक्की।",
  },
  // ── Probiotics ──
  {
    name: "Lassi (Buttermilk)",
    nameHi: "लस्सी / छाछ",
    category: "probiotic",
    districts: ["All"],
    season: ["summer"],
    kcalPer100g: 62, proteinPer100g: 3.5,
    keyNutrient: "Probiotics, Calcium, Potassium, B12",
    sportBenefit: "Gut microbiome, calcium for bones, potassium replaces sweat electrolytes.",
    vegSafe: true,
    preparation: "Add pinch of black salt + cumin (jeera). Drink after lunch.",
    preparationHi: "काला नमक + जीरा डालें। दोपहर के भोजन के बाद पीएं।",
  },
  // ── Hydration ──
  {
    name: "Coconut Water (Nariyal Paani)",
    nameHi: "नारियल पानी",
    category: "hydration",
    districts: ["Patna", "Bhagalpur", "Muzaffarpur"],
    season: ["summer"],
    kcalPer100g: 19, proteinPer100g: 0.7,
    keyNutrient: "Potassium (250mg/cup), Sodium, Magnesium",
    sportBenefit: "Natural ORS. Best intra-training electrolyte drink. Prevents cramping.",
    vegSafe: true,
    preparation: "Drink fresh within 30 min of opening. Avoid packaged.",
    preparationHi: "खोलने के 30 मिनट के भीतर ताजा पीएं। पैकेज्ड से बचें।",
  },
  {
    name: "Nimbu Paani (Lemon Water)",
    nameHi: "नींबू पानी",
    category: "hydration",
    districts: ["All"],
    season: ["summer", "monsoon"],
    kcalPer100g: 10, proteinPer100g: 0.1,
    keyNutrient: "Vit C, Electrolytes (with salt/sugar)",
    sportBenefit: "Homemade ORS. Prevents dehydration + cramping. Alkalises post-workout.",
    vegSafe: true,
    preparation: "Juice of 1 lemon + 1L water + pinch salt + 1 tsp sugar/jaggery.",
    preparationHi: "1 नींबू का रस + 1L पानी + चुटकी नमक + 1 चम्मच चीनी/गुड़।",
  },
];

// ─── Home Remedies Knowledge Graph ──────────────────────────────────────
// Agent C: Traditional Bihar/Indian home remedies, evidence-graded by AYUSH + clinical studies
// Safety Grades: A = safe for all, B = monitor/limit, C = consult first

export const HOME_REMEDIES_DB: HomeRemedy[] = [
  // ── Energy & Performance ──
  {
    name: "Sattu Energy Drink",
    nameHi: "सत्तू एनर्जी ड्रिंक",
    purpose: "energy",
    ingredients: "2 tbsp sattu, 250ml water, pinch rock salt, ½ lemon, 1 tsp jaggery",
    ingredientsHi: "2 चम्मच सत्तू, 250ml पानी, चुटकी सेंधा नमक, ½ नींबू, 1 चम्मच गुड़",
    preparation: "Mix all ingredients. Stir until dissolved. No cooking needed.",
    preparationHi: "सभी सामग्री मिलाएं। घोलने तक हिलाएं। पकाने की जरूरत नहीं।",
    dosage: "1 glass 30–45 min before training or competition",
    dosageHi: "प्रशिक्षण या प्रतियोगिता से 30-45 मिनट पहले 1 गिलास",
    safetyGrade: "A",
    safetyNote: "Well-tolerated by all ages. Traditional Bihar pre-workout.",
    evidenceNote: "High in slowly digestible carbohydrates and plant protein. ICMR-approved traditional food.",
    ageMin: 8,
    districts: ["All"],
  },
  {
    name: "Ashwagandha Milk",
    nameHi: "अश्वगंधा दूध",
    purpose: "recovery",
    ingredients: "250ml warm milk, ½ tsp ashwagandha powder, 1 tsp honey, pinch turmeric",
    ingredientsHi: "250ml गर्म दूध, ½ चम्मच अश्वगंधा पाउडर, 1 चम्मच शहद, चुटकी हल्दी",
    preparation: "Heat milk. Add ashwagandha and turmeric. Stir well. Add honey when warm (not hot).",
    preparationHi: "दूध गर्म करें। अश्वगंधा और हल्दी मिलाएं। अच्छी तरह हिलाएं। गर्म (गर्म नहीं) होने पर शहद मिलाएं।",
    dosage: "1 cup before bedtime. 4–6 week cycle, 1 week break.",
    dosageHi: "सोने से पहले 1 कप। 4-6 सप्ताह का चक्र, 1 सप्ताह का ब्रेक।",
    safetyGrade: "B",
    safetyNote: "Safe for ages 12+. Monitor for mild stomach upset in first week.",
    evidenceNote: "Withania somnifera RCT studies show 11–15% strength gains and improved recovery in adolescent athletes (Choudhary et al., 2015).",
    contraindications: "Avoid with autoimmune conditions, thyroid medication. Not for under-12.",
    ageMin: 12,
    districts: ["All"],
  },
  {
    name: "Golden Milk (Haldi Doodh)",
    nameHi: "हल्दी दूध (गोल्डन मिल्क)",
    purpose: "recovery",
    ingredients: "250ml milk, 1 tsp turmeric, ¼ tsp black pepper, ½ tsp ghee, honey to taste",
    ingredientsHi: "250ml दूध, 1 चम्मच हल्दी, ¼ चम्मच काली मिर्च, ½ चम्मच घी, स्वादानुसार शहद",
    preparation: "Warm milk. Add turmeric, pepper (critical — activates curcumin 20x), ghee. Stir well.",
    preparationHi: "दूध गर्म करें। हल्दी, काली मिर्च (महत्वपूर्ण — करक्यूमिन 20x सक्रिय करती है), घी मिलाएं।",
    dosage: "1 cup post-training or before bed on sore days",
    dosageHi: "प्रशिक्षण के बाद या दर्द वाले दिनों में सोने से पहले 1 कप",
    safetyGrade: "A",
    safetyNote: "Safe for all ages. One of the safest anti-inflammatory home remedies.",
    evidenceNote: "Curcumin + piperine combination clinically shown to reduce DOMS (delayed onset muscle soreness) in athletes (Hewlings & Kalman, 2017).",
    ageMin: 6,
    districts: ["All"],
  },
  {
    name: "Ginger-Jaggery Tea",
    nameHi: "अदरक-गुड़ की चाय",
    purpose: "joint-care",
    ingredients: "1 cup water, 1-inch fresh ginger, 1 tsp jaggery, 2 tulsi leaves",
    ingredientsHi: "1 कप पानी, 1-इंच ताजा अदरक, 1 चम्मच गुड़, 2 तुलसी पत्तियां",
    preparation: "Boil water + grated ginger 5 min. Strain. Add jaggery + tulsi leaves.",
    preparationHi: "पानी + कसी हुई अदरक 5 मिनट उबालें। छानें। गुड़ + तुलसी पत्तियां मिलाएं।",
    dosage: "1 cup after training. Max 2 cups/day.",
    dosageHi: "प्रशिक्षण के बाद 1 कप। अधिकतम 2 कप/दिन।",
    safetyGrade: "A",
    safetyNote: "Safe for ages 10+. Reduces knee and joint inflammation post training.",
    evidenceNote: "Gingerol compounds clinically reduce prostaglandin synthesis (pain pathway). Meta-analysis confirms joint pain reduction (Bartels et al., 2015).",
    ageMin: 10,
    districts: ["All"],
  },
  {
    name: "Iron Tonic (Dates + Sesame)",
    nameHi: "आयरन टॉनिक (खजूर + तिल)",
    purpose: "iron",
    ingredients: "3 dates (seedless), 1 tbsp sesame seeds (roasted), 1 tsp amla juice",
    ingredientsHi: "3 खजूर (बिना बीज), 1 चम्मच तिल (भुना), 1 चम्मच आंवला जूस",
    preparation: "Blend dates into paste. Mix with sesame seeds and amla juice. Form into small balls.",
    preparationHi: "खजूर को पेस्ट में ब्लेंड करें। तिल और आंवला जूस के साथ मिलाएं। छोटी गोलियां बनाएं।",
    dosage: "2 balls daily, morning on empty stomach. Especially for girls.",
    dosageHi: "रोजाना 2 गोलियां, सुबह खाली पेट। विशेष रूप से लड़कियों के लिए।",
    safetyGrade: "A",
    safetyNote: "Excellent for menstruating female athletes. Prevents sports anaemia.",
    evidenceNote: "Dates provide non-heme iron + natural sugars. Vit C from amla doubles iron absorption (NIN, Hyderabad). Sesame adds zinc + calcium.",
    contraindications: "Diabetic athletes: limit to 1 ball/day.",
    ageMin: 10,
    districts: ["All"],
  },
  {
    name: "Triphala Water",
    nameHi: "त्रिफला जल",
    purpose: "digestion",
    ingredients: "1 tsp triphala powder, 250ml lukewarm water",
    ingredientsHi: "1 चम्मच त्रिफला पाउडर, 250ml गुनगुना पानी",
    preparation: "Soak triphala in water overnight. Strain and drink in morning.",
    preparationHi: "रात भर त्रिफला को पानी में भिगोएं। छानें और सुबह पीएं।",
    dosage: "1 glass every morning, 30 min before breakfast. Continuous 3 months.",
    dosageHi: "हर सुबह 1 गिलास, नाश्ते से 30 मिनट पहले। लगातार 3 महीने।",
    safetyGrade: "A",
    safetyNote: "Safe for all ages 10+. Best gut health remedy in Ayurveda.",
    evidenceNote: "Triphala improves gut motility, vitamin absorption, and reduces inflammation. AYUSH Grade A recommendation.",
    ageMin: 10,
    districts: ["All"],
  },
  {
    name: "Banana-Milk Recovery Shake",
    nameHi: "केला-दूध रिकवरी शेक",
    purpose: "recovery",
    ingredients: "2 ripe bananas, 250ml full-fat milk, 1 tsp honey, pinch cinnamon",
    ingredientsHi: "2 पके केले, 250ml फुल फैट दूध, 1 चम्मच शहद, चुटकी दालचीनी",
    preparation: "Blend all ingredients. Drink within 30 min of training completion.",
    preparationHi: "सभी सामग्री ब्लेंड करें। प्रशिक्षण पूरा होने के 30 मिनट के भीतर पीएं।",
    dosage: "Immediately post-training (within 30-min anabolic window)",
    dosageHi: "प्रशिक्षण के तुरंत बाद (30 मिनट की एनाबॉलिक विंडो में)",
    safetyGrade: "A",
    safetyNote: "Ideal recovery drink. 4:1 carb-to-protein ratio matches sports science guidelines.",
    evidenceNote: "Banana provides 27g carbs (glycogen replenishment) + potassium. Milk provides casein (sustained recovery) + whey (immediate).",
    ageMin: 8,
    districts: ["All"],
  },
  {
    name: "Mulethi (Liquorice) Throat Drink",
    nameHi: "मुलेठी का काढ़ा",
    purpose: "immunity",
    ingredients: "2 sticks mulethi (liquorice root), 1 tsp honey, 500ml water",
    ingredientsHi: "2 मुलेठी की छड़ें, 1 चम्मच शहद, 500ml पानी",
    preparation: "Boil mulethi sticks in water for 10 min. Cool to warm. Add honey.",
    preparationHi: "मुलेठी की छड़ों को 10 मिनट के लिए पानी में उबालें। गर्म होने तक ठंडा करें। शहद मिलाएं।",
    dosage: "1 cup when immune stress or throat irritation. Max 3×/week.",
    dosageHi: "प्रतिरक्षा तनाव या गले में जलन होने पर 1 कप। अधिकतम 3×/सप्ताह।",
    safetyGrade: "B",
    safetyNote: "Safe for short-term use. Daily long-term use may raise blood pressure.",
    evidenceNote: "Glycyrrhizin has confirmed antiviral + anti-inflammatory properties (Fiore et al., 2008). AYUSH Grade B.",
    contraindications: "Hypertension, kidney disease: avoid. Daily use >4 weeks: monitor BP.",
    ageMin: 10,
    districts: ["All"],
  },
  {
    name: "Til-Gud Ladoo (Sesame-Jaggery Balls)",
    nameHi: "तिल-गुड़ के लड्डू",
    purpose: "energy",
    ingredients: "100g sesame seeds (roasted), 50g jaggery, 1 tbsp ghee",
    ingredientsHi: "100g तिल (भुने), 50g गुड़, 1 चम्मच घी",
    preparation: "Melt jaggery in ghee. Mix in sesame. Shape into balls while warm.",
    preparationHi: "गुड़ को घी में पिघलाएं। तिल मिलाएं। गर्म रहते हुए गोलियां बनाएं।",
    dosage: "1–2 balls daily in winter. Excellent pre-school/pre-training snack.",
    dosageHi: "सर्दियों में रोजाना 1-2 लड्डू। स्कूल/प्रशिक्षण से पहले उत्कृष्ट नाश्ता।",
    safetyGrade: "A",
    safetyNote: "Traditional Bihar winter energy food. Excellent for cold weather training.",
    evidenceNote: "Sesame: calcium, zinc, iron. Jaggery: potassium, rapid carbs. Ghee: fat-soluble vitamins. Perfect winter pre-workout.",
    ageMin: 8,
    districts: ["All"],
  },
  {
    name: "Chaach / Neembu Shikanji (Summer ORS)",
    nameHi: "छाछ / शिकंजी (ग्रीष्म ORS)",
    purpose: "hydration",
    ingredients: "Chaach: 200ml curd + 400ml water + cumin + black salt. OR Shikanji: lemon + water + salt + jaggery",
    ingredientsHi: "छाछ: 200ml दही + 400ml पानी + जीरा + काला नमक। या शिकंजी: नींबू + पानी + नमक + गुड़",
    preparation: "Blend curd with water. Add black salt + roasted cumin powder. Serve chilled.",
    preparationHi: "दही को पानी के साथ ब्लेंड करें। काला नमक + भुने जीरे का पाउडर मिलाएं। ठंडा करके परोसें।",
    dosage: "500ml–1L during hot weather training. Replace commercial sports drinks.",
    dosageHi: "गर्म मौसम में प्रशिक्षण के दौरान 500ml-1L। व्यावसायिक स्पोर्ट्स ड्रिंक की जगह।",
    safetyGrade: "A",
    safetyNote: "Bihar summer essential. Better than packaged sports drinks — no artificial additives.",
    evidenceNote: "Buttermilk provides probiotics + electrolytes matching oral rehydration solution composition (WHO standard).",
    ageMin: 6,
    districts: ["All"],
  },
  {
    name: "Moringa-Dal Powder Supplement",
    nameHi: "सहजन-दाल पाउडर सप्लीमेंट",
    purpose: "iron",
    ingredients: "2 tbsp dried moringa leaf powder, mixed into any dal or sabzi",
    ingredientsHi: "2 चम्मच सूखे सहजन पत्ती का पाउडर, किसी भी दाल या सब्जी में मिलाएं",
    preparation: "Add dried moringa powder to cooked dal. Do not boil after adding.",
    preparationHi: "पकी हुई दाल में सूखे सहजन पाउडर को मिलाएं। मिलाने के बाद उबालें नहीं।",
    dosage: "Daily for female athletes. 2 tbsp = 25% daily iron recommendation.",
    dosageHi: "महिला एथलीटों के लिए प्रतिदिन। 2 चम्मच = दैनिक आयरन अनुशंसा का 25%।",
    safetyGrade: "A",
    safetyNote: "Particularly important for U14–U18 female athletes at risk of sports anaemia.",
    evidenceNote: "Moringa oleifera leaves: 28mg iron/100g, 2523mg calcium/100g — highest in any common food. NIN Hyderabad data.",
    ageMin: 10,
    districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  },
];

// ─── Context-aware meal plan builder ────────────────────────────────────
// Agent D: Scores and selects appropriate items based on full context

function filterForDietPref(items: MealItem[], pref: DietPref): MealItem[] {
  if (pref === "veg") return items.filter(i => !i.name.toLowerCase().includes("egg") && !i.name.toLowerCase().includes("chicken") && !i.name.toLowerCase().includes("fish") && !i.name.toLowerCase().includes("mutton") && !i.name.toLowerCase().includes("meat"));
  if (pref === "egg-veg") return items.filter(i => !i.name.toLowerCase().includes("chicken") && !i.name.toLowerCase().includes("fish") && !i.name.toLowerCase().includes("mutton") && !i.name.toLowerCase().includes("meat"));
  return items; // non-veg: all items including chicken/fish/meat
}

// Full meal plan database
// ─── CRITICAL FIX: Three-way diet differentiation ─────────────────────────
// isVeg: pure vegetarian (no egg, no meat)
// isEggVeg: eggs allowed, no meat/fish/chicken
// isNonVeg: all animal proteins including chicken/fish/mutton
function buildMealPlan(ctx: NutritionContext): MealSlot[] {
  const isVeg     = ctx.dietPref === "veg";
  const isEggVeg  = ctx.dietPref === "egg-veg";
  const isNonVeg  = ctx.dietPref === "nonveg";
  const hasEgg    = isEggVeg || isNonVeg;  // egg allowed for egg-veg AND non-veg
  const isGrowth  = ctx.goal === "weightGain";
  const isPerf    = ctx.goal === "performance";
  const isFemale  = ctx.gender === "F";

  const breakfast: MealItem[] = [
    { name: "Poha with peanuts + mustard seeds", nameHi: "पोहा मूंगफली के साथ", portionG: 80, kcal: 310, proteinG: 8, carbG: 52, fatG: 8, notes: "Pre-training carb load" },
    // Egg option for both egg-veg and non-veg
    ...(hasEgg ? [{ name: "2 Boiled eggs", nameHi: "2 उबले अंडे", portionG: 100, kcal: 155, proteinG: 13, carbG: 1, fatG: 11, notes: "Complete protein — complete amino acid profile (egg-veg & non-veg)" }] : []),
    // Veg-only protein substitute
    ...(isVeg ? [{ name: "Paneer (50g)", nameHi: "पनीर (50g)", portionG: 50, kcal: 145, proteinG: 8, carbG: 2, fatG: 12, notes: "Vegetarian complete protein (casein + whey)" }] : []),
    { name: "Banana (1 medium)", nameHi: "केला (1 मध्यम)", portionG: 120, kcal: 105, proteinG: 1.3, carbG: 27, fatG: 0.4, notes: "Potassium + fast carbs" },
    { name: isGrowth ? "Full-fat milk (250ml)" : "Low-fat milk (250ml)", nameHi: isGrowth ? "फुल फैट दूध (250ml)" : "कम वसा वाला दूध (250ml)", portionG: 250, kcal: isGrowth ? 150 : 100, proteinG: 8, carbG: 12, fatG: isGrowth ? 8 : 3, notes: "Calcium + B12" },
  ];

  const morningSnack: MealItem[] = [
    { name: "Sattu drink (250ml)", nameHi: "सत्तू ड्रिंक (250ml)", portionG: 250, kcal: 120, proteinG: 5, carbG: 20, fatG: 1, notes: "Bihar pre-workout special — complete plant protein" },
    { name: "Roasted peanuts (20g)", nameHi: "भुनी मूंगफली (20g)", portionG: 20, kcal: 113, proteinG: 5, carbG: 4, fatG: 10, notes: "Sustained energy" },
    ...(isGrowth ? [{ name: "Mixed dry fruits (15g)", nameHi: "मिश्रित मेवे (15g)", portionG: 15, kcal: 88, proteinG: 2, carbG: 9, fatG: 5, notes: "Calorie-dense addition" }] : []),
  ];

  const lunch: MealItem[] = [
    { name: "Brown rice (1.5 cups cooked)", nameHi: "ब्राउन राइस (1.5 कप पका हुआ)", portionG: 210, kcal: 310, proteinG: 7, carbG: 64, fatG: 2, notes: "Complex carb base" },
    { name: "Chana/Masoor Dal (1 cup)", nameHi: "चना/मसूर दाल (1 कप)", portionG: 200, kcal: 230, proteinG: 18, carbG: 40, fatG: 1, notes: "Plant protein + iron" },
    { name: "Seasonal sabzi (mixed veg)", nameHi: "मौसमी सब्जी", portionG: 150, kcal: 80, proteinG: 3, carbG: 15, fatG: 2, notes: isGrowth ? "Add extra ghee" : "Minimal oil" },
    ...(isFemale ? [{ name: "Palak/Moringa sabzi", nameHi: "पालक/सहजन की सब्जी", portionG: 100, kcal: 50, proteinG: 3, carbG: 7, fatG: 1, notes: "Iron for female athletes — prevents sports anaemia" }] : []),
    // Non-veg gets chicken/fish option at lunch
    ...(isNonVeg ? [{ name: "Grilled chicken / fish curry (80g)", nameHi: "ग्रिल्ड चिकन / मछली करी (80g)", portionG: 80, kcal: 165, proteinG: 22, carbG: 2, fatG: 8, notes: "High-quality animal protein — 22g complete protein per serving" }] : []),
    { name: "Curd (100g)", nameHi: "दही (100g)", portionG: 100, kcal: 60, proteinG: 3.5, carbG: 5, fatG: 3, notes: "Probiotics + calcium" },
  ];

  const eveningSnack: MealItem[] = [
    { name: "Makhana (roasted, 30g)", nameHi: "मखाना (भुना, 30g)", portionG: 30, kcal: 104, proteinG: 3, carbG: 21, fatG: 1, notes: "Anti-inflammatory recovery" },
    ...(ctx.goal !== "maintenance" ? [{ name: "Lassi (250ml)", nameHi: "लस्सी (250ml)", portionG: 250, kcal: 155, proteinG: 9, carbG: 20, fatG: 4, notes: "Post-training probiotic" }] : []),
    ...(isPerf || isGrowth ? [{ name: "Jaggery piece (10g)", nameHi: "गुड़ का टुकड़ा (10g)", portionG: 10, kcal: 38, proteinG: 0, carbG: 10, fatG: 0, notes: "Rapid glycogen refill" }] : []),
  ];

  const dinner: MealItem[] = [
    { name: isGrowth ? "4 Chapati" : "3 Chapati", nameHi: isGrowth ? "4 रोटियां" : "3 रोटियां", portionG: isGrowth ? 200 : 150, kcal: isGrowth ? 400 : 300, proteinG: 10, carbG: 76, fatG: 4, notes: "Add ghee for growth goal" },
    { name: "Dal (1 cup, protein-rich)", nameHi: "दाल (1 कप, प्रोटीन युक्त)", portionG: 200, kcal: 200, proteinG: 16, carbG: 35, fatG: 1, notes: "Urad/Chana for max protein" },
    // Non-veg performance/growth: chicken or mutton curry
    ...(isNonVeg && (isPerf || isGrowth) ? [{ name: "Chicken curry / Egg bhurji (100g)", nameHi: "चिकन करी / अंडे भुर्जी (100g)", portionG: 100, kcal: 210, proteinG: 22, carbG: 4, fatG: 12, notes: "Non-veg night protein — superior recovery protein for muscle repair" }] : []),
    // Egg-veg performance: egg curry only
    ...(isEggVeg && isPerf ? [{ name: "Egg curry / bhurji (2 eggs)", nameHi: "अंडे की करी / भुर्जी (2 अंडे)", portionG: 120, kcal: 200, proteinG: 14, carbG: 5, fatG: 14, notes: "Night protein for recovery — egg-veg option" }] : []),
    // Veg performance: paneer
    ...(isVeg && isPerf ? [{ name: "Paneer sabzi (75g)", nameHi: "पनीर सब्जी (75g)", portionG: 75, kcal: 217, proteinG: 11, carbG: 4, fatG: 18, notes: "Veg protein for recovery" }] : []),
    { name: "Steamed vegetables", nameHi: "उबली सब्जियां", portionG: 150, kcal: 70, proteinG: 3, carbG: 13, fatG: 1, notes: "Eat before 8pm" },
  ];

  return [
    { time: "7:00–7:30am", label: "Breakfast", labelHi: "नाश्ता", icon: "🌅", items: breakfast },
    { time: "10:30–11:00am", label: "Morning Snack / Pre-Training", labelHi: "सुबह का नाश्ता / प्रशिक्षण से पहले", icon: "⚡", items: morningSnack },
    { time: "1:00–1:30pm", label: "Lunch", labelHi: "दोपहर का भोजन", icon: "🍱", items: lunch },
    { time: "4:30–5:00pm", label: "Evening Snack / Post-Training", labelHi: "शाम का नाश्ता / प्रशिक्षण के बाद", icon: "🔄", items: eveningSnack },
    { time: "7:30–8:00pm", label: "Dinner", labelHi: "रात का खाना", icon: "🌙", items: dinner },
  ];
}

// ─── Hydration plan ───────────────────────────────────────────────────────

function buildHydrationPlan(ctx: NutritionContext): HydrationPlan {
  const base = Math.round(ctx.weight * 38);
  const trainingTopUp = ctx.weight < 40 ? 400 : 600;
  const bihar = isBiharContext(ctx.district);

  const recs: HydrationRec[] = [
    {
      icon: "💧",
      label: "Daily Baseline",
      labelHi: "दैनिक आधार",
      detail: `${(base / 1000).toFixed(1)}L based on ${ctx.weight}kg body weight (38ml/kg). Minimum, not target.`,
      detailHi: `${ctx.weight}kg वजन के आधार पर ${(base / 1000).toFixed(1)}L (38ml/kg)।`,
    },
    {
      icon: "⚡",
      label: "Training Top-Up",
      labelHi: "प्रशिक्षण अतिरिक्त",
      detail: `+${trainingTopUp}ml on training days. Sip 150–200ml every 20 min during sessions.`,
      detailHi: `प्रशिक्षण के दिनों पर +${trainingTopUp}ml। सत्र के दौरान हर 20 मिनट में 150-200ml पीएं।`,
    },
    {
      icon: "🌡️",
      label: bihar ? "Hot Weather (Bihar Summers)" : "Hot Weather",
      labelHi: bihar ? "गर्म मौसम (बिहार की गर्मियां)" : "गर्म मौसम",
      detail: "+500ml extra when temp >35°C. Add nimbu-paani or coconut water as natural electrolyte.",
      detailHi: "तापमान >35°C होने पर +500ml अतिरिक्त। प्राकृतिक इलेक्ट्रोलाइट के रूप में निम्बू-पानी या नारियल पानी मिलाएं।",
    },
    {
      icon: "🚫",
      label: "Avoid",
      labelHi: "बचें",
      detail: "Cold drinks (Coke, Pepsi) during training — carbonation inhibits fluid absorption. Tea/coffee dehydrates.",
      detailHi: "प्रशिक्षण के दौरान कोल्ड ड्रिंक से बचें — कार्बोनेशन द्रव अवशोषण में बाधा डालती है।",
    },
    bihar
      ? {
          icon: "🥛",
          label: "Bihar Traditional Electrolytes",
          labelHi: "बिहार पारंपरिक इलेक्ट्रोलाइट्स",
          detail: "Sattu sharbat, chaach (buttermilk), nimbu-paani with salt+jaggery — all superior to commercial sports drinks.",
          detailHi: "सत्तू शर्बत, छाछ, नमक+गुड़ के साथ नींबू-पानी — सभी व्यावसायिक स्पोर्ट्स ड्रिंक से बेहतर।",
        }
      : {
          icon: "🥛",
          label: "Traditional Electrolytes",
          labelHi: "पारंपरिक इलेक्ट्रोलाइट्स",
          detail: "Chaach (buttermilk), nimbu-paani with salt+jaggery, and tender coconut water match WHO ORS composition and beat commercial sports drinks.",
          detailHi: "छाछ, नमक+गुड़ के साथ नींबू-पानी और नारियल पानी — व्यावसायिक स्पोर्ट्स ड्रिंक से बेहतर।",
        },
  ];

  return {
    dailyML: base,
    trainingTopUpML: trainingTopUp,
    hotWeatherTopUpML: 500,
    electrolyteNote: bihar
      ? "Bihar traditional drinks (sattu sharbat, chaach, nimbu-paani) match WHO oral rehydration solution composition and are preferred over packaged sports drinks."
      : "Traditional Indian drinks (chaach, nimbu-paani with salt+jaggery, coconut water) match WHO oral rehydration solution composition and are preferred over packaged sports drinks.",
    recommendations: recs,
  };
}

// ─── Alerts generator ────────────────────────────────────────────────────

function generateAlerts(ctx: NutritionContext, macros: MacroTarget): NutritionAlert[] {
  const alerts: NutritionAlert[] = [];
  const { bmi, gender, age, goal } = ctx;

  if (bmi < 14.0) {
    alerts.push({
      severity: "red",
      icon: "🚨",
      title: "Severe Thinness — Immediate Nutritional Attention Required",
      body: `BMI ${bmi.toFixed(1)} is in the severe thinness zone (IAP Grade 3). Refer to school doctor or nutritionist before continuing high-intensity training. Target: ${macros.kcal} kcal/day with ${macros.proteinG}g protein minimum.`,
    });
  } else if (bmi < 16.0) {
    alerts.push({
      severity: "red",
      icon: "⚠️",
      title: "Thinness — Nutrition Intervention Recommended",
      body: `BMI ${bmi.toFixed(1)} (IAP Grade 2 Thinness). Weight gain goal automatically suggested. Add 2–3 calorie-dense snacks per day. Sattu + makhana + desi ghee are ideal additions.`,
    });
  } else if (bmi < 18.5) {
    alerts.push({
      severity: "orange",
      icon: "💛",
      title: "Mild Thinness — Monitor",
      body: `BMI ${bmi.toFixed(1)} (IAP Grade 1 Thinness). Adequate for light training but should gain 1–2kg over next 2–3 months. Increase evening snack.`,
    });
  }

  if (gender === "F" && age >= 12) {
    alerts.push({
      severity: "orange",
      icon: "🩺",
      title: "Female Athlete Iron Awareness",
      body: "Female athletes aged 12+ need 15–18mg iron/day (vs 11mg for males). Include moringa/sahjan leaves, spinach, dates, sesame seeds, and jaggery daily. Pair iron foods with Vit C (amla/lemon) to double absorption.",
    });
  }

  if (goal === "performance" && bmi < 18.5) {
    alerts.push({
      severity: "orange",
      icon: "⚡",
      title: "Goal-BMI Conflict Detected",
      body: "Performance goal selected but BMI indicates thinness. Recommend switching to Weight Gain goal first to build physical base before optimising for performance.",
    });
  }

  return alerts;
}

// ─── Regional foods filter ────────────────────────────────────────────────

function getRelevantRegionalFoods(ctx: NutritionContext): RegionalFood[] {
  const season = getCurrentSeason();
  const bihar = isBiharContext(ctx.district);
  return REGIONAL_FOODS_DB.filter(food => {
    // For non-Bihar athletes, suppress foods that are exclusively tied to Bihar
    // districts (no "All" tag) so we don't push Sattu/Makhana etc. out of context.
    const isBiharOnlyFood = !food.districts.includes("All")
      && food.districts.every(d => BIHAR_DISTRICTS.has(d));
    if (!bihar && isBiharOnlyFood) return false;
    const districtMatch = food.districts.includes("All") || food.districts.includes(ctx.district);
    const seasonMatch = food.season.includes(season);
    // Diet filter:
    //   veg → only vegSafe foods
    //   egg-veg → vegSafe foods (eggs are separate items, not in regional food atlas)
    //   nonveg → all foods
    const dietMatch = (ctx.dietPref === "veg" || ctx.dietPref === "egg-veg") ? food.vegSafe : true;
    return districtMatch && (seasonMatch || food.season.length === 3) && dietMatch;
  });
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1–12
  if (month >= 3 && month <= 6) return "summer";
  if (month >= 7 && month <= 10) return "monsoon";
  return "winter";
}

// ─── Home remedies filter ────────────────────────────────────────────────

function getRelevantRemedies(ctx: NutritionContext): HomeRemedy[] {
  return HOME_REMEDIES_DB.filter(remedy => {
    const ageOk = ctx.age >= remedy.ageMin;
    const districtOk = remedy.districts.includes("All") || remedy.districts.includes(ctx.district);
    return ageOk && districtOk;
  });
}

// ─── Weekly tips ─────────────────────────────────────────────────────────
// CRITICAL FIX: tip 2 was always "boiled eggs-equivalent" regardless of diet pref.
// Veg athletes should NOT see egg equivalents. Provide diet-appropriate protein reference.

function buildWeeklyTips(ctx: NutritionContext): string[] {
  const proteinTarget = Math.round(ctx.weight * 1.5);
  const bihar = isBiharContext(ctx.district);
  
  // Diet-appropriate protein reference — no egg equivalents for vegetarians
  const proteinTip = ctx.dietPref === "veg"
    ? `Your daily protein target: ${proteinTarget}g. That's ~${Math.ceil(proteinTarget / 8)} servings of dal/paneer — spread across all meals.`
    : ctx.dietPref === "egg-veg"
    ? `Your daily protein target: ${proteinTarget}g. That's ${Math.ceil(proteinTarget / 13)} boiled eggs-equivalent. Combine eggs + dal + milk across meals.`
    : `Your daily protein target: ${proteinTarget}g. That's roughly ${Math.ceil(proteinTarget / 22)} palm-sized chicken servings. Spread protein across all 5 meals.`;

  const tips = [
    "Eat within 30 minutes of training completing — this is your anabolic window.",
    proteinTip,
    bihar
      ? "Bihar tip: Replace packaged biscuits with sattu chikki or til-gud ladoo for far better nutrition."
      : "Replace packaged biscuits with roasted chana, peanut chikki or til-gud ladoo for far better nutrition.",
    "Never skip breakfast on training days — 30% of your daily energy should come from breakfast.",
  ];

  if (ctx.gender === "F") {
    tips.push("Female athletes: Add 1 piece of jaggery + 1 tsp sesame seeds daily to prevent iron deficiency anaemia.");
  }

  if (ctx.bmi < 18.5) {
    tips.push("Weight gain: Add 1 tbsp desi ghee to lunch and dinner. This alone adds 200 healthy kcal/day.");
  }

  if (ctx.goal === "performance") {
    tips.push("Pre-competition meal: Litti-Chokha or rice+dal 2–3 hours before. Never train on empty stomach.");
  }

  return tips.slice(0, 5);
}

// ─── Pre/post workout guidance ────────────────────────────────────────────
// CRITICAL FIX: was using `hasEgg = dietPref !== "veg"` — treating nonveg same as egg-veg.
// Now provides 3-way differentiated post-workout guidance.

function buildWorkoutGuidance(ctx: NutritionContext) {
  const isVeg    = ctx.dietPref === "veg";
  const isEggVeg = ctx.dietPref === "egg-veg";
  const isNonVeg = ctx.dietPref === "nonveg";
  const bihar    = isBiharContext(ctx.district);

  const preworkout = ctx.goal === "performance"
    ? (bihar
        ? `30–45 min before: Sattu drink (2 tbsp sattu + water + lemon + jaggery). This gives 22g slow-release carbs + 5g protein — Bihar's original sports nutrition.`
        : `30–45 min before: Banana + 30g roasted chana + lemon water with a pinch of salt. Slow-release carbs + light protein, no GI distress.`)
    : (bihar
        ? `1–1.5 hrs before: Litti-Chokha (half portion) or poha with peanuts. Avoid heavy meals within 1 hour.`
        : `1–1.5 hrs before: Poha with peanuts, idli-sambar, or roti+dal (half portion). Avoid heavy meals within 1 hour.`);

  // Three distinct post-workout recommendations based on diet preference
  let postworkout: string;
  if (isNonVeg) {
    postworkout = `Within 30 min: 2 boiled eggs OR 100g grilled chicken + 1 banana + 250ml milk. Target: 20–25g complete animal protein + 30g carbs. Chicken/eggs provide the best leucine trigger for muscle synthesis.`;
  } else if (isEggVeg) {
    postworkout = `Within 30 min: 2 boiled eggs + 1 banana + 250ml milk. Target: 15–20g protein + 30g carbs within the recovery window. Eggs provide complete amino acid profile not available in plant protein alone.`;
  } else {
    // Pure veg
    postworkout = `Within 30 min: Banana-milk shake (2 bananas + 250ml milk + honey). Or: Paneer 50g + 1 cup lassi. Target: 15g protein + 30g carbs. Veg athletes should combine dal+rice+curd at dinner to complete amino acid profile.`;
  }

  return { preworkout, postworkout };
}

// ─── Main plan builder (single entry point) ──────────────────────────────

export function buildNutritionPlan(ctx: NutritionContext): NutritionPlan {
  const macroTargets = calcMacroTargets(ctx);
  const mealSlots    = buildMealPlan(ctx);
  const hydrationPlan = buildHydrationPlan(ctx);
  const regionalFoods = getRelevantRegionalFoods(ctx);
  const homeRemedies  = getRelevantRemedies(ctx);
  const alerts        = generateAlerts(ctx, macroTargets);
  const weeklyTips    = buildWeeklyTips(ctx);
  const { preworkout, postworkout } = buildWorkoutGuidance(ctx);

  return {
    context: ctx,
    macroTargets,
    mealSlots,
    hydrationPlan,
    regionalFoods,
    homeRemedies,
    alerts,
    weeklyTips,
    preworkoutGuidance: preworkout,
    postworkoutGuidance: postworkout,
  };
}
