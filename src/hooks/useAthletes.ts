import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getSeedAthletes } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";
import { toast } from "@/hooks/use-toast";

export interface DatasetMeta {
  id: string;
  name: string;
  version: string;
  count: number;
  importedAt: string;
  source: "seed" | "import";
  athletes?: EnrichedAthlete[];
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

const LS_DATASETS_KEY = "pratibha_datasets";
const LS_ACTIVE_KEY = "pratibha_active_dataset";
const MAX_DATASETS = 5;
const MAX_ATHLETES_PER_DATASET = 500;

/** Persist saved datasets (without athletes array — stored separately) + athlete blobs */
function persistDatasets(datasets: DatasetMeta[]) {
  try {
    // Store meta without athletes array (athletes stored under separate keys)
    const metas = datasets.map(({ athletes: _, ...m }) => m);
    localStorage.setItem(LS_DATASETS_KEY, JSON.stringify(metas));
    // Store athletes per dataset id
    datasets.forEach((ds) => {
      if (ds.athletes && ds.id !== "seed") {
        localStorage.setItem(`pratibha_athletes_${ds.id}`, JSON.stringify(ds.athletes));
      }
    });
  } catch (e) {
    console.warn("[Pratibha] localStorage write failed:", e);
  }
}

/** Load persisted datasets from localStorage, rehydrating athletes */
function loadPersistedDatasets(): DatasetMeta[] {
  try {
    const raw = localStorage.getItem(LS_DATASETS_KEY);
    if (!raw) return [];
    const metas: DatasetMeta[] = JSON.parse(raw);
    return metas
      .filter((m) => m.id !== "seed")
      .map((m) => {
        const athletesRaw = localStorage.getItem(`pratibha_athletes_${m.id}`);
        const athletes: EnrichedAthlete[] = athletesRaw ? JSON.parse(athletesRaw) : [];
        return { ...m, athletes };
      });
  } catch (e) {
    console.warn("[Pratibha] localStorage read failed:", e);
    return [];
  }
}

function getPersistedActiveId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_KEY);
  } catch {
    return null;
  }
}

function setPersistedActiveId(id: string) {
  try {
    localStorage.setItem(LS_ACTIVE_KEY, id);
  } catch {}
}

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
    const doInit = () => {
      const enriched = enrichAthletes(getSeedAthletes());
      const seedDs: DatasetMeta = { ...SEED_META, count: enriched.length, athletes: enriched };
      setSeedAthletes(enriched);

      // Rehydrate from localStorage
      const persisted = loadPersistedDatasets();
      const allDatasets: DatasetMeta[] = [seedDs, ...persisted];
      setSavedDatasets(allDatasets);

      const activeId = getPersistedActiveId();
      if (activeId && activeId !== "seed") {
        const activeDs = persisted.find((d) => d.id === activeId);
        if (activeDs?.athletes && activeDs.athletes.length > 0) {
          setRawAthletes(activeDs.athletes);
          setDatasetMeta({ ...activeDs, athletes: undefined });
          setLoading(false);
          return;
        }
      }

      // Default to seed
      setRawAthletes(enriched);
      setDatasetMeta({ ...SEED_META, count: enriched.length });
      setLoading(false);
    };

    const id = requestIdleCallback ? requestIdleCallback(doInit) : setTimeout(doInit, 0);

    return () => {
      if (requestIdleCallback) cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  const addDataset = useCallback(
    (meta: Omit<DatasetMeta, "id">, newAthletes: EnrichedAthlete[]) => {
      // Cap dataset size
      if (newAthletes.length > MAX_ATHLETES_PER_DATASET) {
        toast({
          title: "Large dataset truncated",
          description: `Only the first ${MAX_ATHLETES_PER_DATASET} athletes were stored due to browser storage limits.`,
          variant: "destructive",
        });
        newAthletes = newAthletes.slice(0, MAX_ATHLETES_PER_DATASET);
      }

      const newId = `import_${Date.now()}`;
      const full: DatasetMeta = { ...meta, id: newId, count: newAthletes.length, athletes: newAthletes };

      setSavedDatasets((prev) => {
        // Remove same-name duplicates, keep seed, cap at MAX_DATASETS imports
        const withoutSeed = prev.filter((d) => d.id !== "seed");
        const filtered = withoutSeed.filter((d) => d.name !== meta.name);
        const trimmed = [full, ...filtered].slice(0, MAX_DATASETS);
        const next = [prev.find((d) => d.id === "seed")!, ...trimmed];

        // Persist after state update
        setTimeout(() => persistDatasets(next), 0);
        return next;
      });

      setRawAthletes(newAthletes);
      setDatasetMeta({ ...full, athletes: undefined });
      setPersistedActiveId(newId);
    },
    []
  );

  const loadDataset = useCallback(
    (id: string) => {
      const ds = savedDatasets.find((d) => d.id === id);
      if (!ds) return;

      setPersistedActiveId(id);

      if (id === "seed") {
        setRawAthletes(seedAthletes);
        setDatasetMeta({ ...ds, athletes: undefined });
        return;
      }
      if (!ds.athletes || ds.athletes.length === 0) return;
      setRawAthletes(ds.athletes);
      setDatasetMeta({ ...ds, athletes: undefined });
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
