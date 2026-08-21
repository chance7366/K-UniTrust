import type { UniversityRunResult } from "@/lib/competitiveness-analysis/types";

export type AnalyticsGrade = "S" | "A" | "B" | "C" | "D" | "E";

/** 2026년 baseline 캘리브레이션 통합 컷오프 (4년제·전문대 공통) */
export const DIAGNOSTIC_GRADE_CUTOFFS = {
  S: 77.0,
  A: 65.0,
  B: 56.0,
  C: 44.0,
  D: 30.0,
} as const;

/** 타겟 누적 비율 — S 10%, A 30%, B 60%, C 85%, D 93%, E 하위 7% */
export const DIAGNOSTIC_GRADE_TARGET_QUOTAS = {
  S: 10,
  A: 30,
  B: 60,
  C: 85,
  D: 93,
  E: 100,
} as const;

export const HIGH_RISK_BOTTOM_PCT = 7;

export type DiagnosticGradeResult = {
  grade: AnalyticsGrade;
  gradeCapped: boolean;
};

export function gradeFromCompositeScore(score: number): AnalyticsGrade {
  if (score >= DIAGNOSTIC_GRADE_CUTOFFS.S) return "S";
  if (score >= DIAGNOSTIC_GRADE_CUTOFFS.A) return "A";
  if (score >= DIAGNOSTIC_GRADE_CUTOFFS.B) return "B";
  if (score >= DIAGNOSTIC_GRADE_CUTOFFS.C) return "C";
  if (score >= DIAGNOSTIC_GRADE_CUTOFFS.D) return "D";
  return "E";
}

/** 동종 집단 하위 7% 고위험 판별용 순위 임계값 (이 순위 이상이면 고위험) */
export function highRiskThresholdRank(cohortSize: number): number {
  if (cohortSize <= 0) return Number.MAX_SAFE_INTEGER;
  return Math.ceil(cohortSize - cohortSize * (HIGH_RISK_BOTTOM_PCT / 100));
}

export function countHighRiskIndicators(
  indicatorRanks: number[],
  cohortSize: number,
): number {
  const threshold = highRiskThresholdRank(cohortSize);
  return indicatorRanks.filter((rank) => rank > 0 && rank >= threshold).length;
}

export function calculateDiagnosticGrade(
  compositeScore: number,
  indicatorRanks: number[],
  cohortSize: number,
): DiagnosticGradeResult {
  let grade = gradeFromCompositeScore(compositeScore);
  let gradeCapped = false;

  const highRiskCount = countHighRiskIndicators(indicatorRanks, cohortSize);
  if (
    highRiskCount >= 2 &&
    (grade === "S" || grade === "A" || grade === "B")
  ) {
    grade = "C";
    gradeCapped = true;
  }

  return { grade, gradeCapped };
}

export function indicatorRanksFromRow(row: UniversityRunResult): number[] {
  return row.indicators
    .filter((cell) => !cell.dataMissing && cell.rank > 0)
    .map((cell) => cell.rank);
}

export function formatDiagnosticGradeLabel(
  grade: AnalyticsGrade | null,
  gradeCapped: boolean,
  excludedFromRanking: boolean,
): string {
  if (excludedFromRanking) return "등급제외";
  if (grade == null) return "—";
  if (gradeCapped) return "C (지표 불균형)";
  return `${grade}등급`;
}
