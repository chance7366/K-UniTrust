import {
  getEditionFull,
  loadEditionTrendSeries,
} from "@/lib/competitiveness-analysis/editions-db";
import { buildGeminiUniversityReportPrompt } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import { buildUniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-university-report-payload";
import {
  generateGeminiText,
  stripMarkdownFence,
} from "@/lib/competitiveness-analysis/university-report/gemini-client";
import { finalizeUniversityReportHtml } from "@/lib/competitiveness-analysis/university-report/finalize-report-html";
import {
  saveUniversityReport,
  type UniversityReportMeta,
} from "@/lib/competitiveness-analysis/university-report/report-store";

export type GenerateUniversityReportResult = {
  meta: UniversityReportMeta;
  html: string;
};

export async function generateUniversityReport(args: {
  analysisYear: number;
  schoolCodeStd: string;
}): Promise<GenerateUniversityReportResult> {
  const edition = await getEditionFull(args.analysisYear);
  if (!edition?.results.runResults?.length) {
    throw new Error(
      `${args.analysisYear}년 분석실행(3단계) 결과가 없습니다.`,
    );
  }

  const series = await loadEditionTrendSeries();
  const payload = buildUniversityReportPayload({
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    series,
    settings: edition.settings,
    lastRunAt: edition.results.lastRunAt,
  });

  const { systemInstruction, userPrompt } = buildGeminiUniversityReportPrompt({
    analysisYear: args.analysisYear,
    settings: edition.settings,
    payload,
  });

  const gemini = await generateGeminiText({ systemInstruction, userPrompt });
  const generatedAt = new Date().toLocaleString("ko-KR");
  const html = finalizeUniversityReportHtml({
    rawBodyOrFullHtml: stripMarkdownFence(gemini.text),
    payload,
    generatedAt,
    title: `${payload.schoolName} ${args.analysisYear}년 대학별경쟁력 분석 보고서`,
  });

  const meta = await saveUniversityReport({
    analysisYear: args.analysisYear,
    schoolCodeStd: args.schoolCodeStd,
    schoolName: payload.schoolName,
    html,
    model: gemini.model,
  });

  return { meta, html };
}
