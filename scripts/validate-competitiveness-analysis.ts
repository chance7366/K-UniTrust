/**
 * 대학경쟁력분석 1~3단계 데이터 검증 스크립트
 * Usage:
 *   npx tsx scripts/validate-competitiveness-analysis.ts --year=2026
 *   npx tsx scripts/validate-competitiveness-analysis.ts --from=2021 --to=2026
 *   npm run validate:competitiveness:all
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import {
  resolveAnalysisPolicy,
  resolveLowerIsBetterSet,
  resolveStep12IndicatorIds,
  resolveStep3IndicatorIds,
} from "../src/lib/competitiveness-analysis/analysis-policy.ts";
import { computeRunResultsFromRaw } from "../src/lib/competitiveness-analysis/compute-run.ts";
import {
  computeIndexResultsFromRaw,
  loadNationalDistributionsForSettings,
  runStep2Analysis,
} from "../src/lib/competitiveness-analysis/compute-step2.ts";
import {
  getEditionFull,
  listEditionSummaries,
} from "../src/lib/competitiveness-analysis/editions-db.ts";
import {
  resolveIndicatorPercentileBounds,
} from "../src/lib/competitiveness-analysis/indicator-percentile-bounds.ts";
import {
  loadIndicatorSourceData,
  loadStep1RawIndicatorResults,
} from "../src/lib/competitiveness-analysis/indicator-value-loader.ts";
import { parseIndicatorYearLabel } from "../src/lib/competitiveness-analysis/parse-indicator-year.ts";
import {
  lookupExpectedIndicatorValue,
} from "../src/lib/competitiveness-analysis/indicator-rep-lookup.ts";
import {
  getNationalValuesForScope,
} from "../src/lib/competitiveness-analysis/national-indicator-distribution.ts";
import {
  rankByIndexDesc,
  rawToLinearPercentileIndexScore,
} from "../src/lib/competitiveness-analysis/percentile-utils.ts";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_LABELS,
  type SchoolKindFilter,
} from "../src/lib/competitiveness-analysis/step1-indicators.ts";
import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "../src/lib/competitiveness-analysis/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const checks: CheckResult[] = [];
let failures = 0;
let yearPrefix = "";

function resetYearChecks(prefix: string) {
  checks.length = 0;
  failures = 0;
  yearPrefix = prefix;
}

function pass(name: string, detail: string) {
  checks.push({ name: `${yearPrefix}${name}`, passed: true, detail });
}

function fail(name: string, detail: string) {
  checks.push({ name: `${yearPrefix}${name}`, passed: false, detail });
  failures += 1;
  console.error(`[FAIL] ${yearPrefix}${name}: ${detail}`);
}

function parseIntArg(flag: string): number | null {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (!arg) return null;
  const n = Number(arg.split("=")[1]);
  return Number.isInteger(n) ? n : null;
}

function resolveTargetYears(summaries: Awaited<ReturnType<typeof listEditionSummaries>>): number[] {
  const single = parseYearArg();
  const from = parseIntArg("--from");
  const to = parseIntArg("--to");
  const allYears =
    process.argv.includes("--all-years") ||
    process.argv.includes("--from=2021");

  if (single != null && from == null && to == null && !allYears) {
    return [single];
  }

  const start = from ?? 2021;
  const end = to ?? 2026;
  const years: number[] = [];
  for (let y = start; y <= end; y += 1) years.push(y);

  if (!years.length) {
    const fallback =
      summaries.find((s) => s.hasRunResults)?.analysisYear ??
      summaries[0]?.analysisYear ??
      new Date().getFullYear();
    return [fallback];
  }
  return years;
}

function approxEqual(a: number, b: number, tol = 0.05): boolean {
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= tol;
}

function parseYearArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--year="));
  if (!arg) return null;
  const year = Number(arg.split("=")[1]);
  return Number.isInteger(year) ? year : null;
}

/** Step 1-A: 재정분석 *_rep.csv 적용연도·코호트 존재 */
async function validateMainCampusRollup(year: number, settings: CompetitivenessSettings) {
  const { countRepRowsByCohort, INDICATOR_REP_SPEC, indicatorRepLabel } =
    await import("../src/lib/competitiveness-analysis/indicator-rep-lookup.ts");
  const sources = await loadIndicatorSourceData();
  const ids = [
    "freshman-enrollment-rate",
    "enrolled-enrollment-rate",
    "dropout-rate",
    "fund-secure-rate",
    "financial-support-benefit-rate",
    "tuition-dependency-rate",
    "income-property-secure-rate",
    "corp-transfer-ratio",
  ];
  const missing: string[] = [];
  for (const id of ids) {
    const spec = INDICATOR_REP_SPEC[id];
    const yearLabel = settings.indicatorYears[id] ?? `${year}년`;
    const dataYear = parseIndicatorYearLabel(yearLabel)?.year ?? year;
    if (!spec) continue;
    const counts = countRepRowsByCohort(sources[spec.sourceKey], dataYear);
    const univN = spec.isStudent ? counts.combined : counts.university;
    if (univN === 0 || counts.juniorCollege === 0) {
      missing.push(
        `${indicatorRepLabel(id)} ${dataYear}년 대학 ${univN} · 전문대 ${counts.juniorCollege}`,
      );
    }
  }
  if (!missing.length) {
    pass(
      "Step1-A *_rep.csv 코호트",
      `${year}년 설정 기준 8개 지표 *_rep.csv 대학·전문대 행 존재`,
    );
    return;
  }
  fail("Step1-A *_rep.csv 코호트", missing.join(" | "));
}

