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
  const [rawAthletes, setRawAthletes] = useState<EnrichedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta>(SEED_META);

  useEffect(() => {
    const enriched = enrichAthletes(getSeedAthletes());
    setRawAthletes(enriched);
    setDatasetMeta({ ...SEED_META, count: enriched.length });
    setLoading(false);
  }, []);

  // addDataset: replaces current athletes with new import (no persistence)
  const addDataset = useCallback(
    (meta: Omit<DatasetMeta, "id">, newAthletes: EnrichedAthlete[]) => {
      const newId = `import_${Date.now()}`;
      const full: DatasetMeta = { ...meta, id: newId, count: newAthletes.length };
      setRawAthletes(newAthletes);
      setDatasetMeta(full);
    },
    []
  );

  const loadDataset = useCallback((_id: string) => {}, []);

  const addBatchUpdate = useCallback(
    (meta: Omit<DatasetMeta, "id">, newBatch: EnrichedAthlete[]) => {
      setRawAthletes((prev) => {
        const normName = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim();
        const existingMap = new Map<string, EnrichedAthlete>();
        prev.forEach((a) => existingMap.set(normName(a.name), a));

        const merged: EnrichedAthlete[] = [...prev];

        for (const incoming of newBatch) {
          const key = normName(incoming.name);
          const existing = existingMap.get(key);

          if (existing) {
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
            const prevHistory = existing.assessmentHistory ?? [];
            const deduped = prevHistory.filter((r) => r.date !== newRecord.date);
            const updatedHistory = [...deduped, newRecord].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const idx = merged.findIndex((a) => normName(a.name) === key);
            if (idx !== -1) {
              merged[idx] = {
                ...existing,
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
            merged.push(incoming);
          }
        }

        const reEnriched = enrichAthletes(merged);
        const newId = `import_${Date.now()}`;
        const fullMeta: DatasetMeta = { ...meta, id: newId, isBatchUpdate: true, count: reEnriched.length };
        setDatasetMeta(fullMeta);

        toast({
          title: "Batch update merged",
          description: `${newBatch.length} athletes merged into ${reEnriched.length} total. Improvement trajectories recalculated.`,
        });

        return reEnriched;
      });
    },
    []
  );

  return useMemo(
    () => ({
      athletes: rawAthletes,
      loading,
      datasetMeta,
      savedDatasets: [datasetMeta],
      setAthletes: setRawAthletes,
      setDatasetMeta,
      addDataset,
      addBatchUpdate,
      loadDataset,
    }),
    [rawAthletes, loading, datasetMeta, addDataset, addBatchUpdate, loadDataset]
  );
}

export function useAthletes() {
  return useContext(AthleteContext);
}
