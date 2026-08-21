import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import {
  buildExtendedContext,
  runAllPostRunChecks,
} from "@/lib/competitiveness-analysis/post-run-validation/checks";
import {
  appendRunLog,
  buildPostRunReport,
  formatPostRunReportText,
  savePostRunReport,
} from "@/lib/competitiveness-analysis/post-run-validation/report";
import { getEditionFull } from "@/lib/competitiveness-analysis/editions-db";
import { loadIndicatorSourceData } from "@/lib/competitiveness-analysis/indicator-value-loader";

export type RunPostRunValidationOptions = {
  /** 콘솔 출력 (기본 true) */
  print?: boolean;
  /** data/validation/competitiveness 에 저장 (기본 true) */
  save?: boolean;
  /** run-log.jsonl 에 한 줄 추가 (기본 true) */
  appendLog?: boolean;
};

export async function runPostRunValidation(
  analysisYear: number,
  options: RunPostRunValidationOptions = {},
) {
  const { print = true, save = true, appendLog = true } = options;

  const edition = await getEditionFull(analysisYear);
  if (!edition) {
    throw new Error(`${analysisYear}년 edition 없음 — 분석 실행 후 검증하세요.`);
  }
  if (!edition.hasRunResults || !edition.results.runResults?.length) {
    throw new Error(
      `${analysisYear}년 3단계 결과 없음 — 분석 실행(1~3단계) 후 검증하세요.`,
    );
  }

  const indicators = getCompetitivenessIndicators();
  const indicatorSources = await loadIndicatorSourceData();
  const ctx = await buildExtendedContext(
    analysisYear,
    edition,
    indicators,
    indicatorSources,
  );

  const findings = runAllPostRunChecks(ctx, edition.results.runResults);
  const report = buildPostRunReport(
    analysisYear,
    edition.results.lastRunAt,
    ctx.settings.targetUniversities.length,
    findings,
  );

  if (save) {
    const paths = await savePostRunReport(report);
    if (print) {
      console.log(`\n보고서 저장: ${paths.textPath}`);
    }
  }

  if (appendLog) {
    await appendRunLog(report);
  }

  if (print) {
    console.log(formatPostRunReportText(report));
  }

  return report;
}
