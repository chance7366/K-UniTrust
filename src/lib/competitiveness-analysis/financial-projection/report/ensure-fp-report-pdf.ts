import { stat } from "fs/promises";

import {
  htmlToPdfBuffer,
  isServerlessPdfRuntime,
} from "@/lib/competitiveness-analysis/university-report/html-to-pdf";

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

function pdfGenerationError(cause: unknown): Error {
  const detail =
    cause instanceof Error ? cause.message : "알 수 없는 PDF 생성 오류";
  const hint = isServerlessPdfRuntime()
    ? " Vercel 환경에서는 Playwright Chromium 설정이 필요합니다. HTML 보고서의 인쇄 기능을 이용해 주세요."
    : " 로컬에서 `npx tsx scripts/generate-fp-report-pdf.ts` 실행 후 배포해 주세요.";
  return new Error(`PDF 생성에 실패했습니다: ${detail}.${hint}`);
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

  if (!needsGenerate && cachedPdf) {
    return cachedPdf;
  }

  if (cachedPdf && isServerlessPdfRuntime()) {
    return cachedPdf;
  }

  try {
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
  } catch (err) {
    if (cachedPdf) {
      return cachedPdf;
    }
    throw pdfGenerationError(err);
  }
}
