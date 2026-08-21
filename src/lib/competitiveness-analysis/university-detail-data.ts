import {
  getCompetitivenessIndicators,
  type CompetitivenessFinanceGroupId,
} from "@/lib/analysis/competitiveness-indicators";
import {
  buildRunAnalyticsRows,
  provinceToAnalyticsZone,
  schoolScaleFromEnrolled,
  type AnalyticsZone,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  CompetitivenessSettings,
  IndicatorRunCell,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";
import type { EditionTrendPoint } from "@/lib/competitiveness-analysis/editions-db";

export type { EditionTrendPoint };

/** 구버전 runResults는 dataMissing 필드가 없음 — undefined는 데이터 있음으로 처리 */
export function isIndicatorCellMissing(cell: IndicatorRunCell | undefined): boolean {
  if (!cell) return true;
  return cell.dataMissing === true;
}

export type BenchmarkAverages = {
  rawAvg: number | null;
  indexAvg: number | null;
  count: number;
};

export type IndicatorYearRow = {
  analysisYear: number;
  rawValue: number | null;
  indexScore: number | null;
  rank: number | null;
  dataMissing: boolean;
  national: BenchmarkAverages;
  zone: BenchmarkAverages;
  sido: BenchmarkAverages;
  scale: BenchmarkAverages;
};

export type GroupIndexAverages = {
  studentEnrollment: number;
  univFinance: number;
  corpFinance: number;
  composite: number;
};

export type GroupIndexYearRow = {
  analysisYear: number;
  studentEnrollment: number;
  univFinance: number;
  corpFinance: number;
  composite: number;
  compositeRank: number | null;
  national: GroupIndexAverages;
  zone: GroupIndexAverages;
  sido: GroupIndexAverages;
  scale: GroupIndexAverages;
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}

function schoolKindLabel(schoolKind: string): "4년제" | "전문대" {
  return matchesSchoolKindFilter(schoolKind, "junior-college")
    ? "전문대"
    : "4년제";
}

function enrolledForCode(
  code: string,
  point: EditionTrendPoint,
  enrolledByCode?: Map<string, number | null>,
): number | null {
  const fromMap = enrolledByCode?.get(code);
  if (fromMap != null) return fromMap;
  return (
    point.step1RawResults?.find((row) => row.schoolCodeStd === code)
      ?.enrolledTotal ?? null
  );
}

function filterCohort(
  runResults: UniversityRunResult[],
  schoolKind: "university" | "junior-college",
  scope:
    | { type: "national" }
    | { type: "zone"; zone: AnalyticsZone }
    | { type: "sido"; province: string },
): UniversityRunResult[] {
  return runResults.filter((row) => {
    if (!matchesSchoolKindFilter(row.schoolKind, schoolKind)) return false;
    if (scope.type === "national") return true;
    if (scope.type === "zone") {
      return provinceToAnalyticsZone(row.region) === scope.zone;
    }
    return row.region.trim() === scope.province.trim();
  });
}

function indicatorBenchmark(
  cohort: UniversityRunResult[],
  financeTabId: string,
): BenchmarkAverages {
  const rawValues: number[] = [];
  const indexValues: number[] = [];

  for (const row of cohort) {
    const cell = row.indicators.find((c) => c.financeTabId === financeTabId);
    if (isIndicatorCellMissing(cell) || !cell) continue;
    if (!Number.isNaN(cell.rawValue)) rawValues.push(cell.rawValue);
    if (!Number.isNaN(cell.indexScore)) indexValues.push(cell.indexScore);
  }

  return {
    rawAvg: avg(rawValues),
    indexAvg: avg(indexValues),
    count: cohort.length,
  };
}

function groupAveragesFromRows(rows: RunAnalyticsRow[]): GroupIndexAverages {
  return {
    studentEnrollment: avg(rows.map((row) => row.studentSectorScore)) ?? 0,
    univFinance: avg(rows.map((row) => row.univFinanceScore)) ?? 0,
    corpFinance: avg(rows.map((row) => row.foundationScore)) ?? 0,
    composite: avg(rows.map((row) => row.totalScore)) ?? 0,
  };
}

function enrolledLookupAsStep1(
  enrolledByCode?: Map<string, number | null>,
  step1?: UniversityRawResult[] | null,
): UniversityRawResult[] | null {
  const merged = new Map<string, number | null>();
  for (const row of step1 ?? []) {
    merged.set(row.schoolCodeStd, row.enrolledTotal ?? null);
  }
  if (enrolledByCode) {
    for (const [code, value] of enrolledByCode) {
      if (value != null) merged.set(code, value);
    }
  }
  if (merged.size === 0) return step1 ?? null;
  return [...merged.entries()].map(([schoolCodeStd, enrolledTotal]) => ({
    schoolCodeStd,
    schoolName: "",
    estb: "",
    schoolKind: "",
    region: "",
    enrolledTotal,
    indicators: [],
  }));
}

function groupAverages(
  cohort: UniversityRunResult[],
  settings: CompetitivenessSettings,
  step1?: UniversityRawResult[] | null,
) {
  const indicators = getCompetitivenessIndicators();
  return groupAveragesFromRows(
    buildRunAnalyticsRows(cohort, settings, indicators, step1),
  );
}

export function buildIndicatorYearRows(
  series: EditionTrendPoint[],
  schoolCodeStd: string,
  financeTabId: string,
  enrolledByCode?: Map<string, number | null>,
): IndicatorYearRow[] {
  return series
    .map((point) => {
      const school = point.runResults.find(
        (row) => row.schoolCodeStd === schoolCodeStd,
      );
      if (!school) return null;

      const schoolKind = matchesSchoolKindFilter(
        school.schoolKind,
        "junior-college",
      )
        ? "junior-college"
        : "university";
      const zone = provinceToAnalyticsZone(school.region);
      const nationalCohort = filterCohort(point.runResults, schoolKind, {
        type: "national",
      });
      const zoneCohort =
        zone === "기타"
          ? []
          : filterCohort(point.runResults, schoolKind, {
              type: "zone",
              zone,
            });
      const sidoCohort = filterCohort(point.runResults, schoolKind, {
        type: "sido",
        province: school.region,
      });
      const schoolScale = schoolScaleFromEnrolled(
        enrolledForCode(school.schoolCodeStd, point, enrolledByCode),
        schoolKindLabel(school.schoolKind),
      );
      const scaleCohort = schoolScale
        ? nationalCohort.filter(
            (row) =>
              schoolScaleFromEnrolled(
                enrolledForCode(row.schoolCodeStd, point, enrolledByCode),
                schoolKindLabel(row.schoolKind),
              ) === schoolScale,
          )
        : [];

      const cell = school.indicators.find((c) => c.financeTabId === financeTabId);
      const missing = isIndicatorCellMissing(cell);

      return {
        analysisYear: point.analysisYear,
        rawValue: missing ? null : (cell?.rawValue ?? null),
        indexScore: missing ? null : (cell?.indexScore ?? null),
        rank: missing ? null : (cell?.rank ?? null),
        dataMissing: missing,
        national: indicatorBenchmark(nationalCohort, financeTabId),
        zone: indicatorBenchmark(zoneCohort, financeTabId),
        sido: indicatorBenchmark(sidoCohort, financeTabId),
        scale: indicatorBenchmark(scaleCohort, financeTabId),
      };
    })
    .filter(Boolean) as IndicatorYearRow[];
}

export function buildGroupIndexYearRows(
  series: EditionTrendPoint[],
  schoolCodeStd: string,
  fallbackSettings?: CompetitivenessSettings,
  enrolledByCode?: Map<string, number | null>,
): GroupIndexYearRow[] {
  const indicators = getCompetitivenessIndicators();

  return series
    .map((point) => {
      const settings = point.settings ?? fallbackSettings;
      if (!settings) return null;

      const school = point.runResults.find(
        (row) => row.schoolCodeStd === schoolCodeStd,
      );
      if (!school) return null;

      const step1 = enrolledLookupAsStep1(
        enrolledByCode,
        point.step1RawResults,
      );
      const analytics = buildRunAnalyticsRows(
        [school],
        settings,
        indicators,
        step1,
      )[0];
      if (!analytics) return null;

      const schoolKind = matchesSchoolKindFilter(
        school.schoolKind,
        "junior-college",
      )
        ? "junior-college"
        : "university";
      const zone = provinceToAnalyticsZone(school.region);
      const nationalCohort = filterCohort(point.runResults, schoolKind, {
        type: "national",
      });
      const zoneCohort =
        zone === "기타"
          ? []
          : filterCohort(point.runResults, schoolKind, {
              type: "zone",
              zone,
            });
      const sidoCohort = filterCohort(point.runResults, schoolKind, {
        type: "sido",
        province: school.region,
      });
      const nationalAnalytics = buildRunAnalyticsRows(
        nationalCohort,
        settings,
        indicators,
        step1,
      );
      const scaleRows = analytics.scale
        ? nationalAnalytics.filter((row) => row.scale === analytics.scale)
        : [];

      return {
        analysisYear: point.analysisYear,
        studentEnrollment: analytics.studentSectorScore,
        univFinance: analytics.univFinanceScore,
        corpFinance: analytics.foundationScore,
        composite: analytics.totalScore,
        compositeRank: school.excludedFromRanking ? null : school.compositeRank,
        national: groupAveragesFromRows(nationalAnalytics),
        zone: groupAverages(zoneCohort, settings, step1),
        sido: groupAverages(sidoCohort, settings, step1),
        scale: groupAveragesFromRows(scaleRows),
      };
    })
    .filter(Boolean) as GroupIndexYearRow[];
}

export function groupIndicatorsByCategory(
  financeTabIds: string[] = getCompetitivenessIndicators().map(
    (indicator) => indicator.financeTabId,
  ),
): Record<CompetitivenessFinanceGroupId, { id: string; label: string }[]> {
  const indicators = getCompetitivenessIndicators();
  const grouped: Record<
    CompetitivenessFinanceGroupId,
    { id: string; label: string }[]
  > = {
    "student-enrollment": [],
    "univ-finance": [],
    "corp-finance": [],
  };

  for (const id of financeTabIds) {
    const indicator = indicators.find((item) => item.financeTabId === id);
    if (!indicator) continue;
    grouped[indicator.categoryId].push({
      id: indicator.financeTabId,
      label: indicator.label,
    });
  }

  return grouped;
}

export function countSchoolKinds(runResults: UniversityRunResult[]) {
  let university = 0;
  let juniorCollege = 0;
  for (const row of runResults) {
    if (matchesSchoolKindFilter(row.schoolKind, "junior-college")) {
      juniorCollege += 1;
    } else if (matchesSchoolKindFilter(row.schoolKind, "university")) {
      university += 1;
    }
  }
  return { university, juniorCollege };
}
