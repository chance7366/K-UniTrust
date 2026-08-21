import type {
  AdvancedChartFunnelProfile,
  FunnelStep,
} from "@/lib/analysis/advanced-chart-funnel-profile";
import {
  histogramBinDefsFromCuts,
  type AdvancedChartRiskProfile,
} from "@/lib/analysis/advanced-chart-risk-profile";
import { COHORT_RISK_LIST_SUBTITLE } from "@/lib/analysis/cohort-relative-risk";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";

function pctOfBase(value: number, base: number): number {
  if (!base) return 0;
  return Math.round((value / base) * 1000) / 10;
}

function fmtPeople(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}

/** 신입생충원율(정원내) — 낮을수록 위험 */
export const FRESHMAN_FILL_RISK_PROFILE: AdvancedChartRiskProfile = {
  riskThreshold: 100,
  highRiskThreshold: 80,
  riskThresholdLabel: "<100%",
  highRiskThresholdLabel: "<80%",
  regionalRiskHeader: "위험군(동종하위15%)",
  riskDirection: "below",
  riskTierDefs: [
    { tier: "high", label: "고위험 (<80%)", match: (r) => r < 80 },
    { tier: "risk", label: "위험 (80~100%)", match: (r) => r >= 80 && r < 100 },
    { tier: "ok", label: "양호 (100~105%)", match: (r) => r >= 100 && r < 105 },
    { tier: "good", label: "여유 (≥105%)", match: (r) => r >= 105 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([50, 60, 70, 80, 85, 90, 95, 100, 105]),
  histogramSubtitle: "10개 구간별 학교 수",
  densitySubtitle: "하위 25%·중앙값·상위 25%·평균",
  densityReferenceLines: [],
  rateDigits: 1,
  riskListSubtitle: COHORT_RISK_LIST_SUBTITLE,
  riskListFooter:
    "단위: 명 · 정원내 신입생충원율 = 입학자(정원내) ÷ 모집인원(정원내) × 100",
  riskListColumns: {
    numerator: "입학자(정원내)",
    denominator: "모집인원(정원내)",
  },
  formatAmount: fmtPeople,
  densityScale: {
    displayXMin: 40,
    displayXMax: 130,
    binWidth: 2,
  },
};

/** 재학생충원율(정원내) — 낮을수록 위험 */
export const ENROLLED_FILL_RISK_PROFILE: AdvancedChartRiskProfile = {
  ...FRESHMAN_FILL_RISK_PROFILE,
  regionalRiskHeader: "위험군(동종하위15%)",
  histogramSubtitle: "10개 구간별 학교 수",
  riskListFooter:
    "단위: 명 · 정원내 재학생충원율 = 재학생(정원내) ÷ (학생정원−모집정지) × 100",
  riskListColumns: {
    numerator: "재학생(정원내)",
    denominator: "정원(정지차감)",
  },
};

/** 재학생충원율(계) — 낮을수록 위험 */
export const ENROLLED_FILL_TOTAL_RISK_PROFILE: AdvancedChartRiskProfile = {
  ...ENROLLED_FILL_RISK_PROFILE,
  histogramSubtitle: "10개 구간별 학교 수",
  riskListFooter:
    "단위: 명 · 재학생충원율 = 재학생(계) ÷ 학생정원 × 100",
  riskListColumns: {
    numerator: "재학생(계)",
    denominator: "학생정원",
  },
};

/** 신입생충원율(정원내외) — 낮을수록 위험 */
export const FRESHMAN_FILL_WITHIN_OUTSIDE_RISK_PROFILE: AdvancedChartRiskProfile = {
  ...FRESHMAN_FILL_RISK_PROFILE,
  histogramSubtitle: "10개 구간별 학교 수",
  riskListFooter:
    "단위: 명 · 정원내외 신입생충원율 = 입학자(계) ÷ 모집인원(계) × 100",
  riskListColumns: {
    numerator: "입학자(계)",
    denominator: "모집인원(계)",
  },
};

/** 중도탈락율(재적) — 높을수록 위험 */
export const DROPOUT_RISK_PROFILE: AdvancedChartRiskProfile = {
  riskThreshold: 5,
  highRiskThreshold: 8,
  riskThresholdLabel: "≥5%",
  highRiskThresholdLabel: "≥8%",
  regionalRiskHeader: "위험군(동종하위15%)",
  riskDirection: "above",
  riskTierDefs: [
    { tier: "high", label: "고위험 (≥8%)", match: (r) => r >= 8 },
    { tier: "risk", label: "위험 (5~8%)", match: (r) => r >= 5 && r < 8 },
    { tier: "ok", label: "양호 (3~5%)", match: (r) => r >= 3 && r < 5 },
    { tier: "good", label: "안정 (<3%)", match: (r) => r < 3 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([1, 2, 3, 4, 5, 6, 8, 10, 12]),
  histogramSubtitle: "10개 구간별 학교 수",
  densitySubtitle: "하위 25%·중앙값·상위 25%·평균",
  densityReferenceLines: [],
  rateDigits: 2,
  riskListSubtitle: COHORT_RISK_LIST_SUBTITLE,
  riskListFooter:
    "단위: 명 · 재적 중도탈락율 = 중도탈락 ÷ 재적학생 × 100",
  riskListColumns: {
    numerator: "중도탈락",
    denominator: "재적학생",
  },
  formatAmount: fmtPeople,
  densityScale: {
    displayXMin: 0,
    displayXMax: 16,
    binWidth: 0.4,
  },
};

/** 중도탈락율(신입생) — 높을수록 위험 */
export const DROPOUT_FRESHMAN_RISK_PROFILE: AdvancedChartRiskProfile = {
  ...DROPOUT_RISK_PROFILE,
  histogramSubtitle: "10개 구간별 학교 수",
  riskListFooter:
    "단위: 명 · 신입생 중도탈락율 = 신입생 중도탈락 ÷ 신입생 × 100",
  riskListColumns: {
    numerator: "신입생 중도탈락",
    denominator: "신입생",
  },
};

/**
 * 필드 매핑 (CorpTransfer 행 재사용):
 * tuitionRevenue = 분모(모집/정원/재적)
 * totalTransfer = 분자(입학자/재학생/탈락)
 * ordinary / legal / asset = Funnel 중간 단계
 */
function buildCountFunnel(
  rows: CorpTransferRatioAdvancedRow[],
  steps: { step: string; pick: (r: CorpTransferRatioAdvancedRow) => number }[],
): FunnelStep[] {
  const totals = steps.map(({ step, pick }) => ({
    step,
    value: rows.reduce((s, r) => s + pick(r), 0),
  }));
  const base = totals[0]?.value || 1;
  return totals.map((t) => ({
    ...t,
    pct: pctOfBase(t.value, base),
  }));
}

export const FRESHMAN_FILL_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "신입생 충원 파이프라인 (Funnel)",
  subtitle:
    "입학정원 → 모집인원(정원내) → 모집인원(계) → 입학자(계) → 입학자(정원내)",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      // tuitionRevenue=모집정원내(분모), totalTransfer=입학자정원내(분자)
      { step: "입학정원", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "모집인원(정원내)", pick: (r) => r.tuitionRevenue },
      { step: "모집인원(계)", pick: (r) => r.legalObligationTransfer },
      { step: "입학자(계)", pick: (r) => r.assetTransfer },
      { step: "입학자(정원내)", pick: (r) => r.totalTransfer },
    ]),
};

export const FRESHMAN_FILL_WITHIN_OUTSIDE_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "신입생 충원 파이프라인 (Funnel)",
  subtitle: "입학정원 → 모집인원(계) → 입학자(계)",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      { step: "입학정원", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "모집인원(계)", pick: (r) => r.legalObligationTransfer },
      { step: "입학자(계)", pick: (r) => r.assetTransfer },
    ]),
};

