import {
  CORP_TRANSFER_RISK_PROFILE,
  buildHistogramBars,
  type AdvancedChartRiskProfile,
} from "@/lib/analysis/advanced-chart-risk-profile";
import {
  buildCohortRiskContext,
  countCohortRelativeRisk,
  higherIsBetterFromRiskDirection,
  isRowCohortRelativeRisk,
} from "@/lib/analysis/cohort-relative-risk";
import {
  filterAdvancedChartRows,
  type AdvancedChartFilters,
} from "@/lib/analysis/advanced-chart-filters";
import {
  ANALYTICS_ZONES,
  emptyZoneTrendPoint,
  zoneForSido,
  type AnalyticsZoneTrendPoint,
} from "@/lib/analysis/korea-analytics-zones";
import { resolveSchoolDivisionFromFields } from "@/lib/analysis/school-division";
import {
  arithmeticMeanRate,
  buildScaleAggregatePoints,
  buildScaleTrendPoints,
  type EnrolledScaleLookupJson,
  type ScaleAggregate,
  type ScaleTrendPoint,
} from "@/lib/analysis/school-scale-trend";
import type { CorpTransferRatioRow } from "@/lib/ingest/corp-transfer-ratio-config";

export type CorpTransferRatioAdvancedRow = CorpTransferRatioRow;

export type CorpTransferAdvancedFilters = AdvancedChartFilters;

