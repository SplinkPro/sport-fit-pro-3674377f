// useAthletes.ts — athlete context, always uses demo seed dataset
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getSeedAthletes, AssessmentRecord } from "../data/seedAthletes";
import { enrichAthletes, EnrichedAthlete } from "../engine/analyticsEngine";
import { toast } from "@/hooks/use-toast";

export interface DatasetMeta {
  id: string;
  name: string;
  version: string;
  count: number;
  importedAt: string;
  source: "seed" | "import";
  /** If true, this dataset was merged into the previous active dataset as a new assessment batch */
  isBatchUpdate?: boolean;
  athletes?: EnrichedAthlete[];
}

export interface AthleteContextValue {
  athletes: EnrichedAthlete[];
  loading: boolean;
  datasetMeta: DatasetMeta;
  savedDatasets: DatasetMeta[];
  setAthletes: Dispatch<SetStateAction<EnrichedAthlete[]>>;
  setDatasetMeta: Dispatch<SetStateAction<DatasetMeta>>;
  addDataset: (meta: Omit<DatasetMeta, "id">, athletes: EnrichedAthlete[]) => void;
  /**
   * Add a new assessment batch to existing athletes.
   * Matches athletes by name (normalised) and appends a new AssessmentRecord
   * to their assessmentHistory, enabling TTI longitudinal tracking.
   * Athletes in the new batch that don't match existing records are added fresh.
   */
  addBatchUpdate: (meta: Omit<DatasetMeta, "id">, newBatch: EnrichedAthlete[]) => void;
  loadDataset: (id: string) => void;
}

export const SEED_META: DatasetMeta = {
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

function persistDatasets(datasets: DatasetMeta[]) {
  try {
    const metas = datasets.map(({ athletes: _, ...m }) => m);
    localStorage.setItem(LS_DATASETS_KEY, JSON.stringify(metas));
    datasets.forEach((ds) => {
      if (ds.athletes && ds.id !== "seed") {
        localStorage.setItem(`pratibha_athletes_${ds.id}`, JSON.stringify(ds.athletes));
      }
    });
  } catch (e) {
    console.warn("[Pratibha] localStorage write failed:", e);
  }
}

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
  try { return localStorage.getItem(LS_ACTIVE_KEY); } catch { return null; }
}
function setPersistedActiveId(id: string) {
  try { localStorage.setItem(LS_ACTIVE_KEY, id); } catch {}
}

export const AthleteContext = createContext<AthleteContextValue>({
  athletes: [],
  loading: true,
  datasetMeta: SEED_META,
  savedDatasets: [SEED_META],
  setAthletes: () => {},
  setDatasetMeta: () => {},
  addDataset: () => {},
  addBatchUpdate: () => {},
  loadDataset: () => {},
});

