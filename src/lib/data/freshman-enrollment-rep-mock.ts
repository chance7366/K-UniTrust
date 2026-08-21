import type {
  FreshmanRepMockData,
  FreshmanRepMockQuery,
} from "@/lib/analysis/freshman-enrollment-rep-mock-view";
import {
  buildFreshmanRepRows,
  parseAlimiGradRow,
  parseAlimiUndergradRow,
  parseAnalysisTargetCampus,
  parseConsolidatedCompareRow,
  parseYearText,
  pickNearestYear,
  sumCohortRates,
  verifyAgainstConsolidated,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistFreshmanRepDb } from "@/lib/data/freshman-enrollment-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildFreshmanRepMockHref,
  parseFreshmanRepMockQuery,
  type FreshmanRepMockData,
  type FreshmanRepMockQuery,
} from "@/lib/analysis/freshman-enrollment-rep-mock-view";

export async function loadFreshmanRepMockDashboard(
  query: FreshmanRepMockQuery = {},
): Promise<FreshmanRepMockData> {
  const [targetRaw, ugRaw, grRaw, consRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("financeAnalysisFreshmanEnrollmentUndergrad").catch(() => []),
    readCsvFile("financeAnalysisFreshmanEnrollmentGrad").catch(() => []),
    readCsvFile("financeAnalysisFreshmanEnrollmentConsolidated").catch(
      () => [],
    ),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const undergrad = ugRaw
    .map(parseAlimiUndergradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const grad = grRaw
    .map(parseAlimiGradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const consolidated = consRaw
    .map(parseConsolidatedCompareRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const alimiYears = [...new Set(undergrad.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  const consYears = [...new Set(consolidated.map((r) => r.year))];
  const commonYears = alimiYears.filter((y) => consYears.includes(y));
  const years = commonYears.length ? commonYears : alimiYears;
  const displayYear =
    query.year != null && alimiYears.includes(query.year)
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

  const empty: FreshmanRepMockData = {
    years,
    displayYear,
    rosterYear,
    cohort,
    section,
    cohortCounts: {
      university: 0,
      "junior-college": 0,
      graduate: 0,
      combined: 0,
    },
    rows: [],
    allCohortRows: {
      university: [],
      "junior-college": [],
      graduate: [],
      combined: [],
    },
    filterOptions: { estbs: [], regions: [] },
    filters: { estb: estbFilter, region: regionFilter, q },
    totals: { fillRateWithin: null, fillRateWithinOutside: null },
    chartRows: [],
    verify: null,
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) return empty;

  await persistFreshmanRepDb({
    rosterAll,
    undergrad,
    grad,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildFreshmanRepRows({
      cohort: "university",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    "junior-college": buildFreshmanRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    graduate: buildFreshmanRepRows({
      cohort: "graduate",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    combined: buildFreshmanRepRows({
      cohort: "combined",
      displayYear,
      roster,
      undergrad,
      grad,
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

  const consForYear = consolidated.filter((row) => row.year === displayYear);
  const verify =
    cohort === "university" || cohort === "junior-college"
      ? verifyAgainstConsolidated(source, consForYear, cohort)
      : null;

  return {
    years,
    displayYear,
    rosterYear,
    cohort,
    section,
    cohortCounts: {
      university: allCohortRows.university.length,
      "junior-college": allCohortRows["junior-college"].length,
      graduate: allCohortRows.graduate.length,
      combined: allCohortRows.combined.length,
    },
    rows,
    allCohortRows,
    filterOptions: { estbs, regions },
    filters: { estb: estbFilter, region: regionFilter, q },
    totals: sumCohortRates(rows, cohort),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildFreshmanRepRows({
        cohort,
        displayYear: year,
        roster: yearRoster,
        undergrad,
        grad,
      });
    }),
    verify,
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}
