export type SchoolScaleLabel = "대규모" | "중규모" | "소규모";

/** 대학경쟁력분석 3단계와 동일한 재학생수 규모 분류 */
export function schoolScaleFromEnrolled(
  enrolled: number | null | undefined,
  kind: "4년제" | "전문대",
): SchoolScaleLabel | null {
  if (enrolled == null || Number.isNaN(enrolled)) return null;
  if (kind === "전문대") {
    if (enrolled >= 4000) return "대규모";
    if (enrolled >= 2000) return "중규모";
    return "소규모";
  }
  if (enrolled >= 10000) return "대규모";
  if (enrolled >= 5000) return "중규모";
  return "소규모";
}