export const ENROLLED_FILL_TOTAL_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "재학생 충원 파이프라인 (Funnel)",
  subtitle: "학생정원 → 재학생(계)",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      { step: "학생정원", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "재학생(계)", pick: (r) => r.legalObligationTransfer },
    ]),
};

export const DROPOUT_FRESHMAN_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "중도탈락 규모 파이프라인 (Funnel)",
  subtitle: "신입생 → 신입생 중도탈락",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      { step: "신입생", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "신입생 중도탈락", pick: (r) => r.legalObligationTransfer },
    ]),
};

export const ENROLLED_FILL_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "재학생 충원 파이프라인 (Funnel)",
  subtitle: "학생정원 → 정원(정지차감) → 재학생(계) → 재학생(정원내)",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      { step: "학생정원", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "정원(정지차감)", pick: (r) => r.tuitionRevenue },
      { step: "재학생(계)", pick: (r) => r.legalObligationTransfer },
      { step: "재학생(정원내)", pick: (r) => r.totalTransfer },
    ]),
};

export const DROPOUT_FUNNEL_PROFILE: AdvancedChartFunnelProfile = {
  title: "중도탈락 규모 파이프라인 (Funnel)",
  subtitle: "재적학생 → 신입생 → 재적 중도탈락 → 신입생 중도탈락",
  valueUnit: "명",
  formatValue: fmtPeople,
  buildSteps: (rows) =>
    buildCountFunnel(rows, [
      { step: "재적학생", pick: (r) => r.tuitionRevenue },
      { step: "신입생", pick: (r) => r.ordinaryExpenseTransfer },
      { step: "재적 중도탈락", pick: (r) => r.totalTransfer },
      { step: "신입생 중도탈락", pick: (r) => r.legalObligationTransfer },
    ]),
};

