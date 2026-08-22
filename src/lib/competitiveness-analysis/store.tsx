"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_CATEGORY_WEIGHTS,
  getCompetitivenessCategories,
  getCompetitivenessIndicators,
  type CompetitivenessFinanceGroupId,
  type CompetitivenessIndicatorDef,
} from "@/lib/analysis/competitiveness-indicators";

import {
  DEFAULT_ANALYSIS_POLICY,
  type AnalysisPolicy,
} from "@/lib/competitiveness-analysis/analysis-policy";
import { buildAnalysisGuidelines } from "@/lib/competitiveness-analysis/build-analysis-guidelines";
import type { EditionSummary } from "@/lib/competitiveness-analysis/editions-db";
import { normalizeIndicatorYearsRecord } from "@/lib/competitiveness-analysis/parse-indicator-year";
import { isSettingsStaleSinceRun } from "@/lib/competitiveness-analysis/settings-stale";
import {
  DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT,
  DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";
import { resolveStep12IndicatorIds } from "@/lib/competitiveness-analysis/analysis-policy";

import {
  MOCK_TARGET_UNIVERSITIES,
  type TargetUniversityRow,
} from "@/lib/competitiveness-analysis/config";

import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";
import {
  formatWeightValidationError,
  validateCompetitivenessWeights,
  type WeightValidationIssue,
} from "@/lib/competitiveness-analysis/validate-competitiveness-weights";
import type { PostRunValidationReport } from "@/lib/competitiveness-analysis/post-run-validation/types";

import { PostRunValidationDialog } from "@/components/analysis/competitiveness-analysis/PostRunValidationDialog";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import type { AccessRole } from "@/lib/auth/access";
import {
  applyCaWeights,
  extractCaWeights,
  readCaUserWorkspace,
  writeCaUserWorkspace,
} from "@/lib/competitiveness-analysis/user-workspace";

export type {
  CompetitivenessSettings,
  RawIndicatorCell,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";
export type { EditionSummary } from "@/lib/competitiveness-analysis/editions-db";

const EDITION_FETCH_TIMEOUT_MS = 45_000;
const SESSION_ANALYSIS_YEAR_KEY = "competitiveness-analysis-year";

async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = EDITION_FETCH_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `요청 실패 (${res.status})`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "서버 응답 시간이 초과되었습니다. 개발 서버(npm run dev)가 실행 중인지 확인하세요.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function readStoredAnalysisYear(): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_ANALYSIS_YEAR_KEY);
  if (!raw) return null;
  const year = Number(raw);
  return Number.isFinite(year) ? year : null;
}

function writeStoredAnalysisYear(year: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_ANALYSIS_YEAR_KEY, String(year));
}

function readUrlAnalysisYear(): number | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("year");
  if (!raw) return null;
  const year = Number(raw);
  return Number.isInteger(year) && year > 0 ? year : null;
}

function sameTargetUniversities(
  a: TargetUniversityRow[],
  b: TargetUniversityRow[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, i) => {
    const other = b[i];
    return (
      other != null &&
      row.schoolCodeStd === other.schoolCodeStd &&
      row.schoolName === other.schoolName &&
      row.estb === other.estb &&
      row.schoolDivision === other.schoolDivision &&
      row.schoolKind === other.schoolKind &&
      row.region === other.region &&
      row.enrolledTotal === other.enrolledTotal &&
      row.studentAidRestrict === other.studentAidRestrict &&
      row.noSettlement === other.noSettlement &&
      row.crisis === other.crisis &&
      row.noAccreditation === other.noAccreditation &&
      row.provisionalBoard === other.provisionalBoard &&
      row.fundShortage === other.fundShortage
    );
  });
}

type IndicatorYearsResponse = {
  yearsByTab: Record<string, string[]>;
};

type EditionFullResponse = {
  edition?: {
    analysisYear: number;
    settings: CompetitivenessSettings;
    results: {
      step1RawResults: UniversityRawResult[] | null;
      step1At: string | null;
      step2IndexResults: UniversityRunResult[] | null;
      step2At: string | null;
      runResults: UniversityRunResult[] | null;
      lastRunAt: string | null;
    };
    settingsSavedAt: string | null;
    lastRunAt: string | null;
  };
};

