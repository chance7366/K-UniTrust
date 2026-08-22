import { readFile, stat, writeFile } from "fs/promises";

import { htmlToPdfBuffer } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";

import {
  fpReportHtmlPath,
  fpReportMetaPath,
  fpReportPdfPath,
  loadFpReportHtml,
  loadFpReportMeta,
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

  const htmlStat = await stat(fpReportHtmlPath(analysisYear, schoolCodeStd));
  const pdfPath = fpReportPdfPath(analysisYear, schoolCodeStd);

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

  const meta = await loadFpReportMeta(analysisYear, schoolCodeStd);
  if (meta) {
    await writeFile(
      fpReportMetaPath(analysisYear, schoolCodeStd),
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
