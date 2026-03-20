import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";
import React from "react";

interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
}

const AthleteContext = createContext<AthleteContextValue>({ athletes: [], loading: true });

export function AthleteProvider({ children }: { children: ReactNode }) {
  const [athletes, setAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async data load
    setTimeout(() => {
      const raw = getSeedAthletes();
      const enriched = enrichAthletes(raw);
      setAthletes(enriched);
      setLoading(false);
    }, 300);
  }, []);

  return (
    <AthleteContext.Provider value={{ athletes, loading }}>
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthletes() {
  return useContext(AthleteContext);
}
