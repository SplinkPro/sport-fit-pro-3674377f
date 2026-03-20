import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";

export interface DatasetMeta {
  name: string;       // e.g. "athletes_batch_3.csv"
  version: string;    // e.g. "v3"
  count: number;
  importedAt: string; // ISO date string
  source: "seed" | "import";
}

interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
  datasetMeta: DatasetMeta;
  setAthletes: React.Dispatch<React.SetStateAction<EnrichedAthlete[]>>;
  setDatasetMeta: React.Dispatch<React.SetStateAction<DatasetMeta>>;
}

const SEED_META: DatasetMeta = {
  name: "Bihar Demo Dataset",
  version: "v3",
  count: 82,
  importedAt: "2024-03-10",
  source: "seed",
};

const AthleteContext = createContext<AthleteContextValue>({
  athletes: [],
  loading: true,
  datasetMeta: SEED_META,
  setAthletes: () => {},
  setDatasetMeta: () => {},
});

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [rawAthletes, setRawAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta>(SEED_META);

  useEffect(() => {
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
    () => ({ athletes: rawAthletes, loading, datasetMeta, setAthletes: setRawAthletes, setDatasetMeta }),
    [rawAthletes, loading, datasetMeta]
  );

  return React.createElement(AthleteContext.Provider, { value }, children);
}

export function useAthletes() {
  return useContext(AthleteContext);
}
