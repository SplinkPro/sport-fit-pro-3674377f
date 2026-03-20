export interface Athlete {
  id: string;
  name: string;
  gender: "M" | "F";
  dob: string; // YYYY-MM-DD
  age: number;
  school: string;
  district: string;
  height: number; // cm
  weight: number; // kg
  bmi?: number;
  // Performance metrics
  verticalJump?: number; // cm
  broadJump?: number; // cm
  sprint30m?: number; // seconds
  run800m?: number; // seconds
  shuttleRun?: number; // seconds
  footballThrow?: number; // meters
  // Computed
  compositeScore?: number; // 0–100
  completeness?: number; // 0–100%
  flags?: AthleteFlag[];
  assessmentDate: string;
  assessmentHistory?: AssessmentRecord[];
}

export interface AthleteFlag {
  type: "outlier" | "missing" | "underweight" | "overweight";
  metric?: string;
  message: string;
}

export interface AssessmentRecord {
  date: string;
  verticalJump?: number;
  broadJump?: number;
  sprint30m?: number;
  run800m?: number;
  shuttleRun?: number;
  footballThrow?: number;
  compositeScore?: number;
}

const schools = [
  { name: "Rajendra Prasad High School", district: "Patna" },
  { name: "Nehru Vidya Mandir", district: "Patna" },
  { name: "Gaya Model School", district: "Gaya" },
  { name: "Bhagalpur Sports Academy", district: "Bhagalpur" },
  { name: "Muzaffarpur Central School", district: "Muzaffarpur" },
];

