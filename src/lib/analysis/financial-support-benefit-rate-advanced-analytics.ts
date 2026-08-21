import {
  filterAdvancedChartRows,
  type AdvancedChartFilters,
} from "@/lib/analysis/advanced-chart-filters";
import {
  buildCohortRiskContext,
  countCohortRelativeRisk,
  isRowCohortRelativeRisk,
} from "@/lib/analysis/cohort-relative-risk";
import {
  ANALYTICS_ZONES,
  emptyZoneTrendPoint,
  zoneForSido,
  type AnalyticsZoneTrendPoint,
} from "@/lib/analysis/korea-analytics-zones";
import {
  resolveSchoolDivisionFromFields,
} from "@/lib/analysis/school-division";
import {
  arithmeticMeanRate,
  buildScaleAggregatePoints,
  buildScaleTrendPoints,
  type EnrolledScaleLookupJson,
  type ScaleAggregate,
  type ScaleTrendPoint,
} from "@/lib/analysis/school-scale-trend";
import type { FinancialSupportBenefitRateRow } from "@/lib/ingest/financial-support-benefit-rate-config";
import {
  buildHistogramBars,
  histogramBinDefsFromCuts,
} from "@/lib/analysis/advanced-chart-risk-profile";

export type FinancialSupportBenefitRateAdvancedRow = FinancialSupportBenefitRateRow;

export type FinancialSupportBenefitAdvancedFilters = AdvancedChartFilters;

export type FinancialSupportBenefitAdvancedKpis = {
  avgRate: number | null;
  yoy: number | null;
  median: number | null;
  iqr: number | null;
  riskBelow70: number;
  riskBelow70Pct: number;
  riskBelow50: number;
  riskBelow50Pct: number;
  schoolCount: number;
};

export type RegionAggregate = {
  region: string;
  avgRate: number | null;
  yoy: number | null;
  schoolCount: number;
  riskCount: number;
  median: number | null;
  meanRate: number | null;
};

export type BoxPlotStats = {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
};

export type FunnelStep = {
  step: string;
  value: number;
  pct: number;
};

export type RiskTierBreakdown = {
  tier: string;
  label: string;
  count: number;
};

export type TrendPoint = AnalyticsZoneTrendPoint;

const METRO = new Set(["서울", "경기", "인천"]);

const SIDO_ORDER = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

const RISK_RATE_THRESHOLD = 70;
const HIGH_RISK_RATE_THRESHOLD = 50;

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function boxPlot(values: number[], label: string): BoxPlotStats | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const med = percentile(sorted, 0.5);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const inRange = sorted.filter((v) => v >= lower && v <= upper);
  const outliers = sorted.filter((v) => v < lower || v > upper);
  return {
    label,
    min: inRange[0] ?? sorted[0],
    q1,
    median: med,
    q3,
    max: inRange[inRange.length - 1] ?? sorted[sorted.length - 1],
    outliers,
  };
}

