import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";

export interface DatasetMeta {
  id: string;         // unique key, e.g. "seed" or timestamp
  name: string;       // e.g. "athletes_batch_3.csv"
  version: string;    // e.g. "v3"
  count: number;
  importedAt: string; // ISO date string
  source: "seed" | "import";
  athletes?: EnrichedAthlete[]; // stored athletes for this dataset
}

interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
  datasetMeta: DatasetMeta;
  savedDatasets: DatasetMeta[];
  setAthletes: React.Dispatch<React.SetStateAction<EnrichedAthlete[]>>;
  setDatasetMeta: React.Dispatch<React.SetStateAction<DatasetMeta>>;
  addDataset: (meta: Omit<DatasetMeta, "id">, athletes: EnrichedAthlete[]) => void;
  loadDataset: (id: string) => void;
}

const SEED_META: DatasetMeta = {
  id: "seed",
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
  savedDatasets: [SEED_META],
  setAthletes: () => {},
  setDatasetMeta: () => {},
  addDataset: () => {},
  loadDataset: () => {},
});

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [seedAthletes, setSeedAthletes] = useState<EnrichedAthlete[]>([]);
  const [rawAthletes, setRawAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta>(SEED_META);
  const [savedDatasets, setSavedDatasets] = useState<DatasetMeta[]>([SEED_META]);

  useEffect(() => {
    const id = requestIdleCallback
      ? requestIdleCallback(() => {
          const enriched = enrichAthletes(getSeedAthletes());
          setSeedAthletes(enriched);
          setRawAthletes(enriched);
          setLoading(false);
          // Patch seed count
          setSavedDatasets([{ ...SEED_META, count: enriched.length, athletes: enriched }]);
          setDatasetMeta((m) => ({ ...m, count: enriched.length }));
        })
      : setTimeout(() => {
          const enriched = enrichAthletes(getSeedAthletes());
          setSeedAthletes(enriched);
          setRawAthletes(enriched);
          setLoading(false);
          setSavedDatasets([{ ...SEED_META, count: enriched.length, athletes: enriched }]);
          setDatasetMeta((m) => ({ ...m, count: enriched.length }));
        }, 0);

    return () => {
      if (requestIdleCallback) cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  /** Register a freshly imported dataset and make it active */
  const addDataset = useCallback(
    (meta: Omit<DatasetMeta, "id">, athletes: EnrichedAthlete[]) => {
      const newId = `import_${Date.now()}`;
      const full: DatasetMeta = { ...meta, id: newId, athletes };
      setSavedDatasets((prev) => {
        // Avoid duplicates by name
        const filtered = prev.filter((d) => d.name !== meta.name);
        return [...filtered, full];
      });
      setRawAthletes(athletes);
      setDatasetMeta(full);
    },
    []
  );

  /** Switch to an already-saved dataset */
  const loadDataset = useCallback(
    (id: string) => {
      if (id === "seed") {
        setRawAthletes(seedAthletes);
        setDatasetMeta((prev) => savedDatasets.find((d) => d.id === "seed") ?? prev);
        return;
      }
      const ds = savedDatasets.find((d) => d.id === id);
      if (!ds || !ds.athletes) return;
      setRawAthletes(ds.athletes);
      setDatasetMeta(ds);
    },
    [savedDatasets, seedAthletes]
  );

  const value = useMemo(
    () => ({
      athletes: rawAthletes,
      loading,
      datasetMeta,
      savedDatasets,
      setAthletes: setRawAthletes,
      setDatasetMeta,
      addDataset,
      loadDataset,
    }),
    [rawAthletes, loading, datasetMeta, savedDatasets, addDataset, loadDataset]
  );

  return React.createElement(AthleteContext.Provider, { value }, children);
}

export function useAthletes() {
  return useContext(AthleteContext);
}

