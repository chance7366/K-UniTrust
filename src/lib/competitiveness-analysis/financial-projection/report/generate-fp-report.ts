import {
  generateGeminiText,
  stripMarkdownFence,
} from "@/lib/competitiveness-analysis/university-report/gemini-client";

import { buildFpReportPayload } from "./build-fp-report-payload";
import {
  buildFpReportSkeleton,
  wrapFpReportHtml,
} from "./build-fp-report-html";
import { buildFpReportGeminiPrompt } from "./build-fp-report-prompt";
import {
  extractFpNarratives,
  injectFpNarratives,
} from "./finalize-fp-report-html";
import { saveFpReport, type FpReportMeta } from "./fp-report-store";

export type GenerateFpReportResult = {
  meta: FpReportMeta;
  html: string;
};

export async function generateFpReport(args: {
  analysisYear: number;
  schoolCodeStd: string;
}): Promise<GenerateFpReportResult> {
  const payload = await buildFpReportPayload(args);

  const generatedAt = new Date().toLocaleString("ko-KR");
  const skeleton = buildFpReportSkeleton(payload, generatedAt);

  const { systemInstruction, userPrompt } = buildFpReportGeminiPrompt(payload);
  const gemini = await generateGeminiText({ systemInstruction, userPrompt });

  const narratives = extractFpNarratives(stripMarkdownFence(gemini.text));
  const bodyHtml = injectFpNarratives(skeleton, narratives);

  const html = wrapFpReportHtml({
    title: `${payload.school.schoolName} ${payload.analysisYear}년 대학별 재정추계 분석 보고서`,
    bodyHtml,
  });

  const meta = await saveFpReport({
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    schoolName: payload.school.schoolName,
    html,
    model: gemini.model,
  });

  return { meta, html };
}
