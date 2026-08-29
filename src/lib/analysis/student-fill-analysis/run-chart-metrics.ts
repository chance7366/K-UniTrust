import type { AdvancedChartHelpPack } from "@/lib/analysis/advanced-chart-help";
import {
  histogramBinDefsFromCuts,
  type AdvancedChartRiskProfile,
} from "@/lib/analysis/advanced-chart-risk-profile";
import { COHORT_RISK_KPI_HELP } from "@/lib/analysis/cohort-relative-risk";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import { SCALE_COMPARE_HELP } from "@/lib/analysis/school-scale-trend";
import {
  DROPOUT_FRESHMAN_FUNNEL_PROFILE,
  DROPOUT_FRESHMAN_RISK_PROFILE,
  DROPOUT_FUNNEL_PROFILE,
  DROPOUT_RISK_PROFILE,
  ENROLLED_FILL_FUNNEL_PROFILE,
  ENROLLED_FILL_RISK_PROFILE,
  ENROLLED_FILL_TOTAL_FUNNEL_PROFILE,
  ENROLLED_FILL_TOTAL_RISK_PROFILE,
  FRESHMAN_FILL_FUNNEL_PROFILE,
  FRESHMAN_FILL_RISK_PROFILE,
  FRESHMAN_FILL_WITHIN_OUTSIDE_FUNNEL_PROFILE,
  FRESHMAN_FILL_WITHIN_OUTSIDE_RISK_PROFILE,
} from "@/lib/analysis/student-fill-advanced-profiles";
import type { AdvancedChartFunnelProfile } from "@/lib/analysis/advanced-chart-funnel-profile";

import type { StudentFillChartHistoryYear } from "./run-chart-rows";
import type { StudentFillSchoolRow } from "./types";
import {
  studentFillRowMatchesEstb,
  type StudentFillEstbFilter,
} from "./cohort-rules";

export type { StudentFillEstbFilter };

export type SfaSchoolKind = "university" | "junior-college" | "all";

export type SfaChartStage = "freshman" | "enrolled" | "foreign";

export type SfaFreshmanMetric = "rateIn" | "rateAll" | "outShare" | "freshmanDropoutRate";
export type SfaEnrolledMetric =
  | "enrolledFillRate"
  | "enrolledFillRateIn"
  | "enrolledOutShare"
  | "dropoutRate";
export type SfaForeignMetric =
  | "foreignShare"
  | "langAbilityRate"
  | "foreignDropRate"
  | "foreignDropAllRate";
export type SfaRunChartMetric = SfaFreshmanMetric | SfaEnrolledMetric | SfaForeignMetric;

export const SFA_FRESHMAN_METRIC_LABELS: Record<SfaFreshmanMetric, string> = {
  rateIn: "정원내충원율",
  rateAll: "정원내외충원율",
  outShare: "정원외비중",
  freshmanDropoutRate: "신입생탈락율",
};

export const SFA_ENROLLED_METRIC_LABELS: Record<SfaEnrolledMetric, string> = {
  enrolledFillRate: "재학생충원율",
  enrolledFillRateIn: "정원내충원율",
  enrolledOutShare: "정원외비중",
  dropoutRate: "중도탈락율",
};

export const SFA_FOREIGN_METRIC_LABELS: Record<SfaForeignMetric, string> = {
  foreignShare: "재적대비비중",
  langAbilityRate: "언어능력충족율",
  foreignDropRate: "외국인탈락율",
  foreignDropAllRate: "전체외국인탈락율",
};

export const SFA_STAGE_DEFAULT_METRIC: Record<SfaChartStage, SfaRunChartMetric> = {
  freshman: "rateIn",
  enrolled: "enrolledFillRate",
  foreign: "foreignShare",
};

function n(v: number | null | undefined): number {
  return v == null || !Number.isFinite(v) ? 0 : v;
}

