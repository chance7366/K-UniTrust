import type {
  FinSupportRepMockData,
  FinSupportRepMockQuery,
} from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";
import {
  buildFinSupportRepRows,
  parseAlimiEduFundTuitionOnlyRow,
  parseAlimiFinancialSupportRow,
  sumFinSupportCohortRate,
  type FinSupportRepCohort,
} from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistFinSupportRepDb } from "@/lib/data/financial-support-benefit-rate-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildFinSupportRepMockHref,
  parseFinSupportRepMockQuery,
  type FinSupportRepMockData,
  type FinSupportRepMockQuery,
} from "@/lib/analysis/financial-support-benefit-rate-rep-mock-view";

const COHORTS: FinSupportRepCohort[] = ["university", "junior-college"];

export async function loadFinSupportRepMockDashboard(
  query: FinSupportRepMockQuery = {},
): Promise<FinSupportRepMockData> {
  const [targetRaw, supportRaw, fundRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapFinancialSupport").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const support = supportRaw
    .map(parseAlimiFinancialSupportRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduFund = fundRaw
    .map(parseAlimiEduFundTuitionOnlyRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(support.map((r) => r.year))].sort((a, b) => b - a);
  const fundYears = new Set(eduFund.map((r) => r.year));
  const latestCommonYear = years.find((year) => fundYears.has(year)) ?? null;
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (latestCommonYear ?? years[0] ?? null);

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

  const empty: FinSupportRepMockData = {
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
    totals: { benefitRate: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistFinSupportRepDb({
    rosterAll,
    support,
    eduFund,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildFinSupportRepRows({
      cohort: "university",
      displayYear,
      roster,
      support,
      eduFund,
    }),
    "junior-college": buildFinSupportRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      support,
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
    totals: sumFinSupportCohortRate(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildFinSupportRepRows({
        cohort,
        displayYear: year,
        roster: yearRoster,
        support,
        eduFund,
      });
    }),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as FIN_SUPPORT_REP_MOCK_COHORTS };
