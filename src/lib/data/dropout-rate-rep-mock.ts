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
  emptyStudentFillViewCounts,
  sourceRowsForStudentFillView,
  studentFillViewCounts,
  emptyStudentFillCohortRows,
} from "@/lib/analysis/all-universities-cohort";
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
    cohortCounts: emptyStudentFillViewCounts(),
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
    chartRowsByCohort: emptyStudentFillCohortRows(),
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

  const source = sourceRowsForStudentFillView(allCohortRows, cohort);
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
    cohortCounts: studentFillViewCounts(allCohortRows),
    rows,
    allCohortRows,
    filterOptions: { estbs, regions },
    filters: { estb: estbFilter, region: regionFilter, q },
    totals: sumDropoutCohortRates(rows),
    ...(() => {
      const chartRowsByCohort = emptyStudentFillCohortRows<
        ReturnType<typeof buildDropoutRepRows>[number]
      >();
      const build = (
        c: DropoutRepCohort,
        year: number,
        yearRoster: typeof roster,
      ) =>
        buildDropoutRepRows({
          cohort: c,
          displayYear: year,
          roster: yearRoster,
          undergrad,
          grad,
        });
      if (cohort === "all-universities") {
        for (const year of years) {
          const yearRosterYear = pickNearestYear(rosterYears, year);
          const yearRoster =
            yearRosterYear != null
              ? rosterAll.filter((row) => row.year === yearRosterYear)
              : [];
          const cohorts: DropoutRepCohort[] = [
            "university",
            "junior-college",
            "graduate",
            "combined",
          ];
          for (const c of cohorts) {
            chartRowsByCohort[c].push(...build(c, year, yearRoster));
          }
        }
        return {
          chartRows: [
            ...chartRowsByCohort.combined,
            ...chartRowsByCohort["junior-college"],
          ],
          chartRowsByCohort,
        };
      }
      return {
        chartRows: years.flatMap((year) => {
          const yearRosterYear = pickNearestYear(rosterYears, year);
          const yearRoster =
            yearRosterYear != null
              ? rosterAll.filter((row) => row.year === yearRosterYear)
              : [];
          return build(cohort, year, yearRoster);
        }),
      };
    })(),
    hasData: true,
  };
}

export function parseYearParam(value: string | undefined): number | null {
  return value ? parseYearText(value) : null;
}

export { COHORTS as DROPOUT_REP_MOCK_COHORTS };
