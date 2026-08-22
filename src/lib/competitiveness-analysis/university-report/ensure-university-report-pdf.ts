import { stat } from "fs/promises";

import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import {
  loadUniversityReportHtml,
  loadUniversityReportMeta,
  loadUniversityReportPdf,
  saveUniversityReportPdf,
  universityReportHtmlPath,
  universityReportPdfPath,
} from "@/lib/competitiveness-analysis/university-report/report-store";

/** HTML보다 PDF가 오래되었으면 재생성 후 Buffer 반환 */
export async function ensureUniversityReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const html = await loadUniversityReportHtml(analysisYear, schoolCodeStd);
  if (!html) {
    throw new Error("보고서 HTML을 찾을 수 없습니다.");
  }

  const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
  const cachedPdf = await loadUniversityReportPdf(analysisYear, schoolCodeStd);
  if (cachedPdf && meta?.pdfGeneratedAt && meta.generatedAt) {
    const pdfAt = Date.parse(meta.pdfGeneratedAt);
    const htmlAt = Date.parse(meta.generatedAt);
    if (Number.isFinite(pdfAt) && Number.isFinite(htmlAt) && pdfAt >= htmlAt) {
      return cachedPdf;
    }
  }

  try {
    const htmlStat = await stat(universityReportHtmlPath(analysisYear, schoolCodeStd));
    const pdfStat = await stat(universityReportPdfPath(analysisYear, schoolCodeStd));
    if (pdfStat.mtimeMs >= htmlStat.mtimeMs) {
      const localPdf = await loadUniversityReportPdf(analysisYear, schoolCodeStd);
      if (localPdf) return localPdf;
    }
  } catch {
    if (cachedPdf) {
      return cachedPdf;
    }
  }

  const pdf = await htmlToPdfBuffer(html);
  if (meta) {
    await saveUniversityReportPdf(analysisYear, schoolCodeStd, pdf, meta);
  }

  return pdf;
}
