import type { SchoolCodeQuery } from "@/lib/data/school-code";

export function buildSchoolCodeHref(
  query: SchoolCodeQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "school-code");

  if (query.year != null) {
    params.set("year", String(query.year));
  }

  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (query.schoolDivision) params.set("schoolDivision", query.schoolDivision);
    if (query.schoolKind) params.set("schoolKind", query.schoolKind);
    if (query.region) params.set("region", query.region);
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
  }

  return `/analysis/univ-map?${params.toString()}`;
}
