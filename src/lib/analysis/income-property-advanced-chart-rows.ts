import type { IncomePropertyFunnelRow } from "@/lib/analysis/advanced-chart-funnel-profile";
import {
  INCOME_PROPERTY_PROPERTY_SECURE_FUNNEL_PROFILE,
  INCOME_PROPERTY_REVENUE_FUNNEL_PROFILE,
  type AdvancedChartFunnelProfile,
} from "@/lib/analysis/advanced-chart-funnel-profile";
import {
  INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE,
  INCOME_PROPERTY_REVENUE_RISK_PROFILE,
  type AdvancedChartRiskProfile,
} from "@/lib/analysis/advanced-chart-risk-profile";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import type { IncomePropertySecureRateDisplayRow } from "@/lib/ingest/income-property-secure-rate-config";

export type IncomePropertyChartMetric = "propertySecureRate" | "revenueRate";

export const INCOME_PROPERTY_CHART_METRIC_LABELS: Record<
  IncomePropertyChartMetric,
  string
> = {
  propertySecureRate: "재산확보율",
  revenueRate: "수익율",
};

export const INCOME_PROPERTY_CHART_KPI_SUB: Record<
  IncomePropertyChartMetric,
  string
> = {
  propertySecureRate: "Σ소계 ÷ Σ등록금수입 × 100",
  revenueRate: "Σ수입액 ÷ Σ평가액 × 100",
};

export function toIncomePropertyAdvancedChartRows(
  rows: IncomePropertySecureRateDisplayRow[],
  metric: IncomePropertyChartMetric,
): IncomePropertyFunnelRow[] {
  return rows.flatMap((row) => {
    const rate =
      metric === "propertySecureRate"
        ? row.propertySecureRate
        : row.revenueRate;
    if (rate == null || Number.isNaN(rate)) return [];

    const isRevenue = metric === "revenueRate";
    const appraisedGross =
      row.landAppraised +
      row.buildingAppraised +
      row.securitiesAppraised +
      row.depositAppraised +
      row.otherAppraised;
    const appraisedNet = appraisedGross - row.collateralDeduction;
    /**
     * 차트 KPI·권역 평균(avgRate) = sum(totalTransfer)/sum(tuitionRevenue)×100
     * - 재산확보율: Σ소계 / Σ등록금수입
     * - 수익율: Σ수입액 / Σ평가액
     */
    const totalTransfer = isRevenue ? row.totalNetIncome : appraisedNet;
    const tuitionRevenue = isRevenue
      ? appraisedGross
      : (row.tuitionRevenue ?? 0);

    if (!isRevenue && tuitionRevenue <= 0) return [];
    if (isRevenue && tuitionRevenue <= 0) return [];

    return [
      {
        year: row.year,
        schoolCodeStd: row.schoolCodeStd,
        schoolName: row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: row.region,
        estb: row.estb,
        ordinaryExpenseTransfer: row.landNetIncome,
        legalObligationTransfer: row.buildingNetIncome,
        assetTransfer: row.depositNetIncome,
        totalTransfer,
        tuitionRevenue,
        transferRatio: rate,
        landAppraised: row.landAppraised,
        buildingAppraised: row.buildingAppraised,
        securitiesAppraised: row.securitiesAppraised,
        depositAppraised: row.depositAppraised,
        otherAppraised: row.otherAppraised,
        landNetIncome: row.landNetIncome,
        buildingNetIncome: row.buildingNetIncome,
        securitiesNetIncome: row.securitiesNetIncome,
        depositNetIncome: row.depositNetIncome,
        otherNetIncome: row.otherNetIncome,
        totalAppraised: row.totalAppraised,
        totalNetIncome: row.totalNetIncome,
      },
    ];
  });
}

export function getIncomePropertyRiskProfile(
  metric: IncomePropertyChartMetric,
): AdvancedChartRiskProfile {
  return metric === "revenueRate"
    ? INCOME_PROPERTY_REVENUE_RISK_PROFILE
    : INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE;
}

export function getIncomePropertyFunnelProfile(
  metric: IncomePropertyChartMetric,
): AdvancedChartFunnelProfile {
  return metric === "revenueRate"
    ? INCOME_PROPERTY_REVENUE_FUNNEL_PROFILE
    : INCOME_PROPERTY_PROPERTY_SECURE_FUNNEL_PROFILE;
}
