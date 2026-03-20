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
}

export const SPORTS_CONFIG: SportConfig[] = [
  {
    key: "athletics",
    nameEn: "Athletics",
    nameHi: "एथलेटिक्स",
    icon: "🏃",
    color: "#2563EB",
    traitWeights: { speed: 0.35, power: 0.25, endurance: 0.25, agility: 0.1, bodyComp: 0.05 },
    description: "Track & field events requiring speed, power and endurance",
    whyEn: "Strong sprint and jump metrics indicate explosive speed and power suited for track & field.",
    whyHi: "मजबूत स्प्रिंट और जंप मेट्रिक्स ट्रैक और फील्ड के लिए विस्फोटक गति और शक्ति का संकेत देते हैं।",
  },
  {
    key: "football",
    nameEn: "Football",
    nameHi: "फुटबॉल",
    icon: "⚽",
    color: "#16A34A",
    traitWeights: { speed: 0.3, power: 0.2, endurance: 0.3, agility: 0.15, bodyComp: 0.05 },
    description: "Requires combination of speed, endurance and agility",
    whyEn: "Football demands sustained running endurance combined with speed and agility over 90 minutes.",
    whyHi: "फुटबॉल में 90 मिनट तक लगातार दौड़ने की सहनशक्ति और गति की आवश्यकता होती है।",
  },
  {
    key: "kabaddi",
    nameEn: "Kabaddi",
    nameHi: "कबड्डी",
    icon: "🤸",
    color: "#D97706",
    traitWeights: { speed: 0.25, power: 0.3, endurance: 0.2, agility: 0.2, bodyComp: 0.05 },
    description: "Contact sport requiring explosive power and agility",
    whyEn: "Kabaddi needs explosive power for raiding and strong agility for defensive holds.",
    whyHi: "कबड्डी में रेडिंग के लिए विस्फोटक शक्ति और रक्षात्मक पकड़ के लिए फुर्ती की आवश्यकता होती है।",
  },
  {
    key: "volleyball",
    nameEn: "Volleyball",
    nameHi: "वॉलीबॉल",
    icon: "🏐",
    color: "#7C3AED",
    traitWeights: { speed: 0.2, power: 0.35, endurance: 0.15, agility: 0.2, bodyComp: 0.1 },
    description: "Requires vertical jump power and upper body strength",
    whyEn: "High vertical jump is the primary predictor of volleyball success — essential for blocking and spiking.",
    whyHi: "उच्च वर्टिकल जंप वॉलीबॉल में ब्लॉकिंग और स्पाइकिंग के लिए प्राथमिक भविष्यवक्ता है।",
  },
  {
    key: "cycling",
    nameEn: "Cycling",
    nameHi: "साइकिलिंग",
    icon: "🚴",
    color: "#0891B2",
    traitWeights: { speed: 0.15, power: 0.3, endurance: 0.45, agility: 0.05, bodyComp: 0.05 },
    description: "Aerobic endurance and lower-body power sport",
    whyEn: "Strong 800m endurance and power output correlate strongly with cycling performance.",
    whyHi: "मजबूत 800 मीटर सहनशक्ति और शक्ति उत्पादन साइकिलिंग प्रदर्शन से मजबूती से संबंधित है।",
  },
  {
    key: "swimming",
    nameEn: "Swimming",
    nameHi: "तैराकी",
    icon: "🏊",
    color: "#0284C7",
    traitWeights: { speed: 0.25, power: 0.3, endurance: 0.3, agility: 0.05, bodyComp: 0.1 },
    description: "Requires full-body power and aerobic endurance",
    whyEn: "Swimming needs a balance of power and endurance; body composition plays a supporting role.",
    whyHi: "तैराकी में शक्ति और सहनशक्ति का संतुलन आवश्यक है; शरीर की संरचना सहायक भूमिका निभाती है।",
  },
  {
    key: "wrestling",
    nameEn: "Wrestling",
    nameHi: "कुश्ती",
    icon: "🤼",
    color: "#B45309",
    traitWeights: { speed: 0.1, power: 0.45, endurance: 0.2, agility: 0.15, bodyComp: 0.1 },
    description: "Strength and explosive power combat sport",
    whyEn: "Wrestling is dominated by explosive strength and power; lower-body and upper-body force production.",
    whyHi: "कुश्ती में विस्फोटक शक्ति और बल उत्पादन का प्रभुत्व है।",
  },
  {
    key: "basketball",
    nameEn: "Basketball",
    nameHi: "बास्केटबॉल",
    icon: "🏀",
    color: "#EA580C",
    traitWeights: { speed: 0.25, power: 0.3, endurance: 0.2, agility: 0.2, bodyComp: 0.05 },
    description: "Requires vertical power, speed and court agility",
    whyEn: "Basketball rewards vertical power and court agility — key metrics are jump height and speed.",
    whyHi: "बास्केटबॉल में वर्टिकल पावर और कोर्ट फुर्ती का पुरस्कार दिया जाता है।",
  },
];