/** Step 1-B: Step1 API 결과 vs DB lookup 일치 */
async function validateStep1RawValues(
  settings: CompetitivenessSettings,
  indicators: ReturnType<typeof getCompetitivenessIndicators>,
) {
  const ids = resolveStep12IndicatorIds(settings, indicators);
  const rawResults = await loadStep1RawIndicatorResults(
    settings,
    indicators,
    ids,
  );
  const sources = await loadIndicatorSourceData();

  let checked = 0;
  let mismatch = 0;
  const samples: string[] = [];
  const byIndicator = new Map<
    string,
    { checked: number; mismatch: number; missing: number }
  >();

  for (const id of ids) {
    byIndicator.set(id, { checked: 0, mismatch: 0, missing: 0 });
  }

  for (const row of rawResults) {
    for (const cell of row.indicators) {
      const indStat = byIndicator.get(cell.financeTabId);
      if (!indStat) continue;

      if (!cell.found || cell.rawValue == null) {
        indStat.missing += 1;
        continue;
      }
      checked += 1;
      indStat.checked += 1;

      const yearLabel =
        settings.indicatorYears[cell.financeTabId] ??
        indicators.find((i) => i.financeTabId === cell.financeTabId)
          ?.defaultYearLabel ??
        "";

      const parsedYear = parseIndicatorYearLabel(yearLabel)?.year;
      if (!parsedYear) continue;

      const expected = lookupExpectedIndicatorValue(
        sources,
        cell.financeTabId,
        parsedYear,
        row.schoolKind,
        settings.targetUniversities.find(
          (u) => u.schoolCodeStd === row.schoolCodeStd,
        )?.schoolDivision ?? "",
        row.schoolCodeStd,
      );

      if (expected != null && !approxEqual(cell.rawValue, expected)) {
        mismatch += 1;
        indStat.mismatch += 1;
        if (samples.length < 8) {
          samples.push(
            `${row.schoolName}/${cell.financeTabId}: step1=${cell.rawValue} db=${expected}`,
          );
        }
      }
    }
  }

  for (const id of ids) {
    const label =
      STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id;
    const yearLabel =
      settings.indicatorYears[id] ??
      indicators.find((i) => i.financeTabId === id)?.defaultYearLabel ??
      "—";
    const stat = byIndicator.get(id)!;
    if (stat.mismatch === 0) {
      pass(
        `Step1 [${label}]`,
        `적용연도 ${yearLabel} · 검증 ${stat.checked}셀 · DB없음 ${stat.missing}건`,
      );
    } else {
      fail(
        `Step1 [${label}]`,
        `적용연도 ${yearLabel} · ${stat.mismatch}/${stat.checked} 불일치`,
      );
    }
  }

  if (mismatch === 0) {
    pass(
      "Step1-B 원지표 DB 일치",
      `${checked}개 셀 검증 — Step1 결과와 본교통합/통합 DB lookup 일치`,
    );
  } else {
    fail(
      "Step1-B 원지표 DB 일치",
      `${mismatch}/${checked} 불일치: ${samples.join(" | ")}`,
    );
  }

  return rawResults;
}

