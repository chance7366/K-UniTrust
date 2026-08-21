import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import {
  buildReportCoverHtml,
  stripGeminiCoverSection,
} from "@/lib/competitiveness-analysis/university-report/build-report-cover-html";
import {
  extractReportBodyHtml,
  wrapReportHtml,
} from "@/lib/competitiveness-analysis/university-report/gemini-client";
import { injectReportCharts } from "@/lib/competitiveness-analysis/university-report/inject-report-charts";
import { injectReportV2Screen } from "@/lib/competitiveness-analysis/university-report/build-report-v2-screen-html";
import { normalizeGeminiReportBody } from "@/lib/competitiveness-analysis/university-report/normalize-gemini-report-body";
import { paginateReportBody } from "@/lib/competitiveness-analysis/university-report/normalize-report-layout";

/** Gemini/raw HTML → 표지·차트·A4 래퍼가 적용된 최종 보고서 */
export function finalizeUniversityReportHtml(args: {
  rawBodyOrFullHtml: string;
  payload: UniversityReportPayload;
  generatedAt: string;
  title: string;
}): string {
  const extracted = extractReportBodyHtml(args.rawBodyOrFullHtml);
  const withoutCover = stripGeminiCoverSection(extracted);
  const normalizedBody = normalizeGeminiReportBody(withoutCover);
  const withV2Screen = injectReportV2Screen(normalizedBody, args.payload);
  const withCharts = injectReportCharts(withV2Screen, args.payload);
  const { html: pagedBody, sectionPages } = paginateReportBody(withCharts);
  const coverHtml = buildReportCoverHtml({
    payload: args.payload,
    generatedAt: args.generatedAt,
    sectionPages,
  });

  return wrapReportHtml({
    title: args.title,
    coverHtml,
    bodyHtml: pagedBody,
    generatedAt: args.generatedAt,
  });
}
