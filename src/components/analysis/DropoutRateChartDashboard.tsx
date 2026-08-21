"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useMemo, useState } from "react";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { DROPOUT_ADVANCED_HELP } from "@/lib/analysis/dropout-rate-advanced-help";
import {
  DROPOUT_CHART_KPI_SUB,
  DROPOUT_CHART_METRIC_LABELS,
  getDropoutChartFunnelProfile,
  getDropoutChartRiskProfile,
  toDropoutAdvancedChartRows,
  type DropoutChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";
import type { DropoutRateViewMode } from "@/lib/data/dropout-rate";
import type { DropoutRateRow } from "@/lib/ingest/dropout-rate-config";

type Props = {
  campusRows: DropoutRateRow[];
  consolidatedRows: DropoutRateRow[];
  viewMode: DropoutRateViewMode;
  years: number[];
  hasData: boolean;
  hasConsolidatedData: boolean;
  onViewModeChange: (mode: DropoutRateViewMode) => void;
};

export function DropoutRateChartDashboard({
  campusRows,
  consolidatedRows,
  viewMode,
  years,
  hasData,
  hasConsolidatedData,
  onViewModeChange,
}: Props) {
  const [metric, setMetric] = useState<DropoutChartMetric>("enrolled");

  const sourceRows =
    viewMode === "campus"
      ? campusRows
      : hasConsolidatedData
        ? consolidatedRows
        : [];

  const chartRows = useMemo(
    () => toDropoutAdvancedChartRows(sourceRows, metric),
    [sourceRows, metric],
  );

  const riskProfile = useMemo(
    () => getDropoutChartRiskProfile(metric),
    [metric],
  );

  const funnelProfile = useMemo(
    () => getDropoutChartFunnelProfile(metric),
    [metric],
  );

  if (!hasData || years.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={FDB_TYPO.bodyText}>
          중도탈락율 데이터가 없습니다. 대학별DB 탭에서 엑셀 데이터를
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
        rateLabel={DROPOUT_CHART_METRIC_LABELS[metric]}
        kpiSub={DROPOUT_CHART_KPI_SUB[metric]}
        riskProfile={riskProfile}
        funnelProfile={funnelProfile}
        helpPack={DROPOUT_ADVANCED_HELP}
        geoChartsLayout="split"
        distributionTabLayout="density-v2"
        dbViewMode={viewMode}
        onDbViewModeChange={onViewModeChange}
        filterToolbarLeading={
          <ChartMetricToggle
            value={metric}
            onChange={setMetric}
            labels={DROPOUT_CHART_METRIC_LABELS}
          />
        }
      />
    </div>
  );
}
