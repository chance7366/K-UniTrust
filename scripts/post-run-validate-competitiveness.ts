/**
 * 경쟁력분석 — 실행 후 검증 (Post-Run Validation)
 *
 * 분석 1~3단계 실행·재실행 직후 반드시 실행한다.
 * (Post-Run 검증 + 대학별경쟁력 화면 데이터 일치 검증)
 *
 * Usage:
 *   npx tsx scripts/post-run-validate-competitiveness.ts --year=2026
 *   npx tsx scripts/post-run-validate-competitiveness.ts --from=2021 --to=2026
 *   npm run validate:competitiveness:post-run -- --year=2026
 *
 * 보고서: data/validation/competitiveness/latest-{year}.txt
 * 이슈 등록: src/lib/competitiveness-analysis/post-run-validation/issue-registry.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listEditionSummaries } from "../src/lib/competitiveness-analysis/editions-db.ts";
import { runPostRunValidation } from "../src/lib/competitiveness-analysis/post-run-validation/run.ts";
import {
  formatUniversityDashboardValidationReport,
  runUniversityDashboardValidation,
} from "../src/lib/competitiveness-analysis/university-dashboard-validation.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

function parseIntArg(flag: string): number | null {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (!arg) return null;
  const n = Number(arg.split("=")[1]);
  return Number.isInteger(n) ? n : null;
}

function resolveYears(
  summaries: Awaited<ReturnType<typeof listEditionSummaries>>,
): number[] {
  const single = parseIntArg("--year");
  const from = parseIntArg("--from");
  const to = parseIntArg("--to");

  if (single != null && from == null && to == null) {
    return [single];
  }

  const start = from ?? 2021;
  const end = to ?? 2026;
  const years: number[] = [];
  for (let y = start; y <= end; y += 1) years.push(y);
  return years.filter((y) => summaries.some((s) => s.analysisYear === y));
}

async function main() {
  const summaries = await listEditionSummaries();
  const years = resolveYears(summaries);

  if (!years.length) {
    console.error("검증할 edition 연도가 없습니다.");
    process.exit(1);
  }

  console.log(`\n경쟁력분석 Post-Run 검증: ${years.join(", ")}년\n`);

  let totalErrors = 0;
  for (const year of years) {
    try {
      const report = await runPostRunValidation(year);
      totalErrors += report.summary.errors;
    } catch (err) {
      console.error(`[${year}] Post-Run 검증 중단:`, err instanceof Error ? err.message : err);
      totalErrors += 1;
    }

    try {
      const dashReport = await runUniversityDashboardValidation({ analysisYear: year });
      console.log(`\n${formatUniversityDashboardValidationReport(dashReport)}`);
      if (!dashReport.passed) {
        totalErrors += Math.max(1, dashReport.mismatches.length);
      }
    } catch (err) {
      console.error(
        `[${year}] 대학별경쟁력 화면 검증 중단:`,
        err instanceof Error ? err.message : err,
      );
      totalErrors += 1;
    }
  }

  if (totalErrors > 0) {
    console.error(`\nPost-Run 검증 실패 — error ${totalErrors}건. 보고서·run-log 확인.`);
    process.exit(1);
  }

  console.log(`\n✓ Post-Run + 대학별경쟁력 화면 검증 ${years.length}개 연도 통과`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