function pickParts(
  row: StudentFillSchoolRow,
  metric: SfaRunChartMetric,
): { num: number; den: number; rate: number | null } {
  switch (metric) {
    case "rateIn":
      return { num: n(row.admitWithin), den: n(row.recruitWithin), rate: row.rateIn };
    case "rateAll":
      return { num: n(row.admitTotal), den: n(row.recruitTotal), rate: row.rateAll };
    case "outShare":
      return { num: n(row.admitOutside), den: n(row.admitTotal), rate: row.outShare };
    case "freshmanDropoutRate":
      return {
        num: n(row.freshmanDropoutCount),
        den: n(row.freshmanDropoutEnrolled),
        rate: row.freshmanDropoutRate,
      };
    case "enrolledFillRate":
      return { num: n(row.enrolledFill), den: n(row.enrolledFillDenom), rate: row.enrolledFillRate };
    case "enrolledFillRateIn": {
      const den = n(row.enrolledFillDenom);
      const num =
        row.enrolledFillRateIn != null && den > 0
          ? (row.enrolledFillRateIn / 100) * den
          : 0;
      return { num, den, rate: row.enrolledFillRateIn };
    }
    case "enrolledOutShare": {
      const num = n(row.enrolledOutside);
      const den =
        row.enrolledOutShare != null && row.enrolledOutShare > 0 && row.enrolledOutside != null
          ? row.enrolledOutside / (row.enrolledOutShare / 100)
          : 0;
      return { num, den, rate: row.enrolledOutShare };
    }
    case "dropoutRate":
      return { num: n(row.dropoutCount), den: n(row.dropoutEnrolled), rate: row.dropoutRate };
    case "foreignShare":
      return { num: n(row.foreignDegree), den: n(row.enrolledTotal), rate: row.foreignShare };
    case "langAbilityRate": {
      const den = n(row.foreignDegree);
      const num =
        row.langAbilityRate != null && den > 0 ? (row.langAbilityRate / 100) * den : 0;
      return { num, den, rate: row.langAbilityRate };
    }
    case "foreignDropRate":
      return {
        num: n(row.foreignDropCount),
        den: n(row.foreignDropEnrolled),
        rate: row.foreignDropRate,
      };
    case "foreignDropAllRate":
      return {
        num: n(row.foreignDropAllCount),
        den: n(row.foreignDropAllEnrolled),
        rate: row.foreignDropAllRate,
      };
  }
}

const KPI_SUB: Record<SfaRunChartMetric, string> = {
  rateIn: "Σ정원내입학 ÷ Σ정원내모집",
  rateAll: "Σ입학 계 ÷ Σ모집 계",
  outShare: "Σ정원외입학 ÷ Σ입학 계",
  freshmanDropoutRate: "Σ신입생탈락 ÷ Σ신입생 · 낮을수록 좋음",
  enrolledFillRate: "Σ재학생 ÷ Σ(학생정원−모집정지)",
  enrolledFillRateIn: "Σ정원내재학생 ÷ Σ(학생정원−모집정지)",
  enrolledOutShare: "Σ정원외재학생 ÷ Σ재학생(A)",
  dropoutRate: "Σ중도탈락 ÷ Σ재적 · 낮을수록 좋음",
  foreignShare: "Σ학위외국인 ÷ Σ재학생수",
  langAbilityRate: "Σ언어능력충족 ÷ Σ학위외국인",
  foreignDropRate: "Σ학위외국인탈락 ÷ Σ학위외국인재적 · 낮을수록 좋음",
  foreignDropAllRate: "Σ전체외국인탈락 ÷ Σ전체외국인재적 · 낮을수록 좋음",
};

