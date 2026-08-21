"use client";

import { useMemo, useState } from "react";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import {
  getIncomePropertyFunnelProfile,
  getIncomePropertyRiskProfile,
  INCOME_PROPERTY_CHART_KPI_SUB,
  INCOME_PROPERTY_CHART_METRIC_LABELS,
  toIncomePropertyAdvancedChartRows,
  type IncomePropertyChartMetric,
} from "@/lib/analysis/income-property-advanced-chart-rows";
import type { IncomePropertySecureRateDisplayRow } from "@/lib/ingest/income-property-secure-rate-config";

type Props = {
  rows: IncomePropertySecureRateDisplayRow[];
  years: number[];
  hasData: boolean;
  renderHelpButton?: (args: {
    active: boolean;
    onClick: () => void;
  }) => React.ReactNode;
};

export function IncomePropertySecureRateChartDashboard({
  rows,
  years,
  hasData,
  renderHelpButton,
}: Props) {
  const [metric, setMetric] =
    useState<IncomePropertyChartMetric>("propertySecureRate");

  const chartRows = useMemo(
    () => toIncomePropertyAdvancedChartRows(rows, metric),
    [rows, metric],
  );

  const riskProfile = useMemo(
    () => getIncomePropertyRiskProfile(metric),
    [metric],
  );

  const funnelProfile = useMemo(
    () => getIncomePropertyFunnelProfile(metric),
    [metric],
  );

  return (
    <CorpTransferRatioAdvancedChartDashboard
      key={metric}
      rows={chartRows}
      years={years}
      hasData={hasData}
      rateLabel={INCOME_PROPERTY_CHART_METRIC_LABELS[metric]}
      kpiSub={INCOME_PROPERTY_CHART_KPI_SUB[metric]}
      riskProfile={riskProfile}
      funnelProfile={funnelProfile}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      renderHelpButton={renderHelpButton}
      filterToolbarLeading={
        <ChartMetricToggle
          value={metric}
          onChange={setMetric}
          labels={INCOME_PROPERTY_CHART_METRIC_LABELS}
        />
      }
    />
  );
}
