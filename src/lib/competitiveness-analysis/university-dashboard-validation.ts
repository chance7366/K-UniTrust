import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import type { EditionTrendPoint } from "@/lib/competitiveness-analysis/editions-db";
import {
  getEditionFull,
  loadEditionTrendSeries,
} from "@/lib/competitiveness-analysis/editions-db";
import {
  buildRunAnalyticsRows,
  provinceToAnalyticsZone,
  type AnalyticsZone,
} from "@/lib/competitiveness-analysis/run-analytics";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  CompetitivenessSettings,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";
import {
  buildGroupIndexYearRows,
  buildIndicatorYearRows,
  isIndicatorCellMissing,
} from "@/lib/competitiveness-analysis/university-detail-data";

const INDICATOR_IDS = getCompetitivenessIndicators().map((i) => i.financeTabId);

export type UniversityDashboardValidationMismatch = {
  school: string;
  code: string;
  kind: "university" | "junior-college";
  year: number;
  field: string;
  expected: string;
  actual: string;
};

export type UniversityDashboardValidationReport = {
  analysisYear: number;
  universitySampleCount: number;
  juniorCollegeSampleCount: number;
  checksPerSchool: number;
  totalChecks: number;
  mismatches: UniversityDashboardValidationMismatch[];
  passed: boolean;
};

export type UniversityDashboardValidationOptions = {
  analysisYear?: number;
  /** 연도당 표본 수 (대학·전문대 각각). 기본 10 */
  sampleSize?: number;
  /** API/DB에서 series를 직접 주입 (테스트용) */
  series?: EditionTrendPoint[];
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}

function eqNum(a: number | null | undefined, b: number | null | undefined) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 0.05;
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

function expectedIndicatorBenchmark(
  cohort: UniversityRunResult[],
  financeTabId: string,
) {
  const indexValues: number[] = [];
  for (const row of cohort) {
    const cell = row.indicators.find((c) => c.financeTabId === financeTabId);
    if (isIndicatorCellMissing(cell)) continue;
    if (!Number.isNaN(cell!.indexScore)) indexValues.push(cell!.indexScore);
  }
  return avg(indexValues);
}

export function pickUniversityDashboardSampleSchools(
  runResults: UniversityRunResult[],
  kind: "university" | "junior-college",
  count: number,
): UniversityRunResult[] {
  const rows = runResults
    .filter((r) => matchesSchoolKindFilter(r.schoolKind, kind))
    .filter((r) => !r.excludedFromRanking && r.compositeRank > 0)
    .sort((a, b) => a.compositeRank - b.compositeRank);

  if (rows.length <= count) return rows;
  if (count <= 1) return rows.slice(0, count);

  const picked: UniversityRunResult[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor((i * (rows.length - 1)) / (count - 1));
    picked.push(rows[idx]!);
  }
  return picked;
}

function pushMismatch(
  mismatches: UniversityDashboardValidationMismatch[],
  base: Omit<UniversityDashboardValidationMismatch, "field" | "expected" | "actual">,
  field: string,
  expected: string | number | null | undefined,
  actual: string | number | null | undefined,
) {
  mismatches.push({
    ...base,
    field,
    expected: String(expected),
    actual: String(actual),
  });
}