export type StudentFillMockMetric = "freshman" | "enrolled" | "dropout";

export const STUDENT_FILL_MOCK_META: Record<
  StudentFillMockMetric,
  {
    title: string;
    description: string;
    rateLabel: string;
    kpiSub: string;
    riskProfile: AdvancedChartRiskProfile;
    funnelProfile: AdvancedChartFunnelProfile;
    noticeLines: string[];
  }
> = {
  freshman: {
    title: "신입생충원율",
    description: "정원내 신입생충원율 기준 · 자금확보율형 고도화 통계분석 목업",
    rateLabel: "정원내 신입생충원율",
    kpiSub: "Σ입학자(정원내) ÷ Σ모집인원(정원내)",
    riskProfile: FRESHMAN_FILL_RISK_PROFILE,
    funnelProfile: FRESHMAN_FILL_FUNNEL_PROFILE,
    noticeLines: [
      "대학재정분석 › 학생충원 › 신입생충원율 통계분석 신버전 목업입니다.",
      "지역·권역=좌측 권역+우측 시도 split, 분포·위험군=밀도분포+위험단계·히스토그램(자금확보율과 동일).",
      "캠퍼스별/본교통합 DB 토글 지원 · 합성 목업 데이터 · 프로덕션 메뉴 미적용",
    ],
  },
  enrolled: {
    title: "재학생충원율",
    description: "정원내 재학생충원율 기준 · 자금확보율형 고도화 통계분석 목업",
    rateLabel: "정원내 재학생충원율",
    kpiSub: "Σ재학생(정원내) ÷ Σ정원(정지차감)",
    riskProfile: ENROLLED_FILL_RISK_PROFILE,
    funnelProfile: ENROLLED_FILL_FUNNEL_PROFILE,
    noticeLines: [
      "대학재정분석 › 학생충원 › 재학생충원율 통계분석 신버전 목업입니다.",
      "지역·분포 차트 배치는 자금확보율 통계분석과 동일합니다.",
      "캠퍼스별/본교통합 DB 토글 지원 · 합성 목업 데이터 · 프로덕션 메뉴 미적용",
    ],
  },
  dropout: {
    title: "중도탈락율",
    description: "재적학생 중도탈락율 기준 · 높을수록 위험 방향",
    rateLabel: "재적 중도탈락율",
    kpiSub: "Σ중도탈락 ÷ Σ재적학생 · 낮을수록 좋음",
    riskProfile: DROPOUT_RISK_PROFILE,
    funnelProfile: DROPOUT_FUNNEL_PROFILE,
    noticeLines: [
      "대학재정분석 › 학생충원 › 중도탈락율 통계분석 신버전 목업입니다.",
      "위험 방향만 다름(≥5% 위험 · ≥8% 고위험). 차트 배치는 자금확보율과 동일합니다.",
      "캠퍼스별/본교통합 DB 토글 지원 · 합성 목업 데이터 · 프로덕션 메뉴 미적용",
    ],
  },
};
