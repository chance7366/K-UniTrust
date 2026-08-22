import { workspaceScope } from "@/lib/auth/local-workspace";
import type { EditionTrendPoint } from "@/lib/competitiveness-analysis/editions-db";
import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

const IDB_NAME = "k-unitrust-ca-workspace";
const IDB_STORE = "editions";
const IDB_VERSION = 1;

export type CaUserWeights = Pick<
  CompetitivenessSettings,
  | "categoryWeights"
  | "indicatorWeights"
  | "enabledIndicators"
  | "indicatorYears"
  | "indicatorPercentileLowerTailPct"
  | "indicatorPercentileUpperTailPct"
>;

export type CaUserResults = {
  step1RawResults: UniversityRawResult[] | null;
  step1At: string | null;
  step2IndexResults: UniversityRunResult[] | null;
  step2At: string | null;
  runResults: UniversityRunResult[] | null;
  lastRunAt: string | null;
};

export type CaUserWorkspace = {
  v: 1;
  scope: "admin" | "user";
  analysisYear: number;
  weights: CaUserWeights;
  settingsSavedAt: string | null;
  runSettingsSavedAt: string | null;
  settingsAtRun: CompetitivenessSettings | null;
  results: CaUserResults;
};

function workspaceKey(year: number): string {
  return `${workspaceScope()}:${year}`;
}

export function extractCaWeights(
  settings: CompetitivenessSettings,
): CaUserWeights {
  return {
    categoryWeights: settings.categoryWeights,
    indicatorWeights: settings.indicatorWeights,
    enabledIndicators: settings.enabledIndicators,
    indicatorYears: settings.indicatorYears,
    indicatorPercentileLowerTailPct: settings.indicatorPercentileLowerTailPct,
    indicatorPercentileUpperTailPct: settings.indicatorPercentileUpperTailPct,
  };
}

export function applyCaWeights(
  settings: CompetitivenessSettings,
  weights: CaUserWeights,
): CompetitivenessSettings {
  return { ...settings, ...weights };
}

function emptyResults(): CaUserResults {
  return {
    step1RawResults: null,
    step1At: null,
    step2IndexResults: null,
    step2At: null,
    runResults: null,
    lastRunAt: null,
  };
}

function openDb(): Promise<IDBDatabase> {
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

export async function readCaUserWorkspace(
  year: number,
): Promise<CaUserWorkspace | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const value = await new Promise<CaUserWorkspace | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(workspaceKey(year));
      req.onsuccess = () => {
        const row = req.result as CaUserWorkspace | undefined;
        resolve(row?.v === 1 ? row : null);
      };
      req.onerror = () =>
        reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

export async function writeCaUserWorkspace(
  year: number,
  patch: {
    weights?: CaUserWeights;
    settingsSavedAt?: string | null;
    runSettingsSavedAt?: string | null;
    settingsAtRun?: CompetitivenessSettings | null;
    results?: Partial<CaUserResults>;
  },
): Promise<CaUserWorkspace | null> {
  if (typeof indexedDB === "undefined") return null;
  const prev = await readCaUserWorkspace(year);
  const weights = patch.weights ?? prev?.weights;
  if (!weights) return null;
  const next: CaUserWorkspace = {
    v: 1,
    scope: workspaceScope(),
    analysisYear: year,
    weights,
    settingsSavedAt:
      patch.settingsSavedAt !== undefined
        ? patch.settingsSavedAt
        : (prev?.settingsSavedAt ?? null),
    runSettingsSavedAt:
      patch.runSettingsSavedAt !== undefined
        ? patch.runSettingsSavedAt
        : (prev?.runSettingsSavedAt ?? null),
    settingsAtRun:
      patch.settingsAtRun !== undefined
        ? patch.settingsAtRun
        : (prev?.settingsAtRun ?? null),
    results: { ...(prev?.results ?? emptyResults()), ...patch.results },
  };
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.objectStore(IDB_STORE).put(next, workspaceKey(year));
    });
  } finally {
    db.close();
  }
  return next;
}

export async function loadLocalEditionTrendSeries(): Promise<
  EditionTrendPoint[]
> {
  const local = await loadEditionTrendSeriesFromIndexedDb();
  if (typeof fetch === "undefined") return local;

  try {
    const res = await fetch("/api/competitiveness-analysis/trend");
    if (!res.ok) return local;
    const data = (await res.json()) as { series?: EditionTrendPoint[] };
    const server = data.series ?? [];
    if (!server.length) return local;

    const byYear = new Map<number, EditionTrendPoint>();
    for (const point of server) {
      byYear.set(point.analysisYear, point);
    }
    for (const point of local) {
      byYear.set(point.analysisYear, point);
    }
    return [...byYear.values()].sort((a, b) => a.analysisYear - b.analysisYear);
  } catch {
    return local;
  }
}

async function loadEditionTrendSeriesFromIndexedDb(): Promise<
  EditionTrendPoint[]
> {
  if (typeof indexedDB === "undefined") return [];
  const scope = workspaceScope();
  try {
    const db = await openDb();
    const points = await new Promise<EditionTrendPoint[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result as CaUserWorkspace[]).filter(
          (row) =>
            row?.v === 1 &&
            row.scope === scope &&
            Boolean(row.results?.runResults?.length) &&
            row.settingsAtRun,
        );
        resolve(
          rows
            .map((row) => ({
              analysisYear: row.analysisYear,
              lastRunAt: row.results.lastRunAt,
              runResults: row.results.runResults ?? [],
              settings: row.settingsAtRun as CompetitivenessSettings,
              step1RawResults: row.results.step1RawResults,
            }))
            .sort((a, b) => a.analysisYear - b.analysisYear),
        );
      };
      req.onerror = () =>
        reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    return points;
  } catch {
    return [];
  }
}
