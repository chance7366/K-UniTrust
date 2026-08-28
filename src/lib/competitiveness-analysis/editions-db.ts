import {
  readPersistentTextFile,
  writePersistentTextFile,
} from "@/lib/persistent-data-file";

import {
  DEFAULT_CATEGORY_WEIGHTS,
  getCompetitivenessIndicators,
  type CompetitivenessIndicatorDef,
} from "@/lib/analysis/competitiveness-indicators";
import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import {
  DEFAULT_ANALYSIS_POLICY,
} from "@/lib/competitiveness-analysis/analysis-policy";
import {
  DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT,
  DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";
import { COMPETITIVENESS_EDITIONS_CSV_COLUMNS } from "@/lib/competitiveness-analysis/editions-config";
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
  normalizeIndicatorYearsRecord,
  shiftIndicatorYearsRecord,
} from "@/lib/competitiveness-analysis/parse-indicator-year";
import { loadTargetUniversitiesFromCsv } from "@/lib/ingest/target-universities-upload";
import { applyFundShortageFlags } from "@/lib/ingest/fund-shortage-detection";
import { shouldSyncProdDataStore } from "@/lib/prod-store-sync";
import { shouldReadRemoteCsvStore } from "@/lib/vercel-blob-env";

export type EditionSummary = {
  analysisYear: number;
  settingsSavedAt: string | null;
  runSettingsSavedAt: string | null;
  lastRunAt: string | null;
  targetUniversityCount: number;
  hasStep1: boolean;
  hasStep2: boolean;
  hasRunResults: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EditionRunResults = {
  step1RawResults: UniversityRawResult[] | null;
  step1At: string | null;
  step2IndexResults: UniversityRunResult[] | null;
  step2At: string | null;
  runResults: UniversityRunResult[] | null;
  lastRunAt: string | null;
};

export type EditionFull = EditionSummary & {
  settings: CompetitivenessSettings;
  results: EditionRunResults;
};

export type NewEditionInfo = {
  edition: EditionFull;
  /** 설정 복사 원본 연도 (없으면 시스템 기본값) */
  copiedFromYear: number | null;
};

type EditionIndexRow = Record<
  (typeof COMPETITIVENESS_EDITIONS_CSV_COLUMNS)[number],
  string
>;

type EditionPayloadFile = {
  settings: CompetitivenessSettings;
  results: EditionRunResults;
};

const payloadCache = new Map<number, EditionPayloadFile>();

let storageReady: Promise<void> | null = null;

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function parseJson<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function flag(value: boolean): "1" | "0" {
  return value ? "1" : "0";
}

function hasStoredJsonArray(raw: string): boolean {
  const t = s(raw);
  return t.length > 2 && t.startsWith("[");
}

function payloadRel(year: number): string {
  return `json/competitiveness-editions/${year}.json`;
}

function emptyResults(): EditionRunResults {
  return {
    step1RawResults: null,
    step1At: null,
    step2IndexResults: null,
    step2At: null,
    runResults: null,
    lastRunAt: null,
  };
}

function normalizeResults(results: EditionRunResults | null | undefined): EditionRunResults {
  return {
    step1RawResults: results?.step1RawResults?.length
      ? results.step1RawResults
      : null,
    step1At: results?.step1At ?? null,
    step2IndexResults: results?.step2IndexResults?.length
      ? results.step2IndexResults
      : null,
    step2At: results?.step2At ?? null,
    runResults: results?.runResults?.length ? results.runResults : null,
    lastRunAt: results?.lastRunAt ?? null,
  };
}

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

export function normalizeEditionSettings(
  parsed: Partial<CompetitivenessSettings> | null,
  indicators: CompetitivenessIndicatorDef[],
): CompetitivenessSettings {
  const base = buildDefaultSettings(indicators);
  if (!parsed) return base;
  return {
    ...base,
    ...parsed,
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

function nowIso(): string {
  return new Date().toISOString();
}

function indexToSummary(row: EditionIndexRow): EditionSummary {
  return {
    analysisYear: Number(row.analysis_year),
    settingsSavedAt: s(row.settings_saved_at) || null,
    runSettingsSavedAt: s(row.run_settings_saved_at) || null,
    lastRunAt: s(row.last_run_at) || null,
    targetUniversityCount: Number(row.target_university_count) || 0,
    hasStep1: row.has_step1 === "1",
    hasStep2: row.has_step2 === "1",
    hasRunResults: row.has_run_results === "1",
    createdAt: s(row.created_at),
    updatedAt: s(row.updated_at),
  };
}

function buildIndexRow(input: {
  analysisYear: number;
  settingsSavedAt: string;
  step1At: string;
  step2At: string;
  lastRunAt: string;
  runSettingsSavedAt: string;
  targetUniversityCount: number;
  hasStep1: boolean;
  hasStep2: boolean;
  hasRunResults: boolean;
  createdAt: string;
  updatedAt: string;
}): EditionIndexRow {
  return {
    analysis_year: String(input.analysisYear),
    settings_saved_at: input.settingsSavedAt,
    step1_at: input.step1At,
    step2_at: input.step2At,
    last_run_at: input.lastRunAt,
    run_settings_saved_at: input.runSettingsSavedAt,
    target_university_count: String(input.targetUniversityCount),
    has_step1: flag(input.hasStep1),
    has_step2: flag(input.hasStep2),
    has_run_results: flag(input.hasRunResults),
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  };
}

function indexFromEdition(
  summary: EditionSummary,
  settings: CompetitivenessSettings,
  results: EditionRunResults,
  timestamps?: Partial<EditionIndexRow>,
): EditionIndexRow {
  return buildIndexRow({
    analysisYear: summary.analysisYear,
    settingsSavedAt: timestamps?.settings_saved_at ?? summary.settingsSavedAt ?? "",
    step1At: timestamps?.step1_at ?? results.step1At ?? "",
    step2At: timestamps?.step2_at ?? results.step2At ?? "",
    lastRunAt: timestamps?.last_run_at ?? results.lastRunAt ?? "",
    runSettingsSavedAt:
      timestamps?.run_settings_saved_at ?? summary.runSettingsSavedAt ?? "",
    targetUniversityCount: settings.targetUniversities.length,
    hasStep1: Boolean(results.step1RawResults?.length),
    hasStep2: Boolean(results.step2IndexResults?.length),
    hasRunResults: Boolean(results.runResults?.length),
    createdAt: timestamps?.created_at ?? summary.createdAt,
    updatedAt: timestamps?.updated_at ?? summary.updatedAt,
  });
}

function isLegacyEditionRow(row: Record<string, string> | undefined): boolean {
  if (!row) return false;
  return (
    Object.prototype.hasOwnProperty.call(row, "settings_json") ||
    Object.prototype.hasOwnProperty.call(row, "step1_json") ||
    Object.prototype.hasOwnProperty.call(row, "run_results_json")
  );
}

async function readIndexRowsRaw(): Promise<Record<string, string>[]> {
  try {
    return await readCsvFile("competitivenessAnalysisEditions");
  } catch {
    return [];
  }
}

async function writeIndexRows(rows: EditionIndexRow[]): Promise<void> {
  const sorted = [...rows].sort(
    (a, b) => Number(b.analysis_year) - Number(a.analysis_year),
  );
  await writeCsvFile(
    "competitivenessAnalysisEditions",
    sorted,
    [...COMPETITIVENESS_EDITIONS_CSV_COLUMNS],
  );
}

async function readPayload(year: number): Promise<EditionPayloadFile | null> {
  if (!shouldReadRemoteCsvStore() && !shouldSyncProdDataStore()) {
    const cached = payloadCache.get(year);
    if (cached) return cached;
  }
  try {
    const raw = await readPersistentTextFile(payloadRel(year));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EditionPayloadFile;
    const payload: EditionPayloadFile = {
      settings: parsed.settings,
      results: normalizeResults(parsed.results),
    };
    payloadCache.set(year, payload);
    return payload;
  } catch {
    return null;
  }
}

async function writePayload(
  year: number,
  payload: EditionPayloadFile,
): Promise<void> {
  const normalized: EditionPayloadFile = {
    settings: payload.settings,
    results: normalizeResults(payload.results),
  };
  await writePersistentTextFile(payloadRel(year), JSON.stringify(normalized));
  payloadCache.set(year, normalized);
}

function payloadFromLegacyRow(
  row: Record<string, string>,
  indicators: CompetitivenessIndicatorDef[],
): EditionPayloadFile {
  return {
    settings: normalizeEditionSettings(
      parseJson<CompetitivenessSettings>(row.settings_json ?? ""),
      indicators,
    ),
    results: normalizeResults({
      step1RawResults: parseJson<UniversityRawResult[]>(row.step1_json ?? ""),
      step1At: s(row.step1_at) || null,
      step2IndexResults: parseJson<UniversityRunResult[]>(row.step2_json ?? ""),
      step2At: s(row.step2_at) || null,
      runResults: parseJson<UniversityRunResult[]>(row.run_results_json ?? ""),
      lastRunAt: s(row.last_run_at) || null,
    }),
  };
}

function indexFromLegacyRow(
  row: Record<string, string>,
  payload: EditionPayloadFile,
): EditionIndexRow {
  return buildIndexRow({
    analysisYear: Number(row.analysis_year),
    settingsSavedAt: s(row.settings_saved_at),
    step1At: payload.results.step1At ?? s(row.step1_at),
    step2At: payload.results.step2At ?? s(row.step2_at),
    lastRunAt: payload.results.lastRunAt ?? s(row.last_run_at),
    runSettingsSavedAt: s(row.run_settings_saved_at),
    targetUniversityCount: payload.settings.targetUniversities.length,
    hasStep1:
      Boolean(payload.results.step1RawResults?.length) ||
      hasStoredJsonArray(row.step1_json ?? ""),
    hasStep2:
      Boolean(payload.results.step2IndexResults?.length) ||
      hasStoredJsonArray(row.step2_json ?? ""),
    hasRunResults:
      Boolean(payload.results.runResults?.length) ||
      hasStoredJsonArray(row.run_results_json ?? ""),
    createdAt: s(row.created_at),
    updatedAt: s(row.updated_at),
  });
}

async function migrateLegacyEditionsIfNeeded(): Promise<void> {
  const indicators = getCompetitivenessIndicators();
  const rawRows = await readIndexRowsRaw();

  if (rawRows.length && isLegacyEditionRow(rawRows[0])) {
    const indexRows: EditionIndexRow[] = [];
    for (const row of rawRows) {
      const year = Number(row.analysis_year);
      if (!Number.isInteger(year)) continue;
      const payload = payloadFromLegacyRow(row, indicators);
      await writePayload(year, payload);
      indexRows.push(indexFromLegacyRow(row, payload));
    }
    await writeIndexRows(indexRows);
    return;
  }

  if (rawRows.length) return;

  const legacy = await loadTargetUniversitiesFromCsv();
  if (!legacy.rows.length) return;

  const year = new Date().getFullYear();
  const settings = buildDefaultSettings(indicators);
  settings.targetUniversities = legacy.rows;
  const ts = legacy.uploadedAt ?? nowIso();
  const results = emptyResults();
  await writePayload(year, { settings, results });
  await writeIndexRows([
    buildIndexRow({
      analysisYear: year,
      settingsSavedAt: ts,
      step1At: "",
      step2At: "",
      lastRunAt: "",
      runSettingsSavedAt: "",
      targetUniversityCount: settings.targetUniversities.length,
      hasStep1: false,
      hasStep2: false,
      hasRunResults: false,
      createdAt: ts,
      updatedAt: ts,
    }),
  ]);
}

async function ensureEditionsStorage(): Promise<void> {
  if (!storageReady) {
    storageReady = migrateLegacyEditionsIfNeeded().catch((err) => {
      storageReady = null;
      throw err;
    });
  }
  await storageReady;
}

async function readIndexRows(): Promise<EditionIndexRow[]> {
  await ensureEditionsStorage();
  const rows = await readIndexRowsRaw();
  return rows as EditionIndexRow[];
}

async function assembleEdition(
  row: EditionIndexRow,
  indicators: CompetitivenessIndicatorDef[],
): Promise<EditionFull> {
  const year = Number(row.analysis_year);
  const payload = await readPayload(year);
  const settings = normalizeEditionSettings(payload?.settings ?? null, indicators);
  const results = normalizeResults(payload?.results);
  return {
    ...indexToSummary(row),
    targetUniversityCount: settings.targetUniversities.length,
    hasStep1: Boolean(results.step1RawResults?.length),
    hasStep2: Boolean(results.step2IndexResults?.length),
    hasRunResults: Boolean(results.runResults?.length),
    settings,
    results,
  };
}

async function buildSettingsForNewEdition(
  analysisYear: number,
  indicators: CompetitivenessIndicatorDef[],
  rows: EditionIndexRow[],
): Promise<{ settings: CompetitivenessSettings; copiedFromYear: number | null }> {
  const sourceRow = [...rows]
    .filter((r) => Number(r.analysis_year) !== analysisYear)
    .sort((a, b) => Number(b.analysis_year) - Number(a.analysis_year))[0];

  if (!sourceRow) {
    return {
      settings: {
        ...buildDefaultSettings(indicators),
        targetUniversities: [],
      },
      copiedFromYear: null,
    };
  }

  const sourceYear = Number(sourceRow.analysis_year);
  const payload = await readPayload(sourceYear);
  const source = normalizeEditionSettings(payload?.settings ?? null, indicators);
  const yearDelta = analysisYear - sourceYear;

  return {
    settings: {
      ...source,
      indicatorYears: shiftIndicatorYearsRecord(source.indicatorYears, yearDelta),
      targetUniversities: [],
    },
    copiedFromYear: sourceYear,
  };
}

async function upsertIndexRow(
  rows: EditionIndexRow[],
  nextRow: EditionIndexRow,
): Promise<void> {
  const idx = rows.findIndex(
    (r) => Number(r.analysis_year) === Number(nextRow.analysis_year),
  );
  const next = [...rows];
  if (idx < 0) next.push(nextRow);
  else next[idx] = nextRow;
  await writeIndexRows(next);
}

export async function listEditionSummaries(): Promise<EditionSummary[]> {
  const rows = await readIndexRows();
  return rows.map(indexToSummary).sort((a, b) => b.analysisYear - a.analysisYear);
}

export async function getEditionFull(
  analysisYear: number,
): Promise<EditionFull | null> {
  const indicators = getCompetitivenessIndicators();
  const rows = await readIndexRows();
  const row = rows.find((r) => Number(r.analysis_year) === analysisYear);
  if (!row) return null;
  return assembleEdition(row, indicators);
}

export async function getOrCreateEdition(
  analysisYear: number,
): Promise<EditionFull> {
  const result = await createEdition(analysisYear);
  return result.edition;
}

export async function createEdition(
  analysisYear: number,
): Promise<NewEditionInfo> {
  const existing = await getEditionFull(analysisYear);
  if (existing) {
    return { edition: existing, copiedFromYear: null };
  }

  const indicators = getCompetitivenessIndicators();
  const rows = await readIndexRows();
  const ts = nowIso();
  const { settings, copiedFromYear } = await buildSettingsForNewEdition(
    analysisYear,
    indicators,
    rows,
  );
  const results = emptyResults();
  await writePayload(analysisYear, { settings, results });
  const newRow = buildIndexRow({
    analysisYear,
    settingsSavedAt: copiedFromYear ? ts : "",
    step1At: "",
    step2At: "",
    lastRunAt: "",
    runSettingsSavedAt: "",
    targetUniversityCount: settings.targetUniversities.length,
    hasStep1: false,
    hasStep2: false,
    hasRunResults: false,
    createdAt: ts,
    updatedAt: ts,
  });
  await writeIndexRows([...rows, newRow]);
  return {
    edition: {
      ...indexToSummary(newRow),
      settings,
      results,
    },
    copiedFromYear,
  };
}

export async function saveEditionSettings(
  analysisYear: number,
  settings: CompetitivenessSettings,
): Promise<EditionFull> {
  const indicators = getCompetitivenessIndicators();
  const normalized = normalizeEditionSettings(settings, indicators);
  const rows = await readIndexRows();
  const ts = nowIso();
  const idx = rows.findIndex((r) => Number(r.analysis_year) === analysisYear);
  const current = idx >= 0 ? rows[idx]! : null;
  const payload = (await readPayload(analysisYear)) ?? {
    settings: normalized,
    results: emptyResults(),
  };
  payload.settings = normalized;
  await writePayload(analysisYear, payload);

  const nextRow = buildIndexRow({
    analysisYear,
    settingsSavedAt: ts,
    step1At: payload.results.step1At ?? s(current?.step1_at),
    step2At: payload.results.step2At ?? s(current?.step2_at),
    lastRunAt: payload.results.lastRunAt ?? s(current?.last_run_at),
    runSettingsSavedAt: s(current?.run_settings_saved_at),
    targetUniversityCount: normalized.targetUniversities.length,
    hasStep1: Boolean(payload.results.step1RawResults?.length),
    hasStep2: Boolean(payload.results.step2IndexResults?.length),
    hasRunResults: Boolean(payload.results.runResults?.length),
    createdAt: s(current?.created_at) || ts,
    updatedAt: ts,
  });
  await upsertIndexRow(rows, nextRow);
  return {
    ...indexToSummary(nextRow),
    settings: normalized,
    results: payload.results,
  };
}

export type SaveEditionResultsInput = {
  step1RawResults?: UniversityRawResult[] | null;
  step1At?: string | null;
  step2IndexResults?: UniversityRunResult[] | null;
  step2At?: string | null;
  runResults?: UniversityRunResult[] | null;
  lastRunAt?: string | null;
};

export async function saveEditionResults(
  analysisYear: number,
  input: SaveEditionResultsInput,
): Promise<EditionFull> {
  const edition = await getOrCreateEdition(analysisYear);
  const rows = await readIndexRows();
  const current = rows.find((r) => Number(r.analysis_year) === analysisYear);
  if (!current) {
    throw new Error(`분석연도 ${analysisYear} edition을 찾을 수 없습니다.`);
  }

  const ts = nowIso();
  const results: EditionRunResults = { ...edition.results };

  if (input.step1RawResults !== undefined) {
    results.step1RawResults = input.step1RawResults?.length
      ? input.step1RawResults
      : null;
    results.step1At = input.step1At ?? ts;
  }
  if (input.step2IndexResults !== undefined) {
    results.step2IndexResults = input.step2IndexResults?.length
      ? input.step2IndexResults
      : null;
    results.step2At = input.step2At ?? ts;
  }
  if (input.runResults !== undefined) {
    results.runResults = input.runResults?.length ? input.runResults : null;
    results.lastRunAt = input.lastRunAt ?? ts;
  }

  const hasNewResults =
    (input.step1RawResults !== undefined && Boolean(input.step1RawResults?.length)) ||
    (input.step2IndexResults !== undefined &&
      Boolean(input.step2IndexResults?.length)) ||
    (input.runResults !== undefined && Boolean(input.runResults?.length));

  await writePayload(analysisYear, {
    settings: edition.settings,
    results,
  });

  const nextRow = indexFromEdition(
    {
      ...edition,
      runSettingsSavedAt: hasNewResults
        ? edition.settingsSavedAt ?? ts
        : edition.runSettingsSavedAt,
      updatedAt: ts,
    },
    edition.settings,
    results,
    {
      settings_saved_at: current.settings_saved_at,
      run_settings_saved_at: hasNewResults
        ? s(current.settings_saved_at) || ts
        : current.run_settings_saved_at,
      created_at: current.created_at,
      updated_at: ts,
    },
  );
  await upsertIndexRow(rows, nextRow);
  return {
    ...indexToSummary(nextRow),
    settings: edition.settings,
    results,
  };
}

/** 대상대학만 갱신 (엑셀 업로드) — 자금부족 플래그는 초기화 */
export async function saveEditionTargetUniversities(
  analysisYear: number,
  targetUniversities: TargetUniversityRow[],
  uploadedAt?: string,
): Promise<EditionFull> {
  const edition = await getOrCreateEdition(analysisYear);
  const cleared = targetUniversities.map((row) => ({
    ...row,
    fundShortage: "" as const,
  }));
  const settings: CompetitivenessSettings = {
    ...edition.settings,
    targetUniversities: cleared,
  };
  return saveEditionSettings(analysisYear, settings);
}

/** 절대지표 — 자금확보율 적용연도 DB 자금합계<0 판정 */
export async function applyFundShortageToEdition(
  analysisYear: number,
): Promise<EditionFull> {
  const edition = await getEditionFull(analysisYear);
  if (!edition) {
    throw new Error(`분석연도 ${analysisYear} edition을 찾을 수 없습니다.`);
  }
  if (!edition.settings.targetUniversities.length) {
    throw new Error("대상대학이 없습니다. 먼저 대상대학을 업로드하세요.");
  }

  const fundSecureYearLabel =
    edition.settings.indicatorYears["fund-secure-rate"] ?? "2025년";
  const updatedRows = await applyFundShortageFlags(
    edition.settings.targetUniversities,
    fundSecureYearLabel,
  );

  return saveEditionSettings(analysisYear, {
    ...edition.settings,
    targetUniversities: updatedRows,
  });
}

/** 추세·대학별 화면용 — 연도별 3단계 결과 + 당시 기본설정 */
export type EditionTrendPoint = {
  analysisYear: number;
  lastRunAt: string | null;
  runResults: UniversityRunResult[];
  settings: CompetitivenessSettings;
  step1RawResults: UniversityRawResult[] | null;
};

export async function loadEditionTrendSeries(): Promise<EditionTrendPoint[]> {
  const summaries = await listEditionSummaries();
  const points: EditionTrendPoint[] = [];

  for (const summary of summaries) {
    if (!summary.hasRunResults) continue;
    const edition = await getEditionFull(summary.analysisYear);
    if (!edition?.results.runResults?.length) continue;
    points.push({
      analysisYear: summary.analysisYear,
      lastRunAt: edition.results.lastRunAt,
      runResults: edition.results.runResults,
      settings: edition.settings,
      step1RawResults: edition.results.step1RawResults,
    });
  }

  return points.sort((a, b) => a.analysisYear - b.analysisYear);
}

export function parseAnalysisYearParam(raw: string | null): number | null {
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}
