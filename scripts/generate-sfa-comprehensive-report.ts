/**
 * Usage: npx tsx scripts/generate-sfa-comprehensive-report.ts --year=2026 --metro=all --estb=all --kind=university
 */
import { generateStudentFillComprehensiveReport } from "../src/lib/analysis/student-fill-analysis/generate-comprehensive-report.ts";
import { writeStudentFillComprehensiveReport } from "../src/lib/analysis/student-fill-analysis/store.ts";
import {
  parseSfaEstbFilter,
  parseSfaMetroFilter,
  parseSfaSchoolKindFilter,
} from "../src/lib/analysis/student-fill-analysis/comprehensive-filter.ts";

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const filter = {
    analysisYear: Number(arg("year", "2026")),
    metro: parseSfaMetroFilter(arg("metro", "all")),
    estb: parseSfaEstbFilter(arg("estb", "all")),
    schoolKind: parseSfaSchoolKindFilter(arg("kind", "university")),
  };
  const report = await generateStudentFillComprehensiveReport(filter);
  if (!report) {
    throw new Error(`${filter.analysisYear}년 해당 조건 보고서를 만들지 못했습니다.`);
  }
  await writeStudentFillComprehensiveReport(report);
  console.log(
    `${report.filterKey} · ${report.schoolCount}교 · 정원내 ${report.current.rateIn}% · ${report.generatedAt}`,
  );
}

void main();