/** Step 2: 지수·순위 독립 재계산 */
async function validateStep2(
  settings: CompetitivenessSettings,
  indicators: ReturnType<typeof getCompetitivenessIndicators>,
  rawResults: UniversityRawResult[],
) {
  const policy = resolveAnalysisPolicy(settings);
  const lowerIsBetter = resolveLowerIsBetterSet(policy);
  const ids = resolveStep12IndicatorIds(settings, indicators);
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
    ids,
  );
  const indexResults = computeIndexResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
    ids,
  );

  let indexMismatch = 0;
  let rankMismatch = 0;
  const indexSamples: string[] = [];

  for (const ind of ids) {
    const label =
      STEP1_INDICATOR_LABELS[ind as keyof typeof STEP1_INDICATOR_LABELS] ?? ind;
    const nationalDist = nationalDists.get(ind)!;
    const bounds = resolveIndicatorPercentileBounds(settings, ind);
    const lowerFlag = lowerIsBetter.has(ind);

    const rawByCode = new Map(
      rawResults.map((r) => [
        r.schoolCodeStd,
        r.indicators.find((c) => c.financeTabId === ind)?.rawValue ?? null,
      ]),
    );

    let indIndexMismatch = 0;
    let indRankMismatch = 0;

    const expectedScores = settings.targetUniversities.map((u) => {
      const raw = rawByCode.get(u.schoolCodeStd);
      if (raw == null) return null;
      const nationalValues = getNationalValuesForScope(
        nationalDist,
        u.schoolKind,
        policy.nationalComparisonScope,
      );
      if (!nationalValues.length) return null;
      return rawToLinearPercentileIndexScore(
        nationalValues,
        raw,
        bounds.lowerTailPct,
        bounds.upperTailPct,
        lowerFlag,
      );
    });

    const expectedRanks = rankBySchoolKind(
      settings.targetUniversities,
      expectedScores.map((s) => s ?? 0),
      expectedScores.map((s) => s == null),
    );

    for (let i = 0; i < settings.targetUniversities.length; i++) {
      const code = settings.targetUniversities[i]!.schoolCodeStd;
      const resultRow = indexResults.find((r) => r.schoolCodeStd === code);
      const cell = resultRow?.indicators.find((c) => c.financeTabId === ind);
      if (!cell) continue;

      const expected = expectedScores[i];
      const missing = cell.dataMissing || expected == null;
      if (missing) {
        if (!cell.dataMissing) {
          indexMismatch += 1;
          indIndexMismatch += 1;
        }
        continue;
      }

      if (!approxEqual(cell.indexScore, expected)) {
        indexMismatch += 1;
        indIndexMismatch += 1;
        if (indexSamples.length < 6) {
          indexSamples.push(
            `${code}/${ind}: got=${cell.indexScore} exp=${expectedScores[i]}`,
          );
        }
      }
      if (cell.rank !== expectedRanks[i]) {
        rankMismatch += 1;
        indRankMismatch += 1;
      }
    }

    if (indIndexMismatch === 0 && indRankMismatch === 0) {
      pass(
        `Step2 [${label}]`,
        `${settings.targetUniversities.length}교 · 지수·순위 일치`,
      );
    } else {
      fail(
        `Step2 [${label}]`,
        `지수 ${indIndexMismatch}건 · 순위 ${indRankMismatch}건 불일치`,
      );
    }
  }

  if (indexMismatch === 0) {
    pass(
      "Step2-A 지수 산출",
      `${ids.length}개 지표 × ${settings.targetUniversities.length}교 — §3 선형보간 지수 일치`,
    );
  } else {
    fail(
      "Step2-A 지수 산출",
      `${indexMismatch}건 불일치: ${indexSamples.join(" | ")}`,
    );
  }

  if (rankMismatch === 0) {
    pass(
      "Step2-B 지표별 순위",
      "동종(대학/전문대) 내 지수 내림차순 순위 일치",
    );
  } else {
    fail("Step2-B 지표별 순위", `${rankMismatch}건 순위 불일치`);
  }

  return { indexResults, nationalDists };
}