export function useAthleteProviderValue() {
  const [seedAthletes, setSeedAthletes] = useState<EnrichedAthlete[]>([]);
  const [rawAthletes, setRawAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta>(SEED_META);
  const [savedDatasets, setSavedDatasets] = useState<DatasetMeta[]>([SEED_META]);

  useEffect(() => {
    const enriched = enrichAthletes(getSeedAthletes());
    const seedDs: DatasetMeta = { ...SEED_META, count: enriched.length, athletes: enriched };
    setSeedAthletes(enriched);

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

    setRawAthletes(enriched);
    setDatasetMeta({ ...SEED_META, count: enriched.length });
    setLoading(false);
  }, []);

  const addDataset = useCallback(
    (meta: Omit<DatasetMeta, "id">, newAthletes: EnrichedAthlete[]) => {
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
        const withoutSeed = prev.filter((d) => d.id !== "seed");
        const filtered = withoutSeed.filter((d) => d.name !== meta.name);
        const trimmed = [full, ...filtered].slice(0, MAX_DATASETS);
        const next = [prev.find((d) => d.id === "seed")!, ...trimmed];
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

  const addBatchUpdate = useCallback(
    (meta: Omit<DatasetMeta, "id">, newBatch: EnrichedAthlete[]) => {
      /**
       * Longitudinal batch merge algorithm:
       * 1. For each incoming athlete, try to match an existing athlete by normalised name.
       * 2. If matched: append a new AssessmentRecord to their history, update current metrics.
       * 3. If unmatched: add as a new athlete (first assessment).
       * 4. Re-enrich the full merged set so TTI and derived indices recalculate.
       */
      setRawAthletes((prev) => {
        const normName = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim();
        const existingMap = new Map<string, EnrichedAthlete>();
        prev.forEach((a) => existingMap.set(normName(a.name), a));

        const merged: EnrichedAthlete[] = [...prev];

        for (const incoming of newBatch) {
          const key = normName(incoming.name);
          const existing = existingMap.get(key);

          if (existing) {
            // Build a new AssessmentRecord from the incoming athlete's current metrics
            const newRecord: AssessmentRecord = {
              date: incoming.assessmentDate,
              verticalJump: incoming.verticalJump,
              broadJump: incoming.broadJump,
              sprint30m: incoming.sprint30m,
              run800m: incoming.run800m,
              shuttleRun: incoming.shuttleRun,
              footballThrow: incoming.footballThrow,
              compositeScore: incoming.compositeScore,
            };

            // Merge: keep existing history + add new record
            const prevHistory = existing.assessmentHistory ?? [];
            // Avoid duplicate dates
            const deduped = prevHistory.filter((r) => r.date !== newRecord.date);
            const updatedHistory = [...deduped, newRecord].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            const idx = merged.findIndex((a) => normName(a.name) === key);
            if (idx !== -1) {
              merged[idx] = {
                ...existing,
                // Update current metrics to latest batch
                verticalJump: incoming.verticalJump ?? existing.verticalJump,
                broadJump: incoming.broadJump ?? existing.broadJump,
                sprint30m: incoming.sprint30m ?? existing.sprint30m,
                run800m: incoming.run800m ?? existing.run800m,
                shuttleRun: incoming.shuttleRun ?? existing.shuttleRun,
                footballThrow: incoming.footballThrow ?? existing.footballThrow,
                height: incoming.height ?? existing.height,
                weight: incoming.weight ?? existing.weight,
                bmi: incoming.bmi ?? existing.bmi,
                assessmentDate: incoming.assessmentDate,
                assessmentHistory: updatedHistory,
              };
            }
          } else {
            // New athlete — just add them
            merged.push(incoming);
          }
        }

        // Re-enrich so TTI and CAPI recalculate with updated histories
        const reEnriched = enrichAthletes(merged);

        // Persist as a new dataset version
        const newId = `import_${Date.now()}`;
        const fullMeta: DatasetMeta = {
          ...meta,
          id: newId,
          isBatchUpdate: true,
          count: reEnriched.length,
          athletes: reEnriched,
        };
        setSavedDatasets((prev2) => {
          const withoutSeed = prev2.filter((d) => d.id !== "seed");
          const trimmed = [fullMeta, ...withoutSeed].slice(0, MAX_DATASETS);
          const next = [prev2.find((d) => d.id === "seed")!, ...trimmed];
          setTimeout(() => persistDatasets(next), 0);
          return next;
        });
        setDatasetMeta({ ...fullMeta, athletes: undefined });
        setPersistedActiveId(newId);

        toast({
          title: "Batch update merged",
          description: `${newBatch.length} athletes merged into ${reEnriched.length} total. Improvement trajectories recalculated.`,
        });

        return reEnriched;
      });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useMemo(
    () => ({
      athletes: rawAthletes,
      loading,
      datasetMeta,
      savedDatasets,
      setAthletes: setRawAthletes,
      setDatasetMeta,
      addDataset,
      addBatchUpdate,
      loadDataset,
    }),
    [rawAthletes, loading, datasetMeta, savedDatasets, addDataset, addBatchUpdate, loadDataset]
  );
}

export function useAthletes() {
  return useContext(AthleteContext);
}
