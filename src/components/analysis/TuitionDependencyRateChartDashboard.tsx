"use client";

import type { ReactNode } from "react";

import { TuitionDependencyRateAdvancedChartDashboard } from "@/components/analysis/TuitionDependencyRateAdvancedChartDashboard";
import type { TuitionDependencyRateAdvancedRow } from "@/lib/analysis/tuition-dependency-rate-advanced-analytics";
import type { HelpSection } from "@/lib/analysis/tuition-dependency-rate-advanced-help";

type Props = {
  rows: TuitionDependencyRateAdvancedRow[];
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

export function TuitionDependencyRateChartDashboard({
  rows,
  years,
  hasData,
  initialMainTab,
  statsTabContent,
  statsTabHelp,
}: Props) {
  return (
    <TuitionDependencyRateAdvancedChartDashboard
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