type StoreValue = {
  analysisYear: number;
  editions: EditionSummary[];
  editionsLoading: boolean;
  editionsLoadError: string | null;
  settings: CompetitivenessSettings;
  yearsByTab: Record<string, string[]>;
  indicators: CompetitivenessIndicatorDef[];
  rawResults: UniversityRawResult[] | null;
  runResults: UniversityRunResult[] | null;
  lastRunAt: string | null;
  runPending: boolean;
  runError: string | null;
  step1RawResults: UniversityRawResult[] | null;
  step1LastRunAt: string | null;
  step1Pending: boolean;
  step1Error: string | null;
  step2IndexResults: UniversityRunResult[] | null;
  step2LastRunAt: string | null;
  step2Pending: boolean;
  step2Error: string | null;
  weightValidationIssues: WeightValidationIssue[];
  weightsValid: boolean;
  analysisGuidelines: string;
  step12IndicatorIds: string[];
  settingsSavePending: boolean;
  settingsSaveError: string | null;
  settingsStale: boolean;
  generateFundShortage: () => Promise<{ count: number; fundSecureYear: string }>;
  updateCategoryWeight: (id: CompetitivenessFinanceGroupId, v: number) => void;
  updateIndicatorWeight: (financeTabId: string, v: number) => void;
  setEnabledIndicator: (financeTabId: string, enabled: boolean) => void;
  setIndicatorYear: (financeTabId: string, year: string) => void;
  updateIndicatorPercentileLowerTail: (financeTabId: string, v: number) => void;
  updateIndicatorPercentileUpperTail: (financeTabId: string, v: number) => void;
  updateAnalysisPolicy: (patch: Partial<AnalysisPolicy>) => void;
  setTargetUniversities: (rows: TargetUniversityRow[]) => void;
  reloadTargetUniversitiesFromDb: () => Promise<{ rowCount: number } | null>;
  setAnalysisYear: (year: number) => Promise<void>;
  createAnalysisYear: (year: number) => Promise<number | null>;
  refreshEditions: () => Promise<void>;
  saveSettings: () => Promise<void>;
  runStep1: () => Promise<void>;
  runStep2: () => Promise<void>;
  runAnalysis: () => Promise<void>;
  postRunValidationOpen: boolean;
  postRunValidationReport: PostRunValidationReport | null;
  postRunValidationPending: boolean;
  dismissPostRunValidation: () => void;
};

function buildDefaultSettings(
  indicators: CompetitivenessIndicatorDef[],
): CompetitivenessSettings {
  return {
    targetUniversities: [...MOCK_TARGET_UNIVERSITIES],
    categoryWeights: { ...DEFAULT_CATEGORY_WEIGHTS },
    indicatorWeights: Object.fromEntries(
      indicators.map((i) => [i.financeTabId, i.defaultWeightPct]),
    ),
    enabledIndicators: Object.fromEntries(
      indicators.map((i) => [i.financeTabId, true]),
    ),
    indicatorYears: Object.fromEntries(
      indicators.map((i) => [i.financeTabId, i.defaultYearLabel]),
    ),
    indicatorPercentileLowerTailPct: Object.fromEntries(
      indicators.map((i) => [
        i.financeTabId,
        DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT,
      ]),
    ),
    indicatorPercentileUpperTailPct: Object.fromEntries(
      indicators.map((i) => [
        i.financeTabId,
        DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT,
      ]),
    ),
    analysisPolicy: { ...DEFAULT_ANALYSIS_POLICY },
  };
}

