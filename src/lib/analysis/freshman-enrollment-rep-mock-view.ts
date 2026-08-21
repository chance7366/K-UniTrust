import type {
  FreshmanRepCohort,
  FreshmanRepRow,
  FreshmanRepVerifySummary,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type FreshmanRepMockQuery = {
  year?: number | null;
  cohort?: FreshmanRepCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type FreshmanRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: FreshmanRepCohort;
  section: "data" | "charts";
  cohortCounts: Record<FreshmanRepCohort, number>;
  rows: FreshmanRepRow[];
  allCohortRows: Record<FreshmanRepCohort, FreshmanRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: {
    fillRateWithin: number | null;
    fillRateWithinOutside: number | null;
  };
  chartRows: FreshmanRepRow[];
  verify: FreshmanRepVerifySummary | null;
  hasData: boolean;
};

function parseCohort(value: string | undefined): FreshmanRepCohort {
  if (
    value === "junior-college" ||
    value === "graduate" ||
    value === "combined"
  ) {
    return value;
  }
  return "university";
}

export function parseFreshmanRepMockQuery(
  searchParams: Record<string, string | undefined>,
): FreshmanRepMockQuery {
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

function freshmanRepSearchParams(
  query: FreshmanRepMockQuery & { resetFilters?: boolean },
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

export function buildFreshmanRepHref(
  query: FreshmanRepMockQuery & { resetFilters?: boolean },
): string {
  const params = freshmanRepSearchParams(query);
  params.set("tab", "freshman-enrollment-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildFreshmanRepMockHref(
  query: FreshmanRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = freshmanRepSearchParams(query).toString();
  return `/mockups/finance-analysis/freshman-enrollment-rate${qs ? `?${qs}` : ""}`;
}
