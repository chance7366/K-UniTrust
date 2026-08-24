import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import {
  loadUniversityReportHtml,
  loadUniversityReportMeta,
  loadUniversityReportPdf,
  saveUniversityReportPdf,
} from "@/lib/competitiveness-analysis/university-report/report-store";
import { REPORT_PDF_PRINT_GUIDANCE } from "@/lib/reports/report-pdf-messages";

/** Git/Blob에 배포된 report.pdf만 반환 (Vercel API용) */
export async function loadCachedUniversityReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const pdf = await loadUniversityReportPdf(analysisYear, schoolCodeStd);
  if (pdf && pdf.length > 0) {
    return pdf;
  }
  throw new Error(REPORT_PDF_PRINT_GUIDANCE);
}

/** 로컬 CLI: HTML → PDF 생성 후 저장 */
export async function generateUniversityReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const html = await loadUniversityReportHtml(analysisYear, schoolCodeStd);
  if (!html) {
    throw new Error("보고서 HTML을 찾을 수 없습니다.");
  }

  const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
  const pdf = await htmlToPdfBuffer(html);
  if (meta) {
    await saveUniversityReportPdf(analysisYear, schoolCodeStd, pdf, meta);
  }
  return pdf;
}
