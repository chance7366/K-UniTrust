import type {
  FundSecureRepMockData,
  FundSecureRepMockQuery,
} from "@/lib/analysis/fund-secure-rate-rep-mock-view";
import {
  buildFundSecureRepRows,
  parseAlimiEduBalanceRow,
  parseAlimiEduFundRow,
  parseAlimiIndustryBalanceRow,
  sumFundSecureCohortRate,
  type FundSecureRepCohort,
} from "@/lib/analysis/fund-secure-rate-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistFundSecureRepDb } from "@/lib/data/fund-secure-rate-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildFundSecureRepMockHref,
  parseFundSecureRepMockQuery,
  type FundSecureRepMockData,
  type FundSecureRepMockQuery,
} from "@/lib/analysis/fund-secure-rate-rep-mock-view";

const COHORTS: FundSecureRepCohort[] = ["university", "junior-college"];

export async function loadFundSecureRepMockDashboard(
  query: FundSecureRepMockQuery = {},
): Promise<FundSecureRepMockData> {
  const [targetRaw, balRaw, fundRaw, indRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapEduBalance").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
    readCsvFile("univMapIndustryBalance").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduBalance = balRaw
    .map(parseAlimiEduBalanceRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduFund = fundRaw
    .map(parseAlimiEduFundRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const industryBalance = indRaw
    .map(parseAlimiIndustryBalanceRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(eduBalance.map((r) => r.year))].sort((a, b) => b - a);
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

  const empty: FundSecureRepMockData = {
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
    totals: { fundSecureRate: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistFundSecureRepDb({
    rosterAll,
    eduBalance,
    industryBalance,
    eduFund,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildFundSecureRepRows({
      cohort: "university",
      displayYear,
      roster,
      eduBalance,
      industryBalance,
      eduFund,
    }),
    "junior-college": buildFundSecureRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      eduBalance,
      industryBalance,
      eduFund,
    }),
  };

  const source = allCohortRows[cohort];
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
    totals: sumFundSecureCohortRate(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildFundSecureRepRows({
        cohort,
        displayYear: year,
        roster: yearRoster,
        eduBalance,
        industryBalance,
        eduFund,
      });
    }),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as FUND_SECURE_REP_MOCK_COHORTS };
