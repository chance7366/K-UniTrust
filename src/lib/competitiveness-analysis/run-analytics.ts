import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import type { CompetitivenessFinanceGroupId } from "@/lib/analysis/competitiveness-indicators";
import {
  ANALYTICS_ZONES,
  type AnalyticsZone,
  zoneForSido,
} from "@/lib/analysis/korea-analytics-zones";
import {
  downloadExportCsv,
  downloadExportXlsx,
  type ExportCell,
} from "@/lib/competitiveness-analysis/export-run-results";
import { absoluteLabelsFor } from "@/lib/competitiveness-analysis/analysis-policy";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

import {
  calculateDiagnosticGrade,
  formatDiagnosticGradeLabel,
  gradeFromCompositeScore,
  indicatorRanksFromRow,
  type AnalyticsGrade,
} from "@/lib/competitiveness-analysis/diagnostic-grade";
import {
  schoolScaleFromEnrolled,
  type SchoolScaleLabel,
} from "@/lib/competitiveness-analysis/school-scale";

export { schoolScaleFromEnrolled, type SchoolScaleLabel };

export type RunAnalyticsRow = {
  schoolCodeStd: string;
  rank: number;
  name: string;
  type: "4년제" | "전문대";
  province: string;
  zone: string;
  enrolledTotal: number | null;
  scale: SchoolScaleLabel | null;
  freshRate: number | null;
  enrolledRate: number | null;
  dropRate: number | null;
  fundRate: number | null;
  freshmanIndex: number | null;
  enrolledIndex: number | null;
  dropoutIndex: number | null;
  fundIndex: number | null;
  benefitIndex: number | null;
  tuitionIndex: number | null;
  propertyIndex: number | null;
  transferIndex: number | null;
  studentSectorScore: number;
  univFinanceScore: number;
  foundationScore: number;
  totalScore: number;
  grade: AnalyticsGrade | null;
  gradeCapped: boolean;
  excludedFromRanking: boolean;
  absoluteLabels: string[];
};

export { ANALYTICS_ZONES, type AnalyticsZone };

export function provinceToAnalyticsZone(province: string): AnalyticsZone | "기타" {
  return zoneForSido(province) ?? "기타";
}

function indicatorRaw(
  row: UniversityRunResult,
  id: string,
): number | null {
  const cell = row.indicators.find((c) => c.financeTabId === id);
  if (!cell || Number.isNaN(cell.rawValue)) return null;
  return cell.rawValue;
}

function indicatorIndex(
  row: UniversityRunResult,
  id: string,
): number | null {
  const cell = row.indicators.find((c) => c.financeTabId === id);
  if (!cell || cell.dataMissing || Number.isNaN(cell.indexScore)) return null;
  return cell.indexScore;
}

function computeCategoryScore(
  row: UniversityRunResult,
  categoryId: CompetitivenessFinanceGroupId,
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): number {
  let composite = 0;
  let weightSum = 0;

  for (const cell of row.indicators) {
    const ind = indicators.find((i) => i.financeTabId === cell.financeTabId);
    if (!ind || ind.categoryId !== categoryId) continue;
    if (cell.dataMissing) continue;
    if (!settings.enabledIndicators[ind.financeTabId]) continue;
    const indW = settings.indicatorWeights[ind.financeTabId] ?? 0;
    if (indW <= 0) continue;
    composite += cell.indexScore * (indW / 100);
    weightSum += indW / 100;
  }

  return weightSum > 0 ? Math.round((composite / weightSum) * 10) / 10 : 0;
}

export {
  type AnalyticsGrade,
  DIAGNOSTIC_GRADE_CUTOFFS,
  formatDiagnosticGradeLabel,
  gradeFromCompositeScore,
} from "@/lib/competitiveness-analysis/diagnostic-grade";

export function gradeBadgeClass(grade: AnalyticsGrade | null): string {
  if (grade == null) return "cra-grade cra-grade-muted";
  switch (grade) {
    case "S":
      return "cra-grade cra-grade-s";
    case "A":
      return "cra-grade cra-grade-a";
    case "B":
      return "cra-grade cra-grade-b";
    case "C":
      return "cra-grade cra-grade-c";
    case "D":
      return "cra-grade cra-grade-d";
    default:
      return "cra-grade cra-grade-e";
  }
}

