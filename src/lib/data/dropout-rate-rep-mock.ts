import type {
  DropoutRepMockData,
  DropoutRepMockQuery,
} from "@/lib/analysis/dropout-rate-rep-mock-view";
import {
  buildDropoutRepRows,
  parseAlimiDropoutGradRow,
  parseAlimiDropoutUndergradRow,
  sumDropoutCohortRates,
  type DropoutRepCohort,
} from "@/lib/analysis/dropout-rate-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistDropoutRepDb } from "@/lib/data/dropout-rate-rep-db";
import { readCsvFile } from "@/lib/csv/read";

export {
  buildDropoutRepMockHref,
  parseDropoutRepMockQuery,
  type DropoutRepMockData,
  type DropoutRepMockQuery,
} from "@/lib/analysis/dropout-rate-rep-mock-view";

const COHORTS: DropoutRepCohort[] = [
  "university",
  "junior-college",
  "graduate",
  "combined",
];

export async function loadDropoutRepMockDashboard(
  query: DropoutRepMockQuery = {},
): Promise<DropoutRepMockData> {
  const [targetRaw, ugRaw, grRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapDropoutRateUndergrad").catch(() => []),
    readCsvFile("univMapDropoutRateGrad").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const undergrad = ugRaw
    .map(parseAlimiDropoutUndergradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const grad = grRaw
    .map(parseAlimiDropoutGradRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const years = [
    ...new Set([...undergrad.map((r) => r.year), ...grad.map((r) => r.year)]),
  ].sort((a, b) => b - a);
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

  const empty: DropoutRepMockData = {
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
    totals: { enrolledRate: null, freshmanRate: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistDropoutRepDb({
    rosterAll,
    undergrad,
    grad,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildDropoutRepRows({
      cohort: "university",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    "junior-college": buildDropoutRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    graduate: buildDropoutRepRows({
      cohort: "graduate",
      displayYear,
      roster,
      undergrad,
      grad,
    }),
    combined: buildDropoutRepRows({
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
    totals: sumDropoutCohortRates(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      return buildDropoutRepRows({
        cohort,
        displayYear: year,
        roster: yearRoster,
        undergrad,
        grad,
      });
    }),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as DROPOUT_REP_MOCK_COHORTS };
