import type {
  TuitionDepRepCohort,
  TuitionDepRepRow,
} from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import type { TwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";
import { parseTwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";

export type TuitionDepRepMockQuery = {
  year?: number | null;
  cohort?: TwoSchoolViewCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type TuitionDepRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: TwoSchoolViewCohort;
  section: "data" | "charts";
  cohortCounts: Record<TuitionDepRepCohort, number>;
  rows: TuitionDepRepRow[];
  allCohortRows: Record<TuitionDepRepCohort, TuitionDepRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: { tuitionDependencyRate: number | null };
  chartRows: TuitionDepRepRow[];
  hasData: boolean;
};

function parseCohort(value: string | undefined): TwoSchoolViewCohort {
  return parseTwoSchoolViewCohort(value);
}

export function parseTuitionDepRepMockQuery(
  searchParams: Record<string, string | undefined>,
): TuitionDepRepMockQuery {
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

function tuitionDepRepSearchParams(
  query: TuitionDepRepMockQuery & { resetFilters?: boolean },
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

export function buildTuitionDepRepHref(
  query: TuitionDepRepMockQuery & { resetFilters?: boolean },
): string {
  const params = tuitionDepRepSearchParams(query);
  params.set("tab", "tuition-dependency-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildTuitionDepRepMockHref(
  query: TuitionDepRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = tuitionDepRepSearchParams(query).toString();
  return `/mockups/finance-analysis/tuition-dependency-rate${qs ? `?${qs}` : ""}`;
}
