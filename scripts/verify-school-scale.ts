/**
 * 재정분석 규모 분류 vs 대학경쟁력분석 3단계 재학생수·규모 대조
 *
 * Usage:
 *   npx tsx scripts/verify-school-scale.ts
 *   npx tsx scripts/verify-school-scale.ts --year=2025
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { toTargetUniversityRow } from "../src/lib/analysis/competitiveness-target-univ-mock-view.ts";
import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import {
  loadEnrolledStudentCountsByRep,
  lookupEnrolledStudentCount,
} from "../src/lib/analysis/enrolled-students-rep-count.ts";
import { loadCompetitivenessTargetUnivMock } from "../src/lib/data/competitiveness-target-univ-mock.ts";
import {
  getEditionFull,
  listEditionSummaries,
} from "../src/lib/competitiveness-analysis/editions-db.ts";
import { parseIndicatorYearLabel } from "../src/lib/competitiveness-analysis/parse-indicator-year.ts";
import { buildRunAnalyticsRows } from "../src/lib/competitiveness-analysis/run-analytics.ts";
import { schoolScaleFromEnrolled } from "../src/lib/competitiveness-analysis/school-scale.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

function parseYearArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--year="));
  if (!arg) return null;
  const n = Number(arg.split("=")[1]);
  return Number.isInteger(n) ? n : null;
}

async function main() {
  const summaries = await listEditionSummaries();
  const requested = parseYearArg();
  const withRun = summaries
    .filter((s) => s.hasRunResults)
    .sort((a, b) => b.analysisYear - a.analysisYear);
  const year =
    requested ??
    withRun[0]?.analysisYear ??
    summaries.sort((a, b) => b.analysisYear - a.analysisYear)[0]?.analysisYear;

  if (year == null) {
    console.error("검증할 edition이 없습니다.");
    process.exit(1);
  }

  const edition = await getEditionFull(year);
  if (!edition) {
    console.error(`${year}년 edition 없음`);
    process.exit(1);
  }

  const enrolledYear =
    parseIndicatorYearLabel(
      edition.settings.indicatorYears["enrolled-enrollment-rate"] ?? "",
    )?.year ?? year;
  const maps = await loadEnrolledStudentCountsByRep(enrolledYear);
  const live = await loadCompetitivenessTargetUnivMock({ year });
  const liveTargets = [
    ...live.allCohortRows.university,
    ...live.allCohortRows["junior-college"],
  ].map(toTargetUniversityRow);
  const analytics = buildRunAnalyticsRows(
    edition.results.runResults ?? [],
    {
      ...edition.settings,
      targetUniversities: liveTargets.length
        ? liveTargets
        : edition.settings.targetUniversities,
    },
    getCompetitivenessIndicators(),
    edition.results.step1RawResults,
  );

  const mismatches: string[] = [];
  const counts = { 대규모: 0, 중규모: 0, 소규모: 0, 공란: 0 };
  const samples: string[] = [];

  for (const row of analytics) {
    const kind = row.type === "전문대" ? "junior-college" : "university";
    const expectedEnrolled = lookupEnrolledStudentCount(
      maps,
      row.schoolCodeStd,
      kind,
    );
    const expectedScale = schoolScaleFromEnrolled(expectedEnrolled, row.type);
    if (expectedScale) counts[expectedScale] += 1;
    else counts.공란 += 1;

    const enrolledMismatch =
      expectedEnrolled != null &&
      row.enrolledTotal != null &&
      Math.abs(expectedEnrolled - row.enrolledTotal) >= 1;
    const missingOnOneSide =
      (expectedEnrolled != null && row.enrolledTotal == null) ||
      (expectedEnrolled == null && row.enrolledTotal != null);
    const scaleMismatch = expectedScale !== row.scale;
    if (enrolledMismatch || missingOnOneSide || scaleMismatch) {
      mismatches.push(
        `${row.province} ${row.name} (${row.type}): 3단계 ${row.enrolledTotal ?? "공란"}/${row.scale ?? "공란"} · 재적학생 ${expectedEnrolled ?? "없음"}/${expectedScale ?? "공란"}`,
      );
    } else if (samples.length < 8 && expectedScale) {
      samples.push(
        `${row.province} ${row.name} (${row.type}) ${expectedEnrolled}명 ${expectedScale}`,
      );
    }
  }

  console.log(`\n규모 분류 대조 — 분석연도 ${year} · 재학생연도 ${enrolledYear}`);
  console.log(
    `3단계 ${analytics.length}교 · 대상대학 ${edition.settings.targetUniversities.length}교`,
  );
  console.log(
    `규모: 대규모 ${counts.대규모} · 중규모 ${counts.중규모} · 소규모 ${counts.소규모} · 공란 ${counts.공란}`,
  );
  console.log("\n일치 샘플:");
  for (const line of samples) console.log(`  ${line}`);

  if (mismatches.length) {
    console.log(`\n불일치 ${mismatches.length}교:`);
    for (const line of mismatches.slice(0, 30)) console.log(`  ${line}`);
    if (mismatches.length > 30) {
      console.log(`  … 외 ${mismatches.length - 30}교`);
    }
    process.exit(1);
  }

  console.log("\n3단계 재학생수·규모 = 재적학생 재학생(A) 계·소계 규모 분류 OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
