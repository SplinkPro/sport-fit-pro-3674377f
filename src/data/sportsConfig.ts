export interface SportConfig {
  key: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  color: string;
  traitWeights: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    bodyComp: number;
  };
  minBMI?: number;
  maxBMI?: number;
  description: string;
  whyEn: string;
  whyHi: string;
  /** SAI Circular 07/2023 — is this sport in the official Khelo India talent pathway? */
  khloIndiaPathway?: boolean;
  /** Primary tests that determine fit for this sport */
  primaryTests?: string[];
}

export const SPORTS_CONFIG: SportConfig[] = [
  // ─── Existing 8 (validated) ────────────────────────────────────────────────
  {
    key: "athletics",
    nameEn: "Athletics",
    nameHi: "एथलेटिक्स",
    icon: "🏃",
    color: "#2563EB",
    traitWeights: { speed: 0.35, power: 0.25, endurance: 0.25, agility: 0.10, bodyComp: 0.05 },
    description: "Track & field events requiring speed, power and endurance",
    whyEn: "Strong sprint and jump metrics indicate explosive speed and power suited for track & field.",
    whyHi: "मजबूत स्प्रिंट और जंप मेट्रिक्स ट्रैक और फील्ड के लिए विस्फोटक गति और शक्ति का संकेत देते हैं।",
    khloIndiaPathway: true,
    primaryTests: ["sprint30m", "broadJump", "verticalJump"],
  },
  {
    key: "football",
    nameEn: "Football",
    nameHi: "फुटबॉल",
    icon: "⚽",
    color: "#16A34A",
    traitWeights: { speed: 0.30, power: 0.20, endurance: 0.30, agility: 0.15, bodyComp: 0.05 },
    description: "Requires combination of speed, endurance and agility",
    whyEn: "Football demands sustained running endurance combined with speed and agility over 90 minutes.",
    whyHi: "फुटबॉल में 90 मिनट तक लगातार दौड़ने की सहनशक्ति और गति की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["sprint30m", "run800m", "shuttleRun"],
  },
  {
    key: "kabaddi",
    nameEn: "Kabaddi",
    nameHi: "कबड्डी",
    icon: "🤸",
    color: "#D97706",
    traitWeights: { speed: 0.25, power: 0.30, endurance: 0.20, agility: 0.20, bodyComp: 0.05 },
    description: "Contact sport requiring explosive power and agility",
    whyEn: "Kabaddi needs explosive power for raiding and strong agility for defensive holds.",
    whyHi: "कबड्डी में रेडिंग के लिए विस्फोटक शक्ति और रक्षात्मक पकड़ के लिए फुर्ती की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["verticalJump", "shuttleRun", "sprint30m"],
  },
  {
    key: "volleyball",
    nameEn: "Volleyball",
    nameHi: "वॉलीबॉल",
    icon: "🏐",
    color: "#7C3AED",
    traitWeights: { speed: 0.20, power: 0.35, endurance: 0.15, agility: 0.20, bodyComp: 0.10 },
    description: "Requires vertical jump power and upper body strength",
    whyEn: "High vertical jump is the primary predictor of volleyball success — essential for blocking and spiking.",
    whyHi: "उच्च वर्टिकल जंप वॉलीबॉल में ब्लॉकिंग और स्पाइकिंग के लिए प्राथमिक भविष्यवक्ता है।",
    khloIndiaPathway: true,
    primaryTests: ["verticalJump", "broadJump"],
  },
  {
    key: "cycling",
    nameEn: "Cycling",
    nameHi: "साइकिलिंग",
    icon: "🚴",
    color: "#0891B2",
    traitWeights: { speed: 0.15, power: 0.30, endurance: 0.45, agility: 0.05, bodyComp: 0.05 },
    description: "Aerobic endurance and lower-body power sport",
    whyEn: "Strong 800m endurance and power output correlate strongly with cycling performance.",
    whyHi: "मजबूत 800 मीटर सहनशक्ति और शक्ति उत्पादन साइकिलिंग प्रदर्शन से मजबूती से संबंधित है।",
    khloIndiaPathway: true,
    primaryTests: ["run800m", "broadJump"],
  },
  {
    key: "swimming",
    nameEn: "Swimming",
    nameHi: "तैराकी",
    icon: "🏊",
    color: "#0284C7",
    traitWeights: { speed: 0.25, power: 0.30, endurance: 0.30, agility: 0.05, bodyComp: 0.10 },
    description: "Requires full-body power and aerobic endurance",
    whyEn: "Swimming needs a balance of power and endurance; body composition plays a supporting role.",
    whyHi: "तैराकी में शक्ति और सहनशक्ति का संतुलन आवश्यक है; शरीर की संरचना सहायक भूमिका निभाती है।",
    khloIndiaPathway: true,
    primaryTests: ["run800m", "broadJump", "verticalJump"],
  },
  {
    key: "wrestling",
    nameEn: "Wrestling",
    nameHi: "कुश्ती",
    icon: "🤼",
    color: "#B45309",
    traitWeights: { speed: 0.10, power: 0.45, endurance: 0.20, agility: 0.15, bodyComp: 0.10 },
    description: "Strength and explosive power combat sport",
    whyEn: "Wrestling is dominated by explosive strength and power; lower-body and upper-body force production.",
    whyHi: "कुश्ती में विस्फोटक शक्ति और बल उत्पादन का प्रभुत्व है।",
    khloIndiaPathway: true,
    primaryTests: ["verticalJump", "broadJump"],
  },
  {
    key: "basketball",
    nameEn: "Basketball",
    nameHi: "बास्केटबॉल",
    icon: "🏀",
    color: "#EA580C",
    traitWeights: { speed: 0.25, power: 0.30, endurance: 0.20, agility: 0.20, bodyComp: 0.05 },
    description: "Requires vertical power, speed and court agility",
    whyEn: "Basketball rewards vertical power and court agility — key metrics are jump height and speed.",
    whyHi: "बास्केटबॉल में वर्टिकल पावर और कोर्ट फुर्ती का पुरस्कार दिया जाता है।",
    khloIndiaPathway: true,
    primaryTests: ["verticalJump", "sprint30m", "shuttleRun"],
  },

  // ─── NEW 7 (SAI Circular 07/2023 Khelo India sports) ──────────────────────

  /**
   * Badminton — SAI Circular 07/2023 included sport
   * Key traits: exceptional agility & reaction speed; power for smashes; moderate endurance.
   * Primary tests: Shuttle Run (best predictor of court agility), sprint speed.
   * Source: SAI badminton talent identification guidelines + Phomsoupha & Laffaye (2015).
   */
  {
    key: "badminton",
    nameEn: "Badminton",
    nameHi: "बैडमिंटन",
    icon: "🏸",
    color: "#DC2626",
    traitWeights: { speed: 0.30, power: 0.25, endurance: 0.15, agility: 0.25, bodyComp: 0.05 },
    description: "Court sport requiring extreme agility, speed and wrist power",
    whyEn: "Badminton demands the fastest court agility and reaction speed of any racket sport. Shuttle run and sprint speed are the top predictors.",
    whyHi: "बैडमिंटन में किसी भी रैकेट खेल की तुलना में सबसे तेज़ कोर्ट फुर्ती और प्रतिक्रिया गति की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["shuttleRun", "sprint30m"],
  },

  /**
   * Boxing — SAI Circular 07/2023 included sport with staged modules
   * Key traits: explosive power for punches; agility to evade; aerobic endurance for rounds; speed.
   * Primary tests: sprint speed, vertical jump (explosive power proxy), shuttle run (footwork agility).
   * Source: SAI boxing talent identification + Chaabène et al. (2015) boxing performance analysis.
   */
  {
    key: "boxing",
    nameEn: "Boxing",
    nameHi: "मुक्केबाज़ी",
    icon: "🥊",
    color: "#7F1D1D",
    traitWeights: { speed: 0.30, power: 0.30, endurance: 0.20, agility: 0.15, bodyComp: 0.05 },
    description: "Combat sport requiring explosive punch power, speed and endurance",
    whyEn: "Boxing selects for explosive upper-body power, foot speed, and the aerobic capacity to sustain effort across rounds. Sprint and jump power are key proxies.",
    whyHi: "मुक्केबाज़ी में विस्फोटक शक्ति, पैरों की गति और राउंड में सहनशक्ति की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["sprint30m", "verticalJump", "shuttleRun"],
  },

  /**
   * Hockey — SAI Circular 07/2023 included sport (role-specific testing)
   * Key traits: high-speed endurance (repeated sprints over 60+ minutes); agility for stick work;
   *             power for hit/push; team coordination.
   * Primary tests: 800m endurance (sustained aerobic base), sprint (breakaway speed), shuttle (agility).
   * Source: SAI hockey assessment manual + Elferink-Gemser et al. (2010).
   */
  {
    key: "hockey",
    nameEn: "Hockey",
    nameHi: "हॉकी",
    icon: "🏑",
    color: "#166534",
    traitWeights: { speed: 0.30, power: 0.20, endurance: 0.30, agility: 0.15, bodyComp: 0.05 },
    description: "Team sport requiring repeated sprint endurance and stick agility",
    whyEn: "Hockey demands high-intensity repeated sprinting over 60+ minutes. Strong 800m endurance combined with sprint speed is the hallmark of elite hockey players.",
    whyHi: "हॉकी में 60+ मिनट तक बार-बार तेज़ दौड़ने की क्षमता और मजबूत सहनशक्ति की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["run800m", "sprint30m", "shuttleRun"],
  },

  /**
   * Archery — SAI Circular 07/2023 included sport
   * Key traits: body stability and postural control; psychological composure; moderate upper-body strength.
   * Physical tests are less predictive for archery — BMI and postural stability dominate.
   * Body composition (lighter, controlled BMI) and endurance for standing steadiness are key.
   * Source: SAI archery talent ID + Ertan et al. (2003) archery biomechanics.
   */
  {
    key: "archery",
    nameEn: "Archery",
    nameHi: "तीरंदाज़ी",
    icon: "🏹",
    color: "#4B5563",
    traitWeights: { speed: 0.05, power: 0.25, endurance: 0.25, agility: 0.10, bodyComp: 0.35 },
    description: "Precision sport requiring postural stability and body control",
    whyEn: "Archery favours athletes with exceptional postural control and body stability. Optimal body composition, upper-body strength, and aerobic base for static endurance are the primary selectors.",
    whyHi: "तीरंदाज़ी में शारीरिक स्थिरता और नियंत्रण उत्कृष्ट होना चाहिए। शरीर की सर्वोत्तम संरचना प्राथमिक चयन मानदंड है।",
    khloIndiaPathway: true,
    primaryTests: ["run800m", "broadJump"],
  },

  /**
   * Kho Kho — Indian traditional sport, NSTSS & Khelo India school games
   * Key traits: explosive acceleration speed; lateral agility; endurance for chasing/fleeing sequences.
   * Very similar profile to Kabaddi but with heavier emphasis on sprint speed and agility.
   * Source: SAI Kho Kho talent criteria + SGFI competition standards.
   */
  {
    key: "kho_kho",
    nameEn: "Kho Kho",
    nameHi: "खो-खो",
    icon: "🏃‍♀️",
    color: "#9D174D",
    traitWeights: { speed: 0.35, power: 0.20, endurance: 0.20, agility: 0.20, bodyComp: 0.05 },
    description: "Indian tag sport requiring explosive speed and agility",
    whyEn: "Kho Kho is one of the fastest team sports — explosive sprint speed and sharp lateral agility are non-negotiable for both chasers and defenders.",
    whyHi: "खो-खो सबसे तेज़ टीम खेलों में से एक है — विस्फोटक स्प्रिंट गति और तीव्र फुर्ती आवश्यक है।",
    khloIndiaPathway: true,
    primaryTests: ["sprint30m", "shuttleRun", "broadJump"],
  },

  /**
   * Table Tennis — SAI Circular 07/2023 included sport
   * Key traits: fastest reaction times; hand-eye coordination; quick footwork agility.
   * Among all court/racket sports, agility is the single strongest predictor.
   * Source: SAI table tennis talent identification + Faber et al. (2020) TT selection factors.
   */
  {
    key: "table_tennis",
    nameEn: "Table Tennis",
    nameHi: "टेबल टेनिस",
    icon: "🏓",
    color: "#1D4ED8",
    traitWeights: { speed: 0.30, power: 0.20, endurance: 0.10, agility: 0.35, bodyComp: 0.05 },
    description: "Precision racket sport demanding elite reaction speed and footwork",
    whyEn: "Table Tennis is the fastest reflex sport. Exceptional agility (shuttle run) and sprint speed are the primary physical predictors. Reaction time is paramount.",
    whyHi: "टेबल टेनिस सबसे तेज़ रिफ्लेक्स खेल है। असाधारण फुर्ती और स्प्रिंट गति प्राथमिक भविष्यवक्ता हैं।",
    khloIndiaPathway: true,
    primaryTests: ["shuttleRun", "sprint30m"],
  },

  /**
   * Weightlifting — SAI Circular 07/2023 included sport (weight-class competition)
   * Key traits: maximal lower-body explosive power; lean body mass with controlled weight.
   * Vertical jump and broad jump are the most accessible proxies for Olympic lifting potential.
   * Body composition (lean mass / optimal BMI) is critical for weight class placement.
   * Source: SAI weightlifting selection criteria + Garhammer (1993) weightlifting biomechanics.
   */
  {
    key: "weightlifting",
    nameEn: "Weightlifting",
    nameHi: "भारोत्तोलन",
    icon: "🏋️",
    color: "#6B21A8",
    traitWeights: { speed: 0.05, power: 0.55, endurance: 0.10, agility: 0.05, bodyComp: 0.25 },
    description: "Olympic strength sport requiring maximal lower-body explosive power",
    whyEn: "Weightlifting demands the highest explosive power of any Olympic sport. Vertical jump and broad jump are the best field-test proxies for snatch and clean & jerk potential.",
    whyHi: "भारोत्तोलन में किसी भी ओलंपिक खेल की तुलना में सबसे अधिक विस्फोटक शक्ति की आवश्यकता होती है।",
    khloIndiaPathway: true,
    primaryTests: ["verticalJump", "broadJump"],
  },
];
