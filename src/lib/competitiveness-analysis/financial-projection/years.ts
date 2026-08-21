import {
  SCHOOL_AGE_BASELINE_AGE,
  SCHOOL_AGE_FAR_AGE,
  admissionYearFromAge,
} from "@/lib/ingest/school-age-population-config";

/** 자료가 아직 없는 새 연도를 열 때 쓰는 기본 분석연도 */
export const FP_DEFAULT_ANALYSIS_YEAR = 2025;

/** @deprecated 분석연도는 에디션별로 다름. 기본값(2025)만 가리킴 */
export const FP_ANALYSIS_YEAR = FP_DEFAULT_ANALYSIS_YEAR;

/** 교비 수업료 실적을 시계열에 넣는 시작연도 */
export const FP_HISTORY_START_YEAR = 2020;

/** 대학원 학제(석사 과정 가정) */
export const FP_GRAD_PROGRAM_YEARS = 2;

export function isFpAnalysisYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

/** 분석연도 Y의 교비 결산연도 = Y−1 */
export function settlementYearOf(analysisYear: number): number {
  return analysisYear - 1;
}

/**
 * 학령인구 자료연도(분석연도 탭) 18세 → 다음 학년도 대입.
 * 지수 100의 기준연도.
 */
export function schoolAgeIndexBaseYearOf(analysisYear: number): number {
  return admissionYearFromAge(analysisYear, SCHOOL_AGE_BASELINE_AGE);
}

/**
 * 학령인구 자료연도 0세 → 대입연도. 전망 시계열 끝.
 * 2025년 탭 0세 = 2044.
 */
export function projectionEndYearOf(analysisYear: number): number {
  return admissionYearFromAge(analysisYear, SCHOOL_AGE_FAR_AGE);
}

/** @deprecated settlementYearOf(FP_DEFAULT_ANALYSIS_YEAR) */
export const FP_SETTLEMENT_YEAR = settlementYearOf(FP_DEFAULT_ANALYSIS_YEAR);

/** @deprecated projectionEndYearOf(FP_DEFAULT_ANALYSIS_YEAR) */
export const FP_END_YEAR = projectionEndYearOf(FP_DEFAULT_ANALYSIS_YEAR);

export function mergeFpAnalysisYears(
  ...lists: Array<Iterable<number> | null | undefined>
): number[] {
  const set = new Set<number>();
  for (const list of lists) {
    if (!list) continue;
    for (const year of list) {
      if (isFpAnalysisYear(year)) set.add(year);
    }
  }
  if (!set.size) set.add(FP_DEFAULT_ANALYSIS_YEAR);
  return [...set].sort((a, b) => b - a);
}
