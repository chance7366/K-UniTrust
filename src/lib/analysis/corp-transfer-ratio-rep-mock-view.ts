import type {
  CorpTransferRepCohort,
  CorpTransferRepRow,
} from "@/lib/analysis/corp-transfer-ratio-rep-rollup";

export type CorpTransferRepMockQuery = {
  year?: number | null;
  cohort?: CorpTransferRepCohort;
  section?: "data" | "charts";
  estb?: string;
  region?: string;
  q?: string;
};

export type CorpTransferRepMockData = {
  years: number[];
  displayYear: number | null;
  rosterYear: number | null;
  cohort: CorpTransferRepCohort;
  section: "data" | "charts";
  cohortCounts: Record<CorpTransferRepCohort, number>;
  rows: CorpTransferRepRow[];
  allCohortRows: Record<CorpTransferRepCohort, CorpTransferRepRow[]>;
  filterOptions: { estbs: string[]; regions: string[] };
  filters: { estb: string; region: string; q: string };
  totals: { transferRatio: number | null };
  chartRows: CorpTransferRepRow[];
  hasData: boolean;
};

function parseCohort(value: string | undefined): CorpTransferRepCohort {
  return value === "junior-college" ? "junior-college" : "university";
}

export function parseCorpTransferRepMockQuery(
  searchParams: Record<string, string | undefined>,
): CorpTransferRepMockQuery {
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

function corpTransferRepSearchParams(
  query: CorpTransferRepMockQuery & { resetFilters?: boolean },
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

export function buildCorpTransferRepHref(
  query: CorpTransferRepMockQuery & { resetFilters?: boolean },
): string {
  const params = corpTransferRepSearchParams(query);
  params.set("tab", "corp-transfer-ratio");
  return `/analysis/finance-analysis?${params.toString()}`;
}

export function buildCorpTransferRepMockHref(
  query: CorpTransferRepMockQuery & { resetFilters?: boolean },
): string {
  const qs = corpTransferRepSearchParams(query).toString();
  return `/mockups/finance-analysis/corp-transfer-ratio${qs ? `?${qs}` : ""}`;
}
