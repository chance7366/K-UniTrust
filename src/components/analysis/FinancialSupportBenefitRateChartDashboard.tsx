"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FinancialSupportBenefitRateAdvancedChartDashboard } from "@/components/analysis/FinancialSupportBenefitRateAdvancedChartDashboard";
import type { FinancialSupportBenefitRateAdvancedRow } from "@/lib/analysis/financial-support-benefit-rate-advanced-analytics";

type Props = {
  rows: FinancialSupportBenefitRateAdvancedRow[];
  years: number[];
  hasData: boolean;
};

export function FinancialSupportBenefitRateChartDashboard({
  rows,
  years,
  hasData,
}: Props) {
  return (
    <FinancialSupportBenefitRateAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
    />
  );
}
