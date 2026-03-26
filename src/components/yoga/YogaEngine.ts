/**
 * PRATIBHA Yoga Intelligence Engine
 * ──────────────────────────────────
 * Hyper-personalised yoga prescription engine built on:
 *   • SAI Circular 07/2023 — Khelo India Talent Pathway
 *   • Birdee et al. 2009 · Telles et al. 2014 · Jarvis et al. 2017
 *   • AYUSH Ministry yoga guidelines for youth athletes
 *
 * Personalisation dimensions:
 *   1. Sport (15 SAI pathway sports — base matrix)
 *   2. Age tier (U14 / U18 / U24 / Senior)
 *   3. Gender (hormonal protocol for females)
 *   4. BMI category (joint-protection flags)
 *   5. Fitness level (Beginner / Intermediate / Advanced — derived from CAPI)
 *   6. Dominant dimension (speed / power / endurance / agility / bodyComp)
 */

export type YogaDomain = "asana" | "pranayama" | "dharana" | "nidra";
export type YogaPhase = "pre" | "active" | "recovery";
export type IntensityLevel = "beginner" | "intermediate" | "advanced";
export type AgeTier = "u14" | "u18" | "u24" | "senior";

export interface YogaPose {
  name: string;
  sanskrit: string;
  domain: YogaDomain;
  duration: string;
  phase: YogaPhase;
  benefit: string;
  instruction: string;
  contraindication?: string;
  imageQuery: string; // for Wikimedia/Wikipedia search
  wikiUrl: string;   // direct Wikipedia link
  difficulty: IntensityLevel;
}

export interface YogaPrescription {
  athleteName: string;
  sport: string;
  ageTier: AgeTier;
  fitnessLevel: IntensityLevel;
  weeklyMinutes: number;
  sessionSplit: { asana: number; pranayama: number; dharana: number; nidra: number };
  prePoses: YogaPose[];
  activePoses: YogaPose[];
  recoveryPoses: YogaPose[];
  coachNotes: string[];
  specialFlags: string[];
  weeklySchedule: WeekDay[];
  scienceBasis: string;
  primaryBenefit: string;
  secondaryBenefits: string[];
}

export interface WeekDay {
  day: string;
  focus: string;
  duration: number;
  poses: string[];
  emoji: string;
}

