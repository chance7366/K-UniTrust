import { readFile, stat, writeFile } from "fs/promises";

import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import {
  loadUniversityReportHtml,
  loadUniversityReportMeta,
  universityReportHtmlPath,
  universityReportMetaPath,
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

  const htmlPath = universityReportHtmlPath(analysisYear, schoolCodeStd);
  const pdfPath = universityReportPdfPath(analysisYear, schoolCodeStd);
  const htmlStat = await stat(htmlPath);

  try {
    const pdfStat = await stat(pdfPath);
    if (pdfStat.mtimeMs >= htmlStat.mtimeMs) {
      return readFile(pdfPath);
    }
  } catch {
    /* PDF 없음 — 생성 */
  }

  const pdf = await htmlToPdfBuffer(html);
  await writeFile(pdfPath, pdf);

  const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
  if (meta) {
    const metaPath = universityReportMetaPath(analysisYear, schoolCodeStd);
    await writeFile(
      metaPath,
      JSON.stringify(
        {
          ...meta,
          pdfFile: "report.pdf",
          pdfGeneratedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  return pdf;
}
