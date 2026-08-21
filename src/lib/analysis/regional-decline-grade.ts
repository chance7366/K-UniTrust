export const EXTINCTION_RISK_GRADE_COLORS: Record<
  number,
  { bg: string; text: string; label: string }
> = {
  0: { bg: "#008000", text: "#ffffff", label: "0" },
  1: { bg: "#92D050", text: "#1a1a1a", label: "1" },
  2: { bg: "#BFBFBF", text: "#1a1a1a", label: "2" },
  3: { bg: "#FFFF00", text: "#1a1a1a", label: "3" },
  4: { bg: "#FFC000", text: "#1a1a1a", label: "4" },
  5: { bg: "#FF0000", text: "#ffffff", label: "5" },
};

export function getExtinctionRiskGradeStyle(grade: number) {
  return (
    EXTINCTION_RISK_GRADE_COLORS[grade] ?? {
      bg: "#374151",
      text: "#f3f4f6",
      label: String(grade),
    }
  );
}

/**
 * 표 본문 글자색 — 흰 배경에서 대비가 낮은 노랑(#FFFF00, 등급 3)만 호박색으로 대체.
 */
export const EXTINCTION_RISK_TEXT_COLORS: Record<number, string> = {
  0: EXTINCTION_RISK_GRADE_COLORS[0].bg,
  1: EXTINCTION_RISK_GRADE_COLORS[1].bg,
  2: EXTINCTION_RISK_GRADE_COLORS[2].bg,
  3: "#B45309",
  4: EXTINCTION_RISK_GRADE_COLORS[4].bg,
  5: EXTINCTION_RISK_GRADE_COLORS[5].bg,
};

export function getExtinctionRiskTextColor(grade: number): string {
  return (
    EXTINCTION_RISK_TEXT_COLORS[grade] ??
    EXTINCTION_RISK_GRADE_COLORS[grade]?.bg ??
    "#374151"
  );
}

export const EXTINCTION_RISK_GRADE_LEGEND = [0, 1, 2, 3, 4, 5] as const;

/** 지방소멸위험분류: 10 미만 5, 20 미만 4, 40 미만 3, 60 미만 2, 100 미만 1, 100 이상 0 */
export function gradeFromExtinctionIndex(index: number): number {
  if (index < 10) return 5;
  if (index < 20) return 4;
  if (index < 40) return 3;
  if (index < 60) return 2;
  if (index < 100) return 1;
  return 0;
}
