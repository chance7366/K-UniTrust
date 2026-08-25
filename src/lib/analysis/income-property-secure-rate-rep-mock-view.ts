import type {
  IncomePropertyRepCohort,
  IncomePropertyRepRow,
} from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import type { TwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";
import { parseTwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";

export type IncomePropertyRepMockQuery = {
  year?: number | null;
  cohort?: TwoSchoolViewCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type IncomePropertyRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: TwoSchoolViewCohort;
  section: "data" | "charts";
  cohortCounts: Record<IncomePropertyRepCohort, number>;
  rows: IncomePropertyRepRow[];
  allCohortRows: Record<IncomePropertyRepCohort, IncomePropertyRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: { secureRate: number | null; revenueRate: number | null };
  chartRows: IncomePropertyRepRow[];
  hasData: boolean;
};

function parseCohort(value: string | undefined): TwoSchoolViewCohort {
  return parseTwoSchoolViewCohort(value);
}

export function parseIncomePropertyRepMockQuery(
  searchParams: Record<string, string | undefined>,
): IncomePropertyRepMockQuery {
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

function incomePropertyRepSearchParams(
  query: IncomePropertyRepMockQuery & { resetFilters?: boolean },
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

export function buildIncomePropertyRepHref(
  query: IncomePropertyRepMockQuery & { resetFilters?: boolean },
): string {
  const params = incomePropertyRepSearchParams(query);
  params.set("tab", "income-property-secure-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildIncomePropertyRepMockHref(
  query: IncomePropertyRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = incomePropertyRepSearchParams(query).toString();
  return `/mockups/finance-analysis/income-property-secure-rate${qs ? `?${qs}` : ""}`;
}