/** Σ지원액(원) ÷ Σ등록금수입(억원) → 재정지원수혜율 가중 평균 */
function avgRate(rows: FinancialSupportBenefitRateAdvancedRow[]): number | null {
  if (!rows.length) return null;
  let supportWon = 0;
  let tuitionEok = 0;
  for (const r of rows) {
    supportWon += r.totalSupport;
    tuitionEok += r.tuitionRevenue;
  }
  if (!tuitionEok) return null;
  const supportEok = supportWon / 100_000_000;
  return Math.round((supportEok / tuitionEok) * 100 * 10) / 10;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

function isRiskRate(rate: number): boolean {
  return rate < RISK_RATE_THRESHOLD;
}

function isHighRiskRate(rate: number): boolean {
  return rate < HIGH_RISK_RATE_THRESHOLD;
}

export function filterAdvancedRows(
  rows: FinancialSupportBenefitRateAdvancedRow[],
  filters: FinancialSupportBenefitAdvancedFilters,
): FinancialSupportBenefitRateAdvancedRow[] {
  return filterAdvancedChartRows(rows, filters);
}

export function buildAdvancedKpis(
  current: FinancialSupportBenefitRateAdvancedRow[],
  previous: FinancialSupportBenefitRateAdvancedRow[],
): FinancialSupportBenefitAdvancedKpis {
  const rates = current.map((r) => r.benefitRate);
  const med = median(rates);
  const sorted = [...rates].sort((a, b) => a - b);
  const q1 = sorted.length ? percentile(sorted, 0.25) : null;
  const q3 = sorted.length ? percentile(sorted, 0.75) : null;
  const avg = avgRate(current);
  const prevAvg = avgRate(previous);
  const yoy =
    avg != null && prevAvg != null
      ? Math.round((avg - prevAvg) * 10) / 10
      : null;
  const count = current.length;
  const cohortRisk = countCohortRelativeRisk(
    current,
    (r) => r.benefitRate,
    true,
  );

  return {
    avgRate: avg,
    yoy,
    median: med,
    iqr: q1 != null && q3 != null ? Math.round((q3 - q1) * 10) / 10 : null,
    riskBelow70: cohortRisk.risk,
    riskBelow70Pct: cohortRisk.riskPct,
    riskBelow50: cohortRisk.highRisk,
    riskBelow50Pct: cohortRisk.highRiskPct,
    schoolCount: count,
  };
}

export function buildZoneAggregates(
  current: FinancialSupportBenefitRateAdvancedRow[],
  previous: FinancialSupportBenefitRateAdvancedRow[],
): RegionAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.benefitRate,
    true,
  );

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = current.filter((r) => zoneForRegion(r.region) === zone);
    const prevRows = previous.filter((r) => zoneForRegion(r.region) === zone);
    const avg = avgRate(zoneRows);
    const prev = avgRate(prevRows);
    const rates = zoneRows.map((r) => r.benefitRate);
    return {
      region: zone,
      avgRate: avg,
      yoy:
        avg != null && prev != null
          ? Math.round((avg - prev) * 10) / 10
          : null,
      schoolCount: zoneRows.length,
      riskCount: zoneRows.filter((r) =>
        isRowCohortRelativeRisk(r, cohortCtx, "risk"),
      ).length,
      median: median(rates),
      meanRate: arithmeticMeanRate(rates),
    };
  });
}

export function buildScaleAggregates(
  current: FinancialSupportBenefitRateAdvancedRow[],
  previous: FinancialSupportBenefitRateAdvancedRow[],
  lookup: EnrolledScaleLookupJson,
): ScaleAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.benefitRate,
    true,
  );
  return buildScaleAggregatePoints(
    current,
    previous,
    lookup,
    avgRate,
    (r) => r.benefitRate,
    (r) => isRowCohortRelativeRisk(r, cohortCtx, "risk"),
  );
}

export function buildSidoAggregates(
  current: FinancialSupportBenefitRateAdvancedRow[],
  previous: FinancialSupportBenefitRateAdvancedRow[],
): RegionAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.benefitRate,
    true,
  );

  return SIDO_ORDER.map((region) => {
    const regionRows = current.filter((r) => r.region === region);
    const prevRows = previous.filter((r) => r.region === region);
    const avg = avgRate(regionRows);
    const prev = avgRate(prevRows);
    const rates = regionRows.map((r) => r.benefitRate);
    return {
      region,
      avgRate: avg,
      yoy:
        avg != null && prev != null
          ? Math.round((avg - prev) * 10) / 10
          : null,
      schoolCount: regionRows.length,
      riskCount: regionRows.filter((r) =>
        isRowCohortRelativeRisk(r, cohortCtx, "risk"),
      ).length,
      median: median(rates),
      meanRate: arithmeticMeanRate(rates),
    };
  }).filter((p) => p.schoolCount > 0);
}

export function buildTotalAggregate(
  current: FinancialSupportBenefitRateAdvancedRow[],
  previous: FinancialSupportBenefitRateAdvancedRow[],
): RegionAggregate {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.benefitRate,
    true,
  );
  const avg = avgRate(current);
  const prev = avgRate(previous);
  const rates = current.map((r) => r.benefitRate);
  return {
    region: "전체",
    avgRate: avg,
    yoy:
      avg != null && prev != null
        ? Math.round((avg - prev) * 10) / 10
        : null,
    schoolCount: current.length,
    riskCount: current.filter((r) =>
      isRowCohortRelativeRisk(r, cohortCtx, "risk"),
    ).length,
    median: median(rates),
    meanRate: arithmeticMeanRate(rates),
  };
}

