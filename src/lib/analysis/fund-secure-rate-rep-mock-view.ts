import type {
  FundSecureRepCohort,
  FundSecureRepRow,
} from "@/lib/analysis/fund-secure-rate-rep-rollup";
import type { TwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";
import { parseTwoSchoolViewCohort } from "@/lib/analysis/all-universities-cohort";

export type FundSecureRepMockQuery = {
  year?: number | null;
  cohort?: TwoSchoolViewCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type FundSecureRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: TwoSchoolViewCohort;
  section: "data" | "charts";
  cohortCounts: Record<FundSecureRepCohort, number>;
  rows: FundSecureRepRow[];
  allCohortRows: Record<FundSecureRepCohort, FundSecureRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: { fundSecureRate: number | null };
  chartRows: FundSecureRepRow[];
  hasData: boolean;
};

function parseCohort(value: string | undefined): TwoSchoolViewCohort {
  return parseTwoSchoolViewCohort(value);
}

export function parseFundSecureRepMockQuery(
  searchParams: Record<string, string | undefined>,
): FundSecureRepMockQuery {
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

function fundSecureRepSearchParams(
  query: FundSecureRepMockQuery & { resetFilters?: boolean },
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

export function buildFundSecureRepHref(
  query: FundSecureRepMockQuery & { resetFilters?: boolean },
): string {
  const params = fundSecureRepSearchParams(query);
  params.set("tab", "fund-secure-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildFundSecureRepMockHref(
  query: FundSecureRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = fundSecureRepSearchParams(query).toString();
  return `/mockups/finance-analysis/fund-secure-rate${qs ? `?${qs}` : ""}`;
}
