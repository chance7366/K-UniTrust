import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import {
  calculateDiagnosticGrade,
  formatDiagnosticGradeLabel,
  indicatorRanksFromRow,
} from "@/lib/competitiveness-analysis/diagnostic-grade";
import type { EditionTrendPoint } from "@/lib/competitiveness-analysis/editions-db";
import { matchesSchoolKindFilter, type SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import {
  provinceToAnalyticsZone,
  schoolScaleFromEnrolled,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  buildGroupIndexYearRows,
  buildIndicatorYearRows,
  groupIndicatorsByCategory,
} from "@/lib/competitiveness-analysis/university-detail-data";
import { buildUniversityV2Analytics } from "@/lib/competitiveness-analysis/university-v2-analytics";

import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";

function buildEnrolledByCode(
  editionPoint: EditionTrendPoint,
  settings: CompetitivenessSettings,
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const row of editionPoint.step1RawResults ?? []) {
    map.set(row.schoolCodeStd, row.enrolledTotal ?? null);
  }
  for (const row of settings.targetUniversities) {
    if (row.enrolledTotal != null) {
      map.set(row.schoolCodeStd, row.enrolledTotal);
    }
  }
  return map;
}

function cohortSizeForSchool(
  runResults: EditionTrendPoint["runResults"],
  schoolKind: SchoolKindFilter,
): number {
  return runResults.filter((row) =>
    matchesSchoolKindFilter(row.schoolKind, schoolKind),
  ).length;
}

export function buildUniversityReportPayload(args: {
  analysisYear: number;
  schoolCodeStd: string;
  series: EditionTrendPoint[];
  settings: CompetitivenessSettings;
  lastRunAt: string | null;
}): UniversityReportPayload {
  const { analysisYear, schoolCodeStd, series, settings, lastRunAt } = args;

  const editionPoint = series.find((point) => point.analysisYear === analysisYear);
  if (!editionPoint?.runResults.length) {
    throw new Error(`${analysisYear}년 분석결과가 없습니다.`);
  }

  const school = editionPoint.runResults.find(
    (row) => row.schoolCodeStd === schoolCodeStd,
  );
  if (!school) {
    throw new Error(
      `${analysisYear}년 분석결과에 학교코드 ${schoolCodeStd}가 없습니다.`,
    );
  }

  const enrolledByCode = buildEnrolledByCode(editionPoint, settings);
  const enrolledTotal = enrolledByCode.get(schoolCodeStd) ?? null;

  const schoolKindFilter = matchesSchoolKindFilter(
    school.schoolKind,
    "junior-college",
  )
    ? "junior-college"
    : "university";

  const cohortSize = cohortSizeForSchool(
    editionPoint.runResults,
    schoolKindFilter,
  );

  const gradeResult = school.excludedFromRanking
    ? null
    : calculateDiagnosticGrade(
        school.compositeIndex,
        indicatorRanksFromRow(school),
        cohortSize,
      );

  const zone = provinceToAnalyticsZone(school.region);
  const scale = schoolScaleFromEnrolled(
    enrolledTotal,
    schoolKindFilter === "junior-college" ? "전문대" : "4년제",
  );

  const groupIndexRows = buildGroupIndexYearRows(
    series,
    schoolCodeStd,
    settings,
    enrolledByCode,
  );

  const groupedIndicators = groupIndicatorsByCategory();
  const indicatorSummaryRows: {
    categoryId: string;
    categoryLabel: string;
    indicatorId: string;
    indicatorLabel: string;
    rawValue: number | null;
    indexScore: number | null;
    rank: number | null;
    dataMissing: boolean;
    nationalIndexAvg: number | null;
    zoneIndexAvg: number | null;
    sidoIndexAvg: number | null;
    scaleIndexAvg: number | null;
  }[] = [];

  const categoryLabels: Record<string, string> = {
    "student-enrollment": "학생충원",
    "univ-finance": "대학재정",
    "corp-finance": "법인재정",
  };

  const indicatorYearRowsById: Record<string, ReturnType<typeof buildIndicatorYearRows>> =
    {};

  for (const [categoryId, indicators] of Object.entries(groupedIndicators)) {
    for (const indicator of indicators) {
      const yearRows = buildIndicatorYearRows(
        series,
        schoolCodeStd,
        indicator.id,
        enrolledByCode,
      );
      indicatorYearRowsById[indicator.id] = yearRows;

      const currentRow = yearRows.find((row) => row.analysisYear === analysisYear);
      indicatorSummaryRows.push({
        categoryId,
        categoryLabel: categoryLabels[categoryId] ?? categoryId,
        indicatorId: indicator.id,
        indicatorLabel: indicator.label,
        rawValue: currentRow?.rawValue ?? null,
        indexScore: currentRow?.indexScore ?? null,
        rank: currentRow?.rank ?? null,
        dataMissing: currentRow?.dataMissing ?? true,
        nationalIndexAvg: currentRow?.national.indexAvg ?? null,
        zoneIndexAvg: currentRow?.zone.indexAvg ?? null,
        sidoIndexAvg: currentRow?.sido.indexAvg ?? null,
        scaleIndexAvg: currentRow?.scale.indexAvg ?? null,
      });
    }
  }

  return {
    analysisYear,
    schoolCodeStd,
    schoolName: school.schoolName,
    schoolKind: school.schoolKind,
    estb: school.estb,
    region: school.region,
    zone: zone === "기타" ? null : zone,
    scaleLabel: scale,
    enrolledTotal,
    compositeIndex: school.compositeIndex,
    compositeRank: school.excludedFromRanking ? null : school.compositeRank,
    cohortSize,
    diagnosticGrade: gradeResult
      ? formatDiagnosticGradeLabel(
          gradeResult.grade,
          gradeResult.gradeCapped,
          school.excludedFromRanking,
        )
      : school.excludedFromRanking
        ? "등급제외"
        : "—",
    absoluteFlags: school.absoluteLabels,
    groupIndexRows,
    indicatorSummaryRows,
    indicatorYearRowsById,
    v2Analytics: buildUniversityV2Analytics({
      analysisYear,
      schoolName: school.schoolName,
      compositeIndex: school.compositeIndex,
      diagnosticGrade: gradeResult
        ? formatDiagnosticGradeLabel(
            gradeResult.grade,
            gradeResult.gradeCapped,
            school.excludedFromRanking,
          )
        : school.excludedFromRanking
          ? "등급제외"
          : "—",
      cohortSize,
      groupIndexRows,
      indicatorSummaryRows,
      indicatorYearRowsById,
      settings,
    }),
    settingsAtRun: {
      categoryWeights: settings.categoryWeights,
      indicatorWeights: settings.indicatorWeights,
      indicatorYears: settings.indicatorYears,
    },
    lastRunAt,
  };
}