export function buildBoxPlots(
  rows: FinancialSupportBenefitRateAdvancedRow[],
): BoxPlotStats[] {
  const metro = rows.filter((r) => METRO.has(r.region));
  const nonMetro = rows.filter((r) => !METRO.has(r.region));
  const univ = rows.filter(
    (r) => resolveSchoolDivisionFromFields(r.schoolKind, r.schoolDivision) === "대학",
  );
  const jc = rows.filter(
    (r) =>
      resolveSchoolDivisionFromFields(r.schoolKind, r.schoolDivision) ===
      "전문대학",
  );

  return [
    boxPlot(
      metro.map((r) => r.benefitRate),
      "수도권",
    ),
    boxPlot(
      nonMetro.map((r) => r.benefitRate),
      "비수도권",
    ),
    boxPlot(
      univ.map((r) => r.benefitRate),
      "대학",
    ),
    boxPlot(
      jc.map((r) => r.benefitRate),
      "전문대학",
    ),
  ].filter((b): b is BoxPlotStats => b != null);
}

const RISK_TIER_DEFS = [
  { tier: "high", label: "고위험 (<50%)", match: (r: number) => r < 50 },
  { tier: "risk", label: "위험 (50~70%)", match: (r: number) => r >= 50 && r < 70 },
  { tier: "ok", label: "양호 (70~100%)", match: (r: number) => r >= 70 && r < 100 },
  { tier: "good", label: "여유 (≥100%)", match: (r: number) => r >= 100 },
] as const;

export function buildRiskTierBreakdown(
  rows: FinancialSupportBenefitRateAdvancedRow[],
): RiskTierBreakdown[] {
  return RISK_TIER_DEFS.map(({ tier, label, match }) => ({
    tier,
    label,
    count: rows.filter((r) => match(r.benefitRate)).length,
  }));
}

function wonToEok(won: number): number {
  return won / 100_000_000;
}

export function buildFunnel(
  rows: FinancialSupportBenefitRateAdvancedRow[],
): FunnelStep[] {
  const tuition = rows.reduce((s, r) => s + r.tuitionRevenue, 0);
  const education = rows.reduce((s, r) => s + r.ministryOfEducation, 0);
  const science = rows.reduce((s, r) => s + r.ministryOfScienceIct, 0);
  const otherCentral = rows.reduce(
    (s, r) =>
      s +
      r.ministryOfEmployment +
      r.ministryOfTrade +
      r.ministryOfHealth +
      r.ministryOfCulture +
      r.ministryOfSme +
      r.ministryOfAgriculture +
      r.otherMinistries,
    0,
  );
  const local = rows.reduce((s, r) => s + r.localGovernment, 0);
  const total = rows.reduce((s, r) => s + r.totalSupport, 0);
  const steps = [
    { step: "등록금수입", value: tuition },
    { step: "교육부", value: wonToEok(education) },
    { step: "과기정통부", value: wonToEok(science) },
    { step: "기타 중앙부처", value: wonToEok(otherCentral) },
    { step: "지방자치단체", value: wonToEok(local) },
    { step: "지원액합계", value: wonToEok(total) },
  ];
  const base = tuition || 1;
  return steps.map((s) => ({
    ...s,
    pct: Math.round((s.value / base) * 1000) / 10,
  }));
}

export function buildScaleTrend(
  rows: FinancialSupportBenefitRateAdvancedRow[],
  years: number[],
  lookup: EnrolledScaleLookupJson,
): ScaleTrendPoint[] {
  return buildScaleTrendPoints(rows, years, lookup, avgRate);
}

export function buildZoneTrend(
  rows: FinancialSupportBenefitRateAdvancedRow[],
  years: number[],
): TrendPoint[] {
  return years.map((year) => {
    const yearRows = rows.filter((r) => r.year === year);
    const point = emptyZoneTrendPoint(String(year));
    for (const zone of ANALYTICS_ZONES) {
      const zoneRows = yearRows.filter((r) => zoneForRegion(r.region) === zone);
      point[zone] = avgRate(zoneRows);
    }
    return point;
  });
}

const FINANCIAL_SUPPORT_HISTOGRAM_BINS = histogramBinDefsFromCuts([
  20, 35, 50, 60, 70, 85, 100, 120, 150,
]);

export function buildHistogram(rows: FinancialSupportBenefitRateAdvancedRow[]) {
  return buildHistogramBars(
    rows.map((r) => r.benefitRate),
    FINANCIAL_SUPPORT_HISTOGRAM_BINS,
    "below",
  );
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function fmtYoy(v: number | null | undefined): string | null {
  if (v == null || Number.isNaN(v)) return null;
  if (v === 0) return "0.0%p";
  return `${v > 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(1)}%p`;
}

export function fmtSupportEok(totalSupportWon: number): string {
  return Math.round(totalSupportWon / 100_000_000).toLocaleString("ko-KR");
}
