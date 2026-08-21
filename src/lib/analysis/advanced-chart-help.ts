/** 학생충원 Advanced 통계분석 — 도움말 공통 타입 */

export type HelpSection = {
  title: string;
  body: string;
};

export type AdvancedChartHelpPack = {
  overview: HelpSection;
  kpi: {
    avgRate: HelpSection;
    medianIqr: HelpSection;
    riskCount: HelpSection;
    schoolCount: HelpSection;
  };
  tab: {
    risk: HelpSection;
    geo: HelpSection;
    distribution: HelpSection;
    pipeline: HelpSection;
  };
  chart: {
    zoneCompare: HelpSection;
    scaleCompare: HelpSection;
    sidoRank: HelpSection;
    sidoTable: HelpSection;
    schoolPreview: HelpSection;
    boxPlot: HelpSection;
    density: HelpSection;
    histogram: HelpSection;
    riskTier: HelpSection;
    trend: HelpSection;
    funnel: HelpSection;
  };
};

export function buildHelpSections(pack: AdvancedChartHelpPack): HelpSection[] {
  return [
    pack.overview,
    ...Object.values(pack.kpi),
    ...Object.values(pack.tab),
    ...Object.values(pack.chart),
  ];
}