export function gradeScoreClass(grade: AnalyticsGrade | null): string {
  if (grade == null) return "s3t-score text-muted";
  return `s3t-score s3t-score-${grade.toLowerCase()}`;
}

function cohortSizeBySchoolKind(
  runResults: UniversityRunResult[],
  isJunior: boolean,
): number {
  return runResults.filter((r) =>
    matchesSchoolKindFilter(
      r.schoolKind,
      isJunior ? "junior-college" : "university",
    ),
  ).length;
}

export function competitivenessGradeBySchoolCode(
  runResults: UniversityRunResult[],
): Map<string, { grade: AnalyticsGrade | null; label: string }> {
  const universityCohortSize = cohortSizeBySchoolKind(runResults, false);
  const juniorCohortSize = cohortSizeBySchoolKind(runResults, true);
  const map = new Map<string, { grade: AnalyticsGrade | null; label: string }>();
  for (const row of runResults) {
    const isJunior = matchesSchoolKindFilter(row.schoolKind, "junior-college");
    const cohortSize = isJunior ? juniorCohortSize : universityCohortSize;
    if (row.excludedFromRanking) {
      map.set(row.schoolCodeStd, {
        grade: null,
        label: formatDiagnosticGradeLabel(null, false, true),
      });
      continue;
    }
    const result = calculateDiagnosticGrade(
      row.compositeIndex,
      indicatorRanksFromRow(row),
      cohortSize,
    );
    map.set(row.schoolCodeStd, {
      grade: result.grade,
      label: formatDiagnosticGradeLabel(result.grade, result.gradeCapped, false),
    });
  }
  return map;
}

export function buildRunAnalyticsRows(
  runResults: UniversityRunResult[],
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  step1RawResults?: UniversityRawResult[] | null,
): RunAnalyticsRow[] {
  const universityCohortSize = cohortSizeBySchoolKind(runResults, false);
  const juniorCohortSize = cohortSizeBySchoolKind(runResults, true);
  const enrolledFromSettings = new Map(
    settings.targetUniversities.map((u) => [
      u.schoolCodeStd,
      u.enrolledTotal ?? null,
    ]),
  );
  const enrolledFromStep1 = new Map(
    (step1RawResults ?? []).map((u) => [u.schoolCodeStd, u.enrolledTotal ?? null]),
  );
  const targetByCode = new Map(
    settings.targetUniversities.map((u) => [u.schoolCodeStd, u]),
  );

  return runResults.map((row) => {
    const isJunior = matchesSchoolKindFilter(row.schoolKind, "junior-college");
    const target = targetByCode.get(row.schoolCodeStd);
    const region = target?.region?.trim() || row.region;
    const zone = provinceToAnalyticsZone(region);
    const cohortSize = isJunior ? juniorCohortSize : universityCohortSize;
    const type = isJunior ? "전문대" : "4년제";
    const enrolledTotal =
      enrolledFromSettings.get(row.schoolCodeStd) ??
      enrolledFromStep1.get(row.schoolCodeStd) ??
      null;
    const settingsLabels = target ? absoluteLabelsFor(target) : [];

    let grade: AnalyticsGrade | null = null;
    let gradeCapped = false;
    if (!row.excludedFromRanking) {
      const result = calculateDiagnosticGrade(
        row.compositeIndex,
        indicatorRanksFromRow(row),
        cohortSize,
      );
      grade = result.grade;
      gradeCapped = result.gradeCapped;
    }

    return {
      schoolCodeStd: row.schoolCodeStd,
      rank: row.compositeRank,
      name: row.schoolName,
      type,
      province: region,
      zone,
      enrolledTotal,
      scale: schoolScaleFromEnrolled(enrolledTotal, type),
      freshRate: indicatorRaw(row, "freshman-enrollment-rate"),
      enrolledRate: indicatorRaw(row, "enrolled-enrollment-rate"),
      dropRate: indicatorRaw(row, "dropout-rate"),
      fundRate: indicatorRaw(row, "fund-secure-rate"),
      freshmanIndex: indicatorIndex(row, "freshman-enrollment-rate"),
      enrolledIndex: indicatorIndex(row, "enrolled-enrollment-rate"),
      dropoutIndex: indicatorIndex(row, "dropout-rate"),
      fundIndex: indicatorIndex(row, "fund-secure-rate"),
      benefitIndex: indicatorIndex(row, "financial-support-benefit-rate"),
      tuitionIndex: indicatorIndex(row, "tuition-dependency-rate"),
      propertyIndex: indicatorIndex(row, "income-property-secure-rate"),
      transferIndex: indicatorIndex(row, "corp-transfer-ratio"),
      studentSectorScore: computeCategoryScore(
        row,
        "student-enrollment",
        settings,
        indicators,
      ),
      univFinanceScore: computeCategoryScore(
        row,
        "univ-finance",
        settings,
        indicators,
      ),
      foundationScore: computeCategoryScore(
        row,
        "corp-finance",
        settings,
        indicators,
      ),
      totalScore: row.compositeIndex,
      grade,
      gradeCapped,
      excludedFromRanking: row.excludedFromRanking,
      absoluteLabels: settingsLabels.length ? settingsLabels : row.absoluteLabels,
    };
  });
}

