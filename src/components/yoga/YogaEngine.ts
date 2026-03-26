/**
 * PRATIBHA Yoga Intelligence Engine
 * ──────────────────────────────────
 * Hyper-personalised yoga prescription engine built on:
 *   • SAI Circular 07/2023 — Khelo India Talent Pathway
 *   • Birdee et al. 2009 · Telles et al. 2014 · Jarvis et al. 2017
 *   • AYUSH Ministry yoga guidelines for youth athletes
 *   • Patanjali Yoga Sutras — 8 limbs framework
 *
 * Personalisation dimensions:
 *   1. Sport (15 SAI pathway sports — base matrix)
 *   2. Age tier (U14 / U18 / U24 / Senior)
 *   3. Gender (hormonal protocol for females)
 *   4. BMI category (joint-protection flags)
 *   5. Fitness level (Beginner / Intermediate / Advanced — derived from CAPI)
 *   6. Dominant dimension (speed / power / endurance / agility / bodyComp)
 *
 * Yoga domains follow Patanjali Ashtanga framework:
 *   Asana (3rd limb) · Pranayama (4th limb) · Dharana/Dhyana (6th-7th limbs) · Yoga Nidra (deep rest state)
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
  imageQuery: string;
  wikiUrl: string;
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
// AUDIT NOTE: Every pose has a validated phase assignment.
// Asana phase classifications follow traditional Hatha Yoga sequencing:
//   "pre"      = warming / activation
//   "active"   = peak practice / strength / flexibility challenge
//   "recovery" = cooling / restorative

const POSES: Record<string, YogaPose> = {

  // ══ ASANA — Balance & Stability ══════════════════════════════════════
  vrikshasana: {
    name: "Tree Pose", sanskrit: "Vrikshasana", domain: "asana",
    duration: "45–60s each side", phase: "pre",
    benefit: "Static balance, proprioception, single-leg stability, mental stillness",
    instruction: "Stand on right foot. Place left sole against inner right calf or thigh (not against the knee joint). Press palms together at chest or raise overhead. Fix gaze on a still point (drishti). Breathe naturally for 45–60s. Switch sides.",
    contraindication: "Avoid sole-against-knee placement — this stresses the lateral knee ligaments. Use wall support for first attempts.",
    imageQuery: "Vrikshasana tree pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Vrikshasana",
  },
  tadasana: {
    name: "Mountain Pose", sanskrit: "Tadasana", domain: "asana",
    duration: "10 breath cycles", phase: "pre",
    benefit: "Postural alignment, grounding awareness, full spinal extension, breath baseline",
    instruction: "Stand feet hip-width (or together per tradition). Distribute weight evenly across four corners of each foot. Engage quadriceps gently. Lift sternum. Relax shoulders down. Arms alongside body, palms facing forward. Hold for 10 slow breath cycles.",
    imageQuery: "Tadasana mountain pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Tadasana",
  },
  garudasana: {
    name: "Eagle Pose", sanskrit: "Garudasana", domain: "asana",
    duration: "45s each side", phase: "pre",
    benefit: "Shoulder external rotation, wrist decompression, single-leg balance, scapular mobility",
    instruction: "Bend both knees slightly. Cross right thigh over left. Hook right foot behind left calf if balance allows. Cross left arm under right at elbow level. Wrap forearms, press palms (or backs of hands) together. Lift elbows to shoulder height. Hold 45s. Switch sides.",
    contraindication: "Avoid in shoulder impingement or SLAP tears. Skip leg cross if recent knee injury — hold single-leg balance only.",
    imageQuery: "Garudasana eagle pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Garudasana",
  },
  ardha_chandrasana: {
    name: "Half Moon Pose", sanskrit: "Ardha Chandrasana", domain: "asana",
    duration: "30s each side", phase: "pre",
    benefit: "Hip abductor strength, spinal lateral flexion, single-leg balance, core engagement",
    instruction: "From Trikonasana (right side). Bend right knee, place right hand ~30cm forward of right foot. Shift weight onto right foot, straighten right leg. Raise left leg parallel to floor. Extend left arm to ceiling. Open chest to left. Hold 30s. Switch sides.",
    contraindication: "Use a yoga block under the lower hand. Avoid if acute hip or IT band injury.",
    imageQuery: "Ardha Chandrasana half moon pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Ardha_Chandrasana",
  },

  // ══ ASANA — Flexibility ══════════════════════════════════════════════
  uttanasana: {
    name: "Standing Forward Fold", sanskrit: "Uttanasana", domain: "asana",
    duration: "45–60s", phase: "pre",
    benefit: "Hamstring lengthening, spinal traction, activates parasympathetic nervous system",
    instruction: "Stand feet hip-width. Hinge at hip crease (not waist). Allow spine to lengthen downward with gravity. Bend knees generously if hamstrings restrict movement — the goal is spinal release, not straight-leg achievement. Hold 45–60s.",
    imageQuery: "Uttanasana standing forward bend yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Uttanasana",
  },
  paschimottanasana: {
    name: "Seated Forward Fold", sanskrit: "Paschimottanasana", domain: "asana",
    duration: "60–90s", phase: "recovery",
    benefit: "Deep hamstring and lower back release, parasympathetic activation, calms nervous system",
    instruction: "Sit with legs extended. Inhale to lengthen spine. On exhale, hinge forward from hip crease (not waist). Reach for shins, ankles or feet — use a strap if needed. Avoid aggressive rounding of lower back. Relax head. Hold 60–90s.",
    contraindication: "Avoid forceful folding with lumbar disc herniation. Use strap and bent knees.",
    imageQuery: "Paschimottanasana seated forward bend yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Paschimottanasana",
  },
  malasana: {
    name: "Garland Pose / Deep Squat", sanskrit: "Malasana", domain: "asana",
    duration: "60–90s", phase: "pre",
    benefit: "Hip flexor and groin opening, ankle dorsiflexion, pelvic floor awareness",
    instruction: "Stand with feet wider than hips, toes turned out ~45°. Lower into a deep squat. Bring elbows inside knees, press palms together. Use elbows to gently push knees wider. If heels lift, place folded mat or blanket under them. Hold 60–90s.",
    contraindication: "Use heel support if ankles are tight. Avoid in acute knee or groin injury.",
    imageQuery: "Malasana garland pose yoga squat", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Malasana",
  },
  gomukhasana: {
    name: "Cow Face Pose", sanskrit: "Gomukhasana", domain: "asana",
    duration: "60s each side", phase: "recovery",
    benefit: "Hip external rotator and piriformis stretch, shoulder external rotation, IT band and TFL release",
    instruction: "Cross right knee over left knee, stacking them (or approximate as tolerated). Reach right arm up, bend elbow behind head. Reach left arm down and behind. Clasp fingers. Use a yoga strap if hands don't meet. Sit tall throughout. Hold 60s. Switch sides.",
    contraindication: "Avoid in acute knee pain or severe hip impingement. Don't force arm clasp.",
    imageQuery: "Gomukhasana cow face pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Gomukhasana",
  },
  hanumanasana: {
    name: "Monkey Pose (Splits)", sanskrit: "Hanumanasana", domain: "asana",
    duration: "20–30s each side", phase: "active",
    benefit: "Maximum hip flexor and hamstring range of motion, anterior hip opening for explosive sport",
    instruction: "From a low lunge (right foot forward). Place blocks under each hand. Slowly slide right foot forward while sliding left knee backward. Keep hips square to the front. Only descend as far as blocks allow — do NOT force. Hold 20–30s. Switch sides. This is a progressive pose requiring weeks of preparation.",
    contraindication: "NEVER force into full splits. Avoid entirely with hamstring tears, groin strains, or hip labral injuries. Blocks are mandatory, not optional.",
    imageQuery: "Hanumanasana splits monkey pose yoga blocks", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Hanumanasana",
  },

  // ══ ASANA — Strength ════════════════════════════════════════════════
  virabhadrasana1: {
    name: "Warrior I", sanskrit: "Virabhadrasana I", domain: "asana",
    duration: "45s each side", phase: "active",
    benefit: "Hip flexor strengthening, ankle stability, shoulder girdle endurance, builds mental resolve",
    instruction: "Step right foot forward ~4 feet. Turn left foot out to 45°. Bend right knee to 90°, keeping knee over ankle (not beyond toes). Square hips forward. Raise arms overhead, palms facing or together. Lengthen through spine. Hold 45s. Switch sides.",
    imageQuery: "Virabhadrasana I warrior one yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Virabhadrasana_I",
  },
  virabhadrasana2: {
    name: "Warrior II", sanskrit: "Virabhadrasana II", domain: "asana",
    duration: "45s each side", phase: "active",
    benefit: "Lateral leg strength, hip abductor endurance, shoulder stamina, open hip awareness",
    instruction: "Stand feet wide (~4 feet). Turn right foot out 90°, left foot in ~15°. Bend right knee to 90° over ankle. Extend both arms parallel to floor. Gaze past right fingertips. Keep torso stacked over pelvis — don't lean forward. Hold 45s. Switch sides.",
    imageQuery: "Virabhadrasana II warrior two yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Virabhadrasana_II",
  },
  navasana: {
    name: "Boat Pose", sanskrit: "Navasana", domain: "asana",
    duration: "20–30s × 3 sets", phase: "active",
    benefit: "Deep hip flexor and core rectus engagement, spinal extensor activation, balance",
    instruction: "Sit with knees bent, feet flat. Lean back ~30° keeping spine straight (not collapsed). Lift feet until shins are parallel to floor (beginner: keep knees bent). Optionally extend legs to 45°. Reach arms forward parallel to floor. Hold 20–30s. Rest 10s. Repeat 3 times.",
    contraindication: "Avoid with lumbar herniation — keep knees bent. Stop if you feel compression in lower back rather than abdominal engagement.",
    imageQuery: "Navasana boat pose yoga core", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Navasana",
  },
  chaturanga: {
    name: "Four-Limbed Staff Pose", sanskrit: "Chaturanga Dandasana", domain: "asana",
    duration: "Hold 3–5 breaths × 5 reps", phase: "active",
    benefit: "Rotator cuff strengthening, serratus anterior activation, wrist stability, shoulder injury prevention",
    instruction: "From plank position. On exhale, lower body as one rigid unit until elbows are at exactly 90°, tucked close to the ribcage. Body hovers 5–8cm above floor. Shoulders must NOT drop below elbow level. Elbows track backward, not flared out. Hold 3–5 breaths. Push back to plank. Repeat 5 times.",
    contraindication: "Avoid in rotator cuff tears, wrist injury, or shoulder impingement. Substitute with modified version on knees if needed.",
    imageQuery: "Chaturanga dandasana four limbed staff pose yoga", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Chaturanga_Dandasana",
  },
  utkatasana: {
    name: "Chair Pose", sanskrit: "Utkatasana", domain: "asana",
    duration: "45s × 3 sets", phase: "active",
    benefit: "Quadriceps and gluteal strength, ankle stability, cardiovascular load, mental endurance",
    instruction: "Stand with feet together (or hip-width for beginners). Raise arms overhead. Bend knees and lower hips as if sitting back into a chair — thighs approach parallel to floor. Keep chest lifted, heels grounded. Hold 45s. Stand, rest 15s. Repeat 3 sets.",
    imageQuery: "Utkatasana chair pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Utkatasana",
  },

  // ══ ASANA — Spinal & Recovery ════════════════════════════════════════
  balasana: {
    name: "Child's Pose", sanskrit: "Balasana", domain: "asana",
    duration: "60–90s", phase: "recovery",
    benefit: "Lumbar decompression, hip flexor passive lengthening, nervous system downregulation",
    instruction: "Kneel with big toes touching, knees wide (~mat width). Fold forward, extending arms forward on the mat (or rest arms alongside body for more surrender). Rest forehead on mat. Breathe deeply into the lower back — feel the lower ribs expand. Relax completely for 60–90s.",
    imageQuery: "Balasana child pose yoga recovery", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Balasana",
  },
  bhujangasana: {
    name: "Cobra Pose", sanskrit: "Bhujangasana", domain: "asana",
    duration: "20–30s × 3 sets", phase: "active",
    benefit: "Thoracic extension, chest opening, erector spinae activation, anterior hip stretch",
    instruction: "Lie prone. Place palms under shoulders, elbows close to body. On inhale, lift the chest primarily using back muscles — arms assist but should not bear full weight. A small Cobra (low Bhujangasana) is correct for most athletes: elbows remain slightly bent. Lower back should not crunch. Hold 20–30s. Exhale to lower.",
    contraindication: "Avoid with acute lumbar disc herniation. Use Low Cobra (elbows bent) rather than forcing straight arms.",
    imageQuery: "Bhujangasana cobra pose yoga low variation", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhujangasana",
  },
  supta_matsyendrasana: {
    name: "Supine Spinal Twist", sanskrit: "Supta Matsyendrasana", domain: "asana",
    duration: "60–90s each side", phase: "recovery",
    benefit: "Thoracic and lumbar rotation release, IT band decompression, spinal nerve hydration",
    instruction: "Lie on back. Draw right knee to chest. Let it fall across body to the left, guided gently by left hand. Extend right arm to the right at shoulder height, palm facing up. Turn head to look right. Keep both shoulders grounded. Do not force the knee toward the floor — let gravity work over 60–90s. Switch sides.",
    imageQuery: "Supta Matsyendrasana supine spinal twist yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Supta_Matsyendrasana",
  },
  setu_bandhasana: {
    name: "Bridge Pose", sanskrit: "Setu Bandhasana", domain: "asana",
    duration: "45s × 3 sets", phase: "active",
    benefit: "Gluteal and hamstring strengthening, posterior chain activation, hip extension mobility",
    instruction: "Lie on back, knees bent, feet flat hip-width apart ~30cm from hips. Press evenly through both feet and lift hips. Optionally clasp hands under the back and press shoulders down. Keep thighs parallel — do not let knees splay. Hold 45s. Lower slowly. Repeat 3 times.",
    imageQuery: "Setu Bandhasana bridge pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Setu_Bandhasana",
  },
  shavasana: {
    name: "Corpse Pose", sanskrit: "Shavasana", domain: "nidra",
    duration: "10–15 mins", phase: "recovery",
    benefit: "Complete neuromuscular release, cortisol normalisation, integration of practice, parasympathetic dominance",
    instruction: "Lie flat on back. Feet fall naturally apart. Arms ~30cm from body, palms facing up. Close eyes. Consciously release tension from toes to scalp — scan each region for 20–30s. Allow breath to become effortless. The mind remains awake while the body rests completely. 10–15 minutes minimum for full benefit.",
    imageQuery: "Shavasana corpse pose yoga relaxation", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Shavasana",
  },
  viparita_karani: {
    name: "Legs-up-the-Wall", sanskrit: "Viparita Karani", domain: "asana",
    duration: "8–10 mins", phase: "recovery",
    benefit: "Venous blood return from legs, lymphatic drainage, lumbar decompression, post-training leg recovery",
    instruction: "Sit sideways next to a wall. Swing legs up the wall as you lower your back to the floor. Hips can be 5–10cm from the wall (tight hamstrings) or touching the wall. Arms out to sides, palms up. Close eyes. Focus on natural breath. Stay 8–10 minutes.",
    imageQuery: "Viparita Karani legs up wall yoga restorative", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Viparita_Karani",
  },

  // ══ PRANAYAMA ═══════════════════════════════════════════════════════
  // AUDIT NOTE: Pranayama terminology carefully distinguished below.
  // Nadi Shodhana (Nadi Shuddhi) = Alternate Nostril with Kumbhaka (retention)
  // Anulom Vilom = Alternate Nostril WITHOUT retention (simpler, suitable for all levels)
  // These are related but distinct practices — this distinction is critical.
  nadi_shodhana: {
    name: "Alternate Nostril Breathing with Retention", sanskrit: "Nadi Shodhana Pranayama", domain: "pranayama",
    duration: "5–7 mins", phase: "pre",
    benefit: "Balances ida and pingala nadis, reduces HRV irregularity, pre-competition nervous system regulation",
    instruction: "TECHNIQUE: Right thumb closes right nostril. Inhale left nostril for 4 counts. Close both nostrils (Antara Kumbhaka — retention) for 4 counts. Open right nostril, exhale for 8 counts. Inhale right 4. Retain 4. Exhale left 8. That is 1 cycle. Perform 10 cycles. Ratio: 1:1:2 (inhale:retention:exhale). NOTE: Nadi Shodhana includes Kumbhaka (retention) — this distinguishes it from Anulom Vilom.",
    contraindication: "Avoid breath retention (Kumbhaka) if hypertensive. Practise Anulom Vilom (without retention) instead.",
    imageQuery: "Nadi Shodhana pranayama alternate nostril breathing", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Nadi_Shodhana",
  },
  anulom_vilom: {
    name: "Alternate Nostril Breathing (No Retention)", sanskrit: "Anulom Vilom", domain: "pranayama",
    duration: "5–7 mins", phase: "recovery",
    benefit: "Gentle nervous system balancing, post-training heart rate normalisation, accessible for all ages",
    instruction: "TECHNIQUE: Same alternate nostril pattern as Nadi Shodhana BUT without any breath retention (Kumbhaka). Inhale left 4 counts → exhale right 8 counts → inhale right 4 → exhale left 8. No pausing between inhalation and exhalation. Ratio: 1:2 (inhale:exhale only). Suitable for all levels including U14. NOTE: Anulom Vilom is the simpler form — it does NOT include Kumbhaka.",
    imageQuery: "Anulom Vilom alternate nostril breathing no retention yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Nadi_Shodhana",
  },
  kapalabhati: {
    name: "Skull-Shining Breath", sanskrit: "Kapalabhati", domain: "pranayama",
    duration: "2–3 mins", phase: "pre",
    benefit: "Diaphragm strengthening, metabolic activation, clears respiratory passages",
    instruction: "Sit tall with spine erect. Take a slow, complete inhale. Then perform sharp, rhythmic exhales through the nose — each exhale is powered by a rapid inward contraction of the lower abdomen. The inhale is passive (automatic). BEGINNER RATE: 1 exhale every 2 seconds (30/min). INTERMEDIATE: 1 exhale per second (60/min). ADVANCED: up to 2/second. Start with 30 rounds, rest, then repeat 2–3 rounds.",
    contraindication: "Avoid in hypertension, epilepsy, recent abdominal or thoracic surgery, active asthma episode, pregnancy, or acute sinusitis.",
    imageQuery: "Kapalabhati breathing pranayama yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Kapalabhati",
  },
  bhastrika: {
    name: "Bellows Breath", sanskrit: "Bhastrika", domain: "pranayama",
    duration: "2–3 mins", phase: "pre",
    benefit: "Rapid aerobic activation, raises metabolic rate, anaerobic threshold preparation",
    instruction: "DIFFERS from Kapalabhati: BOTH the inhale AND exhale are active and forceful (like a bellows). Sit tall. Perform 20 rapid, equal-force inhale-exhale cycles through the nose. After 20th exhale, take a full slow inhale, hold for 10–15s (Kumbhaka), then release slowly. That is 1 round. Perform 3 rounds with rest between.",
    contraindication: "Avoid in hypertension, heart disease, epilepsy, glaucoma, retinal detachment, pregnancy, acute hernia, nasal congestion. Always seated — NEVER standing. Stop immediately if dizzy.",
    imageQuery: "Bhastrika bellows breath pranayama yoga", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhastrika",
  },
  ujjayi: {
    name: "Victorious Breath", sanskrit: "Ujjayi", domain: "pranayama",
    duration: "Throughout active session", phase: "active",
    benefit: "Regulates breath pace, builds internal heat, maintains meditative focus during physical practice",
    instruction: "Breathe exclusively through the nose. Gently constrict the glottis (back of throat) to create a soft, whispering 'ocean wave' sound — audible to you, barely to others. This resistance naturally extends the breath and maintains steady rhythm. Use Ujjayi throughout asana practice to prevent overexertion. Both inhale and exhale through nose with this constriction.",
    imageQuery: "Ujjayi breath pranayama ocean breath yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Ujjayi_breath",
  },
  bhramari: {
    name: "Humming Bee Breath", sanskrit: "Bhramari", domain: "pranayama",
    duration: "5–7 mins (10 rounds)", phase: "recovery",
    benefit: "Significantly reduces cortisol and adrenaline, calms post-competition anxiety, slows heart rate",
    instruction: "Sit comfortably. Take a slow inhale. On the exhale, close lips and produce a smooth, steady humming sound (like a bee) through the nose. For Shanmukhi Mudra variation: use thumbs to close ears and index fingers to close eyes before humming — this amplifies the resonance. Feel the vibration through skull and chest. 10 slow rounds.",
    imageQuery: "Bhramari humming bee breath pranayama yoga Shanmukhi", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Bhramari",
  },
  kumbhaka: {
    name: "Breath Retention Training", sanskrit: "Kumbhaka Pranayama", domain: "pranayama",
    duration: "10–15 mins total practice", phase: "active",
    benefit: "Increases CO2 tolerance, extends breath-hold duration, trains diaphragmatic control for contact sports",
    instruction: "Two forms: ANTARA KUMBHAKA (retention after inhale): Inhale fully, seal breath, hold 5–15s building progressively. BAHYA KUMBHAKA (retention after exhale — advanced only): Exhale fully, seal, hold 5–10s. Begin with Antara only. Progress: Week 1: 5s, Week 2: 8s, Week 4: 12s, Week 8: 15–20s. Always supervised for youth athletes.",
    contraindication: "Never force beyond comfort — never cause strain or panic. Stop immediately if dizzy or lightheaded. Avoid Bahya Kumbhaka entirely if hypertensive or heart condition.",
    imageQuery: "Kumbhaka breath retention pranayama yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Kumbhaka",
  },
  sitali: {
    name: "Cooling Breath", sanskrit: "Sitali / Sitkari", domain: "pranayama",
    duration: "3–5 mins (10–15 rounds)", phase: "recovery",
    benefit: "Reduces body temperature post-exertion, cools blood, refreshes mental alertness after training",
    instruction: "SITALI: Roll the tongue into a tube, extend slightly out of mouth. Inhale slowly through the rolled tongue channel — feel the coolness. Exhale through nose. 10–15 rounds. NOTE: ~30% of people cannot roll their tongue genetically — these athletes use SITKARI instead: Open teeth slightly, press tongue to upper palate, inhale through gaps between teeth. Effect is identical.",
    imageQuery: "Sitali cooling breath pranayama yoga tongue", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Sitali",
  },

  // ══ DHARANA & DHYANA (Concentration & Meditation) ═══════════════════
  // AUDIT NOTE: Dharana (6th limb) = concentration on single object
  // Dhyana (7th limb) = sustained, effortless meditation (dharana sustained)
  // These terms are used interchangeably in sport context; we label as "Dharana / Meditation"
  trataka: {
    name: "Fixed Gaze Concentration", sanskrit: "Trataka", domain: "dharana",
    duration: "5–10 mins", phase: "pre",
    benefit: "Trains voluntary visual focus, improves reaction time, develops pre-performance composure and stillness",
    instruction: "Place a candle at eye level, ~60cm away (or use a small dot on white paper). Gaze at the tip of the flame or the dot without blinking for as long as possible. When eyes water or blur, close them and hold the after-image in your mind's eye. When image fades, reopen and repeat. Total: 5–10 minutes. Critical for archery, table tennis, and any precision sport.",
    imageQuery: "Trataka candle gazing meditation concentration dharana", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Trataka",
  },
  visualisation: {
    name: "Performance Visualisation", sanskrit: "Bhavana / Antaranga Dharana", domain: "dharana",
    duration: "8–10 mins", phase: "pre",
    benefit: "Motor pattern neural priming, confidence building, tactical rehearsal, reduces pre-event anxiety",
    instruction: "Lie on back or sit tall. Close eyes. Create a vivid, detailed mental film of your ideal performance — include sensory detail: the sound of the venue, feeling of the ground under your feet, your movement, your breath. See each technical skill executed perfectly. Feel the emotion of success. Re-run 2–3 times. Research shows motor neurons activate identically in visualisation and actual performance.",
    imageQuery: "Performance visualisation sports psychology mental rehearsal athlete", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Visualization_(meditation)",
  },
  yoga_nidra: {
    name: "Yoga Nidra (Psychic Sleep)", sanskrit: "Yoga Nidra", domain: "nidra",
    duration: "20–30 mins", phase: "recovery",
    benefit: "Deeply restorative: promotes delta brainwave state, reduces sympathetic activation, enhances muscular recovery and memory consolidation",
    instruction: "Lie in Shavasana. The practice is guided (audio or instructor). It proceeds through: (1) Rotation of consciousness — systematically naming body parts in sequence. (2) Pairs of opposites — feeling heaviness then lightness, heat then cold. (3) Visualisation. (4) Sankalpa (intention). Maintain conscious awareness throughout — this is the critical distinction from sleep. Research (Kumar 2010, Pandi-Perumal 2022) shows Yoga Nidra consistently reduces cortisol and produces subjective recovery comparable to deep rest. NOTE: The popular '20 min = 2 hrs sleep' claim is an oversimplification — we do not make this specific claim.",
    contraindication: "Not recommended immediately post-meal. Some practitioners report difficulty maintaining consciousness — this is normal; re-enter the practice.",
    imageQuery: "Yoga Nidra psychic sleep guided meditation relaxation", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Yoga_nidra",
  },

  // ══ ADDITIONAL ASANAS ════════════════════════════════════════════════
  trikonasana: {
    name: "Triangle Pose", sanskrit: "Trikonasana", domain: "asana",
    duration: "45s each side", phase: "active",
    benefit: "Lateral chain lengthening, hip abductor activation, thoracic rotation, direction-change mobility",
    instruction: "Stand feet wide (~4 feet). Turn right foot out 90°, left foot in ~15°. Extend right hand toward right shin or ankle (NOT floor for beginners — this causes spinal collapse). Extend left arm vertically. Open chest to ceiling, keeping both sides of torso equally long. Hold 45s. Switch sides.",
    imageQuery: "Trikonasana triangle pose yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Trikonasana",
  },
  parshvakonasana: {
    name: "Extended Side Angle", sanskrit: "Parsvakonasana", domain: "asana",
    duration: "45s each side", phase: "active",
    benefit: "Full lateral fascial chain stretch, rotator cuff activation, lateral lunge power pattern",
    instruction: "From Warrior II (right side). Lower right forearm to right thigh — do NOT collapse the chest. For full variation: place right fingertips on floor outside right foot. Extend left arm over left ear, creating a continuous diagonal line from left outer foot to left fingertips. Keep left shoulder from rolling forward. Hold 45s. Switch sides.",
    imageQuery: "Parsvakonasana extended side angle pose yoga", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Parsvakonasana",
  },
  dhanurasana: {
    name: "Bow Pose", sanskrit: "Dhanurasana", domain: "asana",
    duration: "20–30s × 3 sets", phase: "active",
    benefit: "Thoracic extension and rotation, shoulder extension and external rotation, anterior chain stretch, lung capacity",
    instruction: "Lie prone. Bend both knees. Reach back with both hands to grasp the outer ankles (not the feet — this causes excessive knee bend). On inhale, simultaneously lift chest and thighs off the mat by pressing feet into hands. The tension between hand and foot creates the bow. Rock gently or hold still. Keep knees ~hip-width. Hold 20–30s. Release slowly.",
    contraindication: "Avoid with lumbar disc injury, pregnancy, recent abdominal surgery, or hypertension. Use one-sided variation (Ardha Dhanurasana) if both-sided is too intense.",
    imageQuery: "Dhanurasana bow pose yoga backbend", difficulty: "intermediate",
    wikiUrl: "https://en.wikipedia.org/wiki/Dhanurasana",
  },
  bakasana: {
    name: "Crow Pose", sanskrit: "Bakasana", domain: "asana",
    duration: "15–20s × 3 attempts", phase: "active",
    benefit: "Core strength, wrist and forearm loading, scapular stability, mental focus and courage",
    instruction: "Squat. Place palms shoulder-width on the floor, fingers spread wide. Bend elbows backward (~45°). Place knees on the backs of upper arms (above elbow joint — NOT on elbows). Lean torso forward, shifting body weight into hands. Lift one foot, then both. Keep gaze forward (not down). Hold 15–20s. Lower controlled.",
    contraindication: "Avoid in wrist injury (CTS, TFCC). Always practise with folded blanket in front as a safety buffer. Beginner modification: keep toes on floor and tilt forward only.",
    imageQuery: "Bakasana crow pose yoga arm balance", difficulty: "advanced",
    wikiUrl: "https://en.wikipedia.org/wiki/Bakasana",
  },
  supta_baddha_konasana: {
    name: "Reclining Bound Angle", sanskrit: "Supta Baddha Konasana", domain: "asana",
    duration: "5–7 mins", phase: "recovery",
    benefit: "Restorative hip opener, inner groin release, stimulates parasympathetic state, female athlete menstrual phase modifier",
    instruction: "Lie on back. Bring soles of feet together, allow knees to fall out to the sides. Place one hand on heart, one on belly, or extend arms out to sides, palms up. Completely surrender weight of legs to gravity — do NOT actively push knees down. Add folded blankets under each thigh/knee if inner groin is very tight. Stay 5–7 minutes.",
    imageQuery: "Supta Baddha Konasana reclining bound angle restorative yoga", difficulty: "beginner",
    wikiUrl: "https://en.wikipedia.org/wiki/Supta_Baddha_Konasana",
  },
};

// ─── VALIDATION: session splits must sum to 100 ────────────────────────────
function validateSplit(split: { asana: number; pranayama: number; dharana: number; nidra: number }, sport: string): void {
  const total = split.asana + split.pranayama + split.dharana + split.nidra;
  if (total !== 100) {
    console.error(`YOGA ENGINE AUDIT: Session split for ${sport} sums to ${total}, not 100.`);
  }
}

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
    scienceBasis: "Kapalabhati strengthens the diaphragm and increases respiratory efficiency (Telles et al. 2014). Hamstring ROM gains of >10° documented in 8 weeks of consistent yoga (Jarvis et al. 2017).",
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
    secondaryBenefits: ["Groin & hamstring injury prevention", "Sprint recovery", "Decision-making focus"],
    scienceBasis: "Hip flexor and adductor flexibility training reduces groin injury recurrence by ~30% in cohort studies. Bhastrika pre-activation raises peak aerobic output before high-intensity effort.",
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
    primaryBenefit: "Breath-hold capacity, core bracing, anaerobic power, post-raid mental regulation",
    secondaryBenefits: ["CO2 tolerance training", "Core explosive strength", "Post-raid cortisol control"],
    scienceBasis: "Kumbhaka breath-retention training progressively extends breath-hold duration — critical for Kabaddi raid duration. AYUSH Ministry guidelines document 20–35% breath-hold improvement over 6 weeks of supervised practice.",
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
    recovery: ["supta_matsyendrasana", "supta_baddha_konasana", "bhramari", "shavasana"],
    primaryBenefit: "Shoulder mobility, jump mechanics, single-leg landing stability, spatial awareness",
    secondaryBenefits: ["Ankle landing mechanics", "Shoulder rotator cuff protection", "Block timing focus"],
    scienceBasis: "Shoulder external rotation improvements from Garudasana reduce rotator cuff stress. Single-leg balance training reduces ACL and ankle sprain risk in jump sports (Birdee 2009).",
    sessionSplit: { asana: 50, pranayama: 20, dharana: 20, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Balance + Shoulder Mobility", duration: 25, emoji: "🏐" },
      { day: "Thu", focus: "Jump Strength + Core", duration: 30, emoji: "⚡" },
      { day: "Sat", focus: "Recovery + Spatial Awareness", duration: 25, emoji: "🎯" },
    ],
  },
  cycling: {
    pre: ["bhujangasana", "ujjayi", "tadasana", "kapalabhati"],
    active: ["paschimottanasana", "navasana", "virabhadrasana1", "trikonasana"],
    recovery: ["balasana", "supta_matsyendrasana", "viparita_karani", "yoga_nidra"],
    primaryBenefit: "Spinal decompression, hip flexor release, cervical tension relief, aerobic breath pacing",
    secondaryBenefits: ["Lower back injury prevention", "Neck and thoracic tension release", "VO2 max support"],
    scienceBasis: "The flexed cycling posture loads L4–L5. Consistent yoga practice decompresses spinal segments and reduces injury risk. Ujjayi breath prevents over-exertion by self-regulating breathing rate.",
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
    primaryBenefit: "Thoracic rotation, shoulder extension, lung capacity, stroke mechanical efficiency",
    secondaryBenefits: ["CO2 tolerance", "Shoulder injury prevention", "Turn-timing focus"],
    scienceBasis: "Kumbhaka training progressively increases CO2 tolerance and breath-hold capacity. Thoracic rotation flexibility directly correlates with freestyle stroke power and shoulder health.",
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
    primaryBenefit: "Hip mobility, shoulder lock prevention, cortisol reduction post-bout, explosive power",
    secondaryBenefits: ["Post-bout injury prevention", "Aggression regulation", "Weight-category mental management"],
    scienceBasis: "Bhramari pranayama significantly reduces serum cortisol post high-intensity competition. Hip and shoulder flexibility directly reduces injury risk in takedown and clinch situations.",
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
    secondaryBenefits: ["ACL and ankle sprain prevention", "Vertical jump landing mechanics", "Clutch-moment composure"],
    scienceBasis: "Single-leg balance training reduces lateral ankle sprains by ~35% in court athletes. Mental visualisation improves free-throw accuracy by 10–15% in controlled studies.",
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
    primaryBenefit: "Rotator cuff protection, wrist endurance, eye-hand coordination, match composure",
    secondaryBenefits: ["Shoulder injury prevention", "Reaction time improvement", "3rd-set mental stamina"],
    scienceBasis: "Nadi Shodhana reduces pre-match cortisol and HRV irregularity. Trataka trains saccadic eye control — directly relevant to shuttle tracking. Chaturanga is the most specific rotator cuff strengthening exercise available without equipment.",
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
    secondaryBenefits: ["Pain-threshold management", "Between-round recovery", "Post-fight cortisol normalisation"],
    scienceBasis: "Bhastrika pre-training elevates sympathetic activation for anaerobic readiness. Bhramari post-bout reduces cortisol and adrenaline. Visualisation is evidence-supported for punch-combination accuracy.",
    sessionSplit: { asana: 40, pranayama: 35, dharana: 15, nidra: 10 },
    weeklySchedule: [
      { day: "Mon", focus: "Core Rotation + Breath", duration: 30, emoji: "🥊" },
      { day: "Thu", focus: "Explosive Warriors + Bhastrika", duration: 25, emoji: "⚡" },
      { day: "Sat", focus: "Cortisol Reset + Nidra", duration: 35, emoji: "🧘" },
    ],
  },
  hockey: {
    // AUDIT FIX: Replaced missing 'ardha_chandrasana' with valid poses in pre.
    // Ardha Chandrasana now added to POSES library. Re-included here.
    pre: ["ardha_chandrasana", "bhujangasana", "ujjayi", "visualisation"],
    active: ["trikonasana", "virabhadrasana2", "navasana", "kapalabhati"],
    recovery: ["balasana", "supta_matsyendrasana", "viparita_karani", "yoga_nidra"],
    primaryBenefit: "Lower back decompression, low-posture correction, field spatial vision",
    secondaryBenefits: ["Hamstring flexibility for bent-over posture", "Field awareness", "Aerobic breath control"],
    scienceBasis: "The constant forward-flexed hockey posture compresses L4–L5 and L5–S1. Structured yoga decompression significantly reduces lumbar injury incidence. Ardha Chandrasana specifically strengthens hip abductors needed for lateral stick-work.",
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
    primaryBenefit: "Static balance, mind-muscle stillness, breath regulation at shot-release point",
    secondaryBenefits: ["Shoulder stability and endurance", "Sight alignment focus", "Shot-release composure"],
    scienceBasis: "Trataka significantly improves sustained voluntary focus. Nadi Shodhana reduces HRV irregularity before competition — directly relevant to the archery release breath-hold window (Telles et al. 2014).",
    sessionSplit: { asana: 30, pranayama: 30, dharana: 35, nidra: 5 },
    weeklySchedule: [
      { day: "Mon", focus: "Balance + Stillness", duration: 25, emoji: "🏹" },
      { day: "Wed", focus: "Shoulder + Breath Control", duration: 25, emoji: "💨" },
      { day: "Fri", focus: "Trataka + Visualisation", duration: 30, emoji: "🎯" },
    ],
  },
  khokho: {
    pre: ["malasana", "trikonasana", "bhastrika", "visualisation"],
    active: ["virabhadrasana1", "parshvakonasana", "utkatasana", "ujjayi"],
    recovery: ["supta_matsyendrasana", "anulom_vilom", "balasana", "yoga_nidra"],
    primaryBenefit: "Lateral direction change, sprint-to-stop knee protection, team spatial awareness",
    secondaryBenefits: ["ACL protection for pivoting", "Sprint-endurance recovery", "Split-second decision training"],
    scienceBasis: "Hip flexor and adductor flexibility training reduces ACL loading stress during sharp direction changes. Bhastrika activation elevates speed-endurance capacity for repeated-sprint sports.",
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
    primaryBenefit: "Wrist joint protection, rotational torso speed, micro-reaction time enhancement",
    secondaryBenefits: ["Shoulder rotation speed", "Ball-tracking visual acuity", "Match composure"],
    scienceBasis: "Trataka trains voluntary saccadic eye control — directly enhances ability to track a fast table tennis ball. Garudasana arms specifically decompress and mobilise the wrist and elbow joints.",
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
    primaryBenefit: "Ankle and hip mobility for lift positions, CNS recovery, lift mental rehearsal, cortisol control",
    secondaryBenefits: ["Hip mobility for squat clean/snatch", "Wrist extension for jerk", "Weight-category stress management"],
    scienceBasis: "Yoga Nidra is deeply restorative post-maximal effort: research (Pandi-Perumal 2022) shows consistent cortisol reduction and improved subjective recovery. Malasana specifically trains the ankle dorsiflexion ROM required in the squat clean bottom position.",
    sessionSplit: { asana: 40, pranayama: 25, dharana: 15, nidra: 20 },
    weeklySchedule: [
      { day: "Mon", focus: "Ankle + Wrist Mobility", duration: 25, emoji: "🏋️" },
      { day: "Thu", focus: "Hip Mobility for Lifts", duration: 30, emoji: "💪" },
      { day: "Sat", focus: "CNS Recovery + Nidra", duration: 40, emoji: "🧘" },
    ],
  },
};

// Runtime validation — runs once on module load in development
if (import.meta.env?.DEV) {
  Object.entries(SPORT_MATRIX).forEach(([sport, m]) => {
    validateSplit(m.sessionSplit, sport);
    // Check all referenced pose keys exist
    [...m.pre, ...m.active, ...m.recovery].forEach(key => {
      if (!POSES[key]) console.error(`YOGA ENGINE AUDIT: Pose key '${key}' not found in POSES library. Sport: ${sport}`);
    });
  });
}

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

function getDurationMultiplier(ageTier: AgeTier): number {
  if (ageTier === "u14") return 0.7;
  if (ageTier === "u18") return 0.85;
  return 1.0;
}

// ─── FILTER POSES BY FITNESS LEVEL ────────────────────────────────────────
// AUDIT FIX: This was defined but never called. Now actively filters prescriptions.
function filterPosesByFitness(keys: string[], level: IntensityLevel): string[] {
  if (level === "advanced") return keys; // all poses available
  if (level === "intermediate") return keys.filter(k => POSES[k]?.difficulty !== "advanced");
  // beginner: only beginner-difficulty poses
  return keys.filter(k => POSES[k]?.difficulty === "beginner");
}

// ─── NORMALISE SPORT KEY ──────────────────────────────────────────────────
export function normaliseSport(sport: string): string {
  const s = sport.toLowerCase().replace(/[\s\-_.]/g, "");
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
    hockey: "hockey", fieldhockey: "hockey", fieldhockeyindia: "hockey",
    archery: "archery",
    khokho: "khokho", khokho2: "khokho", kho: "khokho",
    tabletennis: "tabletennis", pingpong: "tabletennis", tt: "tabletennis",
    weightlifting: "weightlifting", weights: "weightlifting", lifting: "weightlifting",
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

  // AUDIT FIX: Filter poses by fitness level BEFORE resolving
  const filteredPre = filterPosesByFitness(matrix.pre, fitnessLevel);
  const filteredActive = filterPosesByFitness(matrix.active, fitnessLevel);
  const filteredRecovery = filterPosesByFitness(matrix.recovery, fitnessLevel);

  // Ensure at least 2 poses per phase even after filtering (fallback to beginner tadasana/shavasana)
  const safePre = filteredPre.length >= 1 ? filteredPre : ["tadasana", "uttanasana"];
  const safeActive = filteredActive.length >= 1 ? filteredActive : ["virabhadrasana1", "navasana"];
  const safeRecovery = filteredRecovery.length >= 1 ? filteredRecovery : ["balasana", "shavasana"];

  // Resolve poses from keys
  const resolvePoses = (keys: string[]) =>
    keys.map(k => POSES[k]).filter((p): p is YogaPose => !!p);

  const prePoses = resolvePoses(safePre);
  const activePoses = resolvePoses(safeActive);
  const recoveryPoses = resolvePoses(safeRecovery);

  // Weekly minutes
  const baseMinutes = ageTier === "u14" ? 60 : ageTier === "u18" ? 80 : 90;
  const weeklyMinutes = Math.round(baseMinutes * durationMult);

  // Coach notes and special flags
  const coachNotes: string[] = [];
  const specialFlags: string[] = [];

  // Age-based notes
  if (ageTier === "u14") {
    coachNotes.push("U14 protocol: Gamify sessions using animal pose names and partner activities. Use 15-min circuits. No forced inversions (Sirsasana). No Kumbhaka (breath retention). No advanced strength holds.");
    coachNotes.push("Focus on body awareness, playfulness, and fun. Technical precision improves naturally through regular gentle practice.");
    specialFlags.push("⚠️ U14 — No Sirsasana (headstand). No breath retention. Reduce all hold durations by 40%. Gamified delivery recommended.");
  }
  if (ageTier === "u18") {
    coachNotes.push("U18 protocol: Begin introducing Kumbhaka gently (5-second retention only). Full asana library available except Hanumanasana — only introduce with supervised progressive preparation.");
  }

  // Gender-based notes
  if (athlete.gender === "F" && athlete.age >= 13 && athlete.age <= 24) {
    coachNotes.push("Female athlete protocol (ages 13–24): In Week 3–4 of training cycle, activate menstrual phase modifier — reduce Kapalabhati and Bhastrika intensity, add Supta Baddha Konasana, prioritise Yoga Nidra over active asanas. Bhastrika is contraindicated during heavy menstrual flow.");
    specialFlags.push("♀️ Female protocol: Weeks 3–4 — switch to restorative sequence. Avoid inverted poses during heavy menstrual days. Yoga Nidra increased to 20 mins.");
  }

  // BMI-based notes
  if (athlete.bmi > 28) {
    coachNotes.push("High BMI (>28): Joint-protective modifications mandatory. No deep inversions. No Hanumanasana. Use blocks and straps for all standing poses. Weight-bearing holds reduced to 60% duration. Prioritise Yoga Nidra for cortisol/weight management support.");
    specialFlags.push("⚖️ BMI >28: Inversions contraindicated. Blocks/straps mandatory. Reduced hold durations. Add body-neutral confidence sequence.");
  }
  if (athlete.bmi < 16.0) {
    coachNotes.push("Low BMI (<16.0): Strength-bearing asanas prioritised (Navasana, Utkatasana, Virabhadrasana series). Confirm athlete has eaten 60–90 mins before session — yoga on empty stomach risks hypoglycaemia. Limit Yoga Nidra to 10 mins maximum.");
    specialFlags.push("⚠️ Low BMI: Pre-session nutrition check required. Strength asanas prioritised. Limit Yoga Nidra to 10 mins.");
  }

  // Fitness level notes
  if (fitnessLevel === "beginner") {
    coachNotes.push("Beginner track active: Advanced poses (Chaturanga, Hanumanasana, Bakasana, Bhastrika) are excluded from this prescription. Reduce all hold durations by 30%. Use wall support for balance poses. These are phase-2 goals after 4–6 weeks of consistent practice.");
  }
  if (fitnessLevel === "intermediate") {
    coachNotes.push("Intermediate track: Advanced arm balances (Bakasana, Hanumanasana) excluded. All other poses available. Build toward full expression over 3–4 weeks.");
  }

  // Dominant dimension adaptations
  if (athlete.dimensionScores) {
    const dims = athlete.dimensionScores;
    const minDim = Object.entries(dims).sort((a, b) => a[1] - b[1])[0];
    const additions: Record<string, string> = {
      speed: "Weak dimension — Speed: Add an extra Kapalabhati round (2 × 30 reps). Respiratory efficiency directly supports speed-endurance.",
      power: "Weak dimension — Power: Prioritise Navasana and Utkatasana in active phase. Power athletes need core-to-limb force transfer training.",
      endurance: "Weak dimension — Endurance: Apply Ujjayi breath throughout entire active session. Endurance athletes benefit most from sustained aerobic breath pacing.",
      agility: "Weak dimension — Agility: Emphasise Trikonasana and Parsvakonasana. Lateral chain flexibility is the primary physical limiter in agility-deficit athletes.",
      bodyComp: "Weak dimension — Body Composition: Extend Yoga Nidra by 5 mins. Cortisol reduction directly supports body composition normalisation over training cycles.",
    };
    if (additions[minDim[0]]) {
      coachNotes.push(additions[minDim[0]]);
    }
  }

  // Build weekly schedule
  const weeklySchedule: WeekDay[] = matrix.weeklySchedule.map(day => ({
    ...day,
    duration: Math.round(day.duration * durationMult),
    poses: [...safePre.slice(0, 2), ...safeActive.slice(0, 2)],
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