function rankBySchoolKind(
  uniRows: CompetitivenessSettings["targetUniversities"],
  scores: number[],
  missingFlags?: boolean[],
): number[] {
  const ranks = new Array(scores.length).fill(0);
  for (const filter of ["university", "junior-college"] as SchoolKindFilter[]) {
    const indices = uniRows
      .map((u, idx) => ({ u, idx }))
      .filter(({ u }) => matchesSchoolKindFilter(u.schoolKind, filter))
      .map(({ idx }) => idx);
    if (!indices.length) continue;
    const groupScores = indices.map((idx) =>
      missingFlags?.[idx] ? -1 : scores[idx]!,
    );
    const groupRanks = rankByIndexDesc(groupScores);
    indices.forEach((globalIdx, localIdx) => {
      ranks[globalIdx] = missingFlags?.[globalIdx]
        ? 0
        : groupRanks[localIdx]!;
    });
  }
  return ranks;
}

/** Step 3: 종합지수·순위 독립 재계산 */
function validateStep3(
  settings: CompetitivenessSettings,
  indicators: ReturnType<typeof getCompetitivenessIndicators>,
  rawResults: UniversityRawResult[],
  nationalDists: Awaited<ReturnType<typeof loadNationalDistributionsForSettings>>,
  step2Results: UniversityRunResult[],
) {
  const policy = resolveAnalysisPolicy(settings);
  const step3Ids = resolveStep3IndicatorIds(settings, indicators);
  const runResults = computeRunResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
  );

  let compositeMismatch = 0;
  let rankMismatch = 0;
  const compositeSamples: string[] = [];

  for (const row of runResults) {
    const step2Row = step2Results.find(
      (r) => r.schoolCodeStd === row.schoolCodeStd,
    );

    let composite = 0;
    let weightSum = 0;
    for (const id of step3Ids) {
      const ind = indicators.find((i) => i.financeTabId === id)!;
      const cell =
        step2Row?.indicators.find((c) => c.financeTabId === id) ??
        row.indicators.find((c) => c.financeTabId === id);
      if (!cell || cell.dataMissing) continue;
      const catW = settings.categoryWeights[ind.categoryId] ?? 0;
      const indW = settings.indicatorWeights[id] ?? 0;
      const w = (catW / 100) * (indW / 100);
      composite += cell.indexScore * w;
      weightSum += w;
    }
    const expectedComposite =
      weightSum > 0 ? Math.round((composite / weightSum) * 10) / 10 : 0;

    if (!approxEqual(row.compositeIndex, expectedComposite)) {
      compositeMismatch += 1;
      if (compositeSamples.length < 6) {
        compositeSamples.push(
          `${row.schoolName}: got=${row.compositeIndex} exp=${expectedComposite}`,
        );
      }
    }
  }

  for (const filter of ["university", "junior-college"] as SchoolKindFilter[]) {
    const group = runResults
      .filter(
        (r) =>
          matchesSchoolKindFilter(r.schoolKind, filter) &&
          !r.excludedFromRanking,
      )
      .sort((a, b) => b.compositeIndex - a.compositeIndex);

    for (let i = 0; i < group.length; i++) {
      const expectedRank = i + 1;
      const actual = group[i]!.compositeRank;
      if (actual !== expectedRank) {
        rankMismatch += 1;
      }
      if (i > 0) {
        const prev = group[i - 1]!;
        const curr = group[i]!;
        if (curr.compositeIndex > prev.compositeIndex) {
          rankMismatch += 1;
        }
      }
    }

    if (policy.absoluteIndicatorPolicy === "exclude-from-ranking") {
      for (const r of runResults.filter(
        (x) =>
          matchesSchoolKindFilter(x.schoolKind, filter) &&
          x.excludedFromRanking,
      )) {
        if (r.compositeRank !== 0) rankMismatch += 1;
      }
    }
  }

  if (compositeMismatch === 0) {
    pass(
      "Step3-A 종합지수",
      `${runResults.length}교 — 2단계 지수×가중치 가중평균 일치`,
    );
  } else {
    fail(
      "Step3-A 종합지수",
      `${compositeMismatch}건 불일치: ${compositeSamples.join(" | ")}`,
    );
  }

  if (rankMismatch === 0) {
    pass(
      "Step3-B 종합순위",
      "동종 내 종합지수 내림차순 순위·절대지표 정책 일치",
    );
  } else {
    fail("Step3-B 종합순위", `${rankMismatch}건 순위 불일치`);
  }

  return runResults;
}

