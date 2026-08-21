"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useMemo, useState } from "react";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { ENROLLED_FILL_ADVANCED_HELP } from "@/lib/analysis/enrolled-enrollment-advanced-help";
import {
  ENROLLED_CHART_KPI_SUB,
  ENROLLED_CHART_METRIC_LABELS,
  getEnrolledChartFunnelProfile,
  getEnrolledChartRiskProfile,
  toEnrolledAdvancedChartRows,
  type EnrolledChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";
import type { EnrolledEnrollmentViewMode } from "@/lib/data/enrolled-enrollment";
import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";

type Props = {
  campusRows: EnrolledEnrollmentRow[];
  consolidatedRows: EnrolledEnrollmentRow[];
  viewMode: EnrolledEnrollmentViewMode;
  years: number[];
  hasData: boolean;
  hasConsolidatedData: boolean;
  onViewModeChange: (mode: EnrolledEnrollmentViewMode) => void;
};

export function EnrolledEnrollmentChartDashboard({
  campusRows,
  consolidatedRows,
  viewMode,
  years,
  hasData,
  hasConsolidatedData,
  onViewModeChange,
}: Props) {
  const [metric, setMetric] = useState<EnrolledChartMetric>("within");

  const sourceRows =
    viewMode === "campus"
      ? campusRows
      : hasConsolidatedData
        ? consolidatedRows
        : [];

  const chartRows = useMemo(
    () => toEnrolledAdvancedChartRows(sourceRows, metric),
    [sourceRows, metric],
  );

  const riskProfile = useMemo(
    () => getEnrolledChartRiskProfile(metric),
    [metric],
  );

  const funnelProfile = useMemo(
    () => getEnrolledChartFunnelProfile(metric),
    [metric],
  );

  if (!hasData || years.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={FDB_TYPO.bodyText}>
          재학생충원율 데이터가 없습니다. 대학별DB 탭에서 엑셀 데이터를
          업로드하세요.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {viewMode === "consolidated" && !hasConsolidatedData ? (
        <section className={`rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3 ${FDB_TYPO.legend}`}>
          본교통합 DB가 없습니다. 글로벌 필터에서{" "}
          <strong className="text-foreground">캠퍼스별</strong>로 전환하거나
          대학별DB 탭에서 본교통합을 생성하세요.
        </section>
      ) : null}
      <CorpTransferRatioAdvancedChartDashboard
        key={`${viewMode}-${metric}`}
        rows={chartRows}
        years={years}
        hasData
        rateLabel={ENROLLED_CHART_METRIC_LABELS[metric]}
        kpiSub={ENROLLED_CHART_KPI_SUB[metric]}
        riskProfile={riskProfile}
        funnelProfile={funnelProfile}
        helpPack={ENROLLED_FILL_ADVANCED_HELP}
        geoChartsLayout="split"
        distributionTabLayout="density-v2"
        dbViewMode={viewMode}
        onDbViewModeChange={onViewModeChange}
        filterToolbarLeading={
          <ChartMetricToggle
            value={metric}
            onChange={setMetric}
            labels={ENROLLED_CHART_METRIC_LABELS}
          />
        }
      />
    </div>
  );
}
