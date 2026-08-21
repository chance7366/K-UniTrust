/**
 * 기존 edition 설정 유지, 1~3단계 분석만 재실행 후 DB 저장
 * Usage: npx tsx scripts/rerun-competitiveness-analysis.ts --from=2021 --to=2026
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import { resolveStep3IndicatorIds } from "../src/lib/competitiveness-analysis/analysis-policy.ts";
import { buildRunPayload } from "../src/lib/competitiveness-analysis/compute-run.ts";
import {
  loadNationalDistributionsForSettings,
  runStep2Analysis,
} from "../src/lib/competitiveness-analysis/compute-step2.ts";
import {
  getEditionFull,
  saveEditionResults,
} from "../src/lib/competitiveness-analysis/editions-db.ts";
import {
  formatWeightValidationError,
  validateCompetitivenessWeights,
} from "../src/lib/competitiveness-analysis/validate-competitiveness-weights.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

function parseArgs(): { from: number; to: number } {
  let from = 2021;
  let to = 2026;
  for (const arg of process.argv.slice(2)) {
    const fromMatch = arg.match(/^--from=(\d+)$/);
    const toMatch = arg.match(/^--to=(\d+)$/);
    if (fromMatch) from = Number(fromMatch[1]);
    if (toMatch) to = Number(toMatch[1]);
  }
  return { from, to };
}

async function rerunYear(year: number): Promise<void> {
  const edition = await getEditionFull(year);
  if (!edition) {
    throw new Error(`${year}년 edition 없음`);
  }

  const { settings } = edition;
  if (!settings.targetUniversities?.length) {
    throw new Error(`${year}년 대상대학 없음`);
  }

  const indicators = getCompetitivenessIndicators();
  const weightIssues = validateCompetitivenessWeights(settings, indicators);
  if (weightIssues.length) {
    throw new Error(
      `${year}년 가중치 오류: ${formatWeightValidationError(weightIssues)}`,
    );
  }

  const step2 = await runStep2Analysis(settings, indicators);
  const step3Ids = resolveStep3IndicatorIds(settings, indicators);
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
    step3Ids,
  );
  const lastRunAt = new Date().toLocaleString("ko-KR");
  const fullPayload = buildRunPayload(
    settings,
    indicators,
    step2.rawResults,
    nationalDists,
    lastRunAt,
  );

  await saveEditionResults(year, {
    step1RawResults: step2.rawResults,
    step1At: lastRunAt,
    step2IndexResults: step2.indexResults,
    step2At: lastRunAt,
    runResults: fullPayload.runResults,
    lastRunAt,
  });

  const withComposite = fullPayload.runResults.filter(
    (r) => !r.excludedFromRanking,
  );
  console.log(
    `${year}년: ${fullPayload.runResults.length}교 재실행 완료 (${lastRunAt}) · 순위대상 ${withComposite.length}교`,
  );
}

async function main(): Promise<void> {
  const { from, to } = parseArgs();
  console.log(`경쟁력분석 재실행 ${from}~${to} (기존 설정 유지)\n`);

  for (let year = from; year <= to; year++) {
    await rerunYear(year);
    console.log(`\n--- ${year}년 Post-Run 검증 ---`);
    const { runPostRunValidation } = await import(
      "../src/lib/competitiveness-analysis/post-run-validation/run.ts"
    );
    const report = await runPostRunValidation(year, { print: true, save: true });
    if (!report.ok) {
      throw new Error(
        `${year}년 Post-Run 검증 실패 (error ${report.summary.errors}건). data/validation/competitiveness/latest-${year}.txt 확인`,
      );
    }
  }

  console.log("\n전체 재실행 완료");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
