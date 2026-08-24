import { stat } from "fs/promises";

import {
  htmlToPdfBuffer,
  isServerlessPdfRuntime,
} from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import {
  loadUniversityReportHtml,
  loadUniversityReportMeta,
  loadUniversityReportPdf,
  saveUniversityReportPdf,
  universityReportHtmlPath,
  universityReportPdfPath,
} from "@/lib/competitiveness-analysis/university-report/report-store";

function pdfGenerationError(cause: unknown): Error {
  const detail =
    cause instanceof Error ? cause.message : "알 수 없는 PDF 생성 오류";
  const hint = isServerlessPdfRuntime()
    ? " Vercel 환경에서는 Playwright Chromium 설정이 필요합니다. HTML 보고서의 인쇄 기능을 이용해 주세요."
    : " 로컬에서 `npx tsx scripts/generate-university-report-pdf.ts` 실행 후 배포해 주세요.";
  return new Error(`PDF 생성에 실패했습니다: ${detail}.${hint}`);
}

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

  if (cachedPdf && isServerlessPdfRuntime()) {
    return cachedPdf;
  }

  try {
    const pdf = await htmlToPdfBuffer(html);
    if (meta) {
      await saveUniversityReportPdf(analysisYear, schoolCodeStd, pdf, meta);
    }
    return pdf;
  } catch (err) {
    if (cachedPdf) {
      return cachedPdf;
    }
    throw pdfGenerationError(err);
  }
}
