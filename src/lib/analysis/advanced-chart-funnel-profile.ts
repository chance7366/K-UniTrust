import {
  buildFunnel,
  type CorpTransferRatioAdvancedRow,
  type FunnelStep,
} from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";

export type { FunnelStep };

export type AdvancedChartFunnelProfile = {
  title: string;
  subtitle: string;
  valueUnit: string;
  formatValue: (value: number) => string;
  buildSteps: (rows: CorpTransferRatioAdvancedRow[]) => FunnelStep[];
};

export const CORP_TRANSFER_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "전입금 파이프라인 (Funnel)",
  subtitle:
    "등록금수입 → 경상비전입금 → 법정부담전입금 → 자산전입금 → 전입금합계 (억원 합산)",
  valueUnit: "억원",
  formatValue: (value) => Math.round(value).toLocaleString("ko-KR"),
  buildSteps: buildFunnel,
};

function toMillionWon(thousandWon: number): string {
  return Math.round(thousandWon / 1000).toLocaleString("ko-KR");
}

function pctOfBase(value: number, base: number): number {
  if (!base) return 0;
  return Math.round((value / base) * 1000) / 10;
}

export type IncomePropertyFunnelRow = CorpTransferRatioAdvancedRow & {
  landAppraised: number;
  buildingAppraised: number;
  securitiesAppraised: number;
  depositAppraised: number;
  otherAppraised: number;
  landNetIncome: number;
  buildingNetIncome: number;
  securitiesNetIncome: number;
  depositNetIncome: number;
  otherNetIncome: number;
  totalAppraised: number;
  totalNetIncome: number;
};

function asIncomePropertyRows(
  rows: CorpTransferRatioAdvancedRow[],
): IncomePropertyFunnelRow[] {
  return rows as IncomePropertyFunnelRow[];
}

/** 재산확보율: 전년도 등록금수입 대비 재산별 평가액 → 평가액 합계 */
export function buildIncomePropertyPropertySecureFunnel(
  rows: CorpTransferRatioAdvancedRow[],
): FunnelStep[] {
  const data = asIncomePropertyRows(rows);
  const tuition = data.reduce((s, r) => s + r.tuitionRevenue, 0);
  const land = data.reduce((s, r) => s + r.landAppraised, 0);
  const building = data.reduce((s, r) => s + r.buildingAppraised, 0);
  const securities = data.reduce((s, r) => s + r.securitiesAppraised, 0);
  const deposit = data.reduce((s, r) => s + r.depositAppraised, 0);
  const other = data.reduce((s, r) => s + r.otherAppraised, 0);
  const total = data.reduce((s, r) => s + r.totalAppraised, 0);
  const base = tuition || 1;

  return [
    { step: "등록금수입", value: tuition, pct: pctOfBase(tuition, base) },
    { step: "토지 평가액", value: land, pct: pctOfBase(land, base) },
    { step: "건물 평가액", value: building, pct: pctOfBase(building, base) },
    { step: "유가증권 평가액", value: securities, pct: pctOfBase(securities, base) },
    { step: "예금 평가액", value: deposit, pct: pctOfBase(deposit, base) },
    { step: "기타재산 평가액", value: other, pct: pctOfBase(other, base) },
    { step: "평가액 합계", value: total, pct: pctOfBase(total, base) },
  ];
}

/** 수익율: 평가액 합계 대비 재산별 순수입 → 순수입액 합계 */
export function buildIncomePropertyRevenueFunnel(
  rows: CorpTransferRatioAdvancedRow[],
): FunnelStep[] {
  const data = asIncomePropertyRows(rows);
  const appraised = data.reduce((s, r) => s + r.totalAppraised, 0);
  const land = data.reduce((s, r) => s + r.landNetIncome, 0);
  const building = data.reduce((s, r) => s + r.buildingNetIncome, 0);
  const securities = data.reduce((s, r) => s + r.securitiesNetIncome, 0);
  const deposit = data.reduce((s, r) => s + r.depositNetIncome, 0);
  const other = data.reduce((s, r) => s + r.otherNetIncome, 0);
  const total = data.reduce((s, r) => s + r.totalNetIncome, 0);
  const base = appraised || 1;

  return [
    { step: "평가액 합계", value: appraised, pct: pctOfBase(appraised, base) },
    { step: "토지 순수입", value: land, pct: pctOfBase(land, base) },
    { step: "건물 순수입", value: building, pct: pctOfBase(building, base) },
    { step: "유가증권 순수입", value: securities, pct: pctOfBase(securities, base) },
    { step: "예금 순수입", value: deposit, pct: pctOfBase(deposit, base) },
    { step: "기타재산 순수입", value: other, pct: pctOfBase(other, base) },
    { step: "순수입액 합계", value: total, pct: pctOfBase(total, base) },
  ];
}

const INCOME_PROPERTY_MILLION_FORMAT: Pick<
  AdvancedChartFunnelProfile,
  "valueUnit" | "formatValue"
> = {
  valueUnit: "백만원",
  formatValue: toMillionWon,
};

export const INCOME_PROPERTY_PROPERTY_SECURE_FUNNEL_PROFILE: AdvancedChartFunnelProfile =
  {
    title: "재산확보율 파이프라인 (Funnel)",
    subtitle:
      "전년도 등록금수입 → 재산별 평가액 → 평가액 합계 (백만원 합산 · %는 등록금수입 대비)",
    ...INCOME_PROPERTY_MILLION_FORMAT,
    buildSteps: buildIncomePropertyPropertySecureFunnel,
  };

export const INCOME_PROPERTY_REVENUE_FUNNEL_PROFILE: AdvancedChartFunnelProfile =
  {
    title: "수익율 파이프라인 (Funnel)",
    subtitle:
      "평가액 합계 → 재산별 순수입 → 순수입액 합계 (백만원 합산 · %는 평가액 대비)",
    ...INCOME_PROPERTY_MILLION_FORMAT,
    buildSteps: buildIncomePropertyRevenueFunnel,
  };
