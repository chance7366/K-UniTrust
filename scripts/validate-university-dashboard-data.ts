/**
 * 대학별경쟁력 화면 ↔ 분석실행 runResults 일치 검증
 *
 * Usage:
 *   npm run validate:competitiveness:university-dashboard
 *   npm run validate:competitiveness:university-dashboard -- --year=2026
 *   npm run validate:competitiveness:university-dashboard -- --from=2021 --to=2026
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

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

async function main() {
  const single = parseIntArg("--year");
  const from = parseIntArg("--from");
  const to = parseIntArg("--to");

  let years: number[] | null = null;
  if (single != null && from == null && to == null) {
    years = [single];
  } else if (from != null || to != null) {
    const start = from ?? 2021;
    const end = to ?? 2026;
    years = [];
    for (let y = start; y <= end; y += 1) years.push(y);
  }

  const targetYears = years ?? [null];

  let totalFailures = 0;
  for (const year of targetYears) {
    const report = await runUniversityDashboardValidation(
      year != null ? { analysisYear: year } : {},
    );
    console.log(`\n${formatUniversityDashboardValidationReport(report)}\n`);
    if (!report.passed) totalFailures += 1;
  }

  if (totalFailures > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