function normalizeSettings(
  parsed: Partial<CompetitivenessSettings & { guidelines?: string }>,
  indicators: CompetitivenessIndicatorDef[],
): CompetitivenessSettings {
  const base = buildDefaultSettings(indicators);
  const { guidelines: _legacyGuidelines, ...rest } = parsed;
  return {
    ...base,
    ...rest,
    categoryWeights: {
      ...DEFAULT_CATEGORY_WEIGHTS,
      ...parsed.categoryWeights,
    },
    analysisPolicy: {
      ...DEFAULT_ANALYSIS_POLICY,
      ...parsed.analysisPolicy,
      lowerIsBetterIndicatorIds:
        parsed.analysisPolicy?.lowerIsBetterIndicatorIds?.length
          ? parsed.analysisPolicy.lowerIsBetterIndicatorIds
          : DEFAULT_ANALYSIS_POLICY.lowerIsBetterIndicatorIds,
    },
    indicatorPercentileLowerTailPct: {
      ...base.indicatorPercentileLowerTailPct,
      ...parsed.indicatorPercentileLowerTailPct,
    },
    indicatorPercentileUpperTailPct: {
      ...base.indicatorPercentileUpperTailPct,
      ...parsed.indicatorPercentileUpperTailPct,
    },
    targetUniversities: (parsed.targetUniversities ?? base.targetUniversities).map(
      (row) => ({
        ...row,
        fundShortage: row.fundShortage ?? "",
      }),
    ),
    indicatorYears: normalizeIndicatorYearsRecord({
      ...base.indicatorYears,
      ...parsed.indicatorYears,
    }),
  };
}

function applyEditionToState(
  edition: NonNullable<EditionFullResponse["edition"]>,
  indicators: CompetitivenessIndicatorDef[],
) {
  return {
    settings: normalizeSettings(edition.settings, indicators),
    rawResults: edition.results.step1RawResults,
    runResults: edition.results.runResults,
    lastRunAt: edition.results.lastRunAt,
    step1RawResults: edition.results.step1RawResults,
    step1LastRunAt: edition.results.step1At,
    step2IndexResults: edition.results.step2IndexResults,
    step2LastRunAt: edition.results.step2At,
  };
}

type EditionRunState = ReturnType<typeof applyEditionToState>;

function resolveEditionRunState(
  server: EditionRunState,
  local: Awaited<ReturnType<typeof readCaUserWorkspace>>,
  role: AccessRole | null | undefined,
): EditionRunState {
  if (role === "user" && local?.results?.runResults?.length) {
    return {
      ...server,
      rawResults: local.results.step1RawResults,
      runResults: local.results.runResults,
      lastRunAt: local.results.lastRunAt,
      step1RawResults: local.results.step1RawResults,
      step1LastRunAt: local.results.step1At,
      step2IndexResults: local.results.step2IndexResults,
      step2LastRunAt: local.results.step2At,
    };
  }
  return server;
}

/** 로그아웃 시 클라이언트 캐시 초기화 */
export function resetCompetitivenessClientCache(): void {
  editionClientCache = null;
}

type EditionClientCache = {
  analysisYear: number;
  editions: EditionSummary[];
  settings: CompetitivenessSettings;
  rawResults: UniversityRawResult[] | null;
  runResults: UniversityRunResult[] | null;
  lastRunAt: string | null;
  step1RawResults: UniversityRawResult[] | null;
  step1LastRunAt: string | null;
  step2IndexResults: UniversityRunResult[] | null;
  step2LastRunAt: string | null;
};

/** 레이아웃 언마운트 후에도 같은 세션에서 저장된 결과를 즉시 복원 */
let editionClientCache: EditionClientCache | null = null;

const CompetitivenessContext = createContext<StoreValue | null>(null);