function validateSchoolAtYear(
  school: UniversityRunResult,
  point: EditionTrendPoint,
  series: EditionTrendPoint[],
  mismatches: UniversityDashboardValidationMismatch[],
) {
  const kind = matchesSchoolKindFilter(school.schoolKind, "junior-college")
    ? "junior-college"
    : "university";
  const base = {
    school: school.schoolName,
    code: school.schoolCodeStd,
    kind,
    year: point.analysisYear,
  } as const;

  const zone = provinceToAnalyticsZone(school.region);
  const nationalCohort = filterCohort(point.runResults, kind, { type: "national" });
  const zoneCohort =
    zone === "기타"
      ? []
      : filterCohort(point.runResults, kind, { type: "zone", zone });
  const sidoCohort = filterCohort(point.runResults, kind, {
    type: "sido",
    province: school.region,
  });

  for (const financeTabId of INDICATOR_IDS) {
    const cell = school.indicators.find((c) => c.financeTabId === financeTabId);
    const rows = buildIndicatorYearRows(series, school.schoolCodeStd, financeTabId);
    const row = rows.find((r) => r.analysisYear === point.analysisYear);

    if (!row) {
      pushMismatch(mismatches, base, `${financeTabId}:row-missing`, "row exists", "null");
      continue;
    }

    const missing = isIndicatorCellMissing(cell);
    const expRaw = missing ? null : (cell?.rawValue ?? null);
    const expIdx = missing ? null : (cell?.indexScore ?? null);
    const expRank = missing ? null : cell?.rank && cell.rank > 0 ? cell.rank : null;

    if (!eqNum(row.rawValue, expRaw)) {
      pushMismatch(mismatches, base, `${financeTabId}:rawValue`, expRaw, row.rawValue);
    }
    if (!eqNum(row.indexScore, expIdx)) {
      pushMismatch(mismatches, base, `${financeTabId}:indexScore`, expIdx, row.indexScore);
    }
    if (row.rank !== expRank) {
      pushMismatch(mismatches, base, `${financeTabId}:rank`, expRank, row.rank);
    }

    const expNational = expectedIndicatorBenchmark(nationalCohort, financeTabId);
    const expZone =
      zoneCohort.length > 0
        ? expectedIndicatorBenchmark(zoneCohort, financeTabId)
        : null;
    const expSido = expectedIndicatorBenchmark(sidoCohort, financeTabId);

    if (!eqNum(row.national.indexAvg, expNational)) {
      pushMismatch(
        mismatches,
        base,
        `${financeTabId}:nationalAvg`,
        expNational,
        row.national.indexAvg,
      );
    }
    if (!eqNum(row.zone.indexAvg, expZone)) {
      pushMismatch(mismatches, base, `${financeTabId}:zoneAvg`, expZone, row.zone.indexAvg);
    }
    if (!eqNum(row.sido.indexAvg, expSido)) {
      pushMismatch(mismatches, base, `${financeTabId}:sidoAvg`, expSido, row.sido.indexAvg);
    }
  }

  const settings = point.settings;
  const groupRows = buildGroupIndexYearRows(series, school.schoolCodeStd, settings);
  const groupRow = groupRows.find((r) => r.analysisYear === point.analysisYear);
  if (!groupRow) {
    pushMismatch(mismatches, base, "groupRow-missing", "row exists", "null");
    return;
  }

  const expCompositeRank = school.excludedFromRanking ? null : school.compositeRank;
  if (groupRow.compositeRank !== expCompositeRank) {
    pushMismatch(
      mismatches,
      base,
      "compositeRank",
      expCompositeRank,
      groupRow.compositeRank,
    );
  }
  if (!eqNum(groupRow.composite, school.compositeIndex)) {
    pushMismatch(
      mismatches,
      base,
      "compositeIndex",
      school.compositeIndex,
      groupRow.composite,
    );
  }

  const indicators = getCompetitivenessIndicators();
  const analytics = buildRunAnalyticsRows([school], settings, indicators)[0];
  if (analytics) {
    if (!eqNum(groupRow.studentEnrollment, analytics.studentSectorScore)) {
      pushMismatch(
        mismatches,
        base,
        "studentEnrollmentIndex",
        analytics.studentSectorScore,
        groupRow.studentEnrollment,
      );
    }
    if (!eqNum(groupRow.univFinance, analytics.univFinanceScore)) {
      pushMismatch(
        mismatches,
        base,
        "univFinanceIndex",
        analytics.univFinanceScore,
        groupRow.univFinance,
      );
    }
    if (!eqNum(groupRow.corpFinance, analytics.foundationScore)) {
      pushMismatch(
        mismatches,
        base,
        "corpFinanceIndex",
        analytics.foundationScore,
        groupRow.corpFinance,
      );
    }
  }

  const cohortRows = (cohort: UniversityRunResult[]) =>
    buildRunAnalyticsRows(cohort, settings, indicators);

  const groupAvg = (
    rows: ReturnType<typeof buildRunAnalyticsRows>,
    key: "studentSectorScore" | "univFinanceScore" | "foundationScore" | "totalScore",
  ) => avg(rows.map((r) => r[key])) ?? 0;

  const groupKeys = [
    ["studentEnrollment", "studentSectorScore"] as const,
    ["univFinance", "univFinanceScore"] as const,
    ["corpFinance", "foundationScore"] as const,
    ["composite", "totalScore"] as const,
  ];

  for (const [outKey, inKey] of groupKeys) {
    const exp = groupAvg(cohortRows(nationalCohort), inKey);
    if (!eqNum(groupRow.national[outKey], exp)) {
      pushMismatch(
        mismatches,
        base,
        `national:${outKey}`,
        exp,
        groupRow.national[outKey],
      );
    }
  }

  if (zoneCohort.length > 0) {
    const zoneRows = cohortRows(zoneCohort);
    for (const [outKey, inKey] of groupKeys) {
      const exp = groupAvg(zoneRows, inKey);
      if (!eqNum(groupRow.zone[outKey], exp)) {
        pushMismatch(mismatches, base, `zone:${outKey}`, exp, groupRow.zone[outKey]);
      }
    }
  }

  const sidoRows = cohortRows(sidoCohort);
  for (const [outKey, inKey] of groupKeys) {
    const exp = groupAvg(sidoRows, inKey);
    if (!eqNum(groupRow.sido[outKey], exp)) {
      pushMismatch(mismatches, base, `sido:${outKey}`, exp, groupRow.sido[outKey]);
    }
  }
}

