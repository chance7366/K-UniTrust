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
import type { FundSecureRateRow } from "@/lib/ingest/fund-secure-rate-config";
import {
  buildHistogramBars,
  histogramBinDefsFromCuts,
} from "@/lib/analysis/advanced-chart-risk-profile";

/** 자금확보율 통계분석용 행 (자금확보율 지표만 사용) */
export type FundSecureRateAdvancedRow = FundSecureRateRow;

export type FundSecureAdvancedFilters = AdvancedChartFilters;

export type FundSecureAdvancedKpis = {
  avgRate: number | null;
  yoy: number | null;
  median: number | null;
  iqr: number | null;
  riskBelow100: number;
  riskBelow100Pct: number;
  riskBelow80: number;
  riskBelow80Pct: number;
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

function avgRate(rows: FundSecureRateAdvancedRow[]): number | null {
  if (!rows.length) return null;
  let num = 0;
  let den = 0;
  for (const r of rows) {
    num += r.totalFunds;
    den += r.tuitionRevenue;
  }
  if (!den) return null;
  return Math.round((num / den) * 1000) / 10;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

export function filterAdvancedRows(
  rows: FundSecureRateAdvancedRow[],
  filters: FundSecureAdvancedFilters,
): FundSecureRateAdvancedRow[] {
  return filterAdvancedChartRows(rows, filters);
}

export function buildAdvancedKpis(
  current: FundSecureRateAdvancedRow[],
  previous: FundSecureRateAdvancedRow[],
): FundSecureAdvancedKpis {
  const rates = current.map((r) => r.fundSecureRate);
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
    (r) => r.fundSecureRate,
    true,
  );

  return {
    avgRate: avg,
    yoy,
    median: med,
    iqr: q1 != null && q3 != null ? Math.round((q3 - q1) * 10) / 10 : null,
    riskBelow100: cohortRisk.risk,
    riskBelow100Pct: cohortRisk.riskPct,
    riskBelow80: cohortRisk.highRisk,
    riskBelow80Pct: cohortRisk.highRiskPct,
    schoolCount: count,
  };
}

export function buildZoneAggregates(
  current: FundSecureRateAdvancedRow[],
  previous: FundSecureRateAdvancedRow[],
): RegionAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.fundSecureRate,
    true,
  );

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = current.filter((r) => zoneForRegion(r.region) === zone);
    const prevRows = previous.filter((r) => zoneForRegion(r.region) === zone);
    const avg = avgRate(zoneRows);
    const prev = avgRate(prevRows);
    const rates = zoneRows.map((r) => r.fundSecureRate);
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
  current: FundSecureRateAdvancedRow[],
  previous: FundSecureRateAdvancedRow[],
  lookup: EnrolledScaleLookupJson,
): ScaleAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.fundSecureRate,
    true,
  );
  return buildScaleAggregatePoints(
    current,
    previous,
    lookup,
    avgRate,
    (r) => r.fundSecureRate,
    (r) => isRowCohortRelativeRisk(r, cohortCtx, "risk"),
  );
}

export function buildSidoAggregates(
  current: FundSecureRateAdvancedRow[],
  previous: FundSecureRateAdvancedRow[],
): RegionAggregate[] {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.fundSecureRate,
    true,
  );

  return SIDO_ORDER.map((region) => {
    const regionRows = current.filter((r) => r.region === region);
    const prevRows = previous.filter((r) => r.region === region);
    const avg = avgRate(regionRows);
    const prev = avgRate(prevRows);
    const rates = regionRows.map((r) => r.fundSecureRate);
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
  current: FundSecureRateAdvancedRow[],
  previous: FundSecureRateAdvancedRow[],
): RegionAggregate {
  const cohortCtx = buildCohortRiskContext(
    current,
    (r) => r.fundSecureRate,
    true,
  );
  const avg = avgRate(current);
  const prev = avgRate(previous);
  const rates = current.map((r) => r.fundSecureRate);
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
  rows: FundSecureRateAdvancedRow[],
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
      metro.map((r) => r.fundSecureRate),
      "수도권",
    ),
    boxPlot(
      nonMetro.map((r) => r.fundSecureRate),
      "비수도권",
    ),
    boxPlot(
      univ.map((r) => r.fundSecureRate),
      "대학",
    ),
    boxPlot(
      jc.map((r) => r.fundSecureRate),
      "전문대학",
    ),
  ].filter((b): b is BoxPlotStats => b != null);
}

const RISK_TIER_DEFS = [
  { tier: "high", label: "고위험 (<80%)", match: (r: number) => r < 80 },
  { tier: "risk", label: "위험 (80~100%)", match: (r: number) => r >= 80 && r < 100 },
  { tier: "ok", label: "양호 (100~120%)", match: (r: number) => r >= 100 && r < 120 },
  { tier: "good", label: "여유 (≥120%)", match: (r: number) => r >= 120 },
] as const;

export function buildRiskTierBreakdown(
  rows: FundSecureRateAdvancedRow[],
): RiskTierBreakdown[] {
  return RISK_TIER_DEFS.map(({ tier, label, match }) => ({
    tier,
    label,
    count: rows.filter((r) => match(r.fundSecureRate)).length,
  }));
}

export function buildFunnel(rows: FundSecureRateAdvancedRow[]): FunnelStep[] {
  const tuition = rows.reduce((s, r) => s + r.tuitionRevenue, 0);
  const schoolFunds = rows.reduce(
    (s, r) => s + r.schoolFundsCarryover + r.schoolFundsEndowment,
    0,
  );
  const industryFunds = rows.reduce(
    (s, r) => s + r.industryCarryover + r.industryEndowment,
    0,
  );
  const total = rows.reduce((s, r) => s + r.totalFunds, 0);
  const steps = [
    { step: "등록금수입", value: tuition },
    { step: "교비자금", value: schoolFunds },
    { step: "산단자금", value: industryFunds },
    { step: "자금합계", value: total },
  ];
  const base = tuition || 1;
  return steps.map((s) => ({
    ...s,
    pct: Math.round((s.value / base) * 1000) / 10,
  }));
}

export function buildZoneTrend(
  rows: FundSecureRateAdvancedRow[],
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

export function buildScaleTrend(
  rows: FundSecureRateAdvancedRow[],
  years: number[],
  lookup: EnrolledScaleLookupJson,
): ScaleTrendPoint[] {
  return buildScaleTrendPoints(rows, years, lookup, avgRate);
}

const FUND_SECURE_HISTOGRAM_BINS = histogramBinDefsFromCuts([
  50, 70, 80, 90, 100, 110, 120, 150, 200,
]);

export function buildHistogram(rows: FundSecureRateAdvancedRow[]) {
  return buildHistogramBars(
    rows.map((r) => r.fundSecureRate),
    FUND_SECURE_HISTOGRAM_BINS,
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
