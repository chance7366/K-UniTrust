/**
 * 지표통계 합산·율 정확성 검증
 * Usage: npx tsx scripts/verify-indicator-stats.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnrolledScaleLookupJson } from "../src/lib/analysis/enrolled-students-rep-count.ts";
import {
  filterIndicatorGeoRows,
  partitionIndicatorStats,
  type IndicatorGeoSource,
} from "../src/lib/analysis/indicator-stats-geo.ts";
import {
  buildCorpTransferIndicatorStats,
  buildDropoutIndicatorStats,
  buildEnrolledIndicatorStats,
  buildFinSupportIndicatorStats,
  buildFreshmanIndicatorStats,
  buildFundSecureIndicatorStats,
  buildIncomePropertyIndicatorStats,
  buildTuitionDepIndicatorStats,
  type IndicatorStatsNumericRow,
} from "../src/lib/analysis/indicator-stats.ts";
import {
  ANALYTICS_ZONES,
  sidoShortLabel,
  zoneForSido,
} from "../src/lib/analysis/korea-analytics-zones.ts";
import { KOREA_SIDO_REGIONS } from "../src/lib/analysis/korea-sido-regions.ts";
import {
  SCALE_ORDER,
  type EnrolledScaleLookupJson,
} from "../src/lib/analysis/school-scale-trend.ts";
import { loadFreshmanRepMockDashboard } from "../src/lib/data/freshman-enrollment-rep-mock.ts";
import { loadEnrolledRepMockDashboard } from "../src/lib/data/enrolled-enrollment-rep-mock.ts";
import { loadDropoutRepMockDashboard } from "../src/lib/data/dropout-rate-rep-mock.ts";
import { loadFundSecureRepMockDashboard } from "../src/lib/data/fund-secure-rate-rep-mock.ts";
import { loadFinSupportRepMockDashboard } from "../src/lib/data/financial-support-benefit-rate-rep-mock.ts";
import { loadTuitionDepRepMockDashboard } from "../src/lib/data/tuition-dependency-rate-rep-mock.ts";
import { loadCorpTransferRepMockDashboard } from "../src/lib/data/corp-transfer-ratio-rep-mock.ts";
import { loadIncomePropertyRepMockDashboard } from "../src/lib/data/income-property-secure-rate-rep-mock.ts";
import { sumCohortRates } from "../src/lib/analysis/freshman-enrollment-rep-rollup.ts";
import { sumEnrolledCohortRates } from "../src/lib/analysis/enrolled-enrollment-rep-rollup.ts";
import { sumDropoutCohortRates } from "../src/lib/analysis/dropout-rate-rep-rollup.ts";
import { sumFundSecureCohortRate } from "../src/lib/analysis/fund-secure-rate-rep-rollup.ts";
import {
  cheonToMillion1,
  sumFinSupportCohortRate,
  wonToMillion1,
} from "../src/lib/analysis/financial-support-benefit-rate-rep-rollup.ts";
import { sumTuitionDepCohortRate } from "../src/lib/analysis/tuition-dependency-rate-rep-rollup.ts";
import { sumCorpTransferCohortRate } from "../src/lib/analysis/corp-transfer-ratio-rep-rollup.ts";
import { sumIncomePropertyCohortRate } from "../src/lib/analysis/income-property-secure-rate-rep-rollup.ts";

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));

const EMPTY_FILTER_REST = {
  estb: "",
  schoolDivision: "",
  schoolKinds: [] as string[],
};

function latestYearWithRows(
  rows: { year: number }[],
  years: number[],
): number {
  const fromRows = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  if (fromRows[0] != null) return fromRows[0];
  return Math.max(...years);
}

let failures = 0;
let checks = 0;

function pass(name: string) {
  checks += 1;
  console.log(`  OK  ${name}`);
}

function fail(name: string, detail: string) {
  checks += 1;
  failures += 1;
  console.error(`  FAIL  ${name}: ${detail}`);
}

function eq(name: string, actual: number, expected: number) {
  if (actual === expected) pass(`${name} (${actual})`);
  else fail(name, `got ${actual}, expected ${expected}`);
}

function close(
  name: string,
  actual: number | null | undefined,
  expected: number | null | undefined,
) {
  if (actual == null && expected == null) {
    pass(`${name} (null)`);
    return;
  }
  if (actual == null || expected == null) {
    fail(name, `got ${actual}, expected ${expected}`);
    return;
  }
  if (Math.abs(actual - expected) < 0.05) pass(`${name} (${actual})`);
  else fail(name, `got ${actual}, expected ${expected}`);
}

function row(rows: IndicatorStatsNumericRow[], label: string) {
  return rows.find((r) => r.label === label);
}

function checkPartitions<T extends IndicatorGeoSource>(
  prefix: string,
  viewRows: T[],
  lookup: EnrolledScaleLookupJson,
  region: IndicatorStatsNumericRow[],
  zone: IndicatorStatsNumericRow[],
  scale: IndicatorStatsNumericRow[],
) {
  const total = region.find((r) => r.label === "전체");
  if (!total) {
    fail(`${prefix} 지역 전체 행`, "missing");
    return;
  }
  eq(`${prefix} 지역 전체 학교 수`, total.schoolCount, viewRows.length);

  const sidoLabels = new Set(KOREA_SIDO_REGIONS.map((s) => s.shortLabel));
  let sidoSum = 0;
  for (const sido of KOREA_SIDO_REGIONS) {
    const expected = viewRows.filter(
      (r) => sidoShortLabel(r.region) === sido.shortLabel,
    ).length;
    const got = row(region, sido.shortLabel)?.schoolCount ?? -1;
    eq(`${prefix} 지역 ${sido.shortLabel}`, got, expected);
    sidoSum += expected;
  }
  const unmatchedSido = viewRows.filter(
    (r) => !sidoLabels.has(sidoShortLabel(r.region)),
  ).length;
  eq(`${prefix} 17시·도+미매칭=전체`, sidoSum + unmatchedSido, viewRows.length);

  let zoneSum = 0;
  for (const z of ANALYTICS_ZONES) {
    const expected = viewRows.filter((r) => zoneForSido(r.region) === z).length;
    const got = row(zone, z)?.schoolCount ?? -1;
    eq(`${prefix} 권역 ${z}`, got, expected);
    zoneSum += expected;
  }
  const unmatchedZone = viewRows.filter((r) => !zoneForSido(r.region)).length;
  eq(`${prefix} 권역합+미매칭=전체`, zoneSum + unmatchedZone, viewRows.length);

  const parts = partitionIndicatorStats(viewRows, lookup);
  for (const s of SCALE_ORDER) {
    const expected = parts.scale.find((g) => g.label === s)?.rows.length ?? 0;
    const got = row(scale, s)?.schoolCount ?? -1;
    eq(`${prefix} 규모 ${s}`, got, expected);
  }
  const namedScale =
    (row(scale, "대규모")?.schoolCount ?? 0) +
    (row(scale, "중규모")?.schoolCount ?? 0) +
    (row(scale, "소규모")?.schoolCount ?? 0);
  if (namedScale <= viewRows.length) {
    pass(`${prefix} 규모 대+중+소(${namedScale}) ≤ 전체(${viewRows.length})`);
  } else {
    fail(`${prefix} 규모 합`, `${namedScale} > ${viewRows.length}`);
  }
}

async function main() {
  const freshman = await loadFreshmanRepMockDashboard({
    cohort: "all-universities",
    section: "charts",
  });
  if (freshman.chartRows.length === 0) {
    console.error("신입생 데이터가 없습니다.");
    process.exit(1);
  }
  const year = latestYearWithRows(freshman.chartRows, freshman.years);
  const lookup = await loadEnrolledScaleLookupJson(freshman.years);
  const filtersFor = (y: number) => ({ year: y, ...EMPTY_FILTER_REST });
  const filters = filtersFor(year);

  console.log(`\n[신입생충원율] ${year}년 전체대학`);
  {
    const viewRows = filterIndicatorGeoRows(freshman.chartRows, filters);
    const by = freshman.chartRowsByCohort;
    if (!by) {
      fail("chartRowsByCohort", "missing");
    } else {
      const bundle = buildFreshmanIndicatorStats({
        viewRows,
        viewCohort: "all-universities",
        lookup,
        rowsByCohort: {
          university: filterIndicatorGeoRows(by.university, filters),
          graduate: filterIndicatorGeoRows(by.graduate, filters),
          combined: filterIndicatorGeoRows(by.combined, filters),
          "junior-college": filterIndicatorGeoRows(by["junior-college"], filters),
        },
      });
      checkPartitions("신입생", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
      const all = row(bundle.region, "전체");
      const quota = viewRows.reduce((s, r) => s + r.admissionQuota, 0);
      eq("신입생 입학정원 합", all?.values.admissionQuota ?? -1, quota);
      const rates = sumCohortRates(viewRows, "all-universities");
      close("신입생 정원내 충원율", all?.values.fillRateWithin, rates.fillRateWithin);
      close(
        "신입생 정원내외 충원율",
        all?.values.fillRateWithinOutside,
        rates.fillRateWithinOutside,
      );
      const combined = row(bundle.division ?? [], "대학통합")?.schoolCount ?? -1;
      const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
      eq("신입생 학교구분 전체=대학통합+전문대학", combined + junior, viewRows.length);
      eq(
        "신입생 학교구분 전체 학교 수",
        row(bundle.division ?? [], "전체")?.schoolCount ?? -1,
        viewRows.length,
      );
    }
  }

  {
    const data = await loadEnrolledRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[재학생충원율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const by = data.chartRowsByCohort!;
    const bundle = buildEnrolledIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
      rowsByCohort: {
        university: filterIndicatorGeoRows(by.university, filters),
        graduate: filterIndicatorGeoRows(by.graduate, filters),
        combined: filterIndicatorGeoRows(by.combined, filters),
        "junior-college": filterIndicatorGeoRows(by["junior-college"], filters),
      },
    });
    checkPartitions("재학생", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체");
    const rates = sumEnrolledCohortRates(viewRows);
    close("재학생 정원내 충원율", all?.values.fillRateWithin, rates.fillRateWithin);
    const combined = row(bundle.division ?? [], "대학통합")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("재학생 학교구분 전체=대학통합+전문대학", combined + junior, viewRows.length);
  }

  {
    const data = await loadDropoutRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[중도탈락율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const by = data.chartRowsByCohort!;
    const bundle = buildDropoutIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
      rowsByCohort: {
        university: filterIndicatorGeoRows(by.university, filters),
        graduate: filterIndicatorGeoRows(by.graduate, filters),
        combined: filterIndicatorGeoRows(by.combined, filters),
        "junior-college": filterIndicatorGeoRows(by["junior-college"], filters),
      },
    });
    checkPartitions("중도탈락", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체");
    const rates = sumDropoutCohortRates(viewRows);
    close("재적 중도탈락비율", all?.values.enrolledRate, rates.enrolledRate);
    const combined = row(bundle.division ?? [], "대학통합")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("중도탈락 학교구분 전체=대학통합+전문대학", combined + junior, viewRows.length);
  }

  {
    const fund = await loadFundSecureRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(fund.chartRows, fund.years);
    const filters = filtersFor(y);
    console.log(`\n[자금확보율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(fund.chartRows, filters);
    const bundle = buildFundSecureIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
    });
    checkPartitions("자금확보", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체")!;
    const rates = sumFundSecureCohortRate(viewRows);
    close("자금확보율", all.values.fundSecureRate, rates.fundSecureRate);
    const tuition = viewRows.reduce((s, r) => s + r.tuitionRevenue, 0);
    eq("자금확보 등록금수입(천원) 합", all.values.tuitionRevenue ?? -1, tuition);
    eq(
      "자금확보 등록금 백만원 표시",
      Math.round(tuition / 1000),
      Math.round((all.values.tuitionRevenue ?? 0) / 1000),
    );
    const univ = row(bundle.division ?? [], "대학")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("자금확보 대학+전문대학=전체", univ + junior, viewRows.length);
  }

  {
    const data = await loadFinSupportRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[재정지원수혜율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const bundle = buildFinSupportIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
    });
    checkPartitions("재정지원", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체")!;
    const rates = sumFinSupportCohortRate(viewRows);
    close("재정지원수혜율", all.values.benefitRate, rates.benefitRate);
    const central = viewRows.reduce((s, r) => s + r.centralMinistries, 0);
    eq(
      "재정지원 중앙부처 백만원",
      Math.round((all.values.centralMinistries ?? 0) / 1000),
      wonToMillion1(central) ?? -1,
    );
    const tuition = viewRows.reduce((s, r) => s + r.tuitionRevenue, 0);
    eq(
      "재정지원 등록금 백만원",
      Math.round((all.values.tuitionRevenue ?? 0) / 1000),
      cheonToMillion1(tuition) ?? -1,
    );
    const univ = row(bundle.division ?? [], "대학")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("재정지원 대학+전문대학=전체", univ + junior, viewRows.length);
  }

  {
    const data = await loadTuitionDepRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[등록금의존율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const bundle = buildTuitionDepIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
    });
    checkPartitions("등록금의존", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체")!;
    const rates = sumTuitionDepCohortRate(viewRows);
    close("등록금의존율", all.values.tuitionDependencyRate, rates.tuitionDependencyRate);
    const univ = row(bundle.division ?? [], "대학")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("등록금의존 대학+전문대학=전체", univ + junior, viewRows.length);
  }

  {
    const data = await loadCorpTransferRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[법인전입금비율] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const bundle = buildCorpTransferIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
    });
    checkPartitions("전입금", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체")!;
    const rates = sumCorpTransferCohortRate(viewRows);
    close("전입금비율", all.values.transferRatio, rates.transferRatio);
    const univ = row(bundle.division ?? [], "대학")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("전입금 대학+전문대학=전체", univ + junior, viewRows.length);
  }

  {
    const data = await loadIncomePropertyRepMockDashboard({
      cohort: "all-universities",
      section: "charts",
    });
    const y = latestYearWithRows(data.chartRows, data.years);
    const filters = filtersFor(y);
    console.log(`\n[수익용기본재산] ${y}년 전체대학`);
    const viewRows = filterIndicatorGeoRows(data.chartRows, filters);
    const bundle = buildIncomePropertyIndicatorStats({
      viewRows,
      viewCohort: "all-universities",
      lookup,
    });
    checkPartitions("수익용재산", viewRows, lookup, bundle.region, bundle.zone, bundle.scale);
    const all = row(bundle.region, "전체")!;
    const rates = sumIncomePropertyCohortRate(viewRows);
    close("확보율", all.values.secureRate, rates.secureRate);
    close("수익율", all.values.revenueRate, rates.revenueRate);
    const univ = row(bundle.division ?? [], "대학")?.schoolCount ?? -1;
    const junior = row(bundle.division ?? [], "전문대학")?.schoolCount ?? -1;
    eq("수익용재산 대학+전문대학=전체", univ + junior, viewRows.length);
  }

  console.log(`\n결과: ${checks - failures}/${checks} 통과`);
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