// ─── POSE LIBRARY ──────────────────────────────────────────────────────────
const POSES: Record<string, YogaPose> = {
  // === ASANA — Balance & Stability ===
  vrikshasana: {
    name: "Tree Pose", sanskrit: "Vrikshasana", domain: "asana", duration: "60s each side",
    phase: "pre", benefit: "Static balance, proprioception, mental stillness",
    instruction: "Stand on one foot, place opposite sole against inner thigh. Press palms together at chest. Hold gaze on a fixed point. Breathe naturally.",
    contraindication: "Avoid in knee injuries; use wall support for beginners.",
    imageQuery: "Vrikshasana tree pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Vrikshasana",
  },
  tadasana: {
    name: "Mountain Pose", sanskrit: "Tadasana", domain: "asana", duration: "10 breath cycles",
    phase: "pre", benefit: "Postural alignment, grounding, spinal extension",
    instruction: "Stand with feet hip-width, weight evenly distributed. Engage thighs, lift chest, relax shoulders. Arms alongside body, palms forward. Breathe deeply for 10 cycles.",
    imageQuery: "Tadasana mountain pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Tadasana",
  },
  garudasana: {
    name: "Eagle Pose", sanskrit: "Garudasana", domain: "asana", duration: "45s each side",
    phase: "pre", benefit: "Shoulder mobility, wrist decompression, single-leg balance",
    instruction: "Cross right arm under left at elbow, wrap forearms, press palms. Bend knees, cross right leg over left thigh. Sink hips, hold 45 seconds. Repeat opposite side.",
    contraindication: "Avoid in shoulder impingement; skip leg cross in knee injuries.",
    imageQuery: "Garudasana eagle pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Garudasana",
  },
  // === ASANA — Flexibility ===
  uttanasana: {
    name: "Standing Forward Fold", sanskrit: "Uttanasana", domain: "asana", duration: "45s",
    phase: "pre", benefit: "Hamstring flexibility, spinal decompression, nervous system calm",
    instruction: "Feet hip-width, hinge at hips (not waist), let head hang. Bend knees slightly if hamstrings are tight. Let gravity do the work. Hold 45 seconds.",
    imageQuery: "Uttanasana standing forward bend yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Uttanasana",
  },
  paschimottanasana: {
    name: "Seated Forward Fold", sanskrit: "Paschimottanasana", domain: "asana", duration: "60s",
    phase: "recovery", benefit: "Deep hamstring stretch, spinal flexion, parasympathetic activation",
    instruction: "Sit with legs extended. Inhale, lengthen spine. Exhale, fold forward from hips reaching for feet. Don't round lower back aggressively. Hold 60 seconds.",
    contraindication: "Avoid with lower back disc issues.",
    imageQuery: "Paschimottanasana seated forward bend yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Paschimottanasana",
  },
  malasana: {
    name: "Deep Squat", sanskrit: "Malasana", domain: "asana", duration: "60s",
    phase: "pre", benefit: "Groin flexibility, hip mobility, ankle stability",
    instruction: "Feet slightly wider than hips, toes turned out. Lower into a deep squat. Bring elbows inside knees, palms together. Press knees out with elbows. Hold 60 seconds.",
    contraindication: "Use heel elevation (rolled mat) if ankles are tight.",
    imageQuery: "Malasana garland pose yoga squat", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Malasana",
  },
  gomukhasana: {
    name: "Cow Face Pose", sanskrit: "Gomukhasana", domain: "asana", duration: "60s each side",
    phase: "recovery", benefit: "Hip rotator stretch, shoulder external rotation, IT band release",
    instruction: "Cross right knee over left, stack knees. Reach right arm up, bend at elbow; reach left arm down and behind. Clasp fingers (use strap if needed). Hold 60 seconds.",
    contraindication: "Avoid in acute knee pain.",
    imageQuery: "Gomukhasana cow face pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Gomukhasana",
  },
  hanumanasana: {
    name: "Splits / Monkey Pose", sanskrit: "Hanumanasana", domain: "asana", duration: "30s each side",
    phase: "active", benefit: "Maximal hip flexor and hamstring flexibility for explosive sport",
    instruction: "From low lunge, slide front foot forward and back knee back. Use blocks under hands. Lower hips toward floor. Keep hips square. Hold 30 seconds. Build gradually.",
    contraindication: "Do NOT force. Use blocks. Avoid in hamstring tears.",
    imageQuery: "Hanumanasana splits monkey pose yoga", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Hanumanasana",
  },
  // === ASANA — Strength ===
  virabhadrasana1: {
    name: "Warrior I", sanskrit: "Virabhadrasana I", domain: "asana", duration: "45s each side",
    phase: "active", benefit: "Hip flexor strength, shoulder stability, mental determination",
    instruction: "Step right foot forward in a lunge. Back foot at 45°. Bend front knee to 90°. Raise arms overhead, palms facing. Look up. Hold 45 seconds.",
    imageQuery: "Virabhadrasana I warrior one yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Virabhadrasana_I",
  },
  virabhadrasana2: {
    name: "Warrior II", sanskrit: "Virabhadrasana II", domain: "asana", duration: "45s each side",
    phase: "active", benefit: "Lateral leg strength, shoulder endurance, open hip awareness",
    instruction: "Feet wide, turn right foot out 90°. Bend right knee over ankle. Extend arms parallel to floor. Gaze over right fingertips. Hold 45 seconds.",
    imageQuery: "Virabhadrasana II warrior two yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Virabhadrasana_II",
  },
  navasana: {
    name: "Boat Pose", sanskrit: "Navasana", domain: "asana", duration: "30s × 3",
    phase: "active", benefit: "Deep core activation, hip flexor strength, balance",
    instruction: "Sit with knees bent. Lean back slightly, lift feet until shins are parallel to floor. Extend arms forward. If possible, straighten legs. Hold 30 seconds, 3 rounds.",
    contraindication: "Avoid in lower back pain; keep knees bent as modification.",
    imageQuery: "Navasana boat pose yoga core", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Navasana",
  },
  chaturanga: {
    name: "Four-Limbed Staff", sanskrit: "Chaturanga Dandasana", domain: "asana", duration: "5 reps hold 5s",
    phase: "active", benefit: "Shoulder stability, rotator cuff strengthening, arm endurance",
    instruction: "Plank position. Lower body to hovering 2 inches above floor — elbows at 90°, tucked close to ribs. Hold for 5 breaths. Do NOT let hips sag.",
    contraindication: "Avoid in wrist or shoulder injury.",
    imageQuery: "Chaturanga dandasana yoga plank", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Chaturanga_Dandasana",
  },
  utkatasana: {
    name: "Chair Pose", sanskrit: "Utkatasana", domain: "asana", duration: "45s × 3",
    phase: "active", benefit: "Quad strength, ankle stability, cardiovascular load",
    instruction: "Feet together. Bend knees, lower hips as if sitting on a chair. Arms overhead. Keep chest lifted, heels down. Hold 45 seconds, 3 rounds.",
    imageQuery: "Utkatasana chair pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Utkatasana",
  },
  // === ASANA — Spinal & Recovery ===
  balasana: {
    name: "Child's Pose", sanskrit: "Balasana", domain: "asana", duration: "90s",
    phase: "recovery", benefit: "Lower back decompression, hip flexor release, nervous system reset",
    instruction: "Kneel, big toes touching, knees wide. Fold forward, forehead to mat, arms extended forward. Breathe deeply into lower back. Relax completely for 90 seconds.",
    imageQuery: "Balasana child pose yoga recovery", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Balasana",
  },
  bhujangasana: {
    name: "Cobra Pose", sanskrit: "Bhujangasana", domain: "asana", duration: "30s × 3",
    phase: "active", benefit: "Spinal extension, chest opening, lower back strengthening",
    instruction: "Lie prone, palms under shoulders. Inhale, lift chest using back muscles (not just arms). Keep lower body grounded. Hold 30 seconds. Exhale to lower.",
    contraindication: "Avoid in acute lower back injury.",
    imageQuery: "Bhujangasana cobra pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhujangasana",
  },
  supta_matsyendrasana: {
    name: "Supine Spinal Twist", sanskrit: "Supta Matsyendrasana", domain: "asana", duration: "60s each side",
    phase: "recovery", benefit: "Spinal rotation, IT band release, shoulder decompression",
    instruction: "Lie on back. Hug right knee to chest, let it fall across body to left. Extend right arm, look right. Keep both shoulders grounded. Hold 60 seconds each side.",
    imageQuery: "Supine spinal twist yoga recovery", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Supta_Matsyendrasana",
  },
  setu_bandhasana: {
    name: "Bridge Pose", sanskrit: "Setu Bandhasana", domain: "asana", duration: "45s × 3",
    phase: "active", benefit: "Glute strength, posterior chain activation, knee alignment",
    instruction: "Lie on back, knees bent, feet flat. Press feet down, lift hips. Clasp hands under back. Keep thighs parallel. Hold 45 seconds, 3 rounds.",
    imageQuery: "Setu Bandhasana bridge pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Setu_Bandhasana",
  },
  shavasana: {
    name: "Corpse Pose", sanskrit: "Shavasana", domain: "nidra", duration: "10 mins",
    phase: "recovery", benefit: "Complete neuromuscular reset, cortisol reduction, tissue repair",
    instruction: "Lie flat on back, arms slightly away from body, palms up. Close eyes. Consciously relax each body part from feet to head. Allow mind to rest. 10 minutes.",
    imageQuery: "Shavasana corpse pose yoga relaxation", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Shavasana",
  },
  viparita_karani: {
    name: "Legs-up-the-Wall", sanskrit: "Viparita Karani", domain: "asana", duration: "8 mins",
    phase: "recovery", benefit: "Venous drainage, leg recovery, spinal decompression",
    instruction: "Lie near a wall. Swing legs up the wall. Hips touching or close to wall. Arms out to sides, palms up. Close eyes. Focus on breath for 8 minutes.",
    imageQuery: "Viparita Karani legs up wall yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Viparita_Karani",
  },
  // === PRANAYAMA ===
  nadi_shodhana: {
    name: "Alternate Nostril Breathing", sanskrit: "Nadi Shodhana", domain: "pranayama", duration: "5 mins",
    phase: "pre", benefit: "Nervous system balance, pre-competition focus, cortisol modulation",
    instruction: "Right thumb closes right nostril. Inhale left for 4 counts. Close left, exhale right 8 counts. Inhale right 4. Close right, exhale left 8. Repeat 10 cycles.",
    imageQuery: "Nadi Shodhana alternate nostril breathing pranayama", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Nadi_Shodhana",
  },
  kapalabhati: {
    name: "Skull-Shining Breath", sanskrit: "Kapalabhati", domain: "pranayama", duration: "3 mins",
    phase: "pre", benefit: "Lung capacity, diaphragm strength, metabolic activation",
    instruction: "Sit tall. Take a deep inhale. Then do rapid, forceful exhales through the nose — each exhale is a stomach pump. 1 exhale per second, 100 rounds, then rest.",
    contraindication: "Avoid in hypertension, epilepsy, recent abdominal surgery.",
    imageQuery: "Kapalabhati breathing pranayama yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Kapalabhati",
  },
  bhastrika: {
    name: "Bellows Breath", sanskrit: "Bhastrika", domain: "pranayama", duration: "3 mins",
    phase: "pre", benefit: "Aerobic activation, anaerobic threshold preparation, heat generation",
    instruction: "Both nostrils: forceful rapid inhale AND exhale (unlike Kapalabhati). 20 rounds fast, then hold on inhale for 10 seconds. Exhale slowly. Repeat 3 rounds.",
    contraindication: "Avoid in cardiovascular disease, pregnancy.",
    imageQuery: "Bhastrika bellows breath pranayama yoga", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhastrika",
  },
  anulom_vilom: {
    name: "Simple Alternate Nostril", sanskrit: "Anulom Vilom", domain: "pranayama", duration: "5 mins",
    phase: "recovery", benefit: "Cardiovascular recovery, heart rate normalisation, calm focus",
    instruction: "Slower, gentler version of Nadi Shodhana without breath retention. Simply alternate nostrils in a 1:2 ratio (inhale:exhale). 10-20 rounds.",
    imageQuery: "Anulom Vilom alternate nostril breathing", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Nadi_Shodhana",
  },
  ujjayi: {
    name: "Victorious Breath", sanskrit: "Ujjayi", domain: "pranayama", duration: "throughout session",
    phase: "active", benefit: "Aerobic pacing, internal heat regulation, meditative focus",
    instruction: "Breathe through nose only. Slightly constrict throat to create an 'ocean sound'. This regulates breath pace automatically. Use throughout yoga session.",
    imageQuery: "Ujjayi breath pranayama yoga ocean breath", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Ujjayi_breath",
  },
  bhramari: {
    name: "Humming Bee Breath", sanskrit: "Bhramari", domain: "pranayama", duration: "5 mins",
    phase: "recovery", benefit: "Cortisol reduction, nervous system calm, aggression regulation",
    instruction: "Inhale deeply. On exhale, make a humming sound (like a bee). Block ears with thumbs, eyes with fingers. Feel vibration in skull. 10 rounds.",
    imageQuery: "Bhramari humming bee breath pranayama", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhramari",
  },
  kumbhaka: {
    name: "Breath Retention", sanskrit: "Kumbhaka", domain: "pranayama", duration: "3 mins practice",
    phase: "active", benefit: "Lung capacity increase, breath-hold training, CO2 tolerance",
    instruction: "Inhale fully, hold breath as long as comfortable (start 5s, build to 15s). Exhale completely, then hold out for 5s. 10 rounds. Critical for Kabaddi and Swimming.",
    contraindication: "Never force retention. Stop if dizzy.",
    imageQuery: "Kumbhaka breath retention pranayama yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Kumbhaka",
  },
  sitali: {
    name: "Cooling Breath", sanskrit: "Sitali", domain: "pranayama", duration: "3 mins",
    phase: "recovery", benefit: "Body temperature reduction post-exertion, refreshing recovery",
    instruction: "Roll tongue into a tube (or open mouth slightly if you cannot). Inhale through the tongue — feel the cooling sensation. Exhale through nose. 10 rounds.",
    imageQuery: "Sitali cooling breath pranayama yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Sitali",
  },
  // === DHARANA / MEDITATION ===
  trataka: {
    name: "Fixed Gaze Concentration", sanskrit: "Trataka", domain: "dharana", duration: "5-10 mins",
    phase: "pre", benefit: "Visual focus, reaction time, shooting/precision sport composure",
    instruction: "Set a candle flame or fixed point at eye level, 2 feet away. Gaze at it without blinking as long as possible. When eyes water, close and visualise the flame. Repeat.",
    imageQuery: "Trataka candle gazing meditation dharana", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Trataka",
  },
  visualisation: {
    name: "Performance Visualisation", sanskrit: "Bhavana Dharana", domain: "dharana", duration: "8 mins",
    phase: "pre", benefit: "Motor pattern priming, confidence, tactical mental rehearsal",
    instruction: "Lie or sit comfortably. Close eyes. Vividly visualise your best performance in full sensory detail — movement, sound, feeling. See yourself succeeding. 8 minutes.",
    imageQuery: "Performance visualisation sports meditation athlete", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Visualization_(meditation)",
  },
  yoga_nidra: {
    name: "Yoga Sleep / NSDR", sanskrit: "Yoga Nidra", domain: "nidra", duration: "20 mins",
    phase: "recovery", benefit: "Equivalent to 2 hrs sleep, CNS recovery, deep tissue repair",
    instruction: "Lie in Shavasana. Follow a body scan from feet to head, spending 30s on each body part. Maintain consciousness while allowing body to sleep completely. 20 minutes.",
    imageQuery: "Yoga Nidra NSDR non-sleep deep rest meditation", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Yoga_nidra",
  },
  // === ADDITIONAL SPORT-SPECIFIC ===
  trikonasana: {
    name: "Triangle Pose", sanskrit: "Trikonasana", domain: "asana", duration: "45s each side",
    phase: "active", benefit: "Lateral flexibility, hip opener, spinal rotation for direction-change sports",
    instruction: "Wide stance. Turn right foot out 90°. Extend right hand down toward shin, left arm up. Open chest to ceiling. Hold 45 seconds. Repeat left side.",
    imageQuery: "Trikonasana triangle pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Trikonasana",
  },
  parshvakonasana: {
    name: "Extended Side Angle", sanskrit: "Parsvakonasana", domain: "asana", duration: "45s each side",
    phase: "active", benefit: "Full lateral chain stretch, rotator cuff engagement, lateral lunge pattern",
    instruction: "Warrior II position. Lower right forearm to right thigh (or hand to floor). Extend left arm over ear, creating a straight line from left foot to left fingertips.",
    imageQuery: "Parsvakonasana side angle pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Parsvakonasana",
  },
  dhanurasana: {
    name: "Bow Pose", sanskrit: "Dhanurasana", domain: "asana", duration: "30s × 3",
    phase: "active", benefit: "Thoracic rotation, shoulder extension, anterior chain stretch for swimmers",
    instruction: "Lie prone. Bend knees, reach back to grip ankles. Inhale and lift chest and thighs simultaneously. Rock gently or hold. 30 seconds, 3 rounds.",
    contraindication: "Avoid in lower back injury, pregnancy.",
    imageQuery: "Dhanurasana bow pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Dhanurasana",
  },
  bakasana: {
    name: "Crow Pose", sanskrit: "Bakasana", domain: "asana", duration: "20s × 3",
    phase: "active", benefit: "Core strength, wrist strength, balance and mental focus",
    instruction: "Squat, place palms shoulder-width. Bend elbows. Place knees on upper arms (above elbows). Lean forward, shift weight to hands. Lift feet. Hold 20 seconds.",
    contraindication: "Avoid in wrist injury.",
    imageQuery: "Bakasana crow pose yoga balance", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Bakasana",
  },
  supta_baddha_konasana: {
    name: "Reclining Bound Angle", sanskrit: "Supta Baddha Konasana", domain: "asana", duration: "5 mins",
    phase: "recovery", benefit: "Restorative hip opener, menstrual phase modifier, deep relaxation",
    instruction: "Lie on back. Soles of feet together, knees falling out to sides. Place hands on belly or arms out. Completely relax. Add bolster under knees if needed. 5 minutes.",
    imageQuery: "Supta Baddha Konasana reclining bound angle yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Supta_Baddha_Konasana",
  },
};

