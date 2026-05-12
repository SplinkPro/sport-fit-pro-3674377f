import { describe, it, expect } from "vitest";
import { queryAthletes } from "@/pages/AIQuery";
import type { EnrichedAthlete } from "@/engine/analyticsEngine";

// Minimal stub — only fields the query path inspects.
function mkAthlete(overrides: Partial<EnrichedAthlete>): EnrichedAthlete {
  return {
    id: overrides.id ?? "x",
    name: overrides.name ?? "Test",
    age: overrides.age ?? 14,
    gender: overrides.gender ?? "M",
    height: 160,
    weight: 50,
    bmi: 19.5,
    sprint30m: 5.0,
    run800m: 200,
    verticalJump: 35,
    broadJump: 180,
    shuttleRun: 12.0,
    school: "S",
    district: "D",
    compositeScore: 60,
    percentiles: {},
    benchmarkBands: {},
    flags: [],
    completeness: 1,
    sportFit: [],
    isHighPotential: false,
    derivedIndices: undefined,
    ...overrides,
  } as unknown as EnrichedAthlete;
}

const POOL: EnrichedAthlete[] = [
  mkAthlete({ id: "a", name: "A", age: 12, gender: "M", compositeScore: 40 }),
  mkAthlete({ id: "b", name: "B", age: 12, gender: "M", compositeScore: 55 }),
  mkAthlete({ id: "c", name: "C", age: 14, gender: "M", compositeScore: 70 }),
  mkAthlete({ id: "d", name: "D", age: 17, gender: "M", compositeScore: 90 }),
  mkAthlete({ id: "e", name: "E", age: 18, gender: "M", compositeScore: 95 }),
  mkAthlete({ id: "f", name: "F", age: 12, gender: "F", compositeScore: 65 }),
];

describe("AIQuery age parsing (client bug fix)", () => {
  it("'best male athletes at 12 year old' returns only age-12 males", () => {
    const r = queryAthletes("best male athletes at 12 year old", POOL);
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.results.every((a) => a.age === 12 && a.gender === "M")).toBe(true);
    expect(r.filters).toContain("Age: 12");
  });

  it("'12 year old girls' filters by single age + gender", () => {
    const r = queryAthletes("12 year old girls", POOL);
    expect(r.results.every((a) => a.age === 12 && a.gender === "F")).toBe(true);
  });

  it("'aged 14-16' still uses range parser (no regression)", () => {
    const r = queryAthletes("athletes aged 14-16", POOL);
    expect(r.results.every((a) => a.age >= 14 && a.age <= 16)).toBe(true);
    expect(r.filters.some((f) => f.startsWith("Age:") && f.includes("–"))).toBe(true);
  });

  it("'top 12 athletes' does NOT spuriously apply age=12 filter", () => {
    const r = queryAthletes("top 12 athletes", POOL);
    expect(r.filters.find((f) => f.startsWith("Age:"))).toBeUndefined();
  });

  it("'composite score above 60' does NOT spuriously apply age filter", () => {
    const r = queryAthletes("athletes with composite score above 60", POOL);
    expect(r.filters.find((f) => f.startsWith("Age:"))).toBeUndefined();
  });

  it("'aged 12' (no unit) is recognized as single age", () => {
    const r = queryAthletes("aged 12 male athletes", POOL);
    expect(r.filters).toContain("Age: 12");
  });
});
