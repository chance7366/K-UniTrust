import type {
  CorpTransferRepMockData,
  CorpTransferRepMockQuery,
} from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";
import {
  buildCorpTransferRepRows,
  parseAlimiEduFundTransferRow,
  sumCorpTransferCohortRate,
  type CorpTransferRepCohort,
} from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import {
  parseAnalysisTargetCampus,
  parseYearText,
  pickNearestYear,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { persistCorpTransferRepDb } from "@/lib/data/corp-transfer-ratio-rep-db";
import { readCsvFile } from "@/lib/csv/read";
import { sourceRowsForTwoSchoolView } from "@/lib/analysis/all-universities-cohort";

export {
  buildCorpTransferRepMockHref,
  parseCorpTransferRepMockQuery,
  type CorpTransferRepMockData,
  type CorpTransferRepMockQuery,
} from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";

const COHORTS: CorpTransferRepCohort[] = ["university", "junior-college"];

export async function loadCorpTransferRepMockDashboard(
  query: CorpTransferRepMockQuery = {},
): Promise<CorpTransferRepMockData> {
  const [targetRaw, fundRaw] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
  ]);

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const eduFund = fundRaw
    .map(parseAlimiEduFundTransferRow)
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

  const empty: CorpTransferRepMockData = {
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
    totals: { transferRatio: null },
    chartRows: [],
    hasData: years.length > 0 && roster.length > 0,
  };

  if (displayYear == null || !roster.length) {
    return empty;
  }

  await persistCorpTransferRepDb({
    rosterAll,
    eduFund,
    years,
  }).catch(() => undefined);

  const allCohortRows = {
    university: buildCorpTransferRepRows({
      cohort: "university",
      displayYear,
      roster,
      eduFund,
    }),
    "junior-college": buildCorpTransferRepRows({
      cohort: "junior-college",
      displayYear,
      roster,
      eduFund,
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
    totals: sumCorpTransferCohortRate(rows),
    chartRows: years.flatMap((year) => {
      const yearRosterYear = pickNearestYear(rosterYears, year);
      const yearRoster =
        yearRosterYear != null
          ? rosterAll.filter((row) => row.year === yearRosterYear)
          : [];
      const build = (c: CorpTransferRepCohort) =>
        buildCorpTransferRepRows({
          cohort: c,
          displayYear: year,
          roster: yearRoster,
          eduFund,
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

export { COHORTS as CORP_TRANSFER_REP_MOCK_COHORTS };
