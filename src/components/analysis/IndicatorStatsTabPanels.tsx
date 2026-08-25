"use client";

import { IndicatorStatsTables } from "@/components/analysis/IndicatorStatsTables";
import { useEnrolledScaleLookup } from "@/components/analysis/EnrolledScaleLookupContext";
import { splitTwoSchoolByDivision } from "@/lib/analysis/all-universities-cohort";
import {
  filterIndicatorGeoRows,
  type IndicatorStatsChartFilters,
} from "@/lib/analysis/indicator-stats-geo";
import {
  DROPOUT_INDICATOR_STATS_COLUMNS,
  ENROLLED_INDICATOR_STATS_COLUMNS,
  FIN_SUPPORT_INDICATOR_STATS_COLUMNS,
  FRESHMAN_INDICATOR_STATS_COLUMNS,
  FUND_SECURE_INDICATOR_STATS_COLUMNS,
  INCOME_PROPERTY_INDICATOR_STATS_COLUMNS,
  TUITION_DEP_INDICATOR_STATS_COLUMNS,
  CORP_TRANSFER_INDICATOR_STATS_COLUMNS,
  buildCorpTransferIndicatorStats,
  buildDropoutIndicatorStats,
  buildEnrolledIndicatorStats,
  buildFinSupportIndicatorStats,
  buildFreshmanIndicatorStats,
  buildFundSecureIndicatorStats,
  buildIncomePropertyIndicatorStats,
  buildTuitionDepIndicatorStats,
} from "@/lib/analysis/indicator-stats";
import type { FreshmanRepCohort, FreshmanRepRow, FreshmanRepViewCohort } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import type { EnrolledRepRow } from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import type { DropoutRepRow } from "@/lib/analysis/dropout-rate-rep-rollup";
import type { FundSecureRepRow } from "@/lib/analysis/fund-secure-rate-rep-rollup";
import type { FinSupportRepRow } from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import type { TuitionDepRepRow } from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import type { CorpTransferRepRow } from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import type { IncomePropertyRepRow } from "@/lib/analysis/income-property-secure-rate-rep-rollup";

const NOTE =
  "원자료 합산입니다. 율은 합산 뒤 기존 분모 규칙으로 다시 계산합니다. 표 순서는 학교구분별 → 규모별 → 권역별 → 지역별입니다.";

type StudentCohortRows<T> = Record<FreshmanRepCohort, T[]>;
type TwoSchoolRows<T> = Record<"university" | "junior-college", T[]>;

function filterByCohort<T extends { year: number; schoolRepCode: string; region: string; schoolDivision: string; estb: string }>(
  rows: StudentCohortRows<T> | undefined,
  filters: IndicatorStatsChartFilters,
): StudentCohortRows<T> | undefined {
  if (!rows) return undefined;
  return {
    university: filterIndicatorGeoRows(rows.university, filters),
    graduate: filterIndicatorGeoRows(rows.graduate, filters),
    combined: filterIndicatorGeoRows(rows.combined, filters),
    "junior-college": filterIndicatorGeoRows(rows["junior-college"], filters),
  };
}

function filterTwoSchool<T extends { year: number; schoolRepCode: string; region: string; schoolDivision: string; estb: string }>(
  rows: TwoSchoolRows<T> | undefined,
  filters: IndicatorStatsChartFilters,
): TwoSchoolRows<T> | undefined {
  if (!rows) return undefined;
  return {
    university: filterIndicatorGeoRows(rows.university, filters),
    "junior-college": filterIndicatorGeoRows(rows["junior-college"], filters),
  };
}