const SHARE_HIGH_RISK: AdvancedChartRiskProfile = {
  ...DROPOUT_RISK_PROFILE,
  riskThreshold: 15,
  highRiskThreshold: 25,
  riskThresholdLabel: "≥15%",
  highRiskThresholdLabel: "≥25%",
  riskTierDefs: [
    { tier: "high", label: "고위험 (≥25%)", match: (r) => r >= 25 },
    { tier: "risk", label: "위험 (15~25%)", match: (r) => r >= 15 && r < 25 },
    { tier: "ok", label: "양호 (8~15%)", match: (r) => r >= 8 && r < 15 },
    { tier: "good", label: "안정 (<8%)", match: (r) => r < 8 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([4, 6, 8, 10, 12, 15, 20, 25, 30]),
  densityScale: { displayXMin: 0, displayXMax: 40, binWidth: 1 },
};

const FOREIGN_SHARE_RISK: AdvancedChartRiskProfile = {
  ...FRESHMAN_FILL_RISK_PROFILE,
  riskThreshold: 8,
  highRiskThreshold: 3,
  riskThresholdLabel: "<8%",
  highRiskThresholdLabel: "<3%",
  riskTierDefs: [
    { tier: "high", label: "고위험 (<3%)", match: (r) => r < 3 },
    { tier: "risk", label: "위험 (3~8%)", match: (r) => r >= 3 && r < 8 },
    { tier: "ok", label: "양호 (8~15%)", match: (r) => r >= 8 && r < 15 },
    { tier: "good", label: "여유 (≥15%)", match: (r) => r >= 15 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([2, 3, 5, 8, 10, 12, 15, 20, 25]),
  densityScale: { displayXMin: 0, displayXMax: 30, binWidth: 0.8 },
};

const LANG_RISK: AdvancedChartRiskProfile = {
  ...FRESHMAN_FILL_RISK_PROFILE,
  riskThreshold: 70,
  highRiskThreshold: 50,
  riskThresholdLabel: "<70%",
  highRiskThresholdLabel: "<50%",
  riskTierDefs: [
    { tier: "high", label: "고위험 (<50%)", match: (r) => r < 50 },
    { tier: "risk", label: "위험 (50~70%)", match: (r) => r >= 50 && r < 70 },
    { tier: "ok", label: "양호 (70~85%)", match: (r) => r >= 70 && r < 85 },
    { tier: "good", label: "여유 (≥85%)", match: (r) => r >= 85 },
  ],
  histogramBinDefs: histogramBinDefsFromCuts([30, 40, 50, 60, 70, 75, 80, 85, 90]),
  densityScale: { displayXMin: 0, displayXMax: 100, binWidth: 2 },
};

function withList(
  base: AdvancedChartRiskProfile,
  numerator: string,
  denominator: string,
  footer: string,
): AdvancedChartRiskProfile {
  return {
    ...base,
    riskListColumns: { numerator, denominator },
    riskListFooter: footer,
  };
}

export function sfaRunChartLabel(metric: SfaRunChartMetric): string {
  if (metric in SFA_FRESHMAN_METRIC_LABELS) {
    return SFA_FRESHMAN_METRIC_LABELS[metric as SfaFreshmanMetric];
  }
  if (metric in SFA_ENROLLED_METRIC_LABELS) {
    return SFA_ENROLLED_METRIC_LABELS[metric as SfaEnrolledMetric];
  }
  return SFA_FOREIGN_METRIC_LABELS[metric as SfaForeignMetric];
}

export function sfaRunChartKpiSub(metric: SfaRunChartMetric): string {
  return KPI_SUB[metric];
}

export function sfaRunChartMetricLabels(stage: SfaChartStage): Record<string, string> {
  if (stage === "freshman") return SFA_FRESHMAN_METRIC_LABELS;
  if (stage === "enrolled") return SFA_ENROLLED_METRIC_LABELS;
  return SFA_FOREIGN_METRIC_LABELS;
}

export function isMetricForStage(stage: SfaChartStage, metric: SfaRunChartMetric): boolean {
  return Object.prototype.hasOwnProperty.call(sfaRunChartMetricLabels(stage), metric);
}

export function sfaRunChartRiskProfile(metric: SfaRunChartMetric): AdvancedChartRiskProfile {
  const label = sfaRunChartLabel(metric);
  switch (metric) {
    case "rateIn":
      return withList(
        FRESHMAN_FILL_RISK_PROFILE,
        "정원내입학",
        "정원내모집",
        `단위: 명 · ${label} = 정원내입학 ÷ 정원내모집 × 100`,
      );
    case "rateAll":
      return withList(
        FRESHMAN_FILL_WITHIN_OUTSIDE_RISK_PROFILE,
        "입학 계",
        "모집 계",
        `단위: 명 · ${label} = 입학 계 ÷ 모집 계 × 100`,
      );
    case "outShare":
      return withList(
        SHARE_HIGH_RISK,
        "정원외입학",
        "입학 계",
        `단위: 명 · ${label} = 정원외입학 ÷ 입학 계 × 100`,
      );
    case "freshmanDropoutRate":
      return withList(
        DROPOUT_FRESHMAN_RISK_PROFILE,
        "신입생탈락",
        "신입생",
        `단위: 명 · ${label} = 신입생탈락 ÷ 신입생 × 100`,
      );
    case "enrolledFillRate":
      return withList(
        ENROLLED_FILL_TOTAL_RISK_PROFILE,
        "재학생",
        "학생정원(정지차감)",
        `단위: 명 · ${label} = 재학생 ÷ (학생정원−모집정지) × 100`,
      );
    case "enrolledFillRateIn":
      return withList(
        ENROLLED_FILL_RISK_PROFILE,
        "정원내재학생",
        "학생정원(정지차감)",
        `단위: 명 · ${label} = 정원내재학생 ÷ (학생정원−모집정지) × 100`,
      );
    case "enrolledOutShare":
      return withList(
        SHARE_HIGH_RISK,
        "정원외재학생",
        "재학생(A)",
        `단위: 명 · ${label} = 정원외재학생 ÷ 재학생(A) × 100`,
      );
    case "dropoutRate":
      return withList(
        DROPOUT_RISK_PROFILE,
        "중도탈락",
        "재적",
        `단위: 명 · ${label} = 중도탈락 ÷ 재적 × 100`,
      );
    case "foreignShare":
      return withList(
        FOREIGN_SHARE_RISK,
        "학위외국인",
        "재학생수",
        `단위: 명 · ${label} = 학위외국인 ÷ 재학생수 × 100`,
      );
    case "langAbilityRate":
      return withList(
        LANG_RISK,
        "언어능력충족",
        "학위외국인",
        `단위: 명 · ${label} = 언어능력충족 ÷ 학위외국인 × 100`,
      );
    case "foreignDropRate":
      return withList(
        DROPOUT_RISK_PROFILE,
        "학위외국인탈락",
        "학위외국인재적",
        `단위: 명 · ${label} = 학위외국인탈락 ÷ 학위외국인재적 × 100`,
      );
    case "foreignDropAllRate":
      return withList(
        DROPOUT_RISK_PROFILE,
        "전체외국인탈락",
        "전체외국인재적",
        `단위: 명 · ${label} = 전체외국인탈락 ÷ 전체외국인재적 × 100`,
      );
  }
}

export function sfaRunChartFunnelProfile(metric: SfaRunChartMetric): AdvancedChartFunnelProfile {
  switch (metric) {
    case "rateIn":
      return FRESHMAN_FILL_FUNNEL_PROFILE;
    case "rateAll":
    case "outShare":
      return FRESHMAN_FILL_WITHIN_OUTSIDE_FUNNEL_PROFILE;
    case "freshmanDropoutRate":
      return DROPOUT_FRESHMAN_FUNNEL_PROFILE;
    case "enrolledFillRate":
      return ENROLLED_FILL_TOTAL_FUNNEL_PROFILE;
    case "enrolledFillRateIn":
    case "enrolledOutShare":
      return ENROLLED_FILL_FUNNEL_PROFILE;
    case "dropoutRate":
      return DROPOUT_FUNNEL_PROFILE;
    default:
      return DROPOUT_FUNNEL_PROFILE;
  }
}

export function sfaRunChartHelp(metric: SfaRunChartMetric): AdvancedChartHelpPack {
  const rateLabel = sfaRunChartLabel(metric);
  const formula = KPI_SUB[metric];
  const worseHigh =
    metric === "outShare" ||
    metric === "freshmanDropoutRate" ||
    metric === "enrolledOutShare" ||
    metric === "dropoutRate" ||
    metric === "foreignDropRate" ||
    metric === "foreignDropAllRate";
  return {
    overview: {
      title: "통계분석 대시보드 개요",
      body: `선택한 연도·설립구분·학교종류 필터와 대학·전문대학·전체대학 범위에 따라 ${rateLabel}을 다각도로 분석합니다. 산출은 ${formula}입니다.`,
    },
    kpi: {
      avgRate: {
        title: `전국 평균 ${rateLabel}`,
        body: `필터를 통과한 대학을 ${formula}로 가중 평균합니다. 전년 대비(%p)는 동일 필터 기준 증감입니다.${worseHigh ? " 상승은 악화 방향입니다." : ""}`,
      },
      medianIqr: {
        title: "중앙값 & IQR",
        body: `개별 대학 ${rateLabel}의 중앙값과 사분위 범위(IQR = Q3−Q1)입니다.`,
      },
      riskCount: COHORT_RISK_KPI_HELP,
      schoolCount: {
        title: "분석 대상",
        body: "현재 연도와 필터를 통과한 학교 수입니다. KPI·차트·표는 이 집단을 기준으로 집계합니다.",
      },
    },
    tab: {
      risk: {
        title: "위험군대학 탭",
        body: "이 화면에서는 사용하지 않습니다.",
      },
      geo: {
        title: "지역·규모 탭",
        body: `5극 3특 권역, 학생 규모, 17개 시·도 순위로 ${rateLabel}과 전년 대비를 비교합니다.`,
      },
      distribution: {
        title: "분포·위험 탭",
        body: `밀도 분포·히스토그램·위험 단계로 ${rateLabel} 분포와 구간별 학교 수를 봅니다.`,
      },
      pipeline: {
        title: "시계열 탭",
        body: "5개년 권역별·규모별 추이로 중장기 변화를 비교합니다. 규모는 재학생수 기준입니다.",
      },
    },
    chart: {
      zoneCompare: {
        title: "5극 3특 권역 비교",
        body: `권역별 가중 평균 ${rateLabel}(막대)과 전년 대비(%p, 선)입니다.`,
      },
      scaleCompare: SCALE_COMPARE_HELP,
      sidoRank: {
        title: "17개 시·도 순위",
        body: `시·도별 평균 ${rateLabel}과 전년 대비를 나열합니다.`,
      },
      sidoTable: {
        title: "17개 시·도 상세 테이블",
        body: "시·도별 학교 수와 가중 평균, 전년 대비, 중앙값을 표로 제공합니다.",
      },
      schoolPreview: {
        title: "위험군 대학 목록",
        body: "이 화면에서는 사용하지 않습니다.",
      },
      boxPlot: {
        title: `${rateLabel} 분포 (Box Plot)`,
        body: `수도권/비수도권, 대학/전문대학 그룹별 ${rateLabel} 분포입니다.`,
      },
      density: {
        title: `${rateLabel} 밀도 분포`,
        body: `대학별 ${rateLabel}(%)의 밀도 곡선과 사분위·가중 평균 위치입니다.`,
      },
      histogram: {
        title: "히스토그램",
        body: `${rateLabel}을 구간으로 나누어 학교 수를 표시합니다.`,
      },
      riskTier: {
        title: `${rateLabel} 위험 단계별 분포`,
        body: "위험 단계 구간별 학교 수입니다.",
      },
      trend: {
        title: "5개년 권역별 추이",
        body: `권역별 평균 ${rateLabel} 추이입니다.`,
      },
      funnel: {
        title: "5개년 규모별 추이",
        body: `규모별 가중 평균 ${rateLabel} 추이입니다.`,
      },
    },
  };
}

export function filterHistoryBySchoolKind(
  history: StudentFillChartHistoryYear[],
  schoolKind: SfaSchoolKind,
): StudentFillChartHistoryYear[] {
  if (schoolKind === "all") return history;
  const division = schoolKind === "junior-college" ? "전문대학" : "대학";
  return history.map((item) => ({
    ...item,
    schools: item.schools.filter((row) => row.schoolDivision === division),
  }));
}

export function filterHistoryByEstb(
  history: StudentFillChartHistoryYear[],
  estbFilter: StudentFillEstbFilter,
): StudentFillChartHistoryYear[] {
  if (estbFilter === "all") return history;
  return history.map((item) => ({
    ...item,
    schools: item.schools.filter((row) =>
      studentFillRowMatchesEstb(row.estb, estbFilter),
    ),
  }));
}

export function toSfaRunChartRows(
  history: StudentFillChartHistoryYear[],
  metric: SfaRunChartMetric,
): CorpTransferRatioAdvancedRow[] {
  return history.flatMap(({ year, schools }) =>
    schools.flatMap((row) => {
      const parts = pickParts(row, metric);
      if (parts.den <= 0 || parts.rate == null) return [];
      return [
        {
          year,
          schoolCodeStd: row.schoolCodeStd,
          schoolName: row.schoolName,
          schoolDivision: row.schoolDivision,
          schoolKind: row.schoolKind,
          region: row.region,
          estb: row.estb,
          tuitionRevenue: parts.den,
          ordinaryExpenseTransfer: 0,
          legalObligationTransfer: parts.den,
          assetTransfer: parts.num,
          totalTransfer: parts.num,
          transferRatio: parts.rate,
        },
      ];
    }),
  );
}
