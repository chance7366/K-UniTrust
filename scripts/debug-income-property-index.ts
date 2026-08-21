/**
 * 수익용재산확보율 2단계 지수=0 원인 진단
 * Usage: npx tsx scripts/debug-income-property-index.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import {
  priorTuitionYear,
  roundRatio1,
  tuitionMapKey,
} from "../src/lib/analysis/income-property-secure-rate-analytics.ts";
import { runStep2Analysis } from "../src/lib/competitiveness-analysis/compute-step2.ts";
import { loadNationalDistributionsForSettings } from "../src/lib/competitiveness-analysis/compute-step2.ts";
import { getEditionFull } from "../src/lib/competitiveness-analysis/editions-db.ts";
import {
  resolveIndicatorPercentileBounds,
} from "../src/lib/competitiveness-analysis/indicator-percentile-bounds.ts";
import {
  resolveAnalysisPolicy,
  resolveLowerIsBetterSet,
} from "../src/lib/competitiveness-analysis/analysis-policy.ts";
import {
  getNationalValuesForScope,
} from "../src/lib/competitiveness-analysis/national-indicator-distribution.ts";
import { loadIndicatorSourceData } from "../src/lib/competitiveness-analysis/indicator-value-loader.ts";
import {
  percentileValue,
  rawToLinearPercentileIndexScore,
} from "../src/lib/competitiveness-analysis/percentile-utils.ts";
import {
  matchesSchoolKindFilter,
} from "../src/lib/competitiveness-analysis/step1-indicators.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

const TAB = "income-property-secure-rate";

function stats(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
  };
}

async function main() {
  const indicators = getCompetitivenessIndicators();
  const edition = await getEditionFull(2026);
  if (!edition) throw new Error("edition 2026 missing");
  const settings = edition.settings;
  const yearLabel = settings.indicatorYears[TAB] ?? "2025년";
  const year = 2025;

  const sources = await loadIndicatorSourceData();
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
  );
  const step2 = await runStep2Analysis(settings, indicators);
  const policy = resolveAnalysisPolicy(settings);
  const lowerIsBetter = resolveLowerIsBetterSet(policy);
  const bounds = resolveIndicatorPercentileBounds(settings, TAB);
  const nationalDist = nationalDists.get(TAB);

  console.log("=== 수익용재산확보율 2단계 지수=0 진단 ===\n");
  console.log("적용연도:", yearLabel);
  console.log("원천값 공식: (total_appraised / 전년 등록금수입) × 100");
  console.log("전년 등록금: 자금확보율 DB tuition_revenue, key=조사년도-1\n");

  console.log("--- 1) tuitionByPriorYear (등록금 lookup) ---");
  console.log("총 키 수:", sources.tuitionByPriorYear.size);
  const tuition2024 = [...sources.tuitionByPriorYear.entries()].filter(([k]) =>
    k.startsWith("2024:"),
  );
  console.log("2024년 등록금 키 수:", tuition2024.length);

  console.log("\n--- 2) incomePropertyRolled (본교 rollup 후) ---");
  const ip2025 = sources.incomePropertyRolled.filter(
    (r) => Number(r.year) === year,
  );
  console.log(`${year}년 행 수:`, ip2025.length);

  let withTuition = 0;
  let withoutTuition = 0;
  const computedRaw: number[] = [];
  for (const row of ip2025) {
    const std = (row.school_code_std ?? "").padStart(7, "0");
    const totalAppraised = Number(row.total_appraised);
    const tuition =
      sources.tuitionByPriorYear.get(
        tuitionMapKey(priorTuitionYear(year), std),
      ) ?? null;
    if (tuition == null || tuition <= 0) {
      withoutTuition++;
      continue;
    }
    withTuition++;
    computedRaw.push(roundRatio1((totalAppraised / tuition) * 100));
  }
  console.log("등록금 매칭 성공:", withTuition);
  console.log("등록금 매칭 실패:", withoutTuition);
  console.log("산출 raw 분포:", stats(computedRaw));

  console.log("\n--- 3) dataset.incomeProperty lookup 맵 ---");
  console.log("맵 크기:", sources.dataset.incomeProperty.size);
  const map2025 = [...sources.dataset.incomeProperty.entries()].filter(([k]) =>
    k.startsWith(`${year}:`),
  );
  console.log(`${year}년 맵 엔트리:`, map2025.length);
  const mapValues = map2025.map(([, v]) => v);
  console.log("맵 value 분포:", stats(mapValues));

  console.log("\n--- 4) 전국 분포 (nationalDist) ---");
  if (!nationalDist) {
    console.log("nationalDist 없음!");
  } else {
    console.log("4년제 n:", nationalDist.university.length, stats(nationalDist.university));
    console.log("전문대 n:", nationalDist.juniorCollege.length, stats(nationalDist.juniorCollege));
  }

  if (nationalDist?.university.length) {
    const pLow = percentileValue(nationalDist.university, bounds.lowerTailPct);
    const pHigh = percentileValue(
      nationalDist.university,
      100 - bounds.upperTailPct,
    );
    console.log(`\n4년제 P${bounds.lowerTailPct}:`, pLow);
    console.log(`4년제 P${100 - bounds.upperTailPct}:`, pHigh);
  }

  console.log("\n--- 5) 대상대학 272 — raw vs index ---");
  let rawFound = 0;
  let indexZero = 0;
  let indexNonZero = 0;
  let nationalEmpty = 0;
  const samples: { name: string; raw: number; index: number; pLow: number; pHigh: number }[] = [];

  for (const u of settings.targetUniversities) {
    const rawRow = step2.rawResults.find((r) => r.schoolCodeStd === u.schoolCodeStd);
    const rawCell = rawRow?.indicators.find((c) => c.financeTabId === TAB);
    const indexRow = step2.indexResults.find((r) => r.schoolCodeStd === u.schoolCodeStd);
    const indexCell = indexRow?.indicators.find((c) => c.financeTabId === TAB);

    if (!rawCell?.found || rawCell.rawValue == null) continue;
    rawFound++;

    const nationalValues = getNationalValuesForScope(
      nationalDist,
      u.schoolKind,
      policy.nationalComparisonScope,
    );
    if (!nationalValues.length) nationalEmpty++;

    const pLow = percentileValue(nationalValues, bounds.lowerTailPct);
    const pHigh = percentileValue(nationalValues, 100 - bounds.upperTailPct);
    const expectedIndex = rawToLinearPercentileIndexScore(
      nationalValues,
      rawCell.rawValue,
      bounds.lowerTailPct,
      bounds.upperTailPct,
      lowerIsBetter.has(TAB),
    );

    const idx = indexCell?.indexScore ?? -1;
    if (idx === 0) indexZero++;
    else indexNonZero++;

    if (samples.length < 8) {
      samples.push({
        name: u.schoolName,
        raw: rawCell.rawValue,
        index: idx,
        pLow,
        pHigh,
      });
    }
  }

  console.log("raw 있음:", rawFound);
  console.log("index=0:", indexZero);
  console.log("index>0:", indexNonZero);
  console.log("nationalValues 빈 배열:", nationalEmpty);
  console.log("\n샘플 (상위 8개):");
  for (const s of samples) {
    console.log(
      `  ${s.name}: raw=${s.raw}% P10=${s.pLow} P90=${s.pHigh} → index=${s.index}`,
    );
  }

  console.log("\n--- 6) index>0 인 대학 (있으면) ---");
  let anyNonZero = false;
  for (const u of settings.targetUniversities) {
    const indexRow = step2.indexResults.find((r) => r.schoolCodeStd === u.schoolCodeStd);
    const indexCell = indexRow?.indicators.find((c) => c.financeTabId === TAB);
    if (indexCell && indexCell.indexScore > 0) {
      anyNonZero = true;
      console.log(`  ${u.schoolName}: raw=${indexCell.rawValue} index=${indexCell.indexScore}`);
    }
  }
  if (!anyNonZero) console.log("  (없음 — 전원 index=0)");

  console.log("\n--- 7) tuition 키 불일치 샘플 ---");
  let mismatchShown = 0;
  for (const row of ip2025.slice(0, 500)) {
    const std = (row.school_code_std ?? "").padStart(7, "0");
    const key = tuitionMapKey(priorTuitionYear(year), std);
    const tuition = sources.tuitionByPriorYear.get(key);
    if (tuition == null && mismatchShown < 5) {
      console.log(`  ${row.school_name} (${std}): key=${key} → 등록금 없음`);
      mismatchShown++;
    }
  }
}

main().catch(console.error);
