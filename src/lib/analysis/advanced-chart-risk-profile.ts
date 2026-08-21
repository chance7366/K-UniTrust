import { COHORT_RISK_LIST_SUBTITLE } from "@/lib/analysis/cohort-relative-risk";

export type RiskTierDef = {
  tier: string;
  label: string;
  match: (rate: number) => boolean;
};

export type HistogramBinDef = {
  label: string;
  order: number;
  match: (rate: number) => boolean;
};

/** 경계값 9개 → 10칸 (`<첫값`, 사이 8칸, `≥마지막값`) */
export function histogramBinDefsFromCuts(
  cuts: readonly [number, number, number, number, number, number, number, number, number],
): HistogramBinDef[] {
  const fmt = (v: number) =>
    v.toLocaleString("ko-KR", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
  const defs: HistogramBinDef[] = [
    {
      label: `<${fmt(cuts[0])}%`,
      order: cuts[0] - 1,
      match: (r) => r < cuts[0],
    },
  ];
  for (let i = 0; i < 8; i++) {
    const lo = cuts[i];
    const hi = cuts[i + 1];
    defs.push({
      label: `${fmt(lo)}~${fmt(hi)}%`,
      order: lo,
      match: (r) => r >= lo && r < hi,
    });
  }
  defs.push({
    label: `≥${fmt(cuts[8])}%`,
    order: cuts[8],
    match: (r) => r >= cuts[8],
  });
  return defs;
}

export function buildHistogramBars(
  values: number[],
  defs: HistogramBinDef[],
  riskDirection: "below" | "above" = "below",
): HistogramBar[] {
  return defs.map(({ label, order, match }, i) => ({
    bin: label,
    order,
    fill: histogramBarFill(i, defs.length, riskDirection),
    count: values.filter(match).length,
  }));
}

export type HistogramBar = {
  bin: string;
  count: number;
  order: number;
  fill: string;
};

/** 고위험(빨강) → 위험(주황) → 양호(파랑) → 여유(녹색) */
const HISTOGRAM_RAMP = [
  "#BE123C",
  "#F43F5E",
  "#F59E0B",
  "#FBBF24",
  "#3B82F6",
  "#10B981",
] as const;

function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(Math.round(ar + (br - ar) * t))}${hex(Math.round(ag + (bg - ag) * t))}${hex(Math.round(ab + (bb - ab) * t))}`;
}

/** 구간 막대 색 — below=높을수록 좋음(좌측 빨강), above=높을수록 위험(좌측 녹색) */
export function histogramBarFill(
  index: number,
  binCount: number,
  riskDirection: "below" | "above" = "below",
): string {
  const last = HISTOGRAM_RAMP.length - 1;
  if (binCount <= 1) {
    return riskDirection === "above" ? HISTOGRAM_RAMP[0] : HISTOGRAM_RAMP[last];
  }
  const t = index / (binCount - 1);
  const pos = riskDirection === "above" ? 1 - t : t;
  const scaled = pos * last;
  const i = Math.min(last - 1, Math.floor(scaled));
  return mixHex(HISTOGRAM_RAMP[i], HISTOGRAM_RAMP[i + 1], scaled - i);
}

export type DensityReferenceLine = {
  x: number;
  label: string;
  sub?: string;
  dashed?: boolean;
  color?: string;
};

/** 통계분석 위험군·히스토그램·밀도분포 참고선 설정 */
export type AdvancedChartRiskProfile = {
  riskThreshold: number;
  highRiskThreshold: number;
  riskThresholdLabel: string;
  highRiskThresholdLabel: string;
  regionalRiskHeader: string;
  /**
   * below = 임계값 미만이 위험 (충원율·자금확보율 등, 기본)
   * above = 임계값 이상이 위험 (중도탈락율·등록금의존율 등)
   */
  riskDirection?: "below" | "above";
  riskTierDefs: RiskTierDef[];
  histogramBinDefs: HistogramBinDef[];
  histogramSubtitle: string;
  densitySubtitle: string;
  densityReferenceLines: DensityReferenceLine[];
  /** 위험군 목록·KPI 등 비율 표시 소수 자릿수 */
  rateDigits: number;
  riskListSubtitle: string;
  riskListFooter: string;
  riskListColumns: {
    numerator: string;
    denominator: string;
  };
  /** 위험군 목록 금액 표시 (미지정 시 그대로 locale) */
  formatAmount?: (value: number) => string;
  /** 밀도 차트 X축 스케일 (미지정 시 자금확보율 기본값) */
  densityScale?: {
    displayXMin: number;
    displayXMax: number;
    binWidth: number;
  };
};

export function isAdvancedChartRiskRate(
  rate: number,
  profile: Pick<
    AdvancedChartRiskProfile,
    "riskThreshold" | "riskDirection"
  >,
): boolean {
  return profile.riskDirection === "above"
    ? rate >= profile.riskThreshold
    : rate < profile.riskThreshold;
}

export function isAdvancedChartHighRiskRate(
  rate: number,
  profile: Pick<
    AdvancedChartRiskProfile,
    "highRiskThreshold" | "riskDirection"
  >,
): boolean {
  return profile.riskDirection === "above"
    ? rate >= profile.highRiskThreshold
    : rate < profile.highRiskThreshold;
}

export const CORP_TRANSFER_RISK_PROFILE: AdvancedChartRiskProfile = {
  riskThreshold: 20,
  highRiskThreshold: 10,
  riskThresholdLabel: "<20%",
  highRiskThresholdLabel: "<10%",
  regionalRiskHeader: "위험군(동종하위15%)",
  riskTierDefs: [
    { tier: "high", label: "고위험 (<10%)", match: (r) => r < 10 },
    { tier: "risk", label: "위험 (10~20%)", match: (r) => r >= 10 && r < 20 },
    { tier: "ok", label: "양호 (20~50%)", match: (r) => r >= 20 && r < 50 },
    { tier: "good", label: "여유 (≥50%)", match: (r) => r >= 50 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([5, 10, 15, 20, 25, 30, 40, 50, 70]),
  histogramSubtitle: "10개 구간별 학교 수",
  densitySubtitle: "하위 25%·중앙값·상위 25%·평균",
  densityReferenceLines: [],
  rateDigits: 1,
  riskListSubtitle: COHORT_RISK_LIST_SUBTITLE,
  riskListFooter:
    "금액 단위: 억원 · 전입금비율 = 전입금합계(억원) ÷ 등록금수입(억원) × 100",
  riskListColumns: {
    numerator: "전입금합계(억원)",
    denominator: "등록금수입(억원)",
  },
};

export const INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE: AdvancedChartRiskProfile =
  {
    riskThreshold: 100,
    highRiskThreshold: 80,
    riskThresholdLabel: "<100%",
    highRiskThresholdLabel: "<80%",
    regionalRiskHeader: "위험군(동종하위15%)",
    riskTierDefs: [
      { tier: "high", label: "고위험 (<80%)", match: (r) => r < 80 },
      { tier: "risk", label: "위험 (80~100%)", match: (r) => r >= 80 && r < 100 },
      { tier: "ok", label: "양호 (100~120%)", match: (r) => r >= 100 && r < 120 },
      { tier: "good", label: "여유 (≥120%)", match: (r) => r >= 120 },
    ],
    histogramBinDefs: histogramBinDefsFromCuts([50, 70, 80, 90, 100, 110, 120, 150, 200]),
    histogramSubtitle: "10개 구간별 학교 수",
    densitySubtitle: "하위 25%·중앙값·상위 25%·평균",
    densityReferenceLines: [],
    rateDigits: 1,
    riskListSubtitle: COHORT_RISK_LIST_SUBTITLE,
    riskListFooter:
      "금액 단위: 백만원 · 재산확보율 = 평가액합계 ÷ 전년도 등록금수입 × 100",
    riskListColumns: {
      numerator: "평가액합계(백만원)",
      denominator: "등록금수입(백만원)",
    },
    formatAmount: (value) =>
      Math.round(value / 1000).toLocaleString("ko-KR"),
  };

export const INCOME_PROPERTY_REVENUE_RISK_PROFILE: AdvancedChartRiskProfile = {
  riskThreshold: 2,
  highRiskThreshold: 1,
  riskThresholdLabel: "<2%",
  highRiskThresholdLabel: "<1%",
  regionalRiskHeader: "위험군(동종하위15%)",
  riskTierDefs: [
    { tier: "high", label: "고위험 (<1%)", match: (r) => r < 1 },
    { tier: "risk", label: "위험 (1~2%)", match: (r) => r >= 1 && r < 2 },
    { tier: "ok", label: "양호 (2~3%)", match: (r) => r >= 2 && r < 3 },
    { tier: "good", label: "여유 (≥3%)", match: (r) => r >= 3 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([0.3, 0.6, 1, 1.5, 2, 2.5, 3, 4, 6]),
  histogramSubtitle: "10개 구간별 학교 수",
  densitySubtitle: "하위 25%·중앙값·상위 25%·평균",
  densityReferenceLines: [],
  rateDigits: 2,
  riskListSubtitle: COHORT_RISK_LIST_SUBTITLE,
  riskListFooter:
    "금액 단위: 백만원 · 수익율 = 순수입액합계 ÷ 평가액합계 × 100",
  riskListColumns: {
    numerator: "순수입액합계(백만원)",
    denominator: "평가액합계(백만원)",
  },
  formatAmount: (value) => Math.round(value / 1000).toLocaleString("ko-KR"),
  densityScale: {
    displayXMin: 0,
    displayXMax: 8,
    binWidth: 0.2,
  },
};
