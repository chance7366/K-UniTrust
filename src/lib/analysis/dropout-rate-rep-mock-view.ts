import type {
  DropoutRepCohort,
  DropoutRepViewCohort,
  DropoutRepRow,
} from "@/lib/analysis/dropout-rate-rep-rollup";
import { parseStudentFillViewCohort } from "@/lib/analysis/all-universities-cohort";

export type DropoutRepMockQuery = {
  year?: number | null;
  cohort?: DropoutRepViewCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type DropoutRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: DropoutRepViewCohort;
  section: "data" | "charts";
  cohortCounts: Record<DropoutRepViewCohort, number>;
  rows: DropoutRepRow[];
  allCohortRows: Record<DropoutRepCohort, DropoutRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: {
    enrolledRate: number | null;
    freshmanRate: number | null;
  };
  chartRows: DropoutRepRow[];
  chartRowsByCohort?: Record<DropoutRepCohort, DropoutRepRow[]>;
  hasData: boolean;
};

export function parseDropoutRepMockQuery(
  searchParams: Record<string, string | undefined>,
): DropoutRepMockQuery {
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

function dropoutRepSearchParams(
  query: DropoutRepMockQuery & { resetFilters?: boolean },
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

export function buildDropoutRepHref(
  query: DropoutRepMockQuery & { resetFilters?: boolean },
): string {
  const params = dropoutRepSearchParams(query);
  params.set("tab", "dropout-rate");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildDropoutRepMockHref(
  query: DropoutRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = dropoutRepSearchParams(query).toString();
  return `/mockups/finance-analysis/dropout-rate${qs ? `?${qs}` : ""}`;
}
