import type {
  EnrolledRepCohort,
  EnrolledRepRow,
  EnrolledRepVerifySummary,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";

export type EnrolledRepMockQuery = {
  year?: number | null;
  cohort?: EnrolledRepCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type EnrolledRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: EnrolledRepCohort;
  section: "data" | "charts";
  cohortCounts: Record<EnrolledRepCohort, number>;
  rows: EnrolledRepRow[];
  allCohortRows: Record<EnrolledRepCohort, EnrolledRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: {
    fillRateWithin: number | null;
    fillRateWithinOutside: number | null;
  };
  chartRows: EnrolledRepRow[];
  verify: EnrolledRepVerifySummary | null;
  hasData: boolean;
};

function parseCohort(value: string | undefined): EnrolledRepCohort {
  if (
    value === "junior-college" ||
    value === "graduate" ||
    value === "combined"
  ) {
    return value;
  }
  return "university";
}

export function parseEnrolledRepMockQuery(
  searchParams: Record<string, string | undefined>,
): EnrolledRepMockQuery {
  const year = Number(searchParams.year);
  return {
    year: Number.isFinite(year) ? year : null,
    cohort: parseCohort(searchParams.cohort),
    section: searchParams.section === "charts" ? "charts" : "data",
    estb: searchParams.estb,
    region: searchParams.region,
    q: searchParams.q,
  };
}

function enrolledRepSearchParams(
  query: EnrolledRepMockQuery & { resetFilters?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.year != null) params.set("year", String(query.year));
  if (query.cohort && query.cohort !== "university") {
    params.set("cohort", query.cohort);
  }
  if (query.section === "charts") params.set("section", "charts");
  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.region) params.set("region", query.region);
    if (query.q) params.set("q", query.q);
  }
  return params;
}

export function buildEnrolledRepHref(
  query: EnrolledRepMockQuery & { resetFilters?: boolean },
): string {
  const params = enrolledRepSearchParams(query);
  params.set("tab", "enrolled-enrollment-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildEnrolledRepMockHref(
  query: EnrolledRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = enrolledRepSearchParams(query).toString();
  return `/mockups/finance-analysis/enrolled-enrollment-rate${qs ? `?${qs}` : ""}`;
}
