import {
  BASELINE_INDICATOR_CATALOG,
  MOCK_CPI_FORWARD_ASSUMPTION_PCT,
  MOCK_PROJECTION_TARGETS,
  MOCK_UNIVERSITIES,
  type BaselineIndicatorPick,
  type ProjectionTargetRow,
} from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import { workspaceScope } from "@/lib/auth/local-workspace";
import { scenarioParams } from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import type {
  SimulationParams,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import {
  FP_DEFAULT_ANALYSIS_YEAR,
  isFpAnalysisYear,
} from "@/lib/competitiveness-analysis/financial-projection/years";

const STORE_KEY_PREFIX = "k-unitrust.financial-projection.editions.v1.";
const UNI_KEY_PREFIX = "k-unitrust.financial-projection.unis.v1.";
const LEGACY_KEY = "k-unitrust.financial-projection.session";

const META_WRITE_MS = 250;
const UNI_WRITE_MS = 600;

let memoryStore: FinancialProjectionStore | null = null;
let memoryStoreScope: string | null = null;
let metaWriteTimer: ReturnType<typeof setTimeout> | null = null;
const uniWriteTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastUniRef = new Map<string, UnivBaseData[] | undefined>();

export type FinancialProjectionSession = {
  analysisYear: number;
  targets: ProjectionTargetRow[];
  universities: UnivBaseData[];
  indicators: BaselineIndicatorPick[];
  baselineReady: boolean;
  hasRun: boolean;
  lastRunAt: string | null;
  cpiPct: number;
  params: SimulationParams;
  lookupCode: string;
};

export type FinancialProjectionStore = {
  currentAnalysisYear: number;
  editions: Record<string, FinancialProjectionSession>;
};

function yearKey(year: number): string {
  return String(year);
}

function withCatalogLabels(
  items: BaselineIndicatorPick[],
): BaselineIndicatorPick[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return BASELINE_INDICATOR_CATALOG.map((catalog) => {
    const existing = byId.get(catalog.id);
    if (!existing) return catalog;
    return {
      ...existing,
      label: catalog.label,
      group: catalog.group,
      source: catalog.source,
      required: catalog.required,
      selected: catalog.required ? true : existing.selected,
    };
  });
}

export function defaultFinancialProjectionSession(
  analysisYear = FP_DEFAULT_ANALYSIS_YEAR,
): FinancialProjectionSession {
  return {
    analysisYear,
    targets: MOCK_PROJECTION_TARGETS,
    universities: [],
    indicators: BASELINE_INDICATOR_CATALOG,
    baselineReady: false,
    hasRun: false,
    lastRunAt: null,
    cpiPct: MOCK_CPI_FORWARD_ASSUMPTION_PCT,
    params: scenarioParams("base", MOCK_CPI_FORWARD_ASSUMPTION_PCT),
    lookupCode: MOCK_UNIVERSITIES[0]!.schoolCodeStd,
  };
}

function storeKey(): string {
  return `${STORE_KEY_PREFIX}${workspaceScope()}`;
}

function uniStorageKey(year: number): string {
  return `${UNI_KEY_PREFIX}${workspaceScope()}.${year}`;
}

function readUnisFromStorage(year: number): UnivBaseData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(uniStorageKey(year));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UnivBaseData[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scheduleUniWrite(year: number, universities: UnivBaseData[]) {
  if (typeof window === "undefined") return;
  if (!universities.length) return;
  const key = yearKey(year);
  const prev = uniWriteTimers.get(key);
  if (prev) clearTimeout(prev);
  uniWriteTimers.set(
    key,
    setTimeout(() => {
      uniWriteTimers.delete(key);
      try {
        localStorage.setItem(uniStorageKey(year), JSON.stringify(universities));
      } catch {
        /* quota */
      }
    }, UNI_WRITE_MS),
  );
}

function stripUniversities(
  session: FinancialProjectionSession,
): Omit<FinancialProjectionSession, "universities"> {
  const { universities: _drop, ...meta } = session;
  return meta;
}

function scheduleMetaWrite(store: FinancialProjectionStore) {
  if (typeof window === "undefined") return;
  if (metaWriteTimer) clearTimeout(metaWriteTimer);
  metaWriteTimer = setTimeout(() => {
    metaWriteTimer = null;
    const payload: FinancialProjectionStore = {
      currentAnalysisYear: store.currentAnalysisYear,
      editions: {},
    };
    for (const [key, edition] of Object.entries(store.editions)) {
      payload.editions[key] = stripUniversities(
        edition,
      ) as FinancialProjectionSession;
    }
    try {
      localStorage.setItem(storeKey(), JSON.stringify(payload));
    } catch {
      /* quota */
    }
  }, META_WRITE_MS);
}

function emptyStore(): FinancialProjectionStore {
  const year = FP_DEFAULT_ANALYSIS_YEAR;
  return {
    currentAnalysisYear: year,
    editions: { [yearKey(year)]: defaultFinancialProjectionSession(year) },
  };
}

function normalizeSession(
  parsed: Partial<FinancialProjectionSession> | undefined,
  analysisYear: number,
  fallback: FinancialProjectionSession,
  loadUnis = true,
): FinancialProjectionSession {
  const key = yearKey(analysisYear);
  const cached = lastUniRef.get(key);
  const inline = parsed?.universities ?? [];
  const stored =
    cached?.length
      ? cached
      : loadUnis
        ? inline.length
          ? inline
          : readUnisFromStorage(analysisYear)
        : [];
  const universities = (stored.length ? stored : fallback.universities).filter(
    (univ) => (univ.analysisYear ?? analysisYear) === analysisYear,
  );
  if (universities.length) lastUniRef.set(key, universities);
  const baselineReady =
    Boolean(parsed?.baselineReady) && universities.length > 0;
  return {
    ...fallback,
    ...parsed,
    analysisYear,
    targets: parsed?.targets ?? fallback.targets,
    universities,
    indicators: withCatalogLabels(parsed?.indicators ?? fallback.indicators),
    baselineReady,
    hasRun: Boolean(parsed?.hasRun) && baselineReady,
    lastRunAt: baselineReady ? (parsed?.lastRunAt ?? null) : null,
    params: {
      ...fallback.params,
      ...parsed?.params,
      otherRevenueBoostPct:
        parsed?.params?.otherRevenueBoostPct ??
        fallback.params.otherRevenueBoostPct,
    },
  };
}

function migrateLegacy(): FinancialProjectionStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FinancialProjectionSession>;
    const year = isFpAnalysisYear(parsed.analysisYear ?? NaN)
      ? parsed.analysisYear!
      : FP_DEFAULT_ANALYSIS_YEAR;
    const edition = normalizeSession(
      parsed,
      year,
      defaultFinancialProjectionSession(year),
    );
    return {
      currentAnalysisYear: year,
      editions: { [yearKey(year)]: edition },
    };
  } catch {
    return null;
  }
}

