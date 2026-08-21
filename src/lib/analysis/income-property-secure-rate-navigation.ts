import type { IncomePropertySecureRateQuery } from "@/lib/data/income-property-secure-rate";
import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";

export function buildIncomePropertySecureRateHref(
  query: IncomePropertySecureRateQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "income-property-secure-rate");

  if (query.year != null) {
    params.set("year", String(query.year));
  }
  if (query.section === "charts") {
    params.set("section", "charts");
  }
  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.schoolDivision) params.set("schoolDivision", query.schoolDivision);
    const schoolKinds = serializeMultiFilterParam(
      parseMultiFilterParam(query.schoolKind),
    );
    if (schoolKinds) params.set("schoolKind", schoolKinds);
    const regions = serializeMultiFilterParam(
      parseMultiFilterParam(query.region),
    );
    if (regions) params.set("region", regions);
    if (query.search) params.set("search", query.search);
  }

  return `/analysis/finance-analysis?${params.toString()}`;
}