export async function runUniversityDashboardValidation(
  options: UniversityDashboardValidationOptions = {},
): Promise<UniversityDashboardValidationReport> {
  const sampleSize = options.sampleSize ?? 10;
  const series = options.series ?? (await loadEditionTrendSeries());

  if (!series.length) {
    return {
      analysisYear: options.analysisYear ?? 0,
      universitySampleCount: 0,
      juniorCollegeSampleCount: 0,
      checksPerSchool: 0,
      totalChecks: 0,
      mismatches: [
        {
          school: "—",
          code: "—",
          kind: "university",
          year: 0,
          field: "series-empty",
          expected: "trend series",
          actual: "empty",
        },
      ],
      passed: false,
    };
  }

  const analysisYear =
    options.analysisYear ??
    series.map((s) => s.analysisYear).sort((a, b) => b - a)[0]!;

  const point = series.find((s) => s.analysisYear === analysisYear);
  if (!point?.runResults?.length) {
    return {
      analysisYear,
      universitySampleCount: 0,
      juniorCollegeSampleCount: 0,
      checksPerSchool: 0,
      totalChecks: 0,
      mismatches: [
        {
          school: "—",
          code: "—",
          kind: "university",
          year: analysisYear,
          field: "runResults-empty",
          expected: "runResults",
          actual: "empty",
        },
      ],
      passed: false,
    };
  }

  if (!point.settings) {
    const edition = await getEditionFull(analysisYear);
    if (edition?.settings) {
      point.settings = edition.settings;
    }
  }

  const univSample = pickUniversityDashboardSampleSchools(
    point.runResults,
    "university",
    sampleSize,
  );
  const jcSample = pickUniversityDashboardSampleSchools(
    point.runResults,
    "junior-college",
    sampleSize,
  );

  const mismatches: UniversityDashboardValidationMismatch[] = [];
  for (const school of [...univSample, ...jcSample]) {
    validateSchoolAtYear(school, point, series, mismatches);
  }

  const checksPerSchool = INDICATOR_IDS.length * 6 + 4 + 4 * 3;
  const totalChecks = (univSample.length + jcSample.length) * checksPerSchool;

  return {
    analysisYear,
    universitySampleCount: univSample.length,
    juniorCollegeSampleCount: jcSample.length,
    checksPerSchool,
    totalChecks,
    mismatches,
    passed: mismatches.length === 0,
  };
}

export function formatUniversityDashboardValidationReport(
  report: UniversityDashboardValidationReport,
): string {
  const lines: string[] = [
    `대학별경쟁력 화면 데이터 검증 (${report.analysisYear}년)`,
    `표본: 대학 ${report.universitySampleCount} · 전문대 ${report.juniorCollegeSampleCount}`,
    `검증 항목: 지표 8×(값·순위·전국·권역·시도) + 그룹/종합 + 평균`,
  ];

  if (report.passed) {
    lines.push(`결과: PASS (${report.totalChecks}항목)`);
    return lines.join("\n");
  }

  lines.push(`결과: FAIL (${report.mismatches.length}건 불일치)`);
  for (const m of report.mismatches.slice(0, 20)) {
    lines.push(
      `  [${m.kind}] ${m.school} (${m.code}) ${m.year} ${m.field}: expected=${m.expected} actual=${m.actual}`,
    );
  }
  if (report.mismatches.length > 20) {
    lines.push(`  ... 외 ${report.mismatches.length - 20}건`);
  }
  return lines.join("\n");
}