export function FreshmanIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: FreshmanRepRow[];
  cohort: FreshmanRepViewCohort;
  rowsByCohort?: StudentCohortRows<FreshmanRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const bundle = buildFreshmanIndicatorStats({
    viewRows: filterIndicatorGeoRows(rows, filters),
    viewCohort: cohort,
    lookup,
    rowsByCohort: filterByCohort(rowsByCohort, filters),
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={FRESHMAN_INDICATOR_STATS_COLUMNS}
      note={NOTE}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function EnrolledIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: EnrolledRepRow[];
  cohort: FreshmanRepViewCohort;
  rowsByCohort?: StudentCohortRows<EnrolledRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const bundle = buildEnrolledIndicatorStats({
    viewRows: filterIndicatorGeoRows(rows, filters),
    viewCohort: cohort,
    lookup,
    rowsByCohort: filterByCohort(rowsByCohort, filters),
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={ENROLLED_INDICATOR_STATS_COLUMNS}
      note={NOTE}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function DropoutIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: DropoutRepRow[];
  cohort: FreshmanRepViewCohort;
  rowsByCohort?: StudentCohortRows<DropoutRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const bundle = buildDropoutIndicatorStats({
    viewRows: filterIndicatorGeoRows(rows, filters),
    viewCohort: cohort,
    lookup,
    rowsByCohort: filterByCohort(rowsByCohort, filters),
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={DROPOUT_INDICATOR_STATS_COLUMNS}
      note={NOTE}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function FundSecureIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: FundSecureRepRow[];
  cohort: string;
  rowsByCohort?: TwoSchoolRows<FundSecureRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const filtered = filterIndicatorGeoRows(rows, filters);
  const bundle = buildFundSecureIndicatorStats({
    viewRows: filtered,
    viewCohort: cohort,
    lookup,
    rowsByCohort:
      rowsByCohort != null
        ? filterTwoSchool(rowsByCohort, filters)
        : cohort === "all-universities"
          ? splitTwoSchoolByDivision(filtered)
          : undefined,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={FUND_SECURE_INDICATOR_STATS_COLUMNS}
      note={`${NOTE} 금액은 백만원입니다.`}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function FinSupportIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: FinSupportRepRow[];
  cohort: string;
  rowsByCohort?: TwoSchoolRows<FinSupportRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const filtered = filterIndicatorGeoRows(rows, filters);
  const bundle = buildFinSupportIndicatorStats({
    viewRows: filtered,
    viewCohort: cohort,
    lookup,
    rowsByCohort:
      rowsByCohort != null
        ? filterTwoSchool(rowsByCohort, filters)
        : cohort === "all-universities"
          ? splitTwoSchoolByDivision(filtered)
          : undefined,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={FIN_SUPPORT_INDICATOR_STATS_COLUMNS}
      note={`${NOTE} 금액은 백만원입니다.`}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function TuitionDepIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: TuitionDepRepRow[];
  cohort: string;
  rowsByCohort?: TwoSchoolRows<TuitionDepRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const filtered = filterIndicatorGeoRows(rows, filters);
  const bundle = buildTuitionDepIndicatorStats({
    viewRows: filtered,
    viewCohort: cohort,
    lookup,
    rowsByCohort:
      rowsByCohort != null
        ? filterTwoSchool(rowsByCohort, filters)
        : cohort === "all-universities"
          ? splitTwoSchoolByDivision(filtered)
          : undefined,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={TUITION_DEP_INDICATOR_STATS_COLUMNS}
      note={`${NOTE} 금액은 백만원입니다.`}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function CorpTransferIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: CorpTransferRepRow[];
  cohort: string;
  rowsByCohort?: TwoSchoolRows<CorpTransferRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const filtered = filterIndicatorGeoRows(rows, filters);
  const bundle = buildCorpTransferIndicatorStats({
    viewRows: filtered,
    viewCohort: cohort,
    lookup,
    rowsByCohort:
      rowsByCohort != null
        ? filterTwoSchool(rowsByCohort, filters)
        : cohort === "all-universities"
          ? splitTwoSchoolByDivision(filtered)
          : undefined,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={CORP_TRANSFER_INDICATOR_STATS_COLUMNS}
      note={`${NOTE} 금액은 백만원입니다.`}
      showDivision={cohort === "all-universities"}
    />
  );
}

export function IncomePropertyIndicatorStatsPanel({
  rows,
  cohort,
  rowsByCohort,
  filters,
}: {
  rows: IncomePropertyRepRow[];
  cohort: string;
  rowsByCohort?: TwoSchoolRows<IncomePropertyRepRow>;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const filtered = filterIndicatorGeoRows(rows, filters);
  const bundle = buildIncomePropertyIndicatorStats({
    viewRows: filtered,
    viewCohort: cohort,
    lookup,
    rowsByCohort:
      rowsByCohort != null
        ? filterTwoSchool(rowsByCohort, filters)
        : cohort === "all-universities"
          ? splitTwoSchoolByDivision(filtered)
          : undefined,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={INCOME_PROPERTY_INDICATOR_STATS_COLUMNS}
      note={`${NOTE} 금액은 백만원입니다.`}
      showDivision={cohort === "all-universities"}
    />
  );
}
