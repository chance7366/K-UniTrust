import type {
  EnrolledRepMockData,
  EnrolledRepMockQuery,
} from "@/lib/analysis/enrolled-enrollment-rep-mock-view";
import {
  buildEnrolledRepRows,
  parseAlimiEnrolledGradRow,
  parseAlimiEnrolledUndergradRow,
  parseEnrolledConsolidatedCompareRow,
  sumEnrolledCohortRates,
  verifyEnrolledAgainstConsolidated,
  type EnrolledRepCohort,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistEnrolledRepDb } from "@/lib/data/enrolled-enrollment-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildEnrolledRepMockHref,
  parseEnrolledRepMockQuery,
  type EnrolledRepMockData,
  type EnrolledRepMockQuery,
} from "@/lib/analysis/enrolled-enrollment-rep-mock-view";

const COHORTS: EnrolledRepCohort[] = [
  "university",
  "junior-college",
  "graduate",
  "combined",
];

export async function loadEnrolledRepMockDashboard(
  query: EnrolledRepMockQuery = {},
): Promise<EnrolledRepMockData> {
  const [targetRaw, ugRaw, grRaw, consRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapEnrolledEnrollmentUndergrad").catch(() => []),
    readCsvFile("univMapEnrolledEnrollmentGrad").catch(() => []),
    readCsvFile("financeAnalysisEnrolledEnrollmentConsolidated").catch(
      () => [],
    ),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const undergrad = ugRaw
    .map(parseAlimiEnrolledUndergradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const grad = grRaw
    .map(parseAlimiEnrolledGradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const consolidated = consRaw
    .map(parseEnrolledConsolidatedCompareRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [...new Set(undergrad.map((r) => r.year))].sort((a, b) => b - a);
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

  const empty: EnrolledRepMockData = {
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

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistEnrolledRepDb({
    rosterAll,
    undergrad,
    grad,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildEnrolledRepRows({
      cohort: "university",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    "junior-college": buildEnrolledRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    graduate: buildEnrolledRepRows({
      cohort: "graduate",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    combined: buildEnrolledRepRows({
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
      ? verifyEnrolledAgainstConsolidated(source, consForYear, cohort)
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
    totals: sumEnrolledCohortRates(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildEnrolledRepRows({
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

export { COHORTS as ENROLLED_REP_MOCK_COHORTS };