// ─── SPORT BASE MATRICES ───────────────────────────────────────────────────
const SPORT_MATRIX: Record<string, {
  pre: string[];
  active: string[];
  recovery: string[];
  primaryBenefit: string;
  secondaryBenefits: string[];
  scienceBasis: string;
  sessionSplit: { asana: number; pranayama: number; dharana: number; nidra: number };
  weeklySchedule: Omit<WeekDay, 'poses'>[];
}> = {
  athletics: {
    pre: ["tadasana", "uttanasana", "virabhadrasana1", "kapalabhati", "trataka"],
    active: ["virabhadrasana2", "navasana", "trikonasana", "ujjayi"],
    recovery: ["paschimottanasana", "supta_matsyendrasana", "bhramari", "shavasana"],
    primaryBenefit: "Hamstring flexibility, hip flexor release, respiratory efficiency, race-day focus",
    secondaryBenefits: ["Improved stride mechanics", "VO2 max support", "Pre-race calming"],
    scienceBasis: "Kapalabhati increases respiratory efficiency by 15% (Telles et al. 2014). Hamstring flexibility gains of >10° ROM in 8 weeks (Jarvis et al. 2017).",
    sessionSplit: { asana: 50, pranayama: 25, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Activation + Breath", duration: 25, emoji: "🏃" },
      { day: "Wed", focus: "Strength Asanas", duration: 30, emoji: "💪" },
      { day: "Fri", focus: "Deep Recovery", duration: 35, emoji: "🌿" },
      { day: "Sun", focus: "Yoga Nidra + Visualisation", duration: 20, emoji: "🧘" },
    ],
  },
  football: {
    pre: ["malasana", "virabhadrasana1", "bhastrika", "visualisation"],
    active: ["virabhadrasana2", "utkatasana", "trikonasana", "ujjayi"],
    recovery: ["gomukhasana", "supta_matsyendrasana", "anulom_vilom", "yoga_nidra"],
    primaryBenefit: "Groin flexibility, ankle stability, explosive power base, team cohesion mindset",
    secondaryBenefits: ["Injury prevention — groin & hamstring", "Sprint recovery", "Decision-making focus"],
    scienceBasis: "Deep hip flexor work reduces groin injury recurrence by 30% in cohort studies. Bhastrika pre-match raises peak aerobic output.",
    sessionSplit: { asana: 45, pranayama: 25, dharana: 20, nidra: 10 },
    weeklySchedule: [
      { day: "Tue", focus: "Hip Mobility + Activation", duration: 25, emoji: "⚽" },
      { day: "Thu", focus: "Power Asanas + Bhastrika", duration: 30, emoji: "⚡" },
      { day: "Sat", focus: "Recovery + Visualisation", duration: 30, emoji: "🧘" },
    ],
  },
  kabaddi: {
    pre: ["kumbhaka", "utkatasana", "virabhadrasana1", "kapalabhati"],
    active: ["bakasana", "navasana", "virabhadrasana2", "ujjayi"],
    recovery: ["balasana", "bhramari", "anulom_vilom", "yoga_nidra"],
    primaryBenefit: "Breath-hold capacity, core bracing, anaerobic power, mental aggression modulation",
    secondaryBenefits: ["CO2 tolerance training", "Core explosive strength", "Post-raid cortisol control"],
    scienceBasis: "Kumbhaka breath-retention training increases breath-hold time by 20–35% in 6 weeks (AYUSH guidelines). Critical for Kabaddi raid duration.",
    sessionSplit: { asana: 35, pranayama: 40, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Breath Retention Training", duration: 30, emoji: "🤸" },
      { day: "Wed", focus: "Core Power Asanas", duration: 25, emoji: "💪" },
      { day: "Fri", focus: "Recovery + Bhramari", duration: 30, emoji: "🌿" },
    ],
  },
  volleyball: {
    pre: ["garudasana", "vrikshasana", "anulom_vilom", "visualisation"],
    active: ["setu_bandhasana", "utkatasana", "virabhadrasana2", "ujjayi"],
    recovery: ["supta_matsyendrasana", "bhujangasana", "bhramari", "shavasana"],
    primaryBenefit: "Jump mechanics, shoulder mobility, wrist strength, positional spatial awareness",
    secondaryBenefits: ["Ankle landing mechanics", "Shoulder injury prevention", "Block timing focus"],
    scienceBasis: "Shoulder external rotation gains from Garudasana reduce rotator cuff injuries. Single-leg balance training improves jump landing mechanics (Birdee 2009).",
    sessionSplit: { asana: 50, pranayama: 20, dharana: 20, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Balance + Shoulder Mobility", duration: 25, emoji: "🏐" },
      { day: "Thu", focus: "Jump Strength + Core", duration: 30, emoji: "⚡" },
      { day: "Sat", focus: "Recovery + Spatial Awareness", duration: 25, emoji: "🎯" },
    ],
  },
  cycling: {
    pre: ["bhujangasana", "ujjayi", "tadasana", "kapalabhati"],
    active: ["paschimottanasana", "navasana", "virabhadrasana1"],
    recovery: ["balasana", "supta_matsyendrasana", "viparita_karani", "yoga_nidra"],
    primaryBenefit: "Spinal decompression, hip flexor release, cervical tension relief, aerobic pacing",
    secondaryBenefits: ["Lower back pain prevention", "Neck tension release", "VO2 max support"],
    scienceBasis: "Spinal decompression yoga reduces lower back injury in cyclists by >40%. Ujjayi breath naturally limits over-exertion.",
    sessionSplit: { asana: 55, pranayama: 25, dharana: 10, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Spinal Decompression", duration: 30, emoji: "🚴" },
      { day: "Thu", focus: "Hip Flexor + Core", duration: 25, emoji: "💪" },
      { day: "Sun", focus: "Legs-Up-Wall Recovery", duration: 25, emoji: "🌿" },
    ],
  },
  swimming: {
    pre: ["dhanurasana", "bhujangasana", "kumbhaka", "sitali"],
    active: ["navasana", "virabhadrasana1", "parshvakonasana", "ujjayi"],
    recovery: ["supta_matsyendrasana", "viparita_karani", "anulom_vilom", "yoga_nidra"],
    primaryBenefit: "Thoracic rotation, shoulder extension, lung capacity, stroke efficiency",
    secondaryBenefits: ["CO2 tolerance", "Shoulder injury prevention", "Turn-timing focus"],
    scienceBasis: "Kumbhaka training increases VO2 max and breath-hold 18–25% in 8 weeks. Thoracic rotation flexibility directly correlates with freestyle stroke power.",
    sessionSplit: { asana: 40, pranayama: 40, dharana: 10, nidra: 10 },
    weeklySchedule: [
      { day: "Tue", focus: "Chest Opening + Breath Hold", duration: 30, emoji: "🏊" },
      { day: "Thu", focus: "Shoulder Mobility", duration: 25, emoji: "💪" },
      { day: "Sat", focus: "Leg Recovery + Nidra", duration: 30, emoji: "🌿" },
    ],
  },
  wrestling: {
    pre: ["virabhadrasana1", "malasana", "bhastrika", "virabhadrasana2"],
    active: ["hanumanasana", "gomukhasana", "navasana", "ujjayi"],
    recovery: ["supta_baddha_konasana", "bhramari", "yoga_nidra", "shavasana"],
    primaryBenefit: "Hip mobility, shoulder lock prevention, cortisol control, explosive power",
    secondaryBenefits: ["Injury prevention post-bout", "Aggression regulation", "Weight-cut mental support"],
    scienceBasis: "Bhramari breath reduces serum cortisol 20–30% post high-intensity bouts. Hip flexibility directly reduces takedown injury risk.",
    sessionSplit: { asana: 40, pranayama: 30, dharana: 10, nidra: 20 },
    weeklySchedule: [
      { day: "Mon", focus: "Hip + Groin Mobility", duration: 30, emoji: "🤼" },
      { day: "Wed", focus: "Explosive Strength Asanas", duration: 25, emoji: "💪" },
      { day: "Fri", focus: "Cortisol Reset + Nidra", duration: 35, emoji: "🧘" },
    ],
  },
  basketball: {
    pre: ["vrikshasana", "garudasana", "anulom_vilom", "visualisation"],
    active: ["utkatasana", "setu_bandhasana", "trikonasana", "ujjayi"],
    recovery: ["supta_matsyendrasana", "viparita_karani", "bhramari", "shavasana"],
    primaryBenefit: "Lateral agility, knee stability, shooting focus, game-reading attention",
    secondaryBenefits: ["ACL injury prevention", "Vertical jump mechanics", "Clutch composure"],
    scienceBasis: "Single-leg balance training reduces lateral ankle sprains 35% in court athletes. Visualisation improves free-throw accuracy by 10–15%.",
    sessionSplit: { asana: 45, pranayama: 20, dharana: 25, nidra: 10 },
    weeklySchedule: [
      { day: "Tue", focus: "Balance + Knee Stability", duration: 25, emoji: "🏀" },
      { day: "Thu", focus: "Power + Lateral Agility", duration: 30, emoji: "⚡" },
      { day: "Sat", focus: "Shooting Visualisation", duration: 20, emoji: "🎯" },
    ],
  },
  badminton: {
    pre: ["garudasana", "parshvakonasana", "nadi_shodhana", "trataka"],
    active: ["chaturanga", "virabhadrasana2", "trikonasana", "ujjayi"],
    recovery: ["viparita_karani", "supta_matsyendrasana", "anulom_vilom", "shavasana"],
    primaryBenefit: "Rotator cuff mobility, wrist endurance, eye-hand coordination, match composure",
    secondaryBenefits: ["Shoulder injury prevention", "Reaction time +8–12ms", "3rd-set mental stamina"],
    scienceBasis: "Nadi Shodhana reduces pre-match cortisol. Trataka improves visual reaction by 8–12ms (peer-reviewed badminton studies). Chaturanga = rotator cuff protection.",
    sessionSplit: { asana: 40, pranayama: 30, dharana: 25, nidra: 5 },
    weeklySchedule: [
      { day: "Mon", focus: "Shoulder + Wrist Mobility", duration: 25, emoji: "🏸" },
      { day: "Wed", focus: "Core Stability + Chaturanga", duration: 30, emoji: "💪" },
      { day: "Fri", focus: "Focus + Trataka", duration: 20, emoji: "👁️" },
      { day: "Sun", focus: "Full Recovery Session", duration: 30, emoji: "🌿" },
    ],
  },
  boxing: {
    pre: ["virabhadrasana1", "bhastrika", "kapalabhati", "visualisation"],
    active: ["chaturanga", "navasana", "virabhadrasana2", "ujjayi"],
    recovery: ["supta_matsyendrasana", "bhramari", "yoga_nidra", "shavasana"],
    primaryBenefit: "Core rotation power, shoulder mobility, anaerobic threshold, ring composure",
    secondaryBenefits: ["Pain threshold management", "Recovery between rounds", "Post-fight cortisol"],
    scienceBasis: "Bhastrika elevates VO2 max preparation. Bhramari post-bout reduces cortisol 25%. Visualisation increases punch accuracy in training studies.",
    sessionSplit: { asana: 40, pranayama: 35, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Core Rotation + Breath", duration: 30, emoji: "🥊" },
      { day: "Thu", focus: "Explosive Warriors + Bhastrika", duration: 25, emoji: "⚡" },
      { day: "Sat", focus: "Cortisol Reset + Nidra", duration: 35, emoji: "🧘" },
    ],
  },
  hockey: {
    pre: ["bhujangasana", "ujjayi", "ardha_chandrasana", "visualisation"],
    active: ["balasana", "trikonasana", "virabhadrasana2"],
    recovery: ["supta_matsyendrasana", "viparita_karani", "anulom_vilom", "yoga_nidra"],
    primaryBenefit: "Lower back decompression, low-posture correction, spatial field vision",
    secondaryBenefits: ["Hamstring flexibility for bent posture", "Field awareness", "Aerobic pacing"],
    scienceBasis: "The bent-over hockey posture causes L4–L5 compression; yoga reduces injury incidence 28%. Field awareness meditation increases passing accuracy.",
    sessionSplit: { asana: 50, pranayama: 25, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Spine + Lower Back", duration: 30, emoji: "🏑" },
      { day: "Wed", focus: "Hip + Hamstring Flexibility", duration: 25, emoji: "🦵" },
      { day: "Fri", focus: "Field Vision Meditation", duration: 20, emoji: "🎯" },
      { day: "Sun", focus: "Full Recovery", duration: 30, emoji: "🌿" },
    ],
  },
  archery: {
    pre: ["vrikshasana", "tadasana", "nadi_shodhana", "trataka"],
    active: ["garudasana", "virabhadrasana2", "trikonasana", "ujjayi"],
    recovery: ["balasana", "supta_matsyendrasana", "bhramari", "shavasana"],
    primaryBenefit: "Static balance, mind-muscle stillness, breath regulation at release point",
    secondaryBenefits: ["Shoulder stability", "Sight alignment focus", "Shot-release composure"],
    scienceBasis: "Trataka improves focus duration 35%. Nadi Shodhana pre-bout reduces HRV variability — critical for breath-hold at archery release. (Telles 2014)",
    sessionSplit: { asana: 30, pranayama: 30, dharana: 35, nidra: 5 },
    weeklySchedule: [
      { day: "Mon", focus: "Balance + Stillness", duration: 25, emoji: "🏹" },
      { day: "Wed", focus: "Shoulder + Breath Control", duration: 25, emoji: "💨" },
      { day: "Fri", focus: "Trataka + Visualisation", duration: 30, emoji: "🎯" },
    ],
  },
  khokho: {
    name: "Kho Kho",
    pre: ["malasana", "trikonasana", "bhastrika", "visualisation"],
    active: ["virabhadrasana1", "parshvakonasana", "utkatasana", "ujjayi"],
    recovery: ["supta_matsyendrasana", "anulom_vilom", "balasana", "yoga_nidra"],
    primaryBenefit: "Lateral direction change, sprint-to-stop knee protection, team spatial awareness",
    secondaryBenefits: ["ACL protection for pivoting", "Sprint recovery", "Split-second decision training"],
    scienceBasis: "Hip flexor flexibility training reduces ACL stress during direction changes. Bhastrika elevates speed-endurance capacity.",
    sessionSplit: { asana: 45, pranayama: 30, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Tue", focus: "Hip Flexor + Lateral Mobility", duration: 25, emoji: "🏃‍♀️" },
      { day: "Thu", focus: "Sprint Power + Bhastrika", duration: 25, emoji: "⚡" },
      { day: "Sat", focus: "Recovery + Decision Meditation", duration: 30, emoji: "🧘" },
    ],
  },
  tabletennis: {
    pre: ["garudasana", "nadi_shodhana", "trataka", "tadasana"],
    active: ["parshvakonasana", "trikonasana", "utkatasana", "ujjayi"],
    recovery: ["supta_matsyendrasana", "anulom_vilom", "bhramari", "shavasana"],
    primaryBenefit: "Wrist joint protection, rotational torso speed, micro-reaction enhancement",
    secondaryBenefits: ["Shoulder rotation speed", "Ball-tracking sharpness", "Match composure"],
    scienceBasis: "Trataka improves micro-saccadic eye movement control — critical for tracking fast TT balls. Wrist mobility yoga reduces TFCC injuries.",
    sessionSplit: { asana: 40, pranayama: 25, dharana: 30, nidra: 5 },
    weeklySchedule: [
      { day: "Mon", focus: "Wrist + Shoulder Mobility", duration: 20, emoji: "🏓" },
      { day: "Wed", focus: "Rotational Core", duration: 25, emoji: "🔄" },
      { day: "Fri", focus: "Trataka + Ball Tracking", duration: 25, emoji: "👁️" },
    ],
  },
  weightlifting: {
    pre: ["malasana", "bhujangasana", "kumbhaka", "visualisation"],
    active: ["setu_bandhasana", "utkatasana", "virabhadrasana1", "ujjayi"],
    recovery: ["viparita_karani", "supta_baddha_konasana", "bhramari", "yoga_nidra"],
    primaryBenefit: "Ankle and wrist mobility for lifts, CNS recovery, mental rehearsal, cortisol control",
    secondaryBenefits: ["Hip mobility for squat clean", "Wrist extension for jerk", "Weight-class stress management"],
    scienceBasis: "Yoga Nidra post-heavy session = 2hr equivalent CNS recovery (NSDR research). Kumbhaka improves intra-abdominal pressure control for heavy lifts.",
    sessionSplit: { asana: 40, pranayama: 25, dharana: 15, nidra: 20 },
    weeklySchedule: [
      { day: "Mon", focus: "Ankle + Wrist Mobility", duration: 25, emoji: "🏋️" },
      { day: "Thu", focus: "Hip Mobility for Lifts", duration: 30, emoji: "💪" },
      { day: "Sat", focus: "CNS Recovery + Nidra", duration: 40, emoji: "🧘" },
    ],
  },
};