/** 저장된 edition 결과와 재실행 결과 비교 */
function validateStoredResults(
  analysisYear: number,
  freshStep2: Awaited<ReturnType<typeof runStep2Analysis>>,
  freshRun: UniversityRunResult[],
  stored: Awaited<ReturnType<typeof getEditionFull>>,
) {
  if (!stored?.hasRunResults || !stored.results.runResults?.length) {
    pass("저장결과 비교", `${analysisYear}년 저장된 3단계 결과 없음 — 스킵`);
    return;
  }

  const storedRun = stored.results.runResults ?? [];
  let rawMismatch = 0;
  let indexMismatch = 0;
  let compositeMismatch = 0;

  for (const storedRow of storedRun) {
    const freshRow = freshRun.find(
      (r) => r.schoolCodeStd === storedRow.schoolCodeStd,
    );
    if (!freshRow) continue;

    if (!approxEqual(storedRow.compositeIndex, freshRow.compositeIndex, 0.11)) {
      compositeMismatch += 1;
    }
    if (storedRow.compositeRank !== freshRow.compositeRank) {
      compositeMismatch += 1;
    }

    for (const cell of storedRow.indicators) {
      const freshCell = freshRow.indicators.find(
        (c) => c.financeTabId === cell.financeTabId,
      );
      if (!freshCell) continue;
      if (!approxEqual(cell.indexScore, freshCell.indexScore, 0.11)) {
        indexMismatch += 1;
      }
    }
  }

  const storedStep1 = stored.results.step1RawResults ?? [];
  for (const storedRow of storedStep1) {
    const freshRow = freshStep2.rawResults.find(
      (r) => r.schoolCodeStd === storedRow.schoolCodeStd,
    );
    if (!freshRow) continue;
    for (const cell of storedRow.indicators) {
      if (!cell.found) continue;
      const freshCell = freshRow.indicators.find(
        (c) => c.financeTabId === cell.financeTabId,
      );
      if (!freshCell?.found) continue;
      if (!approxEqual(cell.rawValue ?? 0, freshCell.rawValue ?? 0, 0.11)) {
        rawMismatch += 1;
      }
    }
  }

  if (rawMismatch === 0 && indexMismatch === 0 && compositeMismatch === 0) {
    pass(
      "저장결과 비교",
      `${analysisYear}년 DB 저장 결과와 재실행 결과 일치`,
    );
  } else {
    fail(
      "저장결과 비교",
      `원지표 ${rawMismatch} · 지수 ${indexMismatch} · 종합 ${compositeMismatch} 불일치 (설정 변경 또는 DB 갱신 가능)`,
    );
  }
}

