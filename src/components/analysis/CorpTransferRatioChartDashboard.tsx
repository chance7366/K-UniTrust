"use client";

import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";

type Props = {
  rows: CorpTransferRatioAdvancedRow[];
  years: number[];
  hasData: boolean;
  renderHelpButton?: (args: {
    active: boolean;
    onClick: () => void;
  }) => React.ReactNode;
};

export function CorpTransferRatioChartDashboard({
  rows,
  years,
  hasData,
  renderHelpButton,
}: Props) {
  return (
    <CorpTransferRatioAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      renderHelpButton={renderHelpButton}
    />
  );
}
