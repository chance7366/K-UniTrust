"use client";

import type { ReactNode } from "react";

import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import type { HelpSection } from "@/lib/analysis/corp-transfer-ratio-advanced-help";

type Props = {
  rows: CorpTransferRatioAdvancedRow[];
  years: number[];
  hasData: boolean;
  renderHelpButton?: (args: {
    active: boolean;
    onClick: () => void;
  }) => React.ReactNode;
  initialMainTab?: "stats" | "risk" | "geo" | "distribution" | "pipeline";
  statsTabContent?: (ctx: {
    year: number;
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
  }) => ReactNode;
  statsTabHelp?: HelpSection;
};

export function CorpTransferRatioChartDashboard({
  rows,
  years,
  hasData,
  renderHelpButton,
  initialMainTab,
  statsTabContent,
  statsTabHelp,
}: Props) {
  return (
    <CorpTransferRatioAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      renderHelpButton={renderHelpButton}
      initialMainTab={initialMainTab}
      statsTabContent={statsTabContent}
      statsTabHelp={statsTabHelp}
    />
  );
}
