"use client";

import { IndicatorStatsTables } from "@/components/analysis/IndicatorStatsTables";
import { useEnrolledScaleLookup } from "@/components/analysis/EnrolledScaleLookupContext";
import {
  filterIndicatorGeoRows,
  type IndicatorStatsChartFilters,
} from "@/lib/analysis/indicator-stats-geo";
import type { SfaChartStage } from "@/lib/analysis/student-fill-analysis/run-chart-metrics";
import {
  buildStudentFillRunIndicatorStats,
  sfaStageStatsColumns,
  type StudentFillStatGeoRow,
} from "@/lib/analysis/student-fill-analysis/run-indicator-stats";

const NOTE =
  "원자료 합산입니다. 율은 합산 뒤 기존 분모 규칙으로 다시 계산합니다. 표 순서는 학교구분별 → 국공사립별 → 규모별 → 권역별 → 지역별입니다.";

export function StudentFillRunIndicatorStats({
  rows,
  stage,
  showDivision,
  showEstb,
  filters,
}: {
  rows: StudentFillStatGeoRow[];
  stage: SfaChartStage;
  showDivision: boolean;
  showEstb?: boolean;
  filters: IndicatorStatsChartFilters;
}) {
  const lookup = useEnrolledScaleLookup();
  const bundle = buildStudentFillRunIndicatorStats({
    viewRows: filterIndicatorGeoRows(rows, filters),
    lookup,
    showDivision,
  });
  return (
    <IndicatorStatsTables
      {...bundle}
      columns={sfaStageStatsColumns(stage)}
      note={NOTE}
      showDivision={showDivision}
      showEstb={showEstb}
    />
  );
}