export function buildAnalyticsExportAoa(rows: RunAnalyticsRow[]): ExportCell[][] {
  const header: ExportCell[] = [
    "종합순위",
    "학교코드",
    "학교명",
    "유형",
    "시도",
    "권역",
    "재학생수",
    "규모",
    "진단등급",
    "신입생충원율(Step1)",
    "재학생충원율(Step1)",
    "중도탈락률(Step1)",
    "자금확보율(Step1)",
    "학생충원지수",
    "신입생충원율지수",
    "재학생충원율지수",
    "중도탈락율지수",
    "대학재정지수",
    "자금확보율지수",
    "재정지원수혜율지수",
    "등록금의존율지수",
    "법인재정지수",
    "수익용재산확보율지수",
    "법인전입금비율지수",
    "종합점수(Step3)",
    "지표불균형강등",
    "순위제외",
    "절대지표",
  ];
  const dataRows = rows.map((d) => [
    d.excludedFromRanking || !d.rank ? "" : d.rank,
    d.schoolCodeStd,
    d.name,
    d.type,
    d.province,
    d.zone,
    d.enrolledTotal == null || Number.isNaN(d.enrolledTotal)
      ? ""
      : Math.trunc(d.enrolledTotal),
    d.scale ?? "",
    d.grade ?? "",
    d.freshRate ?? "",
    d.enrolledRate ?? "",
    d.dropRate ?? "",
    d.fundRate ?? "",
    d.studentSectorScore,
    d.freshmanIndex ?? "",
    d.enrolledIndex ?? "",
    d.dropoutIndex ?? "",
    d.univFinanceScore,
    d.fundIndex ?? "",
    d.benefitIndex ?? "",
    d.tuitionIndex ?? "",
    d.foundationScore,
    d.propertyIndex ?? "",
    d.transferIndex ?? "",
    d.totalScore,
    d.gradeCapped ? "Y" : "",
    d.excludedFromRanking ? "Y" : "",
    d.absoluteLabels.join(";"),
  ]);
  return [header, ...dataRows];
}

export function exportAnalyticsCsv(rows: RunAnalyticsRow[], filename: string) {
  downloadExportCsv(filename, buildAnalyticsExportAoa(rows));
}

export function exportAnalyticsXlsx(rows: RunAnalyticsRow[], filename: string) {
  downloadExportXlsx(filename, buildAnalyticsExportAoa(rows), "3단계_종합");
}

export function analyticsMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 100) / 100
    : Math.round(sorted[mid]! * 100) / 100;
}

export function fmtRate(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

export function fmtScore(v: number): string {
  if (Number.isNaN(v)) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}