async function validateYear(
  targetYear: number,
  indicators: ReturnType<typeof getCompetitivenessIndicators>,
): Promise<{ year: number; failures: number; checks: CheckResult[]; skipped: boolean }> {
  resetYearChecks(`[${targetYear}] `);

  const edition = await getEditionFull(targetYear);
  if (!edition) {
    fail("Edition", `${targetYear}년 edition 없음`);
    return { year: targetYear, failures, checks: [...checks], skipped: true };
  }

  const settings = edition.settings;
  const ids = resolveStep12IndicatorIds(settings, indicators);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`=== 분석연도 ${targetYear}년 검증 ===`);
  console.log(`대상대학: ${settings.targetUniversities.length}건`);
  console.log(
    `저장된 결과: step1=${edition.hasStep1} step2=${edition.hasStep2} step3=${edition.hasRunResults}`,
  );
  console.log("지표별 적용연도:");
  for (const id of ids) {
    const label =
      STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id;
    const yearLabel =
      settings.indicatorYears[id] ??
      indicators.find((i) => i.financeTabId === id)?.defaultYearLabel ??
      "—";
    console.log(`  · ${label}: ${yearLabel}`);
  }

  await validateMainCampusRollup(targetYear, settings);
  const rawResults = await validateStep1RawValues(settings, indicators);
  if (!rawResults) {
    return { year: targetYear, failures, checks: [...checks], skipped: false };
  }

  const step2 = await validateStep2(settings, indicators, rawResults);
  const runResults = validateStep3(
    settings,
    indicators,
    rawResults,
    step2.nationalDists,
    step2.indexResults,
  );

  const freshStep2 = await runStep2Analysis(settings, indicators);
  validateStoredResults(targetYear, freshStep2, runResults, edition);

  console.log(`\n--- ${targetYear}년 요약 ---`);
  for (const c of checks) {
    console.log(`${c.passed ? "✓" : "✗"} ${c.name}: ${c.detail}`);
  }
  console.log(
    `${targetYear}년: ${checks.filter((c) => c.passed).length}/${checks.length} 통과, ${failures} 실패`,
  );

  return { year: targetYear, failures, checks: [...checks], skipped: false };
}

async function main() {
  const indicators = getCompetitivenessIndicators();
  const summaries = await listEditionSummaries();
  const years = resolveTargetYears(summaries);

  console.log(`\n대학경쟁력분석 연도별 검증: ${years.join(", ")}년`);

  const results: Awaited<ReturnType<typeof validateYear>>[] = [];
  let totalFailures = 0;

  for (const year of years) {
    const result = await validateYear(year, indicators);
    results.push(result);
    totalFailures += result.failures;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("=== 전체 연도별 결과 ===");
  console.log(
    "연도 | 결과 | 통과/전체 | 실패",
  );
  for (const r of results) {
    const passed = r.checks.filter((c) => c.passed).length;
    const total = r.checks.length;
    const status = r.failures === 0 ? "OK" : "FAIL";
    console.log(
      `${r.year} | ${status.padEnd(4)} | ${String(passed).padStart(2)}/${String(total).padStart(2)}   | ${r.failures}`,
    );
  }

  const failedYears = results.filter((r) => r.failures > 0).map((r) => r.year);
  if (failedYears.length) {
    console.log(`\n실패 연도: ${failedYears.join(", ")}`);
  } else {
    console.log(`\n✓ ${years.length}개 분석연도 전 항목 검증 통과`);
  }

  console.log(`\n총 실패 항목: ${totalFailures}`);

  if (totalFailures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
