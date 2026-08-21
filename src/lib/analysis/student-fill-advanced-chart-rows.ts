import type { AdvancedChartFunnelProfile } from "@/lib/analysis/advanced-chart-funnel-profile";
import type { AdvancedChartRiskProfile } from "@/lib/analysis/advanced-chart-risk-profile";
import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
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
import type { DropoutRateRow } from "@/lib/ingest/dropout-rate-config";
import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";
import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";

export type StudentFillChartMetric = "freshman" | "enrolled" | "dropout";

export type FreshmanChartMetric = "within" | "withinOutside";
export type EnrolledChartMetric = "total" | "within";
export type DropoutChartMetric = "enrolled" | "freshman";

export const FRESHMAN_CHART_METRIC_LABELS: Record<FreshmanChartMetric, string> = {
  within: "정원내 신입생충원율",
  withinOutside: "정원내외 신입생충원율",
};

export const ENROLLED_CHART_METRIC_LABELS: Record<EnrolledChartMetric, string> = {
  total: "재학생충원율",
  within: "정원내 재학생충원율",
};

export const DROPOUT_CHART_METRIC_LABELS: Record<DropoutChartMetric, string> = {
  enrolled: "재적학생 중도탈락비율",
  freshman: "신입생 중도탈락비율",
};

export const FRESHMAN_CHART_KPI_SUB: Record<FreshmanChartMetric, string> = {
  within: "Σ입학자(정원내) ÷ Σ모집인원(정원내)",
  withinOutside: "Σ입학자(계) ÷ Σ모집인원(계)",
};

export const ENROLLED_CHART_KPI_SUB: Record<EnrolledChartMetric, string> = {
  total: "Σ재학생(계) ÷ Σ학생정원",
  within: "Σ재학생(정원내) ÷ Σ정원(정지차감)",
};

export const DROPOUT_CHART_KPI_SUB: Record<DropoutChartMetric, string> = {
  enrolled: "Σ중도탈락 ÷ Σ재적학생 · 낮을수록 좋음",
  freshman: "Σ신입생 중도탈락 ÷ Σ신입생 · 낮을수록 좋음",
};

/** @deprecated mock·레거시 호환 */
export const STUDENT_FILL_CHART_RATE_LABEL: Record<StudentFillChartMetric, string> =
  {
    freshman: FRESHMAN_CHART_METRIC_LABELS.within,
    enrolled: ENROLLED_CHART_METRIC_LABELS.within,
    dropout: DROPOUT_CHART_METRIC_LABELS.enrolled,
  };

/** @deprecated mock·레거시 호환 */
export const STUDENT_FILL_CHART_KPI_SUB: Record<StudentFillChartMetric, string> =
  {
    freshman: FRESHMAN_CHART_KPI_SUB.within,
    enrolled: ENROLLED_CHART_KPI_SUB.within,
    dropout: DROPOUT_CHART_KPI_SUB.enrolled,
  };

export function getFreshmanChartRiskProfile(
  metric: FreshmanChartMetric,
): AdvancedChartRiskProfile {
  return metric === "withinOutside"
    ? FRESHMAN_FILL_WITHIN_OUTSIDE_RISK_PROFILE
    : FRESHMAN_FILL_RISK_PROFILE;
}

export function getFreshmanChartFunnelProfile(
  metric: FreshmanChartMetric,
): AdvancedChartFunnelProfile {
  return metric === "withinOutside"
    ? FRESHMAN_FILL_WITHIN_OUTSIDE_FUNNEL_PROFILE
    : FRESHMAN_FILL_FUNNEL_PROFILE;
}

export function getEnrolledChartRiskProfile(
  metric: EnrolledChartMetric,
): AdvancedChartRiskProfile {
  return metric === "total"
    ? ENROLLED_FILL_TOTAL_RISK_PROFILE
    : ENROLLED_FILL_RISK_PROFILE;
}

export function getEnrolledChartFunnelProfile(
  metric: EnrolledChartMetric,
): AdvancedChartFunnelProfile {
  return metric === "total"
    ? ENROLLED_FILL_TOTAL_FUNNEL_PROFILE
    : ENROLLED_FILL_FUNNEL_PROFILE;
}

export function getDropoutChartRiskProfile(
  metric: DropoutChartMetric,
): AdvancedChartRiskProfile {
  return metric === "freshman"
    ? DROPOUT_FRESHMAN_RISK_PROFILE
    : DROPOUT_RISK_PROFILE;
}

export function getDropoutChartFunnelProfile(
  metric: DropoutChartMetric,
): AdvancedChartFunnelProfile {
  return metric === "freshman"
    ? DROPOUT_FRESHMAN_FUNNEL_PROFILE
    : DROPOUT_FUNNEL_PROFILE;
}

