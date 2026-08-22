import { stat } from "fs/promises";

import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";

import {
  fpReportHtmlPath,
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

/** HTML보다 PDF가 오래되었으면 재생성 후 Buffer 반환 */
export async function ensureFpReportPdf(
  analysisYear: number,
  schoolCodeStd: string,
): Promise<Buffer> {
  const html = await loadFpReportHtml(analysisYear, schoolCodeStd);
  if (!html) {
    throw new Error("보고서 HTML을 찾을 수 없습니다.");
  }

  const meta = await loadFpReportMeta(analysisYear, schoolCodeStd);
  const cachedPdf = await loadFpReportPdf(analysisYear, schoolCodeStd);
  if (cachedPdf && meta?.pdfGeneratedAt && meta.generatedAt) {
    const pdfAt = Date.parse(meta.pdfGeneratedAt);
    const htmlAt = Date.parse(meta.generatedAt);
    if (Number.isFinite(pdfAt) && Number.isFinite(htmlAt) && pdfAt >= htmlAt) {
      return cachedPdf;
    }
  }

  let needsGenerate = true;
  try {
    const htmlStat = await stat(fpReportHtmlPath(analysisYear, schoolCodeStd));
    const pdfStat = await stat(fpReportPdfPath(analysisYear, schoolCodeStd));
    needsGenerate = pdfStat.mtimeMs < htmlStat.mtimeMs;
    if (!needsGenerate) {
      const localPdf = await loadFpReportPdf(analysisYear, schoolCodeStd);
      if (localPdf) return localPdf;
    }
  } catch {
    if (cachedPdf) {
      return cachedPdf;
    }
  }

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