export function readFinancialProjectionStore(): FinancialProjectionStore {
  const scope = workspaceScope();
  if (memoryStore && memoryStoreScope === scope) return memoryStore;
  memoryStoreScope = scope;
  const fallback = emptyStore();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storeKey());
    if (!raw) {
      const migrated = migrateLegacy();
      if (migrated) {
        memoryStore = migrated;
        writeFinancialProjectionStore(migrated);
        sessionStorage.removeItem(LEGACY_KEY);
        return migrated;
      }
      memoryStore = fallback;
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<FinancialProjectionStore>;
    const editions: Record<string, FinancialProjectionSession> = {};
    const currentHint = isFpAnalysisYear(parsed.currentAnalysisYear ?? NaN)
      ? parsed.currentAnalysisYear!
      : FP_DEFAULT_ANALYSIS_YEAR;
    for (const [key, value] of Object.entries(parsed.editions ?? {})) {
      const year = Number(key);
      if (!isFpAnalysisYear(year) || !value) continue;
      editions[key] = normalizeSession(
        value,
        year,
        defaultFinancialProjectionSession(year),
        year === currentHint,
      );
    }
    const current = currentHint;
    if (!editions[yearKey(current)]) {
      editions[yearKey(current)] = defaultFinancialProjectionSession(current);
    }
    memoryStore = { currentAnalysisYear: current, editions };
    scheduleMetaWrite(memoryStore);
    return memoryStore;
  } catch {
    memoryStore = fallback;
    return fallback;
  }
}

export function writeFinancialProjectionStore(store: FinancialProjectionStore) {
  memoryStore = store;
  memoryStoreScope = workspaceScope();
  scheduleMetaWrite(store);
  for (const [key, edition] of Object.entries(store.editions)) {
    const year = Number(key);
    if (!isFpAnalysisYear(year)) continue;
    if (lastUniRef.get(key) === edition.universities) continue;
    lastUniRef.set(key, edition.universities);
    scheduleUniWrite(year, edition.universities);
  }
}

export function readFinancialProjectionEdition(
  analysisYear: number,
): FinancialProjectionSession {
  const store = readFinancialProjectionStore();
  const fallback = defaultFinancialProjectionSession(analysisYear);
  const edition = store.editions[yearKey(analysisYear)] ?? fallback;
  if (edition.universities.length) return edition;
  const stored = readUnisFromStorage(analysisYear).filter(
    (univ) => (univ.analysisYear ?? analysisYear) === analysisYear,
  );
  if (!stored.length) return edition;
  const next: FinancialProjectionSession = {
    ...edition,
    universities: stored,
    baselineReady: edition.baselineReady && stored.length > 0,
    hasRun: Boolean(edition.hasRun) && stored.length > 0,
  };
  lastUniRef.set(yearKey(analysisYear), stored);
  store.editions[yearKey(analysisYear)] = next;
  return next;
}

export function upsertFinancialProjectionEdition(
  session: FinancialProjectionSession,
) {
  const store = readFinancialProjectionStore();
  store.currentAnalysisYear = session.analysisYear;
  store.editions[yearKey(session.analysisYear)] = session;
  writeFinancialProjectionStore(store);
}

export function listStoredFpAnalysisYears(): number[] {
  return Object.keys(readFinancialProjectionStore().editions)
    .map(Number)
    .filter(isFpAnalysisYear)
    .sort((a, b) => b - a);
}

export function copyFpEditionTemplate(
  fromYear: number,
  toYear: number,
): FinancialProjectionSession {
  const source = readFinancialProjectionEdition(fromYear);
  return {
    ...defaultFinancialProjectionSession(toYear),
    indicators: source.indicators,
    cpiPct: source.cpiPct,
    params: {
      ...defaultFinancialProjectionSession(toYear).params,
      ...source.params,
      otherRevenueBoostPct: source.params.otherRevenueBoostPct ?? 0,
    },
  };
}

/** 레거시 단일 세션 읽기 — 현재 분석연도 에디션 */
export function readFinancialProjectionSession(): FinancialProjectionSession {
  const store = readFinancialProjectionStore();
  return readFinancialProjectionEdition(store.currentAnalysisYear);
}

export function writeFinancialProjectionSession(
  state: FinancialProjectionSession,
) {
  upsertFinancialProjectionEdition(state);
}
