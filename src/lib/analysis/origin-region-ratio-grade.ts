/** 특광자치시 비율(%) 구간별 붉은색 계열 — 40·30·20·10 기준 */
export const ORIGIN_REGION_SPECIAL_CITY_RATIO_COLORS: Record<
  number,
  { bg: string; text: string; label: string }
> = {
  0: { bg: "#7F1D1D", text: "#ffffff", label: "0" }, // 40%+
  1: { bg: "#B91C1C", text: "#ffffff", label: "1" }, // 30%+
  2: { bg: "#DC2626", text: "#ffffff", label: "2" }, // 20%+
  3: { bg: "#EF4444", text: "#ffffff", label: "3" }, // 10%+
  4: { bg: "#F87171", text: "#1a1a1a", label: "4" }, // 10% 미만
};

/** 특광자치시 비율(%) 구간 — 40·30·20·10 기준 */
export function specialCityRatioToGrade(ratio: number): number {
  if (ratio >= 40) return 0;
  if (ratio >= 30) return 1;
  if (ratio >= 20) return 2;
  if (ratio >= 10) return 3;
  return 4;
}

export function getSpecialCityRatioColor(ratio: number | null | undefined): string | null {
  if (ratio == null || Number.isNaN(ratio)) return null;
  const grade = specialCityRatioToGrade(ratio);
  return ORIGIN_REGION_SPECIAL_CITY_RATIO_COLORS[grade]?.bg ?? null;
}

export const ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND = [0, 1, 2, 3, 4] as const;

export const ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND_DESCRIPTION =
  "특광자치시 비율 40.0%이상, 30.0%이상, 20.0%이상, 10.0%이상, 10.0%미만 기준";
