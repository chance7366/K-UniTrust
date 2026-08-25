"use client";

import type { ReactNode } from "react";

import { FundSecureRateAdvancedChartDashboard } from "@/components/analysis/FundSecureRateAdvancedChartDashboard";
import type { FundSecureRateAdvancedRow } from "@/lib/analysis/fund-secure-rate-advanced-analytics";
import type { HelpSection } from "@/lib/analysis/fund-secure-rate-advanced-help";

type Props = {
  rows: FundSecureRateAdvancedRow[];
  years: number[];
  hasData: boolean;
  initialMainTab?: "stats" | "risk" | "geo" | "distribution" | "pipeline";
  statsTabContent?: (ctx: {
    year: number;
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
  }) => ReactNode;
  statsTabHelp?: HelpSection;
};

export function FundSecureRateChartDashboard({
  rows,
  years,
  hasData,
  initialMainTab,
  statsTabContent,
  statsTabHelp,
}: Props) {
  return (
    <FundSecureRateAdvancedChartDashboard
      rows={rows}
      years={years}
      hasData={hasData}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      initialMainTab={initialMainTab}
      statsTabContent={statsTabContent}
      statsTabHelp={statsTabHelp}
    />
  );
}
