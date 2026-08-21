/** 학령인구 표 목업 — 행 구분(줄무늬) 배경색 */
export const SCHOOL_AGE_ROW_STRIPE = {
  even: "bg-surface",
  odd: "bg-surface-2/55",
} as const;

export function schoolAgeRowStripe(rowIndex: number): "even" | "odd" {
  return rowIndex % 2 === 0 ? "even" : "odd";
}

export function schoolAgeRowCellBg(rowIndex: number): string {
  return SCHOOL_AGE_ROW_STRIPE[schoolAgeRowStripe(rowIndex)];
}

export const SCHOOL_AGE_TABLE_STYLE_LEGEND = [
  { label: "짝수 행", className: "bg-surface" },
  { label: "홀수 행", className: "bg-surface-2/55" },
] as const;
