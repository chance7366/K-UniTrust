/**
 * 지표 불균형(C cap) 대학 상세 조회
 * Usage: npx tsx scripts/inspect-grade-capped.ts [--year=2026] [--row=44] [--kind=university]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import { getEditionFull } from "../src/lib/competitiveness-analysis/editions-db.ts";
import {
  gradeFromCompositeScore,
  highRiskThresholdRank,
} from "../src/lib/competitiveness-analysis/diagnostic-grade.ts";
import { buildRunAnalyticsRows } from "../src/lib/competitiveness-analysis/run-analytics.ts";
import {
  matchesSchoolKindFilter,
  type SchoolKindFilter,
} from "../src/lib/competitiveness-analysis/step1-indicators.ts";
import type { UniversityRunResult } from "../src/lib/competitiveness-analysis/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

function parseArgs() {
  let year = 2026;
  let row = 44;
  let kind: SchoolKindFilter = "university";
  for (const arg of process.argv.slice(2)) {
    const y = arg.match(/^--year=(\d+)$/);
    const r = arg.match(/^--row=(\d+)$/);
    const k = arg.match(/^--kind=(university|junior-college)$/);
    if (y) year = Number(y[1]);
    if (r) row = Number(r[1]);
    if (k) kind = k[1] as SchoolKindFilter;
  }
  return { year, row, kind };
}

function printSchool(
  r: ReturnType<typeof buildRunAnalyticsRows>[number],
  runResults: UniversityRunResult[],
  threshold: number,
) {
  const raw = runResults.find((x) => x.schoolCodeStd === r.schoolCodeStd);
  const baseGrade = gradeFromCompositeScore(r.totalScore);
  console.log(
    `\n[${r.rank}위] ${r.name} (${r.schoolCodeStd})`,
  );
  console.log(
    `  종합점수 ${r.totalScore} → 점수만 보면 ${baseGrade}등급 → 최약고리 적용 후 C (지표 불균형)`,
  );
  console.log(
    `  부문지수: 학생충원 ${r.studentSectorScore} · 대학재정 ${r.univFinanceScore} · 법인재정 ${r.foundationScore}`,
  );
  if (!raw) return;

  let highRisk = 0;
  for (const ind of [...raw.indicators].sort((a, b) => a.rank - b.rank)) {
    const isHighRisk =
      !ind.dataMissing && ind.rank > 0 && ind.rank >= threshold;
    if (isHighRisk) highRisk++;
    const flag = isHighRisk ? " ← 고위험(하위7%)" : "";
    const miss = ind.dataMissing ? " [데이터없음]" : "";
    console.log(
      `  ${ind.label.padEnd(14)} 원값=${String(ind.rawValue).padStart(8)}  지수=${String(ind.indexScore).padStart(5)}  순위=${String(ind.rank).padStart(3)}/${threshold}↑${flag}${miss}`,
    );
  }
  console.log(`  고위험 지표 수: ${highRisk}개 (2개 이상이면 C cap)`);
}

async function main() {
  const { year, row, kind } = parseArgs();
  const edition = await getEditionFull(year);
  if (!edition?.results?.runResults?.length) {
    throw new Error(`${year}년 runResults 없음`);
  }

  const settings = edition.settings;
  const indicators = getCompetitivenessIndicators();
  const runResults = edition.results.runResults;
  const allRows = buildRunAnalyticsRows(runResults, settings, indicators);

  const filtered = allRows
    .filter((r) =>
      kind === "junior-college" ? r.type === "전문대" : r.type === "4년제",
    )
    .sort((a, b) => {
      if (a.excludedFromRanking !== b.excludedFromRanking) {
        return a.excludedFromRanking ? 1 : -1;
      }
      return (a.rank || 999) - (b.rank || 999);
    });

  const cohort = runResults.filter((r) =>
    matchesSchoolKindFilter(r.schoolKind, kind),
  );
  const threshold = highRiskThresholdRank(cohort.length);
  const capped = filtered.filter((r) => r.gradeCapped);

  console.log(`=== ${year}년 ${kind === "university" ? "4년제" : "전문대"} ===`);
  console.log(`동종 N=${cohort.length}, 고위험 순위 임계=${threshold}위 이상`);
  console.log(`지표 불균형(C cap) 대학: ${capped.length}개교`);

  const target = filtered[row - 1];
  if (target) {
    console.log(`\n--- 테이블 ${row}번째 행 ---`);
    printSchool(target, runResults, threshold);
    if (!target.gradeCapped) {
      console.log("  (이 행은 C cap 미적용)");
    }
  }

  console.log(`\n--- C cap 전체 목록 (${capped.length}개교) ---`);
  for (const r of capped) {
    printSchool(r, runResults, threshold);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
