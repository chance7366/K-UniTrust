/**
 * page-break 분할 직후 청크(0-based) 병합 규칙
 * 0=1쪽(§1 Executive), 1=2쪽(v2 Insights), 2~=Deep-Dive…
 */
export const REPORT_CHUNK_MERGE_GROUPS: readonly (readonly number[])[] = [
  [2, 3],
  [4, 5],
  [7, 8],
  [19, 20],
  [21, 22],
  [25, 26],
  [27, 28, 29, 30],
] as const;

/** @deprecated 청크 인덱스 기준 REPORT_CHUNK_MERGE_GROUPS 사용 */
export const REPORT_BODY_PAGE_MERGE_GROUPS = REPORT_CHUNK_MERGE_GROUPS;

/** 병합 그룹별 article 추가 CSS 클래스 */
export function mergeGroupArticleClass(chunkIndices: readonly number[]): string {
  if (chunkIndices.includes(2) && chunkIndices.includes(3)) {
    return " report-page-merge-v2-deepdive";
  }
  if (chunkIndices.includes(4) && chunkIndices.includes(5)) {
    return " report-page-merge-v2-decision-swot";
  }
  return "";
}
