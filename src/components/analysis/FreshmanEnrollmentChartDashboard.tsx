"use client";

import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { useMemo, useState } from "react";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { FRESHMAN_FILL_ADVANCED_HELP } from "@/lib/analysis/freshman-enrollment-advanced-help";
import {
  FRESHMAN_CHART_KPI_SUB,
  FRESHMAN_CHART_METRIC_LABELS,
  getFreshmanChartFunnelProfile,
  getFreshmanChartRiskProfile,
  toFreshmanAdvancedChartRows,
  type FreshmanChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";
import type { FreshmanEnrollmentViewMode } from "@/lib/data/freshman-enrollment";
import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";

type Props = {
  campusRows: FreshmanEnrollmentRow[];
  consolidatedRows: FreshmanEnrollmentRow[];
  viewMode: FreshmanEnrollmentViewMode;
  years: number[];
  hasData: boolean;
  hasConsolidatedData: boolean;
  onViewModeChange: (mode: FreshmanEnrollmentViewMode) => void;
};

export function FreshmanEnrollmentChartDashboard({
  campusRows,
  consolidatedRows,
  viewMode,
  years,
  hasData,
  hasConsolidatedData,
  onViewModeChange,
}: Props) {
  const [metric, setMetric] = useState<FreshmanChartMetric>("within");

  const sourceRows =
    viewMode === "campus"
      ? campusRows
      : hasConsolidatedData
        ? consolidatedRows
        : [];

  const chartRows = useMemo(
    () => toFreshmanAdvancedChartRows(sourceRows, metric),
    [sourceRows, metric],
  );

  const riskProfile = useMemo(
    () => getFreshmanChartRiskProfile(metric),
    [metric],
  );

  const funnelProfile = useMemo(
    () => getFreshmanChartFunnelProfile(metric),
    [metric],
  );

  if (!hasData || years.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={CHART_TYPO.bodyText}>
          신입생충원율 데이터가 없습니다. 대학별DB 탭에서 엑셀 데이터를
          업로드하세요.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {viewMode === "consolidated" && !hasConsolidatedData ? (
        <section className={`rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3 ${CHART_TYPO.bodyText}`}>
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
        rateLabel={FRESHMAN_CHART_METRIC_LABELS[metric]}
        kpiSub={FRESHMAN_CHART_KPI_SUB[metric]}
        riskProfile={riskProfile}
        funnelProfile={funnelProfile}
        helpPack={FRESHMAN_FILL_ADVANCED_HELP}
        geoChartsLayout="split"
        distributionTabLayout="density-v2"
        dbViewMode={viewMode}
        onDbViewModeChange={onViewModeChange}
        filterToolbarLeading={
          <ChartMetricToggle
            value={metric}
            onChange={setMetric}
            labels={FRESHMAN_CHART_METRIC_LABELS}
          />
        }
      />
    </div>
  );
}
