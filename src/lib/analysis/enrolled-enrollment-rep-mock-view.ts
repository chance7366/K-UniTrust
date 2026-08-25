import type {
  EnrolledRepCohort,
  EnrolledRepViewCohort,
  EnrolledRepRow,
  EnrolledRepVerifySummary,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import { parseStudentFillViewCohort } from "@/lib/analysis/all-universities-cohort";

export type EnrolledRepMockQuery = {
  year?: number | null;
  cohort?: EnrolledRepViewCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type EnrolledRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: EnrolledRepViewCohort;
  section: "data" | "charts";
  cohortCounts: Record<EnrolledRepViewCohort, number>;
  rows: EnrolledRepRow[];
  allCohortRows: Record<EnrolledRepCohort, EnrolledRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: {
    fillRateWithin: number | null;
    fillRateWithinOutside: number | null;
  };
  chartRows: EnrolledRepRow[];
  chartRowsByCohort?: Record<EnrolledRepCohort, EnrolledRepRow[]>;
  verify: EnrolledRepVerifySummary | null;
  hasData: boolean;
};

export function parseEnrolledRepMockQuery(
  searchParams: Record<string, string | undefined>,
): EnrolledRepMockQuery {
  const year = Number(searchParams.year);
  return {
    year: Number.isFinite(year) ? year : null,
    cohort: parseStudentFillViewCohort(searchParams.cohort),
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
