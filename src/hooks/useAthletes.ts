import { createContext, useContext, useState, useEffect } from "react";
import React from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";

interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
}

const AthleteContext = createContext<AthleteContextValue>({ athletes: [], loading: true });

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [athletes, setAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const raw = getSeedAthletes();
      const enriched = enrichAthletes(raw);
      setAthletes(enriched);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    React.createElement(AthleteContext.Provider, { value: { athletes, loading } }, children)
  );
}

export function useAthletes() {
  return useContext(AthleteContext);
}
