/** 서버에 배포된 report.pdf가 없을 때 사용자 안내 */
export const REPORT_PDF_PRINT_GUIDANCE =
  "배포된 PDF 파일이 없습니다. 「보고서 열람」 후 브라우저 인쇄(Ctrl+P) → 「PDF로 저장」을 이용해 주세요.";

export function reportMetaHasPdf(meta: {
  pdfFile?: string;
} | null | undefined): boolean {
  return Boolean(meta?.pdfFile);
}
