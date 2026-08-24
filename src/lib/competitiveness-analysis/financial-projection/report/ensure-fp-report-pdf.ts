import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import { REPORT_PDF_PRINT_GUIDANCE } from "@/lib/reports/report-pdf-messages";

import {
  fpReportPdfPath,
  loadFpReportHtml,
  loadFpReportMeta,
  loadFpReportPdf,
  saveFpReportPdf,
} from "./fp-report-store";

export function fpReportPdfFilename(args: {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
}): string {
  const safeName = args.schoolName.replace(/[\\/:*?"<>|]/g, "_").trim();
  return `${args.analysisYear}_${args.schoolCodeStd}_${safeName}_financial-projection-report.pdf`;
}

/** Git/Blob에 배포된 report.pdf만 반환 (Vercel API용) */
export async function loadCachedFpReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const pdf = await loadFpReportPdf(analysisYear, schoolCodeStd);
  if (pdf && pdf.length > 0) {
    return pdf;
  }
  throw new Error(REPORT_PDF_PRINT_GUIDANCE);
}

/** 로컬 CLI: HTML → PDF 생성 후 저장 */
export async function generateFpReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const html = await loadFpReportHtml(analysisYear, schoolCodeStd);
  if (!html) {
    throw new Error("보고서 HTML을 찾을 수 없습니다.");
  }

  const meta = await loadFpReportMeta(analysisYear, schoolCodeStd);
  const pdf = await htmlToPdfBuffer(html);
  if (meta) {
    await saveFpReportPdf(analysisYear, schoolCodeStd, pdf, meta);
  } else {
    try {
      const { writeFile } = await import("fs/promises");
      await writeFile(fpReportPdfPath(analysisYear, schoolCodeStd), pdf);
    } catch {
      /* read-only FS */
    }
  }
  return pdf;
}
