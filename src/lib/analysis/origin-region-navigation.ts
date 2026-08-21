import type { OriginRegionQuery } from "@/lib/data/origin-region";
import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";

export function buildOriginRegionHref(
  query: OriginRegionQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "origin-school");

  if (query.year != null) {
    params.set("year", String(query.year));
  }

  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.schoolDivision) {
      params.set("schoolDivision", query.schoolDivision);
    }
    const schoolKinds = serializeMultiFilterParam(
      parseMultiFilterParam(query.schoolKind),
    );
    if (schoolKinds) params.set("schoolKind", schoolKinds);
    const regions = serializeMultiFilterParam(
      parseMultiFilterParam(query.region),
    );
    if (regions) params.set("region", regions);
    if (query.search?.trim()) params.set("search", query.search.trim());
  }

  return `/analysis/univ-map?${params.toString()}`;
}
