import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";
import { UNIV_ALIMI_SCREENS } from "@/lib/analysis/univ-alimi-raw/screens";
import type {
  UnivAlimiIndicatorId,
  UnivAlimiRawQuery,
} from "@/lib/analysis/univ-alimi-raw/types";

export function buildUnivAlimiRawHref(
  indicator: UnivAlimiIndicatorId,
  query: UnivAlimiRawQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", UNIV_ALIMI_SCREENS[indicator].tabId);

  if (query.dataset) {
    params.set("dataset", query.dataset);
  }
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
    if (query.search) params.set("search", query.search);
  }

  return `/analysis/univ-map?${params.toString()}`;
}
