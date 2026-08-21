"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { TuitionDependencyRateAdvancedChartDashboard } from "@/components/analysis/TuitionDependencyRateAdvancedChartDashboard";
import type { TuitionDependencyRateAdvancedRow } from "@/lib/analysis/tuition-dependency-rate-advanced-analytics";

type Props = {
  rows: TuitionDependencyRateAdvancedRow[];
  years: number[];
  hasData: boolean;
};

export function TuitionDependencyRateChartDashboard({
  rows,
  years,
  hasData,
}: Props) {
  return (
    <TuitionDependencyRateAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
    />
  );
}
