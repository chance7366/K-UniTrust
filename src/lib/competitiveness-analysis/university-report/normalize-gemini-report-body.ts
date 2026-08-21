/**
 * Gemini 본문 HTML 정규화 — A4 page-break 분할·병합 파이프라인과 호환
 * (inline style 등이 h3/h4 분할 정규식을 깨뜨리는 문제 방지)
 */

/** style·레이아웃 속성 제거, 표준 제목 클래스만 유지 */
export function normalizeGeminiReportBody(html: string): string {
  return html
    .replace(/\s+style="[^"]*"/gi, "")
    .replace(/\s+style='[^']*'/gi, "")
    .trim();
}
