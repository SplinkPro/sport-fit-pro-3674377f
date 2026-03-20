import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";

interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
  /** Replace full dataset (used by Import wizard) */
  setAthletes: React.Dispatch<React.SetStateAction<EnrichedAthlete[]>>;
}

const AthleteContext = createContext<AthleteContextValue>({
  athletes: [],
  loading: true,
  setAthletes: () => {},
});

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [rawAthletes, setRawAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Move heavy computation off the main thread render cycle
    const id = requestIdleCallback
      ? requestIdleCallback(() => {
          const enriched = enrichAthletes(getSeedAthletes());
          setRawAthletes(enriched);
          setLoading(false);
        })
      : setTimeout(() => {
          const enriched = enrichAthletes(getSeedAthletes());
          setRawAthletes(enriched);
          setLoading(false);
        }, 0);

    return () => {
      if (requestIdleCallback) cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  const value = useMemo(
    () => ({ athletes: rawAthletes, loading, setAthletes: setRawAthletes }),
    [rawAthletes, loading]
  );

  return React.createElement(AthleteContext.Provider, { value }, children);
}

export function useAthletes() {
  return useContext(AthleteContext);
}
