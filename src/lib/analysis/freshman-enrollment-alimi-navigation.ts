import type { FreshmanEnrollmentAlimiQuery } from "@/lib/analysis/freshman-enrollment-alimi/types";
import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";

import {
  parseMultiFilterParam,
  serializeMultiFilterParam,
} from "@/lib/analysis/table-filter-utils";

export function buildFreshmanEnrollmentAlimiHref(
  query: FreshmanEnrollmentAlimiQuery & {
    resetFilters?: boolean;
    dataset?: FreshmanEnrollmentDatasetKind;
  },
): string {
  const params = new URLSearchParams();
  params.set("tab", "freshman-enrollment");

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