/** @deprecated mock·레거시 호환 */
export function getStudentFillRiskProfile(
  metric: StudentFillChartMetric,
): AdvancedChartRiskProfile {
  switch (metric) {
    case "enrolled":
      return getEnrolledChartRiskProfile("within");
    case "dropout":
      return getDropoutChartRiskProfile("enrolled");
    case "freshman":
    default:
      return getFreshmanChartRiskProfile("within");
  }
}

/** @deprecated mock·레거시 호환 */
export function getStudentFillFunnelProfile(
  metric: StudentFillChartMetric,
): AdvancedChartFunnelProfile {
  switch (metric) {
    case "enrolled":
      return getEnrolledChartFunnelProfile("within");
    case "dropout":
      return getDropoutChartFunnelProfile("enrolled");
    case "freshman":
    default:
      return getFreshmanChartFunnelProfile("within");
  }
}

/** CorpTransfer Advanced 행 형태로 매핑 — 분모=tuitionRevenue, 분자=totalTransfer */
export function toFreshmanAdvancedChartRows(
  rows: FreshmanEnrollmentRow[],
  metric: FreshmanChartMetric = "within",
): CorpTransferRatioAdvancedRow[] {
  return rows.map((row) => {
    if (metric === "withinOutside") {
      return {
        year: row.year,
        schoolCodeStd: row.schoolCodeStd,
        schoolName: row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: row.region,
        estb: row.estb,
        tuitionRevenue: row.recruit.total,
        ordinaryExpenseTransfer: row.admissionQuota,
        legalObligationTransfer: row.recruit.total,
        assetTransfer: row.enrolled.total,
        totalTransfer: row.enrolled.total,
        transferRatio: row.fillRate.withinOutside,
      };
    }

    return {
      year: row.year,
      schoolCodeStd: row.schoolCodeStd,
      schoolName: row.schoolName,
      schoolDivision: row.schoolDivision,
      schoolKind: row.schoolKind,
      region: row.region,
      estb: row.estb,
      tuitionRevenue: row.recruit.within,
      ordinaryExpenseTransfer: row.admissionQuota,
      legalObligationTransfer: row.recruit.total,
      assetTransfer: row.enrolled.total,
      totalTransfer: row.enrolled.within,
      transferRatio: row.fillRate.within,
    };
  });
}

export function toEnrolledAdvancedChartRows(
  rows: EnrolledEnrollmentRow[],
  metric: EnrolledChartMetric = "within",
): CorpTransferRatioAdvancedRow[] {
  return rows.map((row) => {
    const quotaNet = Math.max(0, row.studentQuota - row.recruitmentSuspension);

    if (metric === "total") {
      return {
        year: row.year,
        schoolCodeStd: row.schoolCodeStd,
        schoolName: row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: row.region,
        estb: row.estb,
        ordinaryExpenseTransfer: row.studentQuota,
        tuitionRevenue: row.studentQuota,
        legalObligationTransfer: row.enrolled.total,
        assetTransfer: row.recruitmentSuspension,
        totalTransfer: row.enrolled.total,
        transferRatio: row.fillRate,
      };
    }

    return {
      year: row.year,
      schoolCodeStd: row.schoolCodeStd,
      schoolName: row.schoolName,
      schoolDivision: row.schoolDivision,
      schoolKind: row.schoolKind,
      region: row.region,
      estb: row.estb,
      ordinaryExpenseTransfer: row.studentQuota,
      tuitionRevenue: quotaNet,
      legalObligationTransfer: row.enrolled.total,
      assetTransfer: row.recruitmentSuspension,
      totalTransfer: row.enrolled.within,
      transferRatio: row.fillRateWithin,
    };
  });
}

export function toDropoutAdvancedChartRows(
  rows: DropoutRateRow[],
  metric: DropoutChartMetric = "enrolled",
): CorpTransferRatioAdvancedRow[] {
  return rows.map((row) => {
    if (metric === "freshman") {
      return {
        year: row.year,
        schoolCodeStd: row.schoolCodeStd,
        schoolName: row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: row.region,
        estb: row.estb,
        tuitionRevenue: row.freshman.total,
        ordinaryExpenseTransfer: row.freshman.total,
        legalObligationTransfer: row.freshman.dropouts,
        assetTransfer: 0,
        totalTransfer: row.freshman.dropouts,
        transferRatio: row.freshman.rate,
      };
    }

    return {
      year: row.year,
      schoolCodeStd: row.schoolCodeStd,
      schoolName: row.schoolName,
      schoolDivision: row.schoolDivision,
      schoolKind: row.schoolKind,
      region: row.region,
      estb: row.estb,
      tuitionRevenue: row.enrolled.total,
      ordinaryExpenseTransfer: row.freshman.total,
      legalObligationTransfer: row.freshman.dropouts,
      assetTransfer: 0,
      totalTransfer: row.enrolled.dropouts,
      transferRatio: row.enrolled.rate,
    };
  });
}