export function CompetitivenessSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const accessRole = useAccessRole();
  const indicators = useMemo(() => getCompetitivenessIndicators(), []);
  const defaultYear = new Date().getFullYear();
  const cached = editionClientCache;

  const [analysisYear, setAnalysisYearState] = useState(
    cached?.analysisYear ?? defaultYear,
  );
  const [editions, setEditions] = useState<EditionSummary[]>(
    cached?.editions ?? [],
  );
  const [editionsLoading, setEditionsLoading] = useState(!cached);
  const [editionsLoadError, setEditionsLoadError] = useState<string | null>(
    null,
  );
  const [settings, setSettings] = useState<CompetitivenessSettings>(() =>
    cached?.settings ?? buildDefaultSettings(indicators),
  );
  const [yearsByTab, setYearsByTab] = useState<Record<string, string[]>>({});
  const [rawResults, setRawResults] = useState<UniversityRawResult[] | null>(
    cached?.rawResults ?? null,
  );
  const [runResults, setRunResults] = useState<UniversityRunResult[] | null>(
    cached?.runResults ?? null,
  );
  const [lastRunAt, setLastRunAt] = useState<string | null>(
    cached?.lastRunAt ?? null,
  );
  const [runPending, setRunPending] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [postRunValidationOpen, setPostRunValidationOpen] = useState(false);
  const [postRunValidationReport, setPostRunValidationReport] =
    useState<PostRunValidationReport | null>(null);
  const [postRunValidationPending, setPostRunValidationPending] =
    useState(false);
  const [step1RawResults, setStep1RawResults] = useState<
    UniversityRawResult[] | null
  >(cached?.step1RawResults ?? null);
  const [step1LastRunAt, setStep1LastRunAt] = useState<string | null>(
    cached?.step1LastRunAt ?? null,
  );
  const [step1Pending, setStep1Pending] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2IndexResults, setStep2IndexResults] = useState<
    UniversityRunResult[] | null
  >(cached?.step2IndexResults ?? null);
  const [step2LastRunAt, setStep2LastRunAt] = useState<string | null>(
    cached?.step2LastRunAt ?? null,
  );
  const [step2Pending, setStep2Pending] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [settingsSavePending, setSettingsSavePending] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(
    null,
  );
  const [localMeta, setLocalMeta] = useState<{
    settingsSavedAt: string | null;
    runSettingsSavedAt: string | null;
    hasRunResults: boolean;
  }>({
    settingsSavedAt: null,
    runSettingsSavedAt: null,
    hasRunResults: Boolean(cached?.runResults?.length),
  });

  const weightValidationIssues = useMemo(
    () => validateCompetitivenessWeights(settings, indicators),
    [settings, indicators],
  );
  const weightsValid = weightValidationIssues.length === 0;
  const analysisGuidelines = useMemo(
    () => buildAnalysisGuidelines(settings, indicators),
    [settings, indicators],
  );
  const step12IndicatorIds = useMemo(
    () => resolveStep12IndicatorIds(settings, indicators),
    [settings, indicators],
  );

  const settingsStale = useMemo(() => {
    return isSettingsStaleSinceRun(
      localMeta.hasRunResults,
      localMeta.settingsSavedAt,
      localMeta.runSettingsSavedAt,
    );
  }, [localMeta]);

  const refreshEditions = useCallback(async () => {
    const data = await fetchJsonWithTimeout<{ editions?: EditionSummary[] }>(
      "/api/competitiveness-analysis/editions",
    );
    setEditions(data.editions ?? []);
  }, []);

  const loadEdition = useCallback(
    async (year: number) => {
      const data = await fetchJsonWithTimeout<EditionFullResponse>(
        `/api/competitiveness-analysis/editions/${year}`,
      );
      if (!data.edition) {
        throw new Error("분석연도 데이터가 비어 있습니다.");
      }
      const applied = applyEditionToState(data.edition, indicators);
      const local = await readCaUserWorkspace(year);
      const settings = local?.weights
        ? applyCaWeights(applied.settings, local.weights)
        : applied.settings;
      const resolved = resolveEditionRunState(applied, local, accessRole);
      writeStoredAnalysisYear(year);
      setAnalysisYearState(year);
      setSettings(settings);
      setRawResults(resolved.rawResults);
      setRunResults(resolved.runResults);
      setLastRunAt(resolved.lastRunAt);
      setStep1RawResults(resolved.step1RawResults);
      setStep1LastRunAt(resolved.step1LastRunAt);
      setStep2IndexResults(resolved.step2IndexResults);
      setStep2LastRunAt(resolved.step2LastRunAt);
      setLocalMeta({
        settingsSavedAt: local?.settingsSavedAt ?? null,
        runSettingsSavedAt: local?.runSettingsSavedAt ?? null,
        hasRunResults: Boolean(resolved.runResults?.length),
      });
    },
    [accessRole, indicators],
  );

  const persistResults = useCallback(
    async (
      year: number,
      payload: {
        step1RawResults?: UniversityRawResult[] | null;
        step1At?: string | null;
        step2IndexResults?: UniversityRunResult[] | null;
        step2At?: string | null;
        runResults?: UniversityRunResult[] | null;
        lastRunAt?: string | null;
        settingsAtRun?: CompetitivenessSettings;
      },
    ) => {
      const saved = await writeCaUserWorkspace(year, {
        weights: extractCaWeights(payload.settingsAtRun ?? settings),
        runSettingsSavedAt: payload.lastRunAt ?? new Date().toISOString(),
        settingsAtRun: payload.settingsAtRun ?? settings,
        results: {
          step1RawResults: payload.step1RawResults,
          step1At: payload.step1At,
          step2IndexResults: payload.step2IndexResults,
          step2At: payload.step2At,
          runResults: payload.runResults,
          lastRunAt: payload.lastRunAt,
        },
      });
      if (saved) {
        setLocalMeta({
          settingsSavedAt: saved.settingsSavedAt,
          runSettingsSavedAt: saved.runSettingsSavedAt,
          hasRunResults: Boolean(saved.results.runResults?.length),
        });
      }

      const publishToServer = accessRole === "admin";
      if (
        publishToServer &&
        (payload.runResults?.length ||
          payload.step1RawResults?.length ||
          payload.step2IndexResults?.length)
      ) {
        try {
          const res = await fetch(
            `/api/competitiveness-analysis/editions/${year}/results`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                step1RawResults: payload.step1RawResults,
                step1At: payload.step1At,
                step2IndexResults: payload.step2IndexResults,
                step2At: payload.step2At,
                runResults: payload.runResults,
                lastRunAt: payload.lastRunAt,
              }),
            },
          );
          if (res.ok) {
            await refreshEditions();
          }
        } catch {
          /* serverless read-only FS 등 — 브라우저 저장은 이미 완료 */
        }
      }
    },
    [accessRole, refreshEditions, settings],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/competitiveness-analysis/indicator-years")
      .then((r) => r.json())
      .then((data: IndicatorYearsResponse) => {
        if (cancelled) return;
        setYearsByTab(data.yearsByTab ?? {});
      })
      .catch(() => {
        /* fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialEdition() {
      const hasCache = editionClientCache != null;
      if (!hasCache) {
        setEditionsLoading(true);
      }
      setEditionsLoadError(null);
      try {
        const data = await fetchJsonWithTimeout<{ editions?: EditionSummary[] }>(
          "/api/competitiveness-analysis/editions",
        );
        if (cancelled) return;
        const years = data.editions ?? [];
        setEditions(years);

        const preferredYear = readUrlAnalysisYear() ?? readStoredAnalysisYear();
        const initialYear =
          years.find((e) => e.analysisYear === preferredYear)?.analysisYear ??
          years[0]?.analysisYear ??
          defaultYear;
        await loadEdition(initialYear);
      } catch (err) {
        if (cancelled) return;
        setEditionsLoadError(
          err instanceof Error
            ? err.message
            : "분석 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setEditionsLoading(false);
      }
    }

    void loadInitialEdition();
    return () => {
      cancelled = true;
    };
  }, [defaultYear, loadEdition]);

  useEffect(() => {
    if (editionsLoading) return;
    editionClientCache = {
      analysisYear,
      editions,
      settings,
      rawResults,
      runResults,
      lastRunAt,
      step1RawResults,
      step1LastRunAt,
      step2IndexResults,
      step2LastRunAt,
    };
  }, [
    analysisYear,
    editions,
    editionsLoading,
    lastRunAt,
    rawResults,
    runResults,
    settings,
    step1LastRunAt,
    step1RawResults,
    step2IndexResults,
    step2LastRunAt,
  ]);

  const setAnalysisYear = useCallback(
    async (year: number) => {
      if (year === analysisYear) return;
      setEditionsLoading(true);
      setEditionsLoadError(null);
      try {
        await loadEdition(year);
      } catch (err) {
        setEditionsLoadError(
          err instanceof Error
            ? err.message
            : "분석연도 데이터를 불러오지 못했습니다.",
        );
      } finally {
        setEditionsLoading(false);
      }
    },
    [analysisYear, loadEdition],
  );

  const createAnalysisYear = useCallback(
    async (year: number): Promise<number | null> => {
      const res = await fetch("/api/competitiveness-analysis/editions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisYear: year }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "연도 추가에 실패했습니다.");
      }
      const body = (await res.json()) as {
        copiedFromYear?: number | null;
      };
      await refreshEditions();
      await loadEdition(year);
      return body.copiedFromYear ?? null;
    },
    [loadEdition, refreshEditions],
  );

  const updateCategoryWeight = useCallback(
    (id: CompetitivenessFinanceGroupId, v: number) => {
      setSettings((s) => ({
        ...s,
        categoryWeights: { ...s.categoryWeights, [id]: v },
      }));
    },
    [],
  );

  const updateIndicatorWeight = useCallback((financeTabId: string, v: number) => {
    setSettings((s) => ({
      ...s,
      indicatorWeights: { ...s.indicatorWeights, [financeTabId]: v },
    }));
  }, []);

  const setEnabledIndicator = useCallback(
    (financeTabId: string, enabled: boolean) => {
      setSettings((s) => ({
        ...s,
        enabledIndicators: { ...s.enabledIndicators, [financeTabId]: enabled },
      }));
    },
    [],
  );

  const setIndicatorYear = useCallback((financeTabId: string, year: string) => {
    setSettings((s) => ({
      ...s,
      indicatorYears: { ...s.indicatorYears, [financeTabId]: year },
    }));
  }, []);

  const updateIndicatorPercentileLowerTail = useCallback(
    (financeTabId: string, v: number) => {
      setSettings((s) => ({
        ...s,
        indicatorPercentileLowerTailPct: {
          ...s.indicatorPercentileLowerTailPct,
          [financeTabId]: v,
        },
      }));
    },
    [],
  );

  const updateIndicatorPercentileUpperTail = useCallback(
    (financeTabId: string, v: number) => {
      setSettings((s) => ({
        ...s,
        indicatorPercentileUpperTailPct: {
          ...s.indicatorPercentileUpperTailPct,
          [financeTabId]: v,
        },
      }));
    },
    [],
  );

  const updateAnalysisPolicy = useCallback((patch: Partial<AnalysisPolicy>) => {
    setSettings((s) => ({
      ...s,
      analysisPolicy: { ...s.analysisPolicy, ...patch },
    }));
  }, []);

  const setTargetUniversities = useCallback((rows: TargetUniversityRow[]) => {
    setSettings((s) =>
      sameTargetUniversities(s.targetUniversities, rows)
        ? s
        : { ...s, targetUniversities: rows },
    );
  }, []);

  const reloadTargetUniversitiesFromDb = useCallback(async () => {
    const res = await fetch(
      `/api/competitiveness-analysis/target-universities?year=${analysisYear}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rows?: TargetUniversityRow[];
      rowCount?: number;
    };
    if (data.rows?.length) {
      setTargetUniversities(data.rows);
      return { rowCount: data.rowCount ?? data.rows.length };
    }
    return null;
  }, [analysisYear, setTargetUniversities]);

  const generateFundShortage = useCallback(async () => {
    const res = await fetch(
      `/api/competitiveness-analysis/editions/${analysisYear}/fund-shortage`,
      { method: "POST" },
    );
    const body = (await res.json()) as {
      ok?: boolean;
      edition?: { settings: CompetitivenessSettings };
      fundShortageCount?: number;
      fundSecureYear?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(body.error ?? "자금부족대학 생성에 실패했습니다.");
    }
    if (body.edition?.settings) {
      setSettings(normalizeSettings(body.edition.settings, indicators));
    }
    await refreshEditions();
    return {
      count: body.fundShortageCount ?? 0,
      fundSecureYear: body.fundSecureYear ?? "—",
    };
  }, [analysisYear, indicators, refreshEditions]);

  const saveSettings = useCallback(async () => {
    setSettingsSavePending(true);
    setSettingsSaveError(null);
    try {
      const savedAt = new Date().toISOString();
      if (accessRole === "admin") {
        const res = await fetch(
          `/api/competitiveness-analysis/editions/${analysisYear}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings }),
          },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "기본설정 저장에 실패했습니다.");
        }
        await refreshEditions();
      }
      const saved = await writeCaUserWorkspace(analysisYear, {
        weights: extractCaWeights(settings),
        settingsSavedAt: savedAt,
      });
      if (saved) {
        setLocalMeta((prev) => ({
          ...prev,
          settingsSavedAt: saved.settingsSavedAt,
        }));
      }
    } catch (err) {
      setSettingsSaveError(
        err instanceof Error ? err.message : "설정 저장에 실패했습니다.",
      );
      throw err;
    } finally {
      setSettingsSavePending(false);
    }
  }, [accessRole, analysisYear, refreshEditions, settings]);

  const runStep1 = useCallback(async () => {
    setStep1Pending(true);
    setStep1Error(null);
    try {
      const res = await fetch("/api/competitiveness-analysis/run/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        rawResults?: UniversityRawResult[];
        lastRunAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "1단계 실행에 실패했습니다.");
      }
      setStep1RawResults(body.rawResults ?? null);
      const at = body.lastRunAt ?? new Date().toLocaleString("ko-KR");
      setStep1LastRunAt(at);
      await persistResults(analysisYear, {
        step1RawResults: body.rawResults ?? null,
        step1At: at,
        settingsAtRun: settings,
      });
    } catch (err) {
      setStep1Error(
        err instanceof Error ? err.message : "1단계 실행에 실패했습니다.",
      );
    } finally {
      setStep1Pending(false);
    }
  }, [analysisYear, persistResults, settings]);

  const runStep2 = useCallback(async () => {
    setStep2Pending(true);
    setStep2Error(null);
    try {
      const res = await fetch("/api/competitiveness-analysis/run/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        rawResults?: UniversityRawResult[];
        indexResults?: UniversityRunResult[];
        lastRunAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "2단계 실행에 실패했습니다.");
      }
      if (body.rawResults?.length) {
        setStep1RawResults(body.rawResults);
      }
      setStep2IndexResults(body.indexResults ?? null);
      const at = body.lastRunAt ?? new Date().toLocaleString("ko-KR");
      setStep2LastRunAt(at);
      if (body.rawResults?.length) {
        setStep1LastRunAt(at);
      }
      await persistResults(analysisYear, {
        step1RawResults: body.rawResults ?? step1RawResults,
        step1At: at,
        step2IndexResults: body.indexResults ?? null,
        step2At: at,
        settingsAtRun: settings,
      });
    } catch (err) {
      setStep2Error(
        err instanceof Error ? err.message : "2단계 실행에 실패했습니다.",
      );
    } finally {
      setStep2Pending(false);
    }
  }, [analysisYear, persistResults, settings, step1RawResults]);

  const runAnalysis = useCallback(async () => {
    setRunPending(true);
    setRunError(null);
    if (!weightsValid) {
      setRunError(formatWeightValidationError(weightValidationIssues));
      setRunPending(false);
      return;
    }
    try {
      const res = await fetch("/api/competitiveness-analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        rawResults?: UniversityRawResult[];
        indexResults?: UniversityRunResult[];
        runResults?: UniversityRunResult[];
        lastRunAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "분석 실행에 실패했습니다.");
      }
      setRawResults(body.rawResults ?? null);
      setRunResults(body.runResults ?? null);
      const at = body.lastRunAt ?? new Date().toLocaleString("ko-KR");
      setLastRunAt(at);
      if (body.rawResults?.length) {
        setStep1RawResults(body.rawResults);
        setStep1LastRunAt(at);
      }
      if (body.indexResults?.length) {
        setStep2IndexResults(body.indexResults);
        setStep2LastRunAt(at);
      }
      await persistResults(analysisYear, {
        step1RawResults: body.rawResults ?? null,
        step1At: at,
        step2IndexResults: body.indexResults ?? null,
        step2At: at,
        runResults: body.runResults ?? null,
        lastRunAt: at,
        settingsAtRun: settings,
      });
    } catch (err) {
      setRunError(
        err instanceof Error ? err.message : "분석 실행에 실패했습니다.",
      );
    } finally {
      setRunPending(false);
    }
  }, [
    analysisYear,
    persistResults,
    settings,
    weightsValid,
    weightValidationIssues,
  ]);

  const dismissPostRunValidation = useCallback(() => {
    setPostRunValidationOpen(false);
  }, []);

  const value = useMemo(
    (): StoreValue => ({
      analysisYear,
      editions,
      editionsLoading,
      editionsLoadError,
      settings,
      yearsByTab,
      indicators,
      rawResults,
      runResults,
      lastRunAt,
      runPending,
      runError,
      step1RawResults,
      step1LastRunAt,
      step1Pending,
      step1Error,
      step2IndexResults,
      step2LastRunAt,
      step2Pending,
      step2Error,
      weightValidationIssues,
      weightsValid,
      analysisGuidelines,
      step12IndicatorIds,
      settingsSavePending,
      settingsSaveError,
      settingsStale,
      updateCategoryWeight,
      updateIndicatorWeight,
      setEnabledIndicator,
      setIndicatorYear,
      updateIndicatorPercentileLowerTail,
      updateIndicatorPercentileUpperTail,
      updateAnalysisPolicy,
      setTargetUniversities,
      reloadTargetUniversitiesFromDb,
      generateFundShortage,
      setAnalysisYear,
      createAnalysisYear,
      refreshEditions,
      saveSettings,
      runStep1,
      runStep2,
      runAnalysis,
      postRunValidationOpen,
      postRunValidationReport,
      postRunValidationPending,
      dismissPostRunValidation,
    }),
    [
      analysisYear,
      editions,
      editionsLoading,
      editionsLoadError,
      settings,
      yearsByTab,
      indicators,
      rawResults,
      runResults,
      lastRunAt,
      runPending,
      runError,
      step1RawResults,
      step1LastRunAt,
      step1Pending,
      step1Error,
      step2IndexResults,
      step2LastRunAt,
      step2Pending,
      step2Error,
      weightValidationIssues,
      weightsValid,
      analysisGuidelines,
      step12IndicatorIds,
      settingsSavePending,
      settingsSaveError,
      settingsStale,
      updateCategoryWeight,
      updateIndicatorWeight,
      setEnabledIndicator,
      setIndicatorYear,
      updateIndicatorPercentileLowerTail,
      updateIndicatorPercentileUpperTail,
      updateAnalysisPolicy,
      setTargetUniversities,
      reloadTargetUniversitiesFromDb,
      generateFundShortage,
      setAnalysisYear,
      createAnalysisYear,
      refreshEditions,
      saveSettings,
      runStep1,
      runStep2,
      runAnalysis,
      postRunValidationOpen,
      postRunValidationReport,
      postRunValidationPending,
      dismissPostRunValidation,
    ],
  );

  return (
    <CompetitivenessContext.Provider value={value}>
      {children}
      <PostRunValidationDialog
        open={postRunValidationOpen}
        report={postRunValidationReport}
        onContinue={dismissPostRunValidation}
      />
    </CompetitivenessContext.Provider>
  );
}

export function useCompetitivenessSettings() {
  const ctx = useContext(CompetitivenessContext);
  if (!ctx) {
    throw new Error(
      "useCompetitivenessSettings must be used within CompetitivenessSettingsProvider",
    );
  }
  return ctx;
}

export function useCompetitivenessCategories() {
  return getCompetitivenessCategories();
}
