import {
  EXTINCTION_RISK_GRADE_COLORS,
  EXTINCTION_RISK_GRADE_LEGEND,
  EXTINCTION_RISK_TEXT_COLORS,
  getExtinctionRiskGradeStyle,
  getExtinctionRiskTextColor,
} from "@/lib/analysis/regional-decline-grade";
import {
  SCHOOL_AGE_BASELINE_KEY,
  type SchoolAgeAgeKey,
} from "@/lib/ingest/school-age-population-config";

/** 18세 — 차년도 대입 자원 기준 열 */
export { SCHOOL_AGE_BASELINE_KEY };

/** 엑셀 산식: -(값-기준)/기준*100 */
export function calcSchoolAgeDeclineRate(
  value: number,
  baseline: number,
): number {
  if (!baseline) return 0;
  return (-(value - baseline) / baseline) * 100;
}

export function schoolAgeDeclineRateToGrade(rate: number): number {
  if (rate < 5) return 0;
  if (rate < 10) return 1;
  if (rate < 15) return 2;
  if (rate < 20) return 3;
  if (rate < 25) return 4;
  return 5;
}

export function getSchoolAgeCellGrade(
  value: number | null | undefined,
  baseline: number | null | undefined,
): number | null {
  if (value == null || baseline == null) return null;
  const rate = calcSchoolAgeDeclineRate(value, baseline);
  return schoolAgeDeclineRateToGrade(rate);
}

export function isSchoolAgeColoredColumn(key: SchoolAgeAgeKey): boolean {
  const age = Number(key.replace("age_", ""));
  return Number.isFinite(age) && age <= 17;
}

export const SCHOOL_AGE_RISK_INDEX_LEGEND_DESCRIPTION =
  "18세 기준 감소율 5.0%미만, 10.0%미만, 15.0%미만, 20.0%미만, 25.0%미만, 25.0%이상 기준";

export const SCHOOL_AGE_RISK_TEXT_COLORS = EXTINCTION_RISK_TEXT_COLORS;
export const getSchoolAgeRiskTextColor = getExtinctionRiskTextColor;

export { EXTINCTION_RISK_GRADE_COLORS, EXTINCTION_RISK_GRADE_LEGEND, getExtinctionRiskGradeStyle };