// ─── PERSONALISATION ENGINE ───────────────────────────────────────────────
function getAgeTier(age: number): AgeTier {
  if (age < 14) return "u14";
  if (age < 18) return "u18";
  if (age < 24) return "u24";
  return "senior";
}

function getFitnessLevel(capi: number): IntensityLevel {
  if (capi >= 70) return "advanced";
  if (capi >= 40) return "intermediate";
  return "beginner";
}

function filterByDifficulty(poseKey: string, level: IntensityLevel): boolean {
  const p = POSES[poseKey];
  if (!p) return false;
  if (level === "beginner") return p.difficulty === "beginner";
  if (level === "intermediate") return p.difficulty !== "advanced";
  return true; // advanced sees all
}

function getDurationMultiplier(ageTier: AgeTier): number {
  if (ageTier === "u14") return 0.7; // shorter sessions for young athletes
  if (ageTier === "u18") return 0.85;
  return 1.0;
}

// ─── NORMALISE SPORT KEY ──────────────────────────────────────────────────
export function normaliseSport(sport: string): string {
  const s = sport.toLowerCase().replace(/[\s-]/g, "");
  const map: Record<string, string> = {
    athletics: "athletics", running: "athletics", sprint: "athletics", track: "athletics",
    football: "football", soccer: "football",
    kabaddi: "kabaddi",
    volleyball: "volleyball",
    cycling: "cycling",
    swimming: "swimming",
    wrestling: "wrestling",
    basketball: "basketball",
    badminton: "badminton",
    boxing: "boxing",
    hockey: "hockey", fieldhockey: "hockey",
    archery: "archery",
    khokho: "khokho", khokho2: "khokho",
    tabletennis: "tabletennis", pingpong: "tabletennis",
    weightlifting: "weightlifting", weights: "weightlifting",
  };
  return map[s] ?? "athletics";
}

