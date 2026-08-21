/** 1단계 원지표값 — 고정 8개 지표 (표시·조회 순서) */
export const STEP1_INDICATOR_IDS = [
  "freshman-enrollment-rate",
  "enrolled-enrollment-rate",
  "dropout-rate",
  "fund-secure-rate",
  "financial-support-benefit-rate",
  "tuition-dependency-rate",
  "income-property-secure-rate",
  "corp-transfer-ratio",
] as const;

export type Step1IndicatorId = (typeof STEP1_INDICATOR_IDS)[number];

export const STEP1_INDICATOR_LABELS: Record<Step1IndicatorId, string> = {
  "freshman-enrollment-rate": "신입생충원율",
  "enrolled-enrollment-rate": "재학생충원율",
  "dropout-rate": "중도탈락율",
  "fund-secure-rate": "자금확보율",
  "financial-support-benefit-rate": "재정지원수혜율",
  "tuition-dependency-rate": "등록금의존율",
  "income-property-secure-rate": "수익용재산확보율",
  "corp-transfer-ratio": "법인전입금비율",
};

export type SchoolKindFilter = "university" | "junior-college";

/** 업로드 엑셀 학교종류 → 대학/전문대학 분류 */
export function classifyTargetSchoolKind(
  schoolKind: string,
): SchoolKindFilter | "other" {
  const k = schoolKind.trim();
  if (k.includes("전문대")) return "junior-college";
  if (k.includes("대학")) return "university";
  return "other";
}

export function matchesSchoolKindFilter(
  schoolKind: string,
  filter: SchoolKindFilter,
): boolean {
  const cls = classifyTargetSchoolKind(schoolKind);
  if (cls === "other") return filter === "university";
  return cls === filter;
}
