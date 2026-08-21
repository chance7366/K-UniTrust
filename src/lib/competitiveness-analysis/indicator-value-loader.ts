import {
  FINANCE_TAB_CSV_KEY,
  getCompetitivenessIndicators,
  type CompetitivenessIndicatorDef,
} from "@/lib/analysis/competitiveness-indicators";
import { readCsvFile } from "@/lib/csv/read";
import type { CsvFileKey } from "@/lib/csv/paths";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";
import { parseIndicatorYearLabel } from "@/lib/competitiveness-analysis/parse-indicator-year";
import { resolveStep12IndicatorIds } from "@/lib/competitiveness-analysis/analysis-policy";
import {
  classifyTargetSchoolKind,
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import {
  loadEnrolledStudentCountsByRep,
  lookupEnrolledStudentCount,
  type EnrolledStudentCountMaps,
} from "@/lib/analysis/enrolled-students-rep-count";
import type {
  CompetitivenessSettings,
  RawIndicatorCell,
  UniversityRawResult,
} from "@/lib/competitiveness-analysis/types";

const STUDENT_INDICATOR_IDS = new Set([
  "freshman-enrollment-rate",
  "enrolled-enrollment-rate",
  "dropout-rate",
]);

const REP_VALUE_FIELD: Record<string, string> = {
  "freshman-enrollment-rate": "fill_rate_within_outside",
  "enrolled-enrollment-rate": "fill_rate_within_outside",
  "dropout-rate": "enrolled_dropout_rate",
  "fund-secure-rate": "fund_secure_rate",
  "financial-support-benefit-rate": "benefit_rate",
  "tuition-dependency-rate": "tuition_dependency_rate",
  "income-property-secure-rate": "secure_rate",
  "corp-transfer-ratio": "transfer_ratio",
};

type RepCohort = "university" | "junior-college" | "combined";

function padCode(v: string): string {
  const s = v.trim();
  if (!s) return "";
  return /^\d+$/.test(s) ? s.padStart(7, "0") : s;
}

function num(v: string | undefined | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function classifyRepCohort(
  schoolKind: string,
  schoolDivision: string,
): SchoolKindFilter {
  const fromKind = classifyTargetSchoolKind(schoolKind);
  if (fromKind !== "other") return fromKind;
  return classifyTargetSchoolKind(schoolDivision) === "junior-college"
    ? "junior-college"
    : "university";
}

function isLookupCohort(cohort: string): cohort is RepCohort {
  return (
    cohort === "university" ||
    cohort === "junior-college" ||
    cohort === "combined"
  );
}

function resolveLookupCohorts(
  financeTabId: string,
  schoolKind: string,
  schoolDivision: string,
): RepCohort[] {
  const kind = classifyRepCohort(schoolKind, schoolDivision);
  if (kind === "junior-college") return ["junior-college"];
  if (STUDENT_INDICATOR_IDS.has(financeTabId)) {
    return ["combined", "university"];
  }
  return ["university"];
}

function lookupRepValue(
  map: RepLookup,
  year: number,
  cohorts: RepCohort[],
  repCode: string,
): number | null {
  const code = padCode(repCode);
  for (const cohort of cohorts) {
    const value = map.get(repLookupKey(year, cohort, code));
    if (value != null) return value;
  }
  return null;
}

function repLookupKey(
  year: number,
  cohort: RepCohort,
  repCode: string,
): string {
  return `${year}:${cohort}:${padCode(repCode)}`;
}

type RepLookup = Map<string, number>;

function buildRepLookup(
  rows: Record<string, string>[],
  valueField: string,
): RepLookup {
  const map: RepLookup = new Map();
  for (const row of rows) {
    const year = num(row.year);
    const cohort = row.cohort?.trim() ?? "";
    const rep = padCode(row.school_rep_code ?? "");
    const value = num(row[valueField]);
    if (!year || !rep || value == null || !isLookupCohort(cohort)) continue;
    map.set(repLookupKey(year, cohort, rep), value);
  }
  return map;
}

type IndicatorDataset = {
  byTab: Record<string, RepLookup>;
  enrolledStudentCounts: Map<number, EnrolledStudentCountMaps>;
};

export type IndicatorSourceData = {
  freshmanRows: Record<string, string>[];
  enrolledRows: Record<string, string>[];
  dropoutRows: Record<string, string>[];
  dropoutRawRows: Record<string, string>[];
  fundSecureRolled: Record<string, string>[];
  tuitionRolled: Record<string, string>[];
  financialSupportRolled: Record<string, string>[];
  incomePropertyRolled: Record<string, string>[];
  corpTransferRolled: Record<string, string>[];
  tuitionByPriorYear: Map<string, number>;
  dataset: IndicatorDataset;
};

async function readRepCsv(key: CsvFileKey): Promise<Record<string, string>[]> {
  return readCsvFile(key).catch(() => []);
}

async function loadIndicatorSourceData(): Promise<IndicatorSourceData> {
  const [
    freshmanRows,
    enrolledRows,
    dropoutRows,
    fundSecureRolled,
    tuitionRolled,
    financialSupportRolled,
    incomePropertyRolled,
    corpTransferRolled,
  ] = await Promise.all([
    readRepCsv("financeAnalysisFreshmanEnrollmentRep"),
    readRepCsv("financeAnalysisEnrolledEnrollmentRep"),
    readRepCsv("financeAnalysisDropoutRateRep"),
    readRepCsv("financeAnalysisFundSecureRateRep"),
    readRepCsv("financeAnalysisTuitionDependencyRateRep"),
    readRepCsv("financeAnalysisFinancialSupportBenefitRateRep"),
    readRepCsv("financeAnalysisIncomePropertySecureRateRep"),
    readRepCsv("financeAnalysisCorpTransferRatioRep"),
  ]);

  const rowsByTab: Record<string, Record<string, string>[]> = {
    "freshman-enrollment-rate": freshmanRows,
    "enrolled-enrollment-rate": enrolledRows,
    "dropout-rate": dropoutRows,
    "fund-secure-rate": fundSecureRolled,
    "financial-support-benefit-rate": financialSupportRolled,
    "tuition-dependency-rate": tuitionRolled,
    "income-property-secure-rate": incomePropertyRolled,
    "corp-transfer-ratio": corpTransferRolled,
  };

  const byTab: Record<string, RepLookup> = {};
  for (const [tabId, field] of Object.entries(REP_VALUE_FIELD)) {
    byTab[tabId] = buildRepLookup(rowsByTab[tabId] ?? [], field);
  }

  return {
    freshmanRows,
    enrolledRows,
    dropoutRows,
    dropoutRawRows: dropoutRows,
    fundSecureRolled,
    tuitionRolled,
    financialSupportRolled,
    incomePropertyRolled,
    corpTransferRolled,
    tuitionByPriorYear: new Map(),
    dataset: {
      byTab,
      enrolledStudentCounts: new Map(),
    },
  };
}

async function loadIndicatorDataset(
  enrolledYear?: number,
): Promise<IndicatorDataset> {
  const sources = await loadIndicatorSourceData();
  if (enrolledYear != null) {
    sources.dataset.enrolledStudentCounts.set(
      enrolledYear,
      await loadEnrolledStudentCountsByRep(enrolledYear),
    );
  }
  return sources.dataset;
}

export { loadIndicatorSourceData };

function resolveIndicatorValue(
  dataset: IndicatorDataset,
  indicator: CompetitivenessIndicatorDef,
  yearLabel: string,
  uni: TargetUniversityRow,
): { value: number | null; note?: string } {
  const parsed = parseIndicatorYearLabel(yearLabel);
  if (!parsed) {
    return { value: null, note: "적용연도 형식 오류" };
  }

  const lookup = dataset.byTab[indicator.financeTabId];
  if (!lookup) {
    const csvKey = FINANCE_TAB_CSV_KEY[indicator.financeTabId] as
      | CsvFileKey
      | undefined;
    return {
      value: null,
      note: csvKey ? "지표 조회 미구현" : "DB 미연결",
    };
  }

  const cohorts = resolveLookupCohorts(
    indicator.financeTabId,
    uni.schoolKind,
    uni.schoolDivision,
  );
  const value = lookupRepValue(
    lookup,
    parsed.year,
    cohorts,
    uni.schoolCodeStd,
  );
  return value == null
    ? { value: null, note: `${yearLabel} 재정분석지표 표시연도 데이터 없음` }
    : { value };
}

export async function loadRawIndicatorResults(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[] = getCompetitivenessIndicators(),
): Promise<UniversityRawResult[]> {
  const enrolledYear = parseIndicatorYearLabel(
    settings.indicatorYears["enrolled-enrollment-rate"] ??
      indicators.find((i) => i.financeTabId === "enrolled-enrollment-rate")
        ?.defaultYearLabel ??
      "",
  )?.year;
  const dataset = await loadIndicatorDataset(enrolledYear);
  const activeIndicators = indicators.filter(
    (i) => settings.enabledIndicators[i.financeTabId] !== false,
  );

  return settings.targetUniversities.map((uni) =>
    buildUniversityRawResult(dataset, activeIndicators, settings, uni),
  );
}

function buildUniversityRawResult(
  dataset: IndicatorDataset,
  activeIndicators: CompetitivenessIndicatorDef[],
  settings: CompetitivenessSettings,
  uni: TargetUniversityRow,
): UniversityRawResult {
  const indicators: RawIndicatorCell[] = activeIndicators.map((ind) => {
    const yearLabel =
      settings.indicatorYears[ind.financeTabId] ?? ind.defaultYearLabel;
    const { value, note } = resolveIndicatorValue(
      dataset,
      ind,
      yearLabel,
      uni,
    );
    return {
      financeTabId: ind.financeTabId,
      label: ind.label,
      yearLabel,
      rawValue: value,
      found: value != null,
      note,
    };
  });

  const enrolledYearLabel =
    settings.indicatorYears["enrolled-enrollment-rate"] ??
    activeIndicators.find((i) => i.financeTabId === "enrolled-enrollment-rate")
      ?.defaultYearLabel ??
    "";
  const enrolledYear = parseIndicatorYearLabel(enrolledYearLabel)?.year;
  const enrolledKind =
    classifyRepCohort(uni.schoolKind, uni.schoolDivision) === "junior-college"
      ? "junior-college"
      : "university";
  const enrolledMaps =
    enrolledYear != null
      ? dataset.enrolledStudentCounts.get(enrolledYear)
      : undefined;
  const enrolledFromAlimi =
    enrolledMaps != null
      ? lookupEnrolledStudentCount(
          enrolledMaps,
          uni.schoolCodeStd,
          enrolledKind,
        )
      : null;

  return {
    schoolCodeStd: uni.schoolCodeStd,
    schoolName: uni.schoolName,
    estb: uni.estb,
    schoolKind: uni.schoolKind,
    region: uni.region,
    enrolledTotal: enrolledFromAlimi ?? uni.enrolledTotal ?? null,
    indicators,
  };
}

/** 1단계: 분석지침에 따른 지표 원값 조회 */
export async function loadStep1RawIndicatorResults(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[] = getCompetitivenessIndicators(),
  indicatorIds?: string[],
): Promise<UniversityRawResult[]> {
  const ids = indicatorIds ?? resolveStep12IndicatorIds(settings, indicators);
  const indicatorById = new Map(indicators.map((i) => [i.financeTabId, i]));
  const step1Indicators = ids
    .map((id) => indicatorById.get(id))
    .filter((i): i is CompetitivenessIndicatorDef => i != null);

  const enrolledYear = parseIndicatorYearLabel(
    settings.indicatorYears["enrolled-enrollment-rate"] ??
      step1Indicators.find((i) => i.financeTabId === "enrolled-enrollment-rate")
        ?.defaultYearLabel ??
      "",
  )?.year;
  const dataset = await loadIndicatorDataset(enrolledYear);
  return settings.targetUniversities.map((uni) =>
    buildUniversityRawResult(dataset, step1Indicators, settings, uni),
  );
}

export function rawResultsToValueMap(
  rawResults: UniversityRawResult[],
): Map<string, Record<string, number>> {
  const map = new Map<string, Record<string, number>>();
  for (const uni of rawResults) {
    const entry: Record<string, number> = {};
    for (const cell of uni.indicators) {
      if (cell.found && cell.rawValue != null) {
        entry[cell.financeTabId] = cell.rawValue;
      }
    }
    map.set(uni.schoolCodeStd, entry);
  }
  return map;
}
