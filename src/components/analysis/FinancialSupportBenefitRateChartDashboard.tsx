"use client";

import type { ReactNode } from "react";

import { FinancialSupportBenefitRateAdvancedChartDashboard } from "@/components/analysis/FinancialSupportBenefitRateAdvancedChartDashboard";
import type { FinancialSupportBenefitRateAdvancedRow } from "@/lib/analysis/financial-support-benefit-rate-advanced-analytics";
import type { HelpSection } from "@/lib/analysis/financial-support-benefit-rate-advanced-help";

type Props = {
  rows: FinancialSupportBenefitRateAdvancedRow[];
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

export function FinancialSupportBenefitRateChartDashboard({
  rows,
  years,
  hasData,
  initialMainTab,
  statsTabContent,
  statsTabHelp,
}: Props) {
  return (
    <FinancialSupportBenefitRateAdvancedChartDashboard
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
