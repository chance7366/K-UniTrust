import { riskStage } from "@/lib/competitiveness-analysis/financial-projection/risk-stage";
import { workspaceScope } from "@/lib/auth/local-workspace";
import type { TornadoItem } from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import type {
  ProjectionResult,
  ProjectionYearRow,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

const STORE_PREFIX = "k-unitrust.financial-projection.runs.v3.";
const PENDING_PREFIX = "k-unitrust.financial-projection.run-pending.v3.";
const IDB_NAME = "k-unitrust-fp-runs";
const IDB_STORE = "editions";
const IDB_VERSION = 1;

function fpKey(year: number): string {
  return `${workspaceScope()}:${year}`;
}

const memory = new Map<string, FpRunEdition>();
const publishedByYear = new Map<number, FpRunEdition>();

export function setFpPublishedRunEdition(
  year: number,
  edition: FpRunEdition | null,
): void {
  if (edition?.v === 3) publishedByYear.set(year, edition);
  else publishedByYear.delete(year);
}

export async function hydrateFpPublishedRunFromServer(
  year: number,
): Promise<FpRunEdition | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(`/api/financial-projection/runs?year=${year}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { edition?: FpRunEdition | null };
    if (json.edition?.v === 3 && json.edition.signature) {
      setFpPublishedRunEdition(year, json.edition);
      return json.edition;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearFpPublishedRunCache(): void {
  publishedByYear.clear();
}

export const FP_RUN_SCENARIOS: SimulationScenario[] = [
  "best",
  "base",
  "worst",
  "stress",
];

export const FP_GOAL_SEEK_DELAYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type FpGoalSeekStored = {
  cutPct: number;
  achieved: boolean;
  targetYear: number;
};

export type FpStoredSchoolRun = {
  code: string;
  operatingLossYear: number | null;
  cashDeficitYear: number | null;
  liquidityDepletionYear: number | null;
  tuitionByYear: Record<number, number>;
  rows: ProjectionYearRow[];
  tornado: TornadoItem[];
  goalSeekByDelay: Record<string, FpGoalSeekStored>;
};

export type FpHydratedRunRow = {
  univ: UnivBaseData;
  result: ProjectionResult;
  stage: ReturnType<typeof riskStage>;
};

export type FpRunEdition = {
  v: 3;
  signature: string;
  scenarios: Partial<Record<SimulationScenario, FpStoredSchoolRun[]>>;
};

export function fpUnisSignature(universities: UnivBaseData[]): string {
  let hash = universities.length * 2654435761;
  for (const univ of universities) {
    const code = univ.schoolCodeStd;
    for (let i = 0; i < code.length; i += 1) {
      hash = (hash * 31 + code.charCodeAt(i)) | 0;
    }
    hash = (hash + Math.round(univ.usableLiquidity)) | 0;
    hash = (hash + Math.round(univ.laborCostCagrPct * 1000)) | 0;
    hash = (hash + Math.round(univ.currentStudents)) | 0;
  }
  return `${universities.length}:${hash >>> 0}`;
}

export function fpRunSignature(opts: {
  uniSignature: string;
  cpiPct: number;
  params: SimulationParams;
}): string {
  const p = opts.params;
  return [
    opts.uniSignature,
    opts.cpiPct,
    p.scenario,
    p.tuitionIncreaseRatePct,
    p.subsidyChangeRatePct,
    p.quotaReductionRatePct,
    p.fixedCostCutRatePct,
    p.otherRevenueBoostPct,
    p.dropoutRateAddonPct,
    p.fillRateAdjPct,
  ].join("|");
}

export function storedToProjection(row: FpStoredSchoolRun): ProjectionResult {
  return {
    rows: row.rows ?? [],
    tuitionByYear: row.tuitionByYear ?? {},
    operatingLossYear: row.operatingLossYear,
    cashDeficitYear: row.cashDeficitYear,
    liquidityDepletionYear: row.liquidityDepletionYear,
    bankruptcyYear: row.liquidityDepletionYear,
    deathCrossYear: row.cashDeficitYear,
  };
}

export function hydrateFpBatchRows(
  cached: FpStoredSchoolRun[],
  universities: UnivBaseData[],
  analysisYear: number,
): FpHydratedRunRow[] | null {
  const byCode = new Map(universities.map((univ) => [univ.schoolCodeStd, univ]));
  if (cached.length !== universities.length) return null;
  const out: FpHydratedRunRow[] = [];
  for (const row of cached) {
    const univ = byCode.get(row.code);
    if (!univ) return null;
    const result = storedToProjection(row);
    out.push({
      univ,
      result,
      stage: riskStage(
        result.operatingLossYear,
        result.cashDeficitYear,
        result.liquidityDepletionYear,
        analysisYear,
      ),
    });
  }
  return out;
}

export function readFpSchoolRun(
  year: number,
  scenario: SimulationScenario,
  code: string,
  _signature?: string,
): FpStoredSchoolRun | null {
  const edition = readFpRunEdition(year);
  if (!edition) return null;
  return edition.scenarios[scenario]?.find((row) => row.code === code) ?? null;
}

function openFpRunDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function persistFpRunEditionIdb(
  year: number,
  edition: FpRunEdition,
  shouldWrite?: () => boolean,
) {
  if (typeof indexedDB === "undefined") return;
  if (shouldWrite && !shouldWrite()) return;
  const db = await openFpRunDb();
  try {
    if (shouldWrite && !shouldWrite()) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.objectStore(IDB_STORE).put(edition, fpKey(year));
    });
  } finally {
    db.close();
  }
}

export async function loadFpRunEditionIntoMemory(
  year: number,
): Promise<FpRunEdition | null> {
  const hit = memory.get(fpKey(year));
  if (hit?.v === 3 && hasProjectionRows(hit)) return hit;
  if (typeof indexedDB === "undefined") return readFpRunEdition(year);
  try {
    const db = await openFpRunDb();
    const loaded = await new Promise<FpRunEdition | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(fpKey(year));
      req.onsuccess = () => {
        const value = req.result as FpRunEdition | undefined;
        resolve(value?.v === 3 ? value : null);
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    if (loaded) {
      memory.set(fpKey(year), loaded);
      try {
        localStorage.removeItem(STORE_PREFIX + fpKey(year));
      } catch {
        /* quota / private mode */
      }
      return loaded;
    }
  } catch {
    /* fallback */
  }
  return readFpRunEdition(year);
}

function hasProjectionRows(edition: FpRunEdition): boolean {
  return FP_RUN_SCENARIOS.some((scenario) =>
    (edition.scenarios[scenario] ?? []).some((row) => (row.rows?.length ?? 0) > 0),
  );
}

export function fpRunYearHasResults(year: number): boolean {
  const edition = readFpRunEdition(year);
  return Boolean(edition && hasProjectionRows(edition));
}

export function fpStoredRunSignature(year: number): string | null {
  return readFpRunEdition(year)?.signature ?? null;
}

export function readFpRunEdition(year: number): FpRunEdition | null {
  const hit = memory.get(fpKey(year));
  if (hit?.v === 3) return hit;
  if (typeof window === "undefined") {
    return publishedByYear.get(year) ?? null;
  }
  try {
    const raw = localStorage.getItem(STORE_PREFIX + fpKey(year));
    if (raw) {
      const parsed = JSON.parse(raw) as FpRunEdition;
      if (parsed?.v === 3 && parsed.signature) {
        memory.set(fpKey(year), parsed);
        return parsed;
      }
    }
  } catch {
    /* fallback */
  }
  return publishedByYear.get(year) ?? null;
}

export function writeFpRunEdition(
  year: number,
  edition: FpRunEdition,
  persist = true,
) {
  memory.set(fpKey(year), edition);
  if (!persist || typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORE_PREFIX + fpKey(year));
  } catch {
    /* quota / private mode */
  }
}

export function readFpRunScenario(
  year: number,
  scenario: SimulationScenario,
  _signature?: string,
): FpStoredSchoolRun[] | null {
  const edition = readFpRunEdition(year);
  if (!edition) return null;
  const rows = edition.scenarios[scenario];
  return rows?.length ? rows : null;
}

export function isFpRunEditionComplete(
  year: number,
  signature: string,
  univCount: number,
): boolean {
  if (univCount <= 0) return false;
  const edition = readFpRunEdition(year);
  if (!edition || edition.v !== 3 || edition.signature !== signature) return false;
  return FP_RUN_SCENARIOS.every((scenario) => {
    const rows = edition.scenarios[scenario] ?? [];
    if (rows.length !== univCount) return false;
    return rows.every(
      (row) =>
        (row.rows?.length ?? 0) > 0 &&
        row.tuitionByYear != null &&
        row.tornado?.length > 0 &&
        row.goalSeekByDelay != null,
    );
  });
}

export function clearFpRunEdition(year: number) {
  memory.delete(fpKey(year));
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORE_PREFIX + fpKey(year));
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.removeItem(PENDING_PREFIX + fpKey(year));
  } catch {
    /* private mode */
  }
  if (typeof indexedDB === "undefined") return;
  void openFpRunDb()
    .then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, "readwrite");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error("IndexedDB delete failed"));
          };
          tx.objectStore(IDB_STORE).delete(fpKey(year));
        }),
    )
    .catch(() => {});
}

export function markFpRunPending(year: number, signature: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PREFIX + fpKey(year), signature);
}

export function readFpRunPending(year: number): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_PREFIX + fpKey(year));
}

export function clearFpRunPending(year: number) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PREFIX + fpKey(year));
}
