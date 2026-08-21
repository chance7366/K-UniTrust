"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FundSecureRateAdvancedChartDashboard } from "@/components/analysis/FundSecureRateAdvancedChartDashboard";
import type { FundSecureRateAdvancedRow } from "@/lib/analysis/fund-secure-rate-advanced-analytics";

type Props = {
  rows: FundSecureRateAdvancedRow[];
  years: number[];
  hasData: boolean;
};

export function FundSecureRateChartDashboard({ rows, years, hasData }: Props) {
  return (
    <FundSecureRateAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
    />
  );
}
