import type {
  TuitionDepRepMockData,
  TuitionDepRepMockQuery,
} from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";
import {
  buildTuitionDepRepRows,
  parseAlimiEduFundTuitionRow,
  parseAlimiIndustryCashRow,
  sumTuitionDepCohortRate,
  type TuitionDepRepCohort,
} from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistTuitionDepRepDb } from "@/lib/data/tuition-dependency-rate-rep-db";
import { loadFinanceAlimiHeaders } from "@/lib/analysis/finance-alimi-headers-server";
import { readCsvFile } from "@/lib/csv/read";
import { sourceRowsForTwoSchoolView } from "@/lib/analysis/all-universities-cohort";

export {
  buildTuitionDepRepMockHref,
  parseTuitionDepRepMockQuery,
  type TuitionDepRepMockData,
  type TuitionDepRepMockQuery,
} from "@/lib/analysis/tuition-dependency-rate-rep-mock-view";

const COHORTS: TuitionDepRepCohort[] = ["university", "junior-college"];

export async function loadTuitionDepRepMockDashboard(
  query: TuitionDepRepMockQuery = {},
): Promise<TuitionDepRepMockData> {
  const [targetRaw, fundRaw, cashRaw, fundHeaders, cashHeaders] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
    readCsvFile("univMapIndustryCash").catch(() => []),
    loadFinanceAlimiHeaders("edu-fund"),
    loadFinanceAlimiHeaders("industry-cash"),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduFund = fundRaw
    .map((row) => parseAlimiEduFundTuitionRow(row, fundHeaders))
    .filter((row): row is NonNullable<typeof row> => row != null);
  const industryCash = cashRaw
    .map((row) => parseAlimiIndustryCashRow(row, cashHeaders))
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(eduFund.map((r) => r.year))].sort((a, b) => b - a);
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (years[0] ?? null);

  const rosterYears = [...new Set(rosterAll.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  const rosterYear =
    displayYear != null ? pickNearestYear(rosterYears, displayYear) : null;
  const roster =
    rosterYear != null
      ? rosterAll.filter((row) => row.year === rosterYear)
      : [];

  const cohort = query.cohort ?? "university";
  const section = query.section === "charts" ? "charts" : "data";
  const estbFilter = query.estb?.trim() ?? "";
  const regionFilter = query.region?.trim() ?? "";
  const q = query.q?.trim().toLowerCase() ?? "";

  const empty: TuitionDepRepMockData = {
    years,
    displayYear,
    rosterYear,
    cohort,
    section,
    cohortCounts: { university: 0, "junior-college": 0 },
    rows: [],
    allCohortRows: { university: [], "junior-college": [] },
    filterOptions: { estbs: [], regions: [] },
    filters: { estb: estbFilter, region: regionFilter, q },
    totals: { tuitionDependencyRate: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistTuitionDepRepDb({
    rosterAll,
    eduFund,
    industryCash,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildTuitionDepRepRows({
      cohort: "university",
      displayYear,
      roster,
      eduFund,
      industryCash,
    }),
    "junior-college": buildTuitionDepRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      eduFund,
      industryCash,
    }),
  };

  const source = sourceRowsForTwoSchoolView(allCohortRows, cohort);
  const estbs = [...new Set(source.map((r) => r.estb).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ko"),
  );
  const regions = [...new Set(source.map((r) => r.region).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ko"),
  );

  const rows = source.filter((row) => {
    if (estbFilter && row.estb !== estbFilter) return false;
    if (regionFilter && row.region !== regionFilter) return false;
    if (q) {
      const hay = `${row.schoolRepName} ${row.schoolRepCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return {
    years,
    displayYear,
    rosterYear,
    cohort,
    section,
    cohortCounts: {
      university: allCohortRows.university.length,
      "junior-college": allCohortRows["junior-college"].length,
    },
    rows,
    allCohortRows,
    filterOptions: { estbs, regions },
    filters: { estb: estbFilter, region: regionFilter, q },
    totals: sumTuitionDepCohortRate(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      const build = (c: TuitionDepRepCohort) =>
        buildTuitionDepRepRows({
          cohort: c,
          displayYear: year,
          roster: yearRoster,
          eduFund,
          industryCash,
        });
      if (cohort === "all-universities") {
        return [...build("university"), ...build("junior-college")];
      }
      return build(cohort);
    }),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as TUITION_DEP_REP_MOCK_COHORTS };