// ─── Deterministic seeded PRNG (Mulberry32) ────────────────────────────────
// Ensures the same 82 athletes are generated on every page load / hot reload.
let _seed = 0x9E3779B9;
function mulberry32(): number {
  _seed |= 0; _seed = _seed + 0x6D2B79F5 | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function resetSeed() { _seed = 0x9E3779B9; }

function randFloat(min: number, max: number, dp = 1): number {
  return parseFloat((mulberry32() * (max - min) + min).toFixed(dp));
}
function randInt(min: number, max: number): number {
  return Math.floor(mulberry32() * (max - min + 1)) + min;
}

const maleNames = [
  "Rahul Kumar", "Amit Singh", "Rajesh Yadav", "Suresh Prasad", "Vikram Sharma",
  "Deepak Verma", "Rohit Gupta", "Arjun Tiwari", "Manish Mishra", "Sanjay Dubey",
  "Ankit Pandey", "Vivek Singh", "Gaurav Kumar", "Nikhil Roy", "Aman Jha",
  "Sachin Patel", "Ravi Sinha", "Ajay Maurya", "Vishal Thakur", "Hemant Rai",
  "Abhinav Kumar", "Pranav Shukla", "Sumit Barua", "Tarun Das", "Kapil Nath",
  "Dhruv Ojha", "Yash Chandra", "Lakhan Yadav", "Ritesh Chauhan", "Mukesh Tomar",
  "Niraj Mandal", "Suraj Paswan", "Bibek Mahato", "Santosh Sahni", "Pradip Hazra",
  "Avinash Lal", "Brij Mohan", "Chandan Raj", "Dev Narayan", "Firoz Ahmed",
  "Gaurav Narayan", "Harish Kumar", "Indra Bhushan", "Jagdish Rao", "Kiran Chand",
];

const femaleNames = [
  "Priya Sharma", "Neha Singh", "Sunita Yadav", "Rekha Devi", "Kavita Mishra",
  "Anjali Tiwari", "Pooja Gupta", "Ritu Pandey", "Sonia Verma", "Meena Roy",
  "Anita Jha", "Deepti Sinha", "Rashmi Dubey", "Shweta Patel", "Kiran Prasad",
  "Vandana Shukla", "Monu Kumari", "Rinki Devi", "Sushma Raj", "Pushpa Singh",
  "Geeta Chauhan", "Babita Maurya", "Usha Rani", "Lalita Devi", "Mamta Kumari",
  "Seema Sahni", "Poonam Barua", "Nirmala Das", "Savita Tiwari", "Champa Devi",
  "Rekha Paswan", "Bimla Kumari", "Chandni Jha", "Durga Rai", "Falguni Mishra",
];

function calcBMI(height: number, weight: number): number {
  const h = height / 100;
  return parseFloat((weight / (h * h)).toFixed(1));
}

function calcCompleteness(a: Partial<Athlete>): number {
  const required = ["height", "weight", "verticalJump", "broadJump", "sprint30m", "run800m"];
  const optional = ["shuttleRun", "footballThrow"];
  const reqScore = required.filter((k) => a[k as keyof Athlete] != null).length / required.length;
  const optScore = optional.filter((k) => a[k as keyof Athlete] != null).length / optional.length;
  return Math.round(reqScore * 80 + optScore * 20);
}

function calcFlags(a: Partial<Athlete>): AthleteFlag[] {
  const flags: AthleteFlag[] = [];
  if (a.bmi != null) {
    if (a.bmi < 14.5) flags.push({ type: "underweight", message: "BMI below 14.5 — may need nutritional attention" });
    else if (a.bmi > 28) flags.push({ type: "overweight", message: "BMI above 28 — review training load" });
  }
  if (a.verticalJump != null && a.verticalJump > 90) flags.push({ type: "outlier", metric: "verticalJump", message: "Vertical jump value unusually high" });
  if (a.sprint30m != null && a.sprint30m < 3.5) flags.push({ type: "outlier", metric: "sprint30m", message: "30m sprint value unusually fast" });
  const missing = ["verticalJump", "broadJump", "sprint30m", "run800m"].filter((k) => a[k as keyof Athlete] == null);
  if (missing.length > 0) flags.push({ type: "missing", message: `Missing: ${missing.join(", ")}` });
  return flags;
}

// Gender/age-specific metric parameters [mean, std]
const metricParams = {
  M: {
    "10-12": { vj: [32, 7], bj: [140, 18], s30: [5.6, 0.45], r800: [220, 30], shuttle: [16, 2], ft: [18, 4] },
    "13-15": { vj: [40, 8], bj: [165, 20], s30: [5.0, 0.4], r800: [200, 25], shuttle: [15, 1.8], ft: [22, 5] },
    "16-18": { vj: [50, 9], bj: [190, 22], s30: [4.5, 0.35], r800: [185, 22], shuttle: [14.2, 1.5], ft: [27, 5] },
    "19+":   { vj: [58, 10], bj: [210, 24], s30: [4.2, 0.3], r800: [175, 20], shuttle: [13.5, 1.4], ft: [32, 6] },
  },
  F: {
    "10-12": { vj: [26, 6], bj: [120, 16], s30: [6.0, 0.45], r800: [240, 30], shuttle: [17, 2], ft: [13, 3] },
    "13-15": { vj: [32, 7], bj: [140, 18], s30: [5.5, 0.4], r800: [225, 25], shuttle: [16.2, 1.8], ft: [16, 4] },
    "16-18": { vj: [38, 8], bj: [158, 20], s30: [5.1, 0.38], r800: [210, 22], shuttle: [15.5, 1.6], ft: [20, 4] },
    "19+":   { vj: [44, 9], bj: [170, 22], s30: [4.8, 0.35], r800: [200, 20], shuttle: [15, 1.5], ft: [23, 5] },
  },
};

function getAgeBand(age: number): keyof (typeof metricParams)["M"] {
  if (age <= 12) return "10-12";
  if (age <= 15) return "13-15";
  if (age <= 18) return "16-18";
  return "19+";
}

function sampleNormal(mean: number, std: number): number {
  // Box-Muller — uses deterministic PRNG
  const u = mulberry32(), v = mulberry32();
  const z = Math.sqrt(-2 * Math.log(u + 1e-10)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

function generateMetric(mean: number, std: number, dp = 1, missing = false): number | undefined {
  if (missing) return undefined;
  const val = sampleNormal(mean, std);
  return parseFloat(Math.max(mean - 3 * std, Math.min(mean + 3 * std, val)).toFixed(dp));
}

export function generateSeedAthletes(): Athlete[] {
  resetSeed(); // always start from the same seed = deterministic output
  const athletes: Athlete[] = [];
  let id = 1;

  for (let i = 0; i < 82; i++) {
    const isMale = i < 47;
    const gender = isMale ? "M" : "F";
    const age = randInt(10, 20);
    const school = schools[i % schools.length];
    const ageBand = getAgeBand(age);
    const params = metricParams[gender][ageBand];

    const isMissingData = i >= 72; // last 10 have some missing
    const isOutlier = i === 5 || i === 30; // intentional outliers

    const height = gender === "M"
      ? parseFloat((140 + (age - 10) * 4 + randFloat(-8, 8)).toFixed(1))
      : parseFloat((138 + (age - 10) * 3.5 + randFloat(-7, 7)).toFixed(1));
    const weight = gender === "M"
      ? parseFloat((32 + (age - 10) * 4.5 + randFloat(-6, 6)).toFixed(1))
      : parseFloat((30 + (age - 10) * 4 + randFloat(-5, 5)).toFixed(1));
    const bmi = calcBMI(height, weight);

    const verticalJump = isOutlier && isMale
      ? 95
      : generateMetric(params.vj[0], params.vj[1], 1, isMissingData && mulberry32() < 0.4);
    const broadJump = generateMetric(params.bj[0], params.bj[1], 1, isMissingData && mulberry32() < 0.3);
    const sprint30m = isOutlier && !isMale
      ? 3.2
      : generateMetric(params.s30[0], params.s30[1], 2, isMissingData && mulberry32() < 0.3);
    const run800m = generateMetric(params.r800[0], params.r800[1], 0, isMissingData && mulberry32() < 0.4);
    const shuttleRun = mulberry32() > 0.35 ? generateMetric(params.shuttle[0], params.shuttle[1], 2) : undefined;
    const footballThrow = mulberry32() > 0.4 ? generateMetric(params.ft[0], params.ft[1], 1) : undefined;

    const nameList = isMale ? maleNames : femaleNames;
    const name = nameList[Math.floor(i % nameList.length)];
    const year = 2024 - (age - 10);
    const dob = `${year}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;

    const partial: Partial<Athlete> = { height, weight, bmi, verticalJump, broadJump, sprint30m, run800m, shuttleRun, footballThrow };
    const completeness = calcCompleteness(partial);
    const flags = calcFlags({ ...partial, bmi });

    // History for first 20 athletes
    let assessmentHistory: AssessmentRecord[] | undefined;
    if (i < 20) {
      const prevVJ = verticalJump != null ? parseFloat((verticalJump - randFloat(2, 6)).toFixed(1)) : undefined;
      const prevBJ = broadJump != null ? parseFloat((broadJump - randFloat(5, 15)).toFixed(1)) : undefined;
      const prevS = sprint30m != null ? parseFloat((sprint30m + randFloat(0.1, 0.4)).toFixed(2)) : undefined;
      const prevR = run800m != null ? Math.round(run800m + randFloat(5, 20)) : undefined;
      assessmentHistory = [
        {
          date: "2024-03-15",
          verticalJump: prevVJ,
          broadJump: prevBJ,
          sprint30m: prevS,
          run800m: prevR,
          compositeScore: 0,
        },
        {
          date: "2024-09-10",
          verticalJump,
          broadJump,
          sprint30m,
          run800m,
          compositeScore: 0,
        },
      ];
    }

    athletes.push({
      id: `ATH${String(id++).padStart(4, "0")}`,
      name,
      gender,
      dob,
      age,
      school: school.name,
      district: school.district,
      height,
      weight,
      bmi,
      verticalJump,
      broadJump,
      sprint30m,
      run800m: run800m as number | undefined,
      shuttleRun,
      footballThrow,
      completeness,
      flags,
      assessmentDate: i < 20 ? "2024-09-10" : "2024-11-20",
      assessmentHistory,
    });
  }

  return athletes;
}

// Singleton
let _cachedAthletes: Athlete[] | null = null;
export function getSeedAthletes(): Athlete[] {
  if (!_cachedAthletes) {
    _cachedAthletes = generateSeedAthletes();
  }
  return _cachedAthletes;
}