export type CorpTransferAdvancedKpis = {
  avgRate: number | null;
  yoy: number | null;
  median: number | null;
  iqr: number | null;
  riskBelow20: number;
  riskBelow20Pct: number;
  riskBelow10: number;
  riskBelow10Pct: number;
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
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

export { CORP_TRANSFER_RISK_PROFILE };

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

function getRate(row: CorpTransferRatioAdvancedRow): number {
  return row.transferRatio;
}

function avgRate(rows: CorpTransferRatioAdvancedRow[]): number | null {
  if (!rows.length) return null;
  const sum = rows.reduce((s, r) => s + r.totalTransfer, 0);
  const tuition = rows.reduce((s, r) => s + r.tuitionRevenue, 0);
  if (!tuition) return null;
  return Math.round((sum / tuition) * 100 * 10) / 10;
}

function zoneForRegion(region: string) {
  return zoneForSido(region);
}

export function filterAdvancedRows(
  rows: CorpTransferRatioAdvancedRow[],
  filters: CorpTransferAdvancedFilters,
): CorpTransferRatioAdvancedRow[] {
  return filterAdvancedChartRows(rows, filters);
}

export function buildAdvancedKpis(
  current: CorpTransferRatioAdvancedRow[],
  previous: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): CorpTransferAdvancedKpis {
  const rates = current.map(getRate);
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
  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortRisk = countCohortRelativeRisk(current, getRate, higherIsBetter);

  return {
    avgRate: avg,
    yoy,
    median: med,
    iqr: q1 != null && q3 != null ? Math.round((q3 - q1) * 10) / 10 : null,
    riskBelow20: cohortRisk.risk,
    riskBelow20Pct: cohortRisk.riskPct,
    riskBelow10: cohortRisk.highRisk,
    riskBelow10Pct: cohortRisk.highRiskPct,
    schoolCount: count,
  };
}

export function buildZoneAggregates(
  current: CorpTransferRatioAdvancedRow[],
  previous: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): RegionAggregate[] {
  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortCtx = buildCohortRiskContext(current, getRate, higherIsBetter);

  return ANALYTICS_ZONES.map((zone) => {
    const zoneRows = current.filter((r) => zoneForRegion(r.region) === zone);
    const prevRows = previous.filter((r) => zoneForRegion(r.region) === zone);
    const avg = avgRate(zoneRows);
    const prev = avgRate(prevRows);
    const rates = zoneRows.map(getRate);
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
  current: CorpTransferRatioAdvancedRow[],
  previous: CorpTransferRatioAdvancedRow[],
  lookup: EnrolledScaleLookupJson,
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): ScaleAggregate[] {
  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortCtx = buildCohortRiskContext(current, getRate, higherIsBetter);
  return buildScaleAggregatePoints(
    current,
    previous,
    lookup,
    avgRate,
    getRate,
    (r) => isRowCohortRelativeRisk(r, cohortCtx, "risk"),
  );
}

export function buildSidoAggregates(
  current: CorpTransferRatioAdvancedRow[],
  previous: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): RegionAggregate[] {
  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortCtx = buildCohortRiskContext(current, getRate, higherIsBetter);

  return SIDO_ORDER.map((region) => {
    const regionRows = current.filter((r) => r.region === region);
    const prevRows = previous.filter((r) => r.region === region);
    const avg = avgRate(regionRows);
    const prev = avgRate(prevRows);
    const rates = regionRows.map(getRate);
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
  current: CorpTransferRatioAdvancedRow[],
  previous: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): RegionAggregate {
  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortCtx = buildCohortRiskContext(current, getRate, higherIsBetter);
  const avg = avgRate(current);
  const prev = avgRate(previous);
  const rates = current.map(getRate);
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

export function buildBoxPlots(rows: CorpTransferRatioAdvancedRow[]): BoxPlotStats[] {
  const metro = rows.filter((r) => METRO.has(r.region));
  const nonMetro = rows.filter((r) => !METRO.has(r.region));
  const univ = rows.filter(
    (r) => resolveSchoolDivisionFromFields(r.schoolKind, r.schoolDivision) === "대학",
  );
  const jc = rows.filter(
    (r) =>
      resolveSchoolDivisionFromFields(r.schoolKind, r.schoolDivision) === "전문대학",
  );

  return [
    boxPlot(metro.map(getRate), "수도권"),
    boxPlot(nonMetro.map(getRate), "비수도권"),
    boxPlot(univ.map(getRate), "대학"),
    boxPlot(jc.map(getRate), "전문대학"),
  ].filter((b): b is BoxPlotStats => b != null);
}

export function buildRiskTierBreakdown(
  rows: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
): RiskTierBreakdown[] {
  return riskProfile.riskTierDefs.map(({ tier, label, match }) => ({
    tier,
    label,
    count: rows.filter((r) => match(getRate(r))).length,
  }));
}

export function buildFunnel(rows: CorpTransferRatioAdvancedRow[]): FunnelStep[] {
  const tuition = rows.reduce((s, r) => s + r.tuitionRevenue, 0);
  const ordinary = rows.reduce((s, r) => s + r.ordinaryExpenseTransfer, 0);
  const legal = rows.reduce((s, r) => s + r.legalObligationTransfer, 0);
  const asset = rows.reduce((s, r) => s + r.assetTransfer, 0);
  const total = rows.reduce((s, r) => s + r.totalTransfer, 0);
  const steps = [
    { step: "등록금수입", value: tuition },
    { step: "경상비전입금", value: ordinary },
    { step: "법정부담전입금", value: legal },
    { step: "자산전입금", value: asset },
    { step: "전입금합계", value: total },
  ];
  const base = tuition || 1;
  return steps.map((s) => ({
    ...s,
    pct: Math.round((s.value / base) * 1000) / 10,
  }));
}

export function buildZoneTrend(
  rows: CorpTransferRatioAdvancedRow[],
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
  rows: CorpTransferRatioAdvancedRow[],
  years: number[],
  lookup: EnrolledScaleLookupJson,
): ScaleTrendPoint[] {
  return buildScaleTrendPoints(rows, years, lookup, avgRate);
}

export function buildHistogram(
  rows: CorpTransferRatioAdvancedRow[],
  riskProfile: AdvancedChartRiskProfile = CORP_TRANSFER_RISK_PROFILE,
) {
  return buildHistogramBars(
    rows.map(getRate),
    riskProfile.histogramBinDefs,
    riskProfile.riskDirection ?? "below",
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

export function fmtTransferThousand(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}
