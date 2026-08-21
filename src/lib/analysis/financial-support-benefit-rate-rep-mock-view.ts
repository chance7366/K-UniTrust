import type {
  FinSupportRepCohort,
  FinSupportRepRow,
} from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";

export type FinSupportRepMockQuery = {
  year?: number | null;
  cohort?: FinSupportRepCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type FinSupportRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: FinSupportRepCohort;
  section: "data" | "charts";
  cohortCounts: Record<FinSupportRepCohort, number>;
  rows: FinSupportRepRow[];
  allCohortRows: Record<FinSupportRepCohort, FinSupportRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: { benefitRate: number | null };
  chartRows: FinSupportRepRow[];
  hasData: boolean;
};

function parseCohort(value: string | undefined): FinSupportRepCohort {
  return value === "junior-college" ? "junior-college" : "university";
}

export function parseFinSupportRepMockQuery(
  searchParams: Record<string, string | undefined>,
): FinSupportRepMockQuery {
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

function finSupportRepSearchParams(
  query: FinSupportRepMockQuery & { resetFilters?: boolean },
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

export function buildFinSupportRepHref(
  query: FinSupportRepMockQuery & { resetFilters?: boolean },
): string {
  const params = finSupportRepSearchParams(query);
  params.set("tab", "financial-support-benefit-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildFinSupportRepMockHref(
  query: FinSupportRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = finSupportRepSearchParams(query).toString();
  return `/mockups/finance-analysis/financial-support-benefit-rate${qs ? `?${qs}` : ""}`;
}