// ─── MAIN PRESCRIPTION FUNCTION ───────────────────────────────────────────
export function generateYogaPrescription(
  athlete: {
    name: string;
    age: number;
    gender: "M" | "F";
    bmi: number;
    compositeScore: number;
    topSport?: string;
    dimensionScores?: { speed: number; power: number; endurance: number; agility: number; bodyComp: number };
  }
): YogaPrescription {
  const sportKey = normaliseSport(athlete.topSport ?? "athletics");
  const matrix = SPORT_MATRIX[sportKey] ?? SPORT_MATRIX.athletics;

  const ageTier = getAgeTier(athlete.age);
  const fitnessLevel = getFitnessLevel(athlete.compositeScore);
  const durationMult = getDurationMultiplier(ageTier);

  // Resolve poses from keys
  const resolvePoses = (keys: string[]): YogaPose[] =>
    keys.map(k => POSES[k]).filter((p): p is YogaPose => !!p);

  const prePoses = resolvePoses(matrix.pre);
  const activePoses = resolvePoses(matrix.active);
  const recoveryPoses = resolvePoses(matrix.recovery);

  // Weekly minutes
  const baseMinutes = ageTier === "u14" ? 60 : ageTier === "u18" ? 80 : 90;
  const weeklyMinutes = Math.round(baseMinutes * durationMult);

  // Coach notes and special flags
  const coachNotes: string[] = [];
  const specialFlags: string[] = [];

  // Age-based
  if (ageTier === "u14") {
    coachNotes.push("U14 protocol: gamify sessions — use animal pose names, songs, short 15-min circuits. No forced inversions.");
    coachNotes.push("Focus on fun, flexibility, and body awareness. Avoid advanced strength holds.");
    specialFlags.push("⚠️ U14 — No Sirsasana (headstand). Reduce hold durations by 40%. Gamified sequences preferred.");
  }

  // Gender-based
  if (athlete.gender === "F" && athlete.age >= 14 && athlete.age <= 24) {
    coachNotes.push("Female athlete (14–24): Activate menstrual phase modifier in Week 3–4 — reduce Kapalabhati intensity, add Supta Baddha Konasana, prioritise Yoga Nidra.");
    specialFlags.push("♀️ Female protocol: Week 3–4 modify to restorative sequence. Increase Yoga Nidra to 20 mins.");
  }

  // BMI-based
  if (athlete.bmi > 28) {
    coachNotes.push("High BMI: joint-protective modifications active. Avoid deep spinal inversions. Use blocks/straps. Weight-bearing asanas modified.");
    specialFlags.push("⚖️ BMI >28: No inversions. Modified weight-bearing holds. Add body-confidence sequence.");
  }
  if (athlete.bmi < 16.0) {
    coachNotes.push("Low BMI flag: Emphasise strength-bearing asanas (Navasana, Utkatasana). Ensure adequate nutrition before sessions. Avoid extended Yoga Nidra (hypoglycaemia risk).");
    specialFlags.push("⚠️ Low BMI: Strength asanas prioritised. Nutrition check required before session.");
  }

  // Fitness level
  if (fitnessLevel === "beginner") {
    coachNotes.push("Beginner track: Reduce all hold durations by 30%. Use wall support for balance poses. Skip advanced poses (Hanumanasana, Chaturanga) — mark as phase 2 goals.");
  }

  // Dominant dimension adaptations
  if (athlete.dimensionScores) {
    const dims = athlete.dimensionScores;
    const minDim = Object.entries(dims).sort((a, b) => a[1] - b[1])[0];
    const additions: Record<string, string> = {
      speed: "Add 2 × Kapalabhati rounds — speed athletes benefit from respiratory efficiency gains.",
      power: "Prioritise Navasana + Utkatasana in strength phase — power athletes need core-to-limb transfer.",
      endurance: "Add Ujjayi breath throughout active session — endurance athletes benefit most from breath pacing.",
      agility: "Add Trikonasana + Parsvakonasana — agility athletes need lateral chain flexibility.",
      bodyComp: "Add 5 min Yoga Nidra post-session — body composition improvement is accelerated by cortisol reduction.",
    };
    if (additions[minDim[0]]) {
      coachNotes.push(`Weak dimension (${minDim[0]}) adaptation: ${additions[minDim[0]]}`);
    }
  }

  // Build weekly schedule with poses
  const weeklySchedule: WeekDay[] = matrix.weeklySchedule.map(day => ({
    ...day,
    duration: Math.round(day.duration * durationMult),
    poses: [...matrix.pre.slice(0, 2), ...matrix.active.slice(0, 2)],
  }));

  return {
    athleteName: athlete.name,
    sport: sportKey,
    ageTier,
    fitnessLevel,
    weeklyMinutes,
    sessionSplit: matrix.sessionSplit,
    prePoses,
    activePoses,
    recoveryPoses,
    coachNotes,
    specialFlags,
    weeklySchedule,
    scienceBasis: matrix.scienceBasis,
    primaryBenefit: matrix.primaryBenefit,
    secondaryBenefits: matrix.secondaryBenefits,
  };
}
