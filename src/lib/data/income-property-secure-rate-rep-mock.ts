import type {
  IncomePropertyRepMockData,
  IncomePropertyRepMockQuery,
} from "@/lib/analysis/income-property-secure-rate-rep-mock-view";
import {
  buildIncomePropertyRepRows,
  parseAlimiEduFundTuitionOnlyRow,
  parseAlimiIncomePropertyRow,
  sumIncomePropertyCohortRate,
  type IncomePropertyRepCohort,
} from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistIncomePropertyRepDb } from "@/lib/data/income-property-secure-rate-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildIncomePropertyRepMockHref,
  parseIncomePropertyRepMockQuery,
  type IncomePropertyRepMockData,
  type IncomePropertyRepMockQuery,
} from "@/lib/analysis/income-property-secure-rate-rep-mock-view";

const COHORTS: IncomePropertyRepCohort[] = ["university", "junior-college"];

export async function loadIncomePropertyRepMockDashboard(
  query: IncomePropertyRepMockQuery = {},
): Promise<IncomePropertyRepMockData> {
  const [targetRaw, propertyRaw, fundRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapIncomeProperty").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const property = propertyRaw
    .map(parseAlimiIncomePropertyRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduFund = fundRaw
    .map(parseAlimiEduFundTuitionOnlyRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(property.map((r) => r.year))].sort((a, b) => b - a);
  const fundYears = new Set(eduFund.map((r) => r.year));
  const latestPairedYear =
    years.find((year) => fundYears.has(year - 1)) ?? null;
  const displayYear =
    query.year != null && years.includes(query.year)
      ? query.year
      : (latestPairedYear ?? years[0] ?? null);

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

  const empty: IncomePropertyRepMockData = {
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
    totals: { secureRate: null, revenueRate: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistIncomePropertyRepDb({
    rosterAll,
    property,
    eduFund,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildIncomePropertyRepRows({
      cohort: "university",
      displayYear,
      roster,
      property,
      eduFund,
    }),
    "junior-college": buildIncomePropertyRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      property,
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
    totals: sumIncomePropertyCohortRate(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildIncomePropertyRepRows({
        cohort,
        displayYear: year,
        roster: yearRoster,
        property,
        eduFund,
      });
    }),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as INCOME_PROPERTY_REP_MOCK_COHORTS };
